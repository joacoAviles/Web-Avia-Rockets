import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

// Deployment enables this only after the private gateway passes acceptance tests.
const gateway = window.AVIA_INFRA_GATEWAY;
if (gateway) startInfrastructure(new URL(gateway));

function startInfrastructure(base) {
  if (base.protocol !== 'https:' || base.origin !== 'https://infra.aviarockets.cl') return;
  const cfg = window.AVIA_SUPABASE_CONFIG;
  const auth = createClient(cfg.url, cfg.publishableKey, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
  });
  let services = [], authorized = false, active = false, timer, connecting = false;
  let selected = 'general';
  const layout = document.querySelector('#app-layout');
  if (!layout) return;
  const panel = document.createElement('section');
  panel.id = 'infrastructure-panel';
  panel.hidden = true;
  panel.innerHTML = `<div class="infra-toolbar"><h1>Infraestructura</h1><nav id="infra-tabs" aria-label="Servicios de infraestructura"></nav><div class="infra-actions"><button type="button" id="infra-expand" title="Ampliar área de trabajo">Ampliar</button><button type="button" id="infra-close">Salir</button></div></div><p id="infra-status" role="status" aria-live="polite"></p><div id="infra-summary"></div><iframe id="infra-screen" title="Navegador remoto privado de Infraestructura" referrerpolicy="no-referrer" hidden></iframe><button type="button" id="infra-retry" hidden>Reconectar</button>`;
  layout.after(panel);
  const frame = panel.querySelector('iframe');
  const summary = panel.querySelector('#infra-summary');
  const status = panel.querySelector('#infra-status');
  const retry = panel.querySelector('#infra-retry');

  async function request(path, method = 'POST', token) {
    const result = await fetch(new URL(path, base), {
      method, credentials: 'include', cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!result.ok) throw new Error(String(result.status));
    return result.json();
  }

  async function renew() {
    const { data: { session } } = await auth.auth.getSession();
    if (!session) throw new Error('401');
    const data = await request('/session', 'POST', session.access_token);
    services = data.services;
    authorized = true;
    installMenu();
  }

  function lock(error) {
    authorized = false;
    frame.removeAttribute('src');
    frame.hidden = true;
    clearInterval(timer);
    document.querySelector('#infra-menu-button')?.remove();
    status.textContent = error.message === '403' ? 'Tu cuenta no tiene acceso a Infraestructura.' : 'La conexión privada no está disponible. Puedes intentar reconectar.';
    retry.hidden = false;
  }

  async function select(id) {
    if (connecting) return;
    connecting = true;
    status.textContent = 'Conectando…';
    try {
      if (!authorized) await renew();
      if (id !== 'general') await request(`/services/${encodeURIComponent(id)}/activate`);
      selected = id;
      summary.hidden = id !== 'general';
      frame.hidden = id === 'general';
      if (id !== 'general' && !frame.hasAttribute('src')) {
        frame.src = new URL('/remote/avia.html', base).href;
      }
      panel.querySelectorAll('[data-service]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.service === id)));
      status.textContent = id === 'general' ? 'Servicios configurados. Su disponibilidad se comprueba al abrirlos.' : 'Sesión privada · Tu acceso se conserva en este escritorio';
      retry.hidden = true;
    } catch (error) {
      if (error.message === '503' && authorized) {
        status.textContent = 'El navegador remoto no está disponible. Intenta reconectar.';
        retry.hidden = false;
      } else lock(error);
    } finally { connecting = false; }
  }

  function render() {
    const tabs = panel.querySelector('#infra-tabs');
    tabs.replaceChildren();
    summary.replaceChildren();
    for (const service of [{ id: 'general', label: 'General', configured: true }, ...services]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = service.label;
      button.dataset.service = service.id;
      button.disabled = !service.configured;
      button.setAttribute('aria-pressed', String(selected === service.id));
      button.addEventListener('click', () => select(service.id));
      tabs.append(button);
      if (service.id !== 'general') {
        const item = document.createElement('p');
        item.textContent = `${service.label}: ${service.configured ? 'Configurado' : 'Pendiente de identificar'}`;
        summary.append(item);
      }
    }
  }

  async function open() {
    active = true;
    document.body.classList.add('infra-active');
    layout.hidden = true;
    panel.hidden = false;
    try {
      await renew();
      render();
      await select(selected);
      clearInterval(timer);
      timer = setInterval(() => renew().catch(lock), 45000);
    } catch (error) { lock(error); }
  }

  async function close() {
    active = false;
    document.body.classList.remove('infra-active', 'infra-expanded');
    clearInterval(timer);
    panel.hidden = true;
    layout.hidden = false;
    frame.removeAttribute('src');
    await request('/session', 'DELETE').catch(() => {});
    // This disconnects the remote transport; Chromium's private profile persists.
  }

  function installMenu() {
    const nav = document.querySelector('.site-header .nav-panel');
    if (!authorized || !nav || nav.querySelector('#infra-menu-button')) return;
    const button = document.createElement('button');
    button.id = 'infra-menu-button';
    button.className = 'app-header-trigger';
    button.type = 'button';
    button.textContent = 'Infraestructura';
    button.addEventListener('click', open);
    nav.prepend(button);
  }

  panel.querySelector('#infra-expand').addEventListener('click', event => {
    const expanded = document.body.classList.toggle('infra-expanded');
    event.currentTarget.textContent = expanded ? 'Restaurar' : 'Ampliar';
  });
  window.addEventListener('message', event => {
    if (event.origin !== base.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'infra-connection') {
      status.textContent = event.data.connected ? 'Conectado · Sesión privada' : 'Reconectando con tu escritorio…';
    }
  });
  panel.querySelector('#infra-close').addEventListener('click', close);
  retry.addEventListener('click', open);
  // Existing navigation and header remain usable. Close before leaving this view.
  document.querySelector('.site-header')?.addEventListener('click', event => {
    if (active && !event.target.closest('#infra-menu-button') && event.target.closest('button,a')) close();
  }, true);
  auth.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') { close(); lock(new Error('401')); }
  });
  window.addEventListener('pagehide', () => {
    fetch(new URL('/session', base), { method: 'DELETE', credentials: 'include', keepalive: true }).catch(() => {});
  });
  new MutationObserver(installMenu).observe(document.querySelector('.site-header'), { childList: true, subtree: true });
  renew().catch(() => {}); // No menu for an unauthorized user or unconfigured server.
}
