(function aviaContactLoader() {
  var mount = document.querySelector('[data-contact-include]');
  if (!mount) return;

  document.dispatchEvent(new CustomEvent('avia:contact-loaded'));
})();
