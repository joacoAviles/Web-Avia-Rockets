"use strict";
const $ = (id) => document.getElementById(id),
  fmt = (v, d = 2) =>
    v == null
      ? "—"
      : Number(v).toLocaleString("es-CL", { maximumFractionDigits: d }),
  money = (v) =>
    v == null ? "—" : "$" + fmt(v, v !== 0 && Math.abs(v) < 0.01 ? 6 : 2),
  pct = (v) => (v == null ? "—" : (v > 0 ? "+" : "") + fmt(v) + "%"),
  cls = (v) => (v > 0 ? "pos" : v < 0 ? "neg" : "muted");
const labels = {
  market: "Mercado chileno",
  chart: "Gráficos",
  screener: "Screener",
  research: "Información financiera",
  models: "Modelos",
  lists: "Mis listas",
  portfolio: "Cartera y registro",
  wealth: "Patrimonio",
  signals: "Señales",
  alerts: "Alertas",
  orders: "Órdenes · Zesty",
  map: "Mapa y fuentes",
};
const S = {
  page: "market",
  quotes: [],
  symbol: "CHILE.SN",
  bars: [],
  analysis: null,
  compare: [],
  lists: [],
  ledger: [],
  zoom: 180,
  draw: false,
  drawings: {},
  catalog: null,
  loadId: 0,
};
function el(tag, txt, parent, attrs = {}) {
  const n = document.createElement(tag);
  if (txt != null) n.textContent = txt;
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  if (parent) parent.append(n);
  return n;
}
function clear(id) {
  const n = typeof id === "string" ? $(id) : id;
  n.replaceChildren();
  return n;
}
function toast(message) {
  $("notice").textContent = message;
  $("notice").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("notice").hidden = true), 7000);
}
async function api(path, body) {
  const r = await fetch(
    "/api" + path,
    body === undefined
      ? {}
      : {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
  );
  if (!r.ok && (r.status >= 500 || r.status === 404)) {
    const message = "El servicio de cuentas y modelos no responde. Puedes consultar los precios disponibles, pero no confirmar cambios en tu cartera.";
    $('api-status').textContent = message;
    $('api-status').hidden = false;
    throw Error(message);
  }
  if (!(r.headers.get('content-type') || '').includes('application/json'))
    throw Error(r.status === 401 ? 'Inicia sesión para consultar tus datos.' : 'La API devolvió una respuesta no válida.');
  const v = await r.json();
  if (!r.ok) throw Error(v.error || "No se pudo completar");
  return v;
}
function action(fn) {
  return async (e) => {
    try {
      await fn(e);
    } catch (x) {
      toast(x.message);
    }
  };
}
function on(id, fn, event = "click") {
  $(id).addEventListener(event, action(fn));
}
function table(parent, heads, rows) {
  clear(parent);
  const t = el("table", null, parent),
    h = el("tr", null, el("thead", null, t));
  heads.forEach((x) => el("th", x, h));
  const b = el("tbody", null, t);
  rows.forEach((cells) => {
    const r = el("tr", null, b);
    cells.forEach((v) => {
      const td = el("td", null, r);
      if (v instanceof Node) td.append(v);
      else td.textContent = v == null ? "—" : v;
    });
  });
  if (!rows.length)
    el("p", "Sin registros para esta selección.", parent, { class: "muted" });
}
function metric(parent, title, value, className = "") {
  const n = el("div", null, parent, { class: "metric" });
  el("small", title, n);
  el("strong", value, n, { class: className });
}
function symbolButton(q) {
  const b = el("button", q.symbol.replace(".SN", ""));
  el("small", q.name || "", b);
  b.onclick = action(() => choose(q.symbol));
  return b;
}
function download(name, rows) {
  if (!rows.length) return toast("No hay datos para exportar");
  const keys = Object.keys(rows[0]);
  const esc = (v) => '"' + String(v ?? "").replaceAll('"', '""') + '"';
  const text = [
    keys.map(esc).join(","),
    ...rows.map((r) => keys.map((k) => esc(r[k])).join(",")),
  ].join("\n");
  const a = el("a", null, null, {
    href: URL.createObjectURL(
      new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8" }),
    ),
    download: name,
  });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function goto(page) {
  S.page = page;
  Object.keys(labels).forEach((k) => {
    $("page-" + k).hidden = k !== page;
    document
      .querySelector(`[data-page="${k}"]`)
      .classList.toggle("active", k === page);
  });
  $("page-title").textContent = labels[page];
  if (page === "chart") renderChart();
  if (page === "research") loadResearch().catch((e) => toast(e.message));
  if (page === "models") {
    loadCatalog().catch((e) => toast(e.message));
    loadRuns().catch((e) => toast(e.message));
    $("model-context").textContent =
      S.symbol + " · " + S.bars.length + " barras cargadas";
  }
  if (page === "wealth") loadWealth().catch(e => toast(e.message));
  if (page === "signals") loadSignals().catch(e => toast(e.message));
  if (page === "portfolio") loadPortfolio().catch((e) => toast(e.message));
  if (page === "alerts") loadAlerts().catch((e) => toast(e.message));
  if (page === "orders") loadDrafts().catch((e) => toast(e.message));
  if (page === "lists") renderLists();
}
Object.entries(labels).forEach(([k, v]) => {
  const b = el("button", v, $("nav"), { "data-page": k });
  b.onclick = () => goto(k);
});
document
  .querySelectorAll("[data-goto]")
  .forEach((b) => (b.onclick = () => goto(b.dataset.goto)));
function selectOptions(n, values, current) {
  clear(n);
  values.forEach((v) => el("option", v.label, n, { value: v.value }));
  if (values.some((v) => v.value === current)) n.value = current;
}
function updateSymbols() {
  const vals = S.quotes.map((q) => ({
    value: q.symbol,
    label:
      q.symbol.replace(".SN", "") +
      (q.name && q.name !== q.symbol ? " · " + q.name : ""),
  }));
  selectOptions($("symbol"), vals, S.symbol);
  selectOptions(
    $("compare"),
    [{ value: "", label: "Comparar…" }, ...vals],
    $("compare").value,
  );
  document
    .querySelectorAll(".symbol-options")
    .forEach((n) => selectOptions(n, vals, n.value || S.symbol));
}
async function loadMarket() {
  const m = await api("/market");
  S.quotes = m.quotes;
  if (typeof applyFeedQuotes === "function") applyFeedQuotes();
  const old = $("symbol").options.length;
  if (!old) updateSymbols();
  S.latestQuoteDate = S.quotes
    .map((q) => q.quote_time?.slice(0, 10))
    .filter(Boolean)
    .sort()
    .at(-1);
  const ok = S.quotes.filter(
    (q) =>
      q.feed_source === "zesty" ? "Zesty · observado " + new Date(q.feed_observed_at).toLocaleString("es-CL") : q.status === "ok" && q.quote_time?.slice(0, 10) === S.latestQuoteDate,
  );
  const sm = clear("summary");
  [
    ["Con datos verificados", `${m.available} / ${m.universe_count}`],
    ["Suben · última sesión", ok.filter((q) => q.change_pct > 0).length],
    ["Bajan · última sesión", ok.filter((q) => q.change_pct < 0).length],
    ["Fuente", m.refreshing ? "Actualizando…" : "Yahoo / ICE"],
  ].forEach(([a, b]) => {
    const n = el("div", null, sm);
    el("span", a, n);
    el("strong", String(b), n);
  });
  $("coverage").textContent = m.refreshing
    ? "Consultando instrumentos…"
    : m.available + " acciones con datos";
  $("footer-status").textContent =
    "Actualización cada 10 min · " +
    (m.updated_at
      ? new Date(m.updated_at).toLocaleString("es-CL")
      : "primera descarga en curso");
  clear("ticker-strip");
  ["CHILE.SN", "SQM-B.SN", "COPEC.SN", "LTM.SN", "BSANTANDER.SN"].forEach(
    (s) => {
      const q = S.quotes.find((x) => x.symbol === s);
      if (q) {
        const b = el("button", null, $("ticker-strip"));
        el("strong", s.replace(".SN", ""), b);
        el("span", money(q.price) + "  " + pct(q.change_pct), b, {
          class: cls(q.change_pct),
        });
        b.onclick = action(() => choose(s));
      }
    },
  );
  renderMarket();
  renderScreener();
  updateFocus();
}
function quoteRows(rows) {
  return rows.map((q) => [
    symbolButton(q),
    typeof feedPrice === "function" ? feedPrice(q) : money(q.price),
    el("span", pct(q.change_pct), null, { class: cls(q.change_pct) }),
    fmt(q.volume, 0),
    q.quote_time
      ? new Date(q.quote_time).toLocaleString("es-CL", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—",
    q.status === "ok"
      ? !q.quote_time
        ? "Sin hora confirmada"
        : q.quote_time.slice(0, 10) === S.latestQuoteDate
          ? "Retrasado"
          : "Última operación anterior"
      : q.status === "stale"
        ? "Obsoleto"
        : q.status === "pending"
          ? "Por consultar"
          : "Sin cobertura",
  ]);
}
function renderMarket() {
  const term = $("search").value.toLowerCase(),
    list = S.lists.find((x) => x.id === $("list-filter").value);
  const rows = S.quotes.filter(
    (q) =>
      (q.symbol + " " + (q.name || "")).toLowerCase().includes(term) &&
      (!list || list.symbols.includes(q.symbol)),
  );
  table(
    $("market-table"),
    ["Acción", "Último CLP", "Cambio", "Volumen", "Hora proveedor", "Estado"],
    quoteRows(rows),
  );
}
function renderScreener() {
  const min = $("min-change").value,
    vol = $("min-volume").value,
    pe = $("max-pe").value,
    k = $("sort").value;
  let rows = S.quotes.filter(
    (q) =>
      q.status === "ok" &&
      (q.feed_source === "zesty" || q.quote_time?.slice(0, 10) === S.latestQuoteDate) &&
      (min === "" || (q.change_pct != null && q.change_pct >= Number(min))) &&
      (vol === "" || (q.volume != null && q.volume >= Number(vol))) &&
      (pe === "" || (q.pe != null && q.pe <= Number(pe))),
  );
  rows.sort((a, b) => {
    if (a[k] == null) return 1;
    if (b[k] == null) return -1;
    return (a[k] - b[k]) * ($("sort-asc").checked ? 1 : -1);
  });
  table(
    $("screen-table"),
    ["Acción", "Precio", "Cambio", "Volumen", "P/E", "Capitalización"],
    rows.map((q) => [
      symbolButton(q),
      typeof feedPrice === "function" ? feedPrice(q) : money(q.price),
      el("span", pct(q.change_pct), null, { class: cls(q.change_pct) }),
      fmt(q.volume, 0),
      fmt(q.pe),
      money(q.market_cap),
    ]),
  );
  clear("heatmap");
  rows.forEach((q) => {
    const b = el("button", q.symbol.replace(".SN", ""), $("heatmap"));
    el("small", pct(q.change_pct), b);
    b.style.background = q.change_pct > 0 ? "#0A6CFF" : "#12213A";
    b.style.borderColor = q.change_pct < 0 ? "#8A95A6" : "#0A6CFF";
    b.onclick = action(() => choose(q.symbol));
  });
}
function updateFocus() {
  const q = S.quotes.find((q) => q.symbol === S.symbol);
  if (!q) return;
  $("focus-name").textContent = q.name || q.symbol;
  $("focus-price").textContent = money(q.price);
  $("focus-meta").textContent =
    q.symbol + " · " + pct(q.change_pct) + " · " + (q.session || "sin datos");
}
async function choose(symbol) {
  S.symbol = symbol;
  if (typeof refreshFeed === "function") refreshFeed();
  $("symbol").value = symbol;
  updateFocus();
  goto("chart");
  await loadBars();
}
on("open-chart", () => choose(S.symbol));
on("search", renderMarket, "input");
on("list-filter", renderMarket, "change");
["min-change", "min-volume", "max-pe"].forEach((x) =>
  on(x, renderScreener, "input"),
);
["sort", "sort-asc"].forEach((x) => on(x, renderScreener, "change"));
on("csv-market", () =>
  download(
    "avia-chile.csv",
    S.quotes.map(
      ({
        symbol,
        name,
        price,
        change_pct,
        volume,
        quote_time,
        status,
        source,
      }) => ({
        symbol,
        name,
        price,
        change_pct,
        volume,
        quote_time,
        status,
        source,
      }),
    ),
  ),
);
on("refresh-market", async () => {
  const refresh = await api("/market/refresh", {});
  toast(refresh.mode === "published_api_snapshot" ? "Consultando últimos precios de la API" : "Actualización solicitada");
  await loadMarket();
});
const NS = "http://www.w3.org/2000/svg";
function svgNode(tag, attrs, parent, text) {
  const n = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
  if (text != null) n.textContent = text;
  parent.append(n);
  return n;
}
function seriesPlot(
  container,
  series,
  { height = 150, color = "#0A6CFF", fixedMin = null, fixedMax = null } = {},
) {
  clear(container);
  const width = 1000,
    pad = 40,
    values = series
      .map((x) => x.value)
      .filter((x) => x != null && Number.isFinite(x));
  if (!values.length) {
    el("p", "Sin datos suficientes.", container, { class: "muted" });
    return;
  }
  let min = fixedMin ?? Math.min(...values),
    max = fixedMax ?? Math.max(...values);
  if (max === min) {
    max += 1;
    min -= 1;
  }
  const svg = svgNode(
    "svg",
    { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none" },
    container,
  );
  for (let i = 0; i < 3; i++) {
    let y = 15 + (i * (height - 30)) / 2;
    svgNode("line", { x1: 0, x2: 940, y1: y, y2: y, stroke: "#071426" }, svg);
    svgNode(
      "text",
      { x: 950, y: y + 3, fill: "#8A95A6", "font-size": 10 },
      svg,
      fmt(max - (i * (max - min)) / 2),
    );
  }
  let path = "",
    last = false;
  series.forEach((p, i) => {
    if (p.value == null) {
      last = false;
      return;
    }
    const x = 10 + (i * (width - pad - 30)) / Math.max(1, series.length - 1),
      y = 15 + ((max - p.value) / (max - min)) * (height - 30);
    path += (last ? "L" : "M") + x + "," + y;
    last = true;
  });
  svgNode(
    "path",
    { d: path, stroke: color, fill: "none", "stroke-width": 1.7 },
    svg,
  );
}
async function loadBars() {
  if ($("chart-data").value === "zesty") {
    ++S.loadId; S.bars=[]; S.analysis=null; S.meta=null;
    clear("osc-chart"); clear("indicator-values");
    $("model-context").textContent="Selecciona histórico OHLC para modelos de velas.";
    await refreshFeed(); renderLiveChart(); return;
  }
  const id = ++S.loadId;
  $("chart-readout").textContent = "Consultando precios…";
  S.analysis = null;
  S.compare = [];
  S.bars = [];
  S.meta = null;
  clear("chart");
  clear("osc-chart");
  clear("indicator-values");
  clear("spark");
  clear("model-metrics");
  clear("model-trades");
  clear("equity-chart");
  $("chart-name").textContent = S.symbol;
  $("chart-meta").textContent = "Consultando instrumento…";
  $("chart-source").textContent = "";
  $("model-context").textContent = S.symbol + " · sin barras cargadas";
  let value;
  try {
    value = await api(
      `/bars?symbol=${encodeURIComponent(S.symbol)}&period=${$("period").value}&interval=${$("interval").value}`,
    );
  } catch (e) {
    if (id === S.loadId) {
      $("chart-readout").textContent = e.message;
      $("chart-meta").textContent = "Sin datos utilizables para este símbolo";
    }
    throw e;
  }
  if (id !== S.loadId) return;
  S.bars = value.bars;
  S.meta = value;
  $("period").value = value.period;
  S.zoom = Math.min(180, S.bars.length);
  $("replay").max = S.bars.length;
  $("replay").value = S.bars.length;
  $("chart-name").textContent = S.symbol;
  const q = S.quotes.find((q) => q.symbol === S.symbol);
  $("chart-meta").textContent = (q?.name || "") + " · CLP · " + value.interval;
  $("chart-source").textContent =
    value.source +
    " · fuente retrasada 15 min · consultado " +
    new Date(value.fetched_at).toLocaleString("es-CL") +
    " · " +
    value.adjustment +
    (value.rejected_bars?.length
      ? " · " + value.rejected_bars.length + " barras inválidas excluidas"
      : "");
  $("model-context").textContent = S.symbol + " · " + S.bars.length + " barras";
  renderChart();
  seriesPlot(
    $("spark"),
    S.bars.slice(-60).map((x) => ({ value: x.close })),
  );
  try {
    const a = await api("/models/technical/analyze", {
      symbol: S.symbol,
      bars: S.bars,
      model: "SMA_CROSS",
    });
    if (id !== S.loadId) return;
    S.analysis = { ...a, trades: [] };
    renderChart();
  } catch (e) {
    toast("Gráfico disponible; indicadores: " + e.message);
  }
  if ($("compare").value) await loadCompare();
}
function renderChart() {
  if ($("chart-data").value === "zesty") { renderLiveChart(); return; }
  if (!S.bars.length) return;
  const end = Number($("replay").value) || S.bars.length,
    start = Math.max(0, end - S.zoom),
    bars = S.bars.slice(start, end);
  if (!bars.length) return;
  const width = 1000,
    height = 390,
    left = 12,
    right = 80,
    top = 22,
    plotH = 270;
  let min = Math.min(...bars.map((x) => x.low)),
    max = Math.max(...bars.map((x) => x.high));
  const indicator = S.analysis?.indicators || {};
  let overlays = [];
  if ($("sma").checked)
    overlays.push(["sma20", "#FFFFFF"], ["sma50", "#8A95A6"]);
  if ($("ema").checked)
    overlays.push(["ema12", "#0A6CFF"], ["ema26", "#FFFFFF"]);
  if ($("bb").checked)
    overlays.push(["bb_upper", "#8A95A6"], ["bb_lower", "#8A95A6"]);
  const byTime = Object.fromEntries(
    overlays.map(([k]) => [
      k,
      new Map((indicator[k] || []).map((x) => [x.time, x.value])),
    ]),
  );
  const compMap = new Map(S.compare.map((x) => [x.time, x.close]));
  let compBase = S.compare.find((x) => x.time >= bars[0].time)?.close;
  const compVals = bars.map((b) =>
    compBase && compMap.has(b.time)
      ? (compMap.get(b.time) / compBase) * bars[0].close
      : null,
  );
  for (const [k] of overlays)
    for (const b of bars) {
      const v = byTime[k].get(b.time);
      if (v != null) {
        min = Math.min(min, v);
        max = Math.max(max, v);
      }
    }
  for (const v of compVals)
    if (v != null) {
      min = Math.min(min, v);
      max = Math.max(max, v);
    }
  const span = Math.max(max - min, max * 0.005);
  min -= span * 0.08;
  max += span * 0.08;
  const x = (i) => left + ((i + 0.5) * (width - left - right)) / bars.length,
    y = (v) => top + ((max - v) / (max - min)) * plotH;
  const box = clear("chart"),
    svg = svgNode(
      "svg",
      { viewBox: `0 0 ${width} ${height}`, preserveAspectRatio: "none" },
      box,
    );
  S.chartScale = { min, max, top, plotH };
  for (let i = 0; i < 6; i++) {
    const val = max - (i * (max - min)) / 5,
      yy = y(val);
    svgNode(
      "line",
      {
        x1: left,
        x2: width - right,
        y1: yy,
        y2: yy,
        stroke: "#071426",
        "stroke-width": 0.7,
      },
      svg,
    );
    svgNode(
      "text",
      { x: width - right + 12, y: yy + 3, fill: "#8A95A6", "font-size": 11 },
      svg,
      fmt(val),
    );
  }
  const maxVol = Math.max(1, ...bars.map((b) => b.volume));
  const barWidth = Math.max(1, ((width - left - right) / bars.length) * 0.65);
  bars.forEach((b, i) => {
    const color = b.close >= b.open ? "#0A6CFF" : "#8A95A6";
    if ($("chart-type").value === "candles") {
      svgNode(
        "line",
        {
          x1: x(i),
          x2: x(i),
          y1: y(b.high),
          y2: y(b.low),
          stroke: color,
          "stroke-width": 1,
        },
        svg,
      );
      svgNode(
        "rect",
        {
          x: x(i) - barWidth / 2,
          y: Math.min(y(b.open), y(b.close)),
          width: barWidth,
          height: Math.max(1, Math.abs(y(b.open) - y(b.close))),
          fill: color,
        },
        svg,
      );
    }
    svgNode(
      "rect",
      {
        x: x(i) - barWidth / 2,
        y: 355 - (b.volume / maxVol) * 43,
        width: barWidth,
        height: (b.volume / maxVol) * 43,
        fill: color,
        opacity: 0.45,
      },
      svg,
    );
  });
  function line(vals, color, dash = "") {
    let d = "",
      last = false;
    vals.forEach((v, i) => {
      if (v == null) {
        last = false;
        return;
      }
      d += (last ? "L" : "M") + x(i) + "," + y(v);
      last = true;
    });
    svgNode(
      "path",
      {
        d,
        stroke: color,
        fill: "none",
        "stroke-width": 1.5,
        "stroke-dasharray": dash,
      },
      svg,
    );
  }
  if ($("chart-type").value === "line")
    line(
      bars.map((b) => b.close),
      "#0A6CFF",
    );
  overlays.forEach(([k, c], index) =>
    line(
      bars.map((b) => byTime[k].get(b.time)),
      c,
      index % 2 ? "5,3" : "",
    ),
  );
  if (S.compare.length) line(compVals, "#FFFFFF", "4,3");
  for (const price of S.drawings[S.symbol] || []) {
    if (price < min || price > max) continue;
    svgNode(
      "line",
      {
        x1: left,
        x2: width - right,
        y1: y(price),
        y2: y(price),
        stroke: "#FFFFFF",
        "stroke-dasharray": "5,4",
      },
      svg,
    );
    svgNode(
      "text",
      { x: 20, y: y(price) - 5, fill: "#FFFFFF", "font-size": 11 },
      svg,
      "Nivel " + fmt(price),
    );
  }
  for (const t of S.analysis?.trades || []) {
    const i = bars.findIndex((b) => b.time === t.time);
    if (i < 0) continue;
    const yy = y(t.price);
    svgNode(
      "circle",
      {
        cx: x(i),
        cy: yy,
        r: 3.5,
        fill: t.side === "buy" ? "#0A6CFF" : "#8A95A6",
        stroke: "#071426",
      },
      svg,
    );
    svgNode(
      "text",
      {
        x: x(i),
        y: yy + (t.side === "buy" ? 15 : -9),
        fill: t.side === "buy" ? "#0A6CFF" : "#8A95A6",
        "font-size": 9,
        "text-anchor": "middle",
      },
      svg,
      t.side === "buy" ? "B" : "S",
    );
  }
  for (let j = 0; j < 5; j++) {
    const i = Math.round((j * (bars.length - 1)) / 4);
    svgNode(
      "text",
      {
        x: x(i),
        y: 377,
        fill: "#8A95A6",
        "font-size": 10,
        "text-anchor": "middle",
      },
      svg,
      new Date(bars[i].time * 1000).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "short",
      }),
    );
  }
  const read = (b) =>
    ($("chart-readout").textContent =
      new Date(b.time * 1000).toLocaleString("es-CL") +
      `  O ${fmt(b.open)}  H ${fmt(b.high)}  L ${fmt(b.low)}  C ${fmt(b.close)}  Vol ${fmt(b.volume, 0)}` +
      (S.compare.length
        ? " · Comparación normalizada al primer precio visible"
        : ""));
  read(bars.at(-1));
  svg.onmousemove = (e) => {
    const px =
      ((e.clientX - svg.getBoundingClientRect().left) /
        svg.getBoundingClientRect().width) *
      width;
    const i = Math.max(
      0,
      Math.min(
        bars.length - 1,
        Math.floor(((px - left) / (width - left - right)) * bars.length),
      ),
    );
    read(bars[i]);
  };
  svg.onclick = (e) => {
    if (!S.draw) return;
    const py =
      ((e.clientY - svg.getBoundingClientRect().top) /
        svg.getBoundingClientRect().height) *
      height;
    if (py < top || py > top + plotH) return;
    const price = max - ((py - top) / plotH) * (max - min);
    (S.drawings[S.symbol] ??= []).push(price);
    api("/state/preferences", {drawings: S.drawings}).catch(e => toast(e.message));
    S.draw = false;
    $("draw-mode").classList.remove("primary");
    renderChart();
  };
  const osc = $("oscillator").value;
  const oscMap = new Map((indicator[osc] || []).map((x) => [x.time, x.value]));
  seriesPlot(
    $("osc-chart"),
    bars.map((b) => ({ value: oscMap.get(b.time) })),
    {
      height: 115,
      color: "#0A6CFF",
      fixedMin: osc === "rsi14" ? 0 : null,
      fixedMax: osc === "rsi14" ? 100 : null,
    },
  );
  const metrics = clear("indicator-values");
  [
    "sma20",
    "sma50",
    "rsi14",
    "macd",
    "atr14",
    "stoch_k",
    "roc10",
    "vwma20",
  ].forEach((k) => {
    const row = (indicator[k] || []).find((x) => x.time === bars.at(-1).time);
    metric(metrics, k.toUpperCase(), fmt(row?.value));
  });
}
async function loadCompare() {
  const symbol = $("compare").value;
  const requestId = S.loadId;
  if (!symbol) {
    S.compare = [];
    return renderChart();
  }
  const r = await api(
    `/bars?symbol=${encodeURIComponent(symbol)}&period=${$("period").value}&interval=${$("interval").value}`,
  );
  if (requestId !== S.loadId || symbol !== $("compare").value) return;
  S.compare = r.bars;
  renderChart();
}
on("symbol", () => choose($("symbol").value), "change");
["period", "interval"].forEach((id) => on(id, loadBars, "change"));
["chart-type", "sma", "ema", "bb", "oscillator"].forEach((id) =>
  on(id, renderChart, "change"),
);
on("compare", loadCompare, "change");
on("replay", renderChart, "input");
on("zoom-in", () => {
  S.zoom = Math.max(20, Math.floor(S.zoom * 0.7));
  renderChart();
});
on("zoom-out", () => {
  S.zoom = Math.min(S.bars.length, Math.ceil(S.zoom * 1.4));
  renderChart();
});
on("draw-mode", () => {
  S.draw = !S.draw;
  $("draw-mode").classList.toggle("primary", S.draw);
});
on("clear-draw", () => {
  S.drawings[S.symbol] = [];
  api("/state/preferences", {drawings: S.drawings}).catch(e => toast(e.message));
  renderChart();
});
on("export-bars", () => download(S.symbol + "-precios.csv", S.bars));
on("replay-play", () => {
  if (S.replayTimer) {
    clearInterval(S.replayTimer);
    S.replayTimer = null;
    $("replay-play").textContent = "▶ Replay";
    return;
  }
  if (Number($("replay").value) > S.bars.length - 2)
    $("replay").value = Math.min(50, S.bars.length);
  $("replay-play").textContent = "Ⅱ Pausar";
  S.replayTimer = setInterval(() => {
    $("replay").value = Number($("replay").value) + 1;
    renderChart();
    if (Number($("replay").value) >= S.bars.length) {
      clearInterval(S.replayTimer);
      S.replayTimer = null;
      $("replay-play").textContent = "▶ Replay";
    }
  }, 180);
});
async function loadResearch() {
  const symbol = S.symbol;
  S.financials = null;
  selectOptions(
    $("research-symbol"),
    S.quotes.map((x) => ({
      value: x.symbol,
      label: x.symbol + " · " + (x.name || ""),
    })),
    symbol,
  );
  [
    "profile",
    "fundamentals",
    "statements",
    "news",
    "events",
    "research-links",
  ].forEach(clear);
  $("research-title").textContent = "Ficha · " + symbol;
  $("research-meta").textContent =
    "Consultando estados financieros y noticias…";
  let d;
  try {
    d = await api("/details?symbol=" + encodeURIComponent(symbol));
  } catch (error) {
    if (S.symbol === symbol)
      $("research-meta").textContent = "No se pudo consultar: " + error.message;
    throw error;
  }
  if (S.symbol !== symbol) return;
  const p = d.profile;
  clear("profile");
  el("h3", p.longName || symbol, $("profile"));
  el("p", [p.sector, p.industry].filter(Boolean).join(" · "), $("profile"), {
    class: "muted",
  });
  if (p.longBusinessSummary) {
    el(
      "p",
      p.longBusinessSummary.split(/\s+/).slice(0, 24).join(" ") + "…",
      $("profile"),
    );
    el("a", "Leer perfil completo en Yahoo ↗", $("profile"), {
      href:
        "https://finance.yahoo.com/quote/" +
        encodeURIComponent(symbol) +
        "/profile/",
      target: "_blank",
      rel: "noopener",
    });
  }
  if (p.website?.startsWith("http"))
    el("a", "Sitio del emisor ↗", $("profile"), {
      href: p.website,
      target: "_blank",
      rel: "noopener",
    });
  S.financials = d;
  const f = clear("fundamentals");
  const groups = [...new Set(d.fundamentals.map((x) => x.group))];
  for (const group of groups) {
    el("h3", group, f);
    const grid = el("div", null, f, { class: "metrics" });
    for (const x of d.fundamentals.filter((x) => x.group === group)) {
      const v =
        x.value == null
          ? "No disponible"
          : x.unit === "fraction"
            ? fmt(x.value * 100) + "%"
            : x.unit === "percent"
              ? fmt(x.value) + "%"
              : fmt(x.value) + (x.currency ? " " + x.currency : "");
      const item = el("div", null, grid, {
        class: "metric",
        title: x.key + " · " + x.source,
      });
      el("small", x.label, item);
      el("strong", v, item);
      el("small", x.key, item, { class: "field-key" });
    }
  }
  renderFinancialStatements();
  clear("news");
  if (!d.news.length)
    el(
      "p",
      "El proveedor no devolvió noticias para este instrumento.",
      $("news"),
      { class: "muted" },
    );
  d.news.forEach((n) => {
    const item = el("div", null, $("news"), { class: "news-item" });
    el("a", n.title, item, { href: n.url, target: "_blank", rel: "noopener" });
    el(
      "small",
      [n.publisher, n.date?.slice(0, 10)].filter(Boolean).join(" · "),
      item,
    );
  });
  table(
    $("events"),
    ["Fecha", "Dividendo publicado", "Split"],
    d.events
      .slice()
      .reverse()
      .map((x) => [
        x.date,
        x.dividend ? fmt(x.dividend, 5) : "—",
        x.split ? fmt(x.split) : "—",
      ]),
  );
  $("research-meta").textContent =
    d.source +
    " · consultado " +
    new Date(d.fetched_at).toLocaleString("es-CL") +
    (d.errors.length ? " · Cobertura parcial: " + d.errors.join("; ") : "");
  const links = clear("research-links");
  [
    ["Yahoo", `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`],
    [
      "TradingView",
      `https://www.tradingview.com/symbols/BCS-${symbol.replace(".SN", "").replaceAll("-", "_")}/`,
    ],
    ["CMF", "https://www.cmfchile.cl/"],
    ["Bolsa de Santiago", "https://www.bolsadesantiago.com/"],
  ].forEach(([label, url]) =>
    el("a", label + " ↗", links, {
      href: url,
      target: "_blank",
      rel: "noopener",
    }),
  );
}
function renderFinancialStatements() {
  const target = clear("statements");
  if (!S.financials) return;
  const d = S.financials,
    frequency = $("financial-frequency").value,
    query = $("financial-search").value.toLowerCase();
  for (const [title, rows] of Object.entries(d.statements[frequency])) {
    const panel = el("article", null, target, { class: "panel" });
    el(
      "h2",
      title + " · " + (frequency === "annual" ? "Anual" : "Trimestral"),
      panel,
    );
    el(
      "p",
      (d.profile.financialCurrency || "Moneda no informada") +
        " · " +
        rows.length +
        " partidas disponibles · fuente Yahoo Finance",
      panel,
      { class: "muted" },
    );
    if (!rows.length) {
      el(
        "p",
        "El proveedor no entrega este estado para el instrumento.",
        panel,
      );
      continue;
    }
    const dates = [...new Set(rows.flatMap((r) => Object.keys(r.values)))]
      .sort()
      .reverse();
    const filtered = rows.filter((r) => r.metric.toLowerCase().includes(query));
    if (!filtered.length) {
      el("p", "Sin partidas que coincidan con la búsqueda.", panel);
      continue;
    }
    table(
      el("div", null, panel, { class: "table-wrap financial-table" }),
      ["Partida (nombre del proveedor)", "Unidad", ...dates],
      filtered.map((r) => [
        r.metric,
        r.unit === "ratio"
          ? "ratio"
          : r.unit === "shares"
            ? "acciones"
            : r.unit === "currency_per_share"
              ? (d.profile.financialCurrency || "?") + "/acción"
              : d.profile.financialCurrency || "?",
        ...dates.map((k) =>
          fmt(
            r.values[k],
            ["currency_per_share", "ratio"].includes(r.unit) ? 4 : 0,
          ),
        ),
      ]),
    );
  }
}
on("financial-frequency", renderFinancialStatements, "change");
on("financial-search", renderFinancialStatements, "input");
on(
  "research-symbol",
  async () => {
    S.symbol = $("research-symbol").value;
    $("symbol").value = S.symbol;
    await loadResearch();
    await loadBars();
  },
  "change",
);
on("export-financials", () => {
  if (!S.financials) throw Error("Consulta una ficha primero");
  const a = document.createElement("a"),
    u = URL.createObjectURL(
      new Blob([JSON.stringify(S.financials, null, 2)], {
        type: "application/json",
      }),
    );
  a.href = u;
  a.download = S.financials.symbol + "-fundamentales.json";
  a.click();
  URL.revokeObjectURL(u);
});
on("reload-research", loadResearch);
async function loadLists() {
  S.lists = await api("/state/watchlists");
  const current = $("list-filter").value;
  selectOptions(
    $("list-filter"),
    [
      { value: "", label: "Todas las acciones" },
      ...S.lists.map((x) => ({ value: x.id, label: x.name })),
    ],
    current,
  );
  renderLists();
  renderMarket();
}
function renderLists() {
  const parent = clear("lists");
  if (!S.lists.length)
    el("p", "Crea una lista y añade acciones desde el gráfico.", parent, {
      class: "muted",
    });
  S.lists.forEach((l) => {
    const box = el("section", null, parent);
    const r = el("div", null, box, { class: "record" });
    el("h3", l.name, r);
    const del = el("button", "Eliminar lista", r);
    del.onclick = action(async () => {
      await api("/state/watchlists/delete", { id: l.id });
      await loadLists();
    });
    const symbols = el("div", null, box, { class: "filters" });
    l.symbols.forEach((s) => {
      const wrap = el("span", null, symbols);
      const b = el("button", s.replace(".SN", ""), wrap);
      b.onclick = action(() => choose(s));
      const remove = el("button", "×", wrap, { "aria-label": "Quitar " + s });
      remove.onclick = action(async () => {
        await api("/state/watchlists", {
          ...l,
          symbols: l.symbols.filter((x) => x !== s),
        });
        await loadLists();
      });
    });
    const add = el("button", "＋ Añadir " + S.symbol, symbols);
    add.onclick = action(async () => {
      await api("/state/watchlists", {
        ...l,
        symbols: [...l.symbols, S.symbol],
      });
      await loadLists();
    });
  });
}
on(
  "new-list",
  async (e) => {
    e.preventDefault();
    await api("/state/watchlists", {
      name: new FormData(e.target).get("name"),
      symbols: [],
    });
    e.target.reset();
    await loadLists();
  },
  "submit",
);
on("favorite", async () => {
  if (!S.lists.length) {
    await api("/state/watchlists", { name: "Favoritas", symbols: [S.symbol] });
    await loadLists();
    toast("Añadida a Favoritas");
  } else {
    goto("lists");
    toast("Elige una lista y pulsa Añadir " + S.symbol);
  }
});
async function loadCatalog() {
  const c = await api("/models/technical/catalog");
  S.catalog = c;
  selectOptions(
    $("model"),
    c.strategies.map((x) => ({ value: x.id, label: x.name })),
    $("model").value || "SMA_CROSS",
  );
  selectOptions(
    $("custom-indicator"),
    c.indicators.map((x) => ({ value: x, label: x.toUpperCase() })),
    $("custom-indicator").value || "rsi14",
  );
}
on(
  "custom-form",
  async (e) => {
    e.preventDefault();
    const p = Object.fromEntries(new FormData(e.target));
    const row = await api("/models/technical/models", p);
    await loadCatalog();
    $("model").value = row.id;
    toast("Modelo guardado en el motor");
  },
  "submit",
);
on("run-technical", async () => {
  if (!S.bars.length) await loadBars();
  const b = $("run-technical");
  const requestId = S.loadId;
  b.disabled = true;
  try {
    const a = await api("/models/technical/analyze", {
      symbol: S.symbol,
      bars: S.bars,
      model: $("model").value,
      capital: Number($("model-capital").value),
      fee: Number($("model-fee").value) / 100,
      slippage: Number($("model-slip").value) / 100,
    });
    if (requestId !== S.loadId)
      return toast("El instrumento cambió; resultado descartado.");
    S.analysis = a;
    renderChart();
    const m = a.metrics;
    const p = clear("model-metrics");
    [
      ["Retorno de precio neto", pct(m.return_pct), cls(m.return_pct)],
      ["Máximo drawdown", pct(m.drawdown_pct), "neg"],
      ["Patrimonio final", money(m.final_equity), ""],
      ["Fills simulados", String(m.fills), ""],
      ["Acciones abiertas", fmt(m.open_quantity, 0), ""],
    ].forEach(([k, v, c]) => metric(p, k, v, c));
    seriesPlot($("equity-chart"), a.curve, { height: 190 });
    table(
      $("model-trades"),
      ["Fecha", "Lado", "Cantidad", "Precio", "Comisión"],
      a.trades.map((t) => [
        new Date(t.time * 1000).toLocaleDateString("es-CL"),
        t.side === "buy" ? "Compra" : "Venta",
        fmt(t.quantity, 0),
        money(t.price),
        money(t.fee),
      ]),
    );
    $("model-limitations").textContent = a.limitations.join(" ");
    $("model-context").textContent =
      a.symbol +
      " · " +
      a.model +
      " · " +
      S.bars.length +
      " barras · " +
      $("interval").value;
    toast("Evaluación completada");
  } finally {
    b.disabled = false;
  }
});
async function loadRuns() {
  const runs = await api("/models/runs");
  clear("runs");
  S.running = runs.some((r) => ["queued", "running"].includes(r.status));
  $("legacy-submit").disabled = S.running;
  for (const r of runs.slice().reverse()) {
    const box = el("div", null, $("runs"), { class: "panel" });
    el("h3", r.id.slice(0, 8) + " · " + r.status, box);
    if (r.error) el("p", r.error, box, { class: "neg" });
    if (r.summary) {
      const t = el("div", null, box, { class: "table-wrap" });
      table(
        t,
        [
          "Modelo",
          "Instrumentos",
          "Retorno mediana %",
          "Drawdown %",
          "Cierres",
        ],
        r.summary.map((x) => [
          x.modelo,
          x.instrumentos,
          fmt(x.rentabilidad_mediana_pct),
          fmt(x.max_caida_mediana_pct),
          x.operaciones,
        ]),
      );
    }
  }
}
on(
  "legacy-run",
  async (e) => {
    e.preventDefault();
    const p = Object.fromEntries(new FormData(e.target));
    p.capital = Number(p.capital);
    await api("/models/runs", p);
    await loadRuns();
    toast("Experimento aceptado por el motor");
  },
  "submit",
);
async function loadPortfolio() {
  const [p, ledger] = await Promise.all([
    api("/portfolio"),
    api("/state/ledger"),
  ]);
  S.ledger = ledger;
  const s = clear("portfolio-summary");
  metric(s, "P&L realizado registrado", money(p.realized), cls(p.realized));
  metric(s, "Posiciones", String(p.positions.length));
  metric(
    s,
    "Costo de posiciones",
    money(p.positions.reduce((n, x) => n + x.cost, 0)),
  );
  metric(
    s,
    "Valor conocido (parcial)",
    money(p.positions.reduce((n, x) => n + (x.value ?? 0), 0)),
  );
  table(
    $("positions"),
    [
      "Acción",
      "Cantidad",
      "Costo total",
      "Valor conocido",
      "P&L no realizado",
      "Estado dato",
    ],
    p.positions.map((x) => [
      x.symbol,
      fmt(x.quantity, 0),
      money(x.cost),
      money(x.value),
      el("span", money(x.unrealized), null, { class: cls(x.unrealized) }),
      x.status,
    ]),
  );
  $("portfolio-warnings").textContent =
    "Costo promedio ponderado. Efectivo y aportes en Patrimonio; sin sincronización de broker. " +
    p.warnings.join(" ");
  table(
    $("ledger"),
    ["Fecha", "Acción", "Tipo", "Cantidad", "Precio", "Comisión", "Origen"],
    ledger.map((x) => [
      x.date,
      x.symbol,
      x.side,
      fmt(x.quantity, 0),
      money(x.price),
      money(x.fee),
      "Manual",
    ]),
  );
}
on(
  "ledger-form",
  async (e) => {
    e.preventDefault();
    await api("/state/ledger", Object.fromEntries(new FormData(e.target)));
    await loadPortfolio();
    toast("Operación registrada; no se envió una orden");
  },
  "submit",
);
on("export-ledger", () => download("avia-registro.csv", S.ledger));
async function loadAlerts() {
  const rows = await api("/state/alerts");
  clear("alerts");
  if (!rows.length) el("p", "Sin alertas.", $("alerts"), { class: "muted" });
  rows.forEach((a) => {
    const r = el("div", null, $("alerts"), { class: "record" }),
      v = el("div", null, r);
    el(
      "strong",
      a.symbol +
        " " +
        (a.direction === "above" ? "≥" : "≤") +
        " " +
        money(a.threshold),
      v,
    );
    el(
      "p",
      a.status === "triggered"
        ? "Activada · precio " +
            money(a.observed_price) +
            " · dato " +
            new Date(a.quote_time).toLocaleString("es-CL")
        : "Activa · esperando condición",
      v,
      { class: a.status === "triggered" ? "pos" : "muted" },
    );
    const b = el("button", "Eliminar", r);
    b.onclick = action(async () => {
      await api("/state/alerts/delete", { id: a.id });
      await loadAlerts();
    });
  });
}
on(
  "alert-form",
  async (e) => {
    e.preventDefault();
    await api("/state/alerts", Object.fromEntries(new FormData(e.target)));
    await loadAlerts();
    toast("Alerta creada");
  },
  "submit",
);
async function loadDrafts() {
  const rows = await api("/state/drafts");
  clear("drafts");
  if (!rows.length) el("p", "Sin borradores.", $("drafts"), { class: "muted" });
  rows.forEach((d) => {
    const r = el("div", null, $("drafts"), { class: "record" });
    el(
      "span",
      `${d.side === "buy" ? "Comprar" : "Vender"} ${d.quantity} ${d.symbol} · límite ${money(d.price)} · DAY · NO ENVIADA`,
      r,
    );
    const b = el("button", "Eliminar borrador", r);
    b.onclick = action(async () => {
      await api("/state/drafts/delete", { id: d.id });
      await loadDrafts();
    });
  });
}
on(
  "draft-form",
  async (e) => {
    e.preventDefault();
    await api("/state/drafts", Object.fromEntries(new FormData(e.target)));
    await loadDrafts();
    toast("Borrador guardado. No enviado a Zesty.");
  },
  "submit",
);
async function loadMap() {
  const d = await api("/sources");
  table(
    $("feature-map"),
    ["Área", "Alcance", "Estado / condición"],
    d.features.map((x) => [x.module, x.scope, x.status]),
  );
  $("feature-map")
    .querySelectorAll("td")
    .forEach((td) => {
      td.style.whiteSpace = "normal";
      td.style.textAlign = "left";
      td.style.minWidth = "190px";
    });
  clear("sources");
  d.sources.forEach((s) => {
    const p = el("article", null, $("sources"), { class: "panel source-card" });
    const title = el("div", null, p);
    el("h3", s.name, title);
    el("a", "Fuente primaria ↗", title, {
      href: s.url,
      target: "_blank",
      rel: "noopener",
    });
    const text = el("div", null, p);
    el("p", s.facts, text);
    el("small", s.access, text, { class: "muted" });
  });
}
$("ledger-form").elements.date.value = new Date().toISOString().slice(0, 10);
setInterval(() => {
  $("clock").textContent = new Date().toLocaleTimeString("es-CL", {
    timeZone: "America/Santiago",
    hour: "2-digit",
    minute: "2-digit",
  });
}, 1000);
setInterval(() => loadMarket().catch(() => {}), 10000);
setInterval(() => {
  if (S.running) loadRuns().catch(() => {});
  if (S.page === "alerts") loadAlerts().catch(() => {});
}, 4000);
goto("market");
Promise.allSettled([loadMarket(), loadLists(), loadCatalog(), loadMap(), loadPreferences()]).then(
  (results) => {
    results
      .filter((x) => x.status === "rejected")
      .forEach((x) => toast(x.reason.message));
    loadBars().catch((e) => toast(e.message));
  },
);

function modelCategory(portfolio) {
  $("transaction-models").hidden = portfolio;
  $("portfolio-models").hidden = !portfolio;
  $("show-transactions").setAttribute("aria-pressed", String(!portfolio));
  $("show-portfolios").setAttribute("aria-pressed", String(portfolio));
}
on("show-transactions", () => modelCategory(false));
on("show-portfolios", () => modelCategory(true));
on(
  "portfolio-run",
  async (e) => {
    e.preventDefault();
    const p = Object.fromEntries(new FormData(e.target)),
      symbols = [
        ...new Set(
          p.symbols
            .toUpperCase()
            .split(",")
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      ];
    if (symbols.length < 2 || symbols.length > 12)
      throw Error("Selecciona entre 2 y 12 acciones distintas");
    $("portfolio-submit").disabled = true;
    $("portfolio-status").textContent =
      "Consultando barras diarias y evaluando…";
    [
      "portfolio-metrics",
      "portfolio-curve",
      "portfolio-weights",
      "portfolio-trades",
    ].forEach(clear);
    try {
      const assets = {};
      for (const symbol of symbols) {
        const data = await api(
          "/bars?symbol=" +
            encodeURIComponent(symbol) +
            "&period=2y&interval=1d",
        );
        assets[symbol] = data.bars;
      }
      const r = await api("/models/portfolio/analyze", {
        model: p.model,
        assets,
        capital: Number(p.capital),
        fee: Number(p.fee) / 100,
        slippage: Number(p.slippage) / 100,
      });
      const m = r.metrics;
      [
        ["Retorno de precio neto", pct(m.return_pct)],
        ["Máximo drawdown", pct(m.drawdown_pct)],
        ["Patrimonio final", money(m.final_equity)],
        ["Caja final", money(m.cash)],
        ["Fills simulados", m.fills],
      ].forEach(([k, v]) => metric($("portfolio-metrics"), k, String(v)));
      seriesPlot($("portfolio-curve"), r.curve, { height: 190 });
      table(
        $("portfolio-weights"),
        ["Acción", "Cantidad final", "Valor CLP", "Peso realizado"],
        r.positions.map((x) => [
          x.symbol,
          fmt(x.quantity, 0),
          money(x.value),
          pct(x.weight * 100),
        ]),
      );
      table(
        $("portfolio-trades"),
        ["Fecha", "Acción", "Lado", "Cantidad", "Precio", "Comisión"],
        r.trades.map((x) => [
          new Date(x.time * 1000).toLocaleDateString("es-CL"),
          x.symbol,
          x.side === "buy" ? "Compra" : "Venta",
          x.quantity,
          money(x.price),
          money(x.fee),
        ]),
      );
      $("portfolio-status").textContent =
        m.common_sessions +
        " sesiones comunes. " +
        r.limitations.join(" ") +
        " Sesiones excluidas: " +
        Object.entries(r.excluded_sessions)
          .map(([k, v]) => k + " " + v)
          .join(", ");
    } catch (error) {
      $("portfolio-status").textContent = error.message;
      throw error;
    } finally {
      $("portfolio-submit").disabled = false;
    }
  },
  "submit",
);

async function loadPreferences() {
  const rows = await api('/state/preferences');
  S.drawings = rows[0]?.drawings || {};
  renderChart();
}
async function loadWealth() {
  const [p, flows, dividends] = await Promise.all([api('/portfolio'), api('/state/cashflows'), api('/state/dividends')]);
  const w=p.wealth, box=clear('wealth-summary');
  [['Saldo total',w.total_balance],['Aportes acumulados',w.deposits],['Retiros acumulados',w.withdrawals],['Aportes netos',w.net_contributions],['Ganancia / crecimiento neto de aportes',w.gain],['Efectivo registrado',w.cash],['Dividendos cobrados',w.dividends]].forEach(([title,value])=>metric(box,title,money(value)));
  $('wealth-note').textContent=(w.complete?'Valoración con últimas cotizaciones disponibles. ':'Valoración incompleta: saldo y ganancia no se muestran como totales. ')+w.return_note+' '+p.warnings.join(' ');
  table($('cashflows'),['Fecha','Movimiento','CLP'],flows.map(x=>[x.date,x.side==='deposit'?'Aporte':'Retiro',money(x.amount)]));
  table($('dividends'),['Fecha','Acción','Neto CLP'],dividends.map(x=>[x.date,x.symbol,money(x.amount)]));
}
for (const [form,kind] of [['cashflow-form','cashflows'],['dividend-form','dividends']]) {
  $(form).elements.date.value=new Date().toISOString().slice(0,10);
  on(form,async e=>{
    e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;
    try {await api('/state/'+kind,Object.fromEntries(new FormData(e.target)));await loadWealth();toast('Movimiento guardado');}
    finally {button.disabled=false;}
  },'submit');
}
on('quick-form',async e=>{
  e.preventDefault();const p=Object.fromEntries(new FormData(e.target));p.include_dividends=e.target.elements.include_dividends.checked;
  const r=await api('/quick-result',p);
  $('quick-result').textContent='Resultado: '+money(r.gain)+' ('+pct(r.return_pct)+'). Dividendos incluidos: '+money(r.included_dividends)+'. Simulación sin guardar.';
},'submit');
async function loadSignals() {
  const s=await api('/signals');
  $('signals-status').textContent=(s.refreshing?'Actualizando… ':s.generated_at?'Calculado '+new Date(s.generated_at).toLocaleString('es-CL')+' · ':'Aún sin evaluación. ')+'Fuente diferida. Regla fundamental-trend-v2; estimaciones, no certezas.';
  for (const side of ['buy','sell']) {
    const box=clear(side+'-signals');
    s[side].forEach((r,i)=>{
      const card=el('article',null,box,{class:'panel'});
      if(r.unavailable){el('h3',(i+1)+'. Sin candidato',card);el('p',r.reason,card);return;}
      el('h3',(i+1)+'. '+r.symbol,card);
      el('p','Entrada / revisión actual: '+money(r.entry)+' · '+(side==='buy'?'Salida objetivo estimada: ':'Nivel estimado de reevaluación: ')+money(r.exit),card);
      el('p',r.explanation,card);el('p',(r.source || 'API de mercado')+' · '+r.mode+' · '+(r.quote_time ? new Date(r.quote_time).toLocaleString('es-CL') : 'Hora no disponible'),card);
      el('p',r.price_note,card);el('p',r.history_note,card);
      const detail=el('details',null,card);el('summary','Ver evidencia y límites',detail);
      const evidence=r.evidence;
      el('p','Consenso: '+money(evidence.targetMeanPrice)+' · Analistas: '+evidence.numberOfAnalystOpinions+' · Margen neto: '+pct(evidence.profitMargins*100)+' · ROE: '+pct(evidence.returnOnEquity*100),detail);
      el('p','Media 20 sesiones: '+money(evidence.sma20)+' · Media 50 sesiones: '+money(evidence.sma50)+' · Última barra: '+evidence.last_bar,detail);
      el('p','Fundamentales: '+evidence.fundamentals_source+' · Consultados '+new Date(evidence.fundamentals_observed_at).toLocaleString('es-CL')+' · Fecha de publicación no disponible.',detail);
      el('p',r.limitations,detail);
    });
  }
}
on('refresh-signals',async()=>{await api('/signals/refresh',{});await loadSignals();});
setInterval(()=>{if(S.page==='signals')loadSignals().catch(e=>toast(e.message));},15000);

on("chart-data", () => loadBars(), "change");
