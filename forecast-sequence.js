function aviaForecastSequence(){
  const chart = document.querySelector('.demand-chart');
  if (!chart) return;

  if (!document.getElementById('avia-forecast-sequence-style')) {
    const style = document.createElement('style');
    style.id = 'avia-forecast-sequence-style';
    style.textContent = `.demand-chart{padding:0!important;background:#fff!important;overflow:hidden}.forecast-svg{width:100%;height:100%;display:block;background:#fff}.axis{stroke:#111;stroke-width:2.3}.grid-line{stroke:rgba(0,0,0,.08);stroke-width:1}.history-path{fill:none;stroke:#d41424;stroke-width:5.2;stroke-linecap:round;stroke-linejoin:round;transition:d .65s ease}.forecast-band-outer{fill:rgba(212,20,36,.11);transition:points .65s ease}.forecast-band{fill:rgba(212,20,36,.28);transition:points .65s ease}.forecast-path{fill:none;stroke:#d41424;stroke-width:4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:10 10;animation:aviaDash 1s linear infinite;transition:d .65s ease}.real-point,.forecast-start{fill:#d41424;stroke:#fff;stroke-width:2.2;opacity:0;transition:opacity .2s ease,cx .65s ease,cy .65s ease}.real-point.is-visible,.forecast-start.is-visible{opacity:1}.time-tag{font:800 10px Inter,Arial,sans-serif;fill:#1d2735}.forecast-label-svg{font:800 9px Inter,Arial,sans-serif;fill:#d41424}.year-label{font:700 8px Inter,Arial,sans-serif;fill:#6b7280}.mini-kpi b.is-live{animation:aviaKpiPulse .35s ease}@keyframes aviaDash{to{stroke-dashoffset:-20}}@keyframes aviaKpiPulse{0%{transform:scale(1)}50%{transform:scale(1.12);color:#fff}100%{transform:scale(1)}}`;
    document.head.appendChild(style);
  }

  chart.innerHTML = `<svg class="forecast-svg" viewBox="0 0 320 150" preserveAspectRatio="none">
    <line class="axis" x1="34" y1="124" x2="292" y2="124"></line>
    <line class="axis" x1="34" y1="20" x2="34" y2="124"></line>
    <line class="grid-line" x1="34" y1="92" x2="292" y2="92"></line>
    <line class="grid-line" x1="34" y1="60" x2="292" y2="60"></line>
    <polygon class="forecast-band-outer"></polygon>
    <polygon class="forecast-band"></polygon>
    <path class="history-path"></path>
    <path class="forecast-path"></path>
    <circle class="forecast-start" r="4.5"></circle>
    <circle class="real-point p0" r="4"></circle>
    <circle class="real-point p1" r="4"></circle>
    <circle class="real-point p2" r="4"></circle>
    <circle class="real-point p3" r="4"></circle>
    <circle class="real-point p4" r="4"></circle>
    <text class="time-tag" x="42" y="18">t0</text>
    <text class="forecast-label-svg" x="206" y="28">pronóstico</text>
    <text class="year-label" x="82" y="140">2014</text>
    <text class="year-label" x="120" y="140">2015</text>
    <text class="year-label" x="158" y="140">2016</text>
    <text class="year-label" x="196" y="140">2017</text>
  </svg>`;

  const svg = chart.querySelector('svg');
  const historyPath = svg.querySelector('.history-path');
  const forecastPath = svg.querySelector('.forecast-path');
  const band = svg.querySelector('.forecast-band');
  const bandOuter = svg.querySelector('.forecast-band-outer');
  const startPoint = svg.querySelector('.forecast-start');
  const tag = svg.querySelector('.time-tag');

  const demandKpi = [...document.querySelectorAll('.mini-kpi')].find(card => card.querySelector('small')?.textContent.trim() === 'Demanda');
  const forecastKpi = [...document.querySelectorAll('.mini-kpi')].find(card => card.querySelector('small')?.textContent.trim() === 'Pronóstico');
  const thirdKpi = [...document.querySelectorAll('.mini-kpi')].find(card => card.querySelector('small')?.textContent.trim() === 'Volatilidad');
  if (thirdKpi) thirdKpi.querySelector('small').textContent = 'Último dato';

  const realPoints = [
    {x:44,y:104,d:'0.62M',year:'2013'},
    {x:88,y:104,d:'0.64M',year:'2014'},
    {x:126,y:86,d:'0.91M',year:'2015'},
    {x:164,y:74,d:'1.12M',year:'2016'},
    {x:202,y:42,d:'1.68M',year:'2017'}
  ];

  const states = [
    {t:'t0', upto:1, f:'+18%', forecast:[[88,104],[126,88],[164,72],[202,58],[262,42]], spread:28},
    {t:'t1', upto:2, f:'+9%', forecast:[[126,86],[164,82],[202,72],[240,60],[282,50]], spread:22},
    {t:'t2', upto:3, f:'+31%', forecast:[[164,74],[202,48],[240,36],[272,24],[292,18]], spread:34},
    {t:'t3', upto:4, f:'-4%', forecast:[[202,42],[232,48],[258,56],[278,62],[292,68]], spread:26}
  ];

  function path(points){
    return 'M ' + points.map(p => `${p.x} ${p.y}`).join(' L ');
  }
  function forecastLine(points){
    return 'M ' + points.map(p => `${p[0]} ${p[1]}`).join(' L ');
  }
  function bandPoints(points, spread){
    const upper = points.map((p,i) => [p[0], Math.max(12, p[1] - spread * (i / (points.length - 1)))]);
    const lower = points.slice().reverse().map((p,ri) => {
      const i = points.length - 1 - ri;
      return [p[0], Math.min(122, p[1] + spread * (i / (points.length - 1)))];
    });
    return upper.concat(lower).map(p => `${p[0]},${p[1]}`).join(' ');
  }
  function pulse(card){
    const b = card?.querySelector('b');
    if (!b) return;
    b.classList.remove('is-live');
    void b.offsetWidth;
    b.classList.add('is-live');
  }
  function apply(state){
    const history = realPoints.slice(0, state.upto + 1);
    const last = realPoints[state.upto];
    historyPath.setAttribute('d', path(history));
    forecastPath.setAttribute('d', forecastLine(state.forecast));
    band.setAttribute('points', bandPoints(state.forecast, state.spread));
    bandOuter.setAttribute('points', bandPoints(state.forecast, state.spread * 1.75));
    startPoint.setAttribute('cx', last.x);
    startPoint.setAttribute('cy', last.y);
    startPoint.classList.add('is-visible');
    tag.textContent = `${state.t} · dato ${last.year}`;
    svg.querySelectorAll('.real-point').forEach((circle,i) => {
      const p = realPoints[i];
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.classList.toggle('is-visible', i <= state.upto);
    });
    if (demandKpi) demandKpi.querySelector('b').textContent = last.d;
    if (forecastKpi) forecastKpi.querySelector('b').textContent = state.f;
    if (thirdKpi) thirdKpi.querySelector('b').textContent = last.year;
    pulse(demandKpi); pulse(forecastKpi); pulse(thirdKpi);
  }

  let i = 0;
  apply(states[i]);
  setInterval(() => {
    i = (i + 1) % states.length;
    apply(states[i]);
  }, 1600);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', aviaForecastSequence);
} else {
  aviaForecastSequence();
}
