function aviaApplyStandardFavicon(){
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(function(node){
    node.parentNode.removeChild(node);
  });
  var favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = 'assets/avia-rockets-logo.svg?v=20260623-1';
  document.head.appendChild(favicon);
  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }
  themeColor.content = '#071426';
}

function aviaEnsureResponsiveStyles(){
  var styles = [
    { id: 'avia-responsive-desktop', href: 'responsive-desktop.css?v=split-20260622-1', media: '(min-width: 761px)' },
    { id: 'avia-responsive-mobile', href: 'responsive-mobile.css?v=split-20260622-1', media: '(max-width: 760px)' }
  ];

  styles.forEach(function(item){
    if (document.getElementById(item.id)) return;
    var link = document.createElement('link');
    link.id = item.id;
    link.rel = 'stylesheet';
    link.href = item.href;
    link.media = item.media;
    document.head.appendChild(link);
  });
}

function aviaGetLoggedUser(){
  try {
    var token = localStorage.getItem('avia_auth_token');
    var raw = localStorage.getItem('avia_auth_user');
    if (!token || !raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function aviaClearSession(){
  localStorage.removeItem('avia_auth_token');
  localStorage.removeItem('avia_auth_user');
}

function aviaHeaderLabels(lang, isLogged){
  var selected = lang === 'en' ? 'en' : 'es';
  return selected === 'en'
    ? {
        solutions: 'Solutions',
        automation: 'Automation',
        contact: 'Contact',
        login: isLogged ? 'Log out' : 'Log In',
        register: 'Create free account',
        langToggle: 'ES',
        langLabel: 'Cambiar idioma a español'
      }
    : {
        solutions: 'Soluciones',
        automation: 'Automatización',
        contact: 'Contacto',
        login: isLogged ? 'Cerrar sesión' : 'Log In',
        register: 'Crear cuenta gratis',
        langToggle: 'EN',
        langLabel: 'Switch language to English'
      };
}

function aviaUpdateHeaderLanguage(header, lang, isLogged){
  var labels = aviaHeaderLabels(lang, isLogged);
  var solutions = header.querySelector('[data-avia-nav="solutions"]');
  var automation = header.querySelector('[data-avia-nav="automation"]');
  var contact = header.querySelector('[data-avia-nav="contact"]');
  var login = header.querySelector('[data-avia-nav="login"]');
  var register = header.querySelector('[data-avia-nav="register"]');
  var langToggle = header.querySelector('#lang-toggle');

  if (solutions) solutions.textContent = labels.solutions;
  if (automation) automation.textContent = labels.automation;
  if (contact) contact.textContent = labels.contact;
  if (login) {
    login.textContent = labels.login;
    login.title = labels.login;
  }
  if (register) register.textContent = labels.register;
  if (langToggle) {
    langToggle.textContent = labels.langToggle;
    langToggle.setAttribute('aria-label', labels.langLabel);
  }
}

function aviaBroadcastLanguage(lang){
  document.dispatchEvent(new CustomEvent('avia:language-changed', { detail: { lang: lang } }));
  if (window.aviaApplyProtectedContactLanguage) window.aviaApplyProtectedContactLanguage(lang);
  if (window.aviaApplyLanguage) window.aviaApplyLanguage(lang);
}

function aviaEscape(value){
  return String(value || '').replace(/[&<>"]/g, function(char){
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char];
  });
}

function aviaEnsureAppHeaderStyles(){
  if (document.getElementById('avia-app-header-styles')) return;
  var style = document.createElement('style');
  style.id = 'avia-app-header-styles';
  style.textContent = `
    body[data-page="app-home"] .nav-panel {
      gap: .45rem;
      align-items: center;
    }
    body[data-page="app-home"] .avia-app-menu-item {
      position: relative;
    }
    body[data-page="app-home"] .avia-app-menu-trigger {
      border: 0;
      background: transparent;
      color: var(--muted-2);
      cursor: pointer;
      font: inherit;
      font-size: .93rem;
      font-weight: 800;
      padding: .6rem .7rem;
      border-radius: 999px;
      transition: color var(--transition), background var(--transition), text-shadow var(--transition);
    }
    body[data-page="app-home"] .avia-app-menu-trigger:hover,
    body[data-page="app-home"] .avia-app-menu-trigger.is-active,
    body[data-page="app-home"] .avia-app-menu-item.is-open > .avia-app-menu-trigger {
      color: #fff;
      background: rgba(255,255,255,.07);
      text-shadow: 0 0 16px rgba(10, 108, 255, .45);
    }
    body[data-page="app-home"] .avia-app-dropdown {
      position: absolute;
      top: calc(100% + .7rem);
      left: 0;
      min-width: 245px;
      padding: .55rem;
      border: 1px solid rgba(134,176,255,.22);
      border-radius: 18px;
      background: rgba(7,20,38,.98);
      box-shadow: 0 24px 70px rgba(0,0,0,.35);
      display: none;
      z-index: 40;
    }
    body[data-page="app-home"] .avia-app-menu-item:hover .avia-app-dropdown,
    body[data-page="app-home"] .avia-app-menu-item:focus-within .avia-app-dropdown,
    body[data-page="app-home"] .avia-app-menu-item.is-open .avia-app-dropdown {
      display: grid;
      gap: .35rem;
    }
    body[data-page="app-home"] .avia-app-dropdown button {
      width: 100%;
      display: grid;
      grid-template-columns: 38px minmax(0,1fr);
      gap: .65rem;
      align-items: center;
      border: 1px solid transparent;
      border-radius: 14px;
      background: transparent;
      color: var(--text);
      cursor: pointer;
      font: inherit;
      padding: .55rem;
      text-align: left;
    }
    body[data-page="app-home"] .avia-app-dropdown button:hover,
    body[data-page="app-home"] .avia-app-dropdown button.is-active {
      border-color: rgba(71,163,255,.32);
      background: rgba(10,108,255,.13);
    }
    body[data-page="app-home"] .avia-app-dropdown strong {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      background: rgba(10,108,255,.16);
      color: var(--primary-3);
      font-size: .78rem;
    }
    body[data-page="app-home"] .avia-app-dropdown span {
      display: grid;
      gap: .1rem;
      font-weight: 800;
    }
    body[data-page="app-home"] .avia-app-dropdown small {
      color: var(--muted);
      font-weight: 600;
    }
    body[data-page="app-home"] .avia-app-dropdown-empty {
      color: var(--muted);
      font-size: .88rem;
      padding: .7rem;
    }
    body[data-page="app-home"] .avia-app-settings-link {
      border: 1px solid rgba(134,176,255,.2);
      border-radius: 999px;
      background: rgba(255,255,255,.04);
      color: var(--text);
      cursor: pointer;
      font: inherit;
      font-weight: 800;
      padding: .6rem .85rem;
    }
    body[data-page="app-home"] .avia-app-settings-link:hover {
      border-color: rgba(71,163,255,.45);
      background: rgba(10,108,255,.12);
    }
    body[data-page="app-home"] .avia-app-avatar-button {
      width: 46px;
      height: 46px;
      padding: 0;
      border: 1px solid rgba(134,176,255,.24);
      border-radius: 999px;
      background: rgba(255,255,255,.05);
      cursor: pointer;
      overflow: hidden;
      box-shadow: 0 0 0 3px rgba(10,108,255,.08);
    }
    body[data-page="app-home"] .avia-app-avatar-button img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    @media (max-width: 760px) {
      body[data-page="app-home"] .nav-panel.is-open {
        align-items: stretch;
      }
      body[data-page="app-home"] .avia-app-menu-item,
      body[data-page="app-home"] .avia-app-settings-link,
      body[data-page="app-home"] .avia-app-avatar-button {
        width: 100%;
      }
      body[data-page="app-home"] .avia-app-menu-trigger,
      body[data-page="app-home"] .avia-app-settings-link {
        width: 100%;
        text-align: left;
      }
      body[data-page="app-home"] .avia-app-dropdown {
        position: static;
        min-width: 0;
        width: 100%;
        box-shadow: none;
        margin: .2rem 0 .55rem;
      }
      body[data-page="app-home"] .avia-app-avatar-button {
        width: 52px;
      }
    }
  `;
  document.head.appendChild(style);
}

function aviaAppCatalog(){
  return {
    ops: {
      label: 'Ops',
      items: [
        { view: 'causes', icon: 'LG', label: 'Legal / Causas', meta: 'Seguimiento legal', slugs: ['legal','causes','causas','legal-causas'] },
        { view: 'technical-reviews', icon: 'RT', label: 'Revisiones Técnicas', meta: 'Flota y vencimientos', slugs: ['revision-tecnica','revisiones-tecnicas','technical-reviews','flota','fleet'] }
      ]
    },
    intelligence: {
      label: 'Intelligence',
      items: [
        { view: 'intelligence-dashboard', icon: 'IN', label: 'Dashboards / Datos', meta: 'Tableros y alertas', slugs: ['intelligence','data-intelligence','datos','dashboards','demand-intelligence'] }
      ]
    },
    labs: {
      label: 'Labs',
      items: [
        { view: 'academy', icon: 'AC', label: 'Academy', meta: 'Entrenamiento y preguntas', slugs: ['labs-academy','academy','avia-academy'] },
        { view: 'api-lab', icon: 'API', label: 'API Lab', meta: 'Conectores internos', slugs: ['api-lab','labs-api','lab-api','labs-query'] }
      ]
    }
  };
}

function aviaNormalize(value){
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function aviaAppProductToken(product){
  if (typeof product === 'string') return aviaNormalize(product);
  return aviaNormalize(product && (product.slug || product.product_slug || product.code || product.key || product.name || product.title));
}

function aviaAppVisibleItems(lineId){
  var state = window.appState || {};
  var catalog = aviaAppCatalog();
  var line = catalog[lineId] || catalog.ops;
  var products = Array.isArray(state.products) ? state.products : [];
  if (!products.length) return [];
  return line.items.filter(function(item){
    var allowed = item.slugs.map(aviaNormalize);
    return products.some(function(product){
      var enabled = product && product.enabled;
      return enabled !== false && Number(enabled) !== 0 && allowed.includes(aviaAppProductToken(product));
    });
  });
}

async function aviaAppSelectView(lineId, view){
  if (window.appState) {
    window.appState.selectedLine = lineId;
    window.appState.view = view;
  }
  localStorage.setItem('avia_app_selected_line', lineId);
  if (typeof window.appRenderPanel === 'function') await window.appRenderPanel();
  setTimeout(aviaInstallAppHeaderMenu, 0);
}

async function aviaAppOpenSettings(){
  if (window.appState) window.appState.view = 'settings';
  if (typeof window.appRenderPanel === 'function') await window.appRenderPanel();
  setTimeout(aviaInstallAppHeaderMenu, 0);
}

function aviaInstallAppHeaderMenu(){
  if (document.body?.dataset?.page === 'app-home') return;
  var header = document.querySelector('header.site-header');
  var nav = header && header.querySelector('.nav-panel');
  if (!nav) return;
  if (nav.dataset.aviaProductHeader === 'ready') return;

  aviaEnsureAppHeaderStyles();
  var catalog = aviaAppCatalog();
  var state = window.appState || {};
  var activeLine = state.selectedLine || localStorage.getItem('avia_app_selected_line') || 'ops';
  var activeView = state.view || '';

  function lineMarkup(lineId){
    var line = catalog[lineId];
    var items = aviaAppVisibleItems(lineId);
    if (!items.length) return '';
    var buttons = items.length ? items.map(function(item){
      var active = activeView === item.view ? ' is-active' : '';
      return '<button class="avia-app-product-option'+ active +'" type="button" data-app-line="'+ aviaEscape(lineId) +'" data-product-view="'+ aviaEscape(item.view) +'"><strong>'+ aviaEscape(item.icon) +'</strong><span>'+ aviaEscape(item.label) +'<small>'+ aviaEscape(item.meta) +'</small></span></button>';
    }).join('') : '<div class="avia-app-dropdown-empty">Sin opciones contratadas.</div>';
    var active = activeLine === lineId && activeView !== 'settings' ? ' is-active' : '';
    return '<div class="avia-app-menu-item"><button class="avia-app-menu-trigger'+ active +'" type="button" data-app-menu-trigger="'+ aviaEscape(lineId) +'">'+ aviaEscape(line.label) +'</button><div class="avia-app-dropdown">'+ buttons +'</div></div>';
  }

  nav.dataset.appHeader = 'ready';
  nav.dataset.aviaProductHeader = 'ready';
  nav.innerHTML = lineMarkup('ops') + lineMarkup('intelligence') + lineMarkup('labs') + '<button class="avia-app-settings-link" id="avia-app-settings-link" type="button">Configuración</button><button class="avia-app-avatar-button" id="avia-app-avatar-button" type="button" aria-label="Abrir configuración"><img src="https://aviarockets.cl/bimi/logo.svg" alt="AVIA Rockets" /></button>';

  nav.querySelectorAll('[data-app-menu-trigger]').forEach(function(button){
    button.addEventListener('click', function(event){
      event.preventDefault();
      var wrapper = button.closest('.avia-app-menu-item');
      nav.querySelectorAll('.avia-app-menu-item').forEach(function(item){
        if (item !== wrapper) item.classList.remove('is-open');
      });
      if (wrapper) wrapper.classList.toggle('is-open');
      if (window.appState) {
        var line = button.getAttribute('data-app-menu-trigger') || 'ops';
        window.appState.selectedLine = line;
        localStorage.setItem('avia_app_selected_line', line);
      }
    });
  });

  nav.querySelectorAll('[data-product-view]').forEach(function(button){
    button.addEventListener('click', function(event){
      event.preventDefault();
      aviaAppSelectView(button.getAttribute('data-app-line') || 'ops', button.getAttribute('data-product-view') || '');
    });
  });

  nav.querySelector('#avia-app-settings-link')?.addEventListener('click', function(event){
    event.preventDefault();
    aviaAppOpenSettings();
  });

  nav.querySelector('#avia-app-avatar-button')?.addEventListener('click', function(event){
    event.preventDefault();
    aviaAppOpenSettings();
  });
}

function aviaScheduleAppHeaderMenu(){
  if (document.body?.dataset?.page !== 'app-home') return;
  [0, 80, 250, 700, 1400].forEach(function(delay){
    setTimeout(function(){
      var nav = document.querySelector('header.site-header .nav-panel');
      if (nav) delete nav.dataset.aviaProductHeader;
      aviaInstallAppHeaderMenu();
    }, delay);
  });
  document.addEventListener('click', function(event){
    if (!event.target.closest('.avia-app-menu-item')) {
      document.querySelectorAll('.avia-app-menu-item.is-open').forEach(function(item){ item.classList.remove('is-open'); });
    }
  });
}

function aviaApplyStandardHeader(){
  aviaEnsureResponsiveStyles();
  aviaApplyStandardFavicon();

  var header = document.querySelector('header.site-header');
  if (!header) {
    header = document.createElement('header');
    document.body.insertBefore(header, document.body.firstChild);
  }
  header.className = 'site-header';
  var user = aviaGetLoggedUser();
  // Public pages always offer access to the app. The authenticated app replaces
  // this navigation after validating the current session and its permissions.
  var isLogged = document.body?.dataset?.page === 'app-home' && Boolean(user);
  var currentLang = localStorage.getItem('avia-lang') || document.documentElement.lang || 'es';
  currentLang = currentLang === 'en' ? 'en' : 'es';
  document.documentElement.lang = currentLang;
  var labels = aviaHeaderLabels(currentLang, isLogged);
  var loginHref = isLogged ? 'login.html' : 'login.html';
  var loginAction = isLogged ? ' data-avia-logout="true"' : '';

  header.innerHTML = '<div class="container navbar"><a class="brand" href="index.html" aria-label="AVIA Rockets home"><img src="assets/avia-rockets-logo.svg" alt="AVIA Rockets logo" /><span><strong>AVIA</strong><small>ROCKETS</small></span></a><button class="nav-toggle" id="nav-toggle" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button><nav class="nav-panel" id="nav-panel" aria-label="Primary navigation"><a data-avia-nav="solutions" href="index.html#business-lines">'+ labels.solutions +'</a><a data-avia-nav="automation" href="index.html#guided-demo">'+ labels.automation +'</a><a data-avia-nav="contact" href="index.html#contact">'+ labels.contact +'</a><button class="lang-toggle" id="lang-toggle" type="button" aria-label="'+ labels.langLabel +'">'+ labels.langToggle +'</button><a class="btn btn-primary btn-nav" data-avia-nav="login" href="'+ loginHref +'" title="'+ labels.login +'"'+ loginAction +'>'+ labels.login +'</a></nav></div>';

  var navToggle = header.querySelector('#nav-toggle');
  var navPanel = header.querySelector('#nav-panel');
  var langToggle = header.querySelector('#lang-toggle');
  var logoutLink = header.querySelector('[data-avia-logout="true"]');

  if (logoutLink) {
    logoutLink.addEventListener('click', function(event){
      event.preventDefault();
      aviaClearSession();
      window.location.href = 'login.html';
    });
  }

  if (navToggle && navPanel) {
    navToggle.addEventListener('click', function(){
      var isOpen = navPanel.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navPanel.querySelectorAll('a, button').forEach(function(item){
      item.addEventListener('click', function(){
        if (window.innerWidth <= 760 && !item.matches('[data-app-menu-trigger]')) {
          navPanel.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  if (langToggle) {
    langToggle.addEventListener('click', function(){
      var next = document.documentElement.lang === 'es' ? 'en' : 'es';
      document.documentElement.lang = next;
      localStorage.setItem('avia-lang', next);
      aviaUpdateHeaderLanguage(header, next, isLogged);
      aviaBroadcastLanguage(next);
    });
  }

  aviaUpdateHeaderLanguage(header, document.documentElement.lang, isLogged);
  aviaBroadcastLanguage(document.documentElement.lang);
  // app.html is the only owner of the authenticated product navigation.
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', aviaApplyStandardHeader);
} else {
  aviaApplyStandardHeader();
}
