(function aviaAurora() {
  var BLOBS = [
    { x: 0.18, y: 0.35, r: 0.55, speed: 0.00040, phase: 0.0, color: [10, 108, 255] },
    { x: 0.78, y: 0.25, r: 0.48, speed: 0.00030, phase: 1.2, color: [71, 163, 255] },
    { x: 0.50, y: 0.78, r: 0.52, speed: 0.00035, phase: 2.4, color: [10, 60, 160] },
    { x: 0.88, y: 0.65, r: 0.40, speed: 0.00028, phase: 0.8, color: [120, 180, 255] }
  ];

  var SECTIONS = [
    '#visualizaciones',
    '.use-cases-section',
    '#business-lines',
    '.product-tiles',
    '.section-alt'
  ];

  var REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (REDUCE_MOTION) return;

  function buildCanvas(section) {
    if (section.querySelector('.avia-aurora-canvas')) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'avia-aurora-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText =
      'position:absolute;' +
      'inset:0;' +
      'width:100%;' +
      'height:100%;' +
      'pointer-events:none;' +
      'z-index:0;' +
      'opacity:0;' +
      'transition:opacity 1.2s ease;';

    var pos = getComputedStyle(section).position;
    if (pos === 'static') section.style.position = 'relative';

    section.insertBefore(canvas, section.firstChild);
    return canvas;
  }

  function startAurora(canvas) {
    var ctx = canvas.getContext('2d');
    var W, H;
    var t = 0;
    var RAF;
    var blobs = BLOBS.map(function (b) {
      return Object.assign({}, b, { phase: b.phase + Math.random() * 0.5 });
    });

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      W = canvas.width = Math.round(rect.width);
      H = canvas.height = Math.round(rect.height);
    }

    function draw() {
      t++;
      ctx.clearRect(0, 0, W, H);

      blobs.forEach(function (blob) {
        var phase = t * blob.speed * Math.PI * 2 + blob.phase;
        var cx = (blob.x + Math.sin(phase * 1.3) * 0.12) * W;
        var cy = (blob.y + Math.cos(phase * 0.9) * 0.10) * H;
        var radius = blob.r * Math.min(W, H);

        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, 'rgba(' + blob.color.join(',') + ',0.18)');
        grad.addColorStop(0.5, 'rgba(' + blob.color.join(',') + ',0.06)');
        grad.addColorStop(1, 'rgba(' + blob.color.join(',') + ',0)');

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      RAF = requestAnimationFrame(draw);
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 200);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        cancelAnimationFrame(RAF);
      } else {
        draw();
      }
    });

    resize();
    draw();

    setTimeout(function () {
      canvas.style.opacity = '1';
    }, 100);
  }

  function observeSection(section, canvas) {
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            startAurora(canvas);
            observer.disconnect();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(section);
    } else {
      startAurora(canvas);
    }
  }

  function init() {
    SECTIONS.forEach(function (selector) {
      var sections = document.querySelectorAll(selector);
      sections.forEach(function (section) {
        var canvas = buildCanvas(section);
        if (canvas) observeSection(section, canvas);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
