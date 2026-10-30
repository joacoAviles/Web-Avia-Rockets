"""Supabase-to-Avia identity bridge and platform user administration."""
import secrets
import uuid
from datetime import UTC, datetime, timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from sqlalchemy import func, select, text, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import user_payload
from app.api.supabase_access import URL, admin_client, current_user, identity, mapped_user, platform_admin
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, decode_access_token, hash_password
from app.models import Organization, Session, Subscription, User

router = APIRouter(prefix="/api/v1/identity", tags=["identity"])
settings = get_settings()
ALLOWED_PRODUCTS = {
    "legal", "legal-summary", "causes", "revision-tecnica", "intelligence-dashboard",
    "labs-academy", "api-lab", "pjud-upload",
}


class Profile(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: str = Field(min_length=2, max_length=200)
    company_name: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=30)
    daily_summary_email_enabled: bool = False

    @field_validator("full_name", "company_name", "phone")
    @classmethod
    def trim_strings(cls, value: str) -> str:
        return value.strip()


class AdminCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    company_name: str = Field(default="", max_length=200)
    phone: str = Field(default="", max_length=30)
    daily_summary_email_enabled: bool = False
    organization_name: str = Field(min_length=2, max_length=200)
    product_access: dict[str, bool] = Field(default_factory=dict)


class Access(BaseModel):
    model_config = ConfigDict(extra="forbid")
    is_active: bool
    product_access: dict[str, bool]


class LinkIdentity(BaseModel):
    model_config = ConfigDict(extra="forbid")
    supabase_user_id: uuid.UUID


class LogoutRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    api_access_token: str = Field(min_length=1)


def _session_payload(user: User, db: AsyncSession) -> dict:
    """Create the existing API's short-lived local access token after Supabase checks."""
    async def create():
        now = datetime.now(UTC)
        session = Session(user_id=user.id, expires_at=now + timedelta(days=settings.refresh_token_expire_days))
        db.add(session)
        await db.commit()
        payload = user_payload(user)
        access = create_access_token(str(user.id), {"org": str(user.organization_id), "role": user.role, "sid": str(session.id)})
        return {
            "access_token": access,
            "token": access,
            "refresh_token": create_refresh_token(str(user.id), str(session.id)),
            "token_type": "bearer",
            "expires_in_minutes": settings.access_token_expire_minutes,
            "user": payload,
            "products": payload["products"],
            "permissions": payload["permissions"],
        }
    return create()


async def _issue(user: User, db: AsyncSession) -> dict:
    return await _session_payload(user, db)


async def _audit(db: AsyncSession, actor: User, action: str, target: uuid.UUID | None):
    await db.execute(text(
        "INSERT INTO platform.auth_admin_audit(actor_user_id,action,target_user_id) VALUES(:actor,:action,:target)"
    ), {"actor": actor.id, "action": action, "target": target})


def _access_payload(user: User) -> dict:
    return {**user_payload(user), "is_active": user.is_active}


@router.post("/exchange")
async def exchange(external=Depends(identity), db: AsyncSession = Depends(get_db)):
    user = await mapped_user(external, db)
    return await _issue(user, db)


@router.get("/me")
async def me(user=Depends(current_user)):
    return _access_payload(user)


@router.post("/onboarding")
async def onboarding(payload: Profile, external=Depends(identity), db: AsyncSession = Depends(get_db)):
    subject = uuid.UUID(external["id"])
    mapping = (await db.execute(text(
        "SELECT user_id, verified_email FROM platform.supabase_identities WHERE issuer=:issuer AND subject=:subject"
    ), {"issuer": URL, "subject": subject})).mappings().one_or_none()
    if mapping:
        user = await db.get(User, mapping["user_id"])
        if not user or not user.is_active:
            raise HTTPException(403, "ACCOUNT_DISABLED")
        if (mapping["verified_email"] or user.email).strip().lower() != external["email"]:
            raise HTTPException(403, "ACCOUNT_REQUIRES_ADMIN_LINK")
    else:
        existing = (await db.execute(select(User).where(func.lower(User.email) == external["email"]))).scalar_one_or_none()
        if existing:
            if not existing.is_active:
                raise HTTPException(403, "ACCOUNT_DISABLED")
            # A verified Supabase address may reclaim only the same Avia email.
            # Preserve its internal ID, organization, role, and product grants.
            user = existing
        else:
            org = Organization(id=uuid.uuid4(), name=payload.company_name or payload.full_name, slug=f"account-{uuid.uuid4().hex}")
            user = User(
                id=uuid.uuid4(), organization_id=org.id, email=external["email"],
                full_name=payload.full_name, password_hash=hash_password(secrets.token_urlsafe(48)),
                role="user", product_access={}, is_active=True,
            )
            db.add_all([org, user, Subscription(organization_id=org.id, plan_code="free", status="active")])
            await db.flush()
        await db.execute(text(
            "INSERT INTO platform.supabase_identities(issuer,subject,user_id) VALUES(:issuer,:subject,:user_id)"
        ), {"issuer": URL, "subject": subject, "user_id": user.id})
    user.full_name = payload.full_name
    await db.execute(text(
        "INSERT INTO platform.auth_profiles(user_id,company_name,phone,daily_summary_email_enabled) "
        "VALUES(:user_id,:company_name,:phone,:daily_summary_email_enabled) "
        "ON CONFLICT(user_id) DO UPDATE SET company_name=excluded.company_name,phone=excluded.phone,"
        "daily_summary_email_enabled=excluded.daily_summary_email_enabled"
    ), {"user_id": user.id, "company_name": payload.company_name, "phone": payload.phone,
        "daily_summary_email_enabled": payload.daily_summary_email_enabled})
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(409, "PROFILE_CONFLICT") from exc
    return await _issue(user, db)


@router.post("/recovery-complete")
async def recovery_complete(external=Depends(identity), db: AsyncSession = Depends(get_db)):
    user = await mapped_user(external, db)
    await db.execute(update(Session).where(Session.user_id == user.id, Session.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC)))
    await db.commit()
    return {"ok": True}


@router.post("/logout")
async def logout(payload: LogoutRequest, external=Depends(identity), db: AsyncSession = Depends(get_db)):
    user = await mapped_user(external, db)
    try:
        claims = decode_access_token(payload.api_access_token)
        session_id = uuid.UUID(str(claims.get("sid")))
    except (ValueError, TypeError) as exc:
        raise HTTPException(401, "INVALID_SESSION") from exc
    if claims.get("sub") != str(user.id):
        raise HTTPException(403, "ACCOUNT_MISMATCH")
    await db.execute(update(Session).where(
        Session.id == session_id, Session.user_id == user.id, Session.revoked_at.is_(None)
    ).values(revoked_at=datetime.now(UTC)))
    await db.commit()
    return {"ok": True}


@router.get("/admin/users")
async def list_users(offset: int = Query(0, ge=0), q: str = Query("", max_length=120),
                     admin=Depends(platform_admin), db: AsyncSession = Depends(get_db)):
    query = select(User).order_by(User.email).offset(offset).limit(50)
    if q.strip():
        query = query.where(User.email.ilike(f"%{q.strip()}%") | User.full_name.ilike(f"%{q.strip()}%"))
    rows = (await db.execute(query)).scalars().all()
    users = []
    for user in rows:
        linked = (await db.execute(text(
            "SELECT 1 FROM platform.supabase_identities WHERE user_id=:user_id"
        ), {"user_id": user.id})).scalar_one_or_none()
        users.append({**_access_payload(user), "identity_linked": bool(linked)})
    return {"users": users, "next_offset": offset + 50 if len(rows) == 50 else None}


@router.post("/admin/users", status_code=201)
async def create_user(payload: AdminCreate, admin=Depends(platform_admin), db: AsyncSession = Depends(get_db)):
    email = str(payload.email).strip().lower()
    if not payload.product_access.keys() <= ALLOWED_PRODUCTS:
        raise HTTPException(400, "INVALID_PRODUCTS")
    if (await db.execute(select(User.id).where(func.lower(User.email) == email))).scalar_one_or_none():
        raise HTTPException(409, "EMAIL_ALREADY_REGISTERED")

    # Supabase sends the invitation with its configured Avia-branded template.
    client = admin_client()
    try:
        invite_result = await run_in_threadpool(
            client.auth.admin.invite_user_by_email,
            email,
            options={"data": {"full_name": payload.full_name.strip()},
                     "redirect_to": "https://aviarockets.cl/web-auth/callback.html"},
        )
    except Exception as exc:
        raise HTTPException(502, "INVITATION_FAILED") from exc
    external_user = getattr(invite_result, "user", None)
    if external_user is None and isinstance(invite_result, dict):
        external_user = invite_result.get("user")
    external_id = getattr(external_user, "id", None) or (external_user.get("id") if isinstance(external_user, dict) else None)
    invited_email = getattr(external_user, "email", None) or (external_user.get("email") if isinstance(external_user, dict) else None)
    if not external_id or not invited_email or invited_email.strip().lower() != email:
        raise HTTPException(502, "INVITATION_FAILED")

    org = Organization(id=uuid.uuid4(), name=payload.organization_name.strip(), slug=f"account-{uuid.uuid4().hex}")
    user = User(
        id=uuid.uuid4(), organization_id=org.id, email=email, full_name=payload.full_name.strip(),
        password_hash=hash_password(secrets.token_urlsafe(48)), role="user", product_access=payload.product_access, is_active=True,
    )
    db.add_all([org, user, Subscription(organization_id=org.id, plan_code="free", status="active")])
    await db.flush()
    await db.execute(text(
        "INSERT INTO platform.supabase_identities(issuer,subject,user_id) VALUES(:issuer,:subject,:user_id)"
    ), {"issuer": URL, "subject": uuid.UUID(str(external_id)), "user_id": user.id})
    await db.execute(text(
        "INSERT INTO platform.auth_profiles(user_id,company_name,phone,daily_summary_email_enabled) "
        "VALUES(:user_id,:company_name,:phone,:daily_summary_email_enabled)"
    ), {"user_id": user.id, "company_name": payload.company_name.strip(), "phone": payload.phone.strip(),
        "daily_summary_email_enabled": payload.daily_summary_email_enabled})
    try:
        await _audit(db, admin, "user.invite", user.id)
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        # The remote invite already exists; report a recoverable conflict and require
        # an administrator to link it after checking the email. Never grant access.
        raise HTTPException(409, "INVITATION_REQUIRES_RECONCILIATION") from exc
    return _access_payload(user)


@router.post("/admin/users/{user_id}/link")
async def link_existing(user_id: uuid.UUID, payload: LinkIdentity, admin=Depends(platform_admin), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "USER_NOT_FOUND")
    try:
        result = await run_in_threadpool(admin_client().auth.admin.get_user_by_id, str(payload.supabase_user_id))
    except Exception as exc:
        raise HTTPException(502, "IDENTITY_LOOKUP_FAILED") from exc
    external = getattr(result, "user", None)
    email = getattr(external, "email", None)
    confirmed = getattr(external, "email_confirmed_at", None)
    if not external or not email or email.strip().lower() != user.email.strip().lower() or not confirmed:
        raise HTTPException(409, "IDENTITY_EMAIL_MISMATCH")
    try:
        await db.execute(text(
            "INSERT INTO platform.supabase_identities(issuer,subject,user_id) VALUES(:issuer,:subject,:user_id)"
        ), {"issuer": URL, "subject": payload.supabase_user_id, "user_id": user.id})
        await _audit(db, admin, "identity.link", user.id)
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(409, "IDENTITY_ALREADY_LINKED") from exc
    return _access_payload(user)


@router.post("/admin/users/{user_id}/invite")
async def invite_existing(user_id: uuid.UUID, admin=Depends(platform_admin), db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "USER_NOT_FOUND")
    if not user.is_active:
        raise HTTPException(409, "ACCOUNT_DISABLED")
    linked = (await db.execute(text(
        "SELECT 1 FROM platform.supabase_identities WHERE user_id=:user_id"
    ), {"user_id": user.id})).scalar_one_or_none()
    if linked:
        raise HTTPException(409, "IDENTITY_ALREADY_LINKED")
    try:
        invite_result = await run_in_threadpool(
            admin_client().auth.admin.invite_user_by_email,
            user.email,
            options={"data": {"full_name": user.full_name or user.email},
                     "redirect_to": "https://aviarockets.cl/web-auth/callback.html"},
        )
    except Exception as exc:
        raise HTTPException(502, "INVITATION_FAILED") from exc
    external_user = getattr(invite_result, "user", None)
    external_id = getattr(external_user, "id", None)
    external_email = getattr(external_user, "email", None)
    if not external_id or not external_email or external_email.strip().lower() != user.email.strip().lower():
        raise HTTPException(502, "INVITATION_FAILED")
    try:
        await db.execute(text(
            "INSERT INTO platform.supabase_identities(issuer,subject,user_id) VALUES(:issuer,:subject,:user_id)"
        ), {"issuer": URL, "subject": uuid.UUID(str(external_id)), "user_id": user.id})
        await _audit(db, admin, "user.migration.invite", user.id)
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(409, "IDENTITY_ALREADY_LINKED") from exc
    return {"ok": True, "email": user.email}


@router.patch("/admin/users/{user_id}")
async def update_access(user_id: uuid.UUID, payload: Access, admin=Depends(platform_admin), db: AsyncSession = Depends(get_db)):
    if user_id == admin.id:
        raise HTTPException(409, "SELF_CHANGE_NOT_ALLOWED")
    if not payload.product_access.keys() <= ALLOWED_PRODUCTS:
        raise HTTPException(400, "INVALID_PRODUCTS")
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(404, "USER_NOT_FOUND")
    user.is_active = payload.is_active
    user.product_access = payload.product_access
    if not user.is_active:
        await db.execute(update(Session).where(Session.user_id == user.id, Session.revoked_at.is_(None)).values(revoked_at=datetime.now(UTC)))
    await _audit(db, admin, "user.access.update", user.id)
    await db.commit()
    return _access_payload(user)
