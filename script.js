const yearNode = document.getElementById("year");
if (yearNode) yearNode.textContent = new Date().getFullYear();

const rotatingOptions = [
  { label: "Probar AVIA RISK", href: "risk.html" },
  { label: "Probar AVIA FLEET", href: "fleet.html" },
  { label: "Probar AVIA SYSTEMS", href: "systems.html" }
];

const rotatingButtons = [document.getElementById("rotate-cta"), document.getElementById("rotate-cta-bottom")].filter(Boolean);
let optionIndex = 0;

const applyRotatingOption = () => {
  const option = rotatingOptions[optionIndex];
  rotatingButtons.forEach((button) => {
    button.textContent = option.label;
    button.href = option.href;
  });
  optionIndex = (optionIndex + 1) % rotatingOptions.length;
};

if (rotatingButtons.length) {
  applyRotatingOption();
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

    if (email === "admin" && password === "admin") {
      loginMsg.textContent = "Acceso correcto. Bienvenido al panel de borradores.";
      drafts?.classList.remove("hidden");
      return;
    }

    loginMsg.textContent = "Credenciales inválidas. Usa correo admin y clave admin.";
    drafts?.classList.add("hidden");
  });
}
