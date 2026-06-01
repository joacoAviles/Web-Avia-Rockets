const AVIA_APP_API = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || "https://api.aviarockets.cl").replace(/\/$/, "");
const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";

let appState = {
  dashboard: null,
  user: null,
  account: null,
  causes: [],
  statusFilter: "all",
  search: ""
};

function appGetToken() {
  return localStorage.getItem(AVIA_TOKEN_KEY);
}

function appGetStoredUser() {
  try {
    const raw = localStorage.getItem(AVIA_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function appClearSession() {
  localStorage.removeItem(AVIA_TOKEN_KEY);
  localStorage.removeItem(AVIA_USER_KEY);
}

async function appFetch(path, options = {}) {
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

function appSetText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value ?? "-";
}

function appEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function appBoolLabel(value) {
  return value ? "Activado" : "Desactivado";
}

function appStatusLabel(value) {
  const map = { active: "Activa", inactive: "Pausada", all: "Todas" };
  return map[value] || value || "-";
}

function appPaidLabel(account) {
  return account?.subscription?.is_paid ? "Pagado" : "No pagado";
}

function appRenderUser(user) {
  const name = user?.name || user?.full_name || user?.email || "Usuario";
  appSetText("app-user-name", name);
  appSetText("app-user-email", user?.email || "Sesión local");
  appSetText("app-user-role", user?.role || "user");
}

function appSetStatCard(index, label, value) {
  const cards = document.querySelectorAll(".app-stat");
  const card = cards[index];
  if (!card) return;
  const small = card.querySelector("small");
  const strong = card.querySelector("strong");
  if (small) small.textContent = label;
  if (strong) strong.textContent = value;
}

function appRenderStats() {
  const stats = appState.dashboard?.stats || {};
  appSetStatCard(0, "Causas activas", String(stats.active_causes_count ?? 0));
  appSetStatCard(1, "Causas pausadas", String(stats.inactive_causes_count ?? 0));
  appSetStatCard(2, "Correo resumen", appBoolLabel(stats.daily_summary_email_enabled));
}

function appRenderSidebar() {
  const menu = document.getElementById("app-product-menu");
  if (!menu) return;
  const items = [
    ["all", "Todas", `${appState.causes.length} causas`],
    ["active", "Activas", `${appState.causes.filter((cause) => cause.user_status === "active").length} activas`],
    ["inactive", "Pausadas", `${appState.causes.filter((cause) => cause.user_status === "inactive").length} pausadas`]
  ];
  menu.innerHTML = items.map(([status, label, meta]) => {
    const active = appState.statusFilter === status ? " is-active" : "";
    return `<button class="app-product-button${active}" type="button" data-cause-filter="${status}"><strong>${label.slice(0, 2).toUpperCase()}</strong><span>${label}</span><small>${meta}</small></button>`;
  }).join("");
}

function appRenderCauseSummary() {
  const account = appState.account;
  const stats = appState.dashboard?.stats || {};
  const summaryEmail = stats.daily_summary_email_enabled;
  return `
    <div class="app-config-grid">
      <div class="app-config-row"><span>Plan de pago</span><strong>${appEscape(appPaidLabel(account))}</strong></div>
      <div class="app-config-row"><span>Plan</span><strong>${appEscape(account?.subscription?.plan_slug || "free")}</strong></div>
      <div class="app-config-row"><span>Causas activas</span><strong>${appEscape(stats.active_causes_count ?? 0)}</strong></div>
      <div class="app-config-row"><span>Causas pausadas</span><strong>${appEscape(stats.inactive_causes_count ?? 0)}</strong></div>
      <div class="app-config-row"><span>Correo resumen</span><strong>${appEscape(appBoolLabel(summaryEmail))}</strong></div>
      <div class="app-config-row"><span>Términos y condiciones</span><strong>Versión ${appEscape(account?.terms?.version || "1.102")}</strong></div>
    </div>
  `;
}

function appFilteredCauses() {
  const query = appState.search.trim().toLowerCase();
  return appState.causes.filter((cause) => {
    const statusOk = appState.statusFilter === "all" || cause.user_status === appState.statusFilter;
    if (!statusOk) return false;
    if (!query) return true;
    return [cause.code, cause.title, cause.court].some((value) => String(value || "").toLowerCase().includes(query));
  });
}

function appRenderCauseRows() {
  const causes = appFilteredCauses();
  if (!causes.length) {
    return `<div class="app-config-row"><span>Sin resultados</span><strong>No hay causas para este filtro.</strong></div>`;
  }
  return causes.map((cause) => {
    const nextStatus = cause.user_status === "active" ? "inactive" : "active";
    const actionLabel = cause.user_status === "active" ? "Pausar" : "Reactivar";
    return `
      <div class="app-config-row" data-cause-row="${cause.id}">
        <span>
          <strong>${appEscape(cause.code)}</strong><br>
          ${appEscape(cause.court || "Tribunal no informado")}<br>
          <small>${appEscape(cause.title || "Causa sin título")}</small>
        </span>
        <strong>
          ${appEscape(appStatusLabel(cause.user_status))}<br>
          <button class="btn btn-secondary" type="button" data-cause-status="${cause.id}" data-next-status="${nextStatus}">${actionLabel}</button>
        </strong>
      </div>
    `;
  }).join("");
}

function appRenderCausePanel() {
  appSetText("app-view-label", "Resumen de causas");
  appSetText("app-product-title", "Mis causas");
  appSetText("app-product-description", "Agrega, pausa, reactiva, busca y carga causas para el seguimiento automático.");
  appSetText("app-product-status", appPaidLabel(appState.account));
  appSetText("app-product-slug", "causas");
  appSetText("app-product-role", appState.user?.role || "user");

  const demo = document.getElementById("app-product-demo");
  if (demo) {
    demo.hidden = false;
    demo.innerHTML = appRenderCauseSummary();
  }

  const configTitle = document.getElementById("app-config-title");
  if (configTitle) configTitle.textContent = "Listado de causas";

  const config = document.getElementById("app-product-config");
  if (!config) return;
  config.innerHTML = `
    <div class="app-config-row">
      <span>Buscar causa</span>
      <strong><input id="cause-search-input" type="search" value="${appEscape(appState.search)}" placeholder="Rol, tribunal o título" style="width:100%;min-width:220px;border:1px solid rgba(134,176,255,.22);border-radius:14px;background:rgba(255,255,255,.045);color:inherit;padding:.78rem" /></strong>
    </div>
    <div class="app-config-row">
      <span>Filtros</span>
      <strong>
        <button class="btn btn-secondary" type="button" data-cause-filter="all">Todas</button>
        <button class="btn btn-secondary" type="button" data-cause-filter="active">Activas</button>
        <button class="btn btn-secondary" type="button" data-cause-filter="inactive">Pausadas</button>
      </strong>
    </div>
    <form class="app-config-row" id="cause-add-form">
      <span>Agregar causa</span>
      <strong>
        <input name="code" required placeholder="C-5351-2026" style="width:150px;border:1px solid rgba(134,176,255,.22);border-radius:14px;background:rgba(255,255,255,.045);color:inherit;padding:.78rem" />
        <input name="court" placeholder="Tribunal" style="width:220px;border:1px solid rgba(134,176,255,.22);border-radius:14px;background:rgba(255,255,255,.045);color:inherit;padding:.78rem" />
        <button class="btn btn-primary" type="submit">Agregar</button>
      </strong>
    </form>
    <details class="app-config-row">
      <summary><strong>Carga masiva</strong></summary>
      <form id="cause-bulk-form" style="display:grid;gap:.75rem;width:100%;margin-top:.75rem">
        <textarea name="bulk" rows="6" placeholder="Una causa por línea. Ejemplo: C-5351-2026 | 29º Juzgado Civil de Santiago" style="width:100%;border:1px solid rgba(134,176,255,.22);border-radius:14px;background:rgba(255,255,255,.045);color:inherit;padding:.78rem"></textarea>
        <button class="btn btn-primary" type="submit">Cargar causas</button>
      </form>
    </details>
    <div id="cause-action-output" class="app-query-output" style="display:none"></div>
    <div id="cause-list-rows">${appRenderCauseRows()}</div>
  `;
  appBindCauseControls();
}

function appShowOutput(message, isError = false) {
  const output = document.getElementById("cause-action-output");
  if (!output) return;
  output.style.display = "block";
  output.textContent = message;
  output.style.color = isError ? "#ffd2d2" : "#d8e6ff";
}

async function appReloadDashboard() {
  appState.dashboard = await appFetch("/api/dashboard");
  appState.user = appState.dashboard?.user || appState.user;
  appState.account = appState.dashboard?.account || null;
  appState.causes = Array.isArray(appState.dashboard?.causes) ? appState.dashboard.causes : [];
  appRenderUser(appState.user);
  appRenderStats();
  appRenderSidebar();
  appRenderCausePanel();
}

function appBindCauseControls() {
  document.querySelectorAll("[data-cause-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.statusFilter = button.dataset.causeFilter || "all";
      appRenderSidebar();
      appRenderCausePanel();
    });
  });

  document.getElementById("cause-search-input")?.addEventListener("input", (event) => {
    appState.search = event.target.value || "";
    const rows = document.getElementById("cause-list-rows");
    if (rows) rows.innerHTML = appRenderCauseRows();
    appBindRowActions();
  });

  document.getElementById("cause-add-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await appFetch("/api/causes", {
        method: "POST",
        body: JSON.stringify({
          code: String(form.get("code") || "").trim(),
          court: String(form.get("court") || "").trim() || null
        })
      });
      appShowOutput("Causa agregada correctamente.");
      await appReloadDashboard();
    } catch (error) {
      appShowOutput(error.message || "Error agregando causa.", true);
    }
  });

  document.getElementById("cause-bulk-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const lines = String(form.get("bulk") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const causes = lines.map((line) => {
      const [code, court] = line.split("|").map((part) => part.trim());
      return { code, court: court || null };
    }).filter((cause) => cause.code);
    if (!causes.length) {
      appShowOutput("No hay causas válidas para cargar.", true);
      return;
    }
    try {
      const result = await appFetch("/api/causes/bulk", { method: "POST", body: JSON.stringify({ causes }) });
      appShowOutput(`Carga masiva terminada. Registros procesados: ${result.created_or_updated || 0}.`);
      await appReloadDashboard();
    } catch (error) {
      appShowOutput(error.message || "Error en carga masiva.", true);
    }
  });

  appBindRowActions();
}

function appBindRowActions() {
  document.querySelectorAll("[data-cause-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const causeId = button.dataset.causeStatus;
      const status = button.dataset.nextStatus;
      try {
        await appFetch(`/api/causes/${causeId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
        await appReloadDashboard();
      } catch (error) {
        appShowOutput(error.message || "Error actualizando causa.", true);
      }
    });
  });
}

function appSetupSidebarToggle() {
  const layout = document.getElementById("app-layout");
  const toggle = document.getElementById("app-sidebar-toggle");
  if (!layout || !toggle) return;
  toggle.addEventListener("click", () => {
    const compact = layout.classList.toggle("is-compact");
    toggle.textContent = compact ? "›" : "‹";
    toggle.setAttribute("aria-label", compact ? "Expandir menú" : "Compactar menú");
  });
}

async function appLogout() {
  try {
    await appFetch("/api/auth/logout", { method: "POST" });
  } catch (_) {
  } finally {
    appClearSession();
    window.location.href = "login.html";
  }
}

async function appInit() {
  if (!appGetToken()) {
    window.location.href = "login.html?next=app-beta.html";
    return;
  }

  const storedUser = appGetStoredUser() || { name: "Usuario", email: "", role: "user" };
  appState.user = storedUser;
  appRenderUser(storedUser);
  appSetupSidebarToggle();

  try {
    await appReloadDashboard();
  } catch (error) {
    const root = document.getElementById("app-error");
    if (root) {
      root.hidden = false;
      root.textContent = error.message || "No se pudo cargar el panel de causas.";
    }
    return;
  }

  document.getElementById("app-config-button")?.addEventListener("click", () => {
    appState.statusFilter = "all";
    appRenderSidebar();
    appRenderCausePanel();
  });

  document.getElementById("app-logout-button")?.addEventListener("click", appLogout);
}

appInit();