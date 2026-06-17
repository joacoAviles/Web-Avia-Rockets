const FORMS_API_BASE = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || 'https://api.aviarockets.cl').replace(/\/$/, '');
const FORMS_API_URL = window.AVIA_FORMS_API_URL || `${FORMS_API_BASE}/api/contact`;

function getFormPayload(form) {
  const data = new FormData(form);
  const raw = Object.fromEntries(data.entries());
  const name = raw.name || raw.full_name || raw.client_name || raw.nombre || 'Contacto web';
  const email = raw.email || raw.client_email || raw.correo || '';
  const phone = raw.phone || raw.client_phone || raw.telefono || null;
  const company = raw.company || raw.company_name || raw.empresa || null;
  const serviceInterest = raw.service_interest || raw.service_requested || raw.product || raw.product_slug || 'web';
  const message = raw.message || raw.description || raw.mensaje || raw.comments || 'Contacto desde formulario web';
  return {
    name: String(name).trim(),
    email: String(email).trim(),
    phone: phone ? String(phone).trim() : null,
    company: company ? String(company).trim() : null,
    service_interest: String(serviceInterest || 'web').trim(),
    preferred_language: raw.preferred_language || 'es',
    message: String(message).trim()
  };
}

function getSuccessUrl(form) {
  return form.dataset.successUrl || `${window.location.pathname}?enviado=1`;
}

function setFormStatus(form, message, isError = false) {
  let status = form.querySelector('.form-status');
  if (!status) {
    status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('aria-live', 'polite');
    form.appendChild(status);
  }
  status.hidden = false;
  status.textContent = message;
  status.classList.toggle('form-status-error', isError);
  status.classList.toggle('form-status-ok', !isError);
}

async function submitApiForm(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  const originalText = button ? button.textContent : '';

  if (button) {
    button.disabled = true;
    button.textContent = 'Enviando...';
  }

  try {
    const response = await fetch(FORMS_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(getFormPayload(form))
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok === false) throw new Error(result.detail || result.message || 'No se pudo enviar el formulario');
    window.location.href = getSuccessUrl(form);
  } catch (error) {
    setFormStatus(form, error.message || 'No se pudo enviar el formulario. Intenta nuevamente.', true);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

function bindApiForms(root = document) {
  root.querySelectorAll('form[data-api-form]').forEach((form) => {
    if (form.dataset.apiFormBound === 'true') return;
    form.dataset.apiFormBound = 'true';
    form.addEventListener('submit', submitApiForm);
  });
}

bindApiForms();
document.addEventListener('avia:contact-loaded', () => bindApiForms());
