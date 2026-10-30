import secrets
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError
from app.core.database import get_db
from app.models import User, Organization
from app.core.security import hash_password
from app.api.auth import user_payload
from app.api.supabase_access import current_user, identity, platform_admin, supabase_request, URL
router = APIRouter(prefix='/api/v1/identity', tags=['identity'])

class Profile(BaseModel):
    model_config = ConfigDict(extra='forbid')
    full_name: str = Field(min_length=2, max_length=200)
    company_name: str = Field(default='', max_length=200)
    phone: str = Field(default='', max_length=30)
    daily_summary_email_enabled: bool = False

class Access(BaseModel):
    model_config = ConfigDict(extra='forbid')
    is_active: bool
    product_access: dict[str, bool]

@router.get('/me')
async def me(user=Depends(current_user)):
    return user_payload(user)

@router.post('/onboarding')
async def onboarding(payload: Profile, external=Depends(identity), db=Depends(get_db)):
    subject = uuid.UUID(external['id'])
    mapping = (await db.execute(text('SELECT user_id FROM platform.supabase_identities WHERE issuer=:issuer AND subject=:subject'), {'issuer':URL,'subject':subject})).scalar_one_or_none()
    if mapping:
        user = await db.get(User, mapping)
        if not user or not user.is_active:
            raise HTTPException(403,'ACCOUNT_DISABLED')
    else:
        existing = (await db.execute(select(User).where(User.email == external['email'].lower()))).scalar_one_or_none()
        if existing:
            raise HTTPException(409, 'ACCOUNT_REQUIRES_ADMIN_LINK')
        org = Organization(id=uuid.uuid4(),name=payload.company_name or payload.full_name,slug='account-'+uuid.uuid4().hex)
        user = User(id=uuid.uuid4(),organization_id=org.id,email=external['email'].lower(),full_name=payload.full_name,
                    password_hash=hash_password(secrets.token_urlsafe(32)),role='user',product_access={},is_active=True)
        db.add(org)
        await db.flush()
        db.add(user)
        await db.flush()
        await db.execute(text('INSERT INTO platform.supabase_identities(issuer,subject,user_id) VALUES(:issuer,:subject,:uid)'), {'issuer':URL,'subject':subject,'uid':user.id})
    user.full_name=payload.full_name.strip()
    await db.execute(text('INSERT INTO platform.auth_profiles(user_id,company_name,phone,daily_summary_email_enabled) VALUES(:uid,:company_name,:phone,:daily_summary_email_enabled) ON CONFLICT(user_id) DO UPDATE SET company_name=excluded.company_name,phone=excluded.phone,daily_summary_email_enabled=excluded.daily_summary_email_enabled'), {'uid':user.id,**payload.model_dump(exclude={'full_name'})})
    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(409,'PROFILE_CONFLICT') from exc
    return user_payload(user)

@router.get('/admin/users')
async def users(offset: int=0, admin=Depends(platform_admin), db=Depends(get_db)):
    if offset < 0: raise HTTPException(400,'INVALID_PAGE')
    rows=(await db.execute(select(User).order_by(User.email).offset(offset).limit(50))).scalars().all()
    return {'users':[dict(user_payload(u),is_active=u.is_active) for u in rows],'next_offset':offset+50 if len(rows)==50 else None}

@router.patch('/admin/users/{user_id}')
async def access(user_id:uuid.UUID,payload:Access,admin=Depends(platform_admin),db=Depends(get_db)):
    if user_id==admin.id: raise HTTPException(409,'SELF_CHANGE_NOT_ALLOWED')
    user=await db.get(User,user_id)
    if not user: raise HTTPException(404,'USER_NOT_FOUND')
    allowed={'legal','legal-summary','causes','revision-tecnica','intelligence-dashboard','labs-academy','api-lab','pjud-upload'}
    if not set(payload.product_access)<=allowed: raise HTTPException(400,'INVALID_PRODUCTS')
    user.is_active=payload.is_active
    user.product_access=payload.product_access
    await db.execute(text('INSERT INTO platform.auth_admin_audit(actor_user_id,action,target_user_id) VALUES(:actor,:action,:target)'),{'actor':admin.id,'action':'access.update','target':user_id})
    await db.commit()
    return dict(user_payload(user),is_active=user.is_active)
