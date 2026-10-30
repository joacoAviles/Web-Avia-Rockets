import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const cfg = window.AVIA_SUPABASE_CONFIG;
if (!cfg?.url || !cfg?.publishableKey) throw new Error('Falta la configuración pública de autenticación.');

const supabase = createClient(cfg.url, cfg.publishableKey, {
  auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
const API = `${(window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || 'https://api.aviarockets.cl').replace(/\/$/, '')}/api/v1/identity`;
const page = document.body.dataset.page;
const form = document.querySelector('form');
const status = document.querySelector('#status');
const emailKey = 'avia_verify_email';
const profileKey = 'avia_signup_profile';
const tokenKey = 'avia_auth_token';
const userKey = 'avia_auth_user';

const friendlyErrors = {
  invalid_credentials: 'Usuario o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo para ingresar.',
  otp_expired: 'El código venció o no es válido. Solicita uno nuevo.',
  over_email_send_rate_limit: 'Espera un momento antes de solicitar otro correo.',
  weak_password: 'Elige una contraseña más segura.',
  ACCOUNT_REQUIRES_ADMIN_LINK: 'Tu cuenta necesita ser vinculada por el administrador.',
  ACCOUNT_PENDING_APPROVAL: 'Tu cuenta está creada. El administrador debe asignarte acceso para continuar.',
  ACCOUNT_DISABLED: 'La cuenta está desactivada. Contacta al administrador.',
  ADMIN_AUTH_NOT_CONFIGURED: 'La administración de usuarios aún no está configurada.',
  ADMIN_REQUIRED: 'No tienes permiso para administrar usuarios.',
};

function showMessage(value, isError = false) {
  if (!status) return;
  status.textContent = value;
  status.className = isError ? 'error' : '';
  status.setAttribute('role', isError ? 'alert' : 'status');
}

function errorCode(error) {
  return String(error?.code || error?.message || '');
}

function friendly(error, context = 'request') {
  const code = errorCode(error);
  if (friendlyErrors[code]) return friendlyErrors[code];
  if (code.includes('NO_SESSION')) return 'La sesión venció. Vuelve a ingresar.';
  if (code.includes('EMAIL_ALREADY_REGISTERED') || code.includes('already registered')) return 'Ya existe una cuenta con ese correo. Ingresa o recupera tu contraseña.';
  if (code.includes('PASSWORDS_DO_NOT_MATCH')) return 'Las contraseñas no coinciden.';
  if (code.includes('Invalid login credentials')) return 'Usuario o contraseña incorrectos.';
  if (code.includes('FetchError') || code.includes('Failed to fetch') || code.includes('NetworkError')) return 'No pudimos completar la solicitud. Inténtalo nuevamente.';
  return context === 'login' ? 'No pudimos iniciar sesión. Inténtalo nuevamente.' : 'No pudimos completar la solicitud. Inténtalo nuevamente.';
}

async function api(path, method = 'GET', body) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('NO_SESSION');
  const response = await fetch(`${API}${path}`, {
    method,
    cache: 'no-store',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || data.code || data.error || `HTTP_${response.status}`);
  return data;
}

function safeReturnPath() {
  const next = new URLSearchParams(location.search).get('next') || 'app.html';
  const path = next.replace(/^\.\//, '');
  if (!['app.html', 'app-beta.html', 'portada.html'].includes(path)) return '../app.html';
  return `../${path}`;
}

function saveLegacySession(data) {
  const token = data?.access_token || data?.token;
  if (!token || !data?.user) throw new Error('SESSION_EXCHANGE_FAILED');
  localStorage.setItem(tokenKey, token);
  localStorage.setItem(userKey, JSON.stringify(data.user));
}

async function enterAvia() {
  try {
    const data = await api('/exchange', 'POST', {});
    saveLegacySession(data);
    sessionStorage.removeItem(profileKey);
    location.assign(safeReturnPath());
  } catch (error) {
    if (errorCode(error) === 'ACCOUNT_PENDING_APPROVAL') {
      location.assign('onboarding.html');
      return;
    }
    throw error;
  }
}

async function onSubmit(event) {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const submitter = event.submitter || form.querySelector('[type="submit"]');
  if (submitter) submitter.disabled = true;
  showMessage('');
  const fields = Object.fromEntries(new FormData(form));
  try {
    if (page === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email: fields.email.trim(), password: fields.password });
      if (error) throw error;
      await enterAvia();
    } else if (page === 'register') {
      const email = fields.email.trim().toLowerCase();
      const fullName = fields.full_name.trim();
      const { error } = await supabase.auth.signUp({
        email,
        password: fields.password,
        options: { data: { full_name: fullName }, emailRedirectTo: new URL('verify.html', location.href).href },
      });
      if (error) throw error;
      sessionStorage.setItem(emailKey, email);
      sessionStorage.setItem(profileKey, JSON.stringify({ full_name: fullName }));
      location.assign('verify.html');
    } else if (page === 'verify') {
      const email = sessionStorage.getItem(emailKey);
      if (!email) throw new Error('NO_VERIFICATION_EMAIL');
      const { error } = await supabase.auth.verifyOtp({ email, token: fields.code.trim(), type: 'email' });
      if (error) throw error;
      sessionStorage.removeItem(emailKey);
      location.assign('onboarding.html');
    } else if (page === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(fields.email.trim(), {
        redirectTo: new URL('reset.html', location.href).href,
      });
      if (error) throw error;
      showMessage('Si existe una cuenta con ese correo, recibirás instrucciones para recuperar el acceso.');
      form.reset();
    } else if (page === 'reset') {
      if (fields.password !== fields.confirm) throw new Error('PASSWORDS_DO_NOT_MATCH');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('NO_RECOVERY_SESSION');
      const { error } = await supabase.auth.updateUser({ password: fields.password });
      if (error) throw error;
      try { await api('/recovery-complete', 'POST', {}); }
      catch (revokeError) {
        if (!['ACCOUNT_PENDING_APPROVAL', 'ACCOUNT_REQUIRES_ADMIN_LINK'].includes(errorCode(revokeError))) throw revokeError;
      }
      await supabase.auth.signOut({ scope: 'global' });
      localStorage.removeItem(tokenKey);
      localStorage.removeItem(userKey);
      form.hidden = true;
      showMessage('Contraseña actualizada. Ya puedes ingresar.');
    } else if (page === 'onboarding') {
      const data = await api('/onboarding', 'POST', {
        full_name: fields.full_name.trim(),
        company_name: fields.company_name.trim(),
        phone: fields.phone.trim(),
        daily_summary_email_enabled: fields.daily_summary_email_enabled === 'on',
      });
      if (data.access_token || data.token) saveLegacySession(data);
      else if (data.status === 'pending_approval') {
        form.hidden = true;
        showMessage('Perfil guardado. El administrador debe asignarte productos para activar tu acceso.');
        return;
      }
      location.assign(safeReturnPath());
    }
  } catch (error) {
    showMessage(friendly(error, page), true);
  } finally {
    if (submitter) submitter.disabled = false;
  }
}

document.querySelector('#show-password')?.addEventListener('click', (event) => {
  const input = document.querySelector('[name="password"]');
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  event.currentTarget.textContent = input.type === 'password' ? 'Mostrar' : 'Ocultar';
  event.currentTarget.setAttribute('aria-pressed', String(input.type === 'text'));
});

document.querySelector('#google')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: new URL('callback.html', location.href).href },
    });
    if (error) throw error;
  } catch (error) {
    showMessage(friendly(error), true);
    button.disabled = false;
  }
});

form?.addEventListener('submit', onSubmit);

if (page === 'login' && new URLSearchParams(location.search).get('manual') !== '1') {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session) {
      showMessage('Restaurando tu sesión…');
      enterAvia().catch((error) => showMessage(friendly(error, 'login'), true));
    }
  });
}

document.querySelector('#resend')?.addEventListener('click', async (event) => {
  const button = event.currentTarget;
  const email = sessionStorage.getItem(emailKey);
  if (!email) return showMessage('Vuelve a crear la cuenta para solicitar un código nuevo.', true);
  button.disabled = true;
  try {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
    showMessage('Código reenviado. Revisa tu correo.');
  } catch (error) {
    showMessage(friendly(error), true);
  } finally {
    window.setTimeout(() => { button.disabled = false; }, 60_000);
  }
});

if (page === 'callback') {
  showMessage('Estamos verificando tu acceso…');
  enterAvia().catch((error) => showMessage(friendly(error), true));
}

if (page === 'reset') {
  form.hidden = true;
  let recoveryReady = false;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY' && session) {
      recoveryReady = true;
      form.hidden = false;
      showMessage('Elige una contraseña nueva.');
    }
  });
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && !recoveryReady) {
      // The recovery email is valid; the SDK has exchanged the PKCE callback.
      form.hidden = false;
      showMessage('Elige una contraseña nueva.');
    } else if (!session) {
      showMessage('Abre esta página desde el correo de recuperación. Si el enlace venció, solicita otro.', true);
    }
  });
}

if (page === 'onboarding') {
  try {
    const saved = JSON.parse(sessionStorage.getItem(profileKey) || '{}');
    const nameField = form?.elements.namedItem('full_name');
    if (saved.full_name && nameField) nameField.value = saved.full_name;
  } catch (_) { /* Ignore a damaged non-sensitive convenience value. */ }
}

if (page === 'admin') {
  const table = document.querySelector('#user-list');
  const productNames = ['legal', 'legal-summary', 'causes', 'revision-tecnica', 'intelligence-dashboard', 'labs-academy', 'api-lab', 'pjud-upload'];
  const refresh = async () => {
    showMessage('Cargando usuarios…');
    try {
      const data = await api('/admin/users?offset=0');
      table.replaceChildren(...(data.users || []).map((user) => {
        const row = document.createElement('tr');
        for (const value of [user.full_name, user.email, user.organization_id]) {
          const cell = document.createElement('td'); cell.textContent = value || '—'; row.append(cell);
        }
        const editorCell = document.createElement('td');
        const editor = document.createElement('div'); editor.className = 'access-editor';
        const activeLabel = document.createElement('label'); activeLabel.className = 'check access-active';
        const active = document.createElement('input'); active.type = 'checkbox'; active.className = 'user-active'; active.checked = !!user.is_active;
        activeLabel.append(active, document.createTextNode(' Cuenta activa')); editor.append(activeLabel);
        const productBox = document.createElement('div'); productBox.className = 'access-products';
        for (const slug of productNames) {
          const label = document.createElement('label'); label.className = 'check';
          const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.name = 'product_access'; checkbox.value = slug;
          checkbox.checked = !!user.product_access?.[slug];
          label.append(checkbox, document.createTextNode(` ${slug}`)); productBox.append(label);
        }
        editor.append(productBox);
        const save = document.createElement('button'); save.type = 'button'; save.className = 'access-save'; save.textContent = 'Guardar acceso';
        save.addEventListener('click', async () => {
          save.disabled = true;
          const product_access = Object.fromEntries([...productBox.querySelectorAll('input:checked')].map((input) => [input.value, true]));
          try {
            await api(`/admin/users/${encodeURIComponent(user.id)}`, 'PATCH', { is_active: active.checked, product_access });
            showMessage('Accesos guardados.');
            await refresh();
          } catch (error) { showMessage(friendly(error), true); save.disabled = false; }
        });
        editor.append(save); editorCell.append(editor); row.append(editorCell);
        const actions = document.createElement('td');
        if (!user.identity_linked) {
          const invite = document.createElement('button'); invite.type = 'button'; invite.className = 'access-save secondary'; invite.textContent = 'Invitar a Supabase';
          invite.addEventListener('click', async () => {
            invite.disabled = true;
            try {
              await api(`/admin/users/${encodeURIComponent(user.id)}/invite`, 'POST', {});
              showMessage(`Invitación enviada a ${user.email}.`);
              await refresh();
            } catch (error) { showMessage(friendly(error), true); invite.disabled = false; }
          });
          actions.append(invite);
        } else {
          actions.textContent = 'Vinculado';
        }
        row.append(actions);
        return row;
      }));
      showMessage('');
    } catch (error) { showMessage(friendly(error), true); }
  };
  document.querySelector('#reload-users')?.addEventListener('click', refresh);
  document.querySelector('#user-create')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const createForm = event.currentTarget;
    const values = Object.fromEntries(new FormData(createForm));
    const button = event.submitter;
    button.disabled = true;
    try {
      await api('/admin/users', 'POST', {
        full_name: values.full_name.trim(), email: values.email.trim().toLowerCase(),
        company_name: values.company_name.trim(), phone: values.phone.trim(),
        daily_summary_email_enabled: values.daily_summary_email_enabled === 'on',
        organization_name: values.organization_name.trim(),
        product_access: Object.fromEntries([...createForm.querySelectorAll('[name="product_access"]:checked')].map((input) => [input.value, true])),
      });
      createForm.reset();
      showMessage('Invitación enviada.');
      await refresh();
    } catch (error) { showMessage(friendly(error), true); }
    finally { button.disabled = false; }
  });
  document.querySelector('#identity-link')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const button = event.submitter;
    button.disabled = true;
    try {
      await api(`/admin/users/${encodeURIComponent(values.internal_user_id.trim())}/link`, 'POST', { supabase_user_id: values.supabase_user_id.trim() });
      event.currentTarget.reset();
      showMessage('Identidad confirmada y vinculada.');
      await refresh();
    } catch (error) { showMessage(friendly(error), true); }
    finally { button.disabled = false; }
  });
  refresh();
}
