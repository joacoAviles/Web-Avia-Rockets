(function aviaProtectedContactI18n() {
  function readCopy() {
    var node = document.getElementById('contact-i18n-data');
    if (!node) return null;
    try {
      return JSON.parse(node.textContent || '{}');
    } catch (_) {
      return null;
    }
  }

  function setText(node, value) {
    if (node && typeof value === 'string') node.textContent = value;
  }

  function apply(lang) {
    var data = readCopy();
    var contact = document.getElementById('contact');
    if (!data || !contact) return;

    var copy = data[lang === 'en' ? 'en' : 'es'] || data.es;
    if (!copy) return;

    setText(contact.querySelector('.eyebrow'), copy.eyebrow);
    setText(contact.querySelector('.section-heading h2'), copy.title);
    setText(contact.querySelector('.section-heading > p:not(.eyebrow)'), copy.intro);

    var meta = contact.querySelectorAll('.contact-meta p');
    (copy.meta || []).forEach(function (item, index) {
      if (!meta[index]) return;
      meta[index].innerHTML = '<strong>' + item[0] + '</strong>' + item[1];
    });

    setText(contact.querySelector('label[for="home-name"]'), copy.name);
    setText(contact.querySelector('label[for="home-email"]'), copy.email);
    setText(contact.querySelector('label[for="home-interest"]'), copy.interest);

    var details = contact.querySelector('label[for="home-message"]');
    if (details) {
      details.innerHTML = copy.details + '<span style="color:var(--muted);font-weight:600">' + copy.optional + '</span>';
    }

    var textarea = document.getElementById('home-message');
    if (textarea) {
      var defaults = [];
      if (data.es && data.es.message) defaults.push(data.es.message);
      if (data.en && data.en.message) defaults.push(data.en.message);
      defaults.push('Contacto rápido desde home: solicita evaluación inicial.');
      if (defaults.indexOf((textarea.value || '').trim()) >= 0) {
        textarea.value = copy.message;
      }
      textarea.placeholder = copy.placeholder || '';
    }

    var select = document.getElementById('home-interest');
    if (select && Array.isArray(copy.options)) {
      var current = select.value;
      select.innerHTML = '';
      copy.options.forEach(function (item) {
        var option = document.createElement('option');
        option.value = item[0];
        option.textContent = item[1];
        select.appendChild(option);
      });
      if (current) select.value = current;
    }

    setText(contact.querySelector('button[type="submit"]'), copy.submit);
  }

  function currentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'es';
  }

  function scheduleApply() {
    window.requestAnimationFrame(function () {
      apply(currentLang());
    });
  }

  scheduleApply();

  var langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', scheduleApply);
  }
})();
