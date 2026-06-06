(function aviaContactLoader() {
  var mount = document.querySelector('[data-contact-include]');
  if (!mount) return;

  fetch('sections/contact.html', { headers: { Accept: 'text/html' } })
    .then(function (response) {
      if (!response.ok) throw new Error('No se pudo cargar la sección de contacto');
      return response.text();
    })
    .then(function (html) {
      mount.outerHTML = html;
      document.dispatchEvent(new CustomEvent('avia:contact-loaded'));
    })
    .catch(function () {
      mount.innerHTML = '<section class="section contact-section" id="contact"><div class="container"><div class="section-heading"><p class="eyebrow">Contacto</p><h2>Cuéntanos qué operación quieres ordenar</h2><p>No se pudo cargar el formulario. Escríbenos desde la página de registro o intenta nuevamente.</p><a class="btn btn-primary" href="register.html">Crear cuenta gratis</a></div></div></section>';
    });
})();
