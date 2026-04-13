const translations = {
  es: {
    languageTag: "Selecciona tu idioma",
    languageTitle: "Bienvenido a Avia Rockets",
    languageSubtitle: "Elige cómo quieres explorar nuestros servicios de automatización, desarrollo y optimización.",
    navLogin: "Acceso clientes",
    navContact: "Contáctanos",
    heroTag: "Menos fricción. Más resultados.",
    heroTitle: "Quitamos procesos absurdos para que tu negocio despegue más rápido.",
    heroText: "En Avia Rockets simplificamos operaciones, automatizamos tareas repetitivas y construimos tecnología útil para crecer sin perder tiempo.",
    heroPrimary: "Ver servicios",
    heroSecondary: "Solicitar diagnóstico",
    metricOneLabel: "Tareas automatizadas",
    metricTwoLabel: "Horas recuperadas",
    metricThreeLabel: "Proyectos entregados",
    servicesTag: "Servicios SaaS + Desarrollo",
    servicesTitle: "Soluciones diseñadas para eliminar cuellos de botella",
    service1Title: "Correos automáticos de levantamiento de información",
    service1Text: "Flujos de email inteligentes para capturar datos clave sin seguimiento manual.",
    service2Title: "Informes ejecutivos automáticos",
    service2Text: "Reportes claros con indicadores críticos y recomendaciones accionables.",
    service3Title: "Asesorías técnicas para emprendimientos",
    service3Text: "Acompañamiento especializado para validar arquitectura, procesos y escalabilidad.",
    service4Title: "Desarrollo de soluciones a medida",
    service4Text: "Herramientas personalizadas conectadas a tu operación real, no al revés.",
    service5Title: "Desarrollo de apps, web y APIs",
    service5Text: "Desde prototipo hasta producción, con foco en velocidad, calidad y mantenimiento simple.",
    service6Title: "Gestión de flota para clubes aéreos",
    service6Text: "Plataforma estilo “comunidad feliz” adaptada a la operación aeronáutica.",
    service7Title: "Paneles operativos en tiempo real",
    service7Text: "Monitorea ventas, soporte y operaciones con tableros que priorizan decisiones rápidas.",
    service8Title: "Automatización de onboarding de clientes",
    service8Text: "Reduce tiempos de implementación con flujos guiados y checklist automatizados.",
    loginTag: "Área de clientes",
    loginTitle: "Inicia sesión para gestionar tus proyectos y servicios",
    loginText: "Consulta avances, revisa reportes y haz seguimiento en un solo lugar. Tu operación, simplificada.",
    labelEmail: "Correo empresarial",
    labelPassword: "Contraseña",
    loginButton: "Entrar al portal",
    contactTag: "Contáctanos",
    contactTitle: "Cuéntanos qué quieres optimizar y te ayudamos a despegar",
    contactSelect: "Selecciona un servicio",
    contactOption1: "Automatización SaaS",
    contactOption2: "Desarrollo a medida",
    contactOption3: "Asesoría técnica",
    contactButton: "Enviar solicitud",
    footerText: "Menos requisitos absurdos. Más velocidad."
  },
  en: {
    languageTag: "Choose your language",
    languageTitle: "Welcome to Avia Rockets",
    languageSubtitle: "Pick how you want to explore our automation, development, and optimization services.",
    navLogin: "Client Login",
    navContact: "Contact Us",
    heroTag: "Less friction. More results.",
    heroTitle: "We remove absurd processes so your business can take off faster.",
    heroText: "At Avia Rockets, we simplify operations, automate repetitive tasks, and build practical technology for sustainable growth.",
    heroPrimary: "See services",
    heroSecondary: "Request audit",
    metricOneLabel: "Automated tasks",
    metricTwoLabel: "Hours recovered",
    metricThreeLabel: "Delivered projects",
    servicesTag: "SaaS + Development Services",
    servicesTitle: "Solutions built to eliminate bottlenecks",
    service1Title: "Automated information-gathering emails",
    service1Text: "Smart email flows that collect key data without manual follow-up.",
    service2Title: "Automated executive reports",
    service2Text: "Clear reports with critical KPIs and actionable recommendations.",
    service3Title: "Technical advisory for startups",
    service3Text: "Specialized guidance to validate architecture, process, and scalability.",
    service4Title: "Custom solution development",
    service4Text: "Tailored tools that match your real operation—not the other way around.",
    service5Title: "App, web, and API development",
    service5Text: "From prototype to production with speed, quality, and maintainability in mind.",
    service6Title: "Fleet management for air clubs",
    service6Text: "A “happy community” style platform adapted to aviation operations.",
    service7Title: "Real-time operations dashboards",
    service7Text: "Track sales, support, and operations with decision-focused dashboards.",
    service8Title: "Client onboarding automation",
    service8Text: "Reduce implementation time with guided workflows and automated checklists.",
    loginTag: "Client Area",
    loginTitle: "Log in to manage your projects and services",
    loginText: "Review progress, access reports, and monitor everything in one place.",
    labelEmail: "Business email",
    labelPassword: "Password",
    loginButton: "Access portal",
    contactTag: "Contact Us",
    contactTitle: "Tell us what you want to optimize and we’ll help you take off",
    contactSelect: "Select a service",
    contactOption1: "SaaS Automation",
    contactOption2: "Custom Development",
    contactOption3: "Technical Advisory",
    contactButton: "Send request",
    footerText: "Fewer absurd requirements. More speed."
  }
};

const gate = document.getElementById("language-gate");
const langToggle = document.getElementById("lang-toggle");
const languageButtons = document.querySelectorAll("[data-language]");
const translatableElements = document.querySelectorAll("[data-i18n]");

const setLanguage = (language) => {
  const selected = translations[language] ? language : "es";
  document.documentElement.lang = selected;
  localStorage.setItem("avia-lang", selected);

  translatableElements.forEach((node) => {
    const key = node.dataset.i18n;
    const value = translations[selected][key];
    if (value) {
      node.textContent = value;
    }
  });

  langToggle.textContent = selected.toUpperCase();
};

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setLanguage(button.dataset.language);
    gate.classList.add("hidden");
  });
});

langToggle.addEventListener("click", () => {
  const nextLang = document.documentElement.lang === "es" ? "en" : "es";
  setLanguage(nextLang);
});

const rememberedLanguage = localStorage.getItem("avia-lang");
if (rememberedLanguage) {
  setLanguage(rememberedLanguage);
  gate.classList.add("hidden");
}

document.getElementById("year").textContent = new Date().getFullYear();
