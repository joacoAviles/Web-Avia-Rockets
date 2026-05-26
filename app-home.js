const AVIA_APP_API = "https://api.aviarockets.cl";
const AVIA_TOKEN_KEY = "avia_auth_token";
const AVIA_USER_KEY = "avia_auth_user";

function appGetToken() {
  return localStorage.getItem(AVIA_TOKEN_KEY);
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
  if (node) node.textContent = value;
}

function appNormalizeSlug(slug) {
  const map = {
    automatizacion: "ops",
    datos: "intelligence",
    "web-saas": "labs",
    "integraciones-api": "api",
    pdlju: "legal",
    fleet: "flota",
    custom: "labs"
  };
  return map[slug] || slug;
}

function appProductIcon(slug) {
  const normalized = appNormalizeSlug(slug);
  const map = { legal: "LG", flota: "FL", intelligence: "IN", api: "AP", labs: "LB", ops: "OP" };
  return map[normalized] || slug.slice(0, 2).toUpperCase();
}

function appProductConfig(product) {
  return [
    ["Producto", product.name],
    ["Slug", product.slug],
    ["Estado", product.is_active ? "Activo" : "Inactivo"],
    ["Descripción corta", product.short_description || "Sin descripción"],
    ["ID API", String(product.id)]
  ];
}

function appRenderProductMenu(products, selectedSlug) {
  const menu = document.getElementById("app-product-menu");
  if (!menu) return;
  menu.innerHTML = products.map((product) => {
    const active = product.slug === selectedSlug ? " is-active" : "";
    return `<button class="app-product-button${active}" type="button" data-product-slug="${product.slug}"><strong>${appProductIcon(product.slug)}</strong><span>${product.name}</span><small>${product.short_description || "Producto contratado"}</small></button>`;
  }).join("");
}

function appRenderProductDetail(product, user) {
  if (!product) return;
  appSetText("app-product-title", product.name);
  appSetText("app-product-description", product.full_description || product.short_description || "Producto activo.");
  appSetText("app-product-status", product.is_active ? "Activo" : "Inactivo");
  appSetText("app-product-slug", product.slug);
  appSetText("app-product-role", user.role);

  const config = document.getElementById("app-product-config");
  if (config) {
    config.innerHTML = appProductConfig(product).map(([label, value]) => `<div class="app-config-row"><span>${label}</span><strong>${value}</strong></div>`).join("");
  }

  const queryProduct = document.getElementById("admin-query-product");
  if (queryProduct) queryProduct.value = product.slug;
}

function appRenderStats(data) {
  appSetText("app-user-email", data.user.email);
  appSetText("app-products-count", String(data.stats.products_count || data.products.length));
  appSetText("app-causes-count", String(data.stats.causes_count || 0));
  appSetText("app-user-role", data.user.role);
}

function appRenderAdminPanel(user, products) {
  const panel = document.getElementById("app-admin-panel");
  if (!panel) return;
  if (user.role !== "admin") {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  const select = document.getElementById("admin-query-product");
  if (select) {
    select.innerHTML = products.map((product) => `<option value="${product.slug}">${product.name}</option>`).join("");
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

async function appInit() {
  if (!appGetToken()) {
    window.location.href = "login.html?next=app-beta.html";
    return;
  }

  try {
    const data = await appFetch("/api/dashboard");
    const products = Array.isArray(data.products) ? data.products : [];
    if (!products.length) throw new Error("No hay productos activos asociados.");
    appRenderStats(data);
    appRenderAdminPanel(data.user, products);
    let selected = products[0];
    appRenderProductMenu(products, selected.slug);
    appRenderProductDetail(selected, data.user);

    document.getElementById("app-product-menu")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-product-slug]");
      if (!button) return;
      const next = products.find((product) => product.slug === button.dataset.productSlug);
      if (!next) return;
      selected = next;
      appRenderProductMenu(products, selected.slug);
      appRenderProductDetail(selected, data.user);
    });

    document.getElementById("admin-query-button")?.addEventListener("click", appRunAdminQuery);
    document.getElementById("app-logout-button")?.addEventListener("click", appLogout);
  } catch (error) {
    appClearSession();
    const root = document.getElementById("app-error");
    if (root) {
      root.hidden = false;
      root.textContent = error.message || "No se pudo cargar el home de productos.";
    }
  }
}

appInit();
