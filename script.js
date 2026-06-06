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

const CONTACT_I18N = {
  es: {
    eyebrow: "Contacto",
    title: "Cuéntanos qué operación quieres ordenar",
    intro: "Cuéntanos qué estás revisando manualmente hoy. Te diremos si conviene resolverlo con alertas, panel, API o automatización.",
    meta: [
      ["Legal:", " revisión de causas, detección de cambios y correos resumen."],
      ["Flota:", " control de revisión técnica, mantenciones, vencimientos y prioridades."],
      ["Datos / API / Lab:", " dashboards, conectores, integraciones y apps internas."]
    ],
    name: "Nombre",
    email: "Correo",
    interest: "Qué necesitas ordenar",
    details: "Cuéntanos un poco más ",
    optional: "(opcional)",
    placeholder: "Ej: tengo 80 causas y quiero recibir un resumen diario sólo cuando haya cambios.",
    message: "Cuéntanos en qué podemos ayudarte?",
    submit: "Enviar solicitud",
    options: [
      ["legal", "Causas y seguimiento legal"],
      ["flota", "Flota, vencimientos y mantencion"],
      ["intelligence", "Datos, dashboard o reportes"],
      ["api", "API, conectores o integraciones"],
      ["lab", "App interna o automatizacion a medida"],
      ["no-se", "No se, necesito orientacion"]
    ],
    sent: "Solicitud enviada. Te contactaremos pronto."
  },
  en: {
    eyebrow: "Contact",
    title: "Tell us what operation you want to organize",
    intro: "Tell us what you are reviewing manually today. We will tell you whether it should be solved with alerts, a dashboard, an API, or automation.",
    meta: [
      ["Legal:", " case review, change detection, and summary emails."],
      ["Fleet:", " technical inspection tracking, maintenance, expirations, and priorities."],
      ["Data / API / Lab:", " dashboards, connectors, integrations, and internal apps."]
    ],
    name: "Name",
    email: "Email",
    interest: "What do you need to organize?",
    details: "Tell us a little more ",
    optional: "(optional)",
    placeholder: "Example: I have 80 cases and want to receive a daily summary only when there are changes.",
    message: "How can we help you?",
    submit: "Send request",
    options: [
      ["legal", "Legal case tracking"],
      ["flota", "Fleet, expirations, and maintenance"],
      ["intelligence", "Data, dashboards, or reports"],
      ["api", "APIs, connectors, or integrations"],
      ["lab", "Internal app or custom automation"],
      ["no-se", "I am not sure; I need guidance"]
    ],
    sent: "Request sent. We will contact you soon."
  }
};

function setPreferredLanguage(lang) {
  const selected = lang === "en" ? "en" : "es";
  document.documentElement.lang = selected;
  localStorage.setItem("avia-lang", selected);
  const languageSelect = document.getElementById("language");
  if (languageSelect) languageSelect.value = selected;
  if (langToggle) langToggle.textContent = selected === "es" ? "EN" : "ES";
  applyContactTranslations(selected);
}

function detectInitialLanguage() {
  const saved = localStorage.getItem("avia-lang");
  if (saved === "es" || saved === "en") return saved;
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
}

function setText(node, text) {
  if (node) node.textContent = text;
}

function applyContactTranslations(lang) {
  const copy = CONTACT_I18N[lang] || CONTACT_I18N.es;
  const contact = document.getElementById("contact");
  if (!contact) return;

  setText(contact.querySelector(".eyebrow"), copy.eyebrow);
  setText(contact.querySelector(".section-heading h2"), copy.title);

  const intro = contact.querySelector(".section-heading > p:not(.eyebrow)");
  setText(intro, copy.intro);

  const metaItems = contact.querySelectorAll(".contact-meta p");
  copy.meta.forEach((item, index) => {
    const row = metaItems[index];
    if (!row) return;
    row.innerHTML = `<strong>${item[0]}</strong>${item[1]}`;
  });

  setText(contact.querySelector('label[for="home-name"]'), copy.name);
  setText(contact.querySelector('label[for="home-email"]'), copy.email);
  setText(contact.querySelector('label[for="home-interest"]'), copy.interest);

  const detailsLabel = contact.querySelector('label[for="home-message"]');
  if (detailsLabel) {
    detailsLabel.innerHTML = `${copy.details}<span style="color:var(--muted);font-weight:600">${copy.optional}</span>`;
  }

  const textarea = document.getElementById("home-message");
  if (textarea) {
    const allDefaultMessages = [CONTACT_I18N.es.message, CONTACT_I18N.en.message, "Contacto rápido desde home: solicita evaluación inicial."];
    if (allDefaultMessages.includes(textarea.value.trim())) {
      textarea.value = copy.message;
    }
    textarea.placeholder = copy.placeholder;
  }

  const select = document.getElementById("home-interest");
  if (select) {
    const selectedValue = select.value;
    select.innerHTML = "";
    copy.options.forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      select.appendChild(option);
    });
    if (selectedValue) select.value = selectedValue;
  }

  const submit = contact.querySelector('button[type="submit"]');
  setText(submit, copy.submit);
}

if (langToggle) langToggle.addEventListener("click", () => setPreferredLanguage(document.documentElement.lang === "es" ? "en" : "es"));

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
  status.hidden = false;
  status.textContent = isJobApplication
    ? "Postulación enviada. Revisaremos tus datos y te contactaremos pronto."
    : CONTACT_I18N[currentLang].sent;
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
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch (_) {
  } finally {
    clearSession();
  }
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
  if (!response.ok) {
    const message = data?.detail || `Error API ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function normalizeServiceSlug(slug) {
  const map = {
    ops: "ops",
    legal: "legal",
    flota: "flota",
    fleet: "flota",
    intelligence: "intelligence",
    labs: "labs",
    lab: "labs",
    api: "api",
    custom: "labs",
    pdlju: "legal",
    automatizacion: "ops",
    datos: "intelligence",
    "web-saas": "labs",
    "integraciones-api": "api"
  };
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
    if (text) text.textContent = service.full_description || service.short_description || text.textContent;
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

function renderSiteSettings(settings) {
  if (!settings || typeof settings !== "object") return;
}

async function loadSiteData() {
  try {
    const data = await apiFetch("/api/site");
    renderServices(data.services);
    renderSiteSettings(data.settings);
  } catch (error) {
    console.warn("No se pudo cargar contenido desde la base de datos", error);
  }
}

function setupContactForms() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  showReturnedFormStatus();
}

function renderCauses(causes) {
  const grid = document.getElementById("causes-grid");
  const status = document.getElementById("dashboard-status");
  if (!grid || !status) return;
  grid.innerHTML = "";
  if (!Array.isArray(causes) || causes.length === 0) {
    status.textContent = "No tienes causas asignadas.";
    status.className = "dashboard-status";
    return;
  }
  status.textContent = `${causes.length} causa(s) cargada(s) desde la base de datos.`;
  status.className = "dashboard-status dashboard-status-ok";
  causes.forEach((cause) => {
    const card = document.createElement("article");
    card.className = "cause-card";
    card.innerHTML = `<h3>${cause.code} · ${cause.title}</h3><p>${cause.court || "Sin tribunal registrado"}</p><div class="cause-badges"><span>Estado: ${cause.status}</span><span>Usuarios asignados: ${cause.assigned_users_count}</span><span>ID: ${cause.id}</span></div>`;
    grid.appendChild(card);
  });
}

async function renderAdminUsers(user) {
  const grid = document.getElementById("admin-users-grid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!user || user.role !== "admin") return;
  try {
    const users = await apiFetch("/api/admin/users");
    const title = document.createElement("h3");
    title.textContent = "Usuarios registrados";
    grid.appendChild(title);
    users.forEach((item) => {
      const card = document.createElement("article");
      card.className = "user-card";
      card.innerHTML = `<h3>${item.full_name}</h3><p>${item.email}</p><div class="cause-badges"><span>Rol: ${item.role}</span><span>${item.is_active ? "Activo" : "Inactivo"}</span><span>ID: ${item.id}</span></div>`;
      grid.appendChild(card);
    });
  } catch (error) {
    const card = document.createElement("p");
    card.className = "dashboard-status dashboard-status-error";
    card.textContent = error.message;
    grid.appendChild(card);
  }
}

function showDashboard(user) {
  const loginCard = document.getElementById("login-card");
  const dashboardCard = document.getElementById("dashboard-card");
  const dashboardUser = document.getElementById("dashboard-user");
  if (loginCard) loginCard.hidden = true;
  if (dashboardCard) dashboardCard.hidden = false;
  if (dashboardUser) dashboardUser.textContent = `${user.full_name} · ${user.email} · rol: ${user.role}`;
}

function showLogin() {
  const loginCard = document.getElementById("login-card");
  const dashboardCard = document.getElementById("dashboard-card");
  if (loginCard) loginCard.hidden = false;
  if (dashboardCard) dashboardCard.hidden = true;
}

async function loadDashboard() {
  try {
    const user = await apiFetch("/api/auth/me");
    showDashboard(user);
    const causes = await apiFetch("/api/causes");
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

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await logoutSession();
      showLogin();
      const grid = document.getElementById("causes-grid");
      if (grid) grid.innerHTML = "";
    });
  }

  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = getFormValue("login-email");
    const password = getFormValue("login-password");
    if (!email || !password) return;

    if (button) {
      button.disabled = true;
      button.textContent = "Entrando...";
    }
    if (status) {
      status.hidden = false;
      status.textContent = "Validando usuario...";
      status.className = "login-status";
    }

    try {
      const data = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      saveSession(data);
      if (status) {
        status.textContent = "Ingreso correcto.";
        status.className = "login-status login-status-ok";
      }
      await loadDashboard();
    } catch (error) {
      clearSession();
      if (status) {
        status.textContent = error.message || "No se pudo iniciar sesión.";
        status.className = "login-status login-status-error";
      }
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Ingresar";
      }
    }
  });
}

function loadStandardScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement("script");
  script.src = src;
  document.body.appendChild(script);
}

setPreferredLanguage(detectInitialLanguage());
loadSiteData();
setupContactForms();
setupLogin();
if (getToken()) loadDashboard();
loadStandardScript("header-standard.js");
loadStandardScript("footer-standard.js");
