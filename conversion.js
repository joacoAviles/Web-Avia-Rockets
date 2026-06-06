(function aviaConversion() {
  var API_BASE = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || 'https://api.aviarockets.cl').replace(/\/$/, '');

  var METHOD_COPY = {
    es: {
      eyebrow: 'El método AVIA',
      title: 'Capturamos, comparamos y avisamos',
      intro: 'Tomamos la información que hoy revisas a mano, la contrastamos contra su historial y te mostramos sólo lo que cambió, venció o requiere acción.',
      steps: [
        ['Capturamos', 'Te ayudamos con la recolección de datos: automatizamos cargas manuales, creamos APIs, bases de datos y sus conexiones.'],
        ['Comparamos', 'Analizamos, proyectamos y comparamos para detectar cambios, vencimientos, errores y anomalías.'],
        ['Avisamos', 'Te ayudamos con el monitoreo, paneles, alertas o correos para que sepas qué pasó y qué hacer en el momento exacto.']
      ],
      primary: 'Crear cuenta gratis',
      secondary: 'Log In'
    },
    en: {
      eyebrow: 'The AVIA method',
      title: 'We capture, compare, and notify',
      intro: 'We take the information you currently review by hand, compare it against its history, and show you only what changed, expired, or requires action.',
      steps: [
        ['We capture', 'We help with data collection: we automate manual uploads, create APIs, databases, and their connections.'],
        ['We compare', 'We analyze, project, and compare to detect changes, expirations, errors, and anomalies.'],
        ['We notify', 'We help with monitoring, dashboards, alerts, or emails so you know what happened and what to do at the exact right moment.']
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

  var MODULES_COPY = {
    es: {
      eyebrow: 'Módulos',
      title: 'Entramos donde tu operación lo necesite',
      intro: 'AVIA puede ayudarte desde el inicio, cuando todo está en planillas y correos; en el intermedio, cuando ya tienes datos pero falta control; o al final, cuando necesitas sistemas, APIs e integraciones propias.',
      cards: [
        {
          icon: '🧭',
          title: 'Avia OPS',
          text: 'Control operativo para el día a día. Monitoreamos causas, flotas, estados, vencimientos, alertas y tareas pendientes para que sepas qué cambió y qué requiere acción.',
          cta: 'Ver OPS'
        },
        {
          icon: '📊',
          title: 'Avia Intelligence',
          text: 'Datos convertidos en decisión. Creamos dashboards, reportes y análisis para detectar riesgos, tendencias, prioridades y oportunidades dentro de tu operación.',
          cta: 'Ver Intelligence'
        },
        {
          icon: '🛠️',
          title: 'Avia Labs',
          text: 'Herramientas hechas a la medida. Construimos APIs, conectores, apps internas e integraciones cuando tu proceso necesita una solución propia.',
          cta: 'Ver Labs'
        }
      ]
    },
    en: {
      eyebrow: 'Modules',
      title: 'We enter wherever your operation needs us',
      intro: 'AVIA can help from the beginning, when everything still lives in spreadsheets and emails; in the middle, when you already have data but lack control; or at the end, when you need your own systems, APIs, and integrations.',
      cards: [
        {
          icon: '🧭',
          title: 'Avia OPS',
          text: 'Operational control for the day to day. We monitor cases, fleets, statuses, expirations, alerts, and pending tasks so you know what changed and what requires action.',
          cta: 'View OPS'
        },
        {
          icon: '📊',
          title: 'Avia Intelligence',
          text: 'Data turned into decisions. We create dashboards, reports, and analysis to detect risks, trends, priorities, and opportunities inside your operation.',
          cta: 'View Intelligence'
        },
        {
          icon: '🛠️',
          title: 'Avia Labs',
          text: 'Custom-built tools. We build APIs, connectors, internal apps, and integrations when your process needs its own solution.',
          cta: 'View Labs'
        }
      ]
    }
  };

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

  function updateModulesSection(lang) {
    var section = document.getElementById('business-lines');
    if (!section) return;

    var copySet = MODULES_COPY[lang === 'en' ? 'en' : 'es'];
    var heading = section.querySelector('.section-heading');
    var cards = section.querySelectorAll('.business-card');
    if (!heading || !cards.length) return;

    var eyebrow = heading.querySelector('.eyebrow');
    var title = heading.querySelector('h2');
    var intro = heading.querySelector('p:not(.eyebrow)');

    if (eyebrow) eyebrow.textContent = copySet.eyebrow;
    if (title) title.textContent = copySet.title;
    if (intro) intro.textContent = copySet.intro;

    copySet.cards.forEach(function (copy, index) {
      var card = cards[index];
      if (!card) return;
      var icon = card.querySelector('.card-icon');
      var cardTitle = card.querySelector('h3');
      var text = card.querySelector('p');
      var cta = card.querySelector('a.btn');

      if (icon) {
        icon.textContent = copy.icon;
        icon.setAttribute('aria-hidden', 'true');
      }
      if (cardTitle) cardTitle.textContent = copy.title;
      if (text) text.textContent = copy.text;
      if (cta) cta.textContent = copy.cta;
    });
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

  function refreshHomeCopy(lang) {
    var selected = lang || currentLang();
    updateMethodSection(selected);
    updateModulesSection(selected);
  }

  function init() {
    refreshHomeCopy(currentLang());
    updateContactTextareaCopy();
    loadPublicStats();
    setupExitIntent();
  }

  document.addEventListener('avia:language-changed', function (event) {
    refreshHomeCopy(event.detail && event.detail.lang ? event.detail.lang : currentLang());
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
