(function aviaConversion() {
  var API_BASE = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || 'https://api.aviarockets.cl').replace(/\/$/, '');

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
    updateContactTextareaCopy();
    loadPublicStats();
    setupExitIntent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
