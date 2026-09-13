const layer = (id, type, name, x, y, width, height, color, extra = {}) => ({
  id,
  type,
  name,
  x,
  y,
  width,
  height,
  color,
  opacity: 1,
  rotation: 0,
  fontFamily: "Arial",
  fontWeight: "800",
  fontSize: 0.08,
  align: "left",
  textSlot: "literal",
  text: "",
  strokeColor: "#000000",
  strokeWidth: 0,
  spacing: 0.08,
  src: "",
  ...extra,
});

const JOACO_ADMIN = "admin@aviarockets.cl";
const JOACO_YELLOW = "#FFC400";
const JOACO_WHITE = "#F5F5F5";
const JOACO_BLACK = "#0B0B0B";
const JOACO_BLUE = "#2F6BFF";
const JOACO_GRAY = "#1F2937";

const joacoBase = ({ id, name, format = "vertical", network = "JoacoAvia", background = JOACO_BLACK, safeArea, layers = [] }) => ({
  id,
  owner_email: JOACO_ADMIN,
  status: "published",
  definition: {
    name: `Joaco · ${name}`,
    brand: "Joaco Avia",
    network,
    format,
    status: "published",
    background,
    safeArea: safeArea || { left: 0.09, top: 0.09, right: 0.1, bottom: 0.18 },
    layers,
  },
});

const joacoSignature = (id = "joaco-logo") => [
  layer(`${id}-word`, "text", "Joaco · firma blanca", 0.08, 0.72, 0.48, 0.11, JOACO_WHITE, {
    text: "Joaco",
    fontFamily: "Georgia, Playfair Display, serif",
    fontWeight: "700",
    fontSize: 0.085,
  }),
  layer(`${id}-underline`, "line", "Joaco · subrayado amarillo", 0.09, 0.835, 0.34, 0.012, JOACO_YELLOW, {
    opacity: 1,
  }),
];

export const seed = () => [
  joacoBase({
    id: "joaco-brand-base",
    name: "Base · Topografía",
    layers: [
      layer("joaco-base-grid", "grid", "Joaco · malla técnica", 0.04, 0.04, 0.92, 0.9, JOACO_WHITE, { opacity: 0.055 }),
      layer("joaco-base-topo-a", "topography", "Joaco · topografía baja", 0.02, 0.58, 0.96, 0.37, JOACO_WHITE, { opacity: 0.19 }),
      layer("joaco-base-topo-b", "topography", "Joaco · topografía lateral", 0.62, 0.04, 0.34, 0.28, JOACO_YELLOW, { opacity: 0.12, rotation: -7 }),
      layer("joaco-base-title", "text", "Joaco · título", 0.09, 0.15, 0.8, 0.24, JOACO_WHITE, {
        textSlot: "title",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.135,
      }),
      layer("joaco-base-sub", "text", "Joaco · subtítulo", 0.09, 0.4, 0.72, 0.12, JOACO_YELLOW, {
        textSlot: "subtitle",
        fontFamily: "Montserrat, Arial",
        fontSize: 0.047,
      }),
      ...joacoSignature("joaco-base-logo"),
    ],
  }),

  joacoBase({
    id: "joaco-discipline-lines",
    name: "Discipline · Líneas topográficas",
    background: "#101010",
    layers: [
      layer("joaco-discipline-grid", "grid", "Joaco · retícula fina", 0.03, 0.03, 0.94, 0.94, JOACO_WHITE, { opacity: 0.045 }),
      layer("joaco-discipline-topo-left", "topography", "Joaco · geografía izquierda", 0.02, 0.08, 0.52, 0.34, "#D9D2C3", { opacity: 0.34 }),
      layer("joaco-discipline-topo-bottom", "topography", "Joaco · geografía inferior", 0.38, 0.62, 0.6, 0.31, "#D9D2C3", { opacity: 0.2, rotation: 5 }),
      layer("joaco-discipline-line-yellow", "line", "Joaco · línea amarilla", 0.08, 0.52, 0.3, 0.01, JOACO_YELLOW, {}),
      layer("joaco-discipline-title", "text", "Joaco · disciplina", 0.09, 0.43, 0.82, 0.18, JOACO_WHITE, {
        textSlot: "title",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.12,
      }),
      layer("joaco-discipline-sub", "text", "Joaco · frase secundaria", 0.09, 0.6, 0.74, 0.1, "#D9D2C3", {
        textSlot: "subtitle",
        fontFamily: "Montserrat, Arial",
        fontSize: 0.036,
        spacing: 0.16,
      }),
      ...joacoSignature("joaco-discipline-logo"),
    ],
  }),

  joacoBase({
    id: "joaco-editorial-grid",
    name: "Editorial · Grid",
    layers: [
      layer("joaco-editorial-grid-a", "grid", "Joaco · grid completo", 0.02, 0.02, 0.96, 0.96, JOACO_WHITE, { opacity: 0.07 }),
      layer("joaco-editorial-rect", "rect", "Joaco · bloque editorial", 0.07, 0.12, 0.86, 0.5, "#111111", { opacity: 0.82, strokeColor: "#FFFFFF", strokeWidth: 0.001 }),
      layer("joaco-editorial-title", "text", "Joaco · título editorial", 0.1, 0.17, 0.8, 0.25, JOACO_WHITE, {
        textSlot: "title",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.13,
      }),
      layer("joaco-editorial-accent", "line", "Joaco · acento amarillo", 0.1, 0.45, 0.24, 0.012, JOACO_YELLOW, {}),
      layer("joaco-editorial-sub", "text", "Joaco · texto editorial", 0.1, 0.49, 0.72, 0.1, JOACO_WHITE, {
        textSlot: "subtitle",
        fontFamily: "Montserrat, Arial",
        fontSize: 0.035,
      }),
      layer("joaco-editorial-topo", "topography", "Joaco · mapa esquina", 0.56, 0.64, 0.4, 0.29, JOACO_WHITE, { opacity: 0.17 }),
      ...joacoSignature("joaco-editorial-logo"),
    ],
  }),

  joacoBase({
    id: "joaco-sticker",
    name: "Sticker · Badge",
    format: "square",
    network: "Instagram",
    safeArea: { left: 0.08, top: 0.08, right: 0.08, bottom: 0.08 },
    layers: [
      layer("joaco-sticker-grid", "grid", "Joaco · fondo técnico", 0, 0, 1, 1, JOACO_WHITE, { opacity: 0.055 }),
      layer("joaco-sticker-topo", "topography", "Joaco · topografía fondo", 0, 0.52, 1, 0.48, JOACO_WHITE, { opacity: 0.14 }),
      layer("joaco-sticker-frame", "rect", "Joaco · marco sticker", 0.08, 0.13, 0.84, 0.7, JOACO_BLACK, { strokeColor: JOACO_WHITE, strokeWidth: 0.008 }),
      layer("joaco-sticker-title", "text", "Joaco · mensaje", 0.13, 0.26, 0.74, 0.24, JOACO_WHITE, {
        textSlot: "title",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.135,
        align: "center",
      }),
      layer("joaco-sticker-yellow", "rect", "Joaco · franja amarilla", 0.15, 0.55, 0.7, 0.16, JOACO_YELLOW, {}),
      layer("joaco-sticker-sub", "text", "Joaco · remate", 0.17, 0.56, 0.66, 0.13, JOACO_BLACK, {
        textSlot: "subtitle",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.075,
        align: "center",
      }),
    ],
  }),

  joacoBase({
    id: "joaco-no-compres-crea",
    name: "Frase · No compres, crea",
    format: "square",
    network: "Instagram",
    safeArea: { left: 0.08, top: 0.08, right: 0.08, bottom: 0.08 },
    layers: [
      layer("joaco-ncc-grid", "grid", "Joaco · grid oscuro", 0, 0, 1, 1, JOACO_WHITE, { opacity: 0.045 }),
      layer("joaco-ncc-topo", "topography", "Joaco · topografía diagonal", 0.03, 0.08, 0.94, 0.82, JOACO_WHITE, { opacity: 0.11, rotation: -6 }),
      layer("joaco-ncc-title", "text", "Joaco · No compres", 0.12, 0.27, 0.76, 0.2, JOACO_WHITE, {
        text: "NO COMPRES,",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.13,
        align: "center",
      }),
      layer("joaco-ncc-crea", "text", "Joaco · Crea", 0.1, 0.45, 0.8, 0.24, JOACO_YELLOW, {
        text: "CREA",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.18,
        align: "center",
      }),
      layer("joaco-ncc-line", "line", "Joaco · subrayado CREA", 0.25, 0.69, 0.5, 0.012, JOACO_YELLOW, {}),
      ...joacoSignature("joaco-ncc-logo"),
    ],
  }),

  joacoBase({
    id: "joaco-tech-blue",
    name: "Tech · Acento azul",
    background: "#08111F",
    layers: [
      layer("joaco-tech-grid", "grid", "Joaco · grid azul", 0.02, 0.02, 0.96, 0.96, JOACO_BLUE, { opacity: 0.08 }),
      layer("joaco-tech-topo", "topography", "Joaco · geografía azul", 0.48, 0.56, 0.5, 0.36, JOACO_BLUE, { opacity: 0.28 }),
      layer("joaco-tech-line-blue", "line", "Joaco · línea azul", 0.08, 0.14, 0.18, 0.01, JOACO_BLUE, {}),
      layer("joaco-tech-title", "text", "Joaco · título tech", 0.08, 0.2, 0.82, 0.24, JOACO_WHITE, {
        textSlot: "title",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.13,
      }),
      layer("joaco-tech-sub", "text", "Joaco · subtítulo tech", 0.08, 0.46, 0.72, 0.12, JOACO_YELLOW, {
        textSlot: "subtitle",
        fontFamily: "Montserrat, Arial",
        fontSize: 0.045,
      }),
      ...joacoSignature("joaco-tech-logo"),
    ],
  }),

  joacoBase({
    id: "joaco-youtube-banner",
    name: "YouTube · Banner",
    format: "channel",
    network: "YouTube",
    safeArea: { left: 0.18, top: 0.28, right: 0.18, bottom: 0.28 },
    layers: [
      layer("joaco-yt-grid", "grid", "Joaco · malla banner", 0.02, 0.05, 0.96, 0.9, JOACO_WHITE, { opacity: 0.05 }),
      layer("joaco-yt-topo-left", "topography", "Joaco · topografía izquierda", 0.01, 0.14, 0.38, 0.72, JOACO_WHITE, { opacity: 0.14 }),
      layer("joaco-yt-topo-right", "topography", "Joaco · topografía derecha", 0.61, 0.14, 0.38, 0.72, JOACO_YELLOW, { opacity: 0.13 }),
      layer("joaco-yt-title", "text", "Joaco · JOACO banner", 0.31, 0.36, 0.38, 0.16, JOACO_WHITE, {
        text: "JOACO",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.12,
        align: "center",
      }),
      layer("joaco-yt-line", "line", "Joaco · línea amarilla banner", 0.39, 0.55, 0.22, 0.012, JOACO_YELLOW, {}),
      layer("joaco-yt-sub", "text", "Joaco · claim banner", 0.31, 0.59, 0.38, 0.08, JOACO_WHITE, {
        text: "IDEAS, PROYECTOS Y VIDA EN MOVIMIENTO.",
        fontFamily: "Montserrat, Arial",
        fontSize: 0.028,
        align: "center",
        spacing: 0.12,
      }),
    ],
  }),

  joacoBase({
    id: "joaco-instagram-reel",
    name: "Instagram · Reel",
    network: "Instagram",
    layers: [
      layer("joaco-reel-grid", "grid", "Joaco · grid reel", 0.03, 0.03, 0.94, 0.94, JOACO_WHITE, { opacity: 0.04 }),
      layer("joaco-reel-topo", "topography", "Joaco · topografía reel", 0.0, 0.6, 1.0, 0.36, JOACO_WHITE, { opacity: 0.18 }),
      layer("joaco-reel-title", "text", "Joaco · título reel", 0.08, 0.19, 0.78, 0.26, JOACO_WHITE, {
        textSlot: "title",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.14,
      }),
      layer("joaco-reel-highlight", "rect", "Joaco · franja amarilla", 0.08, 0.48, 0.42, 0.1, JOACO_YELLOW, {}),
      layer("joaco-reel-sub", "text", "Joaco · subtítulo reel", 0.095, 0.49, 0.39, 0.08, JOACO_BLACK, {
        textSlot: "subtitle",
        fontFamily: "Bebas Neue, Oswald, Arial",
        fontSize: 0.052,
      }),
      ...joacoSignature("joaco-reel-logo"),
    ],
  }),

  {
    id: "youtube",
    owner_email: "system",
    status: "published",
    definition: {
      name: "YouTube · Impacto",
      network: "YouTube",
      format: "horizontal",
      status: "published",
      background: "#0d1117",
      safeArea: { left: 0.12, top: 0.12, right: 0.12, bottom: 0.12 },
      layers: [
        layer("yt-title", "text", "Título", 0.12, 0.28, 0.76, 0.25, "#ffffff", { textSlot: "title", fontSize: 0.13, align: "center", strokeWidth: 0.008 }),
        layer("yt-sub", "text", "Subtítulo", 0.18, 0.58, 0.64, 0.12, "#ffd34d", { textSlot: "subtitle", fontSize: 0.065, align: "center" }),
      ],
    },
  },
  {
    id: "tiktok",
    owner_email: "system",
    status: "published",
    definition: {
      name: "TikTok / Reels · Limpio",
      network: "TikTok",
      format: "vertical",
      status: "published",
      background: JOACO_GRAY,
      safeArea: { left: 0.1, top: 0.1, right: 0.16, bottom: 0.18 },
      layers: [
        layer("tk-title", "text", "Título", 0.1, 0.28, 0.74, 0.24, "#f5f7fb", { textSlot: "title", fontSize: 0.1 }),
        layer("tk-sub", "text", "Subtítulo", 0.1, 0.59, 0.7, 0.14, "#73d2de", { textSlot: "subtitle", fontSize: 0.052 }),
      ],
    },
  },
  {
    id: "instagram",
    owner_email: "system",
    status: "published",
    definition: {
      name: "Instagram · Premium",
      network: "Instagram",
      format: "square",
      status: "published",
      background: "#12100e",
      safeArea: { left: 0.12, top: 0.12, right: 0.12, bottom: 0.12 },
      layers: [
        layer("ig-title", "text", "Título", 0.12, 0.3, 0.76, 0.22, "#f6f1e8", { textSlot: "title", fontFamily: "Georgia", fontSize: 0.095, align: "center" }),
        layer("ig-sub", "text", "Subtítulo", 0.17, 0.57, 0.66, 0.14, "#e7b66b", { textSlot: "subtitle", fontFamily: "Georgia", fontSize: 0.05, align: "center" }),
      ],
    },
  },
];
