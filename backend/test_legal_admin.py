"""Integration checks in an outer transaction: ALL fixtures and edits roll back.
Usage: API_SOURCE=<checkout> DATABASE_URL=<test connection> python backend/test_legal_admin.py
"""
import asyncio
import importlib.util
import os
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4, UUID
import sys
import ast

sys.path.insert(0, os.environ['API_SOURCE'])
from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from pydantic import ValidationError

def load(name, filename):
    spec=importlib.util.spec_from_file_location(name,Path(__file__).with_name(filename))
    module=importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

admin=load('admin_test','legal_admin.py')
dashboard=load('dashboard_test','web_compat.py')

async def run():
    engine=create_async_engine(os.environ['DATABASE_URL'])
    count=0
    async with engine.connect() as conn:
        transaction=await conn.begin()
        try:
            for sql in Path(__file__).with_name('legal_admin.sql').read_text(encoding='utf-8').split(';'):
                if sql.strip() and sql.strip() not in ('BEGIN','COMMIT'):
                    await conn.execute(text(sql))
            await conn.execute(text(Path(__file__).with_name('legal_admin_emails.sql').read_text(encoding='utf-8')))
            async with AsyncSession(bind=conn,join_transaction_mode='create_savepoint',expire_on_commit=False) as db:
                user=SimpleNamespace(**dict((await db.execute(text("SELECT id,organization_id,email,full_name,role,is_active,product_access FROM platform.users WHERE lower(email)='fhevia@asesoriasnow.cl'"))).mappings().one()))
                clients=await admin.clients(user,db)
                assert len(clients)==1, 'Expected only explicitly approved NOW client'
                cid=clients[0]['id']; ctx=await admin.context(cid,user,db)
                assert ctx['causes'] and ctx['groups']; count+=1
                assert all('title' in c for c in ctx['causes']), 'Cause title missing from editor context'
                count+=1
                assert all(l['email'] for l in ctx['lawyers']), 'Existing real emails should be loaded'
                count+=1
                assert all(r['portfolio_id'] in {g['id'] for g in ctx['groups']} for r in ctx['portfolio_cc'])
                count+=1
                cc_portfolio=ctx['groups'][0]['id']
                cc_email=f'cc-{uuid4()}@example.invalid'
                created_cc=await admin.add_portfolio_cc(cid,cc_portfolio,admin.PortfolioCcInput(name='QA CC',email=cc_email),user,db)
                refreshed=await admin.context(cid,user,db)
                added=next(r for r in refreshed['portfolio_cc'] if r['id']==UUID(created_cc['id']))
                assert added['portfolio_id']==cc_portfolio and added['email']==cc_email;count+=1
                await admin.remove_portfolio_cc(cid,cc_portfolio,UUID(created_cc['id']),user,db)
                refreshed=await admin.context(cid,user,db)
                assert all(r['id']!=UUID(created_cc['id']) for r in refreshed['portfolio_cc']);count+=1
                async def rejected(code,fn):
                    nonlocal count
                    try: await fn()
                    except HTTPException as exc: assert exc.status_code==code,(exc.status_code,exc.detail)
                    else: raise AssertionError('Forbidden operation accepted')
                    await db.rollback(); count+=1
                await rejected(403,lambda:admin.context(uuid4(),user,db))
                await rejected(403,lambda:admin.clients(SimpleNamespace(role='viewer',is_active=True,product_access={'legal':True}),db))
                for old,pub,target,allowed in [(False,True,'castigo',True),(False,False,'published',False),(True,True,'published',False),(False,True,'unpublished',False),(False,False,'unpublished',True)]:
                    try: admin.validate_transition(old,pub,target)
                    except HTTPException: assert not allowed
                    else: assert allowed
                    count+=1
                try: admin.LawyerInput(name='   ')
                except ValidationError: count+=1
                else: raise AssertionError('Whitespace name accepted')
                fresh=await admin.create_lawyer(cid,admin.LawyerInput(name='QA rollback '+str(uuid4())),user,db)
                lid=UUID(fresh['id'])
                await admin.edit_lawyer(cid,lid,admin.LawyerInput(name='QA edited '+str(uuid4()),email='test@example.invalid'),user,db);count+=1
                await rejected(409,lambda:admin.edit_lawyer(cid,lid,admin.LawyerInput(name='Stale',version=1),user,db))
                initial_dashboard=await dashboard.dashboard_compat(user,db)
                shown_ids={(c['id'],c['email_group_id']) for c in initial_dashboard['causes']}
                eligible=set((await db.execute(text("SELECT pc.id FROM legal.legal_portfolio_cases pc JOIN legal.causes c ON c.id=pc.case_id WHERE pc.status='active' AND pc.include_in_batch_email AND c.status='active' AND c.publicada"))).scalars())
                case=next(c for c in ctx['causes'] if c['id'] in eligible and not c['castigo'] and c['lawyer_id'] and (str(c['case_id']),str(c['portfolio_id'])) in shown_ids)
                other_clients=[]
                for _ in range(2):
                    other=uuid4(); portfolio=uuid4(); org=uuid4(); other_clients.append(other)
                    await db.execute(text("INSERT INTO platform.organizations(id,name,slug,status,created_at,updated_at) VALUES(:i,'QA rollback org',:s,'active',now(),now())"),{'i':org,'s':'qa-'+str(org)})
                    await db.execute(text("INSERT INTO legal.legal_clients(id,organization_id,code,name,status,settings,created_at,updated_at) VALUES(:i,:o,:code,'QA rollback client','active','{}',now(),now())"),{'i':other,'o':org,'code':'qa-'+str(other)})
                    await db.execute(text("INSERT INTO legal.legal_portfolios(id,client_id,code,name,status,settings,display_order,created_at,updated_at) VALUES(:i,:c,:code,'QA rollback group','active','{}',0,now(),now())"),{'i':portfolio,'c':other,'code':'qa-'+str(portfolio)})
                    await db.execute(text("INSERT INTO legal.legal_portfolio_cases(id,portfolio_id,case_id,corte,status,priority,include_in_batch_email,display_order,settings,created_at,updated_at) VALUES(:i,:p,:c,'QA rollback court','active','normal',true,0,'{}',now(),now())"),{'i':uuid4(),'p':portfolio,'c':case['case_id']})
                await db.commit()
                before=dict((await db.execute(text('SELECT * FROM legal.causes WHERE id=:i'),{'i':case['case_id']})).mappings().one())
                await db.execute(text("UPDATE legal.legal_portfolio_cases SET quick_note='QA protected note',client_comment='QA protected comment',private_note='QA private',priority='high' WHERE id=:i"),{'i':case['id']})
                protected=dict((await db.execute(text('SELECT competencia,corte,quick_note,client_comment,private_note,priority,status FROM legal.legal_portfolio_cases WHERE id=:i'),{'i':case['id']})).mappings().one())
                data={k:case.get(k) or '' for k in ['code','court']}
                data.update(year=case['year'],version=case['version'],portfolio_id=case['portfolio_id'],lawyer_id=lid,publication='published')
                data['code']='QA-rollback'
                for key in ['title','competencia','corte','tipo','recipient_ids','quick_note','client_comment','private_note','priority','assignment_status']:
                    try: admin.CauseInput(**(data|{key:'prohibited'}))
                    except ValidationError: count+=1
                    else: raise AssertionError('Protected field accepted: '+key)
                await admin.edit_case(cid,case['id'],admin.CauseInput(**data),user,db)
                assert protected==dict((await db.execute(text('SELECT competencia,corte,quick_note,client_comment,private_note,priority,status FROM legal.legal_portfolio_cases WHERE id=:i'),{'i':case['id']})).mappings().one()); count+=1
                mail_source=Path(os.environ['API_SOURCE'])/'app/labs/pjud_control_email.py'
                tree=ast.parse(mail_source.read_text(encoding='utf-8'))
                mail_sql=next(ast.literal_eval(n.value) for n in tree.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='PORTFOLIO_GROUPS_SQL' for t in n.targets))
                async def mail_row():
                    rows=(await db.execute(text(mail_sql),{'organization_id':before['organization_id']})).mappings().all()
                    return next(r for r in rows if r['portfolio_case_id']==str(case['id']))
                mr=await mail_row()
                assert mr['assigned_lawyer_email']=='test@example.invalid';count+=1
                await admin.edit_lawyer(cid,lid,admin.LawyerInput(name='QA renamed',email='updated@example.invalid',version=2),user,db)
                mr=await mail_row()
                assert mr['assigned_lawyer_email']=='updated@example.invalid' and mr['responsible_name']=='QA renamed'
                assert all(r['email']!='test@example.invalid' for r in mr['case_recipients']);count+=1
                assert any(r['email']=='updated@example.invalid' for r in mr['case_recipients']);count+=1
                data.update(version=case['version']+1,publication='castigo')
                payload=admin.CauseInput(**data)
                await admin.edit_case(cid,case['id'],payload,user,db);count+=1
                after=dict((await db.execute(text('SELECT * FROM legal.causes WHERE id=:i'),{'i':case['case_id']})).mappings().one())
                assert before==after,'Global PJUD cause modified';count+=1
                castigo=(await db.execute(text('SELECT castigo FROM legal.client_cause_settings WHERE client_id=:c AND cause_id=:i'),{'c':cid,'i':case['case_id']})).scalar_one()
                assert castigo
                for other in other_clients:
                    assert not (await db.execute(text('SELECT castigo FROM legal.client_cause_settings WHERE client_id=:c AND cause_id=:i'),{'c':other,'i':case['case_id']})).scalar()
                    assert (await db.execute(text('SELECT pc.include_in_batch_email FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id WHERE p.client_id=:c AND pc.case_id=:i'),{'c':other,'i':case['case_id']})).scalar_one()
                    await rejected(403,lambda:admin.context(other,user,db))
                count+=1
                assert not (await db.execute(text('SELECT 1 FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id WHERE p.client_id=:c AND pc.case_id=:i AND pc.include_in_batch_email'),{'c':cid,'i':case['case_id']})).first();count+=1
                await rejected(409,lambda:admin.edit_case(cid,case['id'],payload,user,db))
                await rejected(409,lambda:admin.delete_lawyer(cid,lid,user,db))
                result=await dashboard.dashboard_compat(user,db)
                shown=next(c for c in result['causes'] if c['id']==str(case['case_id']))
                assert shown['client_castigo'] and not shown['publicada'] and shown['pjud_publicada']
                assert shown['code']=='QA-rollback' and shown['assigned_lawyer']=='QA renamed';count+=1
                data.update(version=case['version']+2,publication='published')
                await rejected(422,lambda:admin.edit_case(cid,case['id'],admin.CauseInput(**data),user,db))
                empty=await admin.create_lawyer(cid,admin.LawyerInput(name='QA delete '+str(uuid4())),user,db)
                await admin.delete_lawyer(cid,UUID(empty['id']),user,db);count+=1
                print(f'PASS: {count} checks; {len(ctx["causes"])} client assignments; {len(result["causes"])} dashboard causes. All test writes roll back.')
        finally:
            await transaction.rollback()
    await engine.dispose()

asyncio.run(run())
