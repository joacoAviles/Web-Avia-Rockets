export const sizes = {
  vertical: [1080, 1920],
  horizontal: [1280, 720],
  square: [1080, 1080],
  channel: [2560, 1440],
  youtube4k: [3840, 2160],
  portrait: [1080, 1350],
  custom: [1080, 1080],
};
export const fontCatalog = [
  { family: "Arial", label: "Arial" },
  { family: "Georgia", label: "Georgia" },
  { family: "system-ui", label: "Sistema" },
  { family: "Courier New", label: "Courier New" },
  {
    family: "Bebas Neue",
    label: "Bebas Neue · titulares",
    file: "BebasNeue.ttf",
    weight: "400",
  },
  {
    family: "Montserrat",
    label: "Montserrat · versátil",
    file: "Montserrat.ttf",
    weight: "100 900",
  },
  {
    family: "Oswald",
    label: "Oswald · condensada",
    file: "Oswald.ttf",
    weight: "200 700",
  },
  {
    family: "Playfair Display",
    label: "Playfair Display · editorial",
    file: "PlayfairDisplay.ttf",
    weight: "400 900",
  },
];
export function projectSize(p) {
  return p.format === "custom"
    ? [
        Math.round(number(p.width, 1080, 64, 4096)),
        Math.round(number(p.height, 1080, 64, 4096)),
      ]
    : sizes[p.format];
}
export function safeAreaFor(format) {
  return format === "channel"
    ? {
        left: (1 - 1235 / 2048) / 2,
        right: (1 - 1235 / 2048) / 2,
        top: (1 - 338 / 1152) / 2,
        bottom: (1 - 338 / 1152) / 2,
      }
    : {
        left: 0.09,
        right: 0.09,
        top: 0.09,
        bottom: format === "vertical" ? 0.18 : 0.09,
      };
}
const number = (v, fallback, min, max) =>
  Number.isFinite(Number(v))
    ? Math.min(max, Math.max(min, Number(v)))
    : fallback;
const color = (v, fallback = "#ffffff") =>
  /^#[0-9a-f]{6}$/i.test(v) ? v : fallback;
const str = (v, fallback = "", length = 2000) =>
  typeof v === "string" ? v.slice(0, length) : fallback;
export function normalizeProject(input) {
  const p = input?.definition || input;
  if (
    !p ||
    !Array.isArray(p.layers) ||
    !Object.hasOwn(sizes, p.format) ||
    p.layers.length > 100
  )
    throw Error(
      "El archivo no contiene un proyecto de portada válido (máximo 100 capas).",
    );
  const ids = new Set();
  const fonts = (p.fonts || []).map((f) => {
    if (
      !/^Brand_[a-zA-Z0-9_-]+$/.test(f.family) ||
      !/^data:(?:font\/(?:ttf|otf|woff|woff2)|application\/(?:octet-stream|x-font-ttf|x-font-opentype|font-woff));base64,[a-z0-9+/=]+$/i.test(
        f.src,
      ) ||
      f.src.length > 7_000_000
    )
      throw Error("Fuente de marca no válida.");
    return {
      family: f.family,
      label: str(f.label, "Fuente de marca", 120),
      src: f.src,
    };
  });
  if (fonts.length > 12)
    throw Error("Máximo 12 fuentes importadas por proyecto.");
  const families = new Set([
    ...fontCatalog.map((f) => f.family),
    ...fonts.map((f) => f.family),
  ]);
  return {
    version: 3,
    brand: str(p.brand, "", 120),
    fonts,
    width: Math.round(number(p.width, 1080, 64, 4096)),
    height: Math.round(number(p.height, 1080, 64, 4096)),
    id: str(input.id || p.id),
    name: str(p.name, "Sin título", 120),
    network: str(p.network, "Personalizado", 120),
    status: str(p.status, "draft", 30),
    format: p.format,
    background: color(p.background, "#071426"),
    texts: {
      title: str(p.texts?.title, "START BROKEN."),
      subtitle: str(p.texts?.subtitle, "finish sharp"),
    },
    safeArea: Object.fromEntries(
      ["left", "top", "right", "bottom"].map((k) => [
        k,
        number(p.safeArea?.[k], 0.1, 0, 0.45),
      ]),
    ),
    layers: p.layers.map((l, i) => {
      if (
        !["text", "rect", "line", "grid", "topography", "image"].includes(
          l.type,
        )
      )
        throw Error("Tipo de capa no compatible.");
      if (
        l.src &&
        !/^data:image\/(png|jpeg|webp|svg\+xml);base64,[a-z0-9+/=\s]+$/i.test(
          l.src,
        )
      )
        throw Error("Las imágenes deben estar incluidas dentro del proyecto.");
      const id = str(l.id, `layer-${i}`, 100);
      if (ids.has(id))
        throw Error("El proyecto contiene identificadores de capa repetidos.");
      ids.add(id);
      return {
        id,
        type: l.type,
        name: str(l.name, l.type, 120),
        x: number(l.x, 0.1, -2, 2),
        y: number(l.y, 0.1, -2, 2),
        width: number(l.width, 0.5, 0.01, 3),
        height: number(l.height, 0.2, 0.01, 3),
        color: color(l.color),
        opacity: number(l.opacity, 1, 0, 1),
        rotation: number(l.rotation, 0, -360, 360),
        fontFamily: families.has(l.fontFamily) ? l.fontFamily : "Arial",
        italic: !!l.italic,
        autoFit: l.autoFit !== false,
        lineHeight: number(l.lineHeight, 1.16, 0.6, 3),
        letterSpacing: number(l.letterSpacing, 0, -10, 100),
        hidden: !!l.hidden,
        locked: !!l.locked,
        fontWeight: String(number(l.fontWeight, 700, 100, 900)),
        fontSize: number(l.fontSize, 0.08, 0.0002, 64),
        align: ["left", "center", "right"].includes(l.align) ? l.align : "left",
        textSlot: ["title", "subtitle", "literal"].includes(l.textSlot)
          ? l.textSlot
          : "literal",
        text: str(l.text, "Texto"),
        strokeColor: color(l.strokeColor, "#000000"),
        strokeWidth: number(l.strokeWidth, 0, 0, 0.05),
        spacing: number(l.spacing, 0.08, 0.01, 0.5),
        src: str(l.src, "", 15_000_000),
        shadow: {
          enabled: !!l.shadow?.enabled,
          color: color(l.shadow?.color, "#000000"),
          opacity: number(l.shadow?.opacity, 0.4, 0, 1),
          blur: number(l.shadow?.blur, 12, 0, 100),
          x: number(l.shadow?.x, 8, -200, 200),
          y: number(l.shadow?.y, 8, -200, 200),
          repeat: Math.round(number(l.shadow?.repeat, 1, 1, 24)),
        },
      };
    }),
  };
}
export function newLayer(type, extra = {}) {
  return normalizeProject({
    format: "square",
    layers: [
      {
        id: crypto.randomUUID(),
        type,
        name: {
          text: "Texto",
          rect: "Forma",
          grid: "Malla",
          topography: "Topografía",
          image: "Imagen / logo",
        }[type],
        x: 0.15,
        y: 0.2,
        width: 0.6,
        height: 0.2,
        color: "#ffffff",
        autoFit: false,
        text: "Texto",
        ...extra,
      },
    ],
  }).layers[0];
}
export function exampleProject() {
  return normalizeProject({
    id: crypto.randomUUID(),
    name: "hola · chao",
    format: "square",
    background: "#071426",
    texts: { title: "hola", subtitle: "chao" },
    safeArea: { left: 0.09, top: 0.09, right: 0.09, bottom: 0.09 },
    layers: [
      newLayer("grid", {
        name: "Malla azul",
        x: 0,
        y: 0,
        width: 1,
        height: 1,
        color: "#47a3ff",
        opacity: 0.1,
        spacing: 0.08,
      }),
      newLayer("rect", {
        name: "Acento AVIA",
        x: 0.1,
        y: 0.18,
        width: 0.09,
        height: 0.009,
        color: "#47a3ff",
      }),
      newLayer("text", {
        name: "Título",
        x: 0.1,
        y: 0.27,
        width: 0.8,
        height: 0.22,
        textSlot: "title",
        fontSize: 0.2,
        shadow: {
          enabled: true,
          color: "#0a6cff",
          opacity: 0.25,
          blur: 4,
          x: 3,
          y: 5,
          repeat: 12,
        },
      }),
      newLayer("text", {
        name: "Subtítulo",
        x: 0.1,
        y: 0.53,
        width: 0.8,
        height: 0.18,
        textSlot: "subtitle",
        fontSize: 0.15,
        color: "#8cc8ff",
        shadow: {
          enabled: true,
          color: "#000000",
          opacity: 0.35,
          blur: 18,
          x: 8,
          y: 12,
          repeat: 1,
        },
      }),
      newLayer("text", {
        name: "Firma",
        x: 0.1,
        y: 0.84,
        width: 0.8,
        height: 0.05,
        text: "AVIA LABS / ESTUDIO CREATIVO",
        fontSize: 0.02,
        color: "#9fb0c9",
      }),
    ],
  });
}
export class ProjectStore {
  constructor(email) {
    this.email = email;
    this.key = `avia_portada_profiles_v1:${email}`;
  }
  async open() {
    this.db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("avia-portadas", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("libraries");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async read() {
    return new Promise((resolve, reject) => {
      const r = this.db
        .transaction("libraries")
        .objectStore("libraries")
        .get(this.email);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  async write(value) {
    // Resolve on transaction commit, not request success: quota failures must remain visible.
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction("libraries", "readwrite");
      tx.objectStore("libraries").put(structuredClone(value), this.email);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || Error("No se pudo guardar."));
    });
  }
}
export class CoverRenderer {
  constructor() {
    this.images = new Map();
    this.fonts = new Map();
  }
  async prepare(project) {
    const families = new Set(
      project.layers.filter((l) => l.type === "text").map((l) => l.fontFamily),
    );
    await Promise.all(
      [...fontCatalog, ...(project.fonts || [])]
        .filter((f) => families.has(f.family) && (f.file || f.src))
        .map((f) => {
          const key = f.family + (f.src || f.file);
          if (!this.fonts.has(key))
            this.fonts.set(
              key,
              (async () => {
                const source =
                  f.src ||
                  new URL("assets/fonts/portada/" + f.file, import.meta.url)
                    .href;
                const face = new FontFace(f.family, `url("${source}")`, {
                  weight: f.weight || "400",
                });
                await face.load();
                document.fonts.add(face);
              })(),
            );
          return this.fonts.get(key);
        }),
    );
    await Promise.all(
      project.layers
        .filter((l) => l.type === "image" && l.src)
        .map((l) => {
          if (!this.images.has(l.src)) {
            const promise = new Promise((resolve, reject) => {
              const im = new Image();
              im.onload = () => resolve(im);
              im.onerror = () =>
                reject(Error(`No se pudo cargar la imagen «${l.name}».`));
              im.src = l.src;
            });
            this.images.set(l.src, { promise, image: null });
            promise.then(
              (im) => {
                this.images.get(l.src).image = im;
              },
              () => {},
            );
          }
          return this.images.get(l.src).promise;
        }),
    );
  }
  render(canvas, p, { guides = false, selected = null } = {}) {
    [canvas.width, canvas.height] = projectSize(p);
    const ctx = canvas.getContext("2d"),
      w = canvas.width,
      h = canvas.height;
    ctx.fillStyle = p.background;
    ctx.fillRect(0, 0, w, h);
    for (const l of p.layers) {
      if (l.hidden) continue;
      ctx.save();
      ctx.globalAlpha = l.opacity;
      const W = l.width * w,
        H = l.height * h;
      ctx.translate((l.x + l.width / 2) * w, (l.y + l.height / 2) * h);
      ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.translate(-W / 2, -H / 2);
      ctx.fillStyle = l.color;
      ctx.strokeStyle = l.color;
      if (l.type === "rect" || l.type === "line") ctx.fillRect(0, 0, W, H);
      if (l.type === "grid") {
        ctx.lineWidth = 1;
        for (let i = 0; i <= 1; i += Math.max(0.01, l.spacing)) {
          ctx.beginPath();
          ctx.moveTo(i * W, 0);
          ctx.lineTo(i * W, H);
          ctx.moveTo(0, i * H);
          ctx.lineTo(W, i * H);
          ctx.stroke();
        }
      }
      if (l.type === "topography") {
        ctx.lineWidth = 2;
        for (let i = 1; i < 12; i++) {
          ctx.beginPath();
          ctx.ellipse(
            W,
            H,
            (W * i) / 12,
            (H * i) / 12,
            0,
            Math.PI,
            Math.PI * 1.5,
          );
          ctx.stroke();
        }
      }
      if (l.type === "image" && l.src) {
        const im = this.images.get(l.src)?.image;
        if (im) ctx.drawImage(im, 0, 0, W, H);
      }
      if (l.type === "text") this.text(ctx, l, p.texts, W, H, h, w);
      ctx.restore();
    }
    if (guides) {
      const s = p.safeArea;
      ctx.save();
      ctx.strokeStyle = "#8cc8ff";
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = 2;
      ctx.setLineDash([12, 10]);
      ctx.strokeRect(
        s.left * w,
        s.top * h,
        (1 - s.left - s.right) * w,
        (1 - s.top - s.bottom) * h,
      );
      ctx.restore();
    }
    const l = p.layers.find((l) => l.id === selected);
    if (l) {
      ctx.save();
      ctx.translate((l.x + l.width / 2) * w, (l.y + l.height / 2) * h);
      ctx.rotate((l.rotation * Math.PI) / 180);
      ctx.strokeStyle = "#47a3ff";
      ctx.lineWidth = 3;
      ctx.strokeRect(
        (-l.width * w) / 2,
        (-l.height * h) / 2,
        l.width * w,
        l.height * h,
      );
      ctx.fillStyle = "#47a3ff";
      ctx.fillRect((l.width * w) / 2 - 8, (l.height * h) / 2 - 8, 16, 16);
      ctx.restore();
    }
  }
  text(ctx, l, texts, W, H, h, w) {
    const value = l.textSlot === "literal" ? l.text : texts[l.textSlot];
    let size = Math.max(1, l.fontSize * h),
      lines;
    const wrap = () => {
      ctx.font = `${l.italic ? "italic " : ""}${l.fontWeight} ${size}px ${l.fontFamily === "system-ui" ? "system-ui" : `"${l.fontFamily}"`}`;
      ctx.letterSpacing = `${l.letterSpacing || 0}px`;
      const out = [];
      for (const paragraph of value.split("\n")) {
        let line = "";
        for (const char of paragraph) {
          if (line && ctx.measureText(line + char).width > W) {
            out.push(line);
            line = "";
          }
          line += char;
        }
        out.push(line);
      }
      return out;
    };
    lines = wrap();
    for (
      let tries = 0;
      l.autoFit && lines.length * size * l.lineHeight > H && tries < 16;
      tries++
    ) {
      size *= 0.85;
      lines = wrap();
    }
    ctx.textBaseline = "top";
    ctx.textAlign = l.align;
    ctx.lineJoin = "round";
    const ax = l.align === "center" ? W / 2 : l.align === "right" ? W : 0;
    const draw = (dx = 0, dy = 0, stroke = false) =>
      lines.forEach((line, i) =>
        stroke
          ? ctx.strokeText(line, ax + dx, i * size * l.lineHeight + dy)
          : ctx.fillText(line, ax + dx, i * size * l.lineHeight + dy),
      );
    if (l.shadow.enabled && l.shadow.opacity > 0) {
      ctx.save();
      ctx.fillStyle = l.shadow.color;
      ctx.globalAlpha = l.opacity * l.shadow.opacity;
      ctx.filter = `blur(${(l.shadow.blur * w) / 1080}px)`;
      for (let i = l.shadow.repeat; i >= 1; i--)
        draw((l.shadow.x * i * w) / 1080, (l.shadow.y * i * w) / 1080);
      ctx.restore();
    }
    if (l.strokeWidth) {
      ctx.strokeStyle = l.strokeColor;
      ctx.lineWidth = l.strokeWidth * w;
      draw(0, 0, true);
    }
    ctx.fillStyle = l.color;
    draw();
  }
}
