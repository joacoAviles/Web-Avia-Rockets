"""Supabase-backed identity dependency. Installed as app.api.supabase_access."""
import os
import uuid
import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select, text
from app.core.database import get_db
from app.models import User

URL = 'https://mqlwzfsjmhoeiqizzzwk.supabase.co'
KEY = 'sb_publishable_4I4fm_GNDZN7Qq-jsPvdmA_YXReO_Y9'
bearer = HTTPBearer(auto_error=False)

async def supabase_request(method, path, *, token=None, admin=False, body=None):
    key = os.getenv('SUPABASE_SECRET_KEY') or os.getenv('SUPABASE_SERVICE_ROLE_KEY') if admin else KEY
    if not key:
        raise HTTPException(503, 'ADMIN_AUTH_NOT_CONFIGURED')
    headers = {'apikey': key}
    if token or admin:
        headers['Authorization'] = 'Bearer ' + (token or key)
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.request(method, URL + '/auth/v1/' + path, headers=headers, json=body)
    except httpx.RequestError as exc:
        raise HTTPException(503, 'AUTH_UNAVAILABLE') from exc
    if response.status_code >= 400:
        code = 429 if response.status_code == 429 else (503 if response.status_code >= 500 else 400 if admin else 401)
        raise HTTPException(code, 'AUTH_REQUEST_FAILED' if admin else 'INVALID_CREDENTIALS')
    try:
        return response.json() if response.content else {}
    except ValueError as exc:
        raise HTTPException(503, 'AUTH_UNAVAILABLE') from exc

async def identity(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    if credentials is None:
        raise HTTPException(401, 'MISSING_SESSION')
    user = await supabase_request('GET', 'user', token=credentials.credentials)
    if not user.get('email_confirmed_at') or user.get('is_anonymous'):
        raise HTTPException(403, 'EMAIL_NOT_CONFIRMED')
    try:
        uuid.UUID(user['id'])
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(401, 'INVALID_SESSION') from exc
    return user

async def current_user(external=Depends(identity), db=Depends(get_db)):
    internal_id = (await db.execute(text('SELECT user_id FROM platform.supabase_identities WHERE issuer=:issuer AND subject=:subject'),
        {'issuer': URL, 'subject': uuid.UUID(external['id'])})).scalar_one_or_none()
    if internal_id is None:
        raise HTTPException(403, 'ACCOUNT_PENDING_APPROVAL')
    user = (await db.execute(select(User).where(User.id == internal_id, User.is_active.is_(True)))).scalar_one_or_none()
    if user is None:
        raise HTTPException(403, 'ACCOUNT_DISABLED')
    return user

async def platform_admin(external=Depends(identity), user=Depends(current_user)):
    # Platform ownership is separate from a customer's role='admin'.
    if external['id'] != '389020e7-3f0a-4db6-ab56-30ded03e9fec' or user.email.lower() != 'admin@aviarockets.cl':
        raise HTTPException(403, 'ADMIN_REQUIRED')
    return user
