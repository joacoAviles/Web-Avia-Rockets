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
  style.textContent = '.mini-kpi b{transition:transform .22s ease,color .22s ease}.mini-kpi b.is-counting{transform:translateY(-2px);color:#8cc8ff}.demand-chart{background:linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),rgba(255,255,255,.02);background-size:26px 26px}.demand-chart::before{content:"";position:absolute;left:10%;bottom:16%;width:1px;height:72%;background:rgba(255,255,255,.42)}.demand-chart::after{content:"";position:absolute;left:10%;right:7%;bottom:16%;height:1px;background:rgba(255,255,255,.42)}.forecast-cone{position:absolute;left:52%;right:7%;top:18%;bottom:18%;background:rgba(255,76,96,.22);clip-path:polygon(0 45%,100% 0,100% 100%);filter:blur(.2px);opacity:.85;transition:clip-path .7s ease,opacity .7s ease}.forecast-cone-soft{position:absolute;left:52%;right:7%;top:6%;bottom:8%;background:rgba(255,76,96,.10);clip-path:polygon(0 48%,100% 0,100% 100%);transition:clip-path .7s ease}.history-line{position:absolute;left:10%;width:42%;bottom:42%;height:5px;background:#ff4b5f;clip-path:polygon(0 60%,18% 60%,33% 48%,52% 40%,70% 10%,100% 8%,100% 100%,0 100%);filter:drop-shadow(0 0 12px rgba(255,76,96,.55))}.forecast-dash{position:absolute;left:52%;right:8%;bottom:47%;height:5px;background:repeating-linear-gradient(90deg,#d41424 0 12px,transparent 12px 22px);clip-path:polygon(0 52%,25% 38%,52% 24%,78% 16%,100% 7%,100% 100%,0 100%);transition:clip-path .7s ease,bottom .7s ease}.time-cursor{position:absolute;left:52%;bottom:16%;width:2px;height:70%;background:rgba(255,255,255,.25);animation:aviaTimeCursor 5s linear infinite}@keyframes aviaTimeCursor{0%{left:52%;opacity:.2}50%{opacity:.85}100%{left:92%;opacity:.2}}';
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
  chart.innerHTML = '<span class="forecast-cone-soft"></span><span class="forecast-cone"></span><span class="history-line"></span><span class="forecast-dash"></span><span class="time-cursor"></span>';
  var dash = chart.querySelector('.forecast-dash');
  var cone = chart.querySelector('.forecast-cone');
  var coneSoft = chart.querySelector('.forecast-cone-soft');
  var demand = Array.prototype.find.call(document.querySelectorAll('.mini-kpi'), function(card){ return card.querySelector('small') && card.querySelector('small').textContent.trim() === 'Demanda'; });
  var forecast = Array.prototype.find.call(document.querySelectorAll('.mini-kpi'), function(card){ return card.querySelector('small') && card.querySelector('small').textContent.trim() === 'Pronóstico'; });
  var volatility = Array.prototype.find.call(document.querySelectorAll('.mini-kpi'), function(card){ return card.querySelector('small') && card.querySelector('small').textContent.trim() === 'Volatilidad'; });
  var states = [
    {d:'1.248',f:'+12%',v:'Alta',dash:'polygon(0 52%,25% 38%,52% 24%,78% 16%,100% 7%,100% 100%,0 100%)',cone:'polygon(0 45%,100% 0,100% 100%)'},
    {d:'1.311',f:'+5%',v:'Media',dash:'polygon(0 48%,22% 50%,48% 34%,74% 42%,100% 28%,100% 100%,0 100%)',cone:'polygon(0 48%,100% 18%,100% 88%)'},
    {d:'1.187',f:'-3%',v:'Alta',dash:'polygon(0 40%,26% 56%,52% 62%,78% 50%,100% 66%,100% 100%,0 100%)',cone:'polygon(0 42%,100% 8%,100% 94%)'},
    {d:'1.402',f:'+18%',v:'Alta',dash:'polygon(0 58%,20% 34%,46% 26%,72% 12%,100% 4%,100% 100%,0 100%)',cone:'polygon(0 50%,100% 0,100% 100%)'}
  ];
  var index = 0;
  function applyState(){
    var state = states[index % states.length];
    if (demand) demand.querySelector('b').textContent = state.d;
    if (forecast) forecast.querySelector('b').textContent = state.f;
    if (volatility) volatility.querySelector('b').textContent = state.v;
    dash.style.clipPath = state.dash;
    cone.style.clipPath = state.cone;
    coneSoft.style.clipPath = state.cone;
    index += 1;
  }
  applyState();
  setInterval(applyState, 1800);
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
