function aviaLoadStandardHeaderFromFooter(){
  if (document.querySelector('script[src="header-standard.js"]')) return;
  var script = document.createElement('script');
  script.src = 'header-standard.js';
  document.body.appendChild(script);
}

function aviaLoadCleanForecast(){
  if (!document.querySelector('.demand-chart')) return;
  if (document.querySelector('script[src="forecast-clean.js"]')) return;
  var script = document.createElement('script');
  script.src = 'forecast-clean.js';
  document.body.appendChild(script);
}

function aviaLoadUseCaseLinks(){
  if (!document.querySelector('.use-cases-section .showcase-card')) return;
  if (document.querySelector('script[src="use-case-links.js"]')) return;
  var script = document.createElement('script');
  script.src = 'use-case-links.js';
  document.body.appendChild(script);
}

function aviaApplyStandardFooter(){
  var footer = document.querySelector('footer.site-footer');
  if (!footer) {
    footer = document.createElement('footer');
    document.body.appendChild(footer);
  }
  footer.className = 'site-footer footer-clean footer-orbit';
  footer.innerHTML = '<span class="footer-star" aria-hidden="true"></span><div class="container footer-grid"><div class="footer-brand-wrap"><a class="brand footer-brand" href="index.html"><img src="assets/avia-rockets-logo.svg" alt="AVIA Rockets logo" /><span><strong>AVIA</strong><small>ROCKETS</small></span></a><p class="footer-legal">© 2026 AVIA Rockets. Todos los derechos reservados.</p></div><div class="footer-links"><a href="mapa-del-sitio.html">Mapa del sitio</a><a href="trabaja-con-nosotros.html">Trabaja con nosotros</a><a href="index.html#business-lines">Soluciones</a></div></div>';
  if (!document.getElementById('avia-standard-footer-style')) {
    var style = document.createElement('style');
    style.id = 'avia-standard-footer-style';
    style.textContent = '.footer-orbit{position:relative;overflow:hidden}.footer-orbit::before{content:"";position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,transparent,rgba(71,163,255,.38),transparent)}.footer-star{position:absolute;top:18px;left:-40px;width:8px;height:8px;opacity:.72;filter:drop-shadow(0 0 10px rgba(71,163,255,.75));animation:aviaStarDrift 9s linear infinite}.footer-star::before{content:"✦";position:absolute;color:#8cc8ff;font-size:18px;line-height:1}.footer-star::after{content:"";position:absolute;left:-70px;top:9px;width:70px;height:1px;background:linear-gradient(90deg,transparent,rgba(140,200,255,.45))}.footer-clean .footer-grid{position:relative;display:flex;align-items:center;justify-content:space-between;gap:1rem}.footer-brand-wrap{display:grid;gap:.55rem}.footer-legal{margin:0;color:var(--muted);font-size:.82rem}.footer-clean .footer-links{margin-left:auto;display:flex;align-items:center;justify-content:flex-end;gap:1rem}.footer-clean .footer-links a{text-decoration:none;color:var(--muted-2)}.footer-clean .footer-links a:hover{color:#fff}@keyframes aviaStarDrift{0%{transform:translateX(0) translateY(0) scale(.9);opacity:0}10%{opacity:.72}50%{transform:translateX(50vw) translateY(8px) scale(1)}90%{opacity:.72}100%{transform:translateX(110vw) translateY(-2px) scale(.9);opacity:0}}@media(max-width:760px){.footer-clean .footer-grid{align-items:flex-start;flex-direction:column}.footer-clean .footer-links{margin-left:0;display:grid;gap:.7rem}.footer-star{top:12px}}';
    document.head.appendChild(style);
  }
}

function aviaApplyStandardLayout(){
  aviaLoadStandardHeaderFromFooter();
  aviaApplyStandardFooter();
  aviaLoadCleanForecast();
  aviaLoadUseCaseLinks();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', aviaApplyStandardLayout);
} else {
  aviaApplyStandardLayout();
}
