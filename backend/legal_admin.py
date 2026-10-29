"""Individual, client-scoped legal administration. No global publication writes."""
import json
import re
from datetime import datetime
from zoneinfo import ZoneInfo
from uuid import UUID
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from app.api.deps import current_user
from app.core.database import get_db

router = APIRouter(prefix='/api/v1/legal/admin', tags=['legal-admin'])

SCRAPPERS_ADMIN_EMAIL = 'admin@aviarockets.cl'
SCRAPPER_COMMANDS = (
    {
        'id': 'assigned-unpublished',
        'title': 'Asignadas no publicadas',
        'description': (
            'Revisa las causas activas asignadas que todavía no están publicadas. '
            'Varios computadores comparten la misma cola diaria sin repetir causas.'
        ),
        'command': (
            'await(async()=>{const r=await fetch("https://api.aviarockets.cl/api/v1/'
            'pjud-distributed/bootstrap-asignadas.js?v="+Date.now(),{cache:"no-store"});'
            'if(!r.ok)throw new Error("Bootstrap asignadas HTTP "+r.status);'
            'for(const k of["PJUD_ROCKET","PJUD_FORM_SEQUENCER_V5",'
            '"PJUD_DETAIL_EXTRACTOR_V5","PJUD_RUNNER_ASIGNADAS",'
            '"PJUD_ROCKET_ASIGNADAS"])window[k]=undefined;(0,eval)(await r.text());'
            'if(!window.PJUD_ROCKET_ASIGNADAS)throw new Error('
            '"PJUD_ROCKET_ASIGNADAS no quedó cargado");return await '
            'window.PJUD_ROCKET_ASIGNADAS.run({maxCausas:0})})()'
        ),
    },
    {
        'id': 'published-daily',
        'title': 'Causas publicadas',
        'description': (
            'Revisa la cola diaria de causas publicadas y, al terminar, ofrece la '
            'auditoría de consistencia entre PJUD y la base de AVIA.'
        ),
        'command': (
            'await(async()=>{const r=await fetch("https://api.aviarockets.cl/api/v1/'
            'pjud-distributed/bootstrap-daily.js?v="+Date.now(),{cache:"no-store"});'
            'if(!r.ok)throw new Error("Bootstrap diario HTTP "+r.status);'
            'for(const k of["PJUD_ROCKET","PJUD_FORM_SEQUENCER_V5",'
            '"PJUD_DETAIL_EXTRACTOR_V5","PJUD_RUNNER_DAILY","PJUD_DAILY"])'
            'window[k]=undefined;(0,eval)(await r.text());if(!window.PJUD_DAILY)'
            'throw new Error("PJUD_DAILY no quedó cargado");return await '
            'window.PJUD_DAILY.run({maxCausas:0,preguntarConsistencia:true})})()'
        ),
    },
)

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
    court: str = Field(default="",max_length=255)
    competencia: str | None = None
    tipo: str | None = None
    portfolio_id: UUID
    lawyer_id: UUID | None = None
    corte: str | None = Field(default=None, max_length=255)
    publication: Literal['published','unpublished','castigo']

class CauseAssignInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    code: str = Field(min_length=1, max_length=60)
    year: int = Field(ge=1800, le=2200)
    court: str = Field(default="", max_length=255)
    competencia: str | None = None
    tipo: str | None = None
    corte: str = Field(default="", max_length=255)
    portfolio_id: UUID
    lawyer_id: UUID | None = None

class PortfolioCcInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    name: str | None = Field(default=None, max_length=200)
    email: str = Field(min_length=3, max_length=254, pattern=r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

def require_admin(user):
    access=user.product_access or {}
    if user.role != 'admin' or not user.is_active or not any(access.get(k) in (True,1) for k in ('legal','causes')):
        raise HTTPException(403,'Acceso reservado al administrador de Legal')


def require_scrappers_admin(user):
    email = str(getattr(user, 'email', '') or '').strip().casefold()
    if (
        getattr(user, 'role', None) != 'admin'
        or not getattr(user, 'is_active', False)
        or email != SCRAPPERS_ADMIN_EMAIL
    ):
        raise HTTPException(403, 'Acceso reservado a admin@aviarockets.cl')


@router.get('/scrappers')
async def scrappers(
    response: Response,
    user=Depends(current_user),
):
    require_scrappers_admin(user)
    response.headers['Cache-Control'] = 'private, no-store'
    return {
        'title': 'Scrappers PJUD',
        'instructions': (
            'Abre Consulta Unificada en PJUD, abre DevTools > Console y pega '
            'el comando correspondiente.'
        ),
        'commands': SCRAPPER_COMMANDS,
    }

async def authorize(db,user,client_id):
    require_admin(user)
    ok=(await db.execute(text('SELECT 1 FROM legal.client_administrators WHERE client_id=:c AND user_id=:u'),{'c':client_id,'u':user.id})).scalar()
    if not ok: raise HTTPException(403,'Sin autorización para este cliente')

def validate_transition(was_castigo,published,target):
    current='castigo' if was_castigo else ('published' if published else 'unpublished')
    restored='published' if published else 'unpublished'
    allowed=target==current or (current=='published' and target=='castigo') or (current=='castigo' and target==restored)
    if not allowed:
        raise HTTPException(422,'Solo se permite castigar una causa publicada o revertir su castigo. No se permite publicar manualmente.')

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
    from app.api.pjud_distributed import _corte_por_tribunal
    court_rows=await rows("SELECT DISTINCT court FROM legal.causes WHERE court IS NOT NULL ORDER BY court")
    courts=[{'name':r['court'],'corte':_corte_por_tribunal(r['court'])} for r in court_rows]
    return dict(
        catalogs={'years':list(range(datetime.now(ZoneInfo('America/Santiago')).year,1899,-1)),
                  'courts':courts,'cortes':sorted({r['corte'] for r in courts if r['corte']})},
        lawyers=await rows('SELECT * FROM legal.client_lawyers WHERE client_id=:c ORDER BY name'),
        groups=await rows("SELECT id,name FROM legal.legal_portfolios WHERE client_id=:c AND status='active' ORDER BY display_order,name"),
        portfolio_cc=await rows("""SELECT r.id,r.portfolio_id,r.email,r.name,r.display_order
          FROM legal.legal_portfolio_recipients r
          JOIN legal.legal_portfolios p ON p.id=r.portfolio_id
          WHERE p.client_id=:c AND p.status='active' AND r.recipient_type='cc' AND r.is_active
          ORDER BY p.display_order,r.display_order,lower(r.email)"""),
        causes=await rows("""SELECT pc.id,pc.case_id,pc.portfolio_id,pc.lawyer_id,
          CASE WHEN COALESCE(c.pjud_tipo,'C') IN ('C','') THEN c.rol ELSE c.pjud_tipo||'-'||c.rol END AS code,c.year,c.court,pc.corte,pc.competencia,c.pjud_tipo AS tipo,c.party AS title,c.publicada,
          COALESCE(s.castigo,false) AS castigo,COALESCE(s.version,0) AS version,COALESCE(s.fields,'{}'::jsonb) AS fields
          FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
          JOIN legal.causes c ON c.id=pc.case_id
          LEFT JOIN legal.client_cause_settings s ON s.client_id=p.client_id AND s.cause_id=c.id
          WHERE p.client_id=:c AND p.status='active' AND pc.status='active' ORDER BY c.publicada DESC,c.year DESC,c.rol"""))

@router.post('/clients/{client_id}/portfolios/{portfolio_id}/cc',status_code=201)
async def add_portfolio_cc(client_id:UUID,portfolio_id:UUID,payload:PortfolioCcInput,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    portfolio=(await db.execute(text("SELECT id FROM legal.legal_portfolios WHERE id=:p AND client_id=:c AND status='active' FOR SHARE"),dict(p=portfolio_id,c=client_id))).scalar()
    if not portfolio: raise HTTPException(404,'Portafolio no encontrado para este cliente')
    email=payload.email.lower()
    old=(await db.execute(text("SELECT * FROM legal.legal_portfolio_recipients WHERE portfolio_id=:p AND lower(trim(email))=:e AND recipient_type='cc' FOR UPDATE"),dict(p=portfolio_id,e=email))).mappings().first()
    try:
        if old:
            rid=old['id']
            await db.execute(text("UPDATE legal.legal_portfolio_recipients SET email=:e,name=:n,is_active=true,updated_at=now() WHERE id=:i"),dict(e=email,n=payload.name or None,i=rid))
            action='portfolio_cc.reactivate' if not old['is_active'] else 'portfolio_cc.update'
        else:
            rid=(await db.execute(text("""INSERT INTO legal.legal_portfolio_recipients
              (id,portfolio_id,email,name,recipient_type,is_active,display_order,created_at,updated_at)
              SELECT gen_random_uuid(),:p,:e,:n,'cc',true,COALESCE(MAX(display_order),-1)+1,now(),now()
              FROM legal.legal_portfolio_recipients WHERE portfolio_id=:p RETURNING id"""),dict(p=portfolio_id,e=email,n=payload.name or None))).scalar_one()
            action='portfolio_cc.create'
        after={'id':str(rid),'portfolio_id':str(portfolio_id),'email':email,'name':payload.name or None,'recipient_type':'cc','is_active':True}
        await audit(db,user,client_id,rid,action,dict(old) if old else None,after)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409,'Este correo ya está registrado como CC del portafolio')
    return {'id':str(rid)}

@router.delete('/clients/{client_id}/portfolios/{portfolio_id}/cc/{recipient_id}')
async def remove_portfolio_cc(client_id:UUID,portfolio_id:UUID,recipient_id:UUID,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    old=(await db.execute(text("""SELECT r.* FROM legal.legal_portfolio_recipients r
      JOIN legal.legal_portfolios p ON p.id=r.portfolio_id
      WHERE r.id=:i AND r.portfolio_id=:p AND p.client_id=:c AND p.status='active'
        AND r.recipient_type='cc' AND r.is_active FOR UPDATE OF r"""),dict(i=recipient_id,p=portfolio_id,c=client_id))).mappings().first()
    if not old: raise HTTPException(404,'Destinatario CC no encontrado para este portafolio')
    await db.execute(text('UPDATE legal.legal_portfolio_recipients SET is_active=false,updated_at=now() WHERE id=:i'),{'i':recipient_id})
    await audit(db,user,client_id,recipient_id,'portfolio_cc.remove',dict(old),dict(old)|{'is_active':False})
    await db.commit()
    return {'ok':True}

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
    validate_pjud_form(payload)
    fields=dict(settings['fields']) | {k:getattr(payload,k) for k in ['code','year','court']}
    if payload.corte: fields['corte']=payload.corte
    if payload.competencia:
        fields['competencia']=payload.competencia
        fields['tipo']=payload.tipo
        fields['code']=((payload.tipo+'-') if payload.tipo and payload.tipo!='C' else '')+payload.code
    lawyer_name=lawyer['name'] if lawyer else None
    lawyer_email=lawyer['email'] if lawyer else None
    try:
        await db.execute(text('UPDATE legal.client_cause_settings SET fields=CAST(:f AS jsonb),castigo=:s,version=version+1 WHERE client_id=:c AND cause_id=:i'),{'f':json.dumps(fields),'s':payload.publication=='castigo','c':client_id,'i':before['case_id']})
        await db.execute(text('''UPDATE legal.legal_portfolio_cases SET portfolio_id=:p,lawyer_id=:l,responsible_name=:n,corte=COALESCE(:corte,corte),settings=COALESCE(settings,'{}'::jsonb)||CAST(:flags AS jsonb),updated_at=now() WHERE id=:i'''),dict(p=group,l=payload.lawyer_id,n=lawyer_name,i=case_link_id,corte=payload.corte,flags=json.dumps({'admin_lawyer_edited':True,'assigned_lawyer_email':lawyer_email})))
        await sync_assigned_contact(db,case_link_id,(before['settings'] or {}).get('assigned_lawyer_email'),lawyer_email,lawyer_name)
        await db.execute(text('UPDATE legal.legal_portfolio_cases pc SET include_in_batch_email=:enabled,updated_at=now() FROM legal.legal_portfolios p WHERE pc.portfolio_id=p.id AND p.client_id=:c AND pc.case_id=:i'),{'enabled':payload.publication!='castigo','c':client_id,'i':before['case_id']})
        await audit(db,user,client_id,case_link_id,'case.update',dict(before)|dict(settings),payload.model_dump())
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409,'La asignación ya existe en ese grupo. No se guardaron cambios.')
    return {'ok':True}

def validate_pjud_form(payload):
    if not payload.competencia: return
    from pathlib import Path
    cat=json.loads(Path(__file__).with_name('pjud-catalog.json').read_text())
    comp=next((c for c in cat['competencias'] if c['name']==payload.competencia),None)
    if not comp: raise HTTPException(422,'Selecciona una competencia válida.')
    branch=cat['branches'][comp['id']]
    if branch.get('available') is False: raise HTTPException(422,branch['notice'])
    if comp['id']=='1':
        payload.corte='Corte Suprema';payload.court='Corte Suprema';payload.tipo=''
    else:
        corte=next((c for c in branch['cortes'] if c['name']==payload.corte),None)
        if not corte: raise HTTPException(422,'Selecciona una corte válida.')
        if comp['id']=='2': payload.court=payload.corte;payload.tipo=''
        else:
            if payload.court not in {t['name'] for t in branch['tribunales'][corte['id']]}: raise HTTPException(422,'El tribunal no corresponde a la competencia y corte seleccionadas.')
            if payload.tipo not in {t['id'] for t in branch['tipos']}: raise HTTPException(422,'Selecciona un tipo de libro válido.')
    if not re.fullmatch(r'[0-9]+',payload.code): raise HTTPException(422,'El rol debe contener solo números.')

@router.post('/clients/{client_id}/cases',status_code=201)
async def assign_case(client_id:UUID,payload:CauseAssignInput,user=Depends(current_user),db=Depends(get_db)):
    """Assign an existing global cause, or create it unpublished when it does not exist."""
    validate_pjud_form(payload)
    await authorize(db,user,client_id)
    portfolio=(await db.execute(text("SELECT id FROM legal.legal_portfolios WHERE id=:p AND client_id=:c AND status='active' FOR SHARE"),dict(p=payload.portfolio_id,c=client_id))).scalar()
    if not portfolio: raise HTTPException(422,'Grupo ajeno al cliente o inactivo')
    lawyer=None
    if payload.lawyer_id:
        lawyer=(await db.execute(text('SELECT id,name,email FROM legal.client_lawyers WHERE id=:i AND client_id=:c FOR SHARE'),dict(i=payload.lawyer_id,c=client_id))).mappings().first()
        if not lawyer: raise HTTPException(422,'Abogado ajeno al cliente')
    match=re.fullmatch(r'(?:(C|V)-)?([0-9]+)(?:-([0-9]{4}))?',payload.code.strip().upper())
    if not match or (match[3] and int(match[3])!=payload.year):
        raise HTTPException(422,'Número inválido: indica número o C-/V-número y el año correspondiente')
    tipo=payload.tipo if payload.competencia else (match[1] or 'C')
    competencia=payload.competencia or 'Civil'
    code=str(int(match[2]))
    organization_id=(await db.execute(text('SELECT organization_id FROM legal.legal_clients WHERE id=:c'),{'c':client_id})).scalar_one()
    cause=(await db.execute(text("""SELECT * FROM legal.causes
      WHERE organization_id=:o AND year=:y
        AND regexp_replace(upper(trim(rol)),'^C-','','i')=:r
        AND regexp_replace(lower(trim(court)),'[º°ª]','','g')=regexp_replace(lower(trim(:court)),'[º°ª]','','g')
      ORDER BY created_at LIMIT 1 FOR UPDATE"""),dict(o=organization_id,y=payload.year,r=code,court=payload.court))).mappings().first()
    if cause and ((cause['pjud_tipo'] or ('C' if competencia=='Civil' else ''))!=tipo or (cause['pjud_competencia'] or 'Civil')!=competencia):
        raise HTTPException(409,'Existe otro tipo de causa con ese número, año y juzgado; requiere revisión de identidad')
    created=False
    try:
        if not cause:
            cause=(await db.execute(text("""INSERT INTO legal.causes
              (id,organization_id,court,rol,year,status,created_at,updated_at,public_visibility_status,publicada,pjud_tipo,pjud_corte,pjud_competencia)
              VALUES(gen_random_uuid(),:o,:court,:r,:y,'active',now(),now(),'hidden',false,:tipo,:corte,:competencia)
              RETURNING *"""),dict(o=organization_id,court=payload.court,r=code,y=payload.year,tipo=tipo,corte=payload.corte,competencia=competencia))).mappings().one()
            created=True
        flags={'admin_assigned':True,'assigned_lawyer_email':lawyer['email'] if lawyer else None}
        link_id=(await db.execute(text("""INSERT INTO legal.legal_portfolio_cases
          (portfolio_id,case_id,corte,competencia,responsible_name,include_in_batch_email,status,settings,lawyer_id,created_at,updated_at)
          VALUES(:p,:case,:corte,:competencia,:name,true,'active',CAST(:settings AS jsonb),:lawyer,now(),now())
          ON CONFLICT(portfolio_id,case_id) DO UPDATE SET status='active',include_in_batch_email=true,
          lawyer_id=EXCLUDED.lawyer_id,responsible_name=EXCLUDED.responsible_name,corte=EXCLUDED.corte,
          settings=legal.legal_portfolio_cases.settings||EXCLUDED.settings,updated_at=now()
          WHERE legal.legal_portfolio_cases.status='archived' RETURNING id"""),dict(
            p=payload.portfolio_id,case=cause['id'],corte=payload.corte,competencia=competencia,name=lawyer['name'] if lawyer else None,
            settings=json.dumps(flags),lawyer=payload.lawyer_id))).scalar_one_or_none()
        if not link_id: raise HTTPException(409,'Esta causa ya está asignada al grupo seleccionado.')
        await db.execute(text('INSERT INTO legal.client_cause_settings(client_id,cause_id,version) VALUES (:c,:i,0) ON CONFLICT DO NOTHING'),dict(c=client_id,i=cause['id']))
        if lawyer and lawyer['email']:
            await db.execute(text("""INSERT INTO legal.legal_portfolio_case_recipients
              (id,portfolio_case_id,email,name,recipient_type,is_active,created_at,updated_at)
              VALUES(gen_random_uuid(),:i,:email,:name,'to',true,now(),now())
              ON CONFLICT(portfolio_case_id,email,recipient_type) DO UPDATE SET name=EXCLUDED.name,is_active=true,updated_at=now()"""),dict(i=link_id,email=lawyer['email'].lower(),name=lawyer['name']))
        after={'id':str(link_id),'case_id':str(cause['id']),'code':code,'year':payload.year,'court':payload.court,
               'corte':payload.corte,'portfolio_id':str(payload.portfolio_id),'lawyer_id':str(payload.lawyer_id) if payload.lawyer_id else None,
               'global_cause_created':created,'publicada':False if created else cause['publicada']}
        await audit(db,user,client_id,link_id,'case.assign',None,after)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(409,'Esta causa ya está asignada al grupo seleccionado.')
    return after

@router.delete('/clients/{client_id}/cases/{case_link_id}')
async def unassign_case(client_id:UUID,case_link_id:UUID,user=Depends(current_user),db=Depends(get_db)):
    await authorize(db,user,client_id)
    old=(await db.execute(text('''SELECT pc.*,c.rol,c.year,c.court FROM legal.legal_portfolio_cases pc
      JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id JOIN legal.causes c ON c.id=pc.case_id
      WHERE pc.id=:i AND p.client_id=:c FOR UPDATE OF pc'''),{'i':case_link_id,'c':client_id})).mappings().first()
    if not old: raise HTTPException(404,'Causa no asignada a este cliente')
    await audit(db,user,client_id,case_link_id,'case.unassign',dict(old),None)
    await db.execute(text("UPDATE legal.legal_portfolio_cases SET status='archived',include_in_batch_email=false,updated_at=now() WHERE id=:i"),{'i':case_link_id})
    if str(client_id)=='386e1669-4298-419b-895a-cf67be3edf39':
        await db.execute(text('''UPDATE legal.cause_assignments a SET assignment_status='inactive',
          valid_until=CURRENT_DATE-1,updated_at=now()
          WHERE a.cause_id=:case AND a.assignment_status='active'
          AND NOT EXISTS(SELECT 1 FROM legal.legal_portfolio_cases pc JOIN legal.legal_portfolios p ON p.id=pc.portfolio_id
            WHERE pc.case_id=:case AND pc.status='active' AND p.status='active')
          AND a.procurador_user_id IN (SELECT id FROM platform.users WHERE lower(email) IN
            (SELECT lower(email) FROM legal.client_lawyers WHERE client_id=:client
             UNION SELECT 'procurador@asesoriasnow.cl' UNION SELECT 'pasante@asesoriasnow.cl'))'''),
          {'case':old['case_id'],'client':client_id})
    await db.commit()
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
