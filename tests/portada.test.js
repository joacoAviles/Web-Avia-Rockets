import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../app.html", import.meta.url), "utf8");
const html = await readFile(
  new URL("../portada.html", import.meta.url),
  "utf8",
);
const js = await readFile(new URL("../portada.js", import.meta.url), "utf8");

test("Labs expone Portada como producto real", () => {
  assert.match(app, /products: \["academy", "portada", "api-lab"\]/);
  assert.match(app, /window\.location\.href = "portada\.html"/);
});

test("Portada exige sesión y limita acceso a los tres usuarios autorizados", () => {
  for (const email of [
    "keanuavia@gmail.com",
    "r.labbe.a@gmail.com",
    "admin@aviarockets.cl",
  ])
    assert.match(js, new RegExp(email.replace(".", "\\.")));
  assert.match(js, /avia_auth_token/);
  assert.match(js, /login\.html\?next=/);
});

test("Portada incluye editor, configuración y exportación PNG", async () => {
  assert.match(html, /Configuración de portada/);
  assert.match(html, /Exportar PNG/);
  assert.match(js, /output\.toBlob/);
  assert.match(
    await readFile(new URL("../portada-presets.js", import.meta.url), "utf8"),
    /JoacoAvia · Grid \+ Topografía/,
  );
});
