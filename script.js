const translations = {
  es: {
    navPricing: "Precios",
    navDemo: "Ver demo",
    heroTag: "Para corredoras de seguros en Chile",
    heroTitle: "Automatiza cobranza y reportes para corredoras en Chile en minutos",
    heroText: "Detecta deudas pendientes, envía recordatorios automáticos y genera reportes ejecutivos sin planillas manuales.",
    heroPrimary: "Probar gratis",
    heroSecondary: "Ver demo",
    featureTag: "Funcionalidades clave",
    featureTitle: "Todo lo que tu equipo necesita para cobrar antes y reportar mejor",
    f1Title: "Detecta deudores automáticamente",
    f1Text: "Prioriza a quién cobrar hoy con alertas automáticas por vencimiento y riesgo.",
    f2Title: "Genera informes en 1 click",
    f2Text: "Entrega reportes claros para gerencia en minutos, no en horas.",
    f3Title: "Integra con Excel y APIs",
    f3Text: "Conecta tu operación actual sin romper procesos ni cambiar todo tu stack.",
    f4Title: "Automatiza seguimiento de cobranza",
    f4Text: "Programa correos y recordatorios por cartera para reducir morosidad mes a mes.",
    pricingTag: "Pricing",
    pricingTitle: "Planes claros, sin letras chicas",
    perMonth: "/ mes",
    popular: "Más elegido",
    p1Title: "Starter",
    p1f1: "Hasta 1.000 pólizas",
    p1f2: "Recordatorios automáticos",
    p1f3: "Reporte mensual",
    p2Title: "Growth",
    p2f1: "Hasta 5.000 pólizas",
    p2f2: "Dashboards en tiempo real",
    p2f3: "Exportación Excel + API",
    p3Title: "Scale",
    p3f1: "Pólizas ilimitadas",
    p3f2: "Automatizaciones avanzadas",
    p3f3: "Soporte prioritario",
    aboutTag: "Sobre nosotros",
    aboutTitle: "Construimos software útil para equipos que necesitan operar rápido y sin fricción.",
    aboutText:
      "Somos un equipo chileno enfocado en automatización para corredoras y empresas de servicios. Diseñamos tecnología simple, clara y orientada a resultados medibles.",
    footerText: "Automatización de cobranza para corredoras en Chile.",
    loginSuccess: "Acceso correcto. Bienvenido al panel de borradores.",
    loginError: "Credenciales inválidas. Usa correo admin y clave admin.",
    rotatingRisk: "Probar AVIA RISK",
    rotatingFleet: "Probar AVIA FLEET",
    rotatingSystems: "Probar AVIA SYSTEMS"
  },
  en: {
    navPricing: "Pricing",
    navDemo: "Book demo",
    heroTag: "Built for insurance brokers in Chile",
    heroTitle: "Automate collections and reporting for Chilean brokers in minutes",
    heroText:
      "Identify overdue accounts, trigger payment reminders, and generate executive reports without spreadsheet work.",
    heroPrimary: "Start free",
    heroSecondary: "View demo",
    featureTag: "Key capabilities",
    featureTitle: "Everything your team needs to collect faster and report with confidence",
    f1Title: "Automatically detect overdue clients",
    f1Text: "Focus your team on high-priority debtors with smart risk and due-date alerts.",
    f2Title: "Create reports in one click",
    f2Text: "Deliver clear management-ready reports in minutes instead of hours.",
    f3Title: "Integrates with Excel and APIs",
    f3Text: "Connect current workflows without rebuilding your full stack.",
    f4Title: "Automate collection follow-ups",
    f4Text: "Schedule reminders by portfolio and reduce delinquency month over month.",
    pricingTag: "Pricing",
    pricingTitle: "Simple plans with no surprises",
    perMonth: "/ month",
    popular: "Most popular",
    p1Title: "Starter",
    p1f1: "Up to 1,000 policies",
    p1f2: "Automated reminders",
    p1f3: "Monthly report",
    p2Title: "Growth",
    p2f1: "Up to 5,000 policies",
    p2f2: "Real-time dashboards",
    p2f3: "Excel export + API",
    p3Title: "Scale",
    p3f1: "Unlimited policies",
    p3f2: "Advanced automations",
    p3f3: "Priority support",
    aboutTag: "About us",
    aboutTitle: "We build practical software for teams that need to move fast with less friction.",
    aboutText:
      "We are a Chilean team specialized in automation for insurance brokers and service companies, focused on measurable outcomes.",
    footerText: "Collections automation for insurance brokers in Chile.",
    loginSuccess: "Access granted. Welcome to the drafts panel.",
    loginError: "Invalid credentials. Use admin as email and admin as password.",
    rotatingRisk: "Try AVIA RISK",
    rotatingFleet: "Try AVIA FLEET",
    rotatingSystems: "Try AVIA SYSTEMS"
  }
};

const langToggle = document.getElementById("lang-toggle");
const translatableElements = document.querySelectorAll("[data-i18n]");
const loader = document.getElementById("loader");
const yearNode = document.getElementById("year");

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

function getCurrentLanguage() {
  const saved = localStorage.getItem("avia-lang");
  if (saved === "es" || saved === "en") return saved;
  return document.documentElement.lang === "en" ? "en" : "es";
}

function setLanguage(lang) {
  const selected = translations[lang] ? lang : "es";

  document.documentElement.lang = selected;
  localStorage.setItem("avia-lang", selected);

  translatableElements.forEach((node) => {
    const key = node.dataset.i18n;
    if (key && translations[selected][key]) {
      node.textContent = translations[selected][key];
    }
  });

  if (langToggle) {
    langToggle.textContent = selected === "es" ? "EN" : "ES";
  }

  updateRotatingOptions(selected);
}

if (langToggle) {
  langToggle.addEventListener("click", () => {
    const nextLang = document.documentElement.lang === "es" ? "en" : "es";
    setLanguage(nextLang);
  });
}

const rotatingButtons = [
  document.getElementById("rotate-cta"),
  document.getElementById("rotate-cta-bottom")
].filter(Boolean);

let rotatingOptions = [];
let optionIndex = 0;
let rotationStarted = false;

function updateRotatingOptions(lang) {
  const t = translations[lang] || translations.es;

  rotatingOptions = [
    { label: t.rotatingRisk, href: "risk.html" },
    { label: t.rotatingFleet, href: "fleet.html" },
    { label: t.rotatingSystems, href: "systems.html" }
  ];

  optionIndex = 0;
  applyRotatingOption();
}

function applyRotatingOption() {
  if (!rotatingButtons.length || !rotatingOptions.length) return;

  const option = rotatingOptions[optionIndex];

  rotatingButtons.forEach((button) => {
    button.textContent = option.label;
    button.href = option.href;
  });

  optionIndex = (optionIndex + 1) % rotatingOptions.length;
}

function startRotation() {
  if (!rotatingButtons.length || rotationStarted) return;
  rotationStarted = true;
  setInterval(applyRotatingOption, 2800);
}

const loginForm = document.getElementById("client-login");

if (loginForm) {
  const loginMsg = document.getElementById("login-msg");
  const drafts = document.getElementById("drafts");

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const lang = getCurrentLanguage();
    const t = translations[lang] || translations.es;

    if (email === "admin" && password === "admin") {
      if (loginMsg) loginMsg.textContent = t.loginSuccess;
      drafts?.classList.remove("hidden");
      return;
    }

    if (loginMsg) loginMsg.textContent = t.loginError;
    drafts?.classList.add("hidden");
  });
}

setLanguage(getCurrentLanguage());
startRotation();

window.addEventListener("load", () => {
  if (loader) {
    setTimeout(() => loader.classList.add("hidden"), 1200);
  }
});