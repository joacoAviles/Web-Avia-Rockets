const heroText = {
  es: {
    navLines: "Líneas de negocio", navProcess: "Cómo trabajamos", navLogin: "Login clientes", navContact: "Contacto", navEnter: "Entrar",
    heroPill: "Sistema operativo conectado", heroTag: "Control, automatización y desarrollo digital", heroTitle: "Sistemas que ordenan operación, datos y seguimiento", heroText: "Tres líneas de trabajo: revisión automática de personas, gestión de flotas y desarrollo de soluciones a medida.", heroPrimary: "Entrar al dashboard", heroSecondary: "Agendar demo",
    metricLogin: "Login con base de datos", metricCauses: "Causas asignadas", metricControl: "Control por usuario",
    line1Tab: "Personas", line2Tab: "Flotas", line3Tab: "Soluciones",
    slide1Small: "Personas y causas", slide2Small: "Revisiones y vencimientos", slide3Small: "Integraciones y operación",
    kpiReviewed: "Revisadas", kpiChanges: "Con cambios", kpiNew: "Nuevas", kpiErrors: "Errores",
    slide1Title: "Causas, estados y usuarios asignados desde PostgreSQL", case1Small: "Nuevo escrito registrado", case2Small: "Folio principal actualizado", case3Small: "Primera revisión guardada",
    statusChange: "Cambio", statusChange2: "Cambio", statusNew: "Nueva", activity: "Actividad",
    fleetActive: "Activos", fleetDue: "Por vencer", fleetOk: "Al día", fleetAlerts: "Alertas", slide2Title: "Estado de flota centralizado", slide3Title: "Desarrollo personalizado de integraciones", deployment: "Deploy"
  },
  en: {
    navLines: "Business lines", navProcess: "How we work", navLogin: "Client login", navContact: "Contact", navEnter: "Enter",
    heroPill: "Connected operating system", heroTag: "Control, automation and digital development", heroTitle: "Systems that organize operations, data and tracking", heroText: "Three work lines: automated people review, fleet management and custom solution development.", heroPrimary: "Enter dashboard", heroSecondary: "Schedule demo",
    metricLogin: "Database login", metricCauses: "Assigned cases", metricControl: "User-level control",
    line1Tab: "People", line2Tab: "Fleets", line3Tab: "Solutions",
    slide1Small: "People and cases", slide2Small: "Inspections and due dates", slide3Small: "Integrations and operations",
    kpiReviewed: "Reviewed", kpiChanges: "Changed", kpiNew: "New", kpiErrors: "Errors",
    slide1Title: "Cases, statuses and assigned users from PostgreSQL", case1Small: "New filing registered", case2Small: "Main folio updated", case3Small: "First review saved",
    statusChange: "Change", statusChange2: "Change", statusNew: "New", activity: "Activity",
    fleetActive: "Active", fleetDue: "Due soon", fleetOk: "Up to date", fleetAlerts: "Alerts", slide2Title: "Centralized fleet status", slide3Title: "Custom integration development", deployment: "Deploy"
  }
};

function applyHeroLanguage(lang) {
  const selected = lang === "en" ? "en" : "es";
  const dictionary = heroText[selected];
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (dictionary[key]) node.textContent = dictionary[key];
  });
  document.documentElement.lang = selected;
  localStorage.setItem("avia-lang", selected);
  if (langToggle) langToggle.textContent = selected === "es" ? "EN" : "ES";
  const languageSelect = document.getElementById("language");
  if (languageSelect) languageSelect.value = selected;
}

let heroIndex = 0;
let heroTimer;
function showHeroSlide(index) {
  const slides = document.querySelectorAll("[data-slide-panel]");
  const tabs = document.querySelectorAll("[data-slide]");
  if (!slides.length) return;
  heroIndex = (index + slides.length) % slides.length;
  slides.forEach((slide, i) => slide.classList.toggle("is-active", i === heroIndex));
  tabs.forEach((tab, i) => tab.classList.toggle("is-active", i === heroIndex));
}
function startHeroTimer() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => showHeroSlide(heroIndex + 1), 6200);
}
function setupHero() {
  document.querySelectorAll("[data-slide]").forEach((tab) => {
    tab.addEventListener("click", () => { showHeroSlide(Number(tab.dataset.slide || 0)); startHeroTimer(); });
  });
  const prev = document.querySelector("[data-carousel-prev]");
  const next = document.querySelector("[data-carousel-next]");
  if (prev) prev.addEventListener("click", () => { showHeroSlide(heroIndex - 1); startHeroTimer(); });
  if (next) next.addEventListener("click", () => { showHeroSlide(heroIndex + 1); startHeroTimer(); });
  const carousel = document.getElementById("hero-carousel");
  if (carousel) {
    carousel.addEventListener("mouseenter", () => clearInterval(heroTimer));
    carousel.addEventListener("mouseleave", startHeroTimer);
  }
  showHeroSlide(0);
  startHeroTimer();
}

if (langToggle) {
  langToggle.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    applyHeroLanguage(document.documentElement.lang === "es" ? "en" : "es");
  }, true);
}

applyHeroLanguage(localStorage.getItem("avia-lang") || document.documentElement.lang || "es");
setupHero();
