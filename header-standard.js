function aviaApplyStandardFavicon(){
  document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"]').forEach(function(node){
    node.parentNode.removeChild(node);
  });
  var favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/svg+xml';
  favicon.href = 'assets/favicon-rect.svg?v=2026-avia-rect';
  document.head.appendChild(favicon);
}

function aviaGetLoggedUserLabel(){
  try {
    var raw = localStorage.getItem('avia_auth_user');
    if (!raw) return null;
    var user = JSON.parse(raw);
    return user && (user.email || user.full_name) ? (user.email || user.full_name) : null;
  } catch (_) {
    return null;
  }
}

function aviaApplyStandardHeader(){
  aviaApplyStandardFavicon();

  var header = document.querySelector('header.site-header');
  if (!header) {
    header = document.createElement('header');
    document.body.insertBefore(header, document.body.firstChild);
  }
  header.className = 'site-header';
  var userLabel = aviaGetLoggedUserLabel();
  var loginLabel = userLabel || 'Log In';
  var loginHref = userLabel ? 'app-beta.html' : 'login.html';
  header.innerHTML = '<div class="container navbar"><a class="brand" href="index.html" aria-label="AVIA Rockets home"><img src="assets/avia-rockets-logo.svg" alt="AVIA Rockets logo" /><span><strong>AVIA</strong><small>ROCKETS</small></span></a><button class="nav-toggle" id="nav-toggle" aria-label="Open navigation" aria-expanded="false"><span></span><span></span></button><nav class="nav-panel" id="nav-panel" aria-label="Primary navigation"><a href="index.html#business-lines">Soluciones</a><a href="contacto.html">Contacto</a><button class="lang-toggle" id="lang-toggle" type="button" aria-label="Switch language">EN</button><a class="btn btn-primary btn-nav" href="'+ loginHref +'" title="'+ loginLabel +'">'+ loginLabel +'</a></nav></div>';

  var navToggle = header.querySelector('#nav-toggle');
  var navPanel = header.querySelector('#nav-panel');
  var langToggle = header.querySelector('#lang-toggle');
  var currentLang = localStorage.getItem('avia-lang') || document.documentElement.lang || 'es';
  document.documentElement.lang = currentLang === 'en' ? 'en' : 'es';
  if (langToggle) langToggle.textContent = document.documentElement.lang === 'es' ? 'EN' : 'ES';

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
      langToggle.textContent = next === 'es' ? 'EN' : 'ES';
      if (window.aviaApplyLanguage) window.aviaApplyLanguage(next);
    });
  }

  if (window.aviaApplyLanguage) window.aviaApplyLanguage(document.documentElement.lang);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', aviaApplyStandardHeader);
} else {
  aviaApplyStandardHeader();
}
