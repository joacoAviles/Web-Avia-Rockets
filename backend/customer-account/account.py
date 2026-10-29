"""Customer account and earned referral entitlements. Payments are server verified only."""
from datetime import datetime
from uuid import UUID
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from app.api.deps import current_user
from app.core.database import get_db

router = APIRouter(prefix='/api/account', tags=['account'])

class Preferences(BaseModel):
    model_config = ConfigDict(extra='forbid')
    theme: Literal['dark','light']
    customer_type: Literal['person','company'] | None = None

class ReferralCode(BaseModel):
    model_config = ConfigDict(extra='forbid',str_strip_whitespace=True)
    code: str = Field(min_length=8,max_length=32,pattern='^[A-Za-z0-9]+$')

class Allocation(BaseModel):
    model_config = ConfigDict(extra='forbid')
    cause_id: UUID
    request_id: UUID
    years: int = Field(ge=1,le=100)

async def account_data(user,db):
    q=await db.execute(text('SELECT * FROM platform.account_preferences WHERE user_id=:u'),{'u':user.id})
    prefs=dict(q.mappings().first() or {'theme':'dark','customer_type':None})
    q=await db.execute(text('SELECT plan_code,status FROM platform.subscriptions WHERE organization_id=:o ORDER BY created_at DESC LIMIT 1'),{'o':user.organization_id})
    subscription=dict(q.mappings().first() or {})
    q=await db.execute(text('SELECT code FROM platform.referral_codes WHERE user_id=:u'),{'u':user.id})
    code=q.scalar()
    q=await db.execute(text('''SELECT count(*) AS earned, count(*) FILTER(WHERE a.id IS NULL) AS available
      FROM platform.referral_credits c LEFT JOIN platform.referral_allocations a ON a.credit_id=c.id WHERE c.user_id=:u'''),{'u':user.id})
    balance=dict(q.mappings().one())
    allocations=[dict(r) for r in (await db.execute(text('''SELECT a.cause_id,c.rol,c.year,c.court,min(a.starts_on) AS starts_on,max(a.ends_on) AS ends_on,count(*) AS years
      FROM platform.referral_allocations a JOIN legal.causes c ON c.id=a.cause_id
      WHERE a.user_id=:u GROUP BY a.cause_id,c.rol,c.year,c.court ORDER BY ends_on'''),{'u':user.id})).mappings()]
    pending=(await db.execute(text('''SELECT count(*) FROM platform.referrals r WHERE r.referrer_user_id=:u
      AND NOT EXISTS(SELECT 1 FROM platform.referral_credits c WHERE c.referred_user_id=r.referred_user_id)'''),{'u':user.id})).scalar()
    access=user.product_access or {}
    definitions=[('legal','Legal',['legal','causes','pjud-upload']),('flota','Flota',['revision-tecnica']),('intelligence','Intelligence',['intelligence-dashboard']),('labs','Labs',['api-lab','labs-academy'])]
    products=[{'id':key,'name':name} for key,name,keys in definitions if any(access.get(k) for k in keys)]
    return {'name':user.full_name,'email':user.email,'preferences':prefs,'subscription':subscription,
      'payment_method':None,'products':products,'referrals':{'code':code,**balance,'pending':pending,'allocations':allocations}}

@router.get('')
async def get_account(user=Depends(current_user),db=Depends(get_db)):
    return await account_data(user,db)

@router.patch('/settings')
async def preferences(payload:Preferences,user=Depends(current_user),db=Depends(get_db)):
    await db.execute(text('''INSERT INTO platform.account_preferences(user_id,theme,customer_type) VALUES(:u,:t,:c)
      ON CONFLICT(user_id) DO UPDATE SET theme=EXCLUDED.theme,customer_type=EXCLUDED.customer_type,updated_at=now()'''),{'u':user.id,'t':payload.theme,'c':payload.customer_type})
    await db.commit()
    return await account_data(user,db)

@router.post('/referrals/code')
async def create_code(user=Depends(current_user),db=Depends(get_db)):
    await db.execute(text('INSERT INTO platform.referral_codes(user_id) VALUES(:u) ON CONFLICT(user_id) DO NOTHING'),{'u':user.id})
    await db.commit()
    return await account_data(user,db)

@router.post('/referrals/redeem')
async def redeem(payload:ReferralCode,user=Depends(current_user),db=Depends(get_db)):
    # Serialize redemption and payment reconciliation against the same user row.
    await db.execute(text('SELECT id FROM platform.users WHERE id=:u FOR UPDATE'),{'u':user.id})
    eligible=(await db.execute(text('SELECT u.created_at >= p.opened_at FROM platform.users u CROSS JOIN platform.referral_program p WHERE u.id=:u'),{'u':user.id})).scalar()
    if not eligible: raise HTTPException(422,'El código de invitación es para cuentas nuevas.')
    owner=(await db.execute(text('SELECT user_id FROM platform.referral_codes WHERE code=:c'),{'c':payload.code.upper()})).scalar()
    if not owner or owner==user.id: raise HTTPException(422,'Código inválido.')
    if (await db.execute(text('SELECT 1 FROM platform.referrals WHERE referred_user_id=:u'),{'u':user.id})).scalar(): raise HTTPException(409,'Ya registraste un código de invitación.')
    if (await db.execute(text('SELECT 1 FROM platform.confirmed_payments WHERE user_id=:u'),{'u':user.id})).first(): raise HTTPException(409,'El código debe registrarse antes del primer pago.')
    await db.execute(text('INSERT INTO platform.referrals(referred_user_id,referrer_user_id) VALUES(:u,:r)'),{'u':user.id,'r':owner})
    await db.commit()
    return {'ok':True}

@router.post('/referrals/allocate')
async def allocate(payload:Allocation,user=Depends(current_user),db=Depends(get_db)):
    await db.execute(text('SELECT id FROM platform.users WHERE id=:u FOR UPDATE'),{'u':user.id})
    existing=(await db.execute(text('SELECT cause_id,years FROM platform.referral_allocation_requests WHERE user_id=:u AND request_id=:r'),{'u':user.id,'r':payload.request_id})).mappings().first()
    if existing:
        if existing['cause_id']!=payload.cause_id or existing['years']!=payload.years: raise HTTPException(409,'La solicitud ya fue utilizada.')
        return await account_data(user,db)
    # Ownership follows the legal organization; never trust a cause id supplied by a browser.
    owned=(await db.execute(text("""SELECT c.id FROM legal.causes c WHERE c.id=:c AND c.status='active' AND (
 c.organization_id=:o OR EXISTS(SELECT 1 FROM legal.legal_portfolio_cases pc
 JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
 LEFT JOIN legal.client_administrators ca ON ca.client_id=p.client_id AND ca.user_id=:u
 LEFT JOIN legal.client_lawyers l ON l.id=pc.lawyer_id
 WHERE pc.case_id=c.id AND pc.status='active' AND p.status='active' AND
 (ca.user_id IS NOT NULL OR lower(l.email)=lower(:email)))) FOR UPDATE"""),{'c':payload.cause_id,'o':user.organization_id,'u':user.id,'email':user.email})).scalar()
    if not owned: raise HTTPException(404,'Causa no disponible en tu cuenta.')
    credits=(await db.execute(text('''SELECT c.id FROM platform.referral_credits c WHERE c.user_id=:u
      AND NOT EXISTS(SELECT 1 FROM platform.referral_allocations a WHERE a.credit_id=c.id)
      ORDER BY c.earned_at,c.id LIMIT :n FOR UPDATE'''),{'u':user.id,'n':payload.years})).scalars().all()
    if len(credits)!=payload.years: raise HTTPException(409,'No tienes suficientes años disponibles.')
    await db.execute(text('INSERT INTO platform.referral_allocation_requests(user_id,request_id,cause_id,years) VALUES(:u,:r,:c,:n)'),{'u':user.id,'r':payload.request_id,'c':payload.cause_id,'n':payload.years})
    for credit in credits:
        await db.execute(text('''INSERT INTO platform.referral_allocations(credit_id,user_id,cause_id,starts_on,ends_on)
          SELECT :credit,:u,:c,start_date,(start_date+interval '1 year')::date FROM
          (SELECT greatest((now() AT TIME ZONE 'America/Santiago')::date,COALESCE(max(ends_on),(now() AT TIME ZONE 'America/Santiago')::date)) AS start_date
           FROM platform.referral_allocations WHERE cause_id=:c AND user_id=:u) s'''),{'credit':credit,'u':user.id,'c':payload.cause_id})
    await db.commit()
    return await account_data(user,db)
