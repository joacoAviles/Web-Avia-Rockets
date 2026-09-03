/* Client-scoped administration. Existing Causas remains read-only. */
const legalAdmin = {client:null,data:null,clients:[],selected:null,section:'cases'};
const adminEscape = value => appEscape(value ?? '');
const adminUrl = suffix => `/api/v1/legal/admin/clients/${encodeURIComponent(legalAdmin.client)}${suffix}`;
function adminOptions(rows,value,empty='Sin asignar') {
  return `<option value="">${empty}</option>`+rows.map(r=>`<option value="${adminEscape(r.id)}" ${r.id===value?'selected':''}>${adminEscape(r.name)}</option>`).join('');
}
function adminField(key,label,value,type='text',required=false) {
  return `<label><span>${label}</span><input name="${key}" type="${type}" value="${adminEscape(value)}" ${required?'required':''} ${type==='number'?'min="1800" max="2200"':''}></label>`;
}
async function appLegalAdminOpen(){
  if(appState.user?.role!=='admin') return;
  const config=document.getElementById('app-product-config');
  appSetText('app-config-title','Administración de Legal');
  document.querySelectorAll('.legal-tabs button').forEach(b=>b.classList.toggle('is-active',b.hasAttribute('data-legal-admin')));
  config.innerHTML='<p role="status">Cargando permisos y datos del cliente…</p>';
  try {
    legalAdmin.clients=await appFetch('/api/v1/legal/admin/clients');
    if(!legalAdmin.clients.length) {config.innerHTML='<p>No tienes clientes asignados para administrar.</p>';return;}
    if(!legalAdmin.clients.some(c=>c.id===legalAdmin.client)) legalAdmin.client=legalAdmin.clients[0].id;
    legalAdmin.data=await appFetch(adminUrl(''));
    adminRender();
  } catch(e){config.innerHTML=`<p role="alert">${adminEscape(e.message)}</p><button type="button" id="admin-retry" class="btn btn-secondary">Reintentar</button>`;document.getElementById('admin-retry').onclick=appLegalAdminOpen;}
}
function adminRender(){
  const config=document.getElementById('app-product-config');
  config.innerHTML=`<div class="legal-admin"><p>Edición individual para el cliente seleccionado. Los cambios no afectan a otros clientes. La identidad corregida se guarda para este cliente; no modifica la identidad global de consulta PJUD.</p>
    <label>Cliente<select id="admin-client">${adminOptions(legalAdmin.clients,legalAdmin.client,'Seleccionar cliente')}</select></label>
    <div class="legal-tabs"><button type="button" id="admin-cases-tab" class="is-active">Editar causas</button><button type="button" id="admin-lawyers-tab">Abogados</button></div>
    <p id="admin-status" role="status" aria-live="polite"></p><div id="admin-work"></div></div>`;
  document.getElementById('admin-client').onchange=async e=>{if(!e.target.value)return;legalAdmin.client=e.target.value;legalAdmin.selected=null;await appLegalAdminOpen();};
  document.getElementById('admin-cases-tab').onclick=adminCases;
  document.getElementById('admin-lawyers-tab').onclick=adminLawyers;
  if(legalAdmin.section==='lawyers') adminLawyers(); else adminCases();
}
function adminCases(){
  legalAdmin.section='cases';
  document.getElementById('admin-cases-tab').classList.add('is-active');document.getElementById('admin-lawyers-tab').classList.remove('is-active');
  document.getElementById('admin-work').innerHTML='<label>Buscar causa<input id="admin-search" type="search" placeholder="Número, año o juzgado"></label><label>Causa y asignación<select id="admin-case"></select></label><div id="admin-case-editor"></div>';
  const update=()=>{
    const q=document.getElementById('admin-search').value.toLocaleLowerCase('es');
    const rows=legalAdmin.data.causes.map(c=>({...c,...c.fields})).filter(c=>`${c.code} ${c.year} ${c.court}`.toLocaleLowerCase('es').includes(q));
    document.getElementById('admin-case').innerHTML=adminOptions(rows.map(c=>({id:c.id,name:`${c.code} / ${c.year} — ${c.court} — ${legalAdmin.data.groups.find(g=>g.id===c.portfolio_id)?.name||'Grupo inactivo'}`})),legalAdmin.selected,'Selecciona una causa');
  };
  document.getElementById('admin-search').oninput=update;update();
  document.getElementById('admin-case').onchange=e=>{legalAdmin.selected=e.target.value;adminCaseEditor();};
  if(legalAdmin.selected)adminCaseEditor();
}
function adminCaseEditor(){
  const raw=legalAdmin.data.causes.find(c=>c.id===legalAdmin.selected);
  const root=document.getElementById('admin-case-editor');if(!raw){root.innerHTML='';return;}
  const c={...raw,...raw.fields}, state=c.castigo?'castigo':c.publicada?'published':'unpublished';
  root.innerHTML=`<form id="admin-case-form"><div class="legal-admin-grid">
    ${adminField('code','Número de causa',c.code,'text',true)}${adminField('year','Año',c.year,'number',true)}${adminField('court','Juzgado',c.court,'text',true)}${adminField('title','Carátula / título',c.title)}
    ${adminField('competencia','Competencia',c.competencia)}${adminField('corte','Corte',c.corte)}${adminField('tipo','Tipo',c.tipo)}
    <label>Grupo de correo<select name="portfolio_id" required>${adminOptions(legalAdmin.data.groups,c.portfolio_id,'Seleccionar grupo')}</select></label>
    <label>Abogado asignado<select name="lawyer_id">${adminOptions(legalAdmin.data.lawyers,c.lawyer_id)}</select></label>
    <label>Estado de este cliente<select name="publication"><option value="${state}">${state==='castigo'?'Castigada':state==='published'?'Publicada':'No publicada'}</option>${state==='published'?'<option value="castigo">Castigar para este cliente</option>':''}</select></label>
    <label>Asignación<select name="assignment_status">${['active','paused','archived'].map((s,i)=>`<option value="${s}" ${c.assignment_status===s?'selected':''}>${['Activa','Pausada','Archivada'][i]}</option>`).join('')}</select></label>
    <label>Prioridad<select name="priority">${['low','normal','high','urgent'].map((s,i)=>`<option value="${s}" ${c.priority===s?'selected':''}>${['Baja','Normal','Alta','Urgente'][i]}</option>`).join('')}</select></label>
    ${['quick_note','client_comment','private_note'].map((k,i)=>`<label>${['Nota','Comentario del cliente','Nota privada'][i]}<textarea name="${k}" maxlength="5000">${adminEscape(c[k])}</textarea></label>`).join('')}</div>
    <fieldset><legend>Quién puede ver / destinatarios de esta asignación</legend><p>Solo contactos existentes del cliente. Esta lista también define los destinatarios individuales de correo.</p><div class="legal-admin-recipients">${legalAdmin.data.recipients.map(r=>`<label><input type="checkbox" name="recipient_ids" value="${r.id}" ${(c.recipient_ids||[]).includes(r.id)?'checked':''}>${adminEscape(r.name||r.email)} — ${adminEscape(r.email)} (${adminEscape(r.recipient_type)})</label>`).join('')||'No hay contactos registrados.'}</div></fieldset>
    <p>Castigo afecta únicamente a este cliente y excluye la causa de sus correos por lote. No permite publicar ni rehabilitar manualmente una causa.</p>
    <button type="submit" class="btn btn-primary">Guardar esta causa</button></form>`;
  document.getElementById('admin-case-form').onsubmit=async e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);const payload=Object.fromEntries(f.entries());payload.recipient_ids=f.getAll('recipient_ids');payload.year=Number(payload.year);payload.version=c.version;payload.lawyer_id=payload.lawyer_id||null;
    if(!confirm(payload.publication==='castigo'&&!c.castigo?'¿Guardar los cambios y castigar esta causa solo para este cliente?':'¿Guardar los cambios de esta causa para este cliente?'))return;
    await adminSave(e.currentTarget,()=>appFetch(adminUrl(`/cases/${c.id}`),{method:'PUT',body:JSON.stringify(payload)}),'Causa guardada.');
  };
}
async function adminSave(form,operation,message){
  const buttons=form.querySelectorAll('button');buttons.forEach(b=>b.disabled=true);
  try{await operation();await appReload();await appLegalAdminOpen();document.getElementById('admin-status').textContent=message;}
  catch(e){document.getElementById('admin-status').textContent=e.message||'No se pudieron guardar los cambios.';buttons.forEach(b=>b.disabled=false);}
}
function adminLawyers(){
  legalAdmin.section='lawyers';
  document.getElementById('admin-cases-tab').classList.remove('is-active');document.getElementById('admin-lawyers-tab').classList.add('is-active');
  document.getElementById('admin-work').innerHTML=`<label>Abogado<select id="admin-lawyer">${adminOptions(legalAdmin.data.lawyers,'','Crear abogado')}</select></label><div id="admin-lawyer-editor"></div>`;
  const edit=()=>{
    const id=document.getElementById('admin-lawyer').value,l=legalAdmin.data.lawyers.find(r=>r.id===id);
    document.getElementById('admin-lawyer-editor').innerHTML=`<form id="admin-lawyer-form"><div class="legal-admin-grid">${adminField('name','Nombre',l?.name,'text',true)}${adminField('email','Correo',l?.email,'email')}</div><p>Este registro no crea ni elimina cuentas de acceso a la web.</p><button type="submit" class="btn btn-primary">${l?'Guardar abogado':'Crear abogado'}</button>${l?'<button type="button" id="admin-delete-lawyer" class="btn btn-secondary">Borrar abogado</button>':''}</form>`;
    const form=document.getElementById('admin-lawyer-form');
    form.onsubmit=async e=>{e.preventDefault();const f=new FormData(form);await adminSave(form,()=>appFetch(adminUrl('/lawyers'+(id?'/'+id:'')),{method:id?'PUT':'POST',body:JSON.stringify({name:f.get('name'),email:f.get('email')||null,version:l?.version||1})}),'Abogado guardado.');};
    document.getElementById('admin-delete-lawyer')?.addEventListener('click',async()=>{if(confirm(`¿Borrar a ${l.name}? Si tiene causas asignadas, primero deberás reasignarlas.`))await adminSave(form,()=>appFetch(adminUrl(`/lawyers/${id}`),{method:'DELETE'}),'Abogado borrado.');});
  };document.getElementById('admin-lawyer').onchange=edit;edit();
}
