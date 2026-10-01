/* Common entry context for every product. No passwords or OAuth tokens in URLs. */
(function (root) {
  'use strict';
  const PRODUCTS = new Set(['home', 'legal', 'quant', 'aeroclub', 'portadas', 'labs', 'academy', 'flota']);
  const CONTEXT = 'avia_identity_context';
  function safeNext(raw, origin) {
    if (!raw || /[\\\u0000-\u0020]/.test(raw)) return '/app.html';
    try {
      const url = new URL(raw, origin);
      if (url.origin !== origin || !/^https?:$/.test(url.protocol)) return '/app.html';
      // Only internal product landing pages; never scripts, auth loops or arbitrary URLs.
      if (!['/app.html', '/app-beta.html', '/portada.html', '/avia-labs.html'].includes(url.pathname)) return '/app.html';
      return (url.pathname === '/app-beta.html' ? '/app.html' : url.pathname) + url.search;
    } catch (_) { return '/app.html'; }
  }
  function normalizedContext(search, saved, origin) {
    const params = new URLSearchParams(search);
    const product = params.get('product') || saved.product || 'home';
    const ref = (params.get('ref') ?? saved.referral_code ?? '').trim().toUpperCase();
    const defaultNext = product === 'portadas' ? '/portada.html' : product === 'labs' ? '/avia-labs.html' : PRODUCTS.has(product) && product !== 'home' ? '/app.html?product=' + product : '/app.html';
    return {
      product: PRODUCTS.has(product) ? product : 'home',
      referral_code: ref,
      next: safeNext(params.get('next') || (params.has('product') ? defaultNext : saved.next || defaultNext), origin)
    };
  }
  if (typeof module !== 'undefined') module.exports = { safeNext, normalizedContext };
  if (!root || !root.document) return;
  const base = 'https://api.aviarockets.cl'; // Credentials never sent to a localStorage-controlled origin.
  let saved = {};
  try { saved = JSON.parse(root.sessionStorage.getItem(CONTEXT) || '{}'); } catch (_) {}
  const context = normalizedContext(root.location.search, saved, root.location.origin);
  root.sessionStorage.setItem(CONTEXT, JSON.stringify(context));
  const MESSAGES = {
    INVALID_REFERRAL: 'Ese código de referido no es válido. Revísalo o continúa sin código.',
    SELF_REFERRAL: 'No puedes utilizar tu propio código.',
    REFERRAL_ALREADY_ASSIGNED: 'Tu cuenta ya tiene un referido asignado.',
    GOOGLE_CANCELLED: 'Cancelaste el acceso con Google. Puedes intentarlo de nuevo.',
    SIGN_IN_WITH_PASSWORD_TO_LINK_GOOGLE: 'Ya tienes una cuenta. Ingresa con tu contraseña y vincula Google desde tu perfil.',
    INVALID_OR_EXPIRED_TICKET: 'El acceso venció. Vuelve a ingresar con Google.',
    TERMS_REQUIRED: 'Debes aceptar los términos para continuar.'
  };
  async function request(path, body, auth = false) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
      const token = root.localStorage.getItem('avia_auth_token');
      if (!token) throw new Error('Ingresa a tu cuenta para continuar.');
      headers.Authorization = 'Bearer ' + token;
    }
    const response = await fetch(base + '/api/v1/identity' + path, {
      method: body === undefined ? 'GET' : 'POST', headers,
      credentials: 'include', cache: 'no-store',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(20000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(MESSAGES[data.detail] || 'No se pudo completar el acceso. Inténtalo de nuevo.');
    return data;
  }
  const ready = request('/config').catch(() => ({ google_enabled: false }));
  async function startGoogle(link = false) {
    const data = await request(link ? '/google/link' : '/google/start', {
      product: context.product, referral_code: context.referral_code, next_path: context.next
    }, link);
    const url = new URL(data.url);
    if (url.origin !== 'https://accounts.google.com') throw new Error('Respuesta de acceso inválida.');
    root.location.assign(url.href);
  }
  async function afterLogin() {
    const config = await ready;
    if (!config.google_enabled) return root.location.assign(context.next);
    const profile = await request('/onboarding', undefined, true);
    root.location.assign(profile.completed ? context.next : '/onboarding.html');
  }
  async function redeem(ticket) {
    const data = await request('/google/redeem', { ticket });
    const token = data.access_token || data.token;
    if (!token || !data.user) throw new Error('No se pudo crear la sesión.');
    root.localStorage.setItem('avia_auth_token', token);
    root.localStorage.setItem('avia_auth_user', JSON.stringify(data.user));
    context.product = data.product || context.product;
    context.next = safeNext(data.destination || context.next, root.location.origin);
    root.sessionStorage.setItem(CONTEXT, JSON.stringify(context));
    // All Google entry points return through this same onboarding.
    root.location.assign(data.onboarding.completed ? context.next : '/onboarding.html');
  }
  function setReferral(value) {
    context.referral_code = value.trim().toUpperCase();
    root.sessionStorage.setItem(CONTEXT, JSON.stringify(context));
  }
  root.AVIAIdentity = { ready, request, context, startGoogle, afterLogin, redeem, setReferral, MESSAGES };
  ready.then(config => {
    root.document.querySelectorAll('[data-referral-entry]').forEach(node => { node.hidden = !config.google_enabled; });
    root.document.querySelectorAll('[data-referral-input]').forEach(input => { input.value = context.referral_code; input.addEventListener('input', () => setReferral(input.value)); });
    const error = new URLSearchParams(root.location.search).get('identity_error');
    if (error && MESSAGES[error]) { const status = root.document.querySelector('[data-identity-status]'); if (status) { status.hidden = false; status.textContent = MESSAGES[error]; } }
    root.document.querySelectorAll('[data-google-login]').forEach(button => {
      button.hidden = !config.google_enabled;
      button.addEventListener('click', async () => {
        button.disabled = true;
        try { await startGoogle(); } catch (error) {
          const status = root.document.querySelector('[data-identity-status]');
          if (status) { status.hidden = false; status.textContent = error.message; }
          button.disabled = false;
        }
      });
    });
  });
})(typeof window === 'undefined' ? undefined : window);
