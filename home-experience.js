function aviaHomeProducts(){ return Array.isArray(window.AVIA_PRODUCTS) ? window.AVIA_PRODUCTS : []; }

function aviaClear(node){ while(node && node.firstChild) node.removeChild(node.firstChild); }

function aviaSetHomeProducts(products){
  if (Array.isArray(products) && products.length) window.AVIA_PRODUCTS = products;
}

function aviaRenderSelectedProductPanel(product){
  var heroStage = document.getElementById('home-product-stage');
  var guidedPanel = document.getElementById('guided-product-panel');
  if (!window.renderAviaProductPanel) return;
  var html = window.renderAviaProductPanel(product, { compact: true });
  if (heroStage) heroStage.innerHTML = html;
  if (guidedPanel) guidedPanel.innerHTML = html;
}

function aviaHomeSelect(productId){
  var products = aviaHomeProducts();
  var product = products.find(function(item){ return item.id === productId; }) || products[0];
  if (!product) return;
  var title = document.getElementById('guided-product-title');
  var text = document.getElementById('guided-product-text');
  var steps = document.getElementById('guided-product-steps');
  document.querySelectorAll('[data-home-product]').forEach(function(button){
    button.classList.toggle('is-active', button.dataset.homeProduct === product.id);
  });
  aviaRenderSelectedProductPanel(product);
  if (title) title.textContent = product.title;
  if (text) text.textContent = product.description;
  if (steps) {
    aviaClear(steps);
    (product.steps || []).forEach(function(step, index){
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

function aviaHomeRenderSelector(){
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
  aviaHomeSelect(products[0].id);
}

function aviaRenderLegalUseCase(publicData){
  if (!publicData) return;
  var stats = publicData.stats || {};
  var causes = Array.isArray(publicData.causes) ? publicData.causes : [];
  var total = stats.total_causes_count ?? causes.length;
  var active = stats.active_causes_count ?? causes.filter(function(cause){ return cause.user_status === 'active'; }).length;
  var changes = stats.changes_count ?? causes.filter(function(cause){ return cause.last_has_changes; }).length;
  var values = {
    causes: total,
    active: active,
    inactive: 'Sin movimientos pendientes',
    changes: changes
  };

  Object.keys(values).forEach(function(key){
    document.querySelectorAll('[data-home-kpi="' + key + '"]').forEach(function(node){
      node.textContent = values[key];
    });
  });

  var email = document.getElementById('home-legal-email');
  if (email) email.textContent = 'Control legal en curso';

  var list = document.getElementById('home-case-list');
  if (!list) return;
  aviaClear(list);
  causes.slice(0, 2).forEach(function(cause){
    var line = document.createElement('div');
    line.className = 'case-line';
    var dot = document.createElement('i');
    dot.className = 'case-dot';
    var text = document.createElement('small');
    text.textContent = cause.code + ' · Revisión completada';
    var badge = document.createElement('span');
    badge.className = 'case-badge';
    badge.textContent = cause.last_has_changes ? 'Cambio' : 'Sin cambio';
    line.appendChild(dot);
    line.appendChild(text);
    line.appendChild(badge);
    list.appendChild(line);
  });
}

async function aviaHomeSetup(){
  if (window.aviaLoadProducts) {
    var apiProducts = await window.aviaLoadProducts();
    aviaSetHomeProducts(apiProducts);
    aviaRenderLegalUseCase(window.AVIA_HOME_PUBLIC_DATA);
  }
  aviaHomeRenderSelector();
  var logos = document.getElementById('company-logo-strip');
  if (logos && Array.isArray(window.AVIA_COMPANY_LOGOS)) {
    aviaClear(logos);
    window.AVIA_COMPANY_LOGOS.forEach(function(name){
      var span = document.createElement('span');
      span.textContent = name;
      logos.appendChild(span);
    });
  }
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

function aviaSetupUseCaseAnimations(){
  var section = document.querySelector('.use-cases-section');
  if (!section) return;
  var ran = false;
  function run(){
    if (ran) return;
    ran = true;
    aviaAnimateUseCaseNumbers();
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
