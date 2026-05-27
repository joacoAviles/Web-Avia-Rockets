const AVIA_APP_API = (window.AVIA_API_BASE_URL_RESOLVED || window.AVIA_API_BASE_URL || "https://api.aviarockets.cl").replace(/\/$/, "");
const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";

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

function appNormalizeSlug(slug) {
  if (window.aviaNormalizeProductSlug) return window.aviaNormalizeProductSlug(slug);
  const map = {
    automatizacion: "legal",
    ops: "legal",
    datos: "intelligence",
    "web-saas": "lab",
    labs: "lab",
    "integraciones-api": "api",
    pdlju: "legal",
    fleet: "flota",
    custom: "lab"
  };
  return map[slug] || slug;
}

function appProductIcon(slug) {
  const normalized = appNormalizeSlug(slug);
  const map = { legal: "LG", flota: "FL", intelligence: "IN", api: "AP", lab: "LB", labs: "LB", ops: "OP" };
  return map[normalized] || String(slug || "--").slice(0, 2).toUpperCase();
}

function appProductName(product) {
  return product.name || product.title || product.label || "Producto AVIA";
}

function appProductDescription(product) {
  return product.full_description || product.description || product.short_description || product.headline || "Producto activo.";
}

function appProductSlug(product) {
  return product.slug || product.apiSlug || product.id;
}

function appProductConfig(product, user) {
  return [
    ["Producto", appProductName(product)],
    ["Slug", appProductSlug(product)],
    ["Estado", product.is_active === false ? "Inactivo" : "Activo / disponible"],
    ["Descripción corta", product.short_description || product.short || product.headline || "Sin descripción"],
    ["Usuario", user?.name || user?.full_name || user?.email || "Usuario"],
    ["Fuente visual", "product-data.js / Home"]
  ];
}

function appMenuProductTemplate(product, selectedSlug) {
  const slug = appProductSlug(product);
  const active = slug === selectedSlug ? " is-active" : "";
  return `<button class="app-product-button${active}" type="button" data-product-slug="${slug}"><strong>${appProductIcon(slug)}</strong><span>${appProductName(product)}</span><small>${product.short || product.short_description || "Producto AVIA"}</small></button>`;
}

function appRenderProductMenu(products, selectedSlug) {
  const menu = document.getElementById("app-product-menu");
  if (!menu) return;
  menu.innerHTML = products.map((product) => appMenuProductTemplate(product, selectedSlug)).join("");
}

function appRenderProductDetail(product, user) {
  if (!product) return;
  const slug = appProductSlug(product);
  appSetText("app-view-label", slug === "config" ? "Configuración" : "Producto seleccionado");
  appSetText("app-product-title", appProductName(product));
  appSetText("app-product-description", appProductDescription(product));
  appSetText("app-product-status", product.is_active === false ? "Inactivo" : "Activo");
  appSetText("app-product-slug", slug);
  appSetText("app-product-role", user?.role || "user");

  const demo = document.getElementById("app-product-demo");
  if (demo) {
    if (window.renderAviaProductPanel && slug !== "config") {
      demo.hidden = false;
      demo.innerHTML = window.renderAviaProductPanel(product, { compact: false });
    } else {
      demo.hidden = true;
      demo.innerHTML = "";
    }
  }

  const config = document.getElementById("app-product-config");
  if (config) {
    config.innerHTML = appProductConfig(product, user).map(([label, value]) => `<div class="app-config-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
  }

  const queryProduct = document.getElementById("admin-query-product");
  if (queryProduct && slug !== "config") queryProduct.value = slug;
}

function appRenderUser(user) {
  const name = user?.name || user?.full_name || user?.email || "Usuario";
  appSetText("app-user-name", name);
  appSetText("app-user-email", user?.email || "Sesión local");
  appSetText("app-user-role", user?.role || "user");
}

function appRenderStats(products) {
  appSetText("app-products-count", String(products.length));
  appSetText("app-demo-source", "Home");
}

function appRenderAdminPanel(user, products) {
  const panel = document.getElementById("app-admin-panel");
  if (!panel) return;
  if ((user?.role || "user") !== "admin") {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  const select = document.getElementById("admin-query-product");
  if (select) {
    select.innerHTML = products.map((product) => `<option value="${appProductSlug(product)}">${appProductName(product)}</option>`).join("");
  }
}

async function appRunAdminQuery() {
  const product = document.getElementById("admin-query-product")?.value;
  const query = document.getElementById("admin-query-text")?.value.trim();
  const output = document.getElementById("admin-query-output");
  if (!product || !query) {
    if (output) output.textContent = "Selecciona producto y escribe una query de prueba.";
    return;
  }
  if (output) output.textContent = "Ejecutando query...";
  try {
    const data = await appFetch("/api/admin/product-query", {
      method: "POST",
      body: JSON.stringify({ product_slug: product, query })
    });
    if (output) output.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    if (output) output.textContent = error.message || "Error ejecutando query.";
  }
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

function appGetFallbackProducts() {
  return Array.isArray(window.AVIA_PRODUCTS) ? window.AVIA_PRODUCTS : [];
}

async function appLoadCatalogProducts() {
  if (window.aviaLoadProducts) {
    const fromLoader = await window.aviaLoadProducts();
    if (Array.isArray(fromLoader) && fromLoader.length) return fromLoader;
  }
  return appGetFallbackProducts();
}

async function appLoadDashboardSafely() {
  try {
    return await appFetch("/api/dashboard");
  } catch (error) {
    console.warn("No se pudo cargar /api/dashboard. Se usará catálogo local.", error);
    return null;
  }
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

async function appInit() {
  if (!appGetToken()) {
    window.location.href = "login.html?next=app-beta.html";
    return;
  }

  const storedUser = appGetStoredUser() || { name: "Usuario", email: "", role: "user" };
  appRenderUser(storedUser);
  appSetupSidebarToggle();

  const dashboard = await appLoadDashboardSafely();
  const apiProducts = Array.isArray(dashboard?.products) ? dashboard.products : [];
  const catalogProducts = await appLoadCatalogProducts();
  const products = catalogProducts.length ? catalogProducts : apiProducts;

  if (!products.length) {
    const root = document.getElementById("app-error");
    if (root) {
      root.hidden = false;
      root.textContent = "No hay productos disponibles para mostrar.";
    }
    return;
  }

  const user = dashboard?.user || storedUser;
  appRenderUser(user);
  appRenderStats(products);
  appRenderAdminPanel(user, products);

  let selected = products[0];
  appRenderProductMenu(products, appProductSlug(selected));
  appRenderProductDetail(selected, user);

  document.getElementById("app-product-menu")?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-slug]");
    if (!button) return;
    const next = products.find((product) => appProductSlug(product) === button.dataset.productSlug);
    if (!next) return;
    selected = next;
    appRenderProductMenu(products, appProductSlug(selected));
    appRenderProductDetail(selected, user);
  });

  document.getElementById("app-config-button")?.addEventListener("click", () => {
    const configProduct = {
      id: "config",
      slug: "config",
      name: "Configuración",
      title: "Configuración",
      description: "Preferencias básicas de la cuenta, sesión y visualización del panel.",
      short: "Cuenta y preferencias",
      is_active: true
    };
    appRenderProductMenu(products, "");
    appRenderProductDetail(configProduct, user);
  });

  document.getElementById("admin-query-button")?.addEventListener("click", appRunAdminQuery);
  document.getElementById("app-logout-button")?.addEventListener("click", appLogout);
}

appInit();
