const heroText = {
  es: {
    navLines: "Líneas de negocio", navProcess: "Cómo trabajamos", navLogin: "Login clientes", navContact: "Contacto", navEnter: "Entrar",
    heroPill: "Sistema operativo conectado", heroTag: "Avia OPS · Avia Intelligence · Avia Labs", heroTitle: "Tres líneas para ordenar operación, riesgo y desarrollo digital", heroText: "Avia OPS automatiza la operación. Avia Intelligence convierte riesgo y datos en decisión. Avia Labs construye APIs y apps a medida.", heroPrimary: "Entrar al dashboard", heroSecondary: "Agendar demo",
    metricLogin: "Automatización operacional", metricCauses: "Riesgo y datos", metricControl: "APIs y apps",
    line1Tab: "Avia OPS", line2Tab: "Avia Intelligence", line3Tab: "Avia Labs",
    slide1Small: "Automatización operacional", slide2Small: "Riesgo y datos", slide3Small: "APIs y apps",
    kpiReviewed: "Procesos", kpiChanges: "Alertas", kpiNew: "Flujos", kpiErrors: "Errores",
    slide1Title: "Flujos, estados y usuarios operando desde una base conectada", case1Small: "Nuevo evento operacional", case2Small: "Proceso actualizado", case3Small: "Primera ejecución guardada",
    statusChange: "Cambio", statusChange2: "Cambio", statusNew: "Nuevo", activity: "Actividad",
    fleetActive: "Fuentes", fleetDue: "Riesgos", fleetOk: "Modelos", fleetAlerts: "Alertas", slide2Title: "Riesgo, datos y señales accionables", slide3Title: "Desarrollo personalizado de APIs, apps e integraciones", deployment: "Deploy"
  },
  en: {
    navLines: "Business lines", navProcess: "How we work", navLogin: "Client login", navContact: "Contact", navEnter: "Enter",
    heroPill: "Connected operating system", heroTag: "Avia OPS · Avia Intelligence · Avia Labs", heroTitle: "Three lines to organize operations, risk and digital development", heroText: "Avia OPS automates operations. Avia Intelligence turns risk and data into decisions. Avia Labs builds custom APIs and apps.", heroPrimary: "Enter dashboard", heroSecondary: "Schedule demo",
    metricLogin: "Operational automation", metricCauses: "Risk and data", metricControl: "APIs and apps",
    line1Tab: "Avia OPS", line2Tab: "Avia Intelligence", line3Tab: "Avia Labs",
    slide1Small: "Operational automation", slide2Small: "Risk and data", slide3Small: "APIs and apps",
    kpiReviewed: "Processes", kpiChanges: "Alerts", kpiNew: "Flows", kpiErrors: "Errors",
    slide1Title: "Flows, statuses and users operating from a connected database", case1Small: "New operational event", case2Small: "Updated process", case3Small: "First run saved",
    statusChange: "Change", statusChange2: "Change", statusNew: "New", activity: "Activity",
    fleetActive: "Sources", fleetDue: "Risks", fleetOk: "Models", fleetAlerts: "Alerts", slide2Title: "Risk, data and actionable signals", slide3Title: "Custom API, app and integration development", deployment: "Deploy"
  }
};

const businessCopy = {
  es: {
    headingEyebrow: "Líneas de negocio",
    headingTitle: "Avia OPS, Avia Intelligence y Avia Labs",
    headingText: "Tres líneas claras: automatización operacional, riesgo y datos, y desarrollo de APIs y apps.",
    cards: [
      { title: "Avia OPS", text: "Automatización operacional para ordenar flujos, seguimiento, alertas, tareas repetitivas y control diario de procesos.", items: ["Automatización operacional", "Flujos, alertas y seguimiento", "Control por usuario y proceso"], cta: "Ver OPS", href: "ops.html" },
      { title: "Avia Intelligence", text: "Riesgo y datos para transformar información dispersa en señales, reportes, tableros y criterios de decisión accionables.", items: ["Riesgo y datos", "Reportes y tableros", "Señales accionables"], cta: "Ver inteligencia", href: "avia-intelligence.html" },
      { title: "Avia Labs", text: "APIs, apps e integraciones a medida para construir herramientas digitales conectadas a la operación real del cliente.", items: ["APIs e integraciones", "Apps y sistemas propios", "Desarrollo a medida"], cta: "Construir solución", href: "avia-labs.html" }
    ],
    trust: ["Automatización operacional", "Riesgo y datos", "APIs y apps", "Visibilidad ejecutiva", "Criterio técnico"],
    contactText: "Escríbenos si necesitas automatización operacional, inteligencia de riesgo y datos, o desarrollo de APIs y apps a medida.",
    interests: ["Avia OPS", "Avia Intelligence", "Avia Labs"]
  },
  en: {
    headingEyebrow: "Business lines",
    headingTitle: "Avia OPS, Avia Intelligence and Avia Labs",
    headingText: "Three clear lines: operational automation, risk and data, and API and app development.",
    cards: [
      { title: "Avia OPS", text: "Operational automation to organize workflows, tracking, alerts, repetitive tasks and daily process control.", items: ["Operational automation", "Workflows, alerts and tracking", "User and process control"], cta: "View OPS", href: "ops.html" },
      { title: "Avia Intelligence", text: "Risk and data to turn scattered information into signals, reports, dashboards and actionable decision criteria.", items: ["Risk and data", "Reports and dashboards", "Actionable signals"], cta: "View intelligence", href: "avia-intelligence.html" },
      { title: "Avia Labs", text: "Custom APIs, apps and integrations to build digital tools connected to the client’s real operation.", items: ["APIs and integrations", "Custom apps and systems", "Tailored development"], cta: "Build solution", href: "avia-labs.html" }
    ],
    trust: ["Operational automation", "Risk and data", "APIs and apps", "Executive visibility", "Technical judgment"],
    contactText: "Write to us if you need operational automation, risk and data intelligence, or custom API and app development.",
    interests: ["Avia OPS", "Avia Intelligence", "Avia Labs"]
  }
};

function applyBusinessCopy(lang) {
  const selected = lang === "en" ? "en" : "es";
  const copy = businessCopy[selected];
  const businessSection = document.querySelector("#business-lines");
  if (businessSection) {
    const eyebrow = businessSection.querySelector(".section-heading .eyebrow");
    const title = businessSection.querySelector(".section-heading h2");
    const text = businessSection.querySelector(".section-heading p:last-child");
    if (eyebrow) eyebrow.textContent = copy.headingEyebrow;
    if (title) title.textContent = copy.headingTitle;
    if (text) text.textContent = copy.headingText;
    businessSection.querySelectorAll(".business-card").forEach((card, index) => {
      const item = copy.cards[index];
      if (!item) return;
      const h3 = card.querySelector("h3");
      const p = card.querySelector("p:not(.eyebrow)");
      const ul = card.querySelector("ul");
      const cta = card.querySelector("a.btn");
      if (h3) h3.textContent = item.title;
      if (p) p.textContent = item.text;
      if (ul) ul.innerHTML = item.items.map((line) => `<li>${line}</li>`).join("");
      if (cta) { cta.textContent = item.cta; cta.href = item.href; }
    });
  }
  document.querySelectorAll(".trust-item").forEach((item, index) => { if (copy.trust[index]) item.textContent = copy.trust[index]; });
  const contactText = document.querySelector("#contact .section-heading > p:not(.eyebrow)");
  if (contactText) contactText.textContent = copy.contactText;
  const interest = document.getElementById("interest");
  if (interest) interest.innerHTML = copy.interests.map((label, index) => `<option value="line-${index + 1}">${label}</option>`).join("");
}

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
  applyBusinessCopy(selected);
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
    tab.addEventListener("dblclick", () => {
      const index = Number(tab.dataset.slide || 0);
      if (index === 0) window.location.href = "ops.html";
      if (index === 1) window.location.href = "avia-intelligence.html";
      if (index === 2) window.location.href = "avia-labs.html";
    });
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

const initialLang = localStorage.getItem("avia-lang") || document.documentElement.lang || "es";
applyHeroLanguage(initialLang);
setTimeout(() => applyHeroLanguage(document.documentElement.lang), 700);
setupHero();
