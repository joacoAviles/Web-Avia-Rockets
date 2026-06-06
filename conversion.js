(function aviaConversion() {
  var API_BASE = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || 'https://api.aviarockets.cl').replace(/\/$/, '');

  var METHOD_COPY = {
    es: {
      eyebrow: 'El método AVIA',
      title: 'Capturamos, comparamos y avisamos.',
      intro: 'Tomamos la información que hoy revisas a mano, la contrastamos contra su historial y te mostramos sólo lo que cambió, venció o requiere acción.',
      steps: [
        ['Capturamos', 'Traemos los datos desde donde ya están: carga manual, archivos, APIs, bases de datos o conectores.'],
        ['Comparamos', 'Revisamos el estado actual contra el historial para detectar cambios, vencimientos, errores y pendientes.'],
        ['Avisamos', 'Mostramos el resultado en paneles, alertas o correos para que sepas qué pasó y qué hacer después.']
      ],
      primary: 'Crear cuenta gratis',
      secondary: 'Log In'
    },
    en: {
      eyebrow: 'The AVIA method',
      title: 'We capture, compare, and notify.',
      intro: 'We take the information you currently review by hand, compare it against its history, and show you only what changed, expired, or requires action.',
      steps: [
        ['We capture', 'We bring the data from where it already lives: manual uploads, files, APIs, databases, or connectors.'],
        ['We compare', 'We check the current state against the historical record to detect changes, expirations, errors, and pending items.'],
        ['We notify', 'We show the result through dashboards, alerts, or emails so you know what happened and what to do next.']
      ],
      primary: 'Create free account',
      secondary: 'Log In'
    }
  };

  function numberText(value, fallback) {
    var n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return new Intl.NumberFormat('es-CL').format(n);
  }

  async function loadPublicStats() {
    var targets = document.querySelectorAll('[data-public-stat]');
    if (!targets.length) return;

    try {
      var res = await fetch(API_BASE + '/api/public/home', { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error('stats unavailable');
      var data = await res.json();
      var stats = data.stats || {};
      var products = data.products || [];
      var causes = data.causes || [];
      var active = stats.active_causes_count || causes.filter(function (c) { return c.user_status === 'active'; }).length;
      var summary = stats.daily_summary_email_enabled ? 'Activo' : 'Disponible';

      var map = {
        causes_count: stats.causes_count || causes.length,
        active_causes_count: active,
        products_count: products.length,
        daily_summary_email_enabled: summary
      };

      targets.forEach(function (el) {
        var key = el.getAttribute('data-public-stat');
        if (map[key] !== undefined && map[key] !== null) {
          el.textContent = typeof map[key] === 'number' ? numberText(map[key], el.textContent) : map[key];
        }
      });
    } catch (_) {
      targets.forEach(function (el) {
        var fallback = el.getAttribute('data-fallback');
        if (fallback) el.textContent = fallback;
      });
    }
  }

  function currentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'es';
  }

  function updateMethodSection(lang) {
    var section = document.getElementById('guided-demo');
    if (!section) return;

    var copy = METHOD_COPY[lang === 'en' ? 'en' : 'es'];
    section.classList.add('method-stars-section');

    var eyebrow = section.querySelector('.section-heading .eyebrow');
    var title = section.querySelector('.section-heading h2');
    var intro = section.querySelector('.section-heading > p:not(.eyebrow)');
    var actions = section.querySelectorAll('.guided-actions a');
    var steps = section.querySelectorAll('.guided-steps li');

    if (eyebrow) eyebrow.textContent = copy.eyebrow;
    if (title) title.textContent = copy.title;
    if (intro) intro.textContent = copy.intro;
    if (actions[0]) actions[0].textContent = copy.primary;
    if (actions[1]) actions[1].textContent = copy.secondary;

    copy.steps.forEach(function (step, index) {
      var item = steps[index];
      if (!item) return;
      var strong = item.querySelector('strong');
      var span = item.querySelector('span');
      if (strong) strong.textContent = step[0];
      if (span) span.textContent = step[1];
    });
  }

  function updateContactTextareaCopy() {
    var textarea = document.getElementById('home-message');
    if (!textarea) return;

    var oldText = 'Contacto rápido desde home: solicita evaluación inicial.';
    var newText = 'Cuéntanos en qué podemos ayudarte?';

    if (textarea.value.trim() === oldText) {
      textarea.value = newText;
    }
  }

  function setupExitIntent() {
    var modal = document.getElementById('exit-intent-modal');
    if (!modal) return;
    var shown = sessionStorage.getItem('avia_exit_intent_shown') === '1';
    var closeButtons = modal.querySelectorAll('[data-exit-close]');

    function show() {
      if (shown) return;
      shown = true;
      sessionStorage.setItem('avia_exit_intent_shown', '1');
      modal.classList.add('is-visible');
    }

    function hide() {
      modal.classList.remove('is-visible');
    }

    document.addEventListener('mouseout', function (event) {
      if (event.clientY <= 0 && !event.relatedTarget) show();
    });

    closeButtons.forEach(function (btn) { btn.addEventListener('click', hide); });
    modal.addEventListener('click', function (event) { if (event.target === modal) hide(); });
    document.addEventListener('keydown', function (event) { if (event.key === 'Escape') hide(); });
  }

  function init() {
    updateMethodSection(currentLang());
    updateContactTextareaCopy();
    loadPublicStats();
    setupExitIntent();
  }

  document.addEventListener('avia:language-changed', function (event) {
    updateMethodSection(event.detail && event.detail.lang ? event.detail.lang : currentLang());
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
