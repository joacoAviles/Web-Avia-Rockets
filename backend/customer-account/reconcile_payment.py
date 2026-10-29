"""Run only on PROD01 after independently verifying a settled payment receipt.
No web endpoint may invoke this command. Never use browser-supplied payment status.
"""
import argparse,asyncio,json
from sqlalchemy import text
from app.core.database import get_sessionmaker
p=argparse.ArgumentParser()
p.add_argument('--user-id',required=True);p.add_argument('--provider',required=True)
p.add_argument('--payment-id',required=True);p.add_argument('--amount',required=True,type=str)
p.add_argument('--currency',default='CLP');p.add_argument('--confirmed-at',required=True)
p.add_argument('--evidence-ref',required=True)
a=p.parse_args()
async def main():
 async with get_sessionmaker()() as db:
  await db.execute(text('SELECT id FROM platform.users WHERE id=CAST(:u AS uuid) FOR UPDATE'),{'u':a.user_id})
  old=(await db.execute(text('SELECT * FROM platform.confirmed_payments WHERE provider=:p AND provider_payment_id=:i'),{'p':a.provider,'i':a.payment_id})).mappings().first()
  if old:
   from decimal import Decimal
   if str(old['user_id'])!=a.user_id or old['amount']!=Decimal(a.amount) or old['currency']!=a.currency:raise RuntimeError('Payment identity conflict')
   print(json.dumps({'already_recorded':True,'payment_id':str(old['id'])}));return
  payment=(await db.execute(text('''INSERT INTO platform.confirmed_payments(provider,provider_payment_id,user_id,amount,currency,confirmed_at,evidence_ref)
   VALUES(:p,:i,CAST(:u AS uuid),CAST(:amount AS numeric),:currency,CAST(:at AS timestamptz),:evidence) RETURNING id'''),dict(p=a.provider,i=a.payment_id,u=a.user_id,amount=a.amount,currency=a.currency,at=a.confirmed_at,evidence=a.evidence_ref))).scalar_one()
  await db.commit();print(json.dumps({'recorded':True,'payment_id':str(payment)}))
asyncio.run(main())
