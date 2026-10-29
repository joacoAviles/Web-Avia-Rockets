from app.api.supabase_identity import verify_supabase_identity
import uuid
from datetime import UTC, datetime, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import current_user
from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    hash_password,
    verify_password,
)
from app.models import Organization, Session, Subscription, User
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()


def user_products(user: User) -> list[dict]:
    catalog = [
        {"slug": "legal-summary", "product_slug": "legal-summary", "line": "legal", "name": "Resumen", "legacy_slug": "legal"},
        {"slug": "causes", "product_slug": "causes", "line": "legal", "name": "Causas", "legacy_slug": "legal"},
        {"slug": "revision-tecnica", "product_slug": "revision-tecnica", "line": "legal", "name": "Revisiones T?cnicas"},
        {"slug": "intelligence-dashboard", "product_slug": "intelligence-dashboard", "line": "intelligence", "name": "Dashboards / Datos"},
        {"slug": "labs-academy", "product_slug": "labs-academy", "line": "labs", "name": "Academy"},
        {"slug": "api-lab", "product_slug": "api-lab", "line": "labs", "name": "API Lab"},
        {"slug": "pjud-upload", "product_slug": "pjud-upload", "line": "legal", "name": "Procurador"},
    ]
    access = user.product_access or {}
    return [
        {key: value for key, value in product.items() if key != "legacy_slug"} | {"enabled": True}
        for product in catalog
        if bool(access.get(product["slug"], False)) or bool(access.get(product.get("legacy_slug"), False))
    ]

def user_payload(user: User) -> dict:
    products = user_products(user)
    lines = sorted({str(product.get("line")) for product in products if product.get("line")})
    return {
        "id": str(user.id),
        "organization_id": str(user.organization_id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "product_access": user.product_access or {},
        "products": products,
        "permissions": {
            "lines": lines,
            "products": [product["slug"] for product in products],
        },
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: AsyncSession = Depends(get_db)) -> dict:
    org_id = uuid.uuid4()
    user_id = uuid.uuid4()
    org = Organization(id=org_id, name=payload.organization_name, slug=payload.organization_slug)
    user = User(
        id=user_id,
        organization_id=org_id,
        email=payload.email.lower().strip(),
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role="admin",
        product_access={"legal": True},
    )
    subscription = Subscription(organization_id=org_id, plan_code="free", status="active")
    db.add_all([org, user, subscription])
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Organization slug or email already exists",
        ) from exc
    return {"organization_id": str(org.id), "user_id": str(user.id), "status": "created"}


@router.post("/login")
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(select(User).where(User.email == payload.email.lower().strip()))
    user = result.scalar_one_or_none()
    migrated = str(payload.email).strip().lower() in {'admin@aviarockets.cl','fhevia@asesoriasnow.cl'}
    if migrated:
        await verify_supabase_identity(str(payload.email), payload.password)
    if user is None or (not migrated and not verify_password(payload.password, user.password_hash)):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User disabled")

    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    session = Session(user_id=user.id, expires_at=expires_at)
    db.add(session)
    await db.commit()
    access_token = create_access_token(str(user.id), {"org": str(user.organization_id), "role": user.role})
    refresh_token = create_refresh_token(str(user.id), str(session.id))
    user_data = user_payload(user)
    return {
        "access_token": access_token,
        "token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in_minutes": settings.access_token_expire_minutes,
        "user": user_data,
        "products": user_data["products"],
        "permissions": user_data["permissions"],
    }


@router.post("/refresh")
async def refresh(payload: RefreshRequest, db: AsyncSession = Depends(get_db)) -> dict:
    try:
        decoded = decode_refresh_token(payload.refresh_token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user_id = decoded.get("sub")
    session_id = decoded.get("sid")
    try:
        user_uuid = uuid.UUID(str(user_id))
        session_uuid = uuid.UUID(str(session_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token") from exc
    result = await db.execute(
        select(Session, User)
        .join(User, User.id == Session.user_id)
        .where(Session.id == session_uuid, Session.user_id == user_uuid)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session not found")
    session, user = row
    now = datetime.now(UTC)
    if session.revoked_at is not None or session.expires_at <= now:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired")

    session.revoked_at = now
    new_session = Session(user_id=user.id, expires_at=now + timedelta(days=settings.refresh_token_expire_days))
    db.add(new_session)
    await db.commit()
    return {
        "access_token": create_access_token(str(user.id), {"org": str(user.organization_id), "role": user.role}),
        "refresh_token": create_refresh_token(str(user.id), str(new_session.id)),
        "token_type": "bearer",
        "expires_in_minutes": settings.access_token_expire_minutes,
    }


@router.get("/me")
async def me(user: Annotated[User, Depends(current_user)]) -> dict:
    return user_payload(user)
