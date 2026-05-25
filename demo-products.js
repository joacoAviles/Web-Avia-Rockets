function getProducts() {
  return Array.isArray(window.AVIA_PRODUCTS) ? window.AVIA_PRODUCTS : [];
}

function setProducts(products) {
  if (Array.isArray(products) && products.length) window.AVIA_PRODUCTS = products;
}

function renderDemoSelector(products, activeId) {
  return products.map((product) => `<button class="demo-product-tab ${product.id === activeId ? "is-active" : ""}" type="button" data-product-id="${product.id}"><span>${product.label}</span><small>${product.short}</small></button>`).join("");
}

function renderGuidedSteps(product) {
  return product.steps.map((step, index) => `<li class="guided-step ${index === 0 ? "is-active" : ""}" data-step-index="${index}"><strong>0${index + 1}</strong><span>${step}</span></li>`).join("");
}

function renderProduct(product) {
  const target = document.getElementById("beta-product-view");
  const steps = document.getElementById("beta-guided-steps");
  const title = document.getElementById("beta-product-title");
  const text = document.getElementById("beta-product-text");
  if (target && window.renderAviaProductPanel) target.innerHTML = window.renderAviaProductPanel(product);
  if (steps) steps.innerHTML = renderGuidedSteps(product);
  if (title) title.textContent = product.title;
  if (text) text.textContent = product.description;
}

async function setupDemoProducts() {
  if (window.aviaLoadProducts) {
    const apiProducts = await window.aviaLoadProducts();
    setProducts(apiProducts);
  }
  const products = getProducts();
  if (!products.length) return;
  const selector = document.getElementById("beta-product-selector");
  let active = products[0];
  if (selector) selector.innerHTML = renderDemoSelector(products, active.id);
  renderProduct(active);

  selector?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-product-id]");
    if (!button) return;
    const next = products.find((product) => product.id === button.dataset.productId);
    if (!next) return;
    active = next;
    selector.querySelectorAll(".demo-product-tab").forEach((tab) => tab.classList.toggle("is-active", tab.dataset.productId === active.id));
    renderProduct(active);
  });

  let step = 0;
  setInterval(() => {
    const steps = document.querySelectorAll(".guided-step");
    if (!steps.length) return;
    step = (step + 1) % steps.length;
    steps.forEach((item, index) => item.classList.toggle("is-active", index === step));
  }, 2400);
}

setupDemoProducts();
