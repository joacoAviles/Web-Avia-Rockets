const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.BROWSER_CHANNEL || "msedge",
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    acceptDownloads: true,
  });
  await context.addInitScript(() => {
    localStorage.setItem(
      "avia_auth_user",
      JSON.stringify({ email: "admin@aviarockets.cl" }),
    );
    localStorage.setItem("avia_auth_token", "local-ui-test");
  });
  const page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8091/portada.html");
  await page
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  await page.locator("#demo").click();
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  assert.equal(await page.locator("#title").inputValue(), "hola");
  assert.equal(await page.locator("#subtitle").inputValue(), "chao");
  await page.reload();
  await page
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  assert.equal(await page.locator("#title").inputValue(), "hola");
  await page.screenshot({
    path: "artifacts/portada/editor-desktop.png",
    fullPage: true,
  });
  await page.locator("[data-tab=design]").click();
  await page.getByRole("button", { name: "Título Texto", exact: true }).click();
  await page.locator('[data-k="shadow.repeat"]').fill("9");
  await page.locator('[data-k="shadow.opacity"]').fill("30");
  await page.locator("#save").click();
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  // Import a transparent raster and verify it survives an automatic save.
  await page.locator("[data-tab=content]").click();
  const raster = await page.evaluate(() => {
    const c = document.createElement("canvas");
    c.width = 100;
    c.height = 100;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(71,163,255,.5)";
    x.beginPath();
    x.arc(50, 50, 45, 0, Math.PI * 2);
    x.fill();
    return c.toDataURL();
  });
  await page
    .locator("#imageImport")
    .setInputFiles({
      name: "imagen.png",
      mimeType: "image/png",
      buffer: Buffer.from(raster.split(",")[1], "base64"),
    });
  await page.locator("[data-tab=design]").click();
  await page
    .getByRole("button", { name: "imagen.png Imagen", exact: true })
    .waitFor();
  await page.locator("[data-k=x]").fill("76");
  await page.locator("[data-k=y]").fill("74");
  await page.locator("[data-k=width]").fill("10");
  await page.locator("[data-k=height]").fill("10");
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  await page.locator("[data-tab=design]").click();
  await page
    .getByRole("button", { name: "imagen.png Imagen", exact: true })
    .click();
  assert.equal(await page.locator("[data-k=x]").inputValue(), "76");
  const rect = await page.locator("#canvas").boundingBox();
  await page.mouse.move(rect.x + rect.width * 0.8, rect.y + rect.height * 0.78);
  await page.mouse.down();
  await page.mouse.move(
    rect.x + rect.width * 0.78,
    rect.y + rect.height * 0.79,
  );
  await page.mouse.up();
  assert.notEqual(await page.locator("[data-k=x]").inputValue(), "76");
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await page.locator("[data-tab=content]").click();
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="160" height="70" rx="15" fill="#47a3ff" fill-opacity=".5"/><text x="15" y="46" font-size="30" fill="white">LOGO</text></svg>';
  await page
    .locator("#imageImport")
    .setInputFiles({
      name: "logo.svg",
      mimeType: "image/svg+xml",
      buffer: Buffer.from(svg),
    });
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await page.locator("[data-tab=design]").click();
  await page
    .getByRole("button", { name: "logo.svg Imagen", exact: true })
    .waitFor();
  await page.locator("[data-k=x]").fill("64");
  await page.locator("[data-k=y]").fill("8");
  await page.locator("[data-k=width]").fill("25");
  await page.locator("[data-k=height]").fill("12.5");
  await page.locator("#save").click();
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#export").click();
  const png = await downloadPromise;
  await png.saveAs("artifacts/portada/hola-chao.png");
  // An export while a layer is selected must exactly match a clean render.
  const matches = await page.evaluate(async () => {
    const { ProjectStore, CoverRenderer } = await import("./portada-core.js?v=20260906-3");
    const s = new ProjectStore("admin@aviarockets.cl");
    await s.open();
    const lib = await s.read();
    const p = lib.projects.find((p) => p.id === lib.activeId);
    const r = new CoverRenderer();
    await r.prepare(p);
    const c = document.createElement("canvas");
    r.render(c, p);
    return c.toDataURL();
  });
  assert.equal(
    fs.readFileSync("artifacts/portada/hola-chao.png").toString("base64"),
    matches.split(",")[1],
  );
  await page.locator("[data-tab=content]").click();
  const jsonPromise = page.waitForEvent("download");
  await page.locator("#backup").click();
  const json = await jsonPromise;
  await json.saveAs("artifacts/portada/hola-chao.json");
  const saved = JSON.parse(fs.readFileSync("artifacts/portada/hola-chao.json"));
  assert.equal(saved.texts.subtitle, "chao");
  assert.equal(
    saved.layers.find((l) => l.textSlot === "title").shadow.repeat,
    9,
  );
  assert.ok(saved.layers.at(-1).src.startsWith("data:image/svg+xml;"));
  await page.locator("#new").click();
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await page
    .locator("#projectImport")
    .setInputFiles("artifacts/portada/hola-chao.json");
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  assert.equal(await page.locator("#title").inputValue(), "hola");
  await page
    .locator("#projectImport")
    .setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"bad":true}'),
    });
  await page.locator("#message.error").waitFor();
  assert.equal(await page.locator("#title").inputValue(), "hola");
  await page.locator("#format").selectOption("horizontal");
  await page.locator("#save").click();
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  assert.equal(await page.locator("#canvas").getAttribute("width"), "1280");
  await page.locator("#format").selectOption("square");
  await page.locator("#save").click();
  await page.getByText("Guardado en este navegador", { exact: true }).waitFor();
  await page.screenshot({
    path: "artifacts/portada/editor-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "artifacts/portada/editor-mobile.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errors, []);
  // Existing profiles migrate once and remain untouched in legacy storage.
  const legacyContext = await browser.newContext();
  await legacyContext.addInitScript(() => {
    localStorage.setItem(
      "avia_auth_user",
      JSON.stringify({ email: "admin@aviarockets.cl" }),
    );
    localStorage.setItem("avia_auth_token", "test");
  });
  const legacyPage = await legacyContext.newPage();
  await legacyPage.goto("http://127.0.0.1:8091/portada.html");
  await legacyPage
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  await legacyPage.evaluate(async () => {
    const { seed } = await import("./portada-presets.js");
    localStorage.setItem(
      "avia_portada_profiles_v1:admin@aviarockets.cl",
      JSON.stringify(seed()),
    );
    const r = indexedDB.open("avia-portadas", 1);
    await new Promise((resolve, reject) => {
      r.onsuccess = () => {
        const tx = r.result.transaction("libraries", "readwrite");
        tx.objectStore("libraries").delete("admin@aviarockets.cl");
        tx.oncomplete = resolve;
        tx.onerror = reject;
      };
    });
  });
  await legacyPage.reload();
  await legacyPage
    .getByText("Proyectos recuperados · guardado automático activo")
    .waitFor();
  assert.equal(
    await legacyPage.locator("#name").inputValue(),
    "JoacoAvia · Grid + Topografía",
  );
  assert.equal(
    await legacyPage.evaluate(
      () =>
        JSON.parse(
          localStorage.getItem("avia_portada_profiles_v1:admin@aviarockets.cl"),
        ).length,
    ),
    4,
  );
  // A failed disk write must not claim that changes are saved; the backup remains usable.
  await legacyPage.evaluate(async () => {
    const { ProjectStore } = await import("./portada-core.js?v=20260906-3");
    ProjectStore.prototype.write = async () => {
      throw Error("QuotaExceededError");
    };
  });
  await legacyPage.locator("#title").fill("Prueba de cuota");
  await legacyPage.locator("#message.error").waitFor();
  assert.match(
    await legacyPage.locator("#message").innerText(),
    /No se pudo guardar/,
  );
  await browser.close();
  console.log(
    "PASS: example, autosave/reload, shadow editing, SVG import, clean PNG, project backup/import, corrupt file handling, formats, mobile layout, no browser errors.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
