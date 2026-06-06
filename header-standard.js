function aviaApplyStandardFavicon(){
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(function(node){
    node.parentNode.removeChild(node);
  });
  var favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = 'assets/avia-rockets-logo.svg';
  document.head.appendChild(favicon);
  var themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.name = 'theme-color';
    document.head.appendChild(themeColor);
  }
  themeColor.content = '#071426';
}

function aviaGetLoggedUser(){
  try {
    var raw = localStorage.getItem('avia_auth_user');
    if (!raw) return null;
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

function aviaApplyStandardHeader(){
  aviaApplyStandardFavicon();

  var header = document.querySelector('header.site-header');
  if (!header) {
    header = document.createElement('header');
    document.body.insertBefore(header, document.body.firstChild);
  }
  header.className = 'site-header';
  var user = aviaGetLoggedUser();
  var isLogged = Boolean(user);
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
        if (window.innerWidth <= 760) {
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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', aviaApplyStandardHeader);
} else {
  aviaApplyStandardHeader();
}
