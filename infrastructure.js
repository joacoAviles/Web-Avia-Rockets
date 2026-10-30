import { supabase as auth } from './web-auth/session.js?v=20261030-auth4';

const gateway = window.AVIA_INFRA_GATEWAY;
if (gateway) startInfrastructure(new URL(gateway));

function startInfrastructure(base) {
  if (base.protocol !== 'https:' || base.origin !== 'https://infra.aviarockets.cl') return;
  const layout = document.querySelector('#app-layout');
  const header = document.querySelector('.site-header');
  if (!layout || !header) return;
  let services = [], authorized = false, active = false, timer, opening;
  let selected = 'general', renewal, previewTimer, previewRequest;
  const previewUrls = new Map();
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
  menu.className = 'app-header-menu';
  menu.innerHTML = `<button id="infra-menu-button" class="app-header-trigger" type="button" aria-haspopup="menu" aria-expanded="false" aria-controls="infra-dropdown">Infraestructura</button><div id="infra-dropdown" class="app-header-dropdown" role="menu" hidden aria-label="Servicios de infraestructura"></div>`;
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
    menu.classList.remove('is-open');
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
      stopPreviews(true);
      menu.remove();
      message(error.message === '403' ? 'Tu cuenta no tiene acceso a Infraestructura.' : 'Vuelve a iniciar sesión en Avia Rockets.', true);
    } else message('No se pudo conectar. Intenta reconectar.', true);
  }
  async function open(id = selected) {
    if (opening) return;
    opening = true;
    stopPreviews();
    active = true;
    document.body.classList.add('infra-active');
    trigger.classList.add('is-active');
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
      dropdown.querySelectorAll('[data-service]').forEach(b => {
        b.setAttribute('aria-current', String(b.dataset.service === id));
        b.classList.toggle('is-active', b.dataset.service === id);
      });
      if (id === 'general') refreshPreviews();
      message();
      clearInterval(timer);
      timer = setInterval(() => renew().then(() => message()).catch(failure), 45000);
    } catch (error) { failure(error); }
    finally { opening = false; }
  }
  function close() {
    active = false;
    stopPreviews(true);
    trigger.classList.remove('is-active');
    clearInterval(timer);
    collapse();
    document.body.classList.remove('infra-active');
    panel.hidden = true;
    layout.hidden = false;
    frame.removeAttribute('src');
    // Leaving this view must not revoke the cookie shared with another Avia tab.
    // The short-lived transport still expires unless an active view renews it.
  }
  function stopPreviews(clear = false) {
    clearTimeout(previewTimer);
    previewRequest?.abort();
    if (clear) {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      previewUrls.clear();
      summary.querySelectorAll('img').forEach(img => { img.removeAttribute('src'); img.hidden = true; });
    }
  }
  async function refreshPreviews() {
    clearTimeout(previewTimer);
    if (!active || selected !== 'general' || document.hidden) return;
    const controller = new AbortController();
    previewRequest = controller;
    for (const service of services.filter(s => s.configured)) {
      if (controller.signal.aborted) break;
      const card = summary.querySelector(`[data-preview="${service.id}"]`);
      if (!card) continue;
      const image = card.querySelector('img');
      const caption = card.querySelector('small');
      try {
        const response = await fetch(new URL(`/services/${encodeURIComponent(service.id)}/preview`, base), {
          credentials: 'include', cache: 'no-store', signal: controller.signal,
        });
        if (response.status === 204) {
          caption.textContent = 'Abrir para previsualizar';
          image.hidden = true;
          continue;
        }
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (controller.signal.aborted) break;
        const old = previewUrls.get(service.id);
        const url = URL.createObjectURL(blob);
        previewUrls.set(service.id, url);
        image.src = url;
        image.hidden = false;
        if (old) URL.revokeObjectURL(old);
        caption.textContent = 'Actualizado ' + new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        if (error.name === 'AbortError') break;
        if (['401', '403'].includes(error.message)) { failure(error); return; }
        caption.textContent = 'Vista previa no disponible · Abrir servicio';
      }
    }
    if (!controller.signal.aborted && active && selected === 'general') previewTimer = setTimeout(refreshPreviews, 20000);
  }
  function render() {
    stopPreviews(true);
    dropdown.replaceChildren();
    summary.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'infra-overview-heading';
    const title = document.createElement('h1');
    title.textContent = 'Resumen';
    const count = document.createElement('p');
    count.textContent = `${services.filter(s => s.configured).length} servicios · Vistas previas cada 20 s`;
    heading.append(title, count);
    const grid = document.createElement('div');
    grid.className = 'infra-preview-grid';
    summary.append(heading, grid);
    const descriptions = {
      general: ['RS', 'Todos los servicios'], proxmox: ['PX', 'Máquinas y contenedores'],
      rundeck: ['RD', 'Trabajos y ejecuciones'], kuma: ['UK', 'Monitoreo de servicios'],
      other1: ['01', 'Pendiente de configurar'], other2: ['02', 'Pendiente de configurar'],
    };
    for (const service of [{ id: 'general', label: 'Resumen', configured: true }, ...services]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'app-header-option';
      button.setAttribute('role', 'menuitem');
      const badge = document.createElement('strong');
      const label = document.createElement('span');
      const detail = document.createElement('small');
      badge.textContent = descriptions[service.id][0];
      label.textContent = service.label;
      detail.textContent = descriptions[service.id][1];
      label.append(detail);
      button.append(badge, label);
      button.dataset.service = service.id;
      button.disabled = !service.configured;
      button.setAttribute('aria-current', String(selected === service.id));
      button.classList.toggle('is-active', selected === service.id);
      button.addEventListener('click', () => { open(service.id); trigger.focus(); });
      dropdown.append(button);
      if (service.id !== 'general' && service.configured) {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'infra-preview';
        card.dataset.preview = service.id;
        card.setAttribute('aria-label', `Abrir ${service.label}`);
        const image = document.createElement('img');
        image.alt = `Vista previa de ${service.label}`;
        image.hidden = true;
        const viewport = document.createElement('div');
        viewport.className = 'infra-preview-screen';
        const placeholder = document.createElement('span');
        placeholder.textContent = service.label;
        viewport.append(placeholder, image);
        const footer = document.createElement('div');
        footer.className = 'infra-preview-caption';
        const name = document.createElement('strong');
        name.textContent = service.label;
        const state = document.createElement('small');
        state.textContent = 'Cargando vista previa…';
        footer.append(name, state);
        card.append(viewport, footer);
        card.addEventListener('click', () => open(service.id));
        grid.append(card);
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
    menu.classList.toggle('is-open', show);
    trigger.setAttribute('aria-expanded', String(show));
  });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { collapse(); trigger.focus(); }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      dropdown.hidden = false;
      menu.classList.add('is-open');
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
    if (active && !document.hidden) renew().then(() => { if (selected === 'general') refreshPreviews(); }).catch(failure);
    else stopPreviews();
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
