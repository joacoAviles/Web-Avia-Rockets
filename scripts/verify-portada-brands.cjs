const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "msedge",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    localStorage.setItem(
      "avia_auth_user",
      JSON.stringify({ email: "admin@aviarockets.cl" }),
    );
    localStorage.setItem("avia_auth_token", "isolated-ui-test");
  });
  const p = await context.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const base = process.env.PORTADA_BASE_URL || "http://127.0.0.1:8091";
  await p.goto(base + "/portada.html");
  await p
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  const saved = () =>
    p.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await p.locator("#format").selectOption("channel");
  await saved();
  await p.locator("#new").click();
  await saved();
  assert.equal(await p.locator("#canvas").getAttribute("width"), "2560");
  assert.equal(await p.locator("#canvas").getAttribute("height"), "1440");
  await p.locator("#brand").fill("Canal de prueba");
  await p.locator("#name").fill("Banner editorial");
  await p.locator("#title").fill("hola");
  await p.locator("#subtitle").fill("chao");
  await saved();
  await p.locator("[data-tab=design]").click();
  await p.getByRole("button", { name: "Título Texto", exact: true }).click();
  for (const family of [
    "Bebas Neue",
    "Montserrat",
    "Oswald",
    "Playfair Display",
  ]) {
    await p.locator("[data-k=fontFamily]").selectOption(family);
    await p.waitForFunction((f) => document.fonts.check(`40px "${f}"`), family);
    await saved();
  }
  await p.locator("[data-k=fontPx]").fill("96");
  await p.locator("[data-k=lineHeight]").fill("1.4");
  await p.locator("[data-k=letterSpacing]").fill("3");
  await p.locator("[data-toggle=italic]").check();
  await saved();
  await p.locator("[data-tab=brands]").click();
  await p
    .locator("#fontImport")
    .setInputFiles("assets/fonts/portada/Oswald.ttf");
  await p.locator("#fontList").getByText("Oswald.ttf").waitFor();
  await saved();
  await p.locator("[data-tab=design]").click();
  assert.ok(
    (await p.locator("[data-k=fontFamily]").inputValue()).startsWith("Brand_"),
  );
  await p.locator("[data-tab=brands]").click();
  await p.locator("#saveTemplate").click();
  await p
    .getByText("Plantilla guardada con marca, fuentes y recursos")
    .waitFor();
  await p.locator("#useTemplate").click();
  await saved();
  await p.locator("[data-tab=content]").click();
  await p.locator("#title").fill("Nueva edición");
  await saved();
  await p.locator("#undo").click();
  await saved();
  assert.equal(await p.locator("#title").inputValue(), "hola");
  await p.locator("#redo").click();
  await saved();
  assert.equal(await p.locator("#title").inputValue(), "Nueva edición");
  await p.reload();
  await p
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  assert.equal(await p.locator("#brand").inputValue(), "Canal de prueba");
  await p.locator("[data-tab=design]").click();
  await p.getByRole("button", { name: "Título Texto", exact: true }).click();
  assert.equal(await p.locator("[data-k=fontPx]").inputValue(), "96");
  assert.equal(await p.locator("[data-k=letterSpacing]").inputValue(), "3");
  assert.equal(await p.locator("[data-toggle=italic]").isChecked(), true);
  const family = await p.locator("[data-k=fontFamily]").inputValue();
  assert.ok(
    await p.evaluate((f) => document.fonts.check(`96px "${f}"`), family),
  );
  await p.locator("[data-tab=brands]").click();
  await p.locator("#useTemplate").click();
  await saved();
  await p.locator("[data-tab=content]").click();
  assert.equal(await p.locator("#title").inputValue(), "hola");
  await p.locator("#format").selectOption("custom");
  await p.locator("#customWidth").fill("1600");
  await p.locator("#customHeight").fill("900");
  await saved();
  assert.equal(await p.locator("#canvas").getAttribute("width"), "1600");
  let download = p.waitForEvent("download");
  await p.locator("#export").click();
  await (await download).saveAs("artifacts/portada/banner-marca.png");
  download = p.waitForEvent("download");
  await p.locator("#backup").click();
  await (await download).saveAs("artifacts/portada/banner-marca.json");
  const project = JSON.parse(
    fs.readFileSync("artifacts/portada/banner-marca.json"),
  );
  assert.equal(project.fonts.length, 1);
  assert.equal(project.brand, "Canal de prueba");
  assert.equal(project.width, 1600);
  await p
    .locator("#projectImport")
    .setInputFiles("artifacts/portada/banner-marca.json");
  await saved();
  await p.reload();
  await p
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  assert.equal(await p.locator("#customWidth").inputValue(), "1600");
  await p.locator("[data-tab=design]").click();
  await p.getByRole("button", { name: "Título Texto", exact: true }).click();
  assert.equal(await p.locator("[data-k=fontFamily]").inputValue(), family);
  await p.screenshot({
    path: "artifacts/portada/editor-tipografias.png",
    fullPage: true,
  });
  await p.setViewportSize({ width: 390, height: 844 });
  assert.ok(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await p.locator("[data-tab=brands]").click();
  await p.screenshot({
    path: "artifacts/portada/editor-marcas-mobile.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  await browser.close();
  console.log(
    "PASS: channel format, 4 bundled fonts, imported font, typography sizes/styles, brand template independence, undo/redo, custom dimensions, PNG/JSON export, full reload/import, mobile.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
