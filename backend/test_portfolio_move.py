"""Run inside the API container; every mutation is rolled back."""
import asyncio,importlib.util,json,uuid,os
from sqlalchemy import text,select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import User
from app.core.database import get_sessionmaker
from fastapi import HTTPException
spec=importlib.util.spec_from_file_location('candidate','/tmp/legal-admin-candidate.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
async def main():
 engine=get_sessionmaker().kw['bind']
 async with engine.connect() as conn:
  tx=await conn.begin()
  try:
   async with AsyncSession(bind=conn,join_transaction_mode='create_savepoint',expire_on_commit=False) as db:
    user=(await db.execute(select(User).where(User.email==os.environ['TEST_LEGAL_ADMIN_EMAIL']))).scalar_one()
    cid=uuid.UUID(os.environ['TEST_LEGAL_CLIENT_ID']);ctx=await m.context(cid,user,db)
    p1=next(g['id'] for g in ctx['groups'] if g['name']=='Portafolio 1');p2=next(g['id'] for g in ctx['groups'] if g['name']=='Portafolio 2')
    checked=[]
    for code in os.environ['TEST_LEGAL_ROLS'].split(','):
     row=next(c for c in ctx['causes'] if c['code']==code and c['portfolio_id']==p2)
     original=(await db.execute(text('SELECT row_to_json(c) FROM legal.causes c WHERE id=:i'),dict(i=row['case_id']))).scalar()
     for dest in [p1,p2]:
      payload=m.CauseInput(version=row['version'],code=row['code'],year=row['year'],court=row['court'],corte=row['corte'],portfolio_id=dest,lawyer_id=row['lawyer_id'],publication='published' if row['publicada'] else 'unpublished')
      saved=await m.edit_case(cid,row['id'],payload,user,db)
      current=await m.context(cid,user,db);row=next(c for c in current['causes'] if str(c['id'])==saved['id'])
      assert row['portfolio_id']==dest
      assert (await db.execute(text("SELECT count(*) FROM legal.legal_portfolio_cases WHERE case_id=:i AND status='active'"),dict(i=row['case_id']))).scalar()==1
      assert (await db.execute(text('SELECT row_to_json(c) FROM legal.causes c WHERE id=:i'),dict(i=row['case_id']))).scalar()==original
      assert not (await db.execute(text("SELECT count(*) FROM legal.legal_portfolio_cases WHERE case_id=:i AND status='archived' AND include_in_batch_email"),dict(i=row['case_id']))).scalar()
     checked.append(code)
    try:await m.context(uuid.uuid4(),user,db)
    except HTTPException as e:assert e.status_code==403
    else:raise AssertionError('cross-client access')
    print(json.dumps(dict(round_trip=checked,global_identity_unchanged=True,cross_client_denied=True,rolled_back=True)))
  finally:await tx.rollback()
asyncio.run(main())
