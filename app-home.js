const AVIA_APP_API = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || "https://api.aviarockets.cl").replace(/\/$/, "");
const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";
const AVIA_PJUD_UPLOAD_SUMMARY_KEY = "avia_pjud_upload_summary";

const ACADEMY_FALLBACK = {
  ok: true,
  source: "fallback-web",
  stats: { banks_count: 1, total_questions: 8, thematicas_count: 5, due_reviews: 0 },
  banks: [
    {
      bank_id: "robinson-r22-manual-tecnico",
      slug: "robinson-r22-manual-tecnico",
      titulo: "Robinson R22 Â· Manual tÃ©cnico",
      dominio: "aviacion",
      tipo_banco: "manual_tecnico",
      tematicas: ["Vigencia documental", "InspecciÃ³n 100 horas/anual", "Zonas del helicÃ³ptero", "Sistema elÃ©ctrico", "Vida limitada"],
      questions_count: 8,
      estado: "borrador_estudio",
    },
  ],
  questions: [
    { id:"r22-mt-vig-001", bank_id:"robinson-r22-manual-tecnico", tematica:"Vigencia documental", subtematica:"RevisiÃ³n vigente", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"Â¿Por quÃ© se debe revisar la versiÃ³n vigente del manual antes de estudiar datos tÃ©cnicos?", respuesta_correcta_texto:"Porque las pÃ¡ginas efectivas pueden cambiar entre revisiones.", explicacion_corta:"Un dato tÃ©cnico solo sirve si pertenece a la revisiÃ³n aplicable.", explicacion_profunda:"En manuales tÃ©cnicos de aeronaves, distintas pÃ¡ginas pueden tener fechas diferentes. La revisiÃ³n vigente y el revision log determinan quÃ© pÃ¡ginas siguen aplicando.", fuente:{ documento:"r22_mm_DEC_2024_fd49c66adc.pdf" } },
    { id:"r22-mt-vig-002", bank_id:"robinson-r22-manual-tecnico", tematica:"Vigencia documental", subtematica:"Revision log", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"Â¿QuÃ© documento permite ordenar o verificar las pÃ¡ginas efectivas del manual?", respuesta_correcta_texto:"El revision log.", explicacion_corta:"El revision log permite confirmar quÃ© pÃ¡ginas estÃ¡n vigentes.", explicacion_profunda:"La estructura de publicaciones tÃ©cnicas exige comprobar la vigencia de las pÃ¡ginas antes de usar datos o tablas.", fuente:{ documento:"r22_mm_DEC_2024_fd49c66adc.pdf" } },
    { id:"r22-mt-insp-001", bank_id:"robinson-r22-manual-tecnico", tematica:"InspecciÃ³n 100 horas/anual", subtematica:"Alcance general", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"Â¿QuÃ© Ã¡reas generales cubre la inspecciÃ³n de 100 horas/anual?", respuesta_correcta_texto:"Funcionamiento general, zonas fÃ­sicas y trazabilidad documental.", explicacion_corta:"La inspecciÃ³n combina pruebas funcionales, revisiÃ³n por accesos y cierre documental.", explicacion_profunda:"El manual ordena el estudio entre ground check, run-up, flight check, preparaciÃ³n, inspecciÃ³n por paneles y control de cumplimiento documental.", fuente:{ documento:"r22_mm_100hour_c2ec0da743.pdf" } },
    { id:"r22-mt-insp-004", bank_id:"robinson-r22-manual-tecnico", tematica:"InspecciÃ³n 100 horas/anual", subtematica:"Run-up", nivel:"intermedio", tipo_pregunta:"respuesta_corta", pregunta:"Â¿QuÃ© revisa el run-up?", respuesta_correcta_texto:"Motor, rotor, clutch, governor, tacÃ³metros, carga elÃ©ctrica y avisos.", explicacion_corta:"El run-up cruza motor, rotor, instrumentos y avisos.", explicacion_profunda:"El run-up permite estudiar la relaciÃ³n entre planta motriz, sistema rotor, clutch, governor, tacÃ³metros y circuito elÃ©ctrico bajo condiciÃ³n funcional.", fuente:{ documento:"r22_mm_100hour_c2ec0da743.pdf" } },
    { id:"r22-mt-zona-003", bank_id:"robinson-r22-manual-tecnico", tematica:"Zonas del helicÃ³ptero", subtematica:"Circuit breaker panel", nivel:"intermedio", tipo_pregunta:"respuesta_corta", pregunta:"Â¿QuÃ© zona agrupa circuit breakers y bus bars?", respuesta_correcta_texto:"El panel elÃ©ctrico de protecciÃ³n y distribuciÃ³n.", explicacion_corta:"Ese panel concentra protecciÃ³n, conexiones y distribuciÃ³n elÃ©ctrica.", explicacion_profunda:"El estudio del panel debe considerar condiciÃ³n de wiring, conexiones, breakers, bus bars y limpieza interior.", fuente:{ documento:"r22_mm_100hour_c2ec0da743.pdf" } },
    { id:"r22-mt-elec-001", bank_id:"robinson-r22-manual-tecnico", tematica:"Sistema elÃ©ctrico", subtematica:"MÃ©todo de lectura", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"Â¿CÃ³mo se estudia un circuito elÃ©ctrico de forma ordenada?", respuesta_correcta_texto:"Fuente, protecciÃ³n, control, carga y ground.", explicacion_corta:"Ese orden evita mirar cables sin contexto.", explicacion_profunda:"Un circuito se entiende mejor como una cadena funcional: energÃ­a, protecciÃ³n, mando o condiciÃ³n, consumo y retorno elÃ©ctrico.", fuente:{ documento:"R22_Electrical_System_Schematics_c8dca0bf0c.pdf" } },
    { id:"r22-mt-elec-005", bank_id:"robinson-r22-manual-tecnico", tematica:"Sistema elÃ©ctrico", subtematica:"Warning lights", nivel:"basico", tipo_pregunta:"respuesta_corta", pregunta:"Â¿QuÃ© warning lights conviene agrupar al estudiar el R22?", respuesta_correcta_texto:"Low oil pressure, low fuel, low voltage, clutch, rotor brake, CO, chip/temperature y low RPM.", explicacion_corta:"Esas luces conectan el estudio elÃ©ctrico con sistemas y sensores.", explicacion_profunda:"Las luces de aviso no se estudian aisladas: cada una depende de alimentaciÃ³n, control, sensor o condiciÃ³n, carga y ground.", fuente:{ documento:"R22_Electrical_System_Schematics_c8dca0bf0c.pdf" } },
    { id:"r22-mt-vida-001", bank_id:"robinson-r22-manual-tecnico", tematica:"Vida limitada", subtematica:"MÃ©todo de tiempo", nivel:"intermedio", tipo_pregunta:"respuesta_corta", pregunta:"Â¿QuÃ© dos formas de medir tiempo aparecen en las limitaciones?", respuesta_correcta_texto:"Engine run time y flight/collective-up time.", explicacion_corta:"El mÃ©todo de conteo determina quÃ© tabla aplicar.", explicacion_profunda:"El manual separa vidas segÃºn tiempo de motor o tiempo de vuelo/colectivo arriba. No son intercambiables.", fuente:{ documento:"r22_mm_DEC_2024_fd49c66adc.pdf" } },
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
function appDaysText(days){ if (days === null || days === undefined) return "Sin vencimiento"; if (days < 0) return `Vencida hace ${Math.abs(days)} dÃ­as`; if (days === 0) return "Vence hoy"; return `Vence en ${days} dÃ­as`; }
function appReviewLabel(status){ return ({ok:"Al dÃ­a", warning:"Por vencer", expired:"Vencida", unknown:"Sin dato", inactive:"Pausado"}[status] || status || "-"); }
function appNormalizeTheme(value){ return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function appCauseIsPublished(cause){ return cause?.publicada === true || Number(cause?.publicada) === 1; }
function appCauseHasMovement(cause){
  if (!appCauseIsPublished(cause)) return false;
  const explicit = cause?.daily_has_movement ?? cause?.has_movement_today ?? cause?.latest_has_movement ?? cause?.has_movement;
  if (typeof explicit === "boolean") return explicit;
  if (explicit === 0 || explicit === 1) return explicit === 1;
  const dailyResult = cause?.latest_result?.has_changes ?? cause?.last_has_changes ?? cause?.comparison?.changed;
  if (typeof dailyResult === "boolean") return dailyResult;
  const resultText = [
    cause?.latest_result?.summary,
    cause?.latest_result?.result_text,
    cause?.last_result,
    cause?.daily_result,
    cause?.movement_status,
  ].filter(Boolean).join(" ");
  const normalized = appNormalizeTheme(resultText).replace(/[\s_-]+/g, "");
  if (/sin(movimiento|movimientos|cambio|cambios|novedad|novedades)/.test(normalized)) return false;
  if (/(conmovimiento|movimientodetectado|movimientosdetectados|cambiodetectado|cambiosdetectados)/.test(normalized)) return true;
  return false;
}
function appCauseProcurator(cause){
  const value = cause?.assigned_procurator || cause?.assigned_procurador || cause?.procurator || cause?.procurador || cause?.procurator_name || cause?.procurador_nombre;
  if (value && typeof value === "object") return value.name || value.full_name || value.email || value.id || "";
  return String(value || "").trim();
}
function appStoredPjudUploadSummary(){
  try { return JSON.parse(localStorage.getItem(AVIA_PJUD_UPLOAD_SUMMARY_KEY) || "null"); } catch (_) { return null; }
}
function appFirstMetric(object, keys, fallback = 0){
  for (const key of keys) {
    if (object?.[key] !== undefined && object?.[key] !== null && object?.[key] !== "") return Number(object[key]);
  }
  return fallback;
}
function appLegalTabsHtml(){
  const available = typeof window.appLegalNavigationItems === "function" ? window.appLegalNavigationItems() : [
    { view:"legal-summary", label:"Resumen" },
    { view:"causes", label:"Causas" },
  ];
  return `<nav class="legal-tabs" aria-label="Secciones legales">${available.map((item) => {
    const active = (item.view === "legal-summary" && appState.legalTab === "summary") || (item.view === "causes" && appState.legalTab === "causes") || appState.view === item.view;
    return `<button type="button" data-legal-view="${appEscape(item.view)}" class="${active ? "is-active" : ""}">${appEscape(item.label)}</button>`;
  }).join("")}</nav>`;
}

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
    throw new Error("SesiÃ³n expirada o invÃ¡lida");
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
    const s…18785 tokens truncated…pEscape(source)}</p>${question.explicacion_profunda ? `<p>${appEscape(question.explicacion_profunda)}</p>` : ""}` : ""}</div></div>` : `<p class="academy-muted">${isWrittenQuestion ? "Escribe o piensa tu respuesta. Luego revisa la pauta esperada desde PostgreSQL." : "Selecciona una alternativa y responde. Las respuestas se guardan en PostgreSQL."}</p>`}
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
  document.querySelectorAll("[data-legal-view]").forEach((button) => button.addEventListener("click", async () => {
    const view = button.dataset.legalView || "legal-summary";
    if (typeof window.appNavigateToProductView === "function") return window.appNavigateToProductView(view);
    appState.view = view;
    appState.legalTab = view === "causes" ? "causes" : "summary";
    history.replaceState(null, "", `#legal-${appState.legalTab}`);
    await appRenderPanel();
  }));
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
      appShow("AsignaciÃ³n actualizada.");
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
  document.getElementById("cause-bulk-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const causes = String(form.get("bulk") || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((line) => { const [code, court] = line.split("|").map((part) => part.trim()); return { code, court: court || null }; }).filter((cause) => cause.code); if (!causes.length) return appShow("No hay causas vÃ¡lidas para cargar.", true); try { const result = await appFetch("/api/causes/bulk", { method:"POST", body:JSON.stringify({ causes }) }); await appReload(); appShow(`Carga masiva terminada. Registros procesados: ${result.created_or_updated || 0}.`); } catch (error) { appShow(error.message || "Error en carga masiva.", true); } });
  document.getElementById("account-settings-form")?.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { appState.account = await appFetch("/api/account/settings", { method:"PATCH", body:JSON.stringify({ ui_theme_preference:String(form.get("ui_theme_preference") || "dark"), default_payment_method:String(form.get("default_payment_method") || "manual"), daily_summary_email_enabled:form.has("daily_summary_email_enabled") }) }); await appReload(); appShow("ConfiguraciÃ³n guardada."); } catch (error) { appShow(error.message || "Error guardando configuraciÃ³n.", true); } });
  document.getElementById("account-delete-request")?.addEventListener("click", async () => { try { await appFetch("/api/account/delete-request", { method:"POST" }); await appReload(); appShow("Solicitud de eliminaciÃ³n registrada."); } catch (error) { appShow(error.message || "Error solicitando eliminaciÃ³n.", true); } });
  appBindAcademyControls(); appBindRowActions(); appBindVehicleActions();
}

function appBindRowActions(){
  document.querySelectorAll("[data-cause-status]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { await appFetch(`/api/causes/${button.dataset.causeStatus}/status`, { method:"PATCH", body:JSON.stringify({ status: button.dataset.nextStatus }) }); await appReload(); } catch (error) { appShow(error.message || "Error actualizando causa.", true); } }); });
  document.querySelectorAll("[data-cause-run]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { await appFetch(`/api/causes/${button.dataset.causeRun}/run`, { method:"POST" }); await appReload(); appShow("RevisiÃ³n registrada sin cambios."); } catch (error) { appShow(error.message || "Error registrando revisiÃ³n.", true); } }); });
  document.querySelectorAll("[data-cause-results]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { appShowResults(await appFetch(`/api/causes/${button.dataset.causeResults}/results`)); } catch (error) { appShow(error.message || "Error cargando resultados.", true); } }); });
  document.querySelectorAll("[data-result-form]").forEach((formNode) => { if (formNode.dataset.bound === "true") return; formNode.dataset.bound = "true"; formNode.addEventListener("submit", async (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); try { await appFetch(`/api/causes/${event.currentTarget.dataset.resultForm}/results`, { method:"POST", body:JSON.stringify({ summary:String(form.get("summary") || "").trim() || "Resultado manual", result_text:String(form.get("result_text") || "").trim() || "Resultado registrado desde la web", has_changes:form.has("has_changes") }) }); await appReload(); appShow("Resultado guardado."); } catch (error) { appShow(error.message || "Error guardando resultado.", true); } }); });
}

function appBindVehicleActions(){
  document.querySelectorAll("[data-vehicle-status]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { await appFetch(`/api/technical-reviews/vehicles/${button.dataset.vehicleStatus}/status`, { method:"PATCH", body:JSON.stringify({ status: button.dataset.nextStatus }) }); await appEnsureReviewsLoaded(true); await appRenderPanel(); appShow("Estado del auto actualizado."); } catch (error) { appShow(error.message || "Error actualizando auto.", true); } }); });
  document.querySelectorAll("[data-vehicle-refresh]").forEach((button) => { if (button.dataset.bound === "true") return; button.dataset.bound = "true"; button.addEventListener("click", async () => { try { const due = new Date(); due.setFullYear(due.getFullYear() + 1); await appFetch(`/api/technical-reviews/vehicles/${button.dataset.vehicleRefresh}/review`, { method:"POST", body:JSON.stringify({ review_status:"ok", due_date:due.toISOString().slice(0,10), last_review_date:new Date().toISOString().slice(0,10), notes:"Actualizado desde el panel" }) }); await appEnsureReviewsLoaded(true); await appRenderPanel(); appShow("RevisiÃ³n tÃ©cnica marcada al dÃ­a."); } catch (error) { appShow(error.message || "Error actualizando revisiÃ³n.", true); } }); });
}

function appSetupSidebarToggle(){ const layout = document.getElementById("app-layout"); const toggle = document.getElementById("app-sidebar-toggle"); if (!layout || !toggle) return; toggle.addEventListener("click", () => { const compact = layout.classList.toggle("is-compact"); toggle.textContent = compact ? "â€º" : "â€¹"; }); }
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

