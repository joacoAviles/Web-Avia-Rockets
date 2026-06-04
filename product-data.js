window.AVIA_PRODUCTS = [
  {
    id: "legal",
    label: "Legal",
    short: "Causas judiciales",
    title: "OPS Legal",
    headline: "Revisión de causas con evidencia, cambios y alerta accionable.",
    description: "Monitorea causas, compara snapshots, detecta movimientos reales y entrega reportes operativos sin depender de revisión manual repetitiva.",
    href: "ops-legal.html",
    cta: "Ver Legal",
    metrics: [["Causas", "0"], ["Activas", "0"], ["Pausadas", "0"], ["Correo", "ON"]],
    events: [["Causa activa", "Seguimiento productivo", "OK"], ["Informe diario", "Resumen disponible", "OK"], ["Historial trazable", "Snapshot comparado", "Audit"]],
    steps: ["Carga una cartera de causas.", "El sistema consulta, normaliza y guarda el estado anterior.", "Detecta cambios reales: folios, escritos, notificaciones y exhortos.", "Entrega alerta, dashboard e historial para auditar la operación."]
  },
  { id: "flota", label: "Flota", short: "Vehículos y mantención", title: "OPS Flota", headline: "Control de vehículos, vencimientos, costos e incidencias.", description: "Ordena revisiones técnicas, permisos, mantenciones, kilometraje e incidencias para operar una flota sin planillas dispersas.", href: "ops-flota.html", cta: "Ver Flota", metrics: [["Vehículos", "0"], ["Alertas", "0"], ["Mantenciones", "0"], ["Vencimientos", "0"]], events: [["Operación", "Producto activo", "OK"]], steps: ["Registra vehículos y documentos críticos.", "Calcula vencimientos y estados operativos.", "Detecta incidencias y mantenciones pendientes.", "Prioriza qué vehículo revisar primero."] },
  { id: "intelligence", label: "Intelligence", short: "Riesgo y datos", title: "Avia Intelligence", headline: "Datos convertidos en señales, score y decisión.", description: "Consolida fuentes, limpia datos y entrega tableros ejecutivos para riesgo, priorización y control financiero-operacional.", href: "avia-intelligence.html", cta: "Ver Intelligence", metrics: [["Fuentes", "0"], ["Riesgos", "0"], ["Modelos", "0"], ["Alertas", "0"]], events: [["Datos", "Producto activo", "OK"]], steps: ["Conecta fuentes internas.", "Normaliza campos y excluye ruido operacional.", "Calcula reglas y señales accionables.", "Muestra criterios de decisión."] },
  { id: "api", label: "API", short: "Conectores", title: "Avia API", headline: "Endpoints para conectar operación, datos y productos internos.", description: "Una capa API para unir fuentes externas, bases internas, paneles y automatizaciones sin rehacer cada integración desde cero.", href: "avia-labs.html", cta: "Ver API", metrics: [["Endpoints", "0"], ["Jobs", "0"], ["Uptime", "99%"], ["Errores", "0"]], events: [["Endpoint", "Producto activo", "OK"]], steps: ["Define fuente y destino.", "Crea endpoints documentados.", "Agrega logs y jobs programados.", "Conecta API al dashboard."] },
  { id: "lab", label: "Lab", short: "Apps internas", title: "Avia Lab", headline: "Apps internas para convertir procesos en software.", description: "Construye apps, paneles, bots y automatizaciones específicas cuando el software genérico no calza con la operación real.", href: "avia-labs.html", cta: "Ver Lab", metrics: [["Apps", "0"], ["Flujos", "0"], ["Usuarios", "0"], ["Deploys", "0"]], events: [["App interna", "Producto activo", "OK"]], steps: ["Mapea el proceso.", "Diseña permisos y datos mínimos.", "Construye una versión funcional.", "Itera con métricas reales."] }
];

window.AVIA_COMPANY_LOGOS = ["Norte Capital", "Andes Fleet", "LexData", "Puerto Labs", "Cumbre Ops"];

window.AVIA_HOME_PUBLIC_DATA = null;

window.renderAviaProductPanel = function renderAviaProductPanel(product, options = {}) {
  const compact = Boolean(options.compact);
  const rows = (product.events || []).map((event) => `
    <div class="demo-event-row">
      <span>${String(event[0] || "EVT").slice(0, 3).toUpperCase()}</span>
      <div><strong>${event[0] || "Evento"}</strong><small>${event[1] || ""}</small></div>
      <em>${event[2] || "OK"}</em>
    </div>`).join("");
  const metrics = (product.metrics || []).map((metric) => `<div><span>${metric[0]}</span><strong>${metric[1]}</strong></div>`).join("");
  return `
    <article class="real-product-card ${compact ? "is-compact" : ""}" data-product-view="${product.id}">
      <div class="real-window-bar"><img src="assets/avia-rockets-logo.svg" alt="" /><div><strong>${product.title}</strong><small>${product.short}</small></div><i></i></div>
      <div class="real-product-body">
        <div class="real-product-copy"><p>${product.label}</p><h3>${product.headline}</h3><span>${product.description}</span></div>
        <div class="real-metrics">${metrics}</div>
        <div class="real-events">${rows}</div>
      </div>
    </article>`;
};

window.AVIA_API_BASE_URL_RESOLVED = (() => {
  if (window.AVIA_API_BASE_URL) return window.AVIA_API_BASE_URL.replace(/\/$/, "");
  return "https://api.aviarockets.cl";
})();

window.aviaNormalizeProductSlug = function aviaNormalizeProductSlug(slug) {
  const map = { ops: "legal", legal: "legal", "ops-legal": "legal", pdlju: "legal", flota: "flota", fleet: "flota", intelligence: "intelligence", datos: "intelligence", labs: "lab", lab: "lab", custom: "lab", api: "api", "integraciones-api": "api" };
  return map[slug] || slug;
};

window.aviaApiFetch = async function aviaApiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = localStorage.getItem("avia_auth_token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${window.AVIA_API_BASE_URL_RESOLVED}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch (_) { data = null; }
  if (!response.ok) throw new Error(data?.detail || data?.message || `Error API ${response.status}`);
  return data;
};

function aviaBuildLegalProductFromPublicData(baseProduct, publicData) {
  const stats = publicData?.stats || {};
  const causes = Array.isArray(publicData?.causes) ? publicData.causes : [];
  const active = stats.active_causes_count ?? causes.filter((cause) => cause.user_status === "active").length;
  const inactive = stats.inactive_causes_count ?? causes.filter((cause) => cause.user_status === "inactive").length;
  const events = causes.slice(0, 4).map((cause) => [cause.code, `${cause.court || "Tribunal"} · ${cause.title || "Causa"}`, cause.user_status === "active" ? "Activa" : "Pausada"]);
  return {
    ...baseProduct,
    metrics: [["Causas", String(causes.length)], ["Activas", String(active)], ["Pausadas", String(inactive)], ["Correo", stats.daily_summary_email_enabled ? "ON" : "OFF"]],
    events: events.length ? events : baseProduct.events,
    headline: "Seguimiento real de causas asignadas al usuario productivo.",
    description: "Esta vista usa datos reales cargados para usuario2 y refleja productos, causas y estado de correo resumen desde la base."
  };
}

window.aviaLoadProducts = async function aviaLoadProducts() {
  try {
    const publicHome = await window.aviaApiFetch("/api/public/home");
    window.AVIA_HOME_PUBLIC_DATA = publicHome;
    const services = Array.isArray(publicHome?.products) && publicHome.products.length ? publicHome.products : [];
    const products = services.map((service) => {
      const id = window.aviaNormalizeProductSlug(service.slug);
      const fallback = window.AVIA_PRODUCTS.find((product) => product.id === id) || window.AVIA_PRODUCTS[0];
      const merged = {
        ...fallback,
        id,
        label: service.name || fallback.label,
        short: service.short_description || fallback.short,
        title: service.name || fallback.title,
        headline: service.short_description || fallback.headline,
        description: service.full_description || service.short_description || fallback.description,
        apiServiceId: service.id,
        apiSlug: service.slug,
        isActive: service.is_active
      };
      return id === "legal" ? aviaBuildLegalProductFromPublicData(merged, publicHome) : merged;
    });
    window.AVIA_PRODUCTS_FROM_API = products.length ? products : window.AVIA_PRODUCTS;
    return window.AVIA_PRODUCTS_FROM_API;
  } catch (error) {
    console.warn("No se pudo cargar home productivo desde la API", error);
    return window.AVIA_PRODUCTS;
  }
};

window.aviaLogout = async function aviaLogout() {
  try { await window.aviaApiFetch("/api/auth/logout", { method: "POST" }); } catch (_) {}
  localStorage.removeItem("avia_auth_token");
  localStorage.removeItem("avia_auth_user");
};