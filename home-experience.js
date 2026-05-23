function aviaHomeProducts(){ return Array.isArray(window.AVIA_PRODUCTS) ? window.AVIA_PRODUCTS : []; }

function aviaClear(node){ while(node && node.firstChild) node.removeChild(node.firstChild); }

function aviaHomeSelect(productId){
  var products = aviaHomeProducts();
  var product = products.find(function(item){ return item.id === productId; }) || products[0];
  if (!product) return;
  var stage = document.getElementById('home-product-stage');
  var title = document.getElementById('guided-product-title');
  var text = document.getElementById('guided-product-text');
  var steps = document.getElementById('guided-product-steps');
  document.querySelectorAll('[data-home-product]').forEach(function(button){ button.classList.toggle('is-active', button.dataset.homeProduct === product.id); });
  if (stage && window.renderAviaProductPanel) stage.innerHTML = window.renderAviaProductPanel(product, { compact: true });
  if (title) title.textContent = product.title;
  if (text) text.textContent = product.description;
  if (steps) {
    aviaClear(steps);
    product.steps.forEach(function(step, index){
      var li = document.createElement('li');
      li.className = 'guided-step' + (index === 0 ? ' is-active' : '');
      var strong = document.createElement('strong');
      strong.textContent = '0' + (index + 1);
      var span = document.createElement('span');
      span.textContent = step;
      li.appendChild(strong);
      li.appendChild(span);
      steps.appendChild(li);
    });
  }
}

function aviaHomeSetup(){
  var products = aviaHomeProducts();
  var selector = document.getElementById('home-product-selector');
  if (!products.length || !selector) return;
  aviaClear(selector);
  products.forEach(function(product, index){
    var button = document.createElement('button');
    button.className = 'home-product-pill' + (index === 0 ? ' is-active' : '');
    button.type = 'button';
    button.dataset.homeProduct = product.id;
    var label = document.createElement('span');
    label.textContent = product.label;
    var small = document.createElement('small');
    small.textContent = product.short;
    button.appendChild(label);
    button.appendChild(small);
    button.addEventListener('click', function(){ aviaHomeSelect(product.id); });
    selector.appendChild(button);
  });
  var logos = document.getElementById('company-logo-strip');
  if (logos && Array.isArray(window.AVIA_COMPANY_LOGOS)) {
    aviaClear(logos);
    window.AVIA_COMPANY_LOGOS.forEach(function(name){ var span = document.createElement('span'); span.textContent = name; logos.appendChild(span); });
  }
  aviaHomeSelect(products[0].id);
}

function aviaInjectUseCaseMotionStyles(){
  if (document.getElementById('avia-use-case-motion-styles')) return;
  var style = document.createElement('style');
  style.id = 'avia-use-case-motion-styles';
  style.textContent = '.mini-kpi b{transition:transform .22s ease,color .22s ease}.mini-kpi b.is-counting{transform:translateY(-2px);color:#8cc8ff}.mini-kpi b.is-live{animation:aviaKpiPulse .42s ease}.demand-chart{background:linear-gradient(90deg,rgba(255,255,255,.055) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.055) 1px,transparent 1px),rgba(255,255,255,.018);background-size:22px 22px;overflow:hidden}.demand-chart::before{content:"";position:absolute;left:10%;bottom:16%;width:1px;height:72%;background:rgba(255,255,255,.46)}.demand-chart::after{content:"";position:absolute;left:10%;right:7%;bottom:16%;height:1px;background:rgba(255,255,255,.46)}.forecast-cone{position:absolute;left:52%;right:6%;top:10%;bottom:12%;background:rgba(255,76,96,.24);clip-path:polygon(0 48%,100% 0,100% 100%);filter:blur(.2px);opacity:.88;transition:clip-path .42s cubic-bezier(.2,.8,.2,1),top .42s ease,bottom .42s ease,opacity .42s ease}.forecast-cone-soft{position:absolute;left:52%;right:5%;top:2%;bottom:4%;background:rgba(255,76,96,.11);clip-path:polygon(0 48%,100% 0,100% 100%);transition:clip-path .42s cubic-bezier(.2,.8,.2,1),top .42s ease,bottom .42s ease}.history-line{position:absolute;left:10%;width:42%;bottom:42%;height:5px;background:#ff4b5f;clip-path:polygon(0 65%,14% 65%,28% 56%,43% 48%,58% 22%,72% 18%,88% 26%,100% 24%,100% 100%,0 100%);filter:drop-shadow(0 0 12px rgba(255,76,96,.62));transition:clip-path .42s ease,bottom .42s ease}.forecast-dash{position:absolute;left:52%;right:8%;height:5px;background:repeating-linear-gradient(90deg,#d41424 0 11px,transparent 11px 20px);clip-path:polygon(0 52%,20% 38%,40% 20%,62% 30%,82% 10%,100% 18%,100% 100%,0 100%);bottom:47%;filter:drop-shadow(0 0 10px rgba(255,76,96,.55));transition:clip-path .42s cubic-bezier(.2,.8,.2,1),bottom .42s cubic-bezier(.2,.8,.2,1),transform .42s cubic-bezier(.2,.8,.2,1)}.forecast-dash.is-jumping{animation:aviaForecastJump .42s ease}.time-cursor{position:absolute;left:52%;bottom:16%;width:2px;height:70%;background:rgba(255,255,255,.25);animation:aviaTimeCursor 3.6s linear infinite}.volatility-spark{position:absolute;width:6px;height:6px;border-radius:50%;background:#fff;box-shadow:0 0 16px rgba(255,255,255,.85);left:52%;bottom:50%;transition:left .42s linear,bottom .42s ease}.forecast-label{position:absolute;right:8%;top:8%;font-size:.62rem;color:#ffd5da;background:rgba(255,76,96,.12);border:1px solid rgba(255,76,96,.25);border-radius:999px;padding:.2rem .42rem}@keyframes aviaTimeCursor{0%{left:52%;opacity:.16}15%{opacity:.9}100%{left:92%;opacity:.16}}@keyframes aviaKpiPulse{0%{transform:scale(1)}45%{transform:scale(1.1);color:#fff}100%{transform:scale(1)}}@keyframes aviaForecastJump{0%{filter:drop-shadow(0 0 6px rgba(255,76,96,.35))}50%{filter:drop-shadow(0 0 20px rgba(255,76,96,.95))}100%{filter:drop-shadow(0 0 10px rgba(255,76,96,.55))}}';
  document.head.appendChild(style);
}

function aviaParseNumber(text){
  var clean = String(text).replace(/[^0-9.-]/g, '');
  return Number(clean || 0);
}

function aviaFormatLikeOriginal(value, original){
  var rounded = Math.round(value);
  if (String(original).indexOf('%') !== -1) return (rounded > 0 ? '+' : '') + rounded + '%';
  if (rounded >= 1000) return rounded.toLocaleString('es-CL');
  return String(rounded);
}

function aviaAnimateUseCaseNumbers(){
  var labels = ['Revisadas','Con cambios','Sin cambios','Al día','RT pendiente','Vencen'];
  var items = [];
  document.querySelectorAll('.mini-kpi').forEach(function(card){
    var label = card.querySelector('small');
    var number = card.querySelector('b');
    if (!label || !number) return;
    if (labels.indexOf(label.textContent.trim()) === -1) return;
    var original = number.textContent.trim();
    var target = aviaParseNumber(original);
    items.push({node:number,target:target,original:original});
    number.textContent = aviaFormatLikeOriginal(0, original);
  });
  if (!items.length) return;
  var start = null;
  function step(timestamp){
    if (!start) start = timestamp;
    var progress = Math.min((timestamp - start) / 1800, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    items.forEach(function(item){
      item.node.classList.add('is-counting');
      item.node.textContent = aviaFormatLikeOriginal(item.target * eased, item.original);
      if (progress === 1) item.node.classList.remove('is-counting');
    });
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function aviaUpgradeForecastCard(){
  var chart = document.querySelector('.demand-chart');
  if (!chart) return;
  chart.innerHTML = '<span class="forecast-cone-soft"></span><span class="forecast-cone"></span><span class="history-line"></span><span class="forecast-dash"></span><span class="time-cursor"></span><span class="volatility-spark"></span><span class="forecast-label">forecast recalculando</span>';
  var dash = chart.querySelector('.forecast-dash');
  var cone = chart.querySelector('.forecast-cone');
  var coneSoft = chart.querySelector('.forecast-cone-soft');
  var history = chart.querySelector('.history-line');
  var spark = chart.querySelector('.volatility-spark');
  var label = chart.querySelector('.forecast-label');
  var demand = Array.prototype.find.call(document.querySelectorAll('.mini-kpi'), function(card){ return card.querySelector('small') && card.querySelector('small').textContent.trim() === 'Demanda'; });
  var forecast = Array.prototype.find.call(document.querySelectorAll('.mini-kpi'), function(card){ return card.querySelector('small') && card.querySelector('small').textContent.trim() === 'Pronóstico'; });
  var volatility = Array.prototype.find.call(document.querySelectorAll('.mini-kpi'), function(card){ return card.querySelector('small') && card.querySelector('small').textContent.trim() === 'Volatilidad'; });
  var states = [
    {d:'1.248',f:'+12%',v:'Alta',bottom:'50%',move:'translateY(-2px)',dash:'polygon(0 54%,14% 36%,28% 50%,44% 22%,58% 38%,74% 12%,100% 24%,100% 100%,0 100%)',cone:'polygon(0 46%,100% 0,100% 96%)',top:'7%',softTop:'0%',sparkLeft:'57%',sparkBottom:'58%',hist:'polygon(0 62%,16% 62%,30% 54%,44% 42%,60% 20%,74% 22%,88% 18%,100% 24%,100% 100%,0 100%)'},
    {d:'1.081',f:'-8%',v:'Muy alta',bottom:'31%',move:'translateY(14px)',dash:'polygon(0 30%,14% 54%,30% 68%,48% 42%,64% 74%,82% 55%,100% 82%,100% 100%,0 100%)',cone:'polygon(0 38%,100% 16%,100% 100%)',top:'12%',softTop:'3%',sparkLeft:'64%',sparkBottom:'33%',hist:'polygon(0 50%,18% 58%,34% 34%,50% 50%,68% 30%,84% 48%,100% 36%,100% 100%,0 100%)'},
    {d:'1.394',f:'+21%',v:'Alta',bottom:'63%',move:'translateY(-18px)',dash:'polygon(0 70%,12% 38%,28% 25%,46% 42%,62% 14%,80% 24%,100% 6%,100% 100%,0 100%)',cone:'polygon(0 58%,100% 0,100% 84%)',top:'2%',softTop:'0%',sparkLeft:'72%',sparkBottom:'72%',hist:'polygon(0 66%,16% 52%,32% 58%,48% 36%,64% 42%,82% 18%,100% 26%,100% 100%,0 100%)'},
    {d:'1.173',f:'+3%',v:'Media',bottom:'44%',move:'translateY(4px)',dash:'polygon(0 50%,18% 45%,34% 58%,54% 36%,72% 48%,88% 34%,100% 42%,100% 100%,0 100%)',cone:'polygon(0 48%,100% 22%,100% 80%)',top:'18%',softTop:'8%',sparkLeft:'80%',sparkBottom:'46%',hist:'polygon(0 62%,16% 58%,32% 48%,52% 46%,72% 26%,88% 34%,100% 30%,100% 100%,0 100%)'},
    {d:'1.512',f:'+27%',v:'Extrema',bottom:'70%',move:'translateY(-25px)',dash:'polygon(0 75%,10% 28%,24% 46%,40% 12%,58% 30%,76% 4%,100% 18%,100% 100%,0 100%)',cone:'polygon(0 62%,100% 0,100% 100%)',top:'0%',softTop:'0%',sparkLeft:'88%',sparkBottom:'78%',hist:'polygon(0 70%,14% 50%,28% 64%,44% 22%,62% 38%,80% 14%,100% 20%,100% 100%,0 100%)'},
    {d:'1.236',f:'-2%',v:'Alta',bottom:'36%',move:'translateY(18px)',dash:'polygon(0 42%,18% 62%,36% 50%,52% 70%,70% 44%,84% 66%,100% 58%,100% 100%,0 100%)',cone:'polygon(0 42%,100% 14%,100% 94%)',top:'10%',softTop:'2%',sparkLeft:'92%',sparkBottom:'38%',hist:'polygon(0 56%,16% 64%,30% 40%,48% 52%,66% 24%,82% 42%,100% 32%,100% 100%,0 100%)'}
  ];
  var index = 0;
  function bump(node){
    if (!node) return;
    var value = node.querySelector('b');
    if (!value) return;
    value.classList.remove('is-live');
    void value.offsetWidth;
    value.classList.add('is-live');
  }
  function applyState(){
    var state = states[index % states.length];
    if (demand) demand.querySelector('b').textContent = state.d;
    if (forecast) forecast.querySelector('b').textContent = state.f;
    if (volatility) volatility.querySelector('b').textContent = state.v;
    dash.classList.remove('is-jumping');
    void dash.offsetWidth;
    dash.classList.add('is-jumping');
    dash.style.clipPath = state.dash;
    dash.style.bottom = state.bottom;
    dash.style.transform = state.move;
    cone.style.clipPath = state.cone;
    cone.style.top = state.top;
    coneSoft.style.clipPath = state.cone;
    coneSoft.style.top = state.softTop;
    history.style.clipPath = state.hist;
    spark.style.left = state.sparkLeft;
    spark.style.bottom = state.sparkBottom;
    label.textContent = 'forecast ' + state.f;
    bump(demand); bump(forecast); bump(volatility);
    index += 1;
  }
  applyState();
  setInterval(applyState, 950);
}

function aviaSetupUseCaseAnimations(){
  aviaInjectUseCaseMotionStyles();
  var section = document.querySelector('.use-cases-section');
  if (!section) return;
  var ran = false;
  function run(){
    if (ran) return;
    ran = true;
    aviaAnimateUseCaseNumbers();
    aviaUpgradeForecastCard();
  }
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) { run(); observer.disconnect(); }
      });
    }, {threshold:.28});
    observer.observe(section);
  } else {
    run();
  }
}

aviaHomeSetup();
aviaSetupUseCaseAnimations();
