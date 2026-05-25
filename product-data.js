window.AVIA_PRODUCTS = [
  {
    id: "legal",
    label: "Legal",
    short: "Causas judiciales",
    title: "OPS Legal",
    headline: "Revisión de causas con evidencia, cambios y alerta accionable.",
    description: "Monitorea causas, compara snapshots, detecta movimientos reales y entrega reportes operativos sin depender de revisión manual repetitiva.",
    href: "ops-legal.html",
    cta: "Probar Legal",
    metrics: [
      ["Causas", "148"],
      ["Cambios", "7"],
      ["Alertas", "4"],
      ["Errores", "0"]
    ],
    events: [
      ["Movimiento detectado", "Nueva resolución registrada", "Cambio"],
      ["Informe diario", "Resumen enviado al equipo", "OK"],
      ["Historial trazable", "Snapshot comparado", "Audit"]
    ],
    steps: [
      "Carga una cartera de causas o parte con 5 causas gratis.",
      "El sistema consulta, normaliza y guarda el estado anterior.",
      "Detecta cambios reales: folios, escritos, notificaciones y exhortos.",
      "Entrega alerta, dashboard e historial para auditar la operación."
    ]
  },
  {
    id: "flota",
    label: "Flota",
    short: "Vehículos y mantención",
    title: "OPS Flota",
    headline: "Control de vehículos, vencimientos, costos e incidencias.",
    description: "Ordena revisiones técnicas, permisos, mantenciones, kilometraje e incidencias para operar una flota sin planillas dispersas.",
    href: "ops-flota.html",
    cta: "Probar Flota",
    metrics: [["Vehículos", "42"], ["Alertas", "6"], ["Mantenciones", "11"], ["Vencimientos", "3"]],
    events: [["Revisión técnica", "Vence en 6 días", "Alerta"], ["Mantención", "Cambio de aceite programado", "Plan"], ["Costo mensual", "Desviación detectada", "Dato"]],
    steps: ["Registra vehículos y documentos críticos.", "El sistema calcula vencimientos y estados operativos.", "Detecta incidencias, costos fuera de rango y mantenciones pendientes.", "El dashboard prioriza qué vehículo revisar primero."]
  },
  {
    id: "intelligence",
    label: "Intelligence",
    short: "Riesgo y datos",
    title: "Avia Intelligence",
    headline: "Datos convertidos en señales, score y decisión.",
    description: "Consolida fuentes, limpia datos y entrega tableros ejecutivos para riesgo, priorización y control financiero-operacional.",
    href: "avia-intelligence.html",
    cta: "Probar Intelligence",
    metrics: [["Fuentes", "12"], ["Riesgos", "34"], ["Modelos", "5"], ["Alertas", "9"]],
    events: [["Riesgo alto", "Requiere validación", "Prioridad"], ["Dato inconsistente", "Fuente por revisar", "Dato"], ["Score recalculado", "Nueva señal disponible", "Live"]],
    steps: ["Conecta planillas, APIs o bases internas.", "Normaliza campos y excluye ruido operacional.", "Calcula reglas, scoring y señales accionables.", "Muestra criterios de decisión y próximas acciones."]
  },
  {
    id: "api",
    label: "API",
    short: "Conectores",
    title: "Avia API",
    headline: "Endpoints para conectar operación, datos y productos internos.",
    description: "Una capa API para unir fuentes externas, bases internas, paneles y automatizaciones sin rehacer cada integración desde cero.",
    href: "avia-labs.html",
    cta: "Probar API",
    metrics: [["Endpoints", "18"], ["Jobs", "24"], ["Uptime", "99%"], ["Errores", "2"]],
    events: [["Endpoint activo", "Respuesta normalizada", "Live"], ["Webhook", "Evento recibido", "OK"], ["Token", "Permiso validado", "Secure"]],
    steps: ["Define la fuente y el destino de datos.", "Crea endpoints documentados y con permisos.", "Agrega logs, errores controlados y jobs programados.", "Conecta el API al dashboard o a una app interna."]
  },
  {
    id: "lab",
    label: "Lab",
    short: "Apps internas",
    title: "Avia Lab",
    headline: "Prototipos utilizables para convertir procesos en software.",
    description: "Construye apps, paneles, bots y automatizaciones específicas cuando el software genérico no calza con la operación real.",
    href: "avia-labs.html",
    cta: "Probar Lab",
    metrics: [["Apps", "3"], ["Flujos", "16"], ["Usuarios", "28"], ["Deploys", "7"]],
    events: [["App interna", "Flujo listo para usuarios", "Build"], ["Panel", "Vista ejecutiva publicada", "OK"], ["Bot", "Tarea programada", "Auto"]],
    steps: ["Mapea el proceso y el usuario final.", "Diseña pantallas, permisos y datos mínimos.", "Construye una beta funcional conectada a operación.", "Itera el producto con métricas y feedback real."]
  }
];

window.AVIA_COMPANY_LOGOS = ["Norte Capital", "Andes Fleet", "LexData", "Puerto Labs", "Cumbre Ops"];

window.renderAviaProductPanel = function renderAviaProductPanel(product, options = {}) {
  const compact = Boolean(options.compact);
  const rows = product.events.map((event) => `
    <div class="demo-event-row">
      <span>${event[0].slice(0, 3).toUpperCase()}</span>
      <div><strong>${event[0]}</strong><small>${event[1]}</small></div>
      <em>${event[2]}</em>
    </div>`).join("");
  const metrics = product.metrics.map((metric) => `<div><span>${metric[0]}</span><strong>${metric[1]}</strong></div>`).join("");
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
  return "https://aviarockets.cl";
})();

window.aviaNormalizeProductSlug = function aviaNormalizeProductSlug(slug) {
  const map = {
    ops: "legal",
    legal: "legal",
    "ops-legal": "legal",
    pdlju: "legal",
    flota: "flota",
    fleet: "flota",
    intelligence: "intelligence",
    datos: "intelligence",
    labs: "lab",
    lab: "lab",
    custom: "lab",
    api: "api",
    "integraciones-api": "api"
  };
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

window.aviaLoadProducts = async function aviaLoadProducts() {
  try {
    const services = await window.aviaApiFetch("/api/products");
    if (!Array.isArray(services) || !services.length) return window.AVIA_PRODUCTS;
    const products = services.map((service) => {
      const id = window.aviaNormalizeProductSlug(service.slug);
      const fallback = window.AVIA_PRODUCTS.find((product) => product.id === id) || window.AVIA_PRODUCTS[0];
      return {
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
    });
    window.AVIA_PRODUCTS_FROM_API = products;
    return products;
  } catch (error) {
    console.warn("No se pudieron cargar productos desde la API", error);
    return window.AVIA_PRODUCTS;
  }
};

window.aviaLogout = async function aviaLogout() {
  try {
    await window.aviaApiFetch("/api/auth/logout", { method: "POST" });
  } catch (_) {
  } finally {
    localStorage.removeItem("avia_auth_token");
    localStorage.removeItem("avia_auth_user");
  }
};
