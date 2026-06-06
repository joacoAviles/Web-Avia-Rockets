(function aviaLiveEvents() {
  var NEW_EVENTS = [
    { title: 'Cambio en C-8812-2025', sub: 'Legal · nuevo escrito ingresado' },
    { title: 'Revisión técnica vencida', sub: 'Flota · unidad 7 · acción requerida' },
    { title: 'Webhook recibido', sub: 'API · pago confirmado' },
    { title: 'Score de riesgo actualizado', sub: 'Intelligence · cliente #4421' },
    { title: 'Deploy completado', sub: 'Lab · app interna · nueva versión' },
    { title: 'Causa C-2301-2023 sin cambios', sub: 'Legal · revisión diaria OK' },
    { title: 'Permiso de circulación por vencer', sub: 'Flota · unidad 12 · 5 días' },
    { title: 'API sincronizada', sub: '8.233 registros procesados' },
    { title: 'Alerta de demanda detectada', sub: 'Intelligence · +18% sobre pronóstico' },
    { title: 'Automatización ejecutada', sub: 'Lab · resumen enviado al equipo' }
  ];

  var TYPING_SPEED_MS = 42;
  var INTERVAL_MS = 4800;
  var MAX_EVENTS_VISIBLE = 5;

  var timeline = document.querySelector('.control-timeline');
  var syncEl = document.querySelector('.control-card-head em');
  var alertsKpi = null;

  if (!timeline) return;

  var kpis = document.querySelectorAll('.control-kpis div');
  kpis.forEach(function (kpi) {
    var small = kpi.querySelector('small');
    if (small && small.textContent.trim() === 'Alertas') {
      alertsKpi = kpi.querySelector('b');
    }
  });

  var seconds = 0;
  var syncTimer = null;
  var eventTimer = null;
  var typingTimer = null;
  var isTyping = false;

  function getCurrentTime() {
    var now = new Date();
    var h = String(now.getHours()).padStart(2, '0');
    var m = String(now.getMinutes()).padStart(2, '0');
    return h + ':' + m;
  }

  function pickEvent() {
    return NEW_EVENTS[Math.floor(Math.random() * NEW_EVENTS.length)];
  }

  function buildEventEl(timeStr, title, sub) {
    var article = document.createElement('article');
    article.className = 'control-event control-event-new';
    article.innerHTML =
      '<time>' + timeStr + '</time>' +
      '<div><strong class="live-typing-target"></strong><span>' + sub + '</span></div>';
    return article;
  }

  function injectStyle() {
    if (document.getElementById('avia-live-events-style')) return;
    var style = document.createElement('style');
    style.id = 'avia-live-events-style';
    style.textContent =
      '.control-event-new{' +
        'border-color:rgba(71,163,255,.5)!important;' +
        'background:rgba(10,108,255,.1)!important;' +
        'animation:aviaEventSlideIn .38s ease both' +
      '}' +
      '@keyframes aviaEventSlideIn{' +
        'from{opacity:0;transform:translateX(-10px)}' +
        'to{opacity:1;transform:translateX(0)}' +
      '}' +
      '.live-cursor{' +
        'display:inline-block;' +
        'width:2px;height:13px;' +
        'background:rgba(71,163,255,.9);' +
        'vertical-align:middle;' +
        'margin-left:1px;' +
        'animation:aviaCursorBlink .65s steps(1) infinite' +
      '}' +
      '@keyframes aviaCursorBlink{' +
        '0%,100%{opacity:1}50%{opacity:0}' +
      '}';
    document.head.appendChild(style);
  }

  function typeText(el, text, callback) {
    var index = 0;
    function step() {
      if (index <= text.length) {
        el.innerHTML = escHtml(text.slice(0, index)) + '<span class="live-cursor" aria-hidden="true"></span>';
        index++;
        typingTimer = setTimeout(step, TYPING_SPEED_MS);
      } else {
        el.textContent = text;
        isTyping = false;
        if (callback) callback();
      }
    }
    step();
  }

  function escHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function addLiveEvent() {
    if (isTyping) return;
    isTyping = true;

    var ev = pickEvent();
    var el = buildEventEl(getCurrentTime(), ev.title, ev.sub);
    timeline.insertBefore(el, timeline.firstChild);

    var events = timeline.querySelectorAll('.control-event');
    if (events.length > MAX_EVENTS_VISIBLE) {
      timeline.removeChild(events[events.length - 1]);
    }

    if (alertsKpi) {
      var current = parseInt(alertsKpi.textContent.replace(/\D/g, ''), 10) || 0;
      alertsKpi.textContent = current + 1;
    }

    var target = el.querySelector('.live-typing-target');
    typeText(target, ev.title, function () {
      setTimeout(function () {
        el.classList.remove('control-event-new');
      }, 1200);
    });
  }

  function startSyncCounter() {
    syncTimer = setInterval(function () {
      seconds++;
      if (syncEl) syncEl.textContent = 'Sync · ' + seconds + 's';
    }, 1000);
  }

  function startEventLoop() {
    eventTimer = setInterval(function () {
      seconds = 0;
      if (syncEl) syncEl.textContent = 'Sync · 0s';
      addLiveEvent();
    }, INTERVAL_MS);
  }

  injectStyle();
  startSyncCounter();

  setTimeout(function () {
    startEventLoop();
  }, 2000);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      clearInterval(syncTimer);
      clearInterval(eventTimer);
      clearTimeout(typingTimer);
    } else {
      startSyncCounter();
      startEventLoop();
    }
  });
})();
