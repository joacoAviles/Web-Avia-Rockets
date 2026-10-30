"""API authorization dependencies with immediate revocation for Supabase sessions."""
import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import ApiKey, Session, User
from app.utils import hash_api_key

bearer = HTTPBearer(auto_error=False)


async def current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    try:
        payload = decode_access_token(credentials.credentials)
        user_uuid = uuid.UUID(str(payload.get("sub")))
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid access token") from exc

    # Identity-bridge access tokens carry sid; checking it makes logout, recovery,
    # and admin blocking take effect immediately. Older locally issued tokens
    # remain accepted only until their normal JWT expiry during migration.
    session_id = payload.get("sid")
    if session_id:
        try:
            session_uuid = uuid.UUID(str(session_id))
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token") from exc
        session = (await db.execute(select(Session).where(
            Session.id == session_uuid, Session.user_id == user_uuid,
            Session.revoked_at.is_(None), Session.expires_at > datetime.now(UTC),
        ))).scalar_one_or_none()
        if session is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session revoked or expired")

    user = (await db.execute(select(User).where(User.id == user_uuid, User.is_active.is_(True)))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def external_api_key(
    db: Annotated[AsyncSession, Depends(get_db)],
    x_api_key: Annotated[str | None, Header(alias="X-Api-Key")] = None,
) -> ApiKey:
    if not x_api_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-Api-Key")
    key_hash = hash_api_key(x_api_key)
    api_key = (await db.execute(select(ApiKey).where(ApiKey.key_hash == key_hash, ApiKey.is_active.is_(True)))).scalar_one_or_none()
    if api_key is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid API key")
    return api_key


def require_scope(api_key: ApiKey, scope: str) -> None:
    scopes = set(api_key.scopes or [])
    if scope not in scopes and "*" not in scopes:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Missing scope: {scope}")
