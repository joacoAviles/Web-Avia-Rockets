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
    title: str = Field(default='',max_length=255)
    competencia: str = Field(default='',max_length=100)
    corte: str = Field(default='',max_length=255)
    tipo: str = Field(default='',max_length=20)
    portfolio_id: UUID
    lawyer_id: UUID | None = None
    recipient_ids: list[UUID] = Field(default_factory=list,max_length=100)
    quick_note: str = Field(default='',max_length=5000)
    client_comment: str = Field(default='',max_length=5000)
    private_note: str = Field(default='',max_length=5000)
    priority: Literal['low','normal','high','urgent']='normal'
    assignment_status: Literal['active','paused','archived']='active'
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
        recipients=await rows("SELECT r.id,r.email,r.name,r.recipient_type,p.name AS group_name FROM legal.legal_portfolio_recipients r JOIN legal.legal_portfolios p ON p.id=r.portfolio_id WHERE p.client_id=:c AND r.is_active ORDER BY r.email"),
        causes=await rows("""SELECT pc.id,pc.case_id,pc.portfolio_id,pc.lawyer_id,pc.quick_note,pc.client_comment,pc.private_note,pc.priority,pc.status AS assignment_status,
          c.rol AS code,c.year,c.court,c.party AS title,COALESCE(pc.competencia,c.pjud_competencia) AS competencia,COALESCE(pc.corte,c.pjud_corte) AS corte,c.pjud_tipo AS tipo,c.publicada,
          COALESCE(s.castigo,false) AS castigo,COALESCE(s.version,0) AS version,COALESCE(s.fields,'{}'::jsonb) AS fields,
          ARRAY(SELECT r.id FROM legal.legal_portfolio_recipients r JOIN legal.legal_portfolios rp ON rp.id=r.portfolio_id
            WHERE rp.client_id=p.client_id AND r.is_active AND (
              (NOT COALESCE((pc.settings->>'admin_edited')::boolean,false) AND r.portfolio_id=p.id)
              OR EXISTS(SELECT 1 FROM legal.legal_portfolio_case_recipients cr
            WHERE cr.portfolio_case_id=pc.id AND cr.email=r.email AND cr.recipient_type=r.recipient_type AND cr.is_active))) AS recipient_ids
          FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
          JOIN legal.causes c ON c.id=pc.case_id LEFT JOIN legal.client_cause_settings s ON s.client_id=p.client_id AND s.cause_id=c.id
          WHERE p.client_id=:c ORDER BY c.publicada DESC,c.year DESC,c.rol"""))

@router.put('/clients/{client_id}/cases/{case_link_id}')
async def edit_case(client_id:UUID,case_link_id:UUID,payload:CauseInput,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    before=(await db.execute(text('SELECT pc.*,c.publicada FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id JOIN legal.causes c ON c.id=pc.case_id WHERE pc.id=:i AND p.client_id=:c FOR UPDATE OF pc,c'),{'i':case_link_id,'c':client_id})).mappings().first()
    if not before: raise HTTPException(404,'Causa no asignada al cliente')
    await db.execute(text('INSERT INTO legal.client_cause_settings(client_id,cause_id,version) VALUES (:c,:i,0) ON CONFLICT DO NOTHING'),{'c':client_id,'i':before['case_id']})
    settings=(await db.execute(text('SELECT * FROM legal.client_cause_settings WHERE client_id=:c AND cause_id=:i FOR UPDATE'),{'c':client_id,'i':before['case_id']})).mappings().one()
    if settings['version'] != payload.version: raise HTTPException(409,'La causa cambió. Recarga antes de guardar.')
    validate_transition(settings['castigo'],before['publicada'],payload.publication)
    group=(await db.execute(text("SELECT id FROM legal.legal_portfolios WHERE id=:i AND client_id=:c AND status='active'"),{'i':payload.portfolio_id,'c':client_id})).scalar()
    if not group: raise HTTPException(422,'Grupo ajeno al cliente o inactivo')
    lawyer=None
    if payload.lawyer_id:
        lawyer=(await db.execute(text('SELECT name FROM legal.client_lawyers WHERE id=:i AND client_id=:c FOR SHARE'),{'i':payload.lawyer_id,'c':client_id})).scalar()
        if not lawyer: raise HTTPException(422,'Abogado ajeno al cliente')
    recipients=[]
    for rid in set(payload.recipient_ids):
        r=(await db.execute(text('SELECT r.* FROM legal.legal_portfolio_recipients r JOIN legal.legal_portfolios p ON p.id=r.portfolio_id WHERE r.id=:i AND p.client_id=:c AND r.is_active'),{'i':rid,'c':client_id})).mappings().first()
        if not r: raise HTTPException(422,'Destinatario ajeno al cliente o inactivo')
        recipients.append(r)
    fields={k:getattr(payload,k) for k in ['code','year','court','title','competencia','corte','tipo']}
    try:
        await db.execute(text('UPDATE legal.client_cause_settings SET fields=CAST(:f AS jsonb),castigo=:s,version=version+1 WHERE client_id=:c AND cause_id=:i'),{'f':json.dumps(fields),'s':payload.publication=='castigo','c':client_id,'i':before['case_id']})
        await db.execute(text('''UPDATE legal.legal_portfolio_cases SET portfolio_id=:p,lawyer_id=:l,responsible_name=:n,competencia=:co,corte=:ct,quick_note=:q,client_comment=:cc,private_note=:pn,priority=:pr,status=:st,settings=COALESCE(settings,'{}'::jsonb)||CAST(:flags AS jsonb),updated_at=now() WHERE id=:i'''),dict(p=group,l=payload.lawyer_id,n=lawyer,co=payload.competencia,ct=payload.corte,q=payload.quick_note,cc=payload.client_comment,pn=payload.private_note,pr=payload.priority,st=payload.assignment_status,i=case_link_id,flags='{"admin_edited":true}'))
        if payload.publication=='castigo':
            await db.execute(text('UPDATE legal.legal_portfolio_cases pc SET include_in_batch_email=false,updated_at=now() FROM legal.legal_portfolios p WHERE pc.portfolio_id=p.id AND p.client_id=:c AND pc.case_id=:i'),{'c':client_id,'i':before['case_id']})
        await db.execute(text('UPDATE legal.legal_portfolio_case_recipients SET is_active=false,updated_at=now() WHERE portfolio_case_id=:i'),{'i':case_link_id})
        for r in recipients:
            await db.execute(text('''INSERT INTO legal.legal_portfolio_case_recipients(id,portfolio_case_id,email,name,recipient_type,is_active,created_at,updated_at) VALUES(gen_random_uuid(),:i,:e,:n,:t,true,now(),now()) ON CONFLICT(portfolio_case_id,email,recipient_type) DO UPDATE SET name=EXCLUDED.name,is_active=true,updated_at=now()'''),dict(i=case_link_id,e=r['email'],n=r['name'],t=r['recipient_type']))
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
        await db.execute(text('UPDATE legal.legal_portfolio_cases SET responsible_name=:n,updated_at=now() WHERE lawyer_id=:i'),dict(n=payload.name,i=lawyer_id))
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
