const API_BASE_URL = (() => {
  if (window.AVIA_API_BASE_URL) return window.AVIA_API_BASE_URL.replace(/\/$/, "");

  const host = window.location.hostname;

  if (host === "localhost" || host === "127.0.0.1" || host === "192.168.68.52") {
    return "http://192.168.68.52:18000";
  }

  return "https://api.aviarockets.cl";
})();

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

if (langToggle) {
  langToggle.addEventListener("click", () => {
    const next = document.documentElement.lang === "es" ? "en" : "es";
    setPreferredLanguage(next);
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
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );

  revealNodes.forEach((node) => revealObserver.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add("is-visible"));
}

function normalizeServiceSlug(slug) {
  const map = {
    pdlju: "pdlju",
    fleet: "fleet",
    custom: "custom",
    automatizacion: "custom",
    datos: "custom",
    "web-saas": "custom",
    "integraciones-api": "custom"
  };
  return map[slug] || slug;
}

function renderServices(services) {
  if (!Array.isArray(services) || services.length === 0) return;

  const primary = ["pdlju", "fleet", "custom"];
  const selected = primary
    .map((slug) => services.find((service) => service.slug === slug))
    .filter(Boolean);

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

  contactMeta.innerHTML = `
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Base:</strong> ${location}</p>
    <p><strong>LinkedIn:</strong> ${linkedin}</p>
  `;
}

async function loadSiteData() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/site`, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error(`API status ${response.status}`);

    const data = await response.json();
    renderServices(data.services);
    renderSiteSettings(data.settings);
  } catch (error) {
    console.warn("No se pudo cargar contenido desde la base de datos", error);
  }
}

function createFormStatus(form) {
  let status = form.querySelector(".form-status");
  if (!status) {
    status = document.createElement("p");
    status.className = "form-status";
    status.setAttribute("aria-live", "polite");
    form.appendChild(status);
  }
  return status;
}

function getFormValue(id) {
  const element = document.getElementById(id);
  return element ? element.value.trim() : "";
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
  const status = createFormStatus(form);

  async function sendContactMessage(event) {
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

    if (button) {
      button.disabled = true;
      button.textContent = "Enviando...";
    }

    status.textContent = "Enviando solicitud...";
    status.className = "form-status";

    try {
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`API status ${response.status}`);

      await response.json();
      status.textContent = "Solicitud enviada. Te contactaremos pronto.";
      status.className = "form-status form-status-ok";
      form.reset();
      setPreferredLanguage(document.documentElement.lang || "es");
    } catch (error) {
      console.error("Error enviando contacto", error);
      status.textContent = "No se pudo enviar. Revisa la conexión con la API e intenta nuevamente.";
      status.className = "form-status form-status-error";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Solicitar contacto";
      }
    }
  }

  form.addEventListener("submit", sendContactMessage);
  if (button) button.addEventListener("click", sendContactMessage);
}

setPreferredLanguage(detectInitialLanguage());
loadSiteData();
setupContactForm();
