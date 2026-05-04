const API_BASE_URL = (() => {
  if (window.AVIA_API_BASE_URL) return window.AVIA_API_BASE_URL.replace(/\/$/, "");
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "192.168.68.52") return "http://192.168.68.52:18000";
  return "https://api.aviarockets.cl";
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
  if (langToggle) langToggle.textContent = selected === "es" ? "EN" : "ES";
}

function detectInitialLanguage() {
  const saved = localStorage.getItem("avia-lang");
  if (saved === "es" || saved === "en") return saved;
  return navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
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
  const map = { pdlju: "pdlju", fleet: "fleet", custom: "custom", automatizacion: "custom", datos: "custom", "web-saas": "custom", "integraciones-api": "custom" };
  return map[slug] || slug;
}

function renderServices(services) {
  if (!Array.isArray(services) || services.length === 0) return;
  const primary = ["pdlju", "fleet", "custom"];
  const selected = primary.map((slug) => services.find((service) => service.slug === slug)).filter(Boolean);
  const fallback = selected.length >= 3 ? selected : services.slice(0, 3);
  const cards = document.querySelectorAll(".business-card");
  fallback.slice(0, cards.length).forEach((service, index) => {
    const card = cards[index];
    const title = card.querySelector("h3");
    const text = card.querySelector("p:not(.eyebrow)");
    const cta = card.querySelector("a.btn");
    if (title) title.textContent = service.name || title.textContent;
    if (text) text.textContent = service.full_description || service.short_description || text.textContent;
    if (cta) cta.dataset.serviceSlug = normalizeServiceSlug(service.slug);
  });
  const interestSelect = document.getElementById("interest");
  if (interestSelect) {
    interestSelect.innerHTML = "";
    fallback.forEach((service) => {
      const option = document.createElement("option");
      option.value = normalizeServiceSlug(service.slug);
      option.textContent = service.name;
      interestSelect.appendChild(option);
    });
  }
}

function renderSiteSettings(settings) {
  if (!settings || typeof settings !== "object") return;
  const contactMeta = document.querySelector(".contact-meta");
  if (!contactMeta) return;
  const email = settings.contact_email || "contact@aviarockets.com";
  const location = settings.base_location || "Santiago, Chile";
  const linkedin = settings.linkedin_label || "AVIA Rockets";
  contactMeta.innerHTML = `<p><strong>Email:</strong> ${email}</p><p><strong>Base:</strong> ${location}</p><p><strong>LinkedIn:</strong> ${linkedin}</p>`;
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

function validateContactPayload(payload) {
  if (payload.name.length < 2) return "Ingresa un nombre válido.";
  if (!payload.email.includes("@") || payload.email.length < 5) return "Ingresa un correo válido.";
  if (payload.message.length < 5) return "Escribe un mensaje un poco más completo.";
  return null;
}

function setupContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;
  const button = form.querySelector("button");
  const status = createStatus(form, ".form-status", "form-status");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = {
      name: getFormValue("name"),
      email: getFormValue("email"),
      phone: getFormValue("phone") || null,
      company: getFormValue("company") || null,
      service_interest: getFormValue("interest") || null,
      preferred_language: getFormValue("language") || document.documentElement.lang || "es",
      message: getFormValue("message")
    };
    const validationError = validateContactPayload(payload);
    if (validationError) {
      status.textContent = validationError;
      status.className = "form-status form-status-error";
      return;
    }
    button.disabled = true;
    button.textContent = "Enviando...";
    status.hidden = false;
    status.textContent = "Enviando solicitud...";
    status.className = "form-status";
    try {
      await apiFetch("/api/contact", { method: "POST", body: JSON.stringify(payload) });
      status.textContent = "Solicitud enviada. Te contactaremos pronto.";
      status.className = "form-status form-status-ok";
      form.reset();
    } catch (error) {
      status.textContent = error.message || "No se pudo enviar.";
      status.className = "form-status form-status-error";
    } finally {
      button.disabled = false;
      button.textContent = "Solicitar contacto";
    }
  });
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
    logoutButton.addEventListener("click", () => {
      clearSession();
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

setPreferredLanguage(detectInitialLanguage());
loadSiteData();
setupContactForm();
setupLogin();
if (getToken()) loadDashboard();
