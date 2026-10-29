/* Official public-query catalog, captured from PJUD. Names are preserved verbatim. */
let pjudCatalogPromise;
function pjudLoadCatalog(){return pjudCatalogPromise||(pjudCatalogPromise=fetch('pjud-catalog.json?v=20261029',{cache:'no-cache'}).then(r=>{if(!r.ok)throw new Error('No pudimos cargar los tribunales.');return r.json();}));}
function adminCaseCatalogs(value={}){
  return `<label><span>Competencia</span><select name="competencia" required></select></label><label><span>Corte</span><select name="corte" required></select></label><label><span>Tribunal</span><select name="court" required></select></label><label><span>Tipo libro</span><select name="tipo" required></select></label>${adminField('code','Rol',String(value.code||'').replace(/^[^-]+-/,'').replace(/-\d{4}$/,''),'text',true)}${adminSelect('year','Año',(legalAdmin.data.catalogs||{}).years||[],value.year||'')}<p class="pjud-form-notice" role="status"></p>`;
}
function pjudNameKey(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/corte de apelaciones de|c\.a\. de/g,'').replace(/[º°ª]/g,'').replace(/\s+/g,' ').trim();}
async function adminBindCourts(form){
  const submit=form.querySelector('[type="submit"]');if(submit)submit.disabled=true;
  const raw=legalAdmin.data.causes.find(x=>x.id===legalAdmin.selected),value=form.id==='admin-case-form'?{...raw,...raw?.fields}:{};
  try{
    const cat=await pjudLoadCatalog(),el=form.elements,notice=form.querySelector('.pjud-form-notice');
    const fill=(select,rows,selected,placeholder)=>{select.innerHTML=adminOptions(rows,selected,placeholder);select.disabled=false;};
    const match=(rows,v)=>rows.find(x=>pjudNameKey(x.name)===pjudNameKey(v));
    fill(el.competencia,cat.competencias.map(x=>({id:x.name,name:x.name})),value.competencia||'Civil','Seleccionar competencia');
    function updateTribunal(initial){
      const comp=cat.competencias.find(x=>x.name===el.competencia.value),b=cat.branches[comp?.id];if(!b)return;
      const co=b.cortes.find(x=>x.name===el.corte.value);const rows=b.tribunales[co?.id]||[];
      fill(el.court,rows.map(x=>({id:x.name,name:x.name})),initial?match(rows,value.court)?.name||'':'','Seleccionar tribunal');
      if(b.tribunal_disabled){el.court.innerHTML='<option value="">No corresponde</option>';el.court.disabled=true;}
    }
    function update(initial){
      const comp=cat.competencias.find(x=>x.name===el.competencia.value),b=cat.branches[comp?.id];if(!b)return;
      fill(el.corte,b.cortes.map(x=>({id:x.name,name:x.name})),initial?match(b.cortes,value.corte)?.name||'':'','Seleccionar corte');
      fill(el.tipo,b.tipos.map(x=>({id:x.id,name:x.name})),initial?(value.tipo||(/^[A-Z]+-/.test(value.code||'')?value.code.split('-')[0]:'C')):'','Seleccionar tipo libro');
      el.tipo.disabled=!!b.tipo_disabled;
      if(b.tipo_disabled)el.tipo.innerHTML='<option value="">No corresponde</option>';
      if(b.corte_disabled){el.corte.innerHTML='<option value="">No corresponde</option>';el.corte.disabled=true;}
      notice.textContent=b.notice||'';if(submit)submit.disabled=b.available===false;
      updateTribunal(initial);
      if(initial&&value.court&&!b.tribunal_disabled&&!el.court.value)notice.textContent='Selecciona el tribunal para actualizar su nombre al catálogo PJUD.';
    }
    el.competencia.onchange=()=>update(false);el.corte.onchange=()=>updateTribunal(false);update(true);
  }catch(err){form.querySelector('.pjud-form-notice').textContent=err.message;}
}
