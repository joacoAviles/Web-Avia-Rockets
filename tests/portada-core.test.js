import test from "node:test";
import assert from "node:assert/strict";
import { normalizeProject, exampleProject, newLayer } from "../portada-core.js";
import { seed } from "../portada-presets.js";
test("el respaldo conserva textos, imágenes, transparencias y patrones de sombra", () => {
  const p = exampleProject();
  p.layers.push(
    newLayer("image", { src: "data:image/png;base64,aGVsbG8=", opacity: 0.4 }),
  );
  assert.deepEqual(normalizeProject(JSON.parse(JSON.stringify(p))), p);
  assert.equal(p.texts.title, "hola");
  assert.equal(p.texts.subtitle, "chao");
  assert.equal(p.layers[2].shadow.repeat, 12);
});
test("migra perfiles anteriores sin perder identificadores, nombre o diseño", () => {
  for (const row of seed()) {
    const p = normalizeProject(row);
    assert.equal(p.id, row.id);
    assert.equal(p.name, row.definition.name);
    assert.equal(p.layers.length, row.definition.layers.length);
    assert.equal(p.texts.title, "START BROKEN.");
  }
});
test("limita valores importados que podrían bloquear el lienzo", () => {
  const p = exampleProject();
  p.layers[0].spacing = 0;
  p.layers[2].shadow.repeat = 100000;
  p.layers[2].opacity = -4;
  const valid = normalizeProject(p);
  assert.equal(valid.layers[0].spacing, 0.01);
  assert.equal(valid.layers[2].shadow.repeat, 24);
  assert.equal(valid.layers[2].opacity, 0);
});
test("rechaza formatos corruptos y recursos externos, conserva el proyecto activo", () => {
  assert.throws(() => normalizeProject({ format: "unknown", layers: [] }));
  const p = exampleProject();
  p.layers.push(newLayer("image"));
  p.layers.at(-1).src = "https://example.com/image.png";
  assert.throws(() => normalizeProject(p), /incluidas/);
  const q = exampleProject();
  q.layers[1].id = q.layers[0].id;
  assert.throws(() => normalizeProject(q), /repetidos/);
});

test("medidas personalizadas y formatos de canal conservan su geometría", async () => {
  const { projectSize, safeAreaFor } = await import("../portada-core.js");
  const p = normalizeProject({
    ...exampleProject(),
    format: "custom",
    width: 1600,
    height: 900,
  });
  assert.deepEqual(projectSize(p), [1600, 900]);
  assert.deepEqual(projectSize({ format: "channel" }), [2560, 1440]);
  const area = safeAreaFor("channel");
  assert.ok(area.top > 0.35 && area.left > 0.19);
  assert.throws(() => normalizeProject({ format: "__proto__", layers: [] }));
});
test("fuentes de marca y controles tipográficos viajan dentro del proyecto", () => {
  const p = exampleProject();
  p.brand = "Marca de prueba";
  p.fonts = [
    {
      family: "Brand_example",
      label: "Mi fuente",
      src: "data:font/ttf;base64,aGVsbG8=",
    },
  ];
  Object.assign(p.layers[2], {
    fontFamily: "Brand_example",
    italic: true,
    autoFit: false,
    lineHeight: 1.4,
    letterSpacing: 4,
    locked: true,
  });
  const copy = normalizeProject(JSON.parse(JSON.stringify(p)));
  assert.deepEqual(copy.fonts, p.fonts);
  assert.equal(copy.brand, p.brand);
  assert.equal(copy.layers[2].fontFamily, "Brand_example");
  assert.equal(copy.layers[2].lineHeight, 1.4);
});
test("rechaza referencias remotas en fuentes de marca", () => {
  const p = exampleProject();
  p.fonts = [
    {
      family: "Brand_test",
      label: "Fuente",
      src: "https://example.com/font.woff2",
    },
  ];
  assert.throws(() => normalizeProject(p), /Fuente de marca/);
});
