"""Supabase Auth verification and the Avia internal-user bridge.

Install at app/api/supabase_access.py in the FastAPI service. Never expose the
server secret to the browser or log bearer tokens.
"""
import os
import uuid
from functools import lru_cache

import httpx
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select, text

from app.core.database import get_db
from app.models import User

URL = os.getenv("SUPABASE_URL", "https://mqlwzfsjmhoeiqizzzwk.supabase.co").rstrip("/")
PUBLIC_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "sb_publishable_4I4fm_GNDZN7Qq-jsPvdmA_YXReO_Y9")
bearer = HTTPBearer(auto_error=False)


def require_admin_secret() -> str:
    key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise HTTPException(503, "ADMIN_AUTH_NOT_CONFIGURED")
    return key


@lru_cache(maxsize=1)
def admin_client():
    """Create the official Supabase SDK client only inside the trusted API."""
    try:
        from supabase import create_client
        from supabase.lib.client_options import ClientOptions
    except ImportError as exc:
        raise HTTPException(503, "ADMIN_AUTH_NOT_CONFIGURED") from exc
    try:
        return create_client(URL, require_admin_secret(), options=ClientOptions(
            auto_refresh_token=False,
            persist_session=False,
        ))
    except Exception as exc:
        raise HTTPException(503, "ADMIN_AUTH_NOT_CONFIGURED") from exc


async def supabase_request(method: str, path: str, *, token: str | None = None, body=None):
    key = PUBLIC_KEY
    headers = {"apikey": key}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=False) as client:
            response = await client.request(method, f"{URL}/auth/v1/{path.lstrip('/')}", headers=headers, json=body)
    except httpx.RequestError as exc:
        raise HTTPException(503, "AUTH_UNAVAILABLE") from exc
    if response.status_code >= 400:
        if response.status_code in (401, 403):
            raise HTTPException(401, "INVALID_SESSION")
        if response.status_code == 429:
            raise HTTPException(429, "AUTH_RATE_LIMITED")
        if response.status_code >= 500:
            raise HTTPException(503, "AUTH_UNAVAILABLE")
        raise HTTPException(401, "INVALID_SESSION")
    try:
        return response.json() if response.content else {}
    except ValueError as exc:
        raise HTTPException(503, "AUTH_UNAVAILABLE") from exc


async def identity(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if credentials is None:
        raise HTTPException(401, "MISSING_SESSION")
    user = await supabase_request("GET", "user", token=credentials.credentials)
    if not user.get("email_confirmed_at") or user.get("is_anonymous"):
        raise HTTPException(403, "EMAIL_NOT_CONFIRMED")
    try:
        uuid.UUID(user["id"])
        user["email"] = user["email"].strip().lower()
    except (ValueError, KeyError, TypeError, AttributeError) as exc:
        raise HTTPException(401, "INVALID_SESSION") from exc
    return user


async def mapped_user(external, db):
    user_id = (await db.execute(text(
        "SELECT user_id FROM platform.supabase_identities WHERE issuer=:issuer AND subject=:subject"
    ), {"issuer": URL, "subject": uuid.UUID(external["id"])})).scalar_one_or_none()
    if user_id is None:
        raise HTTPException(403, "ACCOUNT_PENDING_APPROVAL")
    user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(403, "ACCOUNT_DISABLED")
    if user.email.strip().lower() != external["email"]:
        raise HTTPException(403, "ACCOUNT_REQUIRES_ADMIN_LINK")
    return user


async def current_user(external=Depends(identity), db=Depends(get_db)):
    return await mapped_user(external, db)


async def platform_admin(external=Depends(identity), user=Depends(current_user), db=Depends(get_db)):
    allowed = (await db.execute(text(
        "SELECT 1 FROM platform.auth_platform_admins WHERE user_id=:user_id"
    ), {"user_id": user.id})).scalar_one_or_none()
    if not allowed:
        raise HTTPException(403, "ADMIN_REQUIRED")
    return user
