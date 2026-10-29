"""Supabase password verification for the existing PROD01 login route."""
import httpx
from fastapi import HTTPException

URL = 'https://mqlwzfsjmhoeiqizzzwk.supabase.co'
PUBLIC_KEY = 'sb_publishable_4I4fm_GNDZN7Qq-jsPvdmA_YXReO_Y9'
# Explicitly approved identities. New signups receive no existing account access.
APPROVED_IDS = {'389020e7-3f0a-4db6-ab56-30ded03e9fec',
                '0d2aa5b9-fc00-4fe8-8e69-74d31376566a'}

async def verify_supabase_identity(email: str, password: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.post(
                URL + '/auth/v1/token?grant_type=password',
                headers={'apikey': PUBLIC_KEY},
                json={'email': email.strip().lower(), 'password': password})
    except httpx.RequestError as exc:
        raise HTTPException(503, 'Authentication service unavailable') from exc
    if response.status_code == 429:
        raise HTTPException(429, 'Too many login attempts')
    if response.status_code >= 500:
        raise HTTPException(503, 'Authentication service unavailable')
    if response.status_code != 200:
        raise HTTPException(401, 'Invalid credentials')
    try:
        user = response.json()['user']
        verified_email = user['email'].strip().lower()
        identity = user['id']
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        raise HTTPException(503, 'Invalid authentication response') from exc
    if identity not in APPROVED_IDS or not user.get('email_confirmed_at'):
        raise HTTPException(403, 'Account pending authorization')
    if verified_email != email.strip().lower():
        raise HTTPException(401, 'Invalid credentials')
    return verified_email
