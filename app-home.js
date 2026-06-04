const AVIA_APP_API = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || "https://api.aviarockets.cl").replace(/\/$/, "");
const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";

const appState = { dashboard: null, user: null, account: null, causes: [], statusFilter: "all", search: "" };

function appGetToken(){ return localStorage.getItem(AVIA_TOKEN_KEY); }
function appClearSession(){ localStorage.removeItem(AVIA_TOKEN_KEY); localStorage.removeItem(AVIA_USER_KEY); }
function appStoredUser(){ try { return JSON.parse(localStorage.getItem(AVIA_USER_KEY) || "null"); } catch (_) { return null; } }
function appSetText(id, value){ const node = document.getElementById(id); if (node) node.textContent = value ?? "-"; }
function appEscape(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function appBool(value){ return value ? "Activado" : "Desactivado"; }
function appStatus(value){ return ({active:"Activa", inactive:"Pausada", all:"Todas"}[value] || value || "-"); }
function appPaid(account){ return account?.subscription?.is_paid ? "Pagado" : "No pagado"; }

async function appFetch(path, options = {}){
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = appGetToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${AVIA_APP_API}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch (_) { data = null; }
  if (!response.ok) throw new Error(data?.detail || data?.message || `Error API ${response.status}`);
  return data;
}

function appRenderUser(){
  const user = appState.user || {};
  appSetText("app-user-name", user.full_name || user.name || user.email || "Usuario");
  appSetText("app-user-email", user.email || "-");
  appSetText("app-user-role", user.role || "user");
  appSetText("app-product-role", user.role || "user");
}

function appRenderStats(){
  const stats = appState.dashboard?.stats || {};
  const cards = document.querySelectorAll(".app-stat");
  const values = [String(stats.active_causes_count ?? 0), String(stats.inactive_causes_count ?? 0), appBool(stats.daily_summary_email_enabled)];
  cards.forEach((card, index) => { const strong = card.querySelector("strong"); if (strong) strong.textContent = values[index] ?? "-"; });
}

function appRenderSidebar(){
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
    return `<div class="app-config-row"><span><strong>${appEscape(cause.code)}</strong><br>${appEscape(cause.court || "Tribunal no informado")}<br><small>${appEscape(cause.title || "Causa sin título")}</small></span><strong>${appEscape(appStatus(cause.user_status))}<br><button class="btn btn-secondary" type="button" data-cause-status="${cause.id}" data-next-status="${nextStatus}">${action}</button></strong></div>`;
  }).join("");
}

function appRenderPanel(){
  appSetText("app-view-label", "Home productivo");
  appSetText("app-product-title", "Mis causas");
  appSetText("app-product-description", "Agrega, pausa, reactiva, busca y carga causas para el seguimiento automático.");
  appSetText("app-product-status", appBool(appState.dashboard?.stats?.daily_summary_email_enabled));
  appSetText("app-product-slug", "causas");
  const demo = document.getElementById("app-product-demo");
  if (demo) demo.innerHTML = appSummaryHtml();
  appSetText("app-config-title", "Listado de causas");
  const config = document.getElementById("app-product-config");
  if (!config) return;
  config.innerHTML = `<div class="app-config-row"><span>Buscar causa</span><strong><input id="cause-search-input" type="search" value="${appEscape(appState.search)}" placeholder="Rol, tribunal o título" /></strong></div><div class="app-config-row"><span>Filtros</span><strong><button class="btn btn-secondary" type="button" data-cause-filter="all">Todas</button> <button class="btn btn-secondary" type="button" data-cause-filter="active">Activas</button> <button class="btn btn-secondary" type="button" data-cause-filter="inactive">Pausadas</button></strong></div><form class="app-config-row" id="cause-add-form"><span>Agregar causa</span><strong><input name="code" required placeholder="C-5351-2026" /> <input name="court" placeholder="Tribunal" /> <button class="btn btn-primary" type="submit">Agregar</button></strong></form><details class="app-config-row"><summary><strong>Carga masiva</strong></summary><form id="cause-bulk-form"><textarea name="bulk" rows="6" placeholder="Una causa por línea. Ejemplo: C-5351-2026 | 29º Juzgado Civil de Santiago"></textarea><br><button class="btn btn-primary" type="submit">Cargar causas</button></form></details><div id="cause-action-output" class="app-query-output" style="display:none"></div><div id="cause-list-rows">${appCauseRows()}</div>`;
  appBindControls();
}

function appShow(message, isError = false){ const out = document.getElementById("cause-action-output"); if (out) { out.style.display = "block"; out.textContent = message; out.style.color = isError ? "#ffd2d2" : "#d8e6ff"; } }

async function appReload(){
  appState.dashboard = await appFetch("/api/dashboard");
  appState.user = appState.dashboard?.user || appState.user;
  appState.account = appState.dashboard?.account || null;
  appState.causes = Array.isArray(appState.dashboard?.causes) ? appState.dashboard.causes : [];
  appRenderUser(); appRenderStats(); appRenderSidebar(); appRenderPanel();
}

function appBindControls(){
  document.querySelectorAll("[data-cause-filter]").forEach((button) => button.addEventListener("click", () => { appState.statusFilter = button.dataset.causeFilter || "all"; appRenderSidebar(); appRenderPanel(); }));
  document.getElementById("cause-search-input")?.addEventListener("input", (event) => { appState.search = event.target.value || ""; const rows = document.getElementById("cause-list-rows"); if (rows) rows.innerHTML = appCauseRows(); appBindRowActions(); });
  document.getElementById("cause-add-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await appFetch("/api/causes", { method:"POST", body:JSON.stringify({ code:String(form.get("code") || "").trim(), court:String(form.get("court") || "").trim() || null }) }); appShow("Causa agregada correctamente."); await appReload(); } catch (error) { appShow(error.message || "Error agregando causa.", true); } });
  document.getElementById("cause-bulk-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const causes = String(form.get("bulk") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [code, court] = line.split("|").map((part) => part.trim()); return { code, court: court || null }; }).filter((cause) => cause.code); if (!causes.length) return appShow("No hay causas válidas para cargar.", true); try { const result = await appFetch("/api/causes/bulk", { method:"POST", body:JSON.stringify({ causes }) }); appShow(`Carga masiva terminada. Registros procesados: ${result.created_or_updated || 0}.`); await appReload(); } catch (error) { appShow(error.message || "Error en carga masiva.", true); } });
  appBindRowActions();
}

function appBindRowActions(){
  document.querySelectorAll("[data-cause-status]").forEach((button) => button.addEventListener("click", async () => { try { await appFetch(`/api/causes/${button.dataset.causeStatus}/status`, { method:"PATCH", body:JSON.stringify({ status: button.dataset.nextStatus }) }); await appReload(); } catch (error) { appShow(error.message || "Error actualizando causa.", true); } }));
}

function appSetupSidebarToggle(){ const layout = document.getElementById("app-layout"); const toggle = document.getElementById("app-sidebar-toggle"); if (!layout || !toggle) return; toggle.addEventListener("click", () => { const compact = layout.classList.toggle("is-compact"); toggle.textContent = compact ? "›" : "‹"; }); }
async function appLogout(){ try { await appFetch("/api/auth/logout", { method:"POST" }); } catch (_) {} appClearSession(); window.location.href = "login.html"; }

async function appInit(){
  if (!appGetToken()) { window.location.href = "login.html?next=app.html"; return; }
  appState.user = appStoredUser() || { name:"Usuario", email:"", role:"user" };
  appRenderUser(); appSetupSidebarToggle();
  try { await appReload(); } catch (error) { const root = document.getElementById("app-error"); if (root) { root.hidden = false; root.textContent = error.message || "No se pudo cargar el home productivo."; } return; }
  document.getElementById("app-config-button")?.addEventListener("click", () => { appState.statusFilter = "all"; appRenderSidebar(); appRenderPanel(); });
  document.getElementById("app-logout-button")?.addEventListener("click", appLogout);
}

appInit();