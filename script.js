const API_BASE_URL = (() => {
  if (window.AVIA_API_BASE_URL) return window.AVIA_API_BASE_URL.replace(/\/$/, "");
  var host = window.location.hostname;
  var isLocal = host === "localhost" || host === "127.0.0.1" || host === "";
  return isLocal ? "http://localhost:8080" : "https://api.aviarockets.cl";
})();

const TOKEN_KEY = "avia_auth_token";
const USER_KEY = "avia_auth_user";
const navToggle = document.getElementById("nav-toggle");
const navPanel = document.getElementById("nav-panel");
const langToggle = document.getElementById("lang-toggle");
const revealNodes = document.querySelectorAll(".reveal");

function setPreferredLanguage(lang) {
  const selected = lang === "en" ? "en" : "es";
  document.documentElement.lang = selected;
  localStorage.setItem("avia-lang", selected);
  const languageSelect = document.getElementById("language");
  if (languageSelect) languageSelect.value = selected;
  if (langToggle) {
    langToggle.textContent = selected === "es" ? "EN" : "ES";
    langToggle.setAttribute("aria-label", selected === "es" ? "Switch language to English" : "Cambiar idioma a español");
  }
  document.dispatchEvent(new CustomEvent("avia:language-changed", { detail: { lang: selected } }));
}

function detectInitialLanguage() {
  const saved = localStorage.getItem("avia-lang");
  if (saved === "es" || saved === "en") return saved;
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

function getProtectedContactCopy(lang) {
  const node = document.getElementById("contact-i18n-data");
  if (!node) return null;
  try {
    const data = JSON.parse(node.textContent || "{}");
    return data[lang === "en" ? "en" : "es"] || data.es || null;
  } catch (_) {
    return null;
  }
}

if (langToggle) {
  langToggle.addEventListener("click", () => {
    const nextLang = document.documentElement.lang === "es" ? "en" : "es";
    setPreferredLanguage(nextLang);
  });
}

if (navToggle && navPanel) {
  navToggle.addEventListener("click", () => {
    const isOpen = navPanel.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
  navPanel.querySelectorAll("a, button").forEach((item) => {
    item.addEventListener("click", () => {
      if (window.innerWidth <= 760) {
        navPanel.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  });
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealNodes.forEach((node) => revealObserver.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

function createStatus(parent, selector, className) {
  let status = parent.querySelector(selector);
  if (!status) {
    status = document.createElement("p");
    status.className = className;
    status.setAttribute("aria-live", "polite");
    parent.appendChild(status);
  }
  return status;
}

function showReturnedFormStatus() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get("enviado") !== "1") return;
  const status = createStatus(form, ".form-status", "form-status form-status-ok");
  const isJobApplication = window.location.pathname.includes("trabaja-con-nosotros");
  const currentLang = document.documentElement.lang === "en" ? "en" : "es";
  const copy = getProtectedContactCopy(currentLang);
  status.hidden = false;
  status.textContent = isJobApplication
    ? "Postulación enviada. Revisaremos tus datos y te contactaremos pronto."
    : (copy?.sent || (currentLang === "en" ? "Request sent. We will contact you soon." : "Solicitud enviada. Te contactaremos pronto."));
  if (window.history?.replaceState) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

function getFormValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function saveSession(data) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function logoutSession() {
  try { await apiFetch("/api/auth/logout", { method: "POST" }); } catch (_) {} finally { clearSession(); }
}

async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  let data = null;
  try { data = await response.json(); } catch (_) { data = null; }
  if (!response.ok) throw new Error(data?.detail || `Error API ${response.status}`);
  return data;
}

function normalizeServiceSlug(slug) {
  const map = { ops:"ops", legal:"legal", flota:"flota", fleet:"flota", intelligence:"intelligence", labs:"labs", lab:"labs", api:"api", custom:"labs", pdlju:"legal", automatizacion:"ops", datos:"intelligence", "web-saas":"labs", "integraciones-api":"api" };
  return map[slug] || slug;
}

function renderServices(services) {
  if (!Array.isArray(services) || services.length === 0) return;
  const normalizedServices = services.map((service) => ({ ...service, normalizedSlug: normalizeServiceSlug(service.slug) }));
  const primary = ["ops", "intelligence", "labs"];
  const selected = primary.map((slug) => normalizedServices.find((service) => service.normalizedSlug === slug)).filter(Boolean);
  const fallback = selected.length >= 3 ? selected : normalizedServices.slice(0, 3);
  const cards = Array.from(document.querySelectorAll(".business-card")).filter((card) => !card.dataset.staticCard);
  fallback.slice(0, cards.length).forEach((service, index) => {
    const card = cards[index];
    const title = card.querySelector("h3");
    const text = card.querySelector("p:not(.eyebrow)");
    const cta = card.querySelector("a.btn");
    if (title) title.textContent = service.name || title.textContent;
    if (text) text.textContent = service.full_description || service.short_description || service.summary || text.textContent;
    if (cta) cta.dataset.serviceSlug = service.normalizedSlug;
  });
  const interestSelect = document.getElementById("interest");
  if (interestSelect && !interestSelect.dataset.staticOptions) {
    interestSelect.innerHTML = "";
    normalizedServices.forEach((service) => {
      const option = document.createElement("option");
      option.value = service.normalizedSlug;
      option.textContent = service.name;
      interestSelect.appendChild(option);
    });
  }
}

function renderSiteSettings(settings) { if (!settings || typeof settings !== "object") return; }

async function loadSiteData() {
  try {
    const data = await apiFetch("/api/site");
    renderServices(data.services);
    renderSiteSettings(data.settings);
  } catch (error) {
    console.warn("No se pudo cargar contenido desde la API", error);
  }
}

function setupContactForms() { const form = document.querySelector(".contact-form"); if (!form) return; showReturnedFormStatus(); }

function renderCauses(causes) {
  const grid = document.getElementById("causes-grid");
  const status = document.getElementById("dashboard-status");
  if (!grid || !status) return;
  grid.innerHTML = "";
  if (!Array.isArray(causes) || causes.length === 0) { status.textContent = "No tienes causas asignadas."; status.className = "dashboard-status"; return; }
  status.textContent = `${causes.length} causa(s) cargada(s) desde la API.`;
  status.className = "dashboard-status dashboard-status-ok";
  causes.forEach((cause) => {
    const card = document.createElement("article");
    card.className = "cause-card";
    card.innerHTML = `<h3>${cause.code || "Causa"} · ${cause.title || "Sin titulo"}</h3><p>${cause.court || "Sin tribunal registrado"}</p><div class="cause-badges"><span>Estado: ${cause.status || cause.user_status || "active"}</span><span>ID: ${cause.id}</span></div>`;
    grid.appendChild(card);
  });
}

async function renderAdminUsers(user) {
  const grid = document.getElementById("admin-users-grid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!user || user.role !== "admin") return;
}

function showDashboard(user) {
  const loginCard = document.getElementById("login-card");
  const dashboardCard = document.getElementById("dashboard-card");
  const dashboardUser = document.getElementById("dashboard-user");
  if (loginCard) loginCard.hidden = true;
  if (dashboardCard) dashboardCard.hidden = false;
  if (dashboardUser) dashboardUser.textContent = `${user.full_name || user.name || "Usuario"} · ${user.email || ""} · rol: ${user.role || "client"}`;
}

function showLogin() {
  const loginCard = document.getElementById("login-card");
  const dashboardCard = document.getElementById("dashboard-card");
  if (loginCard) loginCard.hidden = false;
  if (dashboardCard) dashboardCard.hidden = true;
}

async function loadDashboard() {
  try {
    const mePayload = await apiFetch("/api/auth/me");
    const user = mePayload.user || mePayload;
    showDashboard(user);
    const causesPayload = await apiFetch("/api/causes");
    const causes = Array.isArray(causesPayload) ? causesPayload : (causesPayload.causes || []);
    renderCauses(causes);
    await renderAdminUsers(user);
  } catch (error) {
    clearSession();
    showLogin();
  }
}

function setupLogin() {
  const form = document.getElementById("login-form");
  const button = document.getElementById("login-button");
  const status = document.getElementById("login-status");
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) logoutButton.addEventListener("click", async () => { await logoutSession(); showLogin(); const grid = document.getElementById("causes-grid"); if (grid) grid.innerHTML = ""; });
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = getFormValue("login-email");
    const password = getFormValue("login-password");
    if (!email || !password) return;
    if (button) { button.disabled = true; button.textContent = "Entrando..."; }
    if (status) { status.hidden = false; status.textContent = "Validando usuario..."; status.className = "login-status"; }
    try {
      const data = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      saveSession(data);
      if (status) { status.textContent = "Ingreso correcto."; status.className = "login-status login-status-ok"; }
      await loadDashboard();
    } catch (error) {
      clearSession();
      if (status) { status.textContent = error.message || "No se pudo iniciar sesión."; status.className = "login-status login-status-error"; }
    } finally {
      if (button) { button.disabled = false; button.textContent = "Ingresar"; }
    }
  });
}

function loadStandardScript(src) { if (document.querySelector(`script[src="${src}"]`)) return; const script = document.createElement("script"); script.src = src; document.body.appendChild(script); }

setPreferredLanguage(detectInitialLanguage());
loadSiteData();
setupContactForms();
setupLogin();
loadDashboard();
loadStandardScript("header-standard.js");
loadStandardScript("footer-standard.js");
