const heroText = {
  es: {
    navLines: "Líneas de negocio", navProcess: "Cómo trabajamos", navLogin: "Login clientes", navContact: "Contacto", navEnter: "Entrar",
    heroPill: "Suite de productos Avia Rockets", heroTag: "Avia OPS · Avia Intelligence · Avia Labs", heroTitle: "Dashboards vivos para vender, operar y decidir mejor", heroText: "Una landing pensada para clientes: tres productos, tres dashboards claros y beneficios visibles desde el primer pantallazo.", heroPrimary: "Ver productos", heroSecondary: "Agendar demo",
    metricLogin: "Menos trabajo manual", metricCauses: "Más visibilidad", metricControl: "Mejor decisión",
    line1Tab: "Avia OPS", line2Tab: "Avia Intelligence", line3Tab: "Avia Labs",
    slide1Small: "Automatización operacional", slide2Small: "Riesgo y datos", slide3Small: "APIs y apps",
    kpiReviewed: "Ahorro", kpiChanges: "Alertas", kpiNew: "Flujos", kpiErrors: "Control",
    slide1Title: "Automatiza seguimiento, alertas y reportes diarios sin perseguir planillas", case1Small: "Tareas repetitivas automatizadas", case2Small: "Alertas listas para revisar", case3Small: "Reporte ejecutivo generado",
    statusChange: "Activo", statusChange2: "Listo", statusNew: "Nuevo", activity: "Beneficio",
    fleetActive: "Fuentes", fleetDue: "Riesgos", fleetOk: "Modelos", fleetAlerts: "Alertas", slide2Title: "Convierte datos dispersos en señales simples para decidir", slide3Title: "Construye APIs, apps y paneles conectados a tu operación", deployment: "Entrega"
  },
  en: {
    navLines: "Business lines", navProcess: "How we work", navLogin: "Client login", navContact: "Contact", navEnter: "Enter",
    heroPill: "Avia Rockets product suite", heroTag: "Avia OPS · Avia Intelligence · Avia Labs", heroTitle: "Live dashboards to sell, operate and decide better", heroText: "A client-facing landing: three products, three clear dashboards and visible benefits from the first screen.", heroPrimary: "View products", heroSecondary: "Schedule demo",
    metricLogin: "Less manual work", metricCauses: "More visibility", metricControl: "Better decisions",
    line1Tab: "Avia OPS", line2Tab: "Avia Intelligence", line3Tab: "Avia Labs",
    slide1Small: "Operational automation", slide2Small: "Risk and data", slide3Small: "APIs and apps",
    kpiReviewed: "Savings", kpiChanges: "Alerts", kpiNew: "Flows", kpiErrors: "Control",
    slide1Title: "Automate tracking, alerts and daily reports without chasing spreadsheets", case1Small: "Repetitive tasks automated", case2Small: "Alerts ready to review", case3Small: "Executive report generated",
    statusChange: "Active", statusChange2: "Ready", statusNew: "New", activity: "Benefit",
    fleetActive: "Sources", fleetDue: "Risks", fleetOk: "Models", fleetAlerts: "Alerts", slide2Title: "Turn scattered data into simple signals for decisions", slide3Title: "Build APIs, apps and panels connected to your operation", deployment: "Delivery"
  }
};

const businessCopy = {
  es: {
    headingEyebrow: "Líneas de negocio",
    headingTitle: "Avia OPS, Avia Intelligence y Avia Labs",
    headingText: "Tres productos claros para mostrar valor a clientes finales: automatización operacional, inteligencia de riesgo y desarrollo digital.",
    cards: [
      { title: "Avia OPS", text: "Automatización operacional para reducir trabajo manual, ordenar flujos, generar alertas y entregar reportes diarios con lectura simple.", items: ["Menos trabajo repetitivo", "Alertas y seguimiento", "Reportes para clientes"], cta: "Ver OPS", href: "ops.html" },
      { title: "Avia Intelligence", text: "Riesgo y datos transformados en señales visuales para priorizar decisiones sin perderse en tablas, planillas o información dispersa.", items: ["Riesgo y datos", "Señales claras", "Dashboards ejecutivos"], cta: "Ver inteligencia", href: "avia-intelligence.html" },
      { title: "Avia Labs", text: "APIs, apps y paneles a medida para crear productos digitales conectados a la operación real del negocio.", items: ["APIs e integraciones", "Apps internas", "Productos digitales"], cta: "Construir solución", href: "avia-labs.html" }
    ],
    trust: ["Menos trabajo manual", "Dashboards claros", "Riesgo visible", "Productos digitales", "Experiencia premium"],
    contactText: "Escríbenos si necesitas automatizar operación, ordenar datos de riesgo o construir un producto digital para tus clientes.",
    interests: ["Avia OPS", "Avia Intelligence", "Avia Labs"]
  },
  en: {
    headingEyebrow: "Business lines",
    headingTitle: "Avia OPS, Avia Intelligence and Avia Labs",
    headingText: "Three clear products to show value to end clients: operational automation, risk intelligence and digital development.",
    cards: [
      { title: "Avia OPS", text: "Operational automation to reduce manual work, organize flows, generate alerts and deliver daily reports with simple reading.", items: ["Less repetitive work", "Alerts and tracking", "Client-ready reports"], cta: "View OPS", href: "ops.html" },
      { title: "Avia Intelligence", text: "Risk and data turned into visual signals to prioritize decisions without getting lost in tables, spreadsheets or scattered information.", items: ["Risk and data", "Clear signals", "Executive dashboards"], cta: "View intelligence", href: "avia-intelligence.html" },
      { title: "Avia Labs", text: "Custom APIs, apps and panels to create digital products connected to the business’s real operation.", items: ["APIs and integrations", "Internal apps", "Digital products"], cta: "Build solution", href: "avia-labs.html" }
    ],
    trust: ["Less manual work", "Clear dashboards", "Visible risk", "Digital products", "Premium experience"],
    contactText: "Write to us if you need to automate operations, organize risk data or build a digital product for your clients.",
    interests: ["Avia OPS", "Avia Intelligence", "Avia Labs"]
  }
};

function applyHeroMarketingCopy(lang) {
  const selected = lang === "en" ? "en" : "es";
  const slideCopy = {
    es: [
      { title: "AVIA OPS", left: ["65%", "menos tareas manuales"], right: ["Reportes", "listos para cliente"] },
      { title: "AVIA INTELLIGENCE", left: ["Riesgo", "visible en segundos"], right: ["Decisión", "con señales claras"] },
      { title: "AVIA LABS", left: ["API", "producto conectado"], right: ["App", "lista para operar"] }
    ],
    en: [
      { title: "AVIA OPS", left: ["65%", "less manual work"], right: ["Reports", "client-ready"] },
      { title: "AVIA INTELLIGENCE", left: ["Risk", "visible in seconds"], right: ["Decision", "with clear signals"] },
      { title: "AVIA LABS", left: ["API", "connected product"], right: ["App", "ready to operate"] }
    ]
  }[selected];
  document.querySelectorAll("[data-slide-panel]").forEach((slide, index) => {
    const copy = slideCopy[index];
    if (!copy) return;
    const title = slide.querySelector(".dash-titlebar strong");
    const leftStrong = slide.querySelector(".hero-float-card.left strong");
    const leftSmall = slide.querySelector(".hero-float-card.left small");
    const rightStrong = slide.querySelector(".hero-float-card.right strong");
    const rightSmall = slide.querySelector(".hero-float-card.right small");
    if (title) title.textContent = copy.title;
    if (leftStrong) leftStrong.textContent = copy.left[0];
    if (leftSmall) leftSmall.textContent = copy.left[1];
    if (rightStrong) rightStrong.textContent = copy.right[0];
    if (rightSmall) rightSmall.textContent = copy.right[1];
  });
  const firstCaseTitles = document.querySelectorAll(".hero-slide:first-child .case-row strong");
  if (firstCaseTitles[0]) firstCaseTitles[0].textContent = selected === "en" ? "Automated workflow" : "Flujo automatizado";
  if (firstCaseTitles[1]) firstCaseTitles[1].textContent = selected === "en" ? "Smart alert" : "Alerta inteligente";
  if (firstCaseTitles[2]) firstCaseTitles[2].textContent = selected === "en" ? "Client report" : "Reporte para cliente";
}

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
  applyHeroMarketingCopy(selected);
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
