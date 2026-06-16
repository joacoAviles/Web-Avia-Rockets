const AVIA_APP_API = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || "https://api.aviarockets.cl").replace(/\/$/, "");
const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";

const ACADEMY_FALLBACK = {
  ok: true,
  source: "fallback-web",
  stats: { banks_count: 1, total_questions: 8, thematicas_count: 5, due_reviews: 0 },
  banks: [
    {
      bank_id: "robinson-r22-manual-tecnico",
      slug: "robinson-r22-manual-tecnico",
      titulo: "Robinson R22 · Manual técnico",
      dominio: "aviacion",
      tipo_banco: "manual_tecnico",
      tematicas: ["Vigencia documental", "Inspección 100 horas/anual", "Zonas del helicóptero", "Sistema eléctrico", "Vida limitada"],
      questions_count: 8,
      estado: "borrador_estudio",
    },
  ],
  questions: [
    { id:"r22-mt-vig-001", bank_id:"robinson-r22-manual-tecnico", tematica:"Vigencia documental", subtematica:"Revisión vigente", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"¿Por qué se debe revisar la versión vigente del manual antes de estudiar datos técnicos?", respuesta_correcta_texto:"Porque las páginas efectivas pueden cambiar entre revisiones.", explicacion_corta:"Un dato técnico solo sirve si pertenece a la revisión aplicable.", explicacion_profunda:"En manuales técnicos de aeronaves, distintas páginas pueden tener fechas diferentes. La revisión vigente y el revision log determinan qué páginas siguen aplicando.", fuente:{ documento:"r22_mm_DEC_2024_fd49c66adc.pdf" } },
    { id:"r22-mt-vig-002", bank_id:"robinson-r22-manual-tecnico", tematica:"Vigencia documental", subtematica:"Revision log", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"¿Qué documento permite ordenar o verificar las páginas efectivas del manual?", respuesta_correcta_texto:"El revision log.", explicacion_corta:"El revision log permite confirmar qué páginas están vigentes.", explicacion_profunda:"La estructura de publicaciones técnicas exige comprobar la vigencia de las páginas antes de usar datos o tablas.", fuente:{ documento:"r22_mm_DEC_2024_fd49c66adc.pdf" } },
    { id:"r22-mt-insp-001", bank_id:"robinson-r22-manual-tecnico", tematica:"Inspección 100 horas/anual", subtematica:"Alcance general", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"¿Qué áreas generales cubre la inspección de 100 horas/anual?", respuesta_correcta_texto:"Funcionamiento general, zonas físicas y trazabilidad documental.", explicacion_corta:"La inspección combina pruebas funcionales, revisión por accesos y cierre documental.", explicacion_profunda:"El manual ordena el estudio entre ground check, run-up, flight check, preparación, inspección por paneles y control de cumplimiento documental.", fuente:{ documento:"r22_mm_100hour_c2ec0da743.pdf" } },
    { id:"r22-mt-insp-004", bank_id:"robinson-r22-manual-tecnico", tematica:"Inspección 100 horas/anual", subtematica:"Run-up", nivel:"intermedio", tipo_pregunta:"respuesta_corta", pregunta:"¿Qué revisa el run-up?", respuesta_correcta_texto:"Motor, rotor, clutch, governor, tacómetros, carga eléctrica y avisos.", explicacion_corta:"El run-up cruza motor, rotor, instrumentos y avisos.", explicacion_profunda:"El run-up permite estudiar la relación entre planta motriz, sistema rotor, clutch, governor, tacómetros y circuito eléctrico bajo condición funcional.", fuente:{ documento:"r22_mm_100hour_c2ec0da743.pdf" } },
    { id:"r22-mt-zona-003", bank_id:"robinson-r22-manual-tecnico", tematica:"Zonas del helicóptero", subtematica:"Circuit breaker panel", nivel:"intermedio", tipo_pregunta:"respuesta_corta", pregunta:"¿Qué zona agrupa circuit breakers y bus bars?", respuesta_correcta_texto:"El panel eléctrico de protección y distribución.", explicacion_corta:"Ese panel concentra protección, conexiones y distribución eléctrica.", explicacion_profunda:"El estudio del panel debe considerar condición de wiring, conexiones, breakers, bus bars y limpieza interior.", fuente:{ documento:"r22_mm_100hour_c2ec0da743.pdf" } },
    { id:"r22-mt-elec-001", bank_id:"robinson-r22-manual-tecnico", tematica:"Sistema eléctrico", subtematica:"Método de lectura", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"¿Cómo se estudia un circuito eléctrico de forma ordenada?", respuesta_correcta_texto:"Fuente, protección, control, carga y ground.", explicacion_corta:"Ese orden evita mirar cables sin contexto.", explicacion_profunda:"Un circuito se entiende mejor como una cadena funcional: energía, protección, mando o condición, consumo y retorno eléctrico.", fuente:{ documento:"R22_Electrical_System_Schematics_c8dca0bf0c.pdf" } },
    { id:"r22-mt-elec-005", bank_id:"robinson-r22-manual-tecnico", tematica:"Sistema eléctrico", subtematica:"Warning lights", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"¿Qué warning lights conviene agrupar al estudiar el R22?", respuesta_correcta_texto:"Low oil pressure, low fuel, low voltage, clutch, rotor brake, CO, chip/temperature y low RPM.", explicacion_corta:"Esas luces conectan el estudio eléctrico con sistemas y sensores.", explicacion_profunda:"Las luces de aviso no se estudian aisladas: cada una depende de alimentación, control, sensor o condición, carga y ground.", fuente:{ documento:"R22_Electrical_System_Schematics_c8dca0bf0c.pdf" } },
    { id:"r22-mt-vida-001", bank_id:"robinson-r22-manual-tecnico", tematica:"Vida limitada", subtematica:"Método de tiempo", nivel:"intermedio", tipo_pregunta:"respuesta_corta", pregunta:"¿Qué dos formas de medir tiempo aparecen en las limitaciones?", respuesta_correcta_texto:"Engine run time y flight/collective-up time.", explicacion_corta:"El método de conteo determina qué tabla aplicar.", explicacion_profunda:"El manual separa vidas según tiempo de motor o tiempo de vuelo/colectivo arriba. No son intercambiables.", fuente:{ documento:"r22_mm_DEC_2024_fd49c66adc.pdf" } },
  ],
};

const appState = {
  dashboard: null,
  user: null,
  account: null,
  products: [],
  causes: [],
  technicalReviews: null,
  vehicles: [],
  academy: null,
  academyBank: "robinson-r22-manual-tecnico",
  academyTheme: "all",
  academyMode: "study",
  academyQuestionIndex: 0,
  academyAnswerVisible: false,
  vehicleFilter: "all",
  statusFilter: "all",
  search: "",
  vehicleSearch: "",
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
function appFormatDate(value){ if (!value) return "-"; try { return new Date(value).toLocaleDateString("es-CL"); } catch (_) { return String(value); } }
function appDaysText(days){ if (days === null || days === undefined) return "Sin vencimiento"; if (days < 0) return `Vencida hace ${Math.abs(days)} días`; if (days === 0) return "Vence hoy"; return `Vence en ${days} días`; }
function appReviewLabel(status){ return ({ok:"Al día", warning:"Por vencer", expired:"Vencida", unknown:"Sin dato", inactive:"Pausado"}[status] || status || "-"); }
function appNormalizeTheme(value){ return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }

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

function appAcademyQuestions(){
  const academy = appState.academy || ACADEMY_FALLBACK;
  const selectedBank = appState.academyBank || academy.banks?.[0]?.bank_id;
  const selectedTheme = appState.academyTheme || "all";
  return (Array.isArray(academy.questions) ? academy.questions : []).filter((question) => {
    if (selectedBank && question.bank_id && question.bank_id !== selectedBank) return false;
    if (selectedTheme !== "all" && appNormalizeTheme(question.tematica) !== appNormalizeTheme(selectedTheme)) return false;
    return true;
  });
}

function appAcademyStats(){
  const academy = appState.academy || ACADEMY_FALLBACK;
  const banks = Array.isArray(academy.banks) ? academy.banks : [];
  const questions = Array.isArray(academy.questions) ? academy.questions : [];
  const themes = new Set(questions.map((q) => q.tematica).filter(Boolean));
  return {
    banks_count: academy.stats?.banks_count ?? banks.length,
    total_questions: academy.stats?.total_questions ?? questions.length,
    thematicas_count: academy.stats?.tematicas_count ?? themes.size,
  };
}

function appCurrentStats(){
  if (appState.view === "technical-reviews") {
    const stats = appState.technicalReviews?.stats || {};
    return [String(stats.vehicles_up_to_date ?? 0), String(stats.vehicles_due_soon ?? 0), String(stats.vehicles_expired ?? 0)];
  }
  if (appState.view === "academy") {
    const stats = appAcademyStats();
    return [String(stats.banks_count ?? 0), String(stats.total_questions ?? 0), String(stats.thematicas_count ?? 0)];
  }
  const stats = appState.dashboard?.stats || {};
  return [String(stats.active_causes_count ?? 0), String(stats.inactive_causes_count ?? 0), appBool(stats.daily_summary_email_enabled)];
}

function appRenderStats(){
  const cards = document.querySelectorAll(".app-stat");
  const labelsByView = {
    "technical-reviews": ["Autos al día", "Por vencer", "Vencidos"],
    academy: ["Bancos", "Preguntas", "Temáticas"],
    causes: ["Causas activas", "Causas pausadas", "Correo resumen"],
    settings: ["Causas activas", "Causas pausadas", "Correo resumen"],
  };
  const labels = labelsByView[appState.view] || labelsByView.causes;
  const values = appCurrentStats();
  cards.forEach((card, index) => {
    const small = card.querySelector("small");
    const strong = card.querySelector("strong");
    if (small) small.textContent = labels[index] || "-";
    if (strong) strong.textContent = values[index] ?? "-";
  });
}

function appProductItems(){
  const products = Array.isArray(appState.products) ? appState.products : [];
  const hasLegal = products.some((p) => p.slug === "legal");
  const hasReviews = products.some((p) => p.slug === "revision-tecnica");
  const hasAcademy = products.some((p) => ["labs-academy", "academy"].includes(p.slug));
  const academyQuestions = appAcademyStats().total_questions || 0;
  const base = [];
  if (hasLegal || !products.length) base.push(["causes", "Legal / Causas", `${appState.causes.length} causas`, "LG"]);
  if (hasReviews || true) base.push(["technical-reviews", "Revisiones Técnicas", `${appState.vehicles.length || 0} autos`, "RT"]);
  if (hasAcademy || true) base.push(["academy", "Labs / Academy", `${academyQuestions} preguntas`, "AC"]);
  base.push(["settings", "Configuración", "Cuenta y preferencias", "CF"]);
  return base;
}

function appRenderSidebar(){
  document.getElementById("app-causes-button")?.classList.toggle("is-active", appState.view === "causes");
  document.getElementById("app-config-button")?.classList.toggle("is-active", appState.view === "settings");
  const menu = document.getElementById("app-product-menu");
  if (!menu) return;
  const productButtons = appProductItems().map(([view, label, meta, icon]) => `<button class="app-product-button${appState.view === view ? " is-active" : ""}" type="button" data-product-view="${view}"><strong>${icon}</strong><span>${appEscape(label)}</span><small>${appEscape(meta)}</small></button>`).join("");
  let filters = "";
  if (appState.view === "causes") {
    const active = appState.causes.filter((cause) => cause.user_status === "active").length;
    const inactive = appState.causes.filter((cause) => cause.user_status === "inactive").length;
    filters = [["all", "Todas", `${appState.causes.length} causas`], ["active", "Activas", `${active} activas`], ["inactive", "Pausadas", `${inactive} pausadas`]].map(([value, label, meta]) => `<button class="app-product-button${appState.statusFilter === value ? " is-active" : ""}" type="button" data-cause-filter="${value}"><strong>${label.slice(0,2).toUpperCase()}</strong><span>${label}</span><small>${meta}</small></button>`).join("");
  }
  if (appState.view === "technical-reviews") {
    const stats = appState.technicalReviews?.stats || {};
    filters = [["all", "Todos", `${stats.total_vehicles ?? 0} autos`], ["ok", "Al día", `${stats.vehicles_up_to_date ?? 0}`], ["warning", "Por vencer", `${stats.vehicles_due_soon ?? 0}`], ["expired", "Vencidos", `${stats.vehicles_expired ?? 0}`]].map(([value, label, meta]) => `<button class="app-product-button${appState.vehicleFilter === value ? " is-active" : ""}" type="button" data-vehicle-filter="${value}"><strong>${label.slice(0,2).toUpperCase()}</strong><span>${label}</span><small>${meta}</small></button>`).join("");
  }
  if (appState.view === "academy") {
    const questions = appAcademyQuestions();
    const themeButtons = [...new Set((appState.academy?.questions || ACADEMY_FALLBACK.questions).map((q) => q.tematica).filter(Boolean))].slice(0, 4);
    filters = [["all", "Todas", `${(appState.academy?.questions || ACADEMY_FALLBACK.questions).length} preguntas`], ...themeButtons.map((theme) => [theme, theme, `${questions.filter((q) => appNormalizeTheme(q.tematica) === appNormalizeTheme(theme)).length}`])].map(([value, label, meta]) => `<button class="app-product-button${appNormalizeTheme(appState.academyTheme) === appNormalizeTheme(value) ? " is-active" : ""}" type="button" data-academy-theme="${appEscape(value)}"><strong>${label.slice(0,2).toUpperCase()}</strong><span>${appEscape(label)}</span><small>${appEscape(meta)}</small></button>`).join("");
  }
  menu.innerHTML = productButtons + (filters ? `<hr style="width:100%;border:0;border-top:1px solid rgba(134,176,255,.14);margin:.2rem 0">${filters}` : "");
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
  appSetText("app-view-label", "Producto Legal");
  appSetText("app-product-title", "Legal / Causas");
  appSetText("app-product-description", "Agrega, pausa, reactiva, busca y carga causas para el seguimiento automático.");
  appSetText("app-product-status", appBool(appState.dashboard?.stats?.daily_summary_email_enabled));
  appSetText("app-product-slug", "legal");
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

function appFilteredVehicles(){
  const q = appState.vehicleSearch.trim().toLowerCase();
  return appState.vehicles.filter((vehicle) => {
    if (appState.vehicleFilter !== "all" && vehicle.review_status !== appState.vehicleFilter) return false;
    if (!q) return true;
    return [vehicle.plate, vehicle.alias, vehicle.brand, vehicle.model, vehicle.plant_name].some((value) => String(value || "").toLowerCase().includes(q));
  });
}

function appVehicleRows(){
  const vehicles = appFilteredVehicles();
  if (!vehicles.length) return `<div class="app-config-row"><span>Sin autos</span><strong>No hay vehículos para este filtro.</strong></div>`;
  return vehicles.map((vehicle) => {
    const nextStatus = vehicle.vehicle_status === "active" ? "inactive" : "active";
    const action = vehicle.vehicle_status === "active" ? "Pausar" : "Reactivar";
    return `<div class="app-config-row app-cause-row"><span><strong>${appEscape(vehicle.plate)}</strong> · ${appEscape(vehicle.alias || "Vehículo")}
      <br>${appEscape([vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "Marca/modelo no informado")}
      <br><small>${appEscape(appReviewLabel(vehicle.review_status))} · ${appEscape(appDaysText(vehicle.days_to_due))}</small>
      <br><small>Vence: ${appEscape(appFormatDate(vehicle.due_date))} · Planta: ${appEscape(vehicle.plant_name || "No informada")}</small>
      <br><small>${appEscape(vehicle.notes || "Sin observaciones")}</small></span>
      <strong class="app-cause-actions">${appEscape(appReviewLabel(vehicle.review_status))}<br><button class="btn btn-secondary" type="button" data-vehicle-status="${vehicle.id}" data-next-status="${nextStatus}">${action}</button><button class="btn btn-secondary" type="button" data-vehicle-refresh="${vehicle.id}">Marcar al día</button></strong></div>`;
  }).join("");
}

function appReviewsSummaryHtml(){
  const stats = appState.technicalReviews?.stats || {};
  return `<div class="app-config-grid">
    <div class="app-config-row"><span>Total autos activos</span><strong>${appEscape(stats.total_vehicles ?? 0)}</strong></div>
    <div class="app-config-row"><span>Autos al día</span><strong>${appEscape(stats.vehicles_up_to_date ?? 0)}</strong></div>
    <div class="app-config-row"><span>Por vencer 30 días</span><strong>${appEscape(stats.vehicles_due_soon ?? 0)}</strong></div>
    <div class="app-config-row"><span>Vencidos</span><strong>${appEscape(stats.vehicles_expired ?? 0)}</strong></div>
    <div class="app-config-row"><span>Sin dato</span><strong>${appEscape(stats.vehicles_unknown ?? 0)}</strong></div>
    <div class="app-config-row"><span>Alertas abiertas</span><strong>${appEscape(stats.alerts_count ?? 0)}</strong></div>
  </div>`;
}

async function appEnsureReviewsLoaded(force = false){
  if (appState.technicalReviews && !force) return;
  appState.technicalReviews = await appFetch("/api/technical-reviews/dashboard");
  appState.vehicles = Array.isArray(appState.technicalReviews?.vehicles) ? appState.technicalReviews.vehicles : [];
}

async function appRenderTechnicalReviewsPanel(){
  appSetText("app-view-label", "Producto Revisiones Técnicas");
  appSetText("app-product-title", "Revisiones Técnicas Chile");
  appSetText("app-product-description", "Controla autos particulares o flota: autos al día, por vencer, vencidos, plantas, certificados y alertas de revisión técnica.");
  appSetText("app-product-status", `${appState.technicalReviews?.stats?.alerts_count ?? 0} alertas`);
  appSetText("app-product-slug", "revision-tecnica");
  await appEnsureReviewsLoaded();
  appRenderStats();
  const demo = document.getElementById("app-product-demo");
  if (demo) demo.innerHTML = appReviewsSummaryHtml();
  appSetText("app-config-title", "Autos y vencimientos");
  const config = document.getElementById("app-product-config");
  if (!config) return;
  config.innerHTML = `<div class="app-config-row"><span>Buscar auto</span><strong><input id="vehicle-search-input" type="search" value="${appEscape(appState.vehicleSearch)}" placeholder="Patente, alias, marca, modelo o planta" /></strong></div>
    <div class="app-config-row"><span>Filtros</span><strong class="app-row-actions"><button class="btn btn-secondary" type="button" data-vehicle-filter="all">Todos</button><button class="btn btn-secondary" type="button" data-vehicle-filter="ok">Al día</button><button class="btn btn-secondary" type="button" data-vehicle-filter="warning">Por vencer</button><button class="btn btn-secondary" type="button" data-vehicle-filter="expired">Vencidos</button></strong></div>
    <form class="app-config-row" id="vehicle-add-form"><span>Agregar auto</span><strong class="app-form-inline app-cause-add-inline"><input name="plate" required placeholder="ABCD12" /><input name="alias" placeholder="Auto familiar" /><input name="brand" placeholder="Marca" /><input name="model" placeholder="Modelo" /><input name="due_date" type="date" /><button class="btn btn-primary" type="submit">Agregar</button></strong></form>
    <div id="cause-action-output" class="app-query-output" style="display:none"></div><div id="vehicle-list-rows">${appVehicleRows()}</div>`;
  appBindControls();
}

async function appEnsureAcademyLoaded(force = false){
  if (appState.academy && !force) return;
  try {
    appState.academy = await appFetch("/api/academy/dashboard");
  } catch (error) {
    appState.academy = ACADEMY_FALLBACK;
    appState.academy.error = error.message || "Academy API no disponible";
  }
  const banks = Array.isArray(appState.academy?.banks) ? appState.academy.banks : [];
  if (!banks.some((bank) => bank.bank_id === appState.academyBank)) appState.academyBank = banks[0]?.bank_id || "robinson-r22-manual-tecnico";
}

function appAcademySummaryHtml(){
  const stats = appAcademyStats();
  const bank = (appState.academy?.banks || ACADEMY_FALLBACK.banks).find((item) => item.bank_id === appState.academyBank) || {};
  return `<div class="app-config-grid">
    <div class="app-config-row"><span>Producto</span><strong>Labs / Academy<br><small>Subproducto de AVIA Labs para estudio y captación.</small></strong></div>
    <div class="app-config-row"><span>Banco activo</span><strong>${appEscape(bank.titulo || bank.bank_id || "Banco de estudio")}<br><small>${appEscape(bank.dominio || "aprendizaje")} · ${appEscape(bank.tipo_banco || "question_bank")}</small></strong></div>
    <div class="app-config-row"><span>Preguntas</span><strong>${appEscape(stats.total_questions)}<br><small>${appEscape(stats.thematicas_count)} temáticas disponibles</small></strong></div>
    <div class="app-config-row"><span>Estado</span><strong>${appEscape(appState.academy?.source === "fallback-web" ? "Demo local" : "Conectado a API")}<br><small>${appEscape(appState.academy?.error || "Listo para estudiar")}</small></strong></div>
  </div>`;
}

function appAcademyControlsHtml(){
  const banks = appState.academy?.banks || ACADEMY_FALLBACK.banks;
  const themes = ["all", ...new Set((appState.academy?.questions || ACADEMY_FALLBACK.questions).filter((q) => !appState.academyBank || q.bank_id === appState.academyBank).map((q) => q.tematica).filter(Boolean))];
  const bankOptions = banks.map((bank) => `<option value="${appEscape(bank.bank_id)}" ${appState.academyBank === bank.bank_id ? "selected" : ""}>${appEscape(bank.titulo || bank.bank_id)}</option>`).join("");
  const themeOptions = themes.map((theme) => `<option value="${appEscape(theme)}" ${appNormalizeTheme(appState.academyTheme) === appNormalizeTheme(theme) ? "selected" : ""}>${theme === "all" ? "Todas las temáticas" : appEscape(theme)}</option>`).join("");
  return `<div class="app-config-row"><span>Configurar estudio</span><strong class="app-form-inline app-academy-controls"><select id="academy-bank-select">${bankOptions}</select><select id="academy-theme-select">${themeOptions}</select><select id="academy-mode-select"><option value="exam" ${appState.academyMode === "exam" ? "selected" : ""}>Modo examen</option><option value="study" ${appState.academyMode === "study" ? "selected" : ""}>Modo estudio</option><option value="instructor" ${appState.academyMode === "instructor" ? "selected" : ""}>Modo instructor</option></select></strong></div>`;
}

function appAcademyQuestionHtml(){
  const questions = appAcademyQuestions();
  if (!questions.length) return `<div class="app-config-row"><span>Sin preguntas</span><strong>No hay preguntas para este filtro.</strong></div>`;
  if (appState.academyQuestionIndex >= questions.length) appState.academyQuestionIndex = 0;
  if (appState.academyQuestionIndex < 0) appState.academyQuestionIndex = questions.length - 1;
  const question = questions[appState.academyQuestionIndex];
  const visible = appState.academyAnswerVisible;
  const showDeep = visible && appState.academyMode === "instructor";
  return `<article class="academy-card">
    <div class="academy-card-head"><span>${appEscape(question.tematica || "Temática")}</span><small>${appEscape(question.subtematica || "")} · ${appEscape(question.nivel || "")}</small></div>
    <h3>${appEscape(question.pregunta)}</h3>
    ${visible ? `<div class="academy-answer"><strong>Respuesta</strong><p>${appEscape(question.respuesta_correcta_texto || question.respuesta_correcta || "-")}</p><strong>Explicación</strong><p>${appEscape(question.explicacion_corta || "-")}</p>${showDeep ? `<strong>Explicación profunda</strong><p>${appEscape(question.explicacion_profunda || "-")}</p>` : ""}<small>Fuente: ${appEscape(question.fuente?.documento || question.fuente || "No informada")}</small></div>` : `<p class="academy-muted">Responde mentalmente o en voz alta. Luego revela la respuesta.</p>`}
    <div class="academy-actions"><button class="btn btn-secondary" type="button" id="academy-prev">Anterior</button><button class="btn btn-primary" type="button" id="academy-reveal">${visible ? "Ocultar respuesta" : "Ver respuesta"}</button><button class="btn btn-secondary" type="button" id="academy-next">Siguiente</button><small>${appState.academyQuestionIndex + 1} / ${questions.length}</small></div>
  </article>`;
}

async function appRenderAcademyPanel(){
  await appEnsureAcademyLoaded();
  appSetText("app-view-label", "Labs · Subproducto Academy");
  appSetText("app-product-title", "AVIA Academy");
  appSetText("app-product-description", "Espacio de estudio dentro del login: bancos de preguntas, modos examen/estudio/instructor y preparación para progreso por usuario.");
  appSetText("app-product-status", `${appAcademyStats().total_questions ?? 0} preguntas`);
  appSetText("app-product-slug", "labs-academy");
  appRenderStats();
  const demo = document.getElementById("app-product-demo");
  if (demo) demo.innerHTML = appAcademySummaryHtml();
  appSetText("app-config-title", "Estudiar preguntas");
  const config = document.getElementById("app-product-config");
  if (!config) return;
  config.innerHTML = `${appAcademyControlsHtml()}<div id="academy-question-wrap">${appAcademyQuestionHtml()}</div><div id="cause-action-output" class="app-query-output" style="display:none"></div>`;
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

async function appRenderPanel(){
  appRenderSidebar();
  if (appState.view === "settings") appRenderSettingsPanel();
  else if (appState.view === "technical-reviews") await appRenderTechnicalReviewsPanel();
  else if (appState.view === "academy") await appRenderAcademyPanel();
  else appRenderCausesPanel();
  appRenderSidebar();
  appRenderStats();
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
  appState.products = Array.isArray(appState.dashboard?.products) ? appState.dashboard.products : [];
  appState.causes = Array.isArray(appState.dashboard?.causes) ? appState.dashboard.causes : [];
  if (appState.view === "technical-reviews") await appEnsureReviewsLoaded(true);
  if (appState.view === "academy") await appEnsureAcademyLoaded(true);
  appRenderUser(); appRenderStats(); await appRenderPanel();
}

async function appSubmitCauseForm(formNode){
  const form = new FormData(formNode);
  const code = String(form.get("code") || "").trim();
  if (!code) return appShow("Ingresa el rol de la causa.", true);
  await appFetch("/api/causes", { method:"POST", body:JSON.stringify({ code, court:String(form.get("court") || "").trim() || null, title:String(form.get("title") || "").trim() || null }) });
  await appReload(); appShow("Causa agregada correctamente.");
}

window.appSubmitCauseAdd = async function appSubmitCauseAdd(event){
  event.preventDefault();
  const formNode = event.currentTarget.closest("form") || document.getElementById("cause-add-form");
  if (!formNode) return appShow("No se encontró el formulario de causa.", true);
  try { await appSubmitCauseForm(formNode); } catch (error) { appShow(error.message || "Error agregando causa.", true); }
};

async function appSubmitVehicleForm(formNode){
  const form = new FormData(formNode);
  const plate = String(form.get("plate") || "").trim();
  if (!plate) return appShow("Ingresa la patente.", true);
  await appFetch("/api/technical-reviews/vehicles", { method:"POST", body:JSON.stringify({ plate, alias:String(form.get("alias") || "").trim() || null, brand:String(form.get("brand") || "").trim() || null, model:String(form.get("model") || "").trim() || null, due_date:String(form.get("due_date") || "").trim() || null }) });
  await appEnsureReviewsLoaded(true); await appRenderPanel(); appShow("Auto agregado correctamente.");
}

function appBindAcademyControls(){
  document.getElementById("academy-bank-select")?.addEventListener("change", async (event) => { appState.academyBank = event.target.value || ""; appState.academyTheme = "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-theme-select")?.addEventListener("change", async (event) => { appState.academyTheme = event.target.value || "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-mode-select")?.addEventListener("change", async (event) => { appState.academyMode = event.target.value || "study"; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-prev")?.addEventListener("click", async () => { appState.academyQuestionIndex -= 1; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-next")?.addEventListener("click", async () => { appState.academyQuestionIndex += 1; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-reveal")?.addEventListener("click", async () => { appState.academyAnswerVisible = !appState.academyAnswerVisible; await appRenderPanel(); });
}

function appBindControls(){
  document.querySelectorAll("[data-product-view]").forEach((button) => button.addEventListener("click", async () => { appState.view = button.dataset.productView || "causes"; await appRenderPanel(); }));
  document.querySelectorAll("[data-cause-filter]").forEach((button) => button.addEventListener("click", () => { appState.view = "causes"; appState.statusFilter = button.dataset.causeFilter || "all"; appRenderPanel(); }));
  document.querySelectorAll("[data-vehicle-filter]").forEach((button) => button.addEventListener("click", () => { appState.view = "technical-reviews"; appState.vehicleFilter = button.dataset.vehicleFilter || "all"; appRenderPanel(); }));
  document.querySelectorAll("[data-academy-theme]").forEach((button) => button.addEventListener("click", async () => { appState.view = "academy"; appState.academyTheme = button.dataset.academyTheme || "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; await appRenderPanel(); }));
  document.getElementById("cause-search-input")?.addEventListener("input", (event) => { appState.search = event.target.value || ""; const rows = document.getElementById("cause-list-rows"); if (rows) rows.innerHTML = appCauseRows(); appBindRowActions(); });
  document.getElementById("vehicle-search-input")?.addEventListener("input", (event) => { appState.vehicleSearch = event.target.value || ""; const rows = document.getElementById("vehicle-list-rows"); if (rows) rows.innerHTML = appVehicleRows(); appBindVehicleActions(); });
  document.getElementById("cause-add-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { await appSubmitCauseForm(event.currentTarget); } catch (error) { appShow(error.message || "Error agregando causa.", true); } });
  document.getElementById("vehicle-add-form")?.addEventListener("submit", async (event) => { event.preventDefault(); try { await appSubmitVehicleForm(event.currentTarget); } catch (error) { appShow(error.message || "Error agregando auto.", true); } });
  document.getElementById("cause-bulk-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const causes = String(form.get("bulk") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [code, court] = line.split("|").map((part) => part.trim()); return { code, court: court || null }; }).filter((cause) => cause.code); if (!causes.length) return appShow("No hay causas válidas para cargar.", true); try { const result = await appFetch("/api/causes/bulk", { method:"POST", body:JSON.stringify({ causes }) }); await appReload(); appShow(`Carga masiva terminada. Registros procesados: ${result.created_or_updated || 0}.`); } catch (error) { appShow(error.message || "Error en carga masiva.", true); } });
  document.getElementById("account-settings-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { appState.account = await appFetch("/api/account/settings", { method:"PATCH", body:JSON.stringify({ ui_theme_preference:String(form.get("ui_theme_preference") || "dark"), default_payment_method:String(form.get("default_payment_method") || "manual"), daily_summary_email_enabled:form.has("daily_summary_email_enabled") }) }); await appReload(); appShow("Configuración guardada."); } catch (error) { appShow(error.message || "Error guardando configuración.", true); } });
  document.getElementById("account-delete-request")?.addEventListener("click", async () => { try { await appFetch("/api/account/delete-request", { method:"POST" }); await appReload(); appShow("Solicitud de eliminación registrada."); } catch (error) { appShow(error.message || "Error solicitando eliminación.", true); } });
  appBindAcademyControls(); appBindRowActions(); appBindVehicleActions();
}

function appBindRowActions(){
  document.querySelectorAll("[data-cause-status]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { await appFetch(`/api/causes/${button.dataset.causeStatus}/status`, { method:"PATCH", body:JSON.stringify({ status: button.dataset.nextStatus }) }); await appReload(); } catch (error) { appShow(error.message || "Error actualizando causa.", true); } }); });
  document.querySelectorAll("[data-cause-run]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { await appFetch(`/api/causes/${button.dataset.causeRun}/run`, { method:"POST" }); await appReload(); appShow("Revisión registrada sin cambios."); } catch (error) { appShow(error.message || "Error registrando revisión.", true); } }); });
  document.querySelectorAll("[data-cause-results]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { appShowResults(await appFetch(`/api/causes/${button.dataset.causeResults}/results`)); } catch (error) { appShow(error.message || "Error cargando resultados.", true); } }); });
  document.querySelectorAll("[data-result-form]").forEach((formNode) => { if (formNode.dataset.bound === "true") return; formNode.dataset.bound = "true"; formNode.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await appFetch(`/api/causes/${event.currentTarget.dataset.resultForm}/results`, { method:"POST", body:JSON.stringify({ summary:String(form.get("summary") || "").trim() || "Resultado manual", result_text:String(form.get("result_text") || "").trim() || "Resultado registrado desde la web", has_changes:form.has("has_changes") }) }); await appReload(); appShow("Resultado guardado."); } catch (error) { appShow(error.message || "Error guardando resultado.", true); } }); });
}

function appBindVehicleActions(){
  document.querySelectorAll("[data-vehicle-status]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { await appFetch(`/api/technical-reviews/vehicles/${button.dataset.vehicleStatus}/status`, { method:"PATCH", body:JSON.stringify({ status: button.dataset.nextStatus }) }); await appEnsureReviewsLoaded(true); await appRenderPanel(); appShow("Estado del auto actualizado."); } catch (error) { appShow(error.message || "Error actualizando auto.", true); } }); });
  document.querySelectorAll("[data-vehicle-refresh]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { const due = new Date(); due.setFullYear(due.getFullYear() + 1); await appFetch(`/api/technical-reviews/vehicles/${button.dataset.vehicleRefresh}/review`, { method:"POST", body:JSON.stringify({ review_status:"ok", due_date:due.toISOString().slice(0,10), last_review_date:new Date().toISOString().slice(0,10), notes:"Actualizado desde el panel" }) }); await appEnsureReviewsLoaded(true); await appRenderPanel(); appShow("Revisión técnica marcada al día."); } catch (error) { appShow(error.message || "Error actualizando revisión.", true); } }); });
}

function appSetupSidebarToggle(){ const layout = document.getElementById("app-layout"); const toggle = document.getElementById("app-sidebar-toggle"); if (!layout || !toggle) return; toggle.addEventListener("click", () => { const compact = layout.classList.toggle("is-compact"); toggle.textContent = compact ? "›" : "‹"; }); }
async function appLogout(){ try { await appFetch("/api/auth/logout", { method:"POST" }); } catch (_) {} appClearSession(); window.location.href = "login.html"; }

async function appInit(){
  if (!appGetToken()) { window.location.href = "login.html?next=app.html"; return; }
  appState.user = appStoredUser() || { full_name:"Usuario", email:"", role:"client" };
  appRenderUser(); appSetupSidebarToggle();
  document.getElementById("app-causes-button")?.addEventListener("click", async () => { appState.view = "causes"; await appRenderPanel(); });
  document.getElementById("app-config-button")?.addEventListener("click", async () => { appState.view = "settings"; await appRenderPanel(); });
  document.getElementById("app-logout-button")?.addEventListener("click", appLogout);
  try { await appReload(); } catch (error) { const root = document.getElementById("app-error"); if (root) { root.hidden = false; root.textContent = error.message || "No se pudo cargar el home productivo."; } }
}

appInit();
