import { supabase as auth } from './web-auth/session.js?v=20261030-auth4';

const gateway = window.AVIA_INFRA_GATEWAY;
if (gateway) startInfrastructure(new URL(gateway));

function startInfrastructure(base) {
  if (base.protocol !== 'https:' || base.origin !== 'https://infra.aviarockets.cl') return;
  const layout = document.querySelector('#app-layout');
  const header = document.querySelector('.site-header');
  if (!layout || !header) return;
  let services = [], authorized = false, active = false, timer, opening;
  let selected = 'general', renewal;
  const panel = document.createElement('section');
  panel.id = 'infrastructure-panel';
  panel.hidden = true;
  panel.setAttribute('aria-label', 'Infraestructura');
  panel.innerHTML = `<div id="infra-notice" hidden><p id="infra-status" role="status" aria-live="polite"></p><button type="button" id="infra-retry" hidden>Reconectar</button></div><div id="infra-summary"></div><iframe id="infra-screen" title="Navegador remoto privado de Infraestructura" referrerpolicy="no-referrer" hidden></iframe>`;
  layout.after(panel);
  const frame = panel.querySelector('iframe');
  const summary = panel.querySelector('#infra-summary');
  const notice = panel.querySelector('#infra-notice');
  const status = panel.querySelector('#infra-status');
  const retry = panel.querySelector('#infra-retry');
  const menu = document.createElement('div');
  menu.id = 'infra-menu';
  menu.innerHTML = `<button id="infra-menu-button" class="app-header-trigger" type="button" aria-expanded="false" aria-controls="infra-dropdown">Infraestructura <span aria-hidden="true">⌄</span></button><div id="infra-dropdown" hidden aria-label="Servicios de infraestructura"></div>`;
  const trigger = menu.querySelector('button');
  const dropdown = menu.querySelector('#infra-dropdown');
  const syncHeader = () => panel.style.setProperty('--infra-header-height', `${header.getBoundingClientRect().bottom}px`);
  new ResizeObserver(syncHeader).observe(header);
  window.addEventListener('resize', syncHeader);

  function message(text = '', canRetry = false) {
    status.textContent = text;
    notice.hidden = !text;
    retry.hidden = !canRetry;
  }
  function collapse() {
    dropdown.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  }
  async function request(path, method = 'POST', token) {
    const result = await fetch(new URL(path, base), {
      method, credentials: 'include', cache: 'no-store',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!result.ok) throw new Error(String(result.status));
    return result.json();
  }
  function renew() {
    if (!renewal) renewal = (async () => {
      const { data: { session } } = await auth.auth.getSession();
      if (!session) throw new Error('401');
      const data = await request('/session', 'POST', session.access_token);
      const changed = JSON.stringify(services) !== JSON.stringify(data.services);
      services = data.services;
      authorized = true;
      if (changed || !dropdown.childElementCount) render();
      installMenu();
    })().finally(() => { renewal = null; });
    return renewal;
  }
  function failure(error) {
    if (['401', '403'].includes(error.message)) {
      authorized = false;
      frame.removeAttribute('src');
      frame.hidden = true;
      clearInterval(timer);
      menu.remove();
      message(error.message === '403' ? 'Tu cuenta no tiene acceso a Infraestructura.' : 'Vuelve a iniciar sesión en Avia Rockets.', true);
    } else message('No se pudo conectar. Intenta reconectar.', true);
  }
  async function open(id = selected) {
    if (opening) return;
    opening = true;
    active = true;
    document.body.classList.add('infra-active');
    layout.hidden = true;
    panel.hidden = false;
    collapse();
    syncHeader();
    message('Conectando…');
    try {
      // Refresh transport on every entry, even after a background tab was suspended.
      await renew();
      if (id !== 'general') await request(`/services/${encodeURIComponent(id)}/activate`);
      selected = id;
      summary.hidden = id !== 'general';
      frame.hidden = id === 'general';
      if (id !== 'general' && !frame.hasAttribute('src')) frame.src = new URL('/remote/avia.html', base).href;
      dropdown.querySelectorAll('[data-service]').forEach(b => b.setAttribute('aria-current', String(b.dataset.service === id)));
      message();
      clearInterval(timer);
      timer = setInterval(() => renew().then(() => message()).catch(failure), 45000);
    } catch (error) { failure(error); }
    finally { opening = false; }
  }
  function close() {
    active = false;
    clearInterval(timer);
    collapse();
    document.body.classList.remove('infra-active');
    panel.hidden = true;
    layout.hidden = false;
    frame.removeAttribute('src');
    // Leaving this view must not revoke the cookie shared with another Avia tab.
    // The short-lived transport still expires unless an active view renews it.
  }
  function render() {
    dropdown.replaceChildren();
    summary.replaceChildren();
    for (const service of [{ id: 'general', label: 'General', configured: true }, ...services]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = service.label;
      button.dataset.service = service.id;
      button.disabled = !service.configured;
      button.setAttribute('aria-current', String(selected === service.id));
      if (!service.configured) button.title = 'Pendiente de configurar';
      button.addEventListener('click', () => { open(service.id); trigger.focus(); });
      dropdown.append(button);
      if (service.id !== 'general') {
        const card = document.createElement('button');
        card.type = 'button';
        card.textContent = service.label;
        card.disabled = !service.configured;
        card.addEventListener('click', () => open(service.id));
        summary.append(card);
      }
    }
  }
  function installMenu() {
    const nav = header.querySelector('.nav-panel');
    if (authorized && nav && !nav.contains(menu)) nav.prepend(menu);
  }
  trigger.addEventListener('click', () => {
    const show = dropdown.hidden;
    header.querySelectorAll('.app-header-menu.is-open').forEach(m => {
      m.classList.remove('is-open');
      m.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });
    dropdown.hidden = !show;
    trigger.setAttribute('aria-expanded', String(show));
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { collapse(); trigger.focus(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      dropdown.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      const buttons = [...dropdown.querySelectorAll('button:not(:disabled)')];
      const index = buttons.indexOf(document.activeElement);
      buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus();
    }
  });
  document.addEventListener('click', event => { if (!menu.contains(event.target)) collapse(); });
  menu.addEventListener('focusout', event => { if (!menu.contains(event.relatedTarget)) collapse(); });
  retry.addEventListener('click', () => open());
  header.addEventListener('click', event => {
    if (active && !menu.contains(event.target) && event.target.closest('button,a')) close();
  }, true);
  window.addEventListener('message', event => {
    if (!active || event.origin !== base.origin || event.source !== frame.contentWindow) return;
    if (event.data?.type === 'infra-connection') {
      if (event.data.connected) message();
      else renew().catch(failure);
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (active && !document.hidden) renew().catch(failure);
  });
  auth.auth.onAuthStateChange(event => {
    if (event === 'SIGNED_OUT') {
      close();
      authorized = false;
      menu.remove();
      request('/session', 'DELETE').catch(() => {});
    }
  });
  // Do not delete the shared cookie on reload/pagehide: it races the next page.
  new MutationObserver(installMenu).observe(header, { childList: true, subtree: true });
  renew().catch(() => {});
}
