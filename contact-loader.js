(function aviaContactLoader() {
  var mount = document.querySelector('[data-contact-include]');
  if (!mount) return;

  function notifyLoaded() {
    document.dispatchEvent(new CustomEvent('avia:contact-loaded'));
  }

  notifyLoaded();

  fetch('sections/contact.html', { headers: { Accept: 'text/html' } })
    .then(function (response) {
      if (!response.ok) throw new Error('No se pudo cargar la sección de contacto');
      return response.text();
    })
    .then(function (html) {
      if (!html || !html.includes('contact-section')) return;
      mount.innerHTML = html;
      notifyLoaded();
    })
    .catch(function () {
      notifyLoaded();
    });
})();
