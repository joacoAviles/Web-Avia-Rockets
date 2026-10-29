import asyncio,importlib.util,json,uuid
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
    user=(await db.execute(select(User).where(User.email=='fhevia@asesoriasnow.cl'))).scalar_one()
    cid=uuid.UUID('386e1669-4298-419b-895a-cf67be3edf39');ctx=await m.context(cid,user,db)
    assert {g['name'] for g in ctx['groups']}=={'Portafolio 1','Portafolio 2'}
    assert any(c['name']=='16º Juzgado Civil de Santiago' for c in ctx['catalogs']['courts'])
    p1=next(g['id'] for g in ctx['groups'] if g['name']=='Portafolio 1');p2=next(g['id'] for g in ctx['groups'] if g['name']=='Portafolio 2')
    lawyer=next(l['id'] for l in ctx['lawyers'] if l['email']=='fhevia@asesoriasnow.cl')
    payload=m.CauseAssignInput(code='V-987654321',year=2026,court='16º Juzgado Civil de Santiago',corte='C.A. de Santiago',portfolio_id=p2,lawyer_id=lawyer)
    created=await m.assign_case(cid,payload,user,db);i=uuid.UUID(created['id']);case=uuid.UUID(created['case_id'])
    row=(await db.execute(text('select rol,pjud_tipo,pjud_corte,publicada from legal.causes where id=:i'),{'i':case})).mappings().one()
    assert row['rol']=='987654321' and row['pjud_tipo']=='V' and not row['publicada']
    await m.edit_case(cid,i,m.CauseInput(version=0,code='V-987654321',year=2026,court=payload.court,corte=payload.corte,portfolio_id=p1,lawyer_id=lawyer,publication='unpublished'),user,db)
    await m.unassign_case(cid,i,user,db)
    assert (await db.execute(text('select status from legal.legal_portfolio_cases where id=:i'),{'i':i})).scalar()=='archived'
    assert (await db.execute(text('select count(*) from legal.causes where id=:i'),{'i':case})).scalar()==1
    payload.portfolio_id=p1
    restored=await m.assign_case(cid,payload,user,db);assert restored['id']==str(i)
    assert (await db.execute(text('select count(*) from legal.causes where id=:i'),{'i':case})).scalar()==1
    try: await m.context(uuid.uuid4(),user,db)
    except HTTPException as e: assert e.status_code==403
    else:raise AssertionError('cross-client access')
    print(json.dumps({'create_edit_remove_restore':'passed','type_V':'passed','cross_client_denied':True,'portfolios':2,'all_fixtures_rolled_back':True}))
  finally: await tx.rollback()
asyncio.run(main())
