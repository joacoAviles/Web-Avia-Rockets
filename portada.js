import { seed } from "./portada-presets.js?v=20260906-3";
import {
  sizes,
  projectSize,
  safeAreaFor,
  fontCatalog,
  normalizeProject,
  newLayer,
  exampleProject,
  ProjectStore,
  CoverRenderer,
} from "./portada-core.js?v=20260906-3";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const allowed = new Set([
  "keanuavia@gmail.com",
  "r.labbe.a@gmail.com",
  "admin@aviarockets.cl",
]);
let sessionUser = {};
try {
  sessionUser = JSON.parse(localStorage.getItem("avia_auth_user") || "{}");
} catch {}
const userEmail = String(sessionUser.email || "").toLowerCase();
if (!localStorage.getItem("avia_auth_token") || !allowed.has(userEmail)) {
  location.replace(`login.html?next=${encodeURIComponent("portada.html")}`);
  throw Error("Acceso no habilitado");
}
$("#email").textContent = userEmail;
const store = new ProjectStore(userEmail),
  renderer = new CoverRenderer(),
  canvas = $("#canvas");
let library = { projects: [], activeId: null },
  current,
  selected = null,
  dirty = false,
  timer,
  revision = 0,
  ready = false,
  writeQueue = Promise.resolve();
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const notice = (s, error = false) => {
  $("#message").textContent = s;
  $("#message").classList.toggle("error", error);
};
const handle =
  (fn) =>
  async (...args) => {
    try {
      await fn(...args);
    } catch (e) {
      notice(e.message || "No se pudo completar la operación.", true);
    }
  };
let history = [],
  historyIndex = -1,
  checkpointTime = 0;
function resetHistory() {
  history = [structuredClone(current)];
  historyIndex = 0;
  checkpointTime = 0;
  historyButtons();
}
function historyButtons() {
  $("#undo").disabled = historyIndex <= 0;
  $("#redo").disabled = historyIndex >= history.length - 1;
}
function changed(record = true) {
  if (record) {
    const now = Date.now();
    if (historyIndex < history.length - 1) history.splice(historyIndex + 1);
    if (now - checkpointTime > 450 || historyIndex === 0) {
      history.push(structuredClone(current));
      if (history.length > 30) history.shift();
      historyIndex = history.length - 1;
    } else history[historyIndex] = structuredClone(current);
    checkpointTime = now;
    historyButtons();
  }
  dirty = true;
  revision++;
  notice("Cambios sin guardar…");
  clearTimeout(timer);
  timer = setTimeout(() => save(), 650);
  draw();
}
function draw() {
  if (!current) return;
  renderer.render(canvas, current, { guides: $("#guides").checked, selected });
  $("#dimensions").textContent = `${projectSize(current).join(" × ")} px · PNG`;
}
function queueWrite(snapshot) {
  const job = writeQueue.catch(() => {}).then(() => store.write(snapshot));
  writeQueue = job;
  return job;
}
async function save() {
  clearTimeout(timer);
  if (!current || !ready) return false;
  const rev = revision;
  const snapshot = structuredClone(library),
    project = normalizeProject(current),
    i = snapshot.projects.findIndex((p) => p.id === project.id);
  if (i < 0) snapshot.projects.unshift(project);
  else snapshot.projects[i] = project;
  snapshot.activeId = project.id;
  try {
    await queueWrite(snapshot);
    library = snapshot;
    if (rev === revision) {
      dirty = false;
      notice("Guardado en este navegador");
    }
    refreshProjects();
    return true;
  } catch {
    notice(
      "No se pudo guardar en este navegador. Descarga el proyecto como respaldo y libera espacio antes de continuar.",
      true,
    );
    return false;
  }
}
async function flush() {
  if (dirty && !(await save()))
    throw Error(
      "Hay cambios sin guardar. Descarga un respaldo antes de cambiar de proyecto.",
    );
}
function refreshProjects() {
  const select = $("#profile");
  select.innerHTML = library.projects
    .map(
      (p) =>
        `<option value="${esc(p.id)}">${esc(p.name)}${p.status === "archived" ? " · Archivado" : ""}</option>`,
    )
    .join("");
  select.value = current?.id || "";
}
async function selectProject(id) {
  const p = library.projects.find((p) => p.id === id);
  if (!p) return;
  await renderer.prepare(p);
  current = structuredClone(p);
  selected = null;
  library.activeId = id;
  revision++;
  dirty = false;
  resetHistory();
  fill();
  draw();
}
function fill() {
  for (const k of [
    "name",
    "format",
    "background",
    "network",
    "status",
    "brand",
  ])
    $("#" + k).value = current[k];
  $("#title").value = current.texts.title;
  $("#subtitle").value = current.texts.subtitle;
  $$("[data-safe]").forEach(
    (i) => (i.value = current.safeArea[i.dataset.safe] * 100),
  );
  fillFormats();
  renderTemplates();
  $("#fontList").textContent =
    (current.fonts || []).map((f) => f.label).join(" · ") ||
    "Sin fuentes importadas en este proyecto.";
  refreshProjects();
  renderLayers();
  renderInspector();
}
async function addProject(p) {
  await flush();
  await renderer.prepare(p);
  current = p;
  selected = null;
  revision++;
  dirty = true;
  resetHistory();
  fill();
  draw();
  await save();
}
$("#profile").onchange = handle(async (e) => {
  const id = e.target.value;
  try {
    await flush();
    await selectProject(id);
    await save();
  } catch (error) {
    refreshProjects();
    throw error;
  }
});
for (const k of ["name", "format", "background", "network", "status", "brand"])
  $("#" + k).oninput = (e) => {
    current[k] = e.target.value;
    if (k === "format") {
      current.safeArea = safeAreaFor(current.format);
      fillFormats();
      renderInspector();
      $$("[data-safe]").forEach(
        (i) => (i.value = Math.round(current.safeArea[i.dataset.safe] * 100)),
      );
    }
    changed();
  };
for (const k of ["title", "subtitle"])
  $("#" + k).oninput = (e) => {
    current.texts[k] = e.target.value;
    changed();
  };
$("#guides").onchange = draw;
$$("[data-tab]").forEach(
  (b) =>
    (b.onclick = () => {
      $$("[data-tab]").forEach((t) => {
        t.classList.toggle("active", t === b);
        t.setAttribute("aria-pressed", String(t === b));
      });
      $$(".tab").forEach((t) =>
        t.classList.toggle("active", t.id === b.dataset.tab),
      );
    }),
);
$("#save").onclick = () => save();
$("#new").onclick = handle(() => {
  const format = current?.format || "square",
    channel = format === "channel";
  return addProject(
    normalizeProject({
      id: crypto.randomUUID(),
      name: "Nueva portada",
      brand: current?.brand || "",
      format,
      width: current?.width,
      height: current?.height,
      background: "#071426",
      safeArea: safeAreaFor(format),
      texts: { title: "Tu título", subtitle: "Tu subtítulo" },
      layers: [
        newLayer("text", {
          name: "Título",
          textSlot: "title",
          x: channel ? 0.22 : 0.1,
          y: channel ? 0.39 : 0.3,
          width: channel ? 0.56 : 0.8,
          height: channel ? 0.12 : 0.22,
          fontSize: channel ? 0.075 : 0.1,
        }),
        newLayer("text", {
          name: "Subtítulo",
          textSlot: "subtitle",
          x: channel ? 0.22 : 0.1,
          y: channel ? 0.53 : 0.56,
          width: channel ? 0.56 : 0.8,
          height: channel ? 0.08 : 0.16,
          fontSize: channel ? 0.035 : 0.05,
          color: "#8cc8ff",
        }),
      ],
    }),
  );
});
$("#demo").onclick = handle(() => addProject(exampleProject()));
$("#duplicate").onclick = handle(() => {
  const copy = structuredClone(current);
  copy.id = crypto.randomUUID();
  copy.name += " · copia";
  return addProject(copy);
});
$("#delete").onclick = handle(async () => {
  if (!confirm(`¿Eliminar «${current.name}» de este navegador?`)) return;
  await flush();
  const snapshot = structuredClone(library);
  snapshot.projects = snapshot.projects.filter((p) => p.id !== current.id);
  if (!snapshot.projects.length) snapshot.projects.push(exampleProject());
  snapshot.activeId = snapshot.projects[0].id;
  await queueWrite(snapshot);
  library = snapshot;
  await selectProject(snapshot.activeId);
  notice("Proyecto eliminado");
});
function download(blob, filename) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
const filename = () =>
  current.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "portada";
$("#backup").onclick = () => {
  download(
    new Blob([JSON.stringify(normalizeProject(current), null, 2)], {
      type: "application/json",
    }),
    filename() + ".json",
  );
  notice("Respaldo descargado con imágenes y configuración");
};
$("#export").onclick = handle(async () => {
  const button = $("#export");
  button.disabled = true;
  try {
    const p = normalizeProject(current);
    await document.fonts.ready;
    await renderer.prepare(p);
    const output = document.createElement("canvas");
    renderer.render(output, p);
    const blob = await new Promise((resolve, reject) =>
      output.toBlob(
        (b) => (b ? resolve(b) : reject(Error("No se pudo crear el PNG."))),
        "image/png",
      ),
    );
    download(blob, filename() + ".png");
    notice("PNG exportado sin guías ni selección");
  } finally {
    button.disabled = false;
  }
});
$("#projectImport").onchange = handle(async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (file.size > 50_000_000)
    throw Error("El proyecto supera el límite de 50 MB.");
  let raw;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    throw Error("El archivo no es un JSON válido.");
  }
  const p = normalizeProject(raw);
  p.id = crypto.randomUUID();
  await addProject(p);
});
const readFile = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });
$("#imageImport").onchange = handle(async (e) => {
  const files = [...e.target.files];
  e.target.value = "";
  if (current.layers.length + files.length > 100)
    throw Error("Máximo 100 capas por proyecto.");
  const projectId = current.id,
    imported = [];
  for (const file of files) {
    if (
      !["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(
        file.type,
      ) ||
      file.size > 10_000_000
    )
      throw Error("Usa imágenes PNG, JPG, WebP o SVG de hasta 10 MB.");
    const src = await readFile(file);
    const l = newLayer("image", { name: file.name, src });
    await renderer.prepare({ layers: [l] });
    const im = renderer.images.get(src).image;
    const [w, h] = projectSize(current);
    l.width = 0.5;
    l.height = Math.min(
      0.8,
      (((0.5 * w) / h) * im.naturalHeight) / im.naturalWidth,
    );
    l.width = (((l.height * h) / w) * im.naturalWidth) / im.naturalHeight;
    imported.push(l);
  }
  if (current.id !== projectId)
    throw Error(
      "El proyecto cambió durante la carga. Vuelve a importar las imágenes.",
    );
  current.layers.push(...imported);
  selected = imported.at(-1)?.id || selected;
  renderLayers();
  renderInspector();
  changed();
});
function renderLayers() {
  const box = $("#layers");
  box.innerHTML = "";
  [...current.layers].reverse().forEach((l) => {
    const b = document.createElement("button");
    b.classList.toggle("selected", selected === l.id);
    b.setAttribute("aria-pressed", String(selected === l.id));
    b.innerHTML = `<span>${esc(l.name)}</span><small>${{ text: "Texto", image: "Imagen", rect: "Forma", line: "Línea", grid: "Malla", topography: "Topografía" }[l.type]}</small>`;
    b.onclick = () => {
      selected = l.id;
      renderLayers();
      renderInspector();
      draw();
    };
    box.append(b);
  });
}
function field(
  label,
  key,
  value,
  { type = "number", min, max, step = "any" } = {},
) {
  return `<label>${label}<input data-k="${key}" type="${type}" value="${esc(value)}" ${min !== undefined ? `min="${min}"` : ""} ${max !== undefined ? `max="${max}"` : ""} step="${step}"></label>`;
}
function selectField(label, key, value, options) {
  return `<label>${label}<select data-k="${key}">${options.map(([id, name]) => `<option value="${id}" ${String(value) === id ? "selected" : ""}>${name}</option>`).join("")}</select></label>`;
}
function renderInspector() {
  const box = $("#inspector"),
    l = current.layers.find((l) => l.id === selected);
  if (!l) {
    box.innerHTML =
      '<p class="hint">Selecciona una capa para ajustar su posición, estilo y sombras.</p>';
    return;
  }
  box.innerHTML =
    field("Nombre de capa", "name", l.name, { type: "text" }) +
    `<div class="actions"><button id="layerBack">Hacia atrás</button><button id="layerFront">Hacia delante</button><button id="layerCopy">Duplicar capa</button><button id="layerDelete">Quitar</button></div><h3>Posición y apariencia</h3><div class="field-grid">` +
    ["x", "y", "width", "height", "opacity"]
      .map((k, i) =>
        field(
          ["X %", "Y %", "Ancho %", "Alto %", "Opacidad %"][i],
          k,
          Math.round(l[k] * 1000) / 10,
          {
            min:
              k === "opacity" ? 0 : ["width", "height"].includes(k) ? 1 : -200,
            max: k === "opacity" ? 100 : ["x", "y"].includes(k) ? 200 : 300,
          },
        ),
      )
      .join("") +
    field("Rotación °", "rotation", l.rotation, { min: -360, max: 360 }) +
    field("Color", "color", l.color, { type: "color" }) +
    "</div>";
  if (l.type === "text")
    box.innerHTML +=
      selectField("Contenido", "textSlot", l.textSlot, [
        ["title", "Título"],
        ["subtitle", "Subtítulo"],
        ["literal", "Texto independiente"],
      ]) +
      field("Texto independiente", "text", l.text, { type: "text" }) +
      selectField(
        "Tipografía",
        "fontFamily",
        l.fontFamily,
        [...fontCatalog, ...(current.fonts || [])].map((f) => [
          f.family,
          f.label,
        ]),
      ) +
      `<div class="field-grid">` +
      field(
        "Tamaño de texto (px)",
        "fontPx",
        Math.round(l.fontSize * projectSize(current)[1]),
        { min: 1, max: 4096 },
      ) +
      field("Interlineado", "lineHeight", l.lineHeight, { min: 0.6, max: 3 }) +
      field("Espaciado (px)", "letterSpacing", l.letterSpacing, {
        min: -10,
        max: 100,
      }) +
      selectField("Peso", "fontWeight", l.fontWeight, [
        ["400", "Normal"],
        ["700", "Negrita"],
        ["800", "Extra negrita"],
        ["900", "Black"],
      ]) +
      selectField("Alineación", "align", l.align, [
        ["left", "Izquierda"],
        ["center", "Centro"],
        ["right", "Derecha"],
      ]) +
      field("Contorno %", "strokeWidth", l.strokeWidth * 100, {
        min: 0,
        max: 5,
      }) +
      field("Color del contorno", "strokeColor", l.strokeColor, {
        type: "color",
      }) +
      `</div><fieldset><legend>Patrón de sombra detrás del texto</legend><label class="check"><input data-k="shadow.enabled" type="checkbox" ${l.shadow.enabled ? "checked" : ""}> Activar sombra</label><p class="hint">Repite la sombra para crear profundidad. Distancias en píxeles sobre un ancho de 1080.</p><div class="field-grid">` +
      field("Color", "shadow.color", l.shadow.color, { type: "color" }) +
      field("Opacidad %", "shadow.opacity", l.shadow.opacity * 100, {
        min: 0,
        max: 100,
      }) +
      field("Desenfoque", "shadow.blur", l.shadow.blur, { min: 0, max: 100 }) +
      field("Repeticiones", "shadow.repeat", l.shadow.repeat, {
        min: 1,
        max: 24,
        step: 1,
      }) +
      field("Desplazamiento X", "shadow.x", l.shadow.x, {
        min: -200,
        max: 200,
      }) +
      field("Desplazamiento Y", "shadow.y", l.shadow.y, {
        min: -200,
        max: 200,
      }) +
      "</div></fieldset>";
  if (l.type === "grid")
    box.innerHTML += field(
      "Separación de malla %",
      "spacing",
      l.spacing * 100,
      { min: 1, max: 50 },
    );
  box.querySelectorAll("[data-k]").forEach(
    (input) =>
      (input.oninput = handle(async () => {
        if (input.type === "number" && (!input.value || !input.validity.valid))
          return;
        const key = input.dataset.k,
          percent = [
            "x",
            "y",
            "width",
            "height",
            "opacity",
            "fontSize",
            "strokeWidth",
            "spacing",
            "shadow.opacity",
          ].includes(key);
        let value =
          input.type === "checkbox"
            ? input.checked
            : input.type === "number"
              ? Number(input.value) / (percent ? 100 : 1)
              : input.value;
        if (key === "fontPx") {
          l.fontSize = value / projectSize(current)[1];
          l.autoFit = false;
          const autoFit = box.querySelector('[data-toggle="autoFit"]');
          if (autoFit) autoFit.checked = false;
        } else if (key.startsWith("shadow.")) l.shadow[key.slice(7)] = value;
        else l[key] = value;
        if (key === "name") renderLayers();
        if (key === "fontFamily") await renderer.prepare(current);
        changed();
      })),
  );
  const toggles = document.createElement("div");
  toggles.innerHTML =
    `<label class="check"><input data-toggle="hidden" type="checkbox" ${l.hidden ? "checked" : ""}> Ocultar capa</label><label class="check"><input data-toggle="locked" type="checkbox" ${l.locked ? "checked" : ""}> Bloquear movimiento</label>` +
    (l.type === "text"
      ? `<label class="check"><input data-toggle="italic" type="checkbox" ${l.italic ? "checked" : ""}> Cursiva</label><label class="check"><input data-toggle="autoFit" type="checkbox" ${l.autoFit ? "checked" : ""}> Reducir texto para ajustarlo a la caja</label>`
      : "");
  toggles.querySelectorAll("[data-toggle]").forEach(
    (i) =>
      (i.onchange = () => {
        l[i.dataset.toggle] = i.checked;
        changed();
      }),
  );
  box.append(toggles);
  if (l.type === "image") {
    const b = document.createElement("button");
    b.textContent = "Usar como fondo";
    b.onclick = () => {
      const im = renderer.images.get(l.src)?.image;
      if (!im) return;
      const [w, h] = projectSize(current),
        scale = Math.max(w / im.naturalWidth, h / im.naturalHeight);
      l.width = (im.naturalWidth * scale) / w;
      l.height = (im.naturalHeight * scale) / h;
      l.x = (1 - l.width) / 2;
      l.y = (1 - l.height) / 2;
      current.layers.splice(current.layers.indexOf(l), 1);
      current.layers.unshift(l);
      renderLayers();
      renderInspector();
      changed();
    };
    box.append(b);
  }
  const index = current.layers.indexOf(l);
  $("#layerBack").disabled = index === 0;
  $("#layerFront").disabled = index === current.layers.length - 1;
  const move = (offset) => {
    current.layers.splice(index, 1);
    current.layers.splice(index + offset, 0, l);
    renderLayers();
    renderInspector();
    changed();
  };
  $("#layerBack").onclick = () => move(-1);
  $("#layerFront").onclick = () => move(1);
  $("#layerCopy").onclick = () => {
    if (current.layers.length >= 100) return notice("Máximo 100 capas.", true);
    const copy = structuredClone(l);
    copy.id = crypto.randomUUID();
    copy.name += " · copia";
    current.layers.splice(index + 1, 0, copy);
    selected = copy.id;
    renderLayers();
    renderInspector();
    changed();
  };
  $("#layerDelete").onclick = () => {
    current.layers.splice(index, 1);
    selected = null;
    renderLayers();
    renderInspector();
    changed();
  };
}
$$("[data-add]").forEach(
  (b) =>
    (b.onclick = () => {
      if (current.layers.length >= 100)
        return notice("Máximo 100 capas.", true);
      const l = newLayer(b.dataset.add);
      current.layers.push(l);
      selected = l.id;
      renderLayers();
      renderInspector();
      changed();
    }),
);
const safe = $("#safeControls");
["left", "top", "right", "bottom"].forEach((k, i) => {
  const label = document.createElement("label");
  label.textContent = ["Izquierda %", "Arriba %", "Derecha %", "Abajo %"][i];
  const input = document.createElement("input");
  input.type = "number";
  input.min = 0;
  input.max = 45;
  input.step = 1;
  input.dataset.safe = k;
  input.oninput = () => {
    if (!input.value || !input.validity.valid) return;
    current.safeArea[k] = Number(input.value) / 100;
    changed();
  };
  label.append(input);
  safe.append(label);
});
let drag;
function point(event) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - r.left) * canvas.width) / r.width,
    y: ((event.clientY - r.top) * canvas.height) / r.height,
  };
}
function inLayer(l, p) {
  const dx = p.x - (l.x + l.width / 2) * canvas.width,
    dy = p.y - (l.y + l.height / 2) * canvas.height,
    a = (-l.rotation * Math.PI) / 180;
  return {
    x: dx * Math.cos(a) - dy * Math.sin(a) + (l.width * canvas.width) / 2,
    y: dx * Math.sin(a) + dy * Math.cos(a) + (l.height * canvas.height) / 2,
  };
}
canvas.onpointerdown = (e) => {
  if (!current) return;
  const p = point(e),
    l = [...current.layers].reverse().find((l) => {
      if (l.hidden || l.locked) return false;
      const q = inLayer(l, p);
      return (
        q.x >= 0 &&
        q.x <= l.width * canvas.width + 10 &&
        q.y >= 0 &&
        q.y <= l.height * canvas.height + 10
      );
    });
  selected = l?.id || null;
  renderLayers();
  renderInspector();
  draw();
  if (!l) return;
  $('[data-tab="design"]').click();
  const q = inLayer(l, p);
  drag = {
    id: l.id,
    start: p,
    base: structuredClone(l),
    resize:
      Math.abs(q.x - l.width * canvas.width) < 25 &&
      Math.abs(q.y - l.height * canvas.height) < 25,
  };
  canvas.setPointerCapture(e.pointerId);
};
canvas.onpointermove = (e) => {
  if (!drag) return;
  const l = current.layers.find((l) => l.id === drag.id);
  if (!l) return;
  const p = point(e),
    dx = p.x - drag.start.x,
    dy = p.y - drag.start.y,
    b = drag.base;
  if (drag.resize) {
    const a = (-b.rotation * Math.PI) / 180;
    const dw = dx * Math.cos(a) - dy * Math.sin(a),
      dh = dx * Math.sin(a) + dy * Math.cos(a);
    l.width = Math.min(3, Math.max(0.01, b.width + dw / canvas.width));
    l.height = Math.min(3, Math.max(0.01, b.height + dh / canvas.height));
    // Keep the opposite corner anchored when resizing a rotated layer.
    const widthDelta = (l.width - b.width) * canvas.width;
    const heightDelta = (l.height - b.height) * canvas.height;
    l.x =
      b.x +
      (Math.cos(a) * widthDelta + Math.sin(a) * heightDelta - widthDelta) /
        (2 * canvas.width);
    l.y =
      b.y +
      (-Math.sin(a) * widthDelta + Math.cos(a) * heightDelta - heightDelta) /
        (2 * canvas.height);
  } else {
    l.x = Math.min(2, Math.max(-2, b.x + dx / canvas.width));
    l.y = Math.min(2, Math.max(-2, b.y + dy / canvas.height));
  }
  changed();
};
function endDrag() {
  if (drag) {
    drag = null;
    renderInspector();
  }
}
canvas.onpointerup = endDrag;
canvas.onpointercancel = endDrag;
canvas.onlostpointercapture = endDrag;
window.addEventListener("beforeunload", (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = "";
  }
});
async function init() {
  try {
    await store.open();
    const existing = await store.read();
    if (existing) library = existing;
    else {
      const legacy = localStorage.getItem(store.key);
      let projects;
      if (legacy) {
        try {
          projects = JSON.parse(legacy).map(normalizeProject);
        } catch {
          throw Error(
            "No se pudieron leer tus perfiles anteriores. Se conservaron intactos para recuperarlos.",
          );
        }
      } else projects = seed().map(normalizeProject);
      if (!projects.length) projects = [exampleProject()];
      library = { projects, activeId: projects[0].id };
      await store.write(library);
    }
    library.projects = library.projects.map(normalizeProject);
    library.templates = (library.templates || []).map(normalizeProject);
    ready = true;
    await selectProject(library.activeId || library.projects[0].id);
    $$("[data-safe]").forEach(
      (i) => (i.value = current.safeArea[i.dataset.safe] * 100),
    );
    notice("Proyectos recuperados · guardado automático activo");
  } catch (e) {
    notice(e.message, true);
    $$("button,input,textarea,select").forEach((i) => (i.disabled = true));
  }
}
function fillFormats() {
  $("#customSize").hidden = current.format !== "custom";
  $("#customWidth").value = current.width;
  $("#customHeight").value = current.height;
  $("#formatHelp").textContent =
    current.format === "channel"
      ? "La guía central delimita el área para textos y logos del canal. Sitúa allí lo importante."
      : current.format === "custom"
        ? "Entre 64 y 4096 px por lado. Cambiar el formato conserva las proporciones del diseño."
        : "Cada formato conserva el diseño editable. Puedes duplicarlo antes de adaptarlo.";
}
for (const [id, key] of [
  ["customWidth", "width"],
  ["customHeight", "height"],
])
  $("#" + id).oninput = (e) => {
    if (!e.target.value || !e.target.validity.valid) return;
    current[key] = Number(e.target.value);
    renderInspector();
    changed();
  };
function renderTemplates() {
  const select = $("#templates"),
    previous = select.value,
    templates = library.templates || [];
  select.innerHTML = templates.length
    ? templates
        .map(
          (t) =>
            `<option value="${esc(t.id)}">${esc(t.brand || "Sin marca")} · ${esc(t.name)}</option>`,
        )
        .join("")
    : '<option value="">Aún no hay plantillas</option>';
  if (templates.some((t) => t.id === previous)) select.value = previous;
  $("#useTemplate").disabled = !templates.length;
  $("#deleteTemplate").disabled = !templates.length;
}
$("#saveTemplate").onclick = handle(async () => {
  await flush();
  const snapshot = structuredClone(library),
    template = normalizeProject(current);
  template.id = crypto.randomUUID();
  snapshot.templates = [template, ...(snapshot.templates || [])];
  await queueWrite(snapshot);
  library = snapshot;
  renderTemplates();
  $("#templates").value = template.id;
  notice("Plantilla guardada con marca, fuentes y recursos");
});
$("#useTemplate").onclick = handle(async () => {
  const template = (library.templates || []).find(
    (t) => t.id === $("#templates").value,
  );
  if (!template) return;
  const copy = structuredClone(template);
  copy.id = crypto.randomUUID();
  copy.name += " · nueva portada";
  copy.status = "draft";
  await addProject(copy);
});
$("#deleteTemplate").onclick = handle(async () => {
  const id = $("#templates").value;
  if (
    !id ||
    !confirm(
      "¿Eliminar esta plantilla? Las portadas creadas con ella se conservarán.",
    )
  )
    return;
  await flush();
  const snapshot = structuredClone(library);
  snapshot.templates = snapshot.templates.filter((t) => t.id !== id);
  await queueWrite(snapshot);
  library = snapshot;
  renderTemplates();
  notice("Plantilla eliminada");
});
$("#fontImport").onchange = handle(async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  const ext = file.name.split(".").at(-1).toLowerCase();
  if (!["ttf", "otf", "woff", "woff2"].includes(ext) || file.size > 5_000_000)
    throw Error("Usa una fuente TTF, OTF, WOFF o WOFF2 de hasta 5 MB.");
  if ((current.fonts || []).length >= 12)
    throw Error("Máximo 12 fuentes importadas por proyecto.");
  const id = current.id,
    src = String(await readFile(file)).replace(
      /^data:[^;]*;/,
      "data:font/" + ext + ";",
    ),
    family = "Brand_" + crypto.randomUUID().replaceAll("-", "_");
  const face = new FontFace(family, `url("${src}")`);
  await face.load();
  if (current.id !== id)
    throw Error(
      "Cambió el proyecto durante la carga. Vuelve a importar la fuente.",
    );
  document.fonts.add(face);
  renderer.fonts.set(family + src, Promise.resolve());
  (current.fonts ||= []).push({ family, label: file.name, src });
  const l = current.layers.find((l) => l.id === selected && l.type === "text");
  if (l) l.fontFamily = family;
  fill();
  changed();
});
async function travelHistory(step) {
  const next = historyIndex + step;
  if (next < 0 || next >= history.length) return;
  const p = structuredClone(history[next]);
  await renderer.prepare(p);
  current = p;
  historyIndex = next;
  checkpointTime = 0;
  selected = current.layers.some((l) => l.id === selected) ? selected : null;
  fill();
  changed(false);
  historyButtons();
}
$("#undo").onclick = handle(() => travelHistory(-1));
$("#redo").onclick = handle(() => travelHistory(1));
window.addEventListener("keydown", (e) => {
  const typing = e.target.matches("input,textarea,select");
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
    e.preventDefault();
    save();
  }
  if (!typing && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
    e.preventDefault();
    (e.shiftKey ? $("#redo") : $("#undo")).click();
  }
});

init();
