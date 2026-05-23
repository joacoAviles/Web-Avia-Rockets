function aviaCleanForecast(){
  const chart=document.querySelector('.demand-chart');
  if(!chart)return;
  const card=chart.closest('.use-case-dashboard');
  if(card){card.classList.remove('forecast-focused');card.classList.add('forecast-avian');}
  let style=document.getElementById('avia-clean-forecast-style');
  if(!style){
    style=document.createElement('style');
    style.id='avia-clean-forecast-style';
    style.textContent='.forecast-avian{height:250px!important;background:radial-gradient(circle at 82% 0%,rgba(10,108,255,.24),transparent 42%),rgba(255,255,255,.035)!important}.forecast-avian .mini-dashboard-head strong{font-size:.82rem}.forecast-avian .mini-dashboard-head span{border-color:rgba(71,163,255,.38);background:rgba(10,108,255,.14);color:#cfe7ff}.forecast-avian .mini-kpi-row{grid-template-columns:1fr 1fr!important}.forecast-avian .mini-kpi{border-color:rgba(134,176,255,.18);background:rgba(255,255,255,.045);padding:.48rem}.forecast-avian .mini-kpi small{font-size:.64rem}.forecast-avian .mini-kpi b{font-size:1.05rem}.demand-chart{padding:0!important;background:linear-gradient(180deg,#071426,#0b1b32)!important;overflow:hidden;min-height:128px!important;border-radius:18px!important;border:1px solid rgba(71,163,255,.22)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.04),0 18px 42px rgba(0,0,0,.18)}.clean-forecast-svg{width:100%;height:100%;display:block}.cf-grid{stroke:rgba(134,176,255,.12);stroke-width:.8}.cf-axis{stroke:rgba(140,200,255,.45);stroke-width:1.4;stroke-linecap:round}.cf-real{fill:none;stroke:#47a3ff;stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.cf-band{fill:rgba(71,163,255,.14)}.cf-dash{fill:none;stroke:#8cc8ff;stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:8 9;animation:cfDash 1.1s linear infinite}.cf-dot{fill:#8cc8ff;stroke:#071426;stroke-width:2}@keyframes cfDash{to{stroke-dashoffset:-17}}@media(max-width:760px){.forecast-avian{height:auto!important;min-height:300px!important}.demand-chart{min-height:150px!important}}';
    document.head.appendChild(style);
  }
  if(card){
    const title=card.querySelector('.mini-dashboard-head strong');
    const pill=card.querySelector('.mini-dashboard-head span');
    if(title)title.textContent='Demanda en tiempo real';
    if(pill)pill.textContent='Live forecast';
  }
  chart.innerHTML='<svg class="clean-forecast-svg" viewBox="0 0 320 150" preserveAspectRatio="none"><line class="cf-grid" x1="46" y1="42" x2="292" y2="42"></line><line class="cf-grid" x1="46" y1="76" x2="292" y2="76"></line><line class="cf-grid" x1="46" y1="110" x2="292" y2="110"></line><line class="cf-axis" x1="46" y1="124" x2="292" y2="124"></line><line class="cf-axis" x1="46" y1="22" x2="46" y2="124"></line><polygon class="cf-band" points="162,58 198,38 234,24 276,14 276,62 234,70 198,72 162,58"></polygon><path class="cf-real" d="M 56 96 L 84 64 L 112 98 L 138 70 L 162 58"></path><path class="cf-dash" d="M 162 58 L 198 52 L 234 42 L 276 32"></path><circle class="cf-dot" r="4" cx="162" cy="58"></circle></svg>';
  const kpis=[...document.querySelectorAll('.mini-kpi')];
  const demanda=kpis.find(c=>c.querySelector('small')?.textContent.trim()==='Demanda');
  const pronostico=kpis.find(c=>c.querySelector('small')?.textContent.trim()==='Pronóstico'||c.querySelector('small')?.textContent.trim()==='Pronóstico actualizado');
  const extra=kpis.find(c=>['Volatilidad','Último dato'].includes(c.querySelector('small')?.textContent.trim()));
  if(demanda){demanda.style.display='block';const label=demanda.querySelector('small');if(label)label.textContent='Demanda';demanda.querySelector('b').textContent='1.24M';}
  if(pronostico){pronostico.style.display='block';const label=pronostico.querySelector('small');if(label)label.textContent='Pronóstico';pronostico.querySelector('b').textContent='+14%';}
  if(extra)extra.style.display='none';
}
setTimeout(aviaCleanForecast,80);
