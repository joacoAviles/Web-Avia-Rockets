(function aviaCounters() {
  var DURATION_BASE = 1600;
  var DURATION_JITTER = 400;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatNumber(value, format) {
    if (format === 'thousands') {
      if (value >= 1000) {
        var thousands = Math.floor(value / 1000);
        var remainder = String(value % 1000).padStart(3, '0');
        return thousands + '.' + remainder;
      }
    }
    if (format === 'percent') {
      return '+' + value + '%';
    }
    return String(value);
  }

  function animateEl(el) {
    var target = parseInt(el.getAttribute('data-counter-target') || el.getAttribute('data-target') || '0', 10);
    var format = el.getAttribute('data-counter-format') || el.getAttribute('data-format') || '';
    var duration = DURATION_BASE + Math.random() * DURATION_JITTER;
    var startTime = null;

    el.classList.add('avia-counting');
    el.textContent = formatNumber(0, format);

    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var elapsed = timestamp - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOutCubic(progress);
      var current = Math.round(eased * target);

      el.textContent = formatNumber(current, format);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = formatNumber(target, format);
        el.classList.remove('avia-counting');
        el.classList.add('avia-counted');
      }
    }

    requestAnimationFrame(step);
  }

  function injectStyle() {
    if (document.getElementById('avia-counters-style')) return;
    var style = document.createElement('style');
    style.id = 'avia-counters-style';
    style.textContent =
      '.avia-counting{' +
        'color:#8cc8ff!important;' +
        'text-shadow:0 0 18px rgba(10,108,255,.55)' +
      '}' +
      '.avia-counted{' +
        'transition:color .4s ease,text-shadow .4s ease' +
      '}';
    document.head.appendChild(style);
  }

  function runCounters(els) {
    els.forEach(function (el, i) {
      setTimeout(function () { animateEl(el); }, i * 60);
    });
  }

  function observeSection(section, els) {
    if ('IntersectionObserver' in window) {
      var observed = false;
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !observed) {
            observed = true;
            runCounters(els);
            observer.disconnect();
          }
        });
      }, { threshold: 0.2 });
      observer.observe(section);
    } else {
      runCounters(els);
    }
  }

  injectStyle();

  function init() {
    var hero = document.querySelector('.hero, .avia-control-hero');
    var heroEls = [];
    var sectionEls = [];

    document.querySelectorAll('[data-counter-target], .control-kpis b, .control-kpis strong').forEach(function (el) {
      if (hero && hero.contains(el)) {
        heroEls.push(el);
      }
    });

    document.querySelectorAll('.mini-kpi b, .mini-kpi strong, .app-stat strong, [data-home-kpi]').forEach(function (el) {
      var raw = el.textContent.replace(/\./g, '').replace(/,/g, '').trim();
      var num = parseInt(raw, 10);
      if (!isNaN(num) && num > 0) {
        if (!el.getAttribute('data-counter-target')) {
          el.setAttribute('data-counter-target', num);
          var origText = el.textContent.trim();
          if (origText.indexOf('.') > -1) el.setAttribute('data-counter-format', 'thousands');
          if (origText.indexOf('%') > -1) el.setAttribute('data-counter-format', 'percent');
        }
        sectionEls.push(el);
      }
    });

    if (heroEls.length) {
      setTimeout(function () { runCounters(heroEls); }, 400);
    }

    var useCases = document.querySelector('.use-cases-section, #visualizaciones');
    if (useCases && sectionEls.length) {
      observeSection(useCases, sectionEls);
    } else if (sectionEls.length) {
      runCounters(sectionEls);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 100);
  }
})();
