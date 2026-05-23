function aviaCleanForecast(){
  const chart=document.querySelector('.demand-chart');
  if(!chart)return;
  let style=document.getElementById('avia-clean-forecast-style');
  if(!style){
    style=document.createElement('style');
    style.id='avia-clean-forecast-style';
    style.textContent='.demand-chart{padding:0!important;background:linear-gradient(180deg,#f8fbff,#eef4fb)!important;overflow:hidden}.clean-forecast-svg{width:100%;height:100%;display:block}.cf-axis{stroke:#38f39a;stroke-width:5;stroke-linecap:round}.cf-real{fill:none;stroke:#ff7a1a;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;transition:d .75s ease}.cf-band{fill:rgba(255,48,64,.18);transition:points .75s ease}.cf-dash{fill:none;stroke:#ff2b2b;stroke-width:7;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:14 18;transition:d .75s ease;animation:cfDash 1.1s linear infinite}.cf-dot{fill:#ff2b2b;stroke:#fff;stroke-width:3;transition:cx .75s ease,cy .75s ease}.mini-kpi b.cf-pulse{animation:cfPulse .35s ease}@keyframes cfDash{to{stroke-dashoffset:-32}}@keyframes cfPulse{0%{transform:scale(1)}50%{transform:scale(1.12);color:#fff}100%{transform:scale(1)}}';
    document.head.appendChild(style);
  }
  chart.innerHTML='<svg class="clean-forecast-svg" viewBox="0 0 320 150" preserveAspectRatio="none"><line class="cf-axis" x1="36" y1="124" x2="292" y2="124"></line><line class="cf-axis" x1="36" y1="124" x2="36" y2="22"></line><polygon class="cf-band"></polygon><path class="cf-real"></path><path class="cf-dash"></path><circle class="cf-dot" r="5"></circle></svg>';
  const real=chart.querySelector('.cf-real'),dash=chart.querySelector('.cf-dash'),band=chart.querySelector('.cf-band'),dot=chart.querySelector('.cf-dot');
  const kpis=[...document.querySelectorAll('.mini-kpi')];
  const demanda=kpis.find(c=>c.querySelector('small')?.textContent.trim()==='Demanda');
  const pronostico=kpis.find(c=>c.querySelector('small')?.textContent.trim()==='Pronóstico');
  const extra=kpis.find(c=>['Volatilidad','Último dato'].includes(c.querySelector('small')?.textContent.trim()));
  if(extra)extra.style.display='none';
  const states=[
    {d:'1.24M',f:'+14%',h:[[48,96],[82,64],[110,98],[132,70],[152,58]],p:[[152,58],[190,50],[230,38],[272,28]],top:[[152,58],[190,32],[230,16],[272,6]],bot:[[272,58],[230,66],[190,68],[152,58]]},
    {d:'1.41M',f:'-6%',h:[[48,96],[82,64],[110,98],[132,70],[152,58],[174,88]],p:[[174,88],[212,96],[248,88],[286,76]],top:[[174,88],[212,76],[248,60],[286,44]],bot:[[286,104],[248,116],[212,112],[174,88]]}
  ];
  function path(a){return 'M '+a.map(p=>p[0]+' '+p[1]).join(' L ')}
  function poly(s){return s.top.concat(s.bot).map(p=>p[0]+','+p[1]).join(' ')}
  function pulse(card){const b=card?.querySelector('b');if(!b)return;b.classList.remove('cf-pulse');void b.offsetWidth;b.classList.add('cf-pulse')}
  function apply(s){const last=s.h[s.h.length-1];real.setAttribute('d',path(s.h));dash.setAttribute('d',path(s.p));band.setAttribute('points',poly(s));dot.setAttribute('cx',last[0]);dot.setAttribute('cy',last[1]);if(demanda)demanda.querySelector('b').textContent=s.d;if(pronostico)pronostico.querySelector('b').textContent=s.f;pulse(demanda);pulse(pronostico)}
  let i=0;apply(states[0]);setInterval(()=>{i=i?0:1;apply(states[i])},1800);
}
setTimeout(aviaCleanForecast,80);
