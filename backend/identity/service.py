"""Shared identity domain. All writes run in a caller-owned DB transaction.

The production adapter must use the existing users and session issuer. Never
create a parallel user store or grant product access from onboarding input.
"""
import hashlib
import secrets
import time
from urllib.parse import urlsplit
from typing import Protocol

PRODUCT_PATHS = {
    'home': '/app.html', 'legal': '/app.html', 'quant': '/app.html?product=quant',
    'aeroclub': '/app.html?product=aeroclub',
    'portadas': '/portada.html', 'labs': '/avia-labs.html',
    'academy': '/app.html?product=academy', 'flota': '/app.html?product=flota',
}
TERMS_VERSION = '2026-09-25'

class IdentityError(Exception):
    def __init__(self, code, status=400):
        self.code, self.status = code, status
        super().__init__(code)

def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()

def referral_code(value):
    value = (value or '').strip().upper()
    if value and (len(value) != 12 or any(c not in 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' for c in value)):
        raise IdentityError('INVALID_REFERRAL')
    return value

def safe_destination(product, next_path=None):
    fallback = destination(product)
    if not next_path:
        return fallback
    if len(next_path)>2000 or any(ord(c)<=32 for c in next_path) or '\\' in next_path:
        raise IdentityError('INVALID_DESTINATION')
    parts = urlsplit(next_path)
    if parts.scheme or parts.netloc or parts.fragment or parts.path not in {'/app.html','/portada.html','/avia-labs.html'}:
        raise IdentityError('INVALID_DESTINATION')
    return parts.path + ('?'+parts.query if parts.query else '')

def destination(product):
    if product not in PRODUCT_PATHS:
        raise IdentityError('INVALID_PRODUCT')
    return PRODUCT_PATHS[product]

class Users(Protocol):
    async def find_by_email(self, db, email): ...
    async def create_google_user(self, db, *, email, name): ...
    async def assert_active(self, db, user_id): ...
    async def issue_session(self, db, user_id): ...

class IdentityService:
    def __init__(self, store, users: Users, clock=time.time):
        self.store, self.users, self.clock = store, users, clock

    async def start(self, db, browser, product='home', referral='', link_user=None, next_path=None):
        target = safe_destination(product,next_path)
        ref = referral_code(referral)
        if ref and not await self.store.referrer(db, ref):
            raise IdentityError('INVALID_REFERRAL')
        state, nonce, verifier = [secrets.token_urlsafe(32) for _ in range(3)]
        await self.store.put_flow(db, digest(state), dict(
            browser=digest(browser), nonce=nonce, verifier=verifier,
            expires=int(self.clock())+600, product=product, referral=ref,
            link_user=link_user, destination=target,
        ))
        return state, nonce, verifier

    async def finish(self, db, state, browser, claims, config):
        flow = await self.store.take_flow(db, digest(state), digest(browser), int(self.clock()))
        if not flow:
            raise IdentityError('INVALID_OR_EXPIRED_FLOW')
        # Token signature, expiry, audience and issuer are verified by Google library first.
        if (claims.get('nonce') != flow['nonce'] or claims.get('email_verified') is not True
                or not claims.get('sub') or not claims.get('email')):
            raise IdentityError('INVALID_GOOGLE_IDENTITY', 401)
        user_id = await self.store.google_user(db, claims['sub'])
        if flow['link_user']:
            await self.users.assert_active(db, flow['link_user'])
            if user_id and user_id != flow['link_user']:
                raise IdentityError('GOOGLE_ACCOUNT_ALREADY_LINKED', 409)
            user_id = flow['link_user']
        elif not user_id:
            # Email is not an identity key. Existing accounts require explicit linking.
            if await self.users.find_by_email(db, claims['email']):
                raise IdentityError('SIGN_IN_WITH_PASSWORD_TO_LINK_GOOGLE', 409)
            user_id = await self.users.create_google_user(db, email=claims['email'], name=claims.get('name', ''))
        await self.users.assert_active(db, user_id)
        await self.store.link_google(db, claims['sub'], user_id)
        profile = await self.ensure_profile(db, user_id)
        if not profile['completed']:
            await self.attribute(db, user_id, flow['referral'])
        ticket = secrets.token_urlsafe(32)
        await self.store.put_ticket(db, digest(ticket), dict(
            user_id=user_id, browser=digest(browser), expires=int(self.clock())+60, product=flow['product'], destination=flow['destination']))
        return ticket

    async def redeem(self, db, ticket, browser):
        data = await self.store.take_ticket(db, digest(ticket), digest(browser), int(self.clock()))
        if not data:
            raise IdentityError('INVALID_OR_EXPIRED_TICKET', 401)
        await self.users.assert_active(db, data['user_id'])
        session = await self.users.issue_session(db, data['user_id'])
        profile = await self.ensure_profile(db, data['user_id'])
        return {**session, 'onboarding': profile, 'product': data['product'],
                'destination': data['destination']}

    async def ensure_profile(self, db, user_id):
        alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
        await self.users.assert_active(db, user_id)
        profile = await self.store.profile(db, user_id)
        if not profile:
            # Store handles races on the user primary key without overwriting existing state.
            code = ''.join(secrets.choice(alphabet) for _ in range(12))
            await self.store.create_profile(db, user_id, code)
            profile = await self.store.profile(db, user_id)
        return profile

    async def attribute(self, db, user_id, code):
        code = referral_code(code)
        if not code:
            return
        owner = await self.store.referrer(db, code)
        if not owner:
            raise IdentityError('INVALID_REFERRAL')
        if owner == user_id:
            raise IdentityError('SELF_REFERRAL')
        await self.users.assert_active(db, owner)
        profile = await self.store.profile(db, user_id)
        if profile['referred_by']:
            if profile['referred_by'] != owner:
                raise IdentityError('REFERRAL_ALREADY_ASSIGNED', 409)
            return
        if profile['completed']:
            raise IdentityError('ONBOARDING_ALREADY_COMPLETED', 409)
        await self.store.attribute(db, user_id, owner)

    async def complete(self, db, user_id, payload):
        profile = await self.ensure_profile(db, user_id)
        if profile['completed']:
            return profile  # One flow, across all products; retry is idempotent.
        name = str(payload.get('full_name', '')).strip()
        if not 2 <= len(name) <= 200:
            raise IdentityError('INVALID_NAME')
        if payload.get('terms_version') != TERMS_VERSION or payload.get('accept_terms') is not True:
            raise IdentityError('TERMS_REQUIRED')
        await self.attribute(db, user_id, payload.get('referral_code', ''))
        await self.store.complete(db, user_id, name, TERMS_VERSION, int(self.clock()))
        return await self.store.profile(db, user_id)
