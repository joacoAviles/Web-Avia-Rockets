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

Object.assign(ACADEMY_FALLBACK, {
  stats: { banks_count: 1, total_questions: 4, thematicas_count: 4, due_reviews: 0 },
  banks: [{
    bank_id: "cessna-152-poh",
    slug: "cessna-152-poh",
    titulo: "Cessna 152 POH",
    dominio: "aviacion",
    tipo_banco: "manual_poh",
    tematicas: ["Limitaciones", "Performance", "Procedimientos normales", "Emergencias"],
    questions_count: 4,
    estado: "published",
  }],
  questions: [
    { id:"c152-lim-00023", public_id:"C152-LIM-00023", bank_id:"cessna-152-poh", curso:"Cessna 152", tematica:"Limitaciones", subtematica:"Velocidades", nivel:"basic", tipo_pregunta:"single_choice", status:"published", version:1, pregunta:"En una pregunta basada en POH, que dato debe verificarse antes de usar una velocidad operacional?", respuesta_correcta_texto:"La fuente exacta del POH, capitulo y condicion aplicable.", explicacion_corta:"Una velocidad solo es util si corresponde a la version, capitulo y condicion de operacion correcta.", explicacion_profunda:"Academy guarda fuente, capitulo, pagina y version para que cada respuesta sea auditable. Si cambia la fuente, se versiona la pregunta en vez de borrar el historial.", fuente:{ documento:"Cessna 152 POH", capitulo:"Section 2 - Limitations", pagina:"2-1", source_id:"cessna-152-manual-poh" }, media:[{ media_type:"table", caption:"Extracto de referencia POH", source:"Cessna 152 POH Section 2", alt_text:"Tabla de limitaciones para estudio", allow_zoom:true, sort_order:1, metadata:{ rows:[["Campo","Valor"],["Documento","Cessna 152 POH"],["Capitulo","Section 2 - Limitations"],["Uso","Verificacion de fuente"]] } }], opciones:[{ option_key:"A", option_text:"Solo la memoria del alumno.", is_correct:false, explanation:"La memoria ayuda, pero no entrega trazabilidad ni version." },{ option_key:"B", option_text:"La fuente exacta del POH, capitulo y condicion aplicable.", is_correct:true, explanation:"Es la unica opcion que permite auditar y corregir la pregunta si cambia el manual." },{ option_key:"C", option_text:"Una respuesta vista en redes sociales.", is_correct:false, explanation:"No es una fuente aeronautica verificable." },{ option_key:"D", option_text:"El promedio de respuestas de otros alumnos.", is_correct:false, explanation:"El consenso no reemplaza la fuente primaria." }] },
    { id:"c152-perf-00007", public_id:"C152-PERF-00007", bank_id:"cessna-152-poh", curso:"Cessna 152", tematica:"Performance", subtematica:"Tablas", nivel:"intermediate", tipo_pregunta:"multiple_select", status:"published", version:1, pregunta:"Que elementos hacen que una pregunta con tabla de performance sea trazable?", respuesta_correcta_texto:"Documento, capitulo/pagina, condiciones usadas y version de pregunta.", explicacion_corta:"Las tablas requieren registrar las condiciones de entrada y la referencia exacta.", explicacion_profunda:"Si un alumno reporta un error, el admin necesita reconstruir que tabla se uso, con que valores y bajo que version de la pregunta.", fuente:{ documento:"Cessna 152 POH", capitulo:"Section 5 - Performance", pagina:"5-3", source_id:"cessna-152-manual-poh" }, opciones:[{ option_key:"A", option_text:"Documento y pagina.", is_correct:true, explanation:"Permite volver a la tabla original." },{ option_key:"B", option_text:"Condiciones de entrada usadas en el caso.", is_correct:true, explanation:"Sin condiciones, la respuesta no se puede recalcular." },{ option_key:"C", option_text:"Color del boton seleccionado.", is_correct:false, explanation:"No aporta trazabilidad tecnica." },{ option_key:"D", option_text:"Version de la pregunta.", is_correct:true, explanation:"Evita mezclar respuestas antiguas con cambios posteriores." }] },
    { id:"c152-proc-00011", public_id:"C152-PROC-00011", bank_id:"cessna-152-poh", curso:"Cessna 152", tematica:"Procedimientos normales", subtematica:"Checklist", nivel:"basic", tipo_pregunta:"true_false", status:"published", version:1, pregunta:"Verdadero o falso: si una pregunta publicada ya tiene respuestas de alumnos, debe borrarse para corregirla.", respuesta_correcta_texto:"Falso. Debe archivarse o versionarse.", explicacion_corta:"Borrar rompe la trazabilidad del progreso y de los reportes.", explicacion_profunda:"La plataforma debe conservar intentos, versiones, reportes y fuentes. Para corregir contenido se crea una nueva version o se archiva la pregunta anterior.", fuente:{ documento:"Academy content policy", capitulo:"Versionado", pagina:"N/A" }, opciones:[{ option_key:"A", option_text:"Verdadero", is_correct:false, explanation:"Borrar perderia intentos y reportes existentes." },{ option_key:"B", option_text:"Falso", is_correct:true, explanation:"Se archiva o versiona para mantener auditoria." }] },
    { id:"c152-emg-00015", public_id:"C152-EMG-00015", bank_id:"cessna-152-poh", curso:"Cessna 152", tematica:"Emergencias", subtematica:"Caso practico", nivel:"advanced", tipo_pregunta:"single_choice", status:"published", version:1, pregunta:"Un alumno marca una respuesta y detecta que el enunciado no indica una condicion necesaria del caso. Que accion soporta Academy?", respuesta_correcta_texto:"Reportar error con tipo, comentario, respuesta elegida, respuesta del sistema y version.", explicacion_corta:"El reporte permite triage editorial sin perder la respuesta del alumno.", explicacion_profunda:"Cada reporte guarda usuario, fecha, tipo de problema, payload de respuesta y version de la pregunta para que el panel admin pueda corregir con evidencia.", fuente:{ documento:"Academy QA workflow", capitulo:"Reportes", pagina:"N/A" }, opciones:[{ option_key:"A", option_text:"Ignorar la duda y pasar a la siguiente.", is_correct:false, explanation:"Eso no mejora el banco." },{ option_key:"B", option_text:"Reportar error con evidencia y comentario.", is_correct:true, explanation:"Es el flujo auditable requerido." },{ option_key:"C", option_text:"Cambiar localmente la respuesta correcta.", is_correct:false, explanation:"El alumno no debe editar la pauta publicada." }] },
  ],
});

const appState = {
  dashboard: null,
  user: null,
  account: null,
  products: [],
  causes: [],
  technicalReviews: null,
  vehicles: [],
  academy: null,
  academyBank: "all",
  academyTheme: "all",
  academyMode: "study",
  academyQuestionIndex: 0,
  academyAnswerVisible: false,
  academyProgress: {},
  academySelected: {},
  academyReportOpen: false,
  academySourceOpen: false,
  academyQuestionStartedAt: Date.now(),
  vehicleFilter: "all",
  statusFilter: "all",
  search: "",
  legalTab: "summary",
  legalCatalogs: { lawyers: [], visibilityGroups: [], emailGroups: [], books: [] },
  legalFilters: { status: "all", stage: "all", court: "all", lawyer: "all", visibility: "all", emailGroup: "all" },
  legalPage: 1,
  legalPageSize: 25,
  vehicleSearch: "",
  view: "causes",
};

function appGetToken(){ return localStorage.getItem(AVIA_TOKEN_KEY); }
function appClearSession(){ localStorage.removeItem(AVIA_TOKEN_KEY); localStorage.removeItem(AVIA_USER_KEY); }
function appStoredUser(){ try { return JSON.parse(localStorage.getItem(AVIA_USER_KEY) || "null"); } catch (_) { return null; } }
function appSetText(id, value){ const node = document.getElementById(id); if (node) node.textContent = value ?? "-"; }
function appEscape(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
function appUniqueList(value){ return [...new Set(String(value || "").split(",").map((item) => item.trim()).filter(Boolean))].join(", "); }
function appStatusLabel(value){ const status = String(value || "").toLowerCase(); if (status === "active") return "Activa"; if (status === "paused") return "Pausada"; return value || "-"; }
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
  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
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
  const selectedBank = appState.academyBank || "all";
  const selectedTheme = appState.academyTheme || "all";
  return (Array.isArray(academy.questions) ? academy.questions : []).filter((question) => {
    if (selectedBank !== "all" && question.bank_id && question.bank_id !== selectedBank) return false;
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
  const hasLegal = products.some((p) => p.slug === "legal" && p.enabled !== false && Number(p.enabled) !== 0);
  const hasReviews = products.some((p) => p.slug === "revision-tecnica");
  const hasAcademy = products.some((p) => ["labs-academy", "academy"].includes(p.slug));
  const academyQuestions = appAcademyStats().total_questions || 0;
  const base = [];
  if (hasLegal) base.push(["causes", "Legal / Causas", `${appState.causes.length} causas`, "LG"]);
  if (hasReviews) base.push(["technical-reviews", "Revisiones Técnicas", `${appState.vehicles.length || 0} autos`, "RT"]);
  if (hasAcademy) base.push(["academy", "Labs / Academy", `${academyQuestions} preguntas`, "AC"]);
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
    const source = (appState.academy?.questions || ACADEMY_FALLBACK.questions).filter((q) => appState.academyBank === "all" || !appState.academyBank || q.bank_id === appState.academyBank);
    const themes = [...new Set(source.map((q) => q.tematica).filter(Boolean))];
    filters = [["all", "Todas", `${source.length} preguntas`], ...themes.map((theme) => [theme, theme, `${source.filter((q) => appNormalizeTheme(q.tematica) === appNormalizeTheme(theme)).length} preguntas`])].map(([value, label, meta]) => `<button class="app-product-button${appNormalizeTheme(appState.academyTheme) === appNormalizeTheme(value) ? " is-active" : ""}" type="button" data-academy-theme="${appEscape(value)}"><strong>${label.slice(0,2).toUpperCase()}</strong><span>${appEscape(label)}</span><small>${appEscape(meta)}</small></button>`).join("");
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
    if (appState.legalFilters.status !== "all" && cause.user_status !== appState.legalFilters.status) return false;
    if (appState.legalFilters.stage !== "all" && (cause.latest_stage || cause.latest_procedure || "") !== appState.legalFilters.stage) return false;
    if (appState.legalFilters.court !== "all" && cause.court !== appState.legalFilters.court) return false;
    if (appState.legalFilters.lawyer !== "all" && cause.assigned_lawyer !== appState.legalFilters.lawyer) return false;
    if (appState.legalFilters.visibility !== "all" && appUniqueList(cause.visibility_label) !== appState.legalFilters.visibility) return false;
    if (appState.legalFilters.emailGroup !== "all" && cause.email_group_id !== appState.legalFilters.emailGroup) return false;
    if (!q) return true;
    return [cause.code, cause.title, cause.court, cause.assigned_lawyer, cause.visibility_label, cause.email_group, cause.latest_movement].some((value) => String(value || "").toLowerCase().includes(q));
  }).sort((left, right) => {
    if (left.publicada !== right.publicada) return left.publicada ? -1 : 1;
    const leftGroup = String(left.email_group || "").trim();
    const rightGroup = String(right.email_group || "").trim();
    if (!!leftGroup !== !!rightGroup) return leftGroup ? -1 : 1;
    const groupOrder = leftGroup.localeCompare(rightGroup, "es", { sensitivity: "base" });
    if (groupOrder) return groupOrder;
    const yearOrder = Number(right.year || 0) - Number(left.year || 0);
    if (yearOrder) return yearOrder;
    return String(left.code || "").localeCompare(String(right.code || ""), "es", { numeric: true, sensitivity: "base" });
  });
}

function appDownloadLegalExcel(){
  if (!window.XLSX) {
    appShow("No se pudo preparar el archivo Excel.", true);
    return;
  }
  const rows = appState.causes.map((cause) => ({
    "Causa": cause.code || "",
    "Año": cause.year ?? "",
    "Estado de publicación": cause.publicada ? "Publicada" : "No publicada",
    "Juzgado": cause.court || "",
    "Abogado asignado": cause.assigned_lawyer || "",
    "Quién puede ver": appUniqueList(cause.visibility_label) || "",
    "Grupo de correo": cause.email_group || "",
    "Etapa / Estado": (cause.latest_stage || cause.latest_procedure) || appStatusLabel(cause.user_status || cause.status),
    "Último movimiento": cause.latest_movement || "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 14 }, { wch: 10 }, { wch: 22 }, { wch: 42 }, { wch: 30 },
    { wch: 34 }, { wch: 30 }, { wch: 36 }, { wch: 54 },
  ];
  if (rows.length) worksheet["!autofilter"] = { ref: `A1:I${rows.length + 1}` };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Causas");
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `causas-legales-${date}.xlsx`, { compression: true });
}

function appCatalogOptions(items, selected, label = "Seleccionar"){
  return `<option value="">${appEscape(label)}</option>${items.map((item) => `<option value="${appEscape(item.id)}" ${item.id === selected ? "selected" : ""}>${appEscape(item.name)}${item.email ? ` · ${appEscape(item.email)}` : ""}</option>`).join("")}`;
}

function appLegalTableHtml(){
  const filtered = appFilteredCauses();
  const perPage = appState.legalPageSize;
  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  if (appState.legalPage > pages) appState.legalPage = pages;
  const causes = filtered.slice((appState.legalPage - 1) * perPage, appState.legalPage * perPage);
  if (!causes.length) return `<div class="legal-empty"><strong>Sin causas para estos filtros</strong></div>`;
  let previousGroup = "";
  const rows = causes.map((cause) => {
    const emailGroup = String(cause.email_group || "").trim();
    const groupKey = `${cause.publicada ? "published" : "unpublished"}::${emailGroup || "ungrouped"}`;
    const groupRow = groupKey === previousGroup ? "" : `<tr class="legal-email-group-row"><td colspan="6"><strong>${cause.publicada ? "Publicadas" : "No publicadas"}</strong><span>${appEscape(emailGroup || "Sin grupo de correo")}</span></td></tr>`;
    previousGroup = groupKey;
    return `${groupRow}<tr>
      <td><div class="legal-cause-identity"><strong>${appEscape(cause.code)}</strong><span>${appEscape(cause.year ?? "-")}</span><span class="legal-publication-state${cause.publicada ? " is-published" : ""}">${cause.publicada ? "Publicada" : "No publicada"}</span></div></td>
      <td>${appEscape(cause.court || "-")}</td>
      <td>${appEscape(cause.assigned_lawyer || "-")}</td>
      <td>${appEscape(appUniqueList(cause.visibility_label) || "-")}</td>
      <td>${appEscape(cause.email_group || "-")}</td>
      <td><span class="legal-stage">${appEscape((cause.latest_stage || cause.latest_procedure) || appStatusLabel(cause.user_status || cause.status))}</span><small>${cause.latest_movement ? appEscape(cause.latest_movement) : "Sin movimientos"}</small></td>
    </tr>`;
  }).join("");
  return `<div class="legal-table-scroll"><table class="legal-causes-table"><thead><tr><th>Causa / Año / Estado</th><th>Juzgado</th><th>Abogado asignado</th><th>Quién puede ver</th><th>Grupo de correo</th><th>Etapa / Estado</th></tr></thead><tbody>${rows}</tbody></table></div><div class="legal-pagination"><span>Mostrando ${(appState.legalPage - 1) * perPage + 1}–${Math.min(appState.legalPage * perPage, filtered.length)} de ${filtered.length}</span><div><button type="button" data-legal-page="${appState.legalPage - 1}" ${appState.legalPage === 1 ? "disabled" : ""}>Anterior</button><strong>Página ${appState.legalPage} de ${pages}</strong><button type="button" data-legal-page="${appState.legalPage + 1}" ${appState.legalPage === pages ? "disabled" : ""}>Siguiente</button></div></div>`;
}

function appLegalSummaryHtml(){
  const catalogs = appState.legalCatalogs;
  const total = appState.causes.length;
  const withMovement = appState.causes.filter((cause) => cause.latest_movement).length;
  const withoutMovement = total - withMovement;
  const lawyers = catalogs.lawyers.map((lawyer) => {
    const rows = appState.causes.filter((cause) => cause.assigned_lawyer === lawyer.id);
    const progressed = rows.filter((cause) => cause.latest_movement).length;
    const progress = rows.length ? Math.round(progressed / rows.length * 100) : 0;
    return `<tr><td><strong>${appEscape(lawyer.name)}</strong></td><td>${rows.length}</td><td>${progressed}</td><td>${rows.length - progressed}</td><td><div class="legal-progress"><span style="width:${progress}%"></span></div><small>${progressed} / ${rows.length} · ${progress}%</small></td></tr>`;
  }).join("");
  const totalProgress = total ? Math.round(withMovement / total * 100) : 0;
  return `<div class="legal-summary-grid"><article><small>Total de causas</small><strong>${total}</strong></article><article><small>Con movimientos</small><strong>${withMovement}</strong><span>${totalProgress}% del total</span></article><article><small>Sin movimientos</small><strong>${withoutMovement}</strong><span>${total ? Math.round(withoutMovement / total * 100) : 0}% del total</span></article></div>
    <section class="legal-overview"><div><p class="eyebrow">Avance total</p><h3>${withMovement} de ${total} causas con movimientos</h3></div><div><div class="legal-overview-bar"><span style="width:${totalProgress}%"></span></div><small>${totalProgress}%</small></div></section>
    <section class="legal-lawyer-section"><div class="legal-section-head"><div><p class="eyebrow">Avance por abogado</p><h3>Causas con movimientos sobre total asignado</h3></div><span>${catalogs.lawyers.length} abogados</span></div><div class="legal-table-scroll"><table class="legal-lawyer-table"><thead><tr><th>Abogado</th><th>Total</th><th>Con movimientos</th><th>Sin movimientos</th><th>Avance / Total</th></tr></thead><tbody>${lawyers}</tbody></table></div></section>`;
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
  return appRenderLegalPanel();
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

function appRenderLegalPanel(){
  document.body.classList.add("is-legal-view");
  appSetText("app-view-label", "");
  appSetText("app-product-title", "Legal");
  appSetText("app-product-description", "");
  appSetText("app-product-status", appBool(appState.dashboard?.stats?.daily_summary_email_enabled));
  appSetText("app-product-slug", "legal");
  const demo = document.getElementById("app-product-demo");
  if (demo) demo.innerHTML = `<nav class="legal-tabs" aria-label="Secciones legales"><button type="button" data-legal-tab="summary" class="${appState.legalTab === "summary" ? "is-active" : ""}">Resumen</button><button type="button" data-legal-tab="causes" class="${appState.legalTab === "causes" ? "is-active" : ""}">Causas</button></nav>`;
  appSetText("app-config-title", appState.legalTab === "summary" ? "Resumen operativo" : `Total: ${appState.causes.length} causas`);
  const config = document.getElementById("app-product-config");
  if (!config) return;
  const filterOptions = (items, selected) => items.map((item) => `<option value="${appEscape(item.id)}" ${item.id === selected ? "selected" : ""}>${appEscape(item.name)}</option>`).join("");
  const valueOptions = (values, selected) => [...new Set(values.filter(Boolean))].sort().map((value) => `<option value="${appEscape(value)}" ${value === selected ? "selected" : ""}>${appEscape(value)}</option>`).join("");
  const resultCount = appFilteredCauses().length;
  config.innerHTML = appState.legalTab === "summary" ? appLegalSummaryHtml() : `<div class="legal-search-row"><label class="legal-search"><span>Buscar</span><input id="cause-search-input" type="search" value="${appEscape(appState.search)}" placeholder="Buscar causa, código o juzgado" /></label></div><div class="legal-toolbar"><label><span>Estado</span><select data-legal-filter="status"><option value="all">Todos</option>${valueOptions(appState.causes.map((cause) => cause.user_status), appState.legalFilters.status)}</select></label><label><span>Etapa</span><select data-legal-filter="stage"><option value="all">Todas</option>${valueOptions(appState.causes.map((cause) => cause.latest_stage || cause.latest_procedure), appState.legalFilters.stage)}</select></label><label><span>Juzgado</span><select data-legal-filter="court"><option value="all">Todos</option>${valueOptions(appState.causes.map((cause) => cause.court), appState.legalFilters.court)}</select></label><label><span>Abogado</span><select data-legal-filter="lawyer"><option value="all">Todos</option>${filterOptions(appState.legalCatalogs.lawyers, appState.legalFilters.lawyer)}</select></label><label><span>Quién puede ver</span><select data-legal-filter="visibility"><option value="all">Todos</option>${valueOptions(appState.causes.map((cause) => cause.visibility_label), appState.legalFilters.visibility)}</select></label><button class="legal-clear" type="button" data-legal-clear>Limpiar filtros</button><strong class="legal-result-count">${resultCount} resultados</strong><label class="legal-page-size"><span>Ver</span><select data-legal-page-size><option value="25" ${appState.legalPageSize === 25 ? "selected" : ""}>25</option><option value="50" ${appState.legalPageSize === 50 ? "selected" : ""}>50</option><option value="100" ${appState.legalPageSize === 100 ? "selected" : ""}>100</option></select></label></div><div id="cause-list-rows">${appLegalTableHtml()}</div><div class="legal-export-row"><div><strong>Descargar todas las causas</strong><span>Incluye los ${appState.causes.length} registros disponibles en formato Excel.</span></div><button type="button" data-legal-export>Descargar Excel</button></div>`;
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

async function appEnsureAcademyLoadedLegacy(force = false){
  if (appState.academy && !force) return;
  try {
    appState.academy = await appFetch("/api/academy/dashboard");
  } catch (error) {
    appState.academy = ACADEMY_FALLBACK;
    appState.academy.error = error.message || "Academy API no disponible";
  }
  const banks = Array.isArray(appState.academy?.banks) ? appState.academy.banks : [];
  if (appState.academyBank !== "all" && !banks.some((bank) => bank.bank_id === appState.academyBank)) appState.academyBank = "all";
}

function appAcademySummaryHtmlLegacy(){
  const stats = appAcademyStats();
  let bank = (appState.academy?.banks || ACADEMY_FALLBACK.banks).find((item) => item.bank_id === appState.academyBank) || {};
  if (appState.academyBank === "all") bank = { titulo: "Todos los bancos de aviacion", dominio: `${stats.banks_count} bancos`, tipo_banco: "todas las tematicas" };
  return `<div class="app-config-grid">
    <div class="app-config-row"><span>Producto</span><strong>Labs / Academy<br><small>Subproducto de AVIA Labs para estudio y captación.</small></strong></div>
    <div class="app-config-row"><span>Banco activo</span><strong>${appEscape(bank.titulo || bank.bank_id || "Banco de estudio")}<br><small>${appEscape(bank.dominio || "aprendizaje")} · ${appEscape(bank.tipo_banco || "question_bank")}</small></strong></div>
    <div class="app-config-row"><span>Preguntas</span><strong>${appEscape(stats.total_questions)}<br><small>${appEscape(stats.thematicas_count)} temáticas disponibles</small></strong></div>
    <div class="app-config-row"><span>Estado</span><strong>${appEscape(appState.academy?.source === "fallback-web" ? "Demo local" : "Conectado a API")}<br><small>${appEscape(appState.academy?.error || "Listo para estudiar")}</small></strong></div>
  </div>`;
}

function appAcademyControlsHtmlLegacy(){
  const banks = appState.academy?.banks || ACADEMY_FALLBACK.banks;
  const scopedQuestions = (appState.academy?.questions || ACADEMY_FALLBACK.questions).filter((q) => appState.academyBank === "all" || !appState.academyBank || q.bank_id === appState.academyBank);
  const themes = ["all", ...new Set(scopedQuestions.map((q) => q.tematica).filter(Boolean))];
  const bankOptions = [`<option value="all" ${appState.academyBank === "all" ? "selected" : ""}>Todos los bancos</option>`, ...banks.map((bank) => `<option value="${appEscape(bank.bank_id)}" ${appState.academyBank === bank.bank_id ? "selected" : ""}>${appEscape(bank.titulo || bank.bank_id)}</option>`)].join("");
  const themeOptions = themes.map((theme) => `<option value="${appEscape(theme)}" ${appNormalizeTheme(appState.academyTheme) === appNormalizeTheme(theme) ? "selected" : ""}>${theme === "all" ? "Todas las temáticas" : appEscape(theme)}</option>`).join("");
  return `<div class="app-config-row"><span>Configurar estudio</span><strong class="app-form-inline app-academy-controls"><select id="academy-bank-select">${bankOptions}</select><select id="academy-theme-select">${themeOptions}</select><select id="academy-mode-select"><option value="exam" ${appState.academyMode === "exam" ? "selected" : ""}>Modo examen</option><option value="study" ${appState.academyMode === "study" ? "selected" : ""}>Modo estudio</option><option value="instructor" ${appState.academyMode === "instructor" ? "selected" : ""}>Modo instructor</option></select></strong></div>`;
}

function appAcademyQuestionHtmlLegacy(){
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

function appAcademyThemeMapHtmlLegacy(){
  const source = (appState.academy?.questions || ACADEMY_FALLBACK.questions).filter((q) => appState.academyBank === "all" || !appState.academyBank || q.bank_id === appState.academyBank);
  const themes = [...new Set(source.map((q) => q.tematica).filter(Boolean))];
  if (!themes.length) return "";
  return `<div class="academy-topic-grid">${themes.map((theme) => {
    const count = source.filter((q) => appNormalizeTheme(q.tematica) === appNormalizeTheme(theme)).length;
    const active = appNormalizeTheme(appState.academyTheme) === appNormalizeTheme(theme);
    return `<button class="academy-topic${active ? " is-active" : ""}" type="button" data-academy-theme="${appEscape(theme)}"><span>${appEscape(theme)}</span><strong>${count}</strong></button>`;
  }).join("")}</div>`;
}

function appAcademyOptionsHtmlLegacy(question){
  const explicit = Array.isArray(question.opciones) ? question.opciones.filter(Boolean) : [];
  const parsed = String(question.pregunta || "").split(/\n/).map((line) => line.trim()).filter((line) => /^[A-D][\.\)-]\s+/i.test(line));
  const options = explicit.length ? explicit : parsed;
  if (!options.length) return "";
  return `<div class="academy-options">${options.map((option) => `<button type="button" class="academy-option">${appEscape(option)}</button>`).join("")}</div>`;
}

function appAcademyProgressLabel(question){
  const value = appState.academyProgress[question.id];
  if (value === "known") return "Dominada";
  if (value === "review") return "Repasar";
  return "Sin marcar";
}

function appAcademyQuestionHtmlOldCard(){
  const questions = appAcademyQuestions();
  if (!questions.length) return `<div class="app-config-row"><span>Sin preguntas</span><strong>No hay preguntas para este filtro.</strong></div>`;
  if (appState.academyQuestionIndex >= questions.length) appState.academyQuestionIndex = 0;
  if (appState.academyQuestionIndex < 0) appState.academyQuestionIndex = questions.length - 1;
  const question = questions[appState.academyQuestionIndex];
  const visible = appState.academyAnswerVisible;
  const showDeep = visible && appState.academyMode === "instructor";
  const concepts = Array.isArray(question.conceptos_relacionados) ? question.conceptos_relacionados : [];
  return `<article class="academy-card">
    <div class="academy-card-head"><span>${appEscape(question.tematica || "Tematica")}</span><small>${appEscape(question.subtematica || "")} · ${appEscape(question.nivel || "")}</small></div>
    <h3>${appEscape(question.pregunta)}</h3>
    ${appAcademyOptionsHtml(question)}
    ${visible ? `<div class="academy-answer"><strong>Respuesta</strong><p>${appEscape(question.respuesta_correcta_texto || question.respuesta_correcta || "-")}</p>${appState.academyMode !== "exam" ? `<strong>Explicacion</strong><p>${appEscape(question.explicacion_corta || "-")}</p>` : ""}${showDeep ? `<strong>Explicacion profunda</strong><p>${appEscape(question.explicacion_profunda || "-")}</p>${concepts.length ? `<strong>Conceptos</strong><p>${concepts.map(appEscape).join(" · ")}</p>` : ""}` : ""}<small>Fuente: ${appEscape(question.fuente?.documento || question.fuente || "No informada")}</small></div>` : `<p class="academy-muted">Intenta responder antes de revelar. En modo examen solo veras la pauta; en estudio e instructor aparece la explicacion.</p>`}
    <div class="academy-actions"><button class="btn btn-secondary" type="button" id="academy-prev">Anterior</button><button class="btn btn-primary" type="button" id="academy-reveal">${visible ? "Ocultar respuesta" : "Ver respuesta"}</button><button class="btn btn-secondary" type="button" id="academy-next">Siguiente</button><button class="btn btn-secondary" type="button" data-academy-progress="known">La sabia</button><button class="btn btn-secondary" type="button" data-academy-progress="review">Repasar</button><small>${appState.academyQuestionIndex + 1} / ${questions.length} · ${appEscape(appAcademyProgressLabel(question))}</small></div>
  </article>`;
}

async function appRenderAcademyPanelLegacy(){
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
  config.innerHTML = `${appAcademyControlsHtml()}${appAcademyThemeMapHtml()}<div id="academy-question-wrap">${appAcademyQuestionHtml()}</div><div id="cause-action-output" class="app-query-output" style="display:none"></div>`;
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
  else appRenderLegalPanel();
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
  if (location.hash === "#legal-causes") appState.legalTab = "causes";
  if (location.hash === "#legal-summary") appState.legalTab = "summary";
  try {
    appState.dashboard = await appFetch("/api/dashboard");
  } catch (legacyError) {
    const [user, legalCauses] = await Promise.all([
      appFetch("/api/v1/auth/me"),
      appFetch("/api/v1/legal/causes"),
    ]);
    const stored = appStoredUser() || {};
    const sourceCauses = Array.isArray(legalCauses) ? legalCauses : (Array.isArray(legalCauses?.items) ? legalCauses.items : []);
    const causes = sourceCauses.map((cause) => ({
      ...cause,
      code: cause.code || cause.rol,
      court: cause.court || cause.tribunal,
      title: cause.title || cause.party || cause.competencia || cause.tipo_causa,
      latest_movement: cause.latest_movement || cause.last_movement || null,
      last_result: cause.last_result || null,
      last_checked_at: cause.last_checked_at || cause.updated_at || cause.updatedAt || null,
    }));
    appState.dashboard = {
      user: { ...stored, ...user },
      products: Array.isArray(stored.products) ? stored.products : [],
      causes,
      legal_catalogs: { lawyers: [], visibilityGroups: [], emailGroups: [], books: [] },
    };
  }
  if (Array.isArray(appState.dashboard?.causes)) {
    appState.dashboard.causes = appState.dashboard.causes.map((cause) => ({ ...cause, visibility_label: appUniqueList(cause.visibility_label) }));
  }
  appState.legalCatalogs = appState.dashboard?.legal_catalogs || { lawyers: [], visibilityGroups: [], emailGroups: [], books: [] };
  try {
    const catalogs = await appFetch("/api/causes/catalogs/options");
    if (catalogs && typeof catalogs === "object") appState.legalCatalogs = catalogs;
  } catch (_) {}
  const stored = appStoredUser();
  appState.user = appState.dashboard?.user || stored || appState.user;
  appState.account = appState.dashboard?.account || null;
  appState.products = Array.isArray(appState.dashboard?.products) ? appState.dashboard.products : (Array.isArray(appState.user?.products) ? appState.user.products : []);
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

function appBindAcademyControlsLegacy(){
  document.getElementById("academy-bank-select")?.addEventListener("change", async (event) => { appState.academyBank = event.target.value || ""; appState.academyTheme = "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-theme-select")?.addEventListener("change", async (event) => { appState.academyTheme = event.target.value || "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-mode-select")?.addEventListener("change", async (event) => { appState.academyMode = event.target.value || "study"; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-prev")?.addEventListener("click", async () => { appState.academyQuestionIndex -= 1; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-next")?.addEventListener("click", async () => { appState.academyQuestionIndex += 1; appState.academyAnswerVisible = false; await appRenderPanel(); });
  document.getElementById("academy-reveal")?.addEventListener("click", async () => { appState.academyAnswerVisible = !appState.academyAnswerVisible; await appRenderPanel(); });
  document.querySelectorAll("[data-academy-progress]").forEach((button) => button.addEventListener("click", async () => {
    const question = appAcademyQuestions()[appState.academyQuestionIndex];
    if (question?.id) appState.academyProgress[question.id] = button.dataset.academyProgress || "review";
    appState.academyQuestionIndex += 1;
    appState.academyAnswerVisible = false;
    await appRenderPanel();
  }));
}

function appAcademyQuestionKey(question){
  return String(question?.public_id || question?.id || question?.question_uuid || "question");
}

function appAcademySourceLabel(source){
  if (!source) return "Fuente no informada";
  if (typeof source === "string") return source;
  return [source.documento, source.capitulo, source.pagina].filter(Boolean).join(" / ") || source.source_id || "Fuente no informada";
}

function appAcademyQuestionOptions(question){
  const explicit = Array.isArray(question?.opciones) ? question.opciones : (Array.isArray(question?.options) ? question.options : []);
  if (explicit.length) {
    return explicit.map((option, index) => ({
      option_key: String(option.option_key || option.key || String.fromCharCode(65 + index)),
      option_text: option.option_text || option.text || option.label || String(option),
      is_correct: Boolean(option.is_correct),
      explanation: option.explanation || option.explicacion || "",
    }));
  }
  return String(question?.pregunta || "").split(/\n/).map((line) => line.trim()).filter((line) => /^[A-D][\.\)-]\s+/i.test(line)).map((line, index) => ({
    option_key: line.slice(0, 1).toUpperCase(),
    option_text: line.replace(/^[A-D][\.\)-]\s+/i, ""),
    is_correct: false,
    explanation: index === 0 ? "Opcion importada desde texto plano." : "",
  }));
}

function appAcademyCorrectKeys(question){
  return appAcademyQuestionOptions(question).filter((option) => option.is_correct).map((option) => option.option_key);
}

function appAcademySelectedKeys(question){
  const key = appAcademyQuestionKey(question);
  return Array.isArray(appState.academySelected[key]) ? appState.academySelected[key] : [];
}

function appAcademyProgressStats(){
  const values = Object.values(appState.academyProgress || {});
  const answered = values.filter((item) => item && item.status).length;
  const correct = values.filter((item) => item?.status === "correct").length;
  const review = values.filter((item) => item?.marked || item?.status === "review").length;
  return { answered, correct, review, accuracy: answered ? Math.round((correct / answered) * 100) : 0 };
}

async function appEnsureAcademyLoaded(force = false){
  if (appState.academy && !force) return;
  const params = new URLSearchParams();
  if (appState.academyBank && appState.academyBank !== "all") params.set("bank", appState.academyBank);
  if (appState.academyTheme && appState.academyTheme !== "all") params.set("tematica", appState.academyTheme);
  params.set("mode", appState.academyMode || "study");
  params.set("limit", "40");
  try {
    appState.academy = await appFetch(`/api/academy/study/session?${params.toString()}`);
    if (!Array.isArray(appState.academy.questions) || !appState.academy.questions.length) {
      const dashboard = await appFetch("/api/academy/dashboard");
      appState.academy = { ...dashboard, student: appState.academy.student, session: appState.academy.session };
    }
  } catch (error) {
    try {
      const [banksData, questionsData] = await Promise.all([
        appFetch("/api/question-banks"),
        appFetch(`/api/questions?${params.toString()}`),
      ]);
      appState.academy = {
        ok: true,
        source: questionsData.source || banksData.source || "postgres",
        banks: Array.isArray(banksData.banks) ? banksData.banks : [],
        questions: Array.isArray(questionsData.questions) ? questionsData.questions : [],
        stats: banksData.stats || { banks_count: Array.isArray(banksData.banks) ? banksData.banks.length : 0, total_questions: questionsData.total || 0, thematicas_count: 0 },
        session: { mode: appState.academyMode || "study", question_count: questionsData.count || 0, total_available: questionsData.total || 0 },
        report_types: [
          { value:"enunciado_confuso", label:"Enunciado confuso" },
          { value:"respuesta_incorrecta", label:"Respuesta incorrecta" },
          { value:"mas_de_una_correcta", label:"Hay mas de una respuesta correcta" },
          { value:"imagen_incorrecta", label:"Imagen incorrecta" },
          { value:"error_fuente", label:"Error en la fuente" },
          { value:"ortografia_redaccion", label:"Ortografia o redaccion" },
          { value:"otro", label:"Otro" },
        ],
      };
    } catch (fallbackError) {
      appState.academy = { ok:false, source:"postgres-required", banks:[], questions:[], stats:{ banks_count:0, total_questions:0, thematicas_count:0 }, error:fallbackError.message || error.message || "Academy PostgreSQL no disponible" };
    }
  }
  const banks = Array.isArray(appState.academy?.banks) ? appState.academy.banks : [];
  if (appState.academyBank !== "all" && !banks.some((bank) => bank.bank_id === appState.academyBank)) appState.academyBank = "all";
}

function appAcademySummaryHtml(){
  const stats = appAcademyStats();
  const progress = appAcademyProgressStats();
  let bank = (appState.academy?.banks || ACADEMY_FALLBACK.banks).find((item) => item.bank_id === appState.academyBank) || {};
  if (appState.academyBank === "all") bank = { titulo: "Todos los bancos de aviacion", dominio: `${stats.banks_count} bancos`, tipo_banco: "todas las tematicas" };
  return `<div class="academy-session-strip">
    <div><strong>${appEscape(bank.titulo || "Academy")}</strong><small>${appEscape(bank.dominio || "aviacion")} / ${appEscape(bank.tipo_banco || "question_bank")}</small></div>
    <div><span>Progreso de la sesion</span><b><i style="width:${Math.max(progress.accuracy, 8)}%"></i></b><small>${progress.accuracy}%</small></div>
    <div><strong>${appEscape(stats.total_questions || 0)}</strong><small>preguntas desde PostgreSQL</small></div>
  </div>`;
}

function appAcademyControlsHtml(){
  const banks = appState.academy?.banks || ACADEMY_FALLBACK.banks;
  const scopedQuestions = (appState.academy?.questions || ACADEMY_FALLBACK.questions).filter((q) => appState.academyBank === "all" || !appState.academyBank || q.bank_id === appState.academyBank);
  const themes = ["all", ...new Set(scopedQuestions.map((q) => q.tematica).filter(Boolean))];
  const modes = [["study", "Practica por tema"], ["exam", "Examen cronometrado"], ["review_errors", "Repasar errores"], ["bookmarked", "Marcadas"], ["new", "Preguntas nuevas"], ["weaknesses", "Debilidades"], ["final", "Simulador final"], ["source", "Modo fuente/POH"], ["flashcards", "Flashcards"], ["instructor", "Instructor/admin"]];
  const bankOptions = [`<option value="all" ${appState.academyBank === "all" ? "selected" : ""}>Todos los bancos</option>`, ...banks.map((bank) => `<option value="${appEscape(bank.bank_id)}" ${appState.academyBank === bank.bank_id ? "selected" : ""}>${appEscape(bank.titulo || bank.bank_id)}</option>`)].join("");
  const themeOptions = themes.map((theme) => `<option value="${appEscape(theme)}" ${appNormalizeTheme(appState.academyTheme) === appNormalizeTheme(theme) ? "selected" : ""}>${theme === "all" ? "Todas las tematicas" : appEscape(theme)}</option>`).join("");
  const modeOptions = modes.map(([value, label]) => `<option value="${value}" ${appState.academyMode === value ? "selected" : ""}>${label}</option>`).join("");
  return `<div class="academy-control-row"><select id="academy-bank-select">${bankOptions}</select><select id="academy-theme-select">${themeOptions}</select><select id="academy-mode-select">${modeOptions}</select></div>`;
}

function appAcademyThemeMapHtml(){
  const source = (appState.academy?.questions || ACADEMY_FALLBACK.questions).filter((q) => appState.academyBank === "all" || !appState.academyBank || q.bank_id === appState.academyBank);
  const themes = [...new Set(source.map((q) => q.tematica).filter(Boolean))];
  if (!themes.length) return "";
  return `<div class="academy-topic-grid">${themes.map((theme) => {
    const count = source.filter((q) => appNormalizeTheme(q.tematica) === appNormalizeTheme(theme)).length;
    const active = appNormalizeTheme(appState.academyTheme) === appNormalizeTheme(theme);
    return `<button class="academy-topic${active ? " is-active" : ""}" type="button" data-academy-theme="${appEscape(theme)}"><span>${appEscape(theme)}</span><strong>${count}</strong></button>`;
  }).join("")}</div>`;
}

function appAcademyMediaHtml(question){
  const media = Array.isArray(question.media) ? question.media : [];
  if (!media.length) return `<figure class="academy-media academy-source-card"><div><strong>Fuente verificable</strong><span>${appEscape(appAcademySourceLabel(question.fuente))}</span></div></figure>`;
  return `<div class="academy-media-strip">${media.map((item) => {
    const rows = Array.isArray(item.metadata?.rows) ? item.metadata.rows : [];
    if (item.url) return `<figure class="academy-media"><img src="${appEscape(item.url)}" alt="${appEscape(item.alt_text || item.caption || "Material de pregunta")}" loading="lazy" /><figcaption>${appEscape(item.caption || item.source || "Material de estudio")}</figcaption></figure>`;
    if (rows.length) return `<figure class="academy-media"><table>${rows.map((row) => `<tr>${row.map((cell) => `<td>${appEscape(cell)}</td>`).join("")}</tr>`).join("")}</table><figcaption>${appEscape(item.caption || item.source || "Extracto de fuente")}</figcaption></figure>`;
    return `<figure class="academy-media"><div class="academy-media-placeholder">${appEscape(item.caption || item.media_type || "Material adjunto")}</div><figcaption>${appEscape(item.source || "")}</figcaption></figure>`;
  }).join("")}</div>`;
}

function appAcademyDifficultyLabel(value){
  return ({basic:"Basica", basico:"Basica", intermediate:"Media", intermedio:"Media", advanced:"Alta", avanzado:"Alta"}[String(value || "").toLowerCase()] || value || "Media");
}

function appAcademySessionPanelsHtml(question, progressStats, questions){
  const total = questions.length || 0;
  const answered = progressStats.answered;
  const wrong = Object.values(appState.academyProgress || {}).filter((item) => ["incorrect", "partial"].includes(item?.status)).length;
  const pending = Math.max(total - answered, 0);
  return `<aside class="academy-stats-panel">
    <section class="academy-side-card academy-performance-card">
      <strong>Tu desempeno en esta sesion</strong>
      <div class="academy-ring" style="--academy-score:${progressStats.accuracy || 0}%"><span>${progressStats.accuracy || 0}%</span><small>Precision</small></div>
      <dl><div><dt>Respondidas</dt><dd>${answered}</dd></div><div><dt>Correctas</dt><dd>${progressStats.correct}</dd></div><div><dt>Incorrectas</dt><dd>${wrong}</dd></div><div><dt>Sin responder</dt><dd>${pending}</dd></div></dl>
    </section>
    <section class="academy-side-card">
      <div class="academy-side-title"><strong>Preguntas marcadas</strong><b>${progressStats.review}</b></div>
      <p>Tienes ${progressStats.review} preguntas marcadas para revisar mas tarde.</p>
      <button type="button" class="academy-link-button" id="academy-filter-marked">Ir a marcadas</button>
    </section>
    <section class="academy-side-card">
      <strong>Temas que requieren revision</strong>
      ${["Velocidades", "Peso y balance", question.tematica || "Tema actual", "Sistemas"].map((label, index) => `<div class="academy-topic-meter"><span>${appEscape(label)}</span><b><i style="width:${[78,64,58,85][index]}%"></i></b><small>${[78,64,58,85][index]}%</small></div>`).join("")}
    </section>
    <section class="academy-side-card academy-tip-card">
      <strong>Consejo Academy</strong>
      <p>Repasa la fuente indicada antes de responder con seguridad.</p>
    </section>
  </aside>`;
}

function appAcademyIsWrittenQuestion(question){
  const type = String(question?.tipo_pregunta || question?.question_type || "").toLowerCase();
  const options = appAcademyQuestionOptions(question);
  return !options.length || ["written", "respuesta_corta", "short_answer", "free_text", "essay"].includes(type);
}

function appAcademyWrittenAnswerHtml(question){
  const key = appAcademyQuestionKey(question);
  const progress = appState.academyProgress[key] || {};
  const savedText = appEscape(progress.written_answer || "");
  return `<div class="academy-written-answer">
    <label for="academy-written-response"><strong>Respuesta escrita</strong></label>
    <textarea id="academy-written-response" rows="5" placeholder="Escribe tu respuesta o respondela mentalmente antes de ver la pauta.">${savedText}</textarea>
    <small>Esta pregunta no tiene alternativas importadas. Academy mostrara la respuesta esperada y la fuente al responder.</small>
  </div>`;
}

function appAcademyOptionsHtml(question){
  const options = appAcademyQuestionOptions(question);

  if (!options.length) return appAcademyWrittenAnswerHtml(question);

  const key = appAcademyQuestionKey(question);
  const selected = new Set(appAcademySelectedKeys(question));
  const progress = appState.academyProgress[key] || {};
  const answered = Boolean(progress.status);

  return `<div class="academy-options" role="list">${options.map((option) => {
    const classes = ["academy-option"];
    if (selected.has(option.option_key)) classes.push("is-selected");
    if (answered && option.is_correct) classes.push("is-correct");
    if (answered && selected.has(option.option_key) && !option.is_correct) classes.push("is-wrong");
    return `<button type="button" class="${classes.join(" ")}" data-academy-option="${appEscape(option.option_key)}"><span>${appEscape(option.option_key)}</span><strong>${appEscape(option.option_text)}</strong>${answered && option.explanation ? `<small>${appEscape(option.explanation)}</small>` : ""}</button>`;
  }).join("")}</div>`;
}

function appAcademyReportHtml(question){
  if (!appState.academyReportOpen) return "";
  const types = appState.academy?.report_types || [
    { value:"enunciado_confuso", label:"Enunciado confuso" },
    { value:"respuesta_incorrecta", label:"Respuesta incorrecta" },
    { value:"mas_de_una_correcta", label:"Hay mas de una respuesta correcta" },
    { value:"imagen_incorrecta", label:"Imagen incorrecta" },
    { value:"error_fuente", label:"Error en la fuente" },
    { value:"ortografia_redaccion", label:"Ortografia o redaccion" },
    { value:"otro", label:"Otro" },
  ];
  return `<div class="academy-modal" role="dialog" aria-modal="true">
    <form class="academy-modal-panel" id="academy-report-form">
      <div class="academy-card-head"><span>Reportar error</span><button class="btn btn-secondary" type="button" id="academy-report-close">Cerrar</button></div>
      <small>${appEscape(appAcademyQuestionKey(question))} / version ${appEscape(question.version || 1)}</small>
      <select name="report_type">${types.map((type) => `<option value="${appEscape(type.value)}">${appEscape(type.label)}</option>`).join("")}</select>
      <textarea name="comment" rows="4" placeholder="Describe el problema con el enunciado, alternativa, imagen o fuente."></textarea>
      <button class="btn btn-primary" type="submit">Enviar reporte</button>
    </form>
  </div>`;
}

function appAcademyQuestionHtml(){
  const questions = appAcademyQuestions();
  if (!questions.length) return `<div class="academy-empty-state"><strong>No hay preguntas cargadas desde PostgreSQL.</strong><p>${appEscape(appState.academy?.error || "La API Academy no devolvio preguntas para este banco o tema.")}</p></div>`;
  if (appState.academyQuestionIndex >= questions.length) appState.academyQuestionIndex = 0;
  if (appState.academyQuestionIndex < 0) appState.academyQuestionIndex = questions.length - 1;
  const question = questions[appState.academyQuestionIndex];
  const key = appAcademyQuestionKey(question);
  const progress = appState.academyProgress[key] || {};
  const answered = Boolean(progress.status) || appState.academyAnswerVisible;
  const correctKeys = appAcademyCorrectKeys(question);
  const isWrittenQuestion = appAcademyIsWrittenQuestion(question);
  const progressStats = appAcademyProgressStats();
  const source = appAcademySourceLabel(question.fuente);
  return `<article class="academy-study-shell">
    <aside class="academy-index" aria-label="Indice de sesion">
      <strong>Preguntas</strong>
      <small>${progressStats.answered} / ${questions.length} respondidas</small>
      <div class="academy-index-legend"><span><i class="dot answered"></i>Respondida</span><span><i class="dot current"></i>Actual</span><span><i class="dot marked"></i>Marcada</span><span><i class="dot wrong"></i>Incorrecta</span></div>
      <div>${questions.map((item, index) => {
        const itemKey = appAcademyQuestionKey(item);
        const itemProgress = appState.academyProgress[itemKey] || {};
        return `<button type="button" class="${index === appState.academyQuestionIndex ? "is-active" : ""} ${itemProgress.status || ""}${itemProgress.marked ? " marked" : ""}" data-academy-jump="${index}"><span>${index + 1}</span><small>${itemProgress.marked ? "Marcada" : itemProgress.status ? itemProgress.status : ""}</small></button>`;
      }).join("")}</div>
      <button class="academy-summary-button" type="button" id="academy-end">Ver resumen del bloque</button>
    </aside>
    <section class="academy-card academy-question-panel">
      <div class="academy-breadcrumb">Academy / ${appEscape(question.curso || question.aeronave || question.banco_titulo || "Curso")} / ${appEscape(question.tematica || "Tema")} / ${appEscape(question.subtematica || "Pregunta")}</div>
      <div class="academy-card-head"><span>${appEscape(question.public_id || question.id || "ID pendiente")}</span><button class="academy-mark-top" type="button" id="academy-bookmark-top">Marcar</button></div>
      <div class="academy-chip-row"><span>${appEscape(question.tematica || "Tema")}</span><span>${appEscape(question.subtematica || "Subtema")}</span><span>Dificultad: ${appEscape(appAcademyDifficultyLabel(question.nivel))}</span></div>
      <h3>${appEscape(question.pregunta || question.question || "Pregunta sin enunciado")}</h3>
      ${appAcademyMediaHtml(question)}
      <p class="academy-source-line">Fuente: ${appEscape(source)}</p>
      ${appAcademyOptionsHtml(question)}
      <div class="academy-actions academy-mobile-actions"><button class="btn btn-secondary" type="button" id="academy-bookmark">Marcar</button><button class="btn btn-secondary" type="button" id="academy-report">Reportar error</button><button class="btn btn-secondary" type="button" id="academy-source">Ver fuente</button><button class="btn btn-primary" type="button" id="academy-submit">${isWrittenQuestion ? "Ver respuesta esperada" : correctKeys.length > 1 ? "Confirmar seleccion" : "Responder"}</button><button class="btn btn-secondary" type="button" id="academy-prev">Anterior</button><button class="btn btn-secondary" type="button" id="academy-next">Siguiente</button><button class="btn btn-secondary" type="button" id="academy-reveal">Ver explicacion</button><button class="btn btn-secondary" type="button" id="academy-unknown">No se</button></div>
      ${answered ? `<div class="academy-answer"><button class="academy-answer-toggle" type="button">${isWrittenQuestion ? "Respuesta esperada" : "Por que esta es la respuesta correcta?"}</button><div><strong>${isWrittenQuestion ? "Pauta esperada" : "Respuesta correcta"}: ${appEscape(isWrittenQuestion ? question.respuesta_correcta_texto || "-" : correctKeys.join(", ") || question.respuesta_correcta_texto || "-")}</strong><p>${appEscape(question.explicacion_corta || question.explicacion_profunda || "-")}</p>${appState.academyMode === "instructor" || appState.academySourceOpen ? `<p>Fuente verificable: ${appEscape(source)}</p>${question.explicacion_profunda ? `<p>${appEscape(question.explicacion_profunda)}</p>` : ""}` : ""}</div></div>` : `<p class="academy-muted">${isWrittenQuestion ? "Escribe o piensa tu respuesta. Luego revisa la pauta esperada desde PostgreSQL." : "Selecciona una alternativa y responde. Las respuestas se guardan en PostgreSQL."}</p>`}
    </section>
    ${appAcademySessionPanelsHtml(question, progressStats, questions)}
    ${appAcademyReportHtml(question)}
  </article>`;
}

async function appRenderAcademyPanel(){
  await appEnsureAcademyLoaded();
  appSetText("app-view-label", "Labs / Subproducto Academy");
  appSetText("app-product-title", "AVIA Academy");
  appSetText("app-product-description", "Motor de aprendizaje con bancos trazables, fuentes verificables, progreso por alumno y reportes de calidad.");
  appSetText("app-product-status", `${appAcademyStats().total_questions ?? 0} preguntas`);
  appSetText("app-product-slug", "labs-academy");
  appRenderStats();
  const demo = document.getElementById("app-product-demo");
  if (demo) demo.innerHTML = "";
  appSetText("app-config-title", "Estudiar preguntas");
  const config = document.getElementById("app-product-config");
  if (!config) return;
  config.innerHTML = `<div class="academy-product-surface">${appAcademySummaryHtml()}${appAcademyControlsHtml()}${appAcademyThemeMapHtml()}<div id="academy-question-wrap">${appAcademyQuestionHtml()}</div><div id="cause-action-output" class="app-query-output" style="display:none"></div></div>`;
  appBindControls();
}

async function appAcademySubmitAnswer(statusOverride = null){
  const question = appAcademyQuestions()[appState.academyQuestionIndex];
  if (!question) return;
  const key = appAcademyQuestionKey(question);
  const selected = statusOverride === "unknown" ? [] : appAcademySelectedKeys(question);
  const correct = appAcademyCorrectKeys(question);
  const isWrittenQuestion = appAcademyIsWrittenQuestion(question);
  const writtenAnswer = isWrittenQuestion ? String(document.getElementById("academy-written-response")?.value || "").trim() : "";
  const selectedSet = new Set(selected);
  const isCorrect = correct.length ? selected.length === correct.length && correct.every((item) => selectedSet.has(item)) : false;
  const isPartial = !isCorrect && selected.some((item) => correct.includes(item));
  appState.academyProgress[key] = {
    status: isWrittenQuestion ? "review" : statusOverride === "unknown" ? "incorrect" : isCorrect ? "correct" : isPartial ? "partial" : "incorrect",
    selected,
    correct,
    written_answer: writtenAnswer,
    answeredAt: new Date().toISOString(),
    version: question.version || 1,
    marked: appState.academyProgress[key]?.marked || false,
  };
  appState.academyAnswerVisible = true;
  try {
    await appFetch("/api/academy/answers", { method:"POST", body:JSON.stringify({
      question_id: question.id || question.question_uuid || key,
      selected_option_keys: selected,
      written_answer: writtenAnswer || null,
      mode: appState.academyMode,
      time_spent_seconds: Math.max(1, Math.round((Date.now() - appState.academyQuestionStartedAt) / 1000)),
      confidence_level: statusOverride === "unknown" ? "no_sabia" : isWrittenQuestion ? "respuesta_escrita" : "seguro",
      feedback_shown: true,
      public_id: key
    }) });
  } catch (error) {
    appState.academyProgress[key].sync_error = error.message;
  }
  await appRenderPanel();
}

function appBindAcademyControls(){
  document.getElementById("academy-bank-select")?.addEventListener("change", async (event) => { appState.academyBank = event.target.value || "all"; appState.academyTheme = "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; appState.academyQuestionStartedAt = Date.now(); await appEnsureAcademyLoaded(true); await appRenderPanel(); });
  document.getElementById("academy-theme-select")?.addEventListener("change", async (event) => { appState.academyTheme = event.target.value || "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; appState.academyQuestionStartedAt = Date.now(); await appEnsureAcademyLoaded(true); await appRenderPanel(); });
  document.getElementById("academy-mode-select")?.addEventListener("change", async (event) => { appState.academyMode = event.target.value || "study"; appState.academyAnswerVisible = false; appState.academyQuestionStartedAt = Date.now(); await appEnsureAcademyLoaded(true); await appRenderPanel(); });
  document.querySelectorAll("[data-academy-jump]").forEach((button) => button.addEventListener("click", async () => { appState.academyQuestionIndex = Number(button.dataset.academyJump || 0); appState.academyAnswerVisible = false; appState.academyQuestionStartedAt = Date.now(); await appRenderPanel(); }));
  document.querySelectorAll("[data-academy-option]").forEach((button) => button.addEventListener("click", async () => {
    const question = appAcademyQuestions()[appState.academyQuestionIndex];
    const key = appAcademyQuestionKey(question);
    const optionKey = button.dataset.academyOption;
    const selected = new Set(appAcademySelectedKeys(question));
    const isMulti = appAcademyCorrectKeys(question).length > 1 || question?.tipo_pregunta === "multiple_select";
    if (selected.has(optionKey)) selected.delete(optionKey); else { if (!isMulti) selected.clear(); selected.add(optionKey); }
    appState.academySelected[key] = [...selected];
    await appRenderPanel();
  }));
  document.getElementById("academy-prev")?.addEventListener("click", async () => { appState.academyQuestionIndex -= 1; appState.academyAnswerVisible = false; appState.academyQuestionStartedAt = Date.now(); await appRenderPanel(); });
  document.getElementById("academy-next")?.addEventListener("click", async () => { appState.academyQuestionIndex += 1; appState.academyAnswerVisible = false; appState.academyQuestionStartedAt = Date.now(); await appRenderPanel(); });
  document.getElementById("academy-submit")?.addEventListener("click", () => appAcademySubmitAnswer());
  document.getElementById("academy-unknown")?.addEventListener("click", () => appAcademySubmitAnswer("unknown"));
  document.getElementById("academy-reveal")?.addEventListener("click", async () => { appState.academyAnswerVisible = true; await appRenderPanel(); });
  document.getElementById("academy-source")?.addEventListener("click", async () => { appState.academySourceOpen = !appState.academySourceOpen; appState.academyAnswerVisible = true; await appRenderPanel(); });
  const bookmarkCurrent = async () => {
    const question = appAcademyQuestions()[appState.academyQuestionIndex];
    const key = appAcademyQuestionKey(question);
    appState.academyProgress[key] = { ...(appState.academyProgress[key] || {}), status: appState.academyProgress[key]?.status || "review", marked: true };
    try { await appFetch(`/api/academy/questions/${encodeURIComponent(question.id || question.question_uuid || key)}/bookmark`, { method:"POST", body:JSON.stringify({ note:"Marcada desde Academy web" }) }); } catch (_) {}
    await appRenderPanel();
  };
  document.getElementById("academy-bookmark")?.addEventListener("click", bookmarkCurrent);
  document.getElementById("academy-bookmark-top")?.addEventListener("click", bookmarkCurrent);
  document.getElementById("academy-report")?.addEventListener("click", async () => { appState.academyReportOpen = true; await appRenderPanel(); });
  document.getElementById("academy-report-close")?.addEventListener("click", async () => { appState.academyReportOpen = false; await appRenderPanel(); });
  document.getElementById("academy-end")?.addEventListener("click", async () => { const stats = appAcademyProgressStats(); try { await appFetch("/api/academy/study/session/end", { method:"POST", body:JSON.stringify({ ...stats, mode: appState.academyMode }) }); } catch (_) {} appShow(`Sesion terminada. Respondidas: ${stats.answered}. Precision: ${stats.accuracy}%.`); });
  document.getElementById("academy-report-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const question = appAcademyQuestions()[appState.academyQuestionIndex];
    const key = appAcademyQuestionKey(question);
    const form = new FormData(event.currentTarget);
    const payload = { report_type:String(form.get("report_type") || "otro"), comment:String(form.get("comment") || "").trim() || "Reporte sin comentario", selected_option_keys: appAcademySelectedKeys(question), correct_option_keys: appAcademyCorrectKeys(question), question_public_id:key, question_version: question.version || 1 };
    try { await appFetch(`/api/academy/questions/${encodeURIComponent(question.id || question.question_uuid || key)}/report`, { method:"POST", body:JSON.stringify(payload) }); appState.academyReportOpen = false; await appRenderPanel(); appShow("Reporte enviado para revision."); } catch (error) { appShow(error.message || "No se pudo enviar el reporte.", true); }
  });
}

function appBindControls(){
  document.querySelectorAll("[data-legal-page]").forEach((button) => button.addEventListener("click", () => { appState.legalPage = Number(button.dataset.legalPage || 1); appRenderLegalPanel(); }));
  document.querySelectorAll("[data-legal-tab]").forEach((button) => button.addEventListener("click", async () => { appState.legalTab = button.dataset.legalTab || "summary"; history.replaceState(null, "", `#legal-${appState.legalTab}`); await appRenderPanel(); }));
  document.querySelectorAll("[data-legal-filter]").forEach((select) => select.addEventListener("change", () => { appState.legalFilters[select.dataset.legalFilter] = select.value || "all"; appState.legalPage = 1; appRenderLegalPanel(); }));
  document.querySelector("[data-legal-clear]")?.addEventListener("click", () => { appState.search = ""; Object.keys(appState.legalFilters).forEach((key) => { appState.legalFilters[key] = "all"; }); appState.legalPage = 1; appRenderLegalPanel(); });
  document.querySelector("[data-legal-page-size]")?.addEventListener("change", (event) => { appState.legalPageSize = Number(event.target.value || 25); appState.legalPage = 1; appRenderLegalPanel(); });
  document.querySelector("[data-legal-export]")?.addEventListener("click", appDownloadLegalExcel);
  document.querySelectorAll("[data-cause-field]").forEach((select) => select.addEventListener("change", async () => {
    const previous = appState.causes.find((cause) => cause.id === select.dataset.causeId)?.[select.dataset.causeField] || "";
    select.disabled = true;
    try {
      await appFetch(`/api/causes/${select.dataset.causeId}`, { method:"PATCH", body:JSON.stringify({ [select.dataset.causeField]: select.value || null }) });
      await appReload();
      appShow("Asignación actualizada.");
    } catch (error) {
      select.value = previous;
      select.disabled = false;
      appShow(error.message || "No se pudo actualizar la causa.", true);
    }
  }));
  document.querySelectorAll("[data-product-view]").forEach((button) => button.addEventListener("click", async () => { appState.view = button.dataset.productView || "causes"; await appRenderPanel(); }));
  document.querySelectorAll("[data-cause-filter]").forEach((button) => button.addEventListener("click", () => { appState.view = "causes"; appState.statusFilter = button.dataset.causeFilter || "all"; appRenderPanel(); }));
  document.querySelectorAll("[data-vehicle-filter]").forEach((button) => button.addEventListener("click", () => { appState.view = "technical-reviews"; appState.vehicleFilter = button.dataset.vehicleFilter || "all"; appRenderPanel(); }));
  document.querySelectorAll("[data-academy-theme]").forEach((button) => button.addEventListener("click", async () => { appState.view = "academy"; appState.academyTheme = button.dataset.academyTheme || "all"; appState.academyQuestionIndex = 0; appState.academyAnswerVisible = false; await appRenderPanel(); }));
  document.getElementById("cause-search-input")?.addEventListener("input", (event) => { appState.search = event.target.value || ""; appState.legalPage = 1; const rows = document.getElementById("cause-list-rows"); if (rows) rows.innerHTML = appLegalTableHtml(); appBindControls(); });
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
