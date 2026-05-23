function aviaCleanForecast(){
  const chart=document.querySelector('.demand-chart');
  if(!chart)return;
  const card=chart.closest('.use-case-dashboard');
  if(card){card.classList.remove('forecast-avian');card.classList.add('forecast-focused');}
  let style=document.getElementById('avia-clean-forecast-style');
  if(!style){
    style=document.createElement('style');
    style.id='avia-clean-forecast-style';
    style.textContent='.forecast-focused{height:320px!important;padding:1rem!important;background:radial-gradient(circle at 80% 0%,rgba(10,108,255,.18),transparent 40%),rgba(255,255,255,.035)!important}.forecast-focused .mini-dashboard-head strong{font-size:.92rem}.forecast-focused .mini-dashboard-head span{border-color:rgba(71,163,255,.42);background:rgba(10,108,255,.16);color:#cfe7ff}.forecast-focused .mini-kpi-row{grid-template-columns:1fr!important}.forecast-focused .mini-kpi{padding:.7rem .85rem;border-radius:18px;background:rgba(255,255,255,.055);border-color:rgba(134,176,255,.22)}.forecast-focused .mini-kpi small{font-size:.72rem;letter-spacing:.02em}.forecast-focused .mini-kpi b{font-size:1.35rem;letter-spacing:.02em}.demand-chart{padding:0!important;background:linear-gradient(180deg,#f8fbff,#eef4fb)!important;overflow:hidden;min-height:190px!important;border-radius:22px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.52),0 18px 48px rgba(0,0,0,.18)}.clean-forecast-svg{width:100%;height:100%;display:block}.cf-axis{stroke:#38f39a;stroke-width:5;stroke-linecap:round}.cf-real{fill:none;stroke:#ff7a1a;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;transition:d .75s ease}.cf-band{fill:rgba(255,48,64,.18);transition:points .75s ease}.cf-dash{fill:none;stroke:#ff2b2b;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:14 18;transition:d .75s ease;animation:cfDash 1.1s linear infinite}.cf-dot{fill:#ff2b2b;stroke:#fff;stroke-width:3;transition:cx .75s ease,cy .75s ease}.mini-kpi b.cf-pulse{animation:cfPulse .35s ease}@keyframes cfDash{to{stroke-dashoffset:-32}}@keyframes cfPulse{0%{transform:scale(1)}50%{transform:scale(1.12);color:#fff}100%{transform:scale(1)}}@media(max-width:760px){.forecast-focused{height:auto!important;min-height:390px!important}.demand-chart{min-height:210px!important}}';
    document.head.appendChild(style);
  }
  if(card){
    const title=card.querySelector('.mini-dashboard-head strong');
    const pill=card.querySelector('.mini-dashboard-head span');
    if(title)title.textContent='Pronóstico en tiempo real';
    if(pill)pill.textContent='modelo en vivo';
  }
  chart.innerHTML='<svg class="clean-forecast-svg" viewBox="0 0 320 180" preserveAspectRatio="none"><line class="cf-axis" x1="36" y1="148" x2="292" y2="148"></line><line class="cf-axis" x1="36" y1="148" x2="36" y2="24"></line><polygon class="cf-band"></polygon><path class="cf-real"></path><path class="cf-dash"></path><circle class="cf-dot" r="5"></circle></svg>';
  const real=chart.querySelector('.cf-real'),dash=chart.querySelector('.cf-dash'),band=chart.querySelector('.cf-band'),dot=chart.querySelector('.cf-dot');
  const kpis=[...document.querySelectorAll('.mini-kpi')];
  const demanda=kpis.find(c=>c.querySelector('small')?.textContent.trim()==='Demanda');
  const pronostico=kpis.find(c=>c.querySelector('small')?.textContent.trim()==='Pronóstico');
  const extra=kpis.find(c=>['Volatilidad','Último dato'].includes(c.querySelector('small')?.textContent.trim()));
  if(demanda)demanda.style.display='none';
  if(extra)extra.style.display='none';
  if(pronostico){pronostico.style.display='block';const label=pronostico.querySelector('small');if(label)label.textContent='Pronóstico actualizado';}
  const states=[
    {f:'+14%',h:[[48,116],[82,72],[110,124],[138,82],[162,76]],p:[[162,76],[198,68],[236,54],[276,42]],top:[[162,76],[198,46],[236,28],[276,16]],bot:[[276,78],[236,88],[198,94],[162,76]]},
    {f:'+3%',h:[[48,116],[82,72],[110,124],[138,82],[162,76],[184,104]],p:[[184,104],[220,110],[254,98],[288,86]],top:[[184,104],[220,88],[254,72],[288,58]],bot:[[288,122],[254,138],[220,132],[184,104]]}
  ];
  function path(a){return 'M '+a.map(p=>p[0]+' '+p[1]).join(' L ')}
  function poly(s){return s.top.concat(s.bot).map(p=>p[0]+','+p[1]).join(' ')}
  function pulse(card){const b=card?.querySelector('b');if(!b)return;b.classList.remove('cf-pulse');void b.offsetWidth;b.classList.add('cf-pulse')}
  function apply(s){const last=s.h[s.h.length-1];real.setAttribute('d',path(s.h));dash.setAttribute('d',path(s.p));band.setAttribute('points',poly(s));dot.setAttribute('cx',last[0]);dot.setAttribute('cy',last[1]);if(pronostico)pronostico.querySelector('b').textContent=s.f;pulse(pronostico)}
  let i=0;apply(states[0]);setInterval(()=>{i=i?0:1;apply(states[i])},1800);
}
setTimeout(aviaCleanForecast,80);
