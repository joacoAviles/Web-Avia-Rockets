"""Individual, client-scoped legal administration. No global publication writes."""
import json
from uuid import UUID
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.api.deps import current_user
from app.core.database import get_db

router = APIRouter(prefix='/api/v1/legal/admin', tags=['legal-admin'])

class LawyerInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str = Field(min_length=1, max_length=200)
    email: str | None = Field(default=None, max_length=254, pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
    version: int = Field(default=1, ge=1)

class CauseInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    version: int = Field(ge=0)
    code: str = Field(min_length=1,max_length=60)
    year: int = Field(ge=1800,le=2200)
    court: str = Field(min_length=1,max_length=255)
    portfolio_id: UUID
    lawyer_id: UUID | None = None
    publication: Literal['published','unpublished','castigo']

def require_admin(user):
    access=user.product_access or {}
    if user.role != 'admin' or not user.is_active or not any(access.get(k) in (True,1) for k in ('legal','causes')):
        raise HTTPException(403,'Acceso reservado al administrador de Legal')

async def authorize(db,user,client_id):
    require_admin(user)
    ok=(await db.execute(text('SELECT 1 FROM legal.client_administrators WHERE client_id=:c AND user_id=:u'),{'c':client_id,'u':user.id})).scalar()
    if not ok: raise HTTPException(403,'Sin autorización para este cliente')

def validate_transition(was_castigo,published,target):
    current='castigo' if was_castigo else ('published' if published else 'unpublished')
    if target != current and not (current=='published' and target=='castigo'):
        raise HTTPException(422,'Solo se permite Publicada → Castigo. No se permite publicar manualmente.')

async def audit(db,user,client_id,rid,action,before,after):
    await db.execute(text('INSERT INTO legal.admin_edit_audit(client_id,user_id,resource_id,action,before_data,after_data) VALUES (:c,:u,:r,:a,CAST(:b AS jsonb),CAST(:n AS jsonb))'),dict(c=client_id,u=user.id,r=rid,a=action,b=json.dumps(before,default=str),n=json.dumps(after,default=str)))

async def sync_assigned_contact(db,case_link_id,old_email,new_email,name):
    """Update only existing contacts of the assigned lawyer, not other viewers/copies.
    The mailer also reads assigned_lawyer_email directly when no contact row exists.
    """
    old_email=(old_email or '').strip().lower()
    new_email=(new_email or '').strip().lower() or None
    if not old_email: return
    contacts=(await db.execute(text('SELECT * FROM legal.legal_portfolio_case_recipients WHERE portfolio_case_id=:i AND lower(trim(email))=:e AND is_active FOR UPDATE'),dict(i=case_link_id,e=old_email))).mappings().all()
    for contact in contacts:
        if new_email==old_email:
            await db.execute(text('UPDATE legal.legal_portfolio_case_recipients SET name=:n,updated_at=now() WHERE id=:i'),dict(n=name,i=contact['id']))
            continue
        await db.execute(text('UPDATE legal.legal_portfolio_case_recipients SET is_active=false,updated_at=now() WHERE id=:i'),dict(i=contact['id']))
        if new_email:
            await db.execute(text('''INSERT INTO legal.legal_portfolio_case_recipients(id,portfolio_case_id,email,name,recipient_type,is_active,created_at,updated_at)
              VALUES(gen_random_uuid(),:i,:e,:n,:t,true,now(),now()) ON CONFLICT(portfolio_case_id,email,recipient_type)
              DO UPDATE SET name=EXCLUDED.name,is_active=true,updated_at=now()'''),dict(i=case_link_id,e=new_email,n=name,t=contact['recipient_type']))

@router.get('/clients')
async def clients(user=Depends(current_user),db=Depends(get_db)):
    require_admin(user)
    return [dict(r) for r in (await db.execute(text('SELECT c.id,c.name FROM legal.legal_clients c JOIN legal.client_administrators a ON a.client_id=c.id WHERE a.user_id=:u ORDER BY c.name'),{'u':user.id})).mappings()]

@router.get('/clients/{client_id}')
async def context(client_id:UUID,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    async def rows(sql): return [dict(r) for r in (await db.execute(text(sql),{'c':client_id})).mappings()]
    return dict(
        lawyers=await rows('SELECT * FROM legal.client_lawyers WHERE client_id=:c ORDER BY name'),
        groups=await rows("SELECT id,name FROM legal.legal_portfolios WHERE client_id=:c AND status='active' ORDER BY display_order,name"),
        causes=await rows("""SELECT pc.id,pc.case_id,pc.portfolio_id,pc.lawyer_id,
          c.rol AS code,c.year,c.court,COALESCE(NULLIF(BTRIM(c.party),''),historical_title.title) AS title,c.publicada,
          COALESCE(s.castigo,false) AS castigo,COALESCE(s.version,0) AS version,COALESCE(s.fields,'{}'::jsonb) AS fields
          FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
          JOIN legal.causes c ON c.id=pc.case_id
          LEFT JOIN LATERAL (
            SELECT source.title FROM (
              SELECT NULLIF(BTRIM(ch.raw_case_payload #>> '{metadata,caratulado}'),'') AS title,COALESCE(ch.finished_at,ch.created_at) AS observed_at
              FROM legal.pjud_case_checks ch WHERE ch.cause_id=c.id
              UNION ALL SELECT NULLIF(BTRIM(ri.result_payload #>> '{metadata,caratulado}'),''),COALESCE(ri.completed_at,ri.updated_at,ri.created_at)
              FROM legal.pjud_run_items ri WHERE ri.cause_id=c.id
              UNION ALL SELECT NULLIF(BTRIM(dr.raw_data_json ->> 'caratulado'),''),dr.created_at
              FROM legal.procurador_daily_rows dr WHERE dr.matched_cause_id=c.id
            ) source WHERE source.title IS NOT NULL ORDER BY source.observed_at DESC NULLS LAST LIMIT 1
          ) historical_title ON TRUE
          LEFT JOIN legal.client_cause_settings s ON s.client_id=p.client_id AND s.cause_id=c.id
          WHERE p.client_id=:c ORDER BY c.publicada DESC,c.year DESC,c.rol"""))

@router.put('/clients/{client_id}/cases/{case_link_id}')
async def edit_case(client_id:UUID,case_link_id:UUID,payload:CauseInput,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    # Lock the lawyer before its assignments, matching the lawyer-edit lock order.
    lawyer=None
    if payload.lawyer_id:
        lawyer=(await db.execute(text('SELECT name,email FROM legal.client_lawyers WHERE id=:i AND client_id=:c FOR SHARE'),{'i':payload.lawyer_id,'c':client_id})).mappings().first()
        if not lawyer: raise HTTPException(422,'Abogado ajeno al cliente')
    before=(await db.execute(text('SELECT pc.*,c.publicada FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id JOIN legal.causes c ON c.id=pc.case_id WHERE pc.id=:i AND p.client_id=:c FOR UPDATE OF pc,c'),{'i':case_link_id,'c':client_id})).mappings().first()
    if not before: raise HTTPException(404,'Causa no asignada al cliente')
    await db.execute(text('INSERT INTO legal.client_cause_settings(client_id,cause_id,version) VALUES (:c,:i,0) ON CONFLICT DO NOTHING'),{'c':client_id,'i':before['case_id']})
    settings=(await db.execute(text('SELECT * FROM legal.client_cause_settings WHERE client_id=:c AND cause_id=:i FOR UPDATE'),{'c':client_id,'i':before['case_id']})).mappings().one()
    if settings['version'] != payload.version: raise HTTPException(409,'La causa cambió. Recarga antes de guardar.')
    validate_transition(settings['castigo'],before['publicada'],payload.publication)
    group=(await db.execute(text("SELECT id FROM legal.legal_portfolios WHERE id=:i AND client_id=:c AND status='active'"),{'i':payload.portfolio_id,'c':client_id})).scalar()
    if not group: raise HTTPException(422,'Grupo ajeno al cliente o inactivo')
    fields=dict(settings['fields']) | {k:getattr(payload,k) for k in ['code','year','court']}
    lawyer_name=lawyer['name'] if lawyer else None
    lawyer_email=lawyer['email'] if lawyer else None
    try:
        await db.execute(text('UPDATE legal.client_cause_settings SET fields=CAST(:f AS jsonb),castigo=:s,version=version+1 WHERE client_id=:c AND cause_id=:i'),{'f':json.dumps(fields),'s':payload.publication=='castigo','c':client_id,'i':before['case_id']})
        await db.execute(text('''UPDATE legal.legal_portfolio_cases SET portfolio_id=:p,lawyer_id=:l,responsible_name=:n,settings=COALESCE(settings,'{}'::jsonb)||CAST(:flags AS jsonb),updated_at=now() WHERE id=:i'''),dict(p=group,l=payload.lawyer_id,n=lawyer_name,i=case_link_id,flags=json.dumps({'admin_lawyer_edited':True,'assigned_lawyer_email':lawyer_email})))
        await sync_assigned_contact(db,case_link_id,(before['settings'] or {}).get('assigned_lawyer_email'),lawyer_email,lawyer_name)
        if payload.publication=='castigo':
            await db.execute(text('UPDATE legal.legal_portfolio_cases pc SET include_in_batch_email=false,updated_at=now() FROM legal.legal_portfolios p WHERE pc.portfolio_id=p.id AND p.client_id=:c AND pc.case_id=:i'),{'c':client_id,'i':before['case_id']})
        await audit(db,user,client_id,case_link_id,'case.update',dict(before)|dict(settings),payload.model_dump())
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409,'La asignación ya existe en ese grupo. No se guardaron cambios.')
    return {'ok':True}

@router.post('/clients/{client_id}/lawyers',status_code=201)
async def create_lawyer(client_id:UUID,payload:LawyerInput,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    try:
        rid=(await db.execute(text('INSERT INTO legal.client_lawyers(client_id,name,email) VALUES(:c,:n,:e) RETURNING id'),dict(c=client_id,n=payload.name,e=payload.email))).scalar_one()
        await audit(db,user,client_id,rid,'lawyer.create',None,payload.model_dump())
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409,'Ya existe un abogado con ese nombre')
    return {'id':str(rid)}

@router.put('/clients/{client_id}/lawyers/{lawyer_id}')
async def edit_lawyer(client_id:UUID,lawyer_id:UUID,payload:LawyerInput,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    old=(await db.execute(text('SELECT * FROM legal.client_lawyers WHERE id=:i AND client_id=:c FOR UPDATE'),dict(i=lawyer_id,c=client_id))).mappings().first()
    if not old: raise HTTPException(404,'Abogado no encontrado')
    if old['version']!=payload.version: raise HTTPException(409,'El abogado cambió. Recarga antes de guardar.')
    try:
        await db.execute(text('UPDATE legal.client_lawyers SET name=:n,email=:e,version=version+1 WHERE id=:i'),dict(n=payload.name,e=payload.email,i=lawyer_id))
        assignments=(await db.execute(text('SELECT id,settings FROM legal.legal_portfolio_cases WHERE lawyer_id=:i FOR UPDATE'),dict(i=lawyer_id))).mappings().all()
        for assignment in assignments:
            await sync_assigned_contact(db,assignment['id'],(assignment['settings'] or {}).get('assigned_lawyer_email'),payload.email,payload.name)
        await db.execute(text('UPDATE legal.legal_portfolio_cases SET responsible_name=:n,settings=COALESCE(settings,\'{}\'::jsonb)||CAST(:s AS jsonb),updated_at=now() WHERE lawyer_id=:i'),dict(n=payload.name,i=lawyer_id,s=json.dumps({'assigned_lawyer_email':payload.email})))
        await audit(db,user,client_id,lawyer_id,'lawyer.update',dict(old),payload.model_dump())
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409,'Ya existe un abogado con ese nombre')
    return {'ok':True}

@router.delete('/clients/{client_id}/lawyers/{lawyer_id}')
async def delete_lawyer(client_id:UUID,lawyer_id:UUID,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    old=(await db.execute(text('SELECT * FROM legal.client_lawyers WHERE id=:i AND client_id=:c FOR UPDATE'),dict(i=lawyer_id,c=client_id))).mappings().first()
    if not old: raise HTTPException(404,'Abogado no encontrado')
    used=(await db.execute(text('SELECT 1 FROM legal.legal_portfolio_cases WHERE lawyer_id=:i LIMIT 1'),dict(i=lawyer_id))).scalar()
    if used: raise HTTPException(409,'Reasigna primero las causas de este abogado para poder borrarlo.')
    await audit(db,user,client_id,lawyer_id,'lawyer.delete',dict(old),None)
    await db.execute(text('DELETE FROM legal.client_lawyers WHERE id=:i'),dict(i=lawyer_id))
    await db.commit()
    return {'ok':True}
