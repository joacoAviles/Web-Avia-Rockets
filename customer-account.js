/* Account information is loaded from authenticated storage, never inferred from UI roles. */
async function appRenderSettingsPanel(){
  appSetText('app-view-label','Tu espacio AVIA');
  appSetText('app-product-title','Mi cuenta');
  appSetText('app-product-description','Tus productos, preferencias y beneficios.');
  appSetText('app-config-title','');
  document.getElementById('app-product-demo').innerHTML='';
  const root=document.getElementById('app-product-config');
  root.innerHTML='<p role="status">Cargando tu cuenta…</p>';
  document.querySelector('.app-stats').hidden=true;
  try {
    const a=await appFetch('/api/account');
    if(appState.view!=='settings')return;
    const e=appEscape,r=a.referrals,p=a.preferences||{},sub=a.subscription||{};
    document.documentElement.setAttribute('data-theme',p.theme||'dark');
    const plan={free:'Gratuito',standard:'Estándar',pro:'Pro'}[sub.plan_code]||sub.plan_code||'Sin plan registrado';
    const status={active:'Activo',cancelled:'Cancelado',paused:'Pausado',past_due:'Pago pendiente'}[sub.status]||'Sin información';
    root.innerHTML=`<div class="customer-account">
      <section class="account-block"><p class="eyebrow">Datos personales</p><h2>${e(a.name||'Tu cuenta')}</h2><p>${e(a.email)}</p></section>
      <section class="account-block"><h2>Mis productos</h2><div class="account-products">${a.products.map(x=>`<article><h3>${e(x.name)}</h3><p>${p.customer_type==='company'?'Para empresas':p.customer_type==='person'?'Para personas':'Selecciona tu perfil en Preferencias'}</p><span class="account-badge">Acceso habilitado</span></article>`).join('')||'<p>Aún no tienes productos activos.</p>'}</div><dl class="account-facts"><div><dt>Plan de tu cuenta</dt><dd>${e(plan)}</dd></div><div><dt>Suscripción</dt><dd>${e(status)}</dd></div><div><dt>Método de pago</dt><dd>${e(a.payment_method||'Sin método registrado')}</dd></div></dl></section>
      <section class="account-block"><h2>Invita y gana años gratis</h2><p>Por cada persona que use tu código y haga su primer pago, ganas un año de seguimiento de una causa. Acumúlalos y repártelos entre tus causas.</p>
        <div class="account-referral-code">${r.code?`<strong>${e(r.code)}</strong><button type="button" class="btn btn-secondary" id="referral-copy">Copiar código</button>`:'<button type="button" class="btn btn-primary" id="referral-create">Crear mi código</button>'}</div>
        <dl class="account-facts"><div><dt>Años disponibles</dt><dd>${r.available}</dd></div><div><dt>Años ganados</dt><dd>${r.earned}</dd></div><div><dt>Invitados pendientes de pago</dt><dd>${r.pending}</dd></div></dl>
        ${r.available?`<form id="referral-allocate"><label>Causa<select name="cause_id" required><option value="">Selecciona una causa</option>${appState.causes.map(c=>`<option value="${e(c.id)}">${e(c.code)} / ${e(c.year)} · ${e(c.court)}</option>`).join('')}</select></label><label>Años<input name="years" type="number" min="1" max="${r.available}" value="1" required></label><button class="btn btn-primary">Aplicar años</button><p>Los años aplicados quedan asociados a la causa elegida.</p></form>`:''}
        ${r.allocations.length?`<h3>Tus causas con beneficio</h3>${r.allocations.map(x=>`<p><strong>${e(x.rol)} / ${x.year}</strong> · ${e(x.court)}<br>Hasta ${e(appFormatDate(x.ends_on))}</p>`).join('')}`:''}
        <details><summary>Tengo un código de invitación</summary><p>Solo para cuentas nuevas. Ingresa tu código antes de tu primer pago. Puedes usar uno.</p><form id="referral-redeem"><label>Código<input name="code" required minlength="8" maxlength="32" autocomplete="off"></label><button class="btn btn-secondary">Registrar código</button></form></details>
      </section>
      <section class="account-block"><h2>Preferencias</h2><form id="customer-preferences"><label>Mi perfil<select name="customer_type"><option value="">Seleccionar</option><option value="person" ${p.customer_type==='person'?'selected':''}>Persona</option><option value="company" ${p.customer_type==='company'?'selected':''}>Empresa</option></select></label><label>Apariencia<select name="theme"><option value="dark" ${p.theme==='dark'?'selected':''}>Oscuro</option><option value="light" ${p.theme==='light'?'selected':''}>Claro</option></select></label><button class="btn btn-primary">Guardar preferencias</button></form></section>
      <section class="account-block"><h2>Ayuda</h2><p><a href="index.html#contact">Contactar a AVIA</a></p></section>
      <p id="cause-action-output" role="status" aria-live="polite" class="app-query-output" style="display:none"></p></div>`;
    const action=async(button,fn,message)=>{button.disabled=true;try{await fn();await appRenderSettingsPanel();appShow(message);}catch(err){button.disabled=false;appShow(err.message||'No se pudo guardar.',true);}};
    document.getElementById('referral-create')?.addEventListener('click',ev=>action(ev.currentTarget,()=>appFetch('/api/account/referrals/code',{method:'POST'}),'Tu código está listo.'));
    document.getElementById('referral-copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(r.code);appShow('Código copiado.');}catch(_){appShow('Selecciona el código para copiarlo.');}});
    document.getElementById('referral-redeem').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget);action(ev.submitter,()=>appFetch('/api/account/referrals/redeem',{method:'POST',body:JSON.stringify({code:f.get('code')})}),'Código registrado. El beneficio se activa con tu primer pago.');};
    document.getElementById('referral-allocate')?.addEventListener('submit',ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget);const payload={cause_id:f.get('cause_id'),years:Number(f.get('years')),request_id:ev.currentTarget.dataset.requestId||(ev.currentTarget.dataset.requestId=crypto.randomUUID())};if(!confirm(`¿Aplicar ${payload.years} año(s) a esta causa?`))return;action(ev.submitter,()=>appFetch('/api/account/referrals/allocate',{method:'POST',body:JSON.stringify(payload)}),'Años aplicados a tu causa.');});
    document.getElementById('customer-preferences').onsubmit=ev=>{ev.preventDefault();const f=new FormData(ev.currentTarget);action(ev.submitter,async()=>{await appFetch('/api/account/settings',{method:'PATCH',body:JSON.stringify({theme:f.get('theme'),customer_type:f.get('customer_type')||null})});document.documentElement.setAttribute('data-theme',f.get('theme'));},'Preferencias guardadas.');};
  }catch(err){root.innerHTML=`<p role="alert">${appEscape(err.message||'No pudimos cargar tu cuenta. Intenta nuevamente.')}</p>`;}
}
