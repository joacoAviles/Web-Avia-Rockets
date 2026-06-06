(function aviaParticles() {
  var canvas = document.createElement('canvas');
  canvas.id = 'avia-particles-canvas';
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  if (getComputedStyle(hero).position === 'static') hero.style.position = 'relative';
  hero.insertBefore(canvas, hero.firstChild);

  var ctx = canvas.getContext('2d');
  var W, H, particles;
  var mouse = { x: -9999, y: -9999 };
  var RAF_ID;

  var CONFIG = {
    count: window.innerWidth < 760 ? 40 : 80,
    maxDist: 110,
    mouseRadius: 100,
    mouseForce: 0.55,
    friction: 0.97,
    dotColor: 'rgba(140,200,255,',
    lineColor: 'rgba(71,163,255,'
  };

  function resize() {
    var rect = hero.getBoundingClientRect();
    W = canvas.width = rect.width;
    H = canvas.height = rect.height;
  }

  function Particle() {
    this.reset();
  }

  Particle.prototype.reset = function () {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.r = Math.random() * 1.8 + 0.6;
    this.alpha = Math.random() * 0.5 + 0.3;
  };

  Particle.prototype.update = function () {
    var dx = this.x - mouse.x;
    var dy = this.y - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CONFIG.mouseRadius && dist > 0) {
      var force = ((CONFIG.mouseRadius - dist) / CONFIG.mouseRadius) * CONFIG.mouseForce;
      this.vx += (dx / dist) * force;
      this.vy += (dy / dist) * force;
    }

    this.vx *= CONFIG.friction;
    this.vy *= CONFIG.friction;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = W;
    if (this.x > W) this.x = 0;
    if (this.y < 0) this.y = H;
    if (this.y > H) this.y = 0;
  };

  function init() {
    CONFIG.count = window.innerWidth < 760 ? 40 : 80;
    particles = Array.from({ length: CONFIG.count }, function () { return new Particle(); });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < particles.length; i++) {
      for (var j = i + 1; j < particles.length; j++) {
        var dx = particles[i].x - particles[j].x;
        var dy = particles[i].y - particles[j].y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < CONFIG.maxDist) {
          var a = (1 - d / CONFIG.maxDist) * 0.22;
          ctx.beginPath();
          ctx.strokeStyle = CONFIG.lineColor + a + ')';
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    for (var k = 0; k < particles.length; k++) {
      particles[k].update();
      ctx.beginPath();
      ctx.arc(particles[k].x, particles[k].y, particles[k].r, 0, Math.PI * 2);
      ctx.fillStyle = CONFIG.dotColor + particles[k].alpha + ')';
      ctx.fill();
    }

    RAF_ID = requestAnimationFrame(draw);
  }

  function onMouseMove(e) {
    var rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  }

  function onMouseLeave() {
    mouse.x = -9999;
    mouse.y = -9999;
  }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      cancelAnimationFrame(RAF_ID);
      resize();
      init();
      draw();
    }, 200);
  }

  hero.addEventListener('mousemove', onMouseMove);
  hero.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('resize', onResize);

  resize();
  init();
  draw();
})();
