const AVIA_APP_API = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || "https://api.aviarockets.cl").replace(/\/$/, "");
const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";

const appState = {
  dashboard: null,
  user: null,
  account: null,
  causes: [],
  statusFilter: "all",
  search: "",
  view: "causes",
};

function appGetToken(){ return localStorage.getItem(AVIA_TOKEN_KEY); }
function appClearSession(){ localStorage.removeItem(AVIA_TOKEN_KEY); localStorage.removeItem(AVIA_USER_KEY); }
function appStoredUser(){ try { return JSON.parse(localStorage.getItem(AVIA_USER_KEY) || "null"); } catch (_) { return null; } }
function appSetText(id, value){ const node = document.getElementById(id); if (node) node.textContent = value ?? "-"; }
function appEscape(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function appBool(value){ return value ? "Activado" : "Desactivado"; }
function appStatus(value){ return ({active:"Activa", inactive:"Pausada", all:"Todas"}[value] || value || "-"); }
function appPaid(account){ return account?.subscription?.is_paid ? "Pagado" : "No pagado"; }
function appFormatDate(value){ if (!value) return "-"; try { return new Date(value).toLocaleString("es-CL", { dateStyle:"short", timeStyle:"short" }); } catch (_) { return String(value); } }

async function appFetch(path, options = {}){
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = appGetToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${AVIA_APP_API}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch (_) { data = null; }
  if (response.status === 401 || (response.status === 404 && data?.error === "USER_NOT_FOUND")) {
    appClearSession();
    window.location.href = "login.html?next=app.html";
    throw new Error("Sesión expirada o inválida");
  }
  if (!response.ok) throw new Error(data?.detail || data?.message || data?.error || `Error API ${response.status}`);
  return data;
}

function appRenderUser(){
  const user = appState.user || {};
  appSetText("app-user-name", user.full_name || user.name || user.email || "Usuario");
  appSetText("app-user-email", user.email || "-");
  appSetText("app-user-role", user.role || "client");
  appSetText("app-product-role", user.role || "client");
}

function appRenderStats(){
  const stats = appState.dashboard?.stats || {};
  const cards = document.querySelectorAll(".app-stat");
  const values = [String(stats.active_causes_count ?? 0), String(stats.inactive_causes_count ?? 0), appBool(stats.daily_summary_email_enabled)];
  cards.forEach((card, index) => { const strong = card.querySelector("strong"); if (strong) strong.textContent = values[index] ?? "-"; });
}

function appRenderSidebar(){
  document.getElementById("app-causes-button")?.classList.toggle("is-active", appState.view === "causes");
  document.getElementById("app-config-button")?.classList.toggle("is-active", appState.view === "settings");
  const menu = document.getElementById("app-product-menu");
  if (!menu) return;
  const active = appState.causes.filter((cause) => cause.user_status === "active").length;
  const inactive = appState.causes.filter((cause) => cause.user_status === "inactive").length;
  const items = [["all", "Todas", `${appState.causes.length} causas`], ["active", "Activas", `${active} activas`], ["inactive", "Pausadas", `${inactive} pausadas`]];
  menu.innerHTML = items.map(([value, label, meta]) => `<button class="app-product-button${appState.statusFilter === value ? " is-active" : ""}" type="button" data-cause-filter="${value}"><strong>${label.slice(0,2).toUpperCase()}</strong><span>${label}</span><small>${meta}</small></button>`).join("");
}

function appSummaryHtml(){
  const account = appState.account || {};
  const stats = appState.dashboard?.stats || {};
  return `<div class="app-config-grid">
    <div class="app-config-row"><span>Plan de pago</span><strong>${appEscape(appPaid(account))}</strong></div>
    <div class="app-config-row"><span>Plan</span><strong>${appEscape(account.subscription?.plan_slug || "free")}</strong></div>
    <div class="app-config-row"><span>Causas activas</span><strong>${appEscape(stats.active_causes_count ?? 0)}</strong></div>
    <div class="app-config-row"><span>Causas pausadas</span><strong>${appEscape(stats.inactive_causes_count ?? 0)}</strong></div>
    <div class="app-config-row"><span>Correo resumen</span><strong>${appEscape(appBool(stats.daily_summary_email_enabled))}</strong></div>
    <div class="app-config-row"><span>Términos y condiciones</span><strong>Versión ${appEscape(account.terms?.version || "1.102")}</strong></div>
  </div>`;
}

function appFilteredCauses(){
  const q = appState.search.trim().toLowerCase();
  return appState.causes.filter((cause) => {
    if (appState.statusFilter !== "all" && cause.user_status !== appState.statusFilter) return false;
    if (!q) return true;
    return [cause.code, cause.title, cause.court].some((value) => String(value || "").toLowerCase().includes(q));
  });
}

function appCauseRows(){
  const causes = appFilteredCauses();
  if (!causes.length) return `<div class="app-config-row"><span>Sin resultados</span><strong>No hay causas para este filtro.</strong></div>`;
  return causes.map((cause) => {
    const nextStatus = cause.user_status === "active" ? "inactive" : "active";
    const action = cause.user_status === "active" ? "Pausar" : "Reactivar";
    const latest = cause.latest_result;
    const comparison = cause.comparison || {};
    const latestText = latest ? `${comparison.label || (latest.has_changes ? "Cambio" : "Sin cambio")} · ${latest.summary || latest.result_text || "Resultado registrado"}` : "Sin resultados registrados";
    const datesText = latest ? `Hoy: ${appFormatDate(comparison.latest_checked_at || latest.checkedAt)} · Anterior: ${appFormatDate(comparison.previous_checked_at)}` : "Carga pendiente";
    return `<div class="app-config-row app-cause-row"><span><strong>${appEscape(cause.code)}</strong><br>${appEscape(cause.court || "Tribunal no informado")}<br><small>${appEscape(cause.title || "Causa sin título")}</small><br><small>${appEscape(latestText)}</small><br><small>${appEscape(datesText)}</small></span><strong class="app-cause-actions">${appEscape(appStatus(cause.user_status))}<br><button class="btn btn-secondary" type="button" data-cause-status="${cause.id}" data-next-status="${nextStatus}">${action}</button><button class="btn btn-secondary" type="button" data-cause-results="${cause.id}">Ver resultados</button><button class="btn btn-secondary" type="button" data-cause-run="${cause.id}">Revisar ahora</button></strong></div>
      <form class="app-config-row app-result-form" data-result-form="${cause.id}"><span>Nuevo resultado<br><small>Guarda una salida manual para esta causa.</small></span><strong class="app-form-inline app-result-inline"><input name="summary" placeholder="Resumen" /><input name="result_text" placeholder="Detalle del resultado" /><label class="app-checkbox-line"><input type="checkbox" name="has_changes" /> Cambio</label><button class="btn btn-primary" type="submit">Guardar resultado</button></strong></form>`;
  }).join("");
}

function appRenderCausesPanel(){
  appSetText("app-view-label", "Legal / Usuario");
  appSetText("app-product-title", "Mis causas");
  appSetText("app-product-description", "Agrega, pausa, reactiva, busca y carga causas para el seguimiento automático.");
  appSetText("app-product-status", appBool(appState.dashboard?.stats?.daily_summary_email_enabled));
  appSetText("app-product-slug", "causas");
  const demo = document.getElementById("app-product-demo");
  if (demo) demo.innerHTML = appSummaryHtml();
  appSetText("app-config-title", "Listado de causas");
  const config = document.getElementById("app-product-config");
  if (!config) return;
  config.innerHTML = `<div class="app-config-row"><span>Buscar causa</span><strong><input id="cause-search-input" type="search" value="${appEscape(appState.search)}" placeholder="Rol, tribunal o título" /></strong></div>
    <div class="app-config-row"><span>Filtros</span><strong class="app-row-actions"><button class="btn btn-secondary" type="button" data-cause-filter="all">Todas</button><button class="btn btn-secondary" type="button" data-cause-filter="active">Activas</button><button class="btn btn-secondary" type="button" data-cause-filter="inactive">Pausadas</button></strong></div>
    <form class="app-config-row" id="cause-add-form"><span>Agregar causa</span><strong class="app-form-inline app-cause-add-inline"><input name="code" required placeholder="C-5351-2026" /><input name="court" placeholder="Tribunal" /><input name="title" placeholder="Título o materia" /><button class="btn btn-primary" type="submit" data-cause-add-button onclick="window.appSubmitCauseAdd && window.appSubmitCauseAdd(event)">Agregar</button></strong></form>
    <details class="app-config-row"><summary><strong>Carga masiva</strong></summary><form id="cause-bulk-form"><textarea name="bulk" rows="6" placeholder="Una causa por línea. Ejemplo: C-5351-2026 | 29º Juzgado Civil de Santiago"></textarea><br><button class="btn btn-primary" type="submit">Cargar causas</button></form></details>
    <div id="cause-action-output" class="app-query-output" style="display:none"></div><div id="cause-list-rows">${appCauseRows()}</div>`;
  appBindControls();
}

function appRenderSettingsPanel(){
  const account = appState.account || {};
  const settings = account.settings || {};
  const subscription = account.subscription || {};
  appSetText("app-view-label", "Configuración de usuario");
  appSetText("app-product-title", "Mi cuenta");
  appSetText("app-product-description", "Datos personales, suscripción, correo resumen, tema, forma de pago, términos y eliminación de cuenta.");
  appSetText("app-product-slug", "configuración");
  const demo = document.getElementById("app-product-demo");
  if (demo) demo.innerHTML = appSummaryHtml();
  appSetText("app-config-title", "Configuración conectada");
  const config = document.getElementById("app-product-config");
  if (!config) return;
  config.innerHTML = `<div class="app-config-row"><span>Datos personales</span><strong>${appEscape(account.personal_data?.full_name || appState.user?.full_name || "Usuario")}<br><small>${appEscape(account.email || appState.user?.email || "-")}</small></strong></div>
    <div class="app-config-row"><span>Suscripción</span><strong>${appEscape(subscription.plan_slug || "free")} / ${appEscape(subscription.status || "unpaid")}<br><small>${subscription.is_paid ? "Plan pagado activo" : "Plan no pagado"}</small></strong></div>
    <form class="app-config-row" id="account-settings-form"><span>Preferencias</span><strong class="app-form-inline"><select name="ui_theme_preference"><option value="dark" ${settings.ui_theme_preference === "dark" ? "selected" : ""}>Oscuro</option><option value="light" ${settings.ui_theme_preference === "light" ? "selected" : ""}>Claro</option></select><select name="default_payment_method"><option value="manual" ${settings.default_payment_method === "manual" ? "selected" : ""}>Manual</option><option value="card" ${settings.default_payment_method === "card" ? "selected" : ""}>Tarjeta</option><option value="wire" ${settings.default_payment_method === "wire" ? "selected" : ""}>Transferencia</option><option value="transbank_oneclick" ${settings.default_payment_method === "transbank_oneclick" ? "selected" : ""}>Transbank Oneclick</option><option value="mercadopago" ${settings.default_payment_method === "mercadopago" ? "selected" : ""}>Mercado Pago</option></select><button class="btn btn-primary" type="submit">Guardar</button><label><input type="checkbox" name="daily_summary_email_enabled" ${settings.daily_summary_email_enabled ? "checked" : ""} /> Correo resumen</label></strong></form>
    <div class="app-config-row"><span>Términos y condiciones</span><strong>Versión ${appEscape(account.terms?.version || "1.102")}<br><small>${account.terms?.accepted ? "Aceptados" : "Pendiente"}</small></strong></div>
    <div class="app-config-row"><span>Eliminar cuenta</span><strong><button class="btn btn-secondary" id="account-delete-request" type="button">Solicitar eliminación</button></strong></div>
    <div id="cause-action-output" class="app-query-output" style="display:none"></div>`;
  appBindControls();
}

function appRenderPanel(){
  appRenderSidebar();
  if (appState.view === "settings") appRenderSettingsPanel();
  else appRenderCausesPanel();
}

function appShow(message, isError = false){
  const out = document.getElementById("cause-action-output");
  if (out) { out.style.display = "block"; out.textContent = message; out.style.color = isError ? "#ffd2d2" : "#d8e6ff"; }
}

function appShowResults(data){
  const rows = Array.isArray(data?.results) ? data.results : [];
  const cause = data?.cause || {};
  if (!rows.length) return appShow(`No hay resultados para ${cause.code || "esta causa"}.`);
  const lines = rows.map((result) => {
    const change = result.has_changes ? "Cambio" : "Sin cambio";
    return `${appFormatDate(result.checkedAt || result.createdAt)} | ${change} | ${result.summary || "Resultado"}\n${result.result_text || ""}`;
  });
  appShow(`Resultados de ${cause.code || "causa"}\n\n${lines.join("\n\n")}`);
}

async function appReload(){
  appState.dashboard = await appFetch("/api/dashboard");
  appState.user = appState.dashboard?.user || appState.user;
  appState.account = appState.dashboard?.account || null;
  appState.causes = Array.isArray(appState.dashboard?.causes) ? appState.dashboard.causes : [];
  appRenderUser(); appRenderStats(); appRenderPanel();
}

async function appSubmitCauseForm(formNode){
  const form = new FormData(formNode);
  const code = String(form.get("code") || "").trim();
  if (!code) return appShow("Ingresa el rol de la causa.", true);
  await appFetch("/api/causes", {
    method:"POST",
    body:JSON.stringify({
      code,
      court:String(form.get("court") || "").trim() || null,
      title:String(form.get("title") || "").trim() || null
    })
  });
  await appReload();
  appShow("Causa agregada correctamente.");
}

window.appSubmitCauseAdd = async function appSubmitCauseAdd(event){
  event.preventDefault();
  const formNode = event.currentTarget.closest("form") || document.getElementById("cause-add-form");
  if (!formNode) return appShow("No se encontró el formulario de causa.", true);
  try {
    await appSubmitCauseForm(formNode);
  } catch (error) {
    appShow(error.message || "Error agregando causa.", true);
  }
};

function appBindControls(){
  document.querySelectorAll("[data-cause-filter]").forEach((button) => button.addEventListener("click", () => { appState.view = "causes"; appState.statusFilter = button.dataset.causeFilter || "all"; appRenderPanel(); }));
  document.getElementById("cause-search-input")?.addEventListener("input", (event) => { appState.search = event.target.value || ""; const rows = document.getElementById("cause-list-rows"); if (rows) rows.innerHTML = appCauseRows(); appBindRowActions(); });
  document.getElementById("cause-add-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { await appSubmitCauseForm(event.currentTarget); } catch (error) { appShow(error.message || "Error agregando causa.", true); } });
  document.getElementById("cause-bulk-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const causes = String(form.get("bulk") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [code, court] = line.split("|").map((part) => part.trim()); return { code, court: court || null }; }).filter((cause) => cause.code); if (!causes.length) return appShow("No hay causas válidas para cargar.", true); try { const result = await appFetch("/api/causes/bulk", { method:"POST", body:JSON.stringify({ causes }) }); await appReload(); appShow(`Carga masiva terminada. Registros procesados: ${result.created_or_updated || 0}.`); } catch (error) { appShow(error.message || "Error en carga masiva.", true); } });
  document.getElementById("account-settings-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { appState.account = await appFetch("/api/account/settings", { method:"PATCH", body:JSON.stringify({ ui_theme_preference:String(form.get("ui_theme_preference") || "dark"), default_payment_method:String(form.get("default_payment_method") || "manual"), daily_summary_email_enabled:form.has("daily_summary_email_enabled") }) }); await appReload(); appShow("Configuración guardada."); } catch (error) { appShow(error.message || "Error guardando configuración.", true); } });
  document.getElementById("account-delete-request")?.addEventListener("click", async () => { try { await appFetch("/api/account/delete-request", { method:"POST" }); await appReload(); appShow("Solicitud de eliminación registrada."); } catch (error) { appShow(error.message || "Error solicitando eliminación.", true); } });
  appBindRowActions();
}

function appBindRowActions(){
  document.querySelectorAll("[data-cause-status]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => { try { await appFetch(`/api/causes/${button.dataset.causeStatus}/status`, { method:"PATCH", body:JSON.stringify({ status: button.dataset.nextStatus }) }); await appReload(); } catch (error) { appShow(error.message || "Error actualizando causa.", true); } });
  });
  document.querySelectorAll("[data-cause-run]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => { try { await appFetch(`/api/causes/${button.dataset.causeRun}/run`, { method:"POST" }); await appReload(); appShow("Revisión registrada sin cambios."); } catch (error) { appShow(error.message || "Error registrando revisión.", true); } });
  });
  document.querySelectorAll("[data-cause-results]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => { try { appShowResults(await appFetch(`/api/causes/${button.dataset.causeResults}/results`)); } catch (error) { appShow(error.message || "Error cargando resultados.", true); } });
  });
  document.querySelectorAll("[data-result-form]").forEach((formNode) => {
    if (formNode.dataset.bound === "true") return;
    formNode.dataset.bound = "true";
    formNode.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      try {
        await appFetch(`/api/causes/${event.currentTarget.dataset.resultForm}/results`, {
          method:"POST",
          body:JSON.stringify({
            summary:String(form.get("summary") || "").trim() || "Resultado manual",
            result_text:String(form.get("result_text") || "").trim() || "Resultado registrado desde la web",
            has_changes:form.has("has_changes")
          })
        });
        await appReload();
        appShow("Resultado guardado.");
      } catch (error) {
        appShow(error.message || "Error guardando resultado.", true);
      }
    });
  });
}

function appSetupSidebarToggle(){ const layout = document.getElementById("app-layout"); const toggle = document.getElementById("app-sidebar-toggle"); if (!layout || !toggle) return; toggle.addEventListener("click", () => { const compact = layout.classList.toggle("is-compact"); toggle.textContent = compact ? "›" : "‹"; }); }
async function appLogout(){ try { await appFetch("/api/auth/logout", { method:"POST" }); } catch (_) {} appClearSession(); window.location.href = "login.html"; }

async function appInit(){
  if (!appGetToken()) { window.location.href = "login.html?next=app.html"; return; }
  appState.user = appStoredUser() || { full_name:"Usuario", email:"", role:"client" };
  appRenderUser(); appSetupSidebarToggle();
  document.getElementById("app-causes-button")?.addEventListener("click", () => { appState.view = "causes"; appRenderPanel(); });
  document.getElementById("app-config-button")?.addEventListener("click", () => { appState.view = "settings"; appRenderPanel(); });
  document.getElementById("app-logout-button")?.addEventListener("click", appLogout);
  try { await appReload(); } catch (error) { const root = document.getElementById("app-error"); if (root) { root.hidden = false; root.textContent = error.message || "No se pudo cargar el home productivo."; } }
}

appInit();
