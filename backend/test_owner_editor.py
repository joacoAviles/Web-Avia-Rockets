import asyncio,importlib.util,json,uuid,os
from sqlalchemy import text,select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.core.database import get_sessionmaker
from fastapi import HTTPException
spec=importlib.util.spec_from_file_location('candidate','/tmp/legal-admin-candidate.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
async def main():
 async with get_sessionmaker().kw['bind'].connect() as conn:
  tx=await conn.begin()
  try:
   async with AsyncSession(bind=conn,join_transaction_mode='create_savepoint',expire_on_commit=False) as db:
    cid=uuid.UUID(os.environ['TEST_LEGAL_CLIENT_ID'])
    ids=(await db.execute(text("SELECT u.id FROM platform.users u JOIN legal.client_lawyers l ON lower(l.email)=lower(u.email) WHERE l.client_id=:c AND u.role='abogado'"),dict(c=cid))).scalars().all()
    checked=[]
    for uid in ids:
     u=(await db.execute(select(User).where(User.id==uid))).scalar_one();ctx=await m.context(cid,u,db)
     assert not ctx['can_manage_client'] and not ctx['portfolio_cc']
     own={l['id'] for l in ctx['lawyers']};assert all(c['lawyer_id'] in own for c in ctx['causes'])
     if not ctx['causes']:
      checked.append(0)
      continue
     row=ctx['causes'][0];dest=next(g['id'] for g in ctx['groups'] if g['id']!=row['portfolio_id'])
     payload=m.CauseInput(version=row['version'],code=row['code'],year=row['year'],court=row['court'],corte=row['corte'],portfolio_id=dest,lawyer_id=row['lawyer_id'],publication='castigo' if row['castigo'] else 'published' if row['publicada'] else 'unpublished')
     await m.edit_case(cid,row['id'],payload,u,db)
     forbidden=(await db.execute(text("SELECT pc.id FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id WHERE p.client_id=:c AND pc.status='active' AND pc.lawyer_id<>:l LIMIT 1"),dict(c=cid,l=row['lawyer_id']))).scalar_one()
     try:await m.edit_case(cid,forbidden,payload,u,db)
     except HTTPException as e:assert e.status_code==403
     else:raise AssertionError('other lawyer writable')
     try:await m.authorize(db,u,cid)
     except HTTPException as e:assert e.status_code==403
     else:raise AssertionError('client administration exposed')
     try:await m.context(uuid.uuid4(),u,db)
     except HTTPException as e:assert e.status_code==403
     else:raise AssertionError('cross-client')
     checked.append(len(ctx['causes']))
    print(json.dumps(dict(lawyer_accounts_tested=len(checked),own_cases_per_account=checked,move_own=True,other_lawyer_denied=True,client_admin_denied=True,rolled_back=True)))
  finally:await tx.rollback()
asyncio.run(main())
