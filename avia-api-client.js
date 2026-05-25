const AVIA_API_BASE_URL = (() => {
  if (window.AVIA_API_BASE_URL) return window.AVIA_API_BASE_URL.replace(/\/$/, "");
  return "https://aviarockets.cl";
})();

const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";

function aviaNormalizeProductSlug(slug) {
  const map = {
    ops: "ops",
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
}

function aviaDefaultProduct(slug) {
  const products = Array.isArray(window.AVIA_PRODUCTS) ? window.AVIA_PRODUCTS : [];
  const normalized = aviaNormalizeProductSlug(slug);
  return products.find((product) => product.id === normalized) || products.find((product) => product.id === slug) || null;
}

function aviaServiceToProduct(service) {
  const normalizedSlug = aviaNormalizeProductSlug(service.slug);
  const fallback = aviaDefaultProduct(normalizedSlug) || {
    id: normalizedSlug,
    label: service.name,
    short: service.short_description || "Producto AVIA",
    title: service.name,
    headline: service.short_description || service.name,
    description: service.full_description || service.short_description || service.name,
    href: "contacto.html",
    cta: "Solicitar acceso",
    metrics: [["Estado", "OK"], ["API", "Live"], ["Datos", "Sync"], ["Errores", "0"]],
    events: [["Producto activo", "Disponible desde API", "Live"]],
    steps: ["Producto cargado desde la API.", "Valida datos y permisos.", "Revisa el dashboard operativo.", "Escala el flujo según uso real."]
  };
  return {
    ...fallback,
    id: normalizedSlug,
    label: service.name || fallback.label,
    short: service.short_description || fallback.short,
    title: service.name || fallback.title,
    headline: service.short_description || fallback.headline,
    description: service.full_description || service.short_description || fallback.description,
    apiServiceId: service.id,
    apiSlug: service.slug,
    isActive: service.is_active
  };
}

async function aviaApiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = localStorage.getItem(AVIA_TOKEN_KEY);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${AVIA_API_BASE_URL}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch (_) { data = null; }
  if (!response.ok) throw new Error(data?.detail || data?.message || `Error API ${response.status}`);
  return data;
}

async function aviaLoadProducts() {
  try {
    const services = await aviaApiFetch("/api/products");
    if (!Array.isArray(services) || !services.length) return Array.isArray(window.AVIA_PRODUCTS) ? window.AVIA_PRODUCTS : [];
    const products = services.map(aviaServiceToProduct);
    window.AVIA_PRODUCTS_FROM_API = products;
    return products;
  } catch (error) {
    console.warn("No se pudieron cargar productos desde la API", error);
    return Array.isArray(window.AVIA_PRODUCTS) ? window.AVIA_PRODUCTS : [];
  }
}

async function aviaLogout() {
  try {
    await aviaApiFetch("/api/auth/logout", { method: "POST" });
  } catch (_) {
    // Local logout must still work if the server session is already expired.
  } finally {
    localStorage.removeItem(AVIA_TOKEN_KEY);
    localStorage.removeItem(AVIA_USER_KEY);
  }
}

window.AVIA_API_BASE_URL_RESOLVED = AVIA_API_BASE_URL;
window.aviaApiFetch = aviaApiFetch;
window.aviaLoadProducts = aviaLoadProducts;
window.aviaLogout = aviaLogout;
window.aviaNormalizeProductSlug = aviaNormalizeProductSlug;
