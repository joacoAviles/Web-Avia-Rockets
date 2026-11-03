"""Signed notification adapter. Disabled until credentials and seller identity are configured.
Mount only after migration, sandbox E2E and billing/reversal policy validation.
"""
import os
from uuid import UUID
import httpx
from fastapi import APIRouter,Depends,HTTPException,Request
from sqlalchemy import text
from app.core.database import get_db
from app.api.mercadopago_validation import PaymentRejected,verify_signature,validate_payment
router=APIRouter(prefix='/api/payments/mercadopago',tags=['payments'])

@router.post('/webhook')
async def webhook(request:Request,db=Depends(get_db)):
    token=os.getenv('MP_ACCESS_TOKEN','');secret=os.getenv('MP_WEBHOOK_SECRET','')
    collector=os.getenv('MP_COLLECTOR_ID','');mode=os.getenv('MP_MODE','disabled')
    if not all((token,secret,collector)) or mode not in ('sandbox','production'):
        raise HTTPException(503,'Payments integration not configured')
    payment_id=request.query_params.get('data.id','')
    try:verify_signature(payment_id,request.headers.get('x-request-id'),request.headers.get('x-signature'),secret)
    except PaymentRejected:raise HTTPException(401,'Invalid notification signature')
    # Do not trust a resource URL, amount, email, user or status supplied by the webhook body.
    try:
        async with httpx.AsyncClient(timeout=10,follow_redirects=False) as client:
            response=await client.get('https://api.mercadopago.com/v1/payments/'+payment_id,headers={'Authorization':'Bearer '+token})
        response.raise_for_status();payment=response.json()
    except (httpx.HTTPError,ValueError):raise HTTPException(503,'Payment verification temporarily unavailable')
    try:order_id=UUID(str(payment.get('external_reference')))
    except (TypeError,ValueError):return {'received':True,'matched':False}
    order=(await db.execute(text('SELECT * FROM platform.payment_orders WHERE id=:i FOR UPDATE'),{'i':order_id})).mappings().first()
    if not order:return {'received':True,'matched':False}
    if bool(order['live_mode'])!=(mode=='production'):raise HTTPException(409,'Order environment mismatch')
    try:approved=validate_payment(payment,order,payment_id,collector,mode=='production')
    except PaymentRejected:raise HTTPException(409,'Payment does not match order; review required')
    status=str(payment.get('status') or 'unknown')
    if status not in {'approved','pending','in_process','authorized','rejected','cancelled','refunded','charged_back','in_mediation'}:
        raise HTTPException(409,'Unknown payment status')
    await db.execute(text('''INSERT INTO platform.mercadopago_receipts(payment_id,order_id,status,live_mode,requires_review)
      VALUES(:p,:o,:s,:live,:review) ON CONFLICT(payment_id) DO UPDATE SET
      status=EXCLUDED.status,last_verified_at=now(),requires_review=EXCLUDED.requires_review'''),
      {'p':payment_id,'o':order_id,'s':status,'live':mode=='production','review':status in {'refunded','charged_back','in_mediation'}})
    if approved and mode=='production':
        await db.execute(text('SELECT id FROM platform.users WHERE id=:u FOR UPDATE'),{'u':order['user_id']})
        await db.execute(text('''INSERT INTO platform.confirmed_payments(provider,provider_payment_id,user_id,amount,currency,confirmed_at,evidence_ref)
         VALUES('mercadopago',:p,:u,:amount,:currency,:at,:evidence)
         ON CONFLICT(provider,provider_payment_id) DO NOTHING'''),
         {'p':payment_id,'u':order['user_id'],'amount':order['amount'],'currency':order['currency'],'at':approved,'evidence':'mercadopago:/v1/payments/'+payment_id})
    await db.commit()
    return {'received':True,'sandbox':mode=='sandbox'}
