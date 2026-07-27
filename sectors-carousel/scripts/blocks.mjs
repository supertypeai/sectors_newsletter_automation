// Block-kind -> HTML renderers. Pure string templating; no DOM, no React.
// Each renderer maps a block from deck.json to the markup defined in assets/styles/theme.css.
// Content is the agent's job (real data + the writing skills); rendering is deterministic here.
//
// `ctx` carries everything machine-specific so this stays portable:
//   ctx.logos        { TICKER: dataURI }  resolved real ticker logos (else letter monogram)
//   ctx.brand.mark   inline <svg> string of the official Sectors mark
//   ctx.brand.appOverview  dataURI of the product screenshot for the outro device
//   ctx.warnings     string[]  collected render warnings
import { sparkline, coverSpark, coverDuel, barChart, donut, radar, multiLine, stackedBar, waterfall, scatter, resolveSeriesColors, PEER_COLORS, bump, sankey, sankeyDepths, sankeyNodeTotals, SANKEY_MISMATCH_THRESHOLD, compose } from "./charts.mjs";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const tkr = (t) => String(t || "").toUpperCase().replace(/\.JK$/, "");

function emphasize(text, emphasis) {
  if (!emphasis) return esc(text);
  const i = text.indexOf(emphasis);
  if (i < 0) return esc(text);
  return esc(text.slice(0, i)) + `<span class="gradient-text">${esc(emphasis)}</span>` + esc(text.slice(i + emphasis.length));
}

const OWN_COLORS = ["#E5337E", "#DF9439", "#A99F99", "#3A332E", "#6E6661"];

// Every place a deck can name a ticker whose logo the renderer must resolve. This is THE
// canonical collector, shared by render.mjs (which base64-inlines the PNGs) and
// brand-lint.mjs (whose ticker registry must match what actually renders): the two used to
// each keep their own partial list, and both independently missed the cover `tickers` array
// and `table` chart rows — so a Duel/Field cover or a screener table silently rendered
// gradient monograms for logos that exist in assets/logos/, and the "no bundled logo" note
// couldn't fire because the ticker never entered the set at all.
export function collectTickers(slides) {
  const out = new Set();
  const add = (t) => { if (t) out.add(tkr(t)); };
  const fromBlocks = (blocks) => {
    for (const b of blocks || []) {
      if (b.kind === "row") { fromBlocks(b.blocks); continue; }
      if (b.kind === "priceSnapshot") add(b.ticker);
      if (b.kind === "ranking" || b.kind === "comparison") (b.rows || []).forEach((r) => add(r.ticker));
    }
  };
  for (const sl of slides || []) {
    add(sl.chip && sl.chip.ticker);
    (sl.tickers || []).forEach((t) => add(typeof t === "string" ? t : t && t.ticker));
    // A duel cover names its two tickers in duel.series[].name, a field collectTickers used
    // to never look at. deck-format.md tells the agent to ALSO set `tickers` redundantly so
    // the logo row shows, but nothing enforced that second field, so a deck that only set
    // `duel` rendered a comparison chart with zero logos and zero warning. Reading series
    // names here removes the redundant-field trap instead of just documenting it away.
    (sl.duel && sl.duel.series || []).forEach((s) => add(s && s.name));
    if (sl.html) {
      let m;
      const reLogo = /data-logo="([^"]+)"/g;
      while ((m = reLogo.exec(sl.html))) add(m[1]);
      // table rows (and any future spec field) name tickers inside data-spec JSON; a plain
      // string scan beats JSON.parse here because a malformed spec should still surface its
      // tickers (the lint reports the malformed spec separately).
      const reSpec = /data-spec='([\s\S]*?)'/g;
      while ((m = reSpec.exec(sl.html))) {
        let t2;
        const reTicker = /"ticker"\s*:\s*"([^"]+)"/g;
        while ((t2 = reTicker.exec(m[1]))) add(t2[1]);
      }
    }
    fromBlocks(sl.blocks);
  }
  return out;
}

// ---- chart input gate ----
// A single bar/segment/point whose `value` is missing or non-numeric used to NaN-poison the
// chart's shared scale (Math.max(0, undefined) -> NaN) and blank the ENTIRE chart, healthy
// bars included, with zero signal anywhere. And the slip is the natural one: deck values are
// "strings you pre-formatted", so `display` without a numeric `value`, or a quoted "48", is
// exactly what an agent writes on a tired pass. Coerce what coerces, warn about what
// doesn't, and never let one sick entry take down the chart (or, worse, plot a fabricated
// stand-in for it).
const numOr = (v) => (Number.isFinite(Number(v)) && v !== null && v !== "" ? Number(v) : null);

function sanitizeBars(bars, ctx, kind) {
  const out = [];
  for (const b of bars || []) {
    const v = numOr(b.value);
    if (v == null)
      ctx?.warnings?.push(
        `${kind}: dropped bar "${b.label ?? "?"}", value ${JSON.stringify(b.value)} is not a number (numbers go in "value", display strings in "display")`
      );
    else out.push({ ...b, value: v });
  }
  return out;
}

// A line/radar series with one bad value is dropped WHOLE, not partially: removing a single
// point would silently shift every later point's x/axis position, plotting a shape the data
// never had. Omitting the series is honest; a subtly wrong line is not.
function sanitizeSeries(series, ctx, kind) {
  const out = [];
  for (const s of series || []) {
    const vals = (s.values || []).map(numOr);
    if (vals.some((v) => v == null))
      ctx?.warnings?.push(`${kind}: dropped series "${s.name ?? "?"}", it contains non-numeric values`);
    else out.push({ ...s, values: vals });
  }
  return out;
}

// A benchmark reference line (sector average, historical mean) needs a real numeric `value`
// to place its Y coordinate; a bad one (missing, a string, NaN) must warn and DROP just the
// line, not the whole chart, same "coerce what coerces, warn what doesn't" rule as
// sanitizeBars/sanitizeSeries above. `display` is optional (same value/display split every
// other chart primitive here already uses): value is raw for geometry, display is the
// pre-formatted string to print, falling back to a trimmed raw value when omitted.
function sanitizeBenchmark(benchmark, ctx, kind) {
  if (!benchmark) return null;
  const value = numOr(benchmark.value);
  if (value == null) {
    ctx?.warnings?.push(`${kind}: dropped benchmark "${benchmark.label ?? "?"}", value ${JSON.stringify(benchmark.value)} is not a number`);
    return null;
  }
  return { value, label: benchmark.label || "", display: benchmark.display };
}

function deltaPill(d) {
  if (!d) return "";
  const dir = d.dir || "flat";
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "•";
  return `<span class="delta ${dir}">${arrow} ${esc(d.text)}</span>`;
}

// Real logo = the image only (object-fit contain, no fill); monogram = gradient fallback.
// extraAttrs (raw, e.g. `class="logo-inline"` or `style="width:56px;height:56px;"`) passes
// through onto the wrapper div so a free-HTML placeholder's sizing/class survives the swap.
// A class in extraAttrs is merged into the base "logo logo--img/mono" list, not duplicated.
function logoBox(ticker, ctx, override, extraAttrs) {
  const t = tkr(ticker);
  const uri = override || (ctx.logos && ctx.logos[t]);
  const base = uri ? "logo logo--img" : "logo logo--mono";
  let cls = base;
  let rest = extraAttrs || "";
  const classMatch = rest.match(/class="([^"]*)"/);
  if (classMatch) {
    cls = `${base} ${classMatch[1]}`;
    rest = rest.replace(classMatch[0], "").trim();
  }
  const extra = rest ? ` ${rest}` : "";
  if (uri) return `<div class="${cls}"${extra}><img src="${esc(uri)}" alt="${esc(t)}"></div>`;
  return `<div class="${cls}"${extra}>${esc((t[0] || "?"))}</div>`;
}

function chipHTML(chip, ctx) {
  if (!chip) return "";
  const t = tkr(chip.ticker);
  return `<div class="chip">${logoBox(t, ctx, chip.logoUrl)}<div class="pill"><span class="dollar">$</span>${esc(t)}</div></div>`;
}

// Each item in `tickers` may be a plain ticker string or { ticker, logoUrl } (same override
// escape hatch chip.logoUrl already offers, for the rare company missing from the asset
// library) — normalize once so every branch below can just read .ticker/.logoUrl.
const asTickerObj = (t) => (typeof t === "string" ? { ticker: t } : t);

// Cover-wide "who is this about" row: always renders when the piece names 1+ tickers,
// independent of whether there's a spark/duel backdrop. Previously the ticker mark only
// existed nested inside the spark-callout, so any cover without a spark (the common case)
// or naming more than one ticker showed no logo at all, even for a 2-company comparison
// piece whose whole hook is "who's who." Scales the treatment to the count so 2 reads as a
// comparison and 7+ reads as a group, not a wall of identical pills or an unreadable cover.
function coverChips(tickers, ctx) {
  const list = (tickers || []).filter(Boolean).map(asTickerObj);
  if (!list.length) return "";
  if (list.length === 1) return `<div class="chip-row" style="justify-content:flex-start;margin-bottom:22px;">${chipHTML(list[0], ctx)}</div>`;
  if (list.length === 2)
    return `<div class="chip-row" style="justify-content:flex-start;gap:20px;margin-bottom:22px;">${chipHTML(
      list[0],
      ctx
    )}<span class="cover-vs">VS</span>${chipHTML(list[1], ctx)}</div>`;
  if (list.length <= 6)
    return `<div class="chip-row" style="justify-content:flex-start;gap:16px;flex-wrap:wrap;margin-bottom:22px;">${list
      .map((c) => chipHTML(c, ctx))
      .join("")}</div>`;
  // 7+: an overlapping logo stack (no per-name pill, there's no room), capped at 6 marks +
  // a "+N" badge for the rest — a sector/screener piece names its companies on the content
  // slides; the cover only needs to signal "this is about a group," not enumerate everyone.
  const shown = list.slice(0, 6);
  const rest = list.length - shown.length;
  const stack = shown
    .map(
      (c, i) =>
        `<div style="margin-left:${i === 0 ? 0 : -18}px;position:relative;z-index:${shown.length - i};">${logoBox(
          c.ticker,
          ctx,
          c.logoUrl,
          'style="width:52px;height:52px;border-radius:16px;border:3px solid var(--bg);"'
        )}</div>`
    )
    .join("");
  const badge = rest > 0 ? `<div class="chip" style="margin-left:8px;"><div class="pill">+${rest}</div></div>` : "";
  return `<div class="chip-row" style="justify-content:flex-start;margin-bottom:22px;">${stack}${badge}</div>`;
}

function rowLogo(r, ctx) {
  if (r.logoUrl || r.ticker) return logoBox(r.ticker, ctx, r.logoUrl);
  return "";
}

// ---------- per-block renderers (b, ctx) ----------
const RENDER = {
  headline: (b) => {
    const k = b.kicker ? `<div class="kicker">${esc(b.kicker)}</div>` : "";
    // Gradient = emphasis only: the title renders in base colour with one verdict word
    // in gradient. No full-title gradient (the old b.gradient path is intentionally gone).
    const title = emphasize(b.title, b.emphasis);
    return `${k}<div class="title" style="margin-top:${b.kicker ? 14 : 0}px;">${title}</div>`;
  },
  subhead: (b) => `<div class="subhead" style="color:var(--muted)">${esc(b.text)}</div>`,
  body: (b) => `<div class="body">${esc(b.text)}</div>`,
  caption: (b) => `<div class="caption-t">${esc(b.text)}</div>`,
  bullets: (b) =>
    `<div class="b-bullets">${(b.items || [])
      .map((it) => `<div class="li"><span class="dot"></span><div class="body">${esc(it)}</div></div>`)
      .join("")}</div>`,
  insight: (b) =>
    `<div class="glass b-insight">${b.kicker ? `<div class="kicker">${esc(b.kicker)}</div>` : ""}<div class="body">${esc(b.text)}</div></div>`,
  quote: (b) =>
    `<div class="glass b-quote"><div class="glyph gradient-text">&ldquo;</div><div class="text">${esc(b.text)}</div>${
      b.attribution ? `<div class="attr">${esc(b.attribution)}</div>` : ""
    }</div>`,
  cta: (b) =>
    `<div class="b-cta"><div class="pill">${esc(b.text)}</div>${b.handle ? `<div class="handle">${esc(b.handle)}</div>` : ""}</div>`,

  stat: (b) => {
    const size = b.size === "s2" ? "s2" : b.size === "s3" ? "s3" : "s1";
    const inner = `
      <div class="label">${esc(b.label)}</div>
      <div class="value ${b.hero ? "" : size} ${b.gradient ? "gradient-text" : ""} num">${esc(b.value)}</div>
      ${b.delta ? deltaPill(b.delta) : ""}
      ${b.sub ? `<div class="caption-t sub">${esc(b.sub)}</div>` : ""}`;
    return b.hero ? `<div class="b-stat hero">${inner}</div>` : `<div class="glass b-stat">${inner}</div>`;
  },

  keyFacts: (b) => {
    const facts = b.facts || [];
    // 4 facts render 2x2, never 3+1: a lone orphan card under a full row is exactly the
    // shape the S1 archetype bans, and the block used to produce it for its own documented
    // 4-fact case (the archetype example only dodged it by hand-writing cols-2).
    const cols = facts.length <= 2 || facts.length === 4 ? 2 : 3;
    return `<div class="b-keyfacts cols-${cols}">${facts
      .map(
        (f) =>
          `<div class="glass card"><div class="label">${esc(f.label)}</div><div class="value">${esc(
            f.value
          )}</div>${f.sub ? `<div class="caption-t">${esc(f.sub)}</div>` : ""}</div>`
      )
      .join("")}</div>`;
  },

  priceSnapshot: (b, ctx) => {
    const spark = b.spark && b.spark.length ? sparkline(b.spark, { w: 852, h: 150, strokeWidth: 4 }) : "";
    return `<div class="glass b-price" style="padding:38px 40px;">
      <div class="head">${chipHTML({ ticker: b.ticker, logoUrl: b.logoUrl }, ctx)}${deltaPill(b.change)}</div>
      <div class="price">${esc(b.price)}</div>
      ${b.asOf ? `<div class="caption-t">last close · ${esc(b.asOf)}</div>` : ""}
      <div style="margin-top:18px;">${spark}</div>
    </div>`;
  },

  rangeBar: (b) => {
    const pct = b.pct != null ? b.pct : b.high > b.low ? (b.current - b.low) / (b.high - b.low) : 0.5;
    const p = Math.max(0, Math.min(1, pct)) * 100;
    const left = `clamp(60px, ${p}%, calc(100% - 60px))`;
    return `<div class="b-range">
      <div class="label">${esc(b.label || "52-week range")}</div>
      <div class="track">
        <div class="fill" style="width:${p}%"></div>
        <div class="cur" style="left:${left}">${esc(b.currentText ?? b.current)}</div>
        <div class="marker" style="left:${p}%"></div>
      </div>
      <div class="ends">
        <div class="stack"><span class="caption-t">low</span><span class="num">${esc(b.lowText ?? b.low)}</span></div>
        <div class="stack" style="text-align:right;"><span class="caption-t">high</span><span class="num">${esc(b.highText ?? b.high)}</span></div>
      </div>
    </div>`;
  },

  quarterlyTrend: (b, ctx) => barBlock(b, ctx),
  chart: (b, ctx) => barBlock(b, ctx),

  dividendHistory: (b, ctx) => {
    const years = [];
    for (const y of b.years || []) {
      const dps = numOr(y.dps);
      if (dps == null) ctx?.warnings?.push(`dividendHistory: dropped year "${y.year ?? "?"}", dps ${JSON.stringify(y.dps)} is not a number`);
      else years.push({ ...y, dps });
    }
    const max = Math.max(1, ...years.map((y) => y.dps));
    const bars = years
      .map((y) => {
        const h = Math.max(4, (y.dps / max) * 230);
        return `<div class="col"><div class="dps num">${esc(y.display ?? y.dps)}</div><div class="bar" style="height:${h}px"></div><div class="yr">${esc(
          y.year
        )}</div></div>`;
      })
      .join("");
    const s = b.summary;
    const summary = s
      ? `<div class="glass summary">${(s.facts || [])
          .map((f) => `<div class="stack"><span class="label">${esc(f.label)}</span><span class="num ${f.gradient ? "gradient-text" : ""}">${esc(f.value)}</span></div>`)
          .join("")}</div>`
      : "";
    return `<div class="b-div"><div class="bars">${bars}</div>${summary}</div>`;
  },

  ownership: (b, ctx) => {
    const holders = [];
    (b.holders || []).forEach((h, i) => {
      const pct = numOr(h.pct);
      if (pct == null)
        ctx?.warnings?.push(`ownership: dropped holder "${h.name ?? "?"}", pct ${JSON.stringify(h.pct)} is not a number`);
      else holders.push({ ...h, pct, color: h.color || OWN_COLORS[holders.length % OWN_COLORS.length] });
    });
    const rows = holders
      .map(
        (h) => `<div class="r"><div class="top"><span class="name">${esc(h.name)}</span><span class="pct">${esc(
          h.display ?? h.pct + "%"
        )}</span></div><div class="track"><div class="bar" style="width:${Math.max(2, h.pct)}%;background:${h.color}"></div></div></div>`
      )
      .join("");
    const dn =
      b.donut !== false
        ? donut(holders.map((h) => ({ pct: h.pct, color: h.color })), {
            size: 360,
            centerLabel: holders[0] ? (holders[0].display ?? holders[0].pct + "%") : "",
            centerSub: b.centerSub || "",
          })
        : "";
    return `<div class="b-own">${dn}<div class="rows">${rows}</div></div>`;
  },

  peerBars: (b) => {
    const rows = b.rows || [];
    const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
    const inner = rows
      .map((r) => {
        const ratio = r.ratio != null ? r.ratio : Math.abs(r.value) / max;
        return `<div class="r ${r.self ? "self" : ""}"><div class="top"><span class="name">${esc(r.name)}</span><span class="val">${esc(
          r.display ?? r.value
        )}</span></div><div class="track"><div class="fill" style="width:${(Math.max(0, Math.min(1, ratio)) * 100).toFixed(1)}%"></div></div></div>`;
      })
      .join("");
    return `<div class="glass"><div class="label" style="margin-bottom:24px;">${esc(b.metric || "")}</div><div class="b-bars">${inner}</div></div>`;
  },

  ranking: (b, ctx) =>
    `<div class="glass b-rows">${(b.rows || [])
      .map(
        (r) =>
          `<div class="r"><span class="rank">${esc(r.rank ?? "")}</span>${rowLogo(r, ctx)}<span class="name">${esc(
            r.name || tkr(r.ticker)
          )}</span><span class="val">${esc(r.value)}</span>${deltaPill(r.delta)}</div>`
      )
      .join("")}</div>`,

  comparison: (b, ctx) =>
    `<div class="glass b-rows">${(b.rows || [])
      .map(
        (r) =>
          `<div class="r">${rowLogo(r, ctx)}<span class="name">${esc(r.name || tkr(r.ticker))}</span><span class="val">${esc(
            r.value
          )}</span>${deltaPill(r.delta)}</div>`
      )
      .join("")}</div>`,

  row: (b, ctx) => `<div class="row">${(b.blocks || []).map((c) => renderBlock(c, ctx)).join("")}</div>`,
  spacer: () => `<div class="spacer"></div>`,
};

function barBlock(b, ctx) {
  const legend =
    b.legend && b.legend.length
      ? `<div class="legend" style="margin-top:8px;">${b.legend
          .map((l) => `<div class="item"><span class="sw" style="background:${l.color || "var(--brandGradient)"}"></span><span class="caption-t">${esc(l.label)}</span></div>`)
          .join("")}${b.delta ? `<div class="spacer"></div>${deltaPill(b.delta)}` : ""}</div>`
      : b.delta
      ? `<div class="legend" style="margin-top:8px;"><div class="spacer"></div>${deltaPill(b.delta)}</div>`
      : "";
  const benchmark = sanitizeBenchmark(b.benchmark, ctx, "bar chart");
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${barChart(
    sanitizeBars(b.bars, ctx, "bar chart"),
    { benchmark }
  )}${legend}</div>`;
}

// Legend swatch for a "self vs peers" series list, shared by radar/multiLine (both use the
// same self=brand-gradient / peer=muted-dashed grammar). Colors come from resolveSeriesColors,
// the SAME resolver the chart geometry itself uses — so a legend swatch can never point at
// the wrong line (they'd otherwise index peers differently: array position vs. peer order).
function seriesLegend(series, extra) {
  const resolved = resolveSeriesColors(series);
  if (!resolved.length) return "";
  const items = resolved
    .map((s) => {
      const color = s.self ? "var(--brandGradient)" : s.color;
      return `<div class="item"><span class="sw" style="background:${color}"></span><span class="caption-t">${esc(s.name)}</span></div>`;
    })
    .join("");
  return `<div class="legend" style="margin-top:8px;${extra || ""}">${items}</div>`;
}

// radar/multiline are documented as "one subject vs 2-3 peers" (visual-language.md), not an
// N-way tool — and that ceiling isn't just a legibility opinion, PEER_COLORS only has 3
// entries, so a 4th peer mathematically REUSES the 1st peer's exact color, two different
// companies rendered visually identical with no way for a reader to tell them apart (caught:
// an eval built a 5-series radar — 1 self + 4 peers — and confirmed two lines came out the
// same shade of gray). Fail loud here rather than let it fail silent in the rendered PNG.
function checkPeerColorLimit(series, ctx, chartKind) {
  const peerCount = (series || []).filter((s) => !s.self).length;
  if (peerCount > PEER_COLORS.length) {
    ctx?.warnings?.push(
      `${chartKind}: ${peerCount} peer series exceeds the ${PEER_COLORS.length} distinct peer colors available — colors will repeat and become indistinguishable. This chart type is for one subject vs 2-3 peers; use a ranking/table block for an N-way comparison instead.`
    );
  }
}

// multiLine()/coverDuel() (charts.mjs) put every series on ONE shared min/max scale. A
// 4800-5300 price series next to a 0.11-0.14 ratio series shares that scale with zero warning
// today: the ratio series' whole range is <0.1% of the price series' span, so normFrac maps
// every one of its points to virtually the same y, a flat, information-free line the reader
// can't tell apart from "this didn't move" (it's actually just "this chart can't show it").
// Docs used to tell the agent to hand-index values to 100 before writing the spec, which
// invites a baseline slip (index off the wrong point, or only index one series); `index:true`
// below does the same rebase mechanically, in ONE shared helper so multiline and the cover
// duel backdrop (the same self/peer series grammar, see checkPeerColorLimit above) can never
// diverge on how a series gets indexed. A series can't be rebased against a first value of 0
// (division by zero) or a non-numeric one (defensive; sanitizeSeries already drops those), so
// it's dropped WHOLE with a warning naming it, same "sick series dropped whole" rule
// sanitizeSeries uses, rather than plotting a mix of indexed and raw-scale lines on one axis.
function indexSeries(series, ctx, kind) {
  const out = [];
  for (const s of series || []) {
    const base = (s.values || [])[0];
    if (!Number.isFinite(base) || base === 0) {
      ctx?.warnings?.push(
        `${kind}: dropped series "${s.name ?? "?"}" from index:true, its first value (${JSON.stringify(
          base
        )}) can't be a rebase base (must be a nonzero number)`
      );
      continue;
    }
    out.push({ ...s, values: (s.values || []).map((v) => (100 * v) / base) });
  }
  return out;
}

// The mismatched-scale collapse above is silent by construction (a flat line still "renders",
// it just carries no information), so a deck that DIDN'T opt into index:true gets no signal
// anything is wrong. A rough heuristic (median magnitude, not min/max, so one outlier point
// doesn't trip it) catches the shape described above and points straight at the fix. Runs on
// the same sanitized series index:true would index, so it's checking exactly the case that
// caused the original bug (see the "why" above indexSeries).
function checkMismatchedScale(series, ctx, kind) {
  const median = (vals) => {
    const s = [...vals].map(Math.abs).sort((a, b) => a - b);
    if (!s.length) return null;
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  const medians = (series || [])
    .map((s) => ({ name: s.name, m: median(s.values || []) }))
    .filter((x) => x.m != null && x.m !== 0);
  if (medians.length < 2) return;
  const hi = medians.reduce((a, b) => (b.m > a.m ? b : a));
  const lo = medians.reduce((a, b) => (b.m < a.m ? b : a));
  const ratio = hi.m / lo.m;
  if (ratio > 20)
    ctx?.warnings?.push(
      `${kind}: series "${hi.name ?? "?"}" and "${lo.name ?? "?"}" differ by ${ratio.toFixed(
        0
      )}x in scale (medians ${lo.m.toFixed(2)} vs ${hi.m.toFixed(2)}). On the shared axis, "${
        lo.name ?? "?"
      }" will render as a flat, information-free line. Add "index":true to rebase every series to 100 at its first value.`
    );
}

// visual-language.md documents axes <=7 (labels crowd past that) and radar()'s geometry
// clamps every value to Math.max(0, ...) (a negative value and 0 draw the identical vertex).
// Neither was ever checked before this, an 8+ axis radar or a negative-value axis rendered
// exactly as if it were valid, with no signal the shape was misleading. Geometry stays
// untouched (radar() itself isn't changed, see charts.mjs); these run BEFORE the chart draws.
function checkRadarAxesCount(axes, ctx) {
  if (axes.length > 7)
    ctx?.warnings?.push(
      `radar: ${axes.length} axes exceeds the documented 7-axis ceiling, labels will crowd; cut to the most discriminating axes.`
    );
}
function checkRadarNegativeValues(series, axes, ctx) {
  for (const s of series || []) {
    (s.values || []).forEach((v, i) => {
      if (v < 0)
        ctx?.warnings?.push(
          `radar: series "${s.name ?? "?"}" axis "${axes[i] ?? i}" value ${v} is negative and renders as 0 (radar can't draw a negative value, -10 and 0 draw the identical vertex). A signed metric belongs in "bar" instead.`
        );
    });
  }
}

function radarBlock(b, ctx) {
  const series = sanitizeSeries(b.series, ctx, "radar");
  checkPeerColorLimit(series, ctx, "radar");
  checkRadarAxesCount(b.axes || [], ctx);
  checkRadarNegativeValues(series, b.axes || [], ctx);
  const chart = radar(series, { axes: b.axes || [], maxValue: b.maxValue || 100, size: b.size || 400 });
  return `<div class="b-radar" style="display:flex;flex-direction:column;align-items:center;">${
    b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""
  }${chart}${seriesLegend(series, "justify-content:center;")}</div>`;
}

function multiLineBlock(b, ctx) {
  const sanitized = sanitizeSeries(b.series, ctx, "multiline");
  // index:true rebases BEFORE checkPeerColorLimit/multiLine ever see the series, so the
  // mismatched-scale check below only ever runs on the case it exists for (an un-indexed deck).
  const series = b.index ? indexSeries(sanitized, ctx, "multiline") : sanitized;
  if (!b.index) checkMismatchedScale(sanitized, ctx, "multiline");
  checkPeerColorLimit(series, ctx, "multiline");
  const chart = multiLine(series, { w: b.w || 936, h: b.h || 320, startLabel: b.startLabel });
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${chart}${seriesLegend(
    series
  )}</div>`;
}

// stackedBar()'s geometry assumes every segment is >= 0 (each bar's total is the plain sum of
// its segments, and that total drives the shared height scale): a negative segment shrinks the
// total below the sum of the POSITIVE segments alone, so those positive segments' rects end up
// taller than the bar's own frame, drawn partly off-canvas. A real geometry break, not a
// cosmetic one (reproduced: a -15 segment among {40} rendered the 40-segment 544px tall inside
// a 340px-tall bar). Zeroing it (same in-place mechanism as a non-numeric value, see the
// position-preserving note above) keeps the total honest instead.
const CAP = 1 + PEER_COLORS.length; // gradient slot (segment 0) + distinct auto-assigned peer colors

function stackedBarBlock(b, ctx) {
  // Segments are matched to the legend BY POSITION (legend[i] <-> segments[i]), so a bad
  // segment is zeroed in place rather than dropped: dropping would silently shift every
  // later segment onto the wrong legend entry.
  const bars = (b.bars || []).map((bar) => ({
    ...bar,
    segments: (bar.segments || []).map((seg, i) => {
      const v = numOr(seg.value);
      if (v == null) {
        ctx?.warnings?.push(
          `stackedbar: bar "${bar.label ?? "?"}" segment ${i + 1} value ${JSON.stringify(seg.value)} is not a number, rendered as 0`
        );
        return { ...seg, value: 0 };
      }
      if (v < 0) {
        ctx?.warnings?.push(
          `stackedbar: bar "${bar.label ?? "?"}" segment ${i + 1} value ${v} is negative, dropped (rendered as 0). Stacked segments must be non-negative; a signed series belongs in "bar" (which handles negatives) or "waterfall".`
        );
        return { ...seg, value: 0 };
      }
      return { ...seg, value: v };
    }),
  }));
  // charts.mjs's stackedBar() auto-colors any segment with no explicit `color`: segment 0 gets
  // the brand gradient, every later uncolored segment cycles PEER_COLORS (3 entries) by
  // position (`PEER_COLORS[(si-1)%3]`), so a bar with more than 4 uncolored segments
  // mathematically reuses a color, the same ceiling checkPeerColorLimit enforces for
  // radar/multiline peers (1 self slot + 3 peer colors = 4 before repeats start).
  for (const bar of bars) {
    const uncolored = (bar.segments || []).filter((seg) => !seg.color).length;
    if (uncolored > CAP)
      ctx?.warnings?.push(
        `stackedbar: bar "${bar.label ?? "?"}" has ${uncolored} segments with no explicit "color", only ${CAP} distinct auto-colors exist. Colors will repeat and become indistinguishable; give every segment its own color.`
      );
  }
  const chart = stackedBar(bars, { w: b.w || 936, h: b.h || 460, maxTotal: b.maxTotal });
  // stackedBar() only labels each BAR's grand total — a segment's own size was only ever
  // visually inferable, never a readable number, the same "chart with no numbers" gap donut
  // had. Anchor each legend entry to its value in the most recent bar (legend[i] describes
  // segments[i] of every bar, matched positionally), so the current mix is always readable.
  const lastBar = bars[bars.length - 1];
  const legend =
    b.legend && b.legend.length
      ? `<div class="legend" style="margin-top:8px;flex-wrap:wrap;">${b.legend
          .map((l, i) => {
            const v = lastBar && lastBar.segments && lastBar.segments[i] ? lastBar.segments[i].value : null;
            return `<div class="item"><span class="sw" style="background:${l.color}"></span><span class="caption-t">${esc(l.label)}${
              v != null ? ` · ${esc(trimPct(v))}` : ""
            }</span></div>`;
          })
          .join("")}</div>`
      : "";
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${chart}${legend}</div>`;
}

// A fixed 3-item color key (total/increase/decrease), not a per-bar legend like the other
// charts, because a waterfall's bars already print their own value + label — the one thing
// missing is which COLOR means which direction, not what any individual bar is worth.
function waterfallBlock(b, ctx) {
  // Dropping a bad contributor changes the walk, but the waterfall is self-checking: the
  // connector before the final total will visibly not reach it, and the warning names the
  // dropped bar, so the failure is loud twice rather than a NaN-blank chart.
  const bars = sanitizeBars(b.bars, ctx, "waterfall");
  const chart = waterfall(bars, { w: b.w || 936, h: b.h || 460 });
  const key =
    b.legend === false
      ? ""
      : `<div class="legend" style="margin-top:8px;">
    <div class="item"><span class="sw" style="background:var(--brandGradient)"></span><span class="caption-t">Total</span></div>
    <div class="item"><span class="sw" style="background:#1FB36A"></span><span class="caption-t">Increase</span></div>
    <div class="item"><span class="sw" style="background:#E0003B"></span><span class="caption-t">Decrease</span></div>
  </div>`;
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${chart}${key}</div>`;
}

// Two independent axes (no shared min/max, unlike bar/multiline/radar): a peers report's
// pe_ttm vs market_cap for ~10 peers, or brokers/top's gross vs net. A point with a
// non-numeric x or y can't be placed at all, there's no shared scale to fall back into the
// way sanitizeBars' "keep what coerces" can, so it's dropped whole, named in the warning. A
// log-scale axis additionally can't place a non-positive value (log of 0 or a negative is
// undefined), a second, scale-specific drop reason. At most one point may be "self"; a second
// one is a likely copy-paste slip, not a valid spec, so it warns and demotes to peer rather
// than letting the LAST self silently win and hide the first (first wins, same as
// resolveSeriesColors' `.find()` for radar/multiline's self).
function sanitizeScatterPoints(points, ctx, spec) {
  const out = [];
  let sawSelf = false;
  for (const raw of points || []) {
    const label = raw.label ?? "?";
    const x = numOr(raw.x), y = numOr(raw.y);
    if (x == null || y == null) {
      ctx?.warnings?.push(`scatter: dropped point "${label}", x/y (${JSON.stringify(raw.x)}, ${JSON.stringify(raw.y)}) is not numeric`);
      continue;
    }
    if (spec.xScale === "log" && x <= 0) {
      ctx?.warnings?.push(`scatter: dropped point "${label}", x=${x} is <=0 and "xScale":"log" needs a positive value`);
      continue;
    }
    if (spec.yScale === "log" && y <= 0) {
      ctx?.warnings?.push(`scatter: dropped point "${label}", y=${y} is <=0 and "yScale":"log" needs a positive value`);
      continue;
    }
    let self = Boolean(raw.self);
    if (self && sawSelf) {
      ctx?.warnings?.push(`scatter: point "${label}" also sets "self":true, but an earlier point already claimed it, the first "self" wins, this point renders as a peer`);
      self = false;
    }
    if (self) sawSelf = true;
    out.push({ ...raw, x, y, self });
  }
  if (out.length > 12)
    ctx?.warnings?.push(
      `scatter: ${out.length} points exceeds the ~12-point readability ceiling, labels already thin to self + axis outliers past 6, and past 12 the dot field itself crowds; consider a "table" block for this many entities.`
    );
  return out;
}

function scatterBlock(b, ctx) {
  const points = sanitizeScatterPoints(b.points, ctx, b);
  const chart = scatter(points, {
    w: b.w || 936,
    h: b.h || 560,
    xLabel: b.xLabel || "",
    yLabel: b.yLabel || "",
    xScale: b.xScale,
    yScale: b.yScale,
  });
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${chart}</div>`;
}

// N tickers x M metrics, all visible at once. `ranking`/`comparison` above cap at ONE metric +
// one delta per row — three evals independently hit that ceiling trying to show a screener's
// full result set (5-10 tickers) against more than one metric at a time (e.g. P/E AND yield),
// and radar/multiline are the wrong shape for it too (built for one subject vs 2-3 peers, not
// N unrelated entities with no natural "self"). This is a plain grid, not a chart, so column
// count decides the layout via CSS grid rather than fixed pixel math.
function matrixBlock(b, ctx) {
  const columns = b.columns || [];
  const rows = b.rows || [];
  // `.b-matrix` itself is the ONE grid container, every cell below is a direct child of it
  // (not nested per-row grids) so every row shares the exact same column tracks. A per-row
  // grid looks identical when every value in a column happens to share a character count
  // (that's how a first pass rendered, misalignment was masked by coincidence, not fixed),
  // but breaks the moment one row's number is a different width than its neighbors'.
  const gridCols = `44px 1fr repeat(${columns.length || 1}, minmax(0,auto))`;
  const headCells = `<span></span><span></span>${columns.map((c) => `<span class="mx-col">${esc(c)}</span>`).join("")}`;
  // matrixBlock used to be the one chart primitive outside "degradation is never silent": a
  // row with no name/ticker, a values.length that didn't match columns.length, and a
  // non-primitive/null cell value all rendered blank with zero warning anywhere. Coerce what
  // coerces (strings/numbers pass through as before), warn and render an em-dash-free empty
  // cell for what doesn't, naming the row/column so the fix is findable.
  const bodyCells = rows
    .map((r, i) => {
      const border = i === 0 ? "" : ' style="border-top:1px solid var(--border)"';
      const selfCls = r.self ? " self" : "";
      const label = r.name || tkr(r.ticker) || `row ${i + 1}`;
      if (!r.name && !r.ticker) ctx?.warnings?.push(`table: row ${i + 1} has no "name" or "ticker", cell renders blank`);
      const values = r.values || [];
      if (columns.length && values.length !== columns.length)
        ctx?.warnings?.push(
          `table: row ${i + 1} ("${label}") has ${values.length} value(s) for ${columns.length} column(s), columns and values will misalign`
        );
      const cells = columns
        .map((col, ci) => {
          const raw = values[ci];
          if (raw == null) {
            ctx?.warnings?.push(`table: row ${i + 1} ("${label}") column "${col}" has no value, cell renders blank`);
            return `<span class="mx-val${selfCls}"${border}></span>`;
          }
          if (typeof raw !== "string" && typeof raw !== "number") {
            ctx?.warnings?.push(`table: row ${i + 1} ("${label}") column "${col}" value is not text/number (${JSON.stringify(raw)}), cell renders blank`);
            return `<span class="mx-val${selfCls}"${border}></span>`;
          }
          return `<span class="mx-val${selfCls}"${border}>${esc(raw)}</span>`;
        })
        .join("");
      return (
        `<span class="mx-rank${selfCls}"${border}>${i + 1}</span>` +
        `<span class="mx-name${selfCls}"${border}>${rowLogo(r, ctx)}${esc(label)}</span>` +
        cells
      );
    })
    .join("");
  return `<div class="glass b-matrix" style="grid-template-columns:${gridCols}">${headCells}${bodyCells}</div>`;
}

// One grid primitive serving three data families that all boil down to "category x period,
// one number per cell": shareholders-composition's holder-type x month deltas (a TREND, used
// to force stackedbar) vs a single month's snapshot (a SNAPSHOT, used to force donut), never
// both dimensions in one visual; historical_financial_ratio's metric x year; or any peer x
// metric mini-matrix. Built the same way `table` (matrixBlock, above) is, a plain CSS grid,
// not SVG, because a heatmap IS a table with a colored background per cell, not a shape
// chart; reusing table's architecture (shared grid tracks, warn-and-blank per cell) beat
// hand-computing SVG rect positions for the same information.
// Duplicated hex (not imported from charts.mjs) for the same reason OWN_COLORS above is: a
// small, stable set of brand/semantic colors, cheap to keep in sync by eye, not worth a
// cross-file color-registry for three hex codes.
const HEATMAP_PINK = "229,51,126"; // --brandPink
const HEATMAP_GAIN = "31,179,106"; // --gain
const HEATMAP_LOSS = "224,0,59"; // --loss

// Text color per cell, picked by background alpha. At low alpha the cell is still mostly the
// near-black page background (--bg), so light text is always the right call there. At alpha 1
// (the cell IS the pure hue) relative-luminance contrast against white text differs a lot by
// hue: brandPink ~4.1:1, --loss ~4.9:1 (both still clear the 4.5:1 body-text floor with light
// text, so they never flip), but --gain's luminance is high enough that white drops to ~2.7:1
// while dark text (matching --bg) rises to ~5.5:1, gain is the one hue bright enough at full
// intensity to need dark text. 0.7 is where that crossover lands (interpolated between alpha
// 0.6, where light still wins clearly, and alpha 0.85, where dark clearly does).
function heatmapCellText(hue, alpha) {
  if (hue === "gain" && alpha >= 0.7) return "#0C0A09";
  return "#F6F1EE";
}

function heatmapCellStyle(cell, mode, max, absMax) {
  if (!cell) return { bg: "transparent", text: "#6E6661" };
  if (mode === "diverging") {
    if (cell.v === 0) return { bg: "rgba(246,241,238,0.05)", text: "#F6F1EE" };
    const hue = cell.v > 0 ? "gain" : "loss";
    const rgb = hue === "gain" ? HEATMAP_GAIN : HEATMAP_LOSS;
    const alpha = absMax ? Math.min(1, Math.abs(cell.v) / absMax) : 0;
    return { bg: `rgba(${rgb},${alpha.toFixed(2)})`, text: heatmapCellText(hue, alpha) };
  }
  const alpha = max > 0 ? Math.max(0, Math.min(1, cell.v / max)) : 0;
  return { bg: `rgba(${HEATMAP_PINK},${alpha.toFixed(2)})`, text: heatmapCellText("pink", alpha) };
}

function heatmapBlock(b, ctx) {
  const rows = b.rows || [];
  const cols = b.cols || [];
  let mode = b.mode;
  if (mode !== "diverging" && mode !== "sequential") {
    if (mode != null)
      ctx?.warnings?.push(`heatmap: unknown "mode" ${JSON.stringify(b.mode)}, falling back to "sequential" (allowed: "sequential", "diverging")`);
    mode = "sequential";
  }

  // A row shorter/longer than `cols` warns ONCE for the row (not once per missing cell,
  // that would spam a warning list for what's really one authoring mistake); an in-bounds
  // cell that's explicitly non-numeric gets its OWN warning naming the row/col, a different
  // failure (a real bad value, not just a short array).
  const grid = rows.map((rowLabel, ri) => {
    const rawRow = (b.values || [])[ri] || [];
    if (rawRow.length !== cols.length)
      ctx?.warnings?.push(`heatmap: row ${ri + 1} ("${rowLabel}") has ${rawRow.length} value(s) for ${cols.length} column(s), extra/missing cells render blank`);
    return cols.map((colLabel, ci) => {
      const raw = rawRow[ci];
      const v = numOr(raw);
      if (v == null) {
        if (raw !== undefined) ctx?.warnings?.push(`heatmap: row "${rowLabel}" col "${colLabel}" value ${JSON.stringify(raw)} is not a number, cell renders empty`);
        return null;
      }
      const disp = b.display && b.display[ri] && b.display[ri][ci] != null ? String(b.display[ri][ci]) : trimPct(v);
      return { v, disp };
    });
  });

  const allVals = grid.flat().filter(Boolean).map((c) => c.v);
  const max = allVals.length ? Math.max(...allVals) : 0;
  const absMax = allVals.length ? Math.max(...allVals.map((v) => Math.abs(v))) : 0;

  // Density ceiling: the grid sits inside a .glass card (68px of its own horizontal padding)
  // on the 936px content width, minus a reserved row-label column, so a cell narrower than
  // ~56px is roughly where digits start crowding into each other. Still renders past that
  // point (the color/shape read still works even when the printed number gets tight), just
  // warns, same "coerce and warn, never silently refuse" rule as everything else here.
  const availW = 936 - 68 - 150; // glass padding + row-label column, both approximate on purpose
  const cellW = cols.length ? availW / cols.length : availW;
  if (cellW < 56)
    ctx?.warnings?.push(
      `heatmap: ${rows.length}x${cols.length} grid puts cells at ~${Math.round(cellW)}px wide, below the ~56px readability floor, trim rows/cols or split into more slides.`
    );
  const fontSize = cellW < 56 ? 16 : cellW < 76 ? 18 : cellW < 100 ? 20 : 22;

  const gridCols = `minmax(140px,auto) repeat(${cols.length || 1}, minmax(0,1fr))`;
  // Columns are always period/metric labels in every documented use of this chart (months,
  // years, ratio names), the same convention barChart's x-axis labels and .tl-date already
  // use mono for anything date/period-shaped, so columns go mono unconditionally rather than
  // guessing at a date-detection regex for what's already true in practice.
  const head = `<span class="hm-corner"></span>${cols.map((c) => `<span class="hm-col">${esc(c)}</span>`).join("")}`;
  const body = rows
    .map((rowLabel, ri) => {
      const cells = grid[ri]
        .map((cell) => {
          const { bg, text } = heatmapCellStyle(cell, mode, max, absMax);
          const val = cell ? esc(cell.disp) : "";
          return `<span class="hm-cell" style="background:${bg};color:${text};font-size:${fontSize}px;">${val}</span>`;
        })
        .join("");
      return `<span class="hm-row">${esc(rowLabel)}</span>${cells}`;
    })
    .join("");
  const grid_ = `<div class="glass b-heatmap" style="grid-template-columns:${gridCols}">${head}${body}</div>`;
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${grid_}</div>`;
}

// ---- bump chart sanitize/govern ----
// A duplicate symbol within one day is a likely copy-paste slip (two rows both "GOTO" on the
// same date); keeping the FIRST occurrence and dropping the rest (same "first wins" convention
// as resolveSeriesColors' self and scatter's sanitizeScatterPoints' second-self) leaves every
// other symbol on that day untouched rather than dropping the whole day over one bad row.
function sanitizeBumpDays(days, ctx) {
  const out = [];
  for (const d of days || []) {
    const seen = new Set();
    const entries = [];
    for (const e of d.entries || []) {
      if (!e || !e.symbol) {
        ctx?.warnings?.push(`bump: day "${d.date ?? "?"}" has an entry with no "symbol", dropped`);
        continue;
      }
      if (seen.has(e.symbol)) {
        ctx?.warnings?.push(`bump: day "${d.date ?? "?"}" has a duplicate symbol "${e.symbol}", kept the first occurrence`);
        continue;
      }
      seen.add(e.symbol);
      let value = null;
      if (e.value !== undefined) {
        value = numOr(e.value);
        if (value == null)
          ctx?.warnings?.push(`bump: day "${d.date ?? "?"}" symbol "${e.symbol}" value ${JSON.stringify(e.value)} is not a number, dropped (rank position kept)`);
      }
      entries.push({ symbol: e.symbol, value, display: e.display });
    }
    out.push({ date: d.date, entries });
  }
  return out;
}

// Explicit `highlight` wins if the symbol actually appears somewhere in the data; a typo'd or
// absent one silently emphasizing nothing would look like a rendering bug, not a deliberate
// data choice, so it warns and falls back to auto-detect rather than just rendering
// unemphasized. Auto-detect looks for exactly the pattern sectors-api/endpoints.md's
// most-traded doc calls a story on its own: one symbol holding rank 1 on EVERY tracked day
// (and since only one entry can occupy the rank-1 slot on any given day, at most one symbol
// can ever satisfy this, so the check is just "is day 0's rank-1 symbol still rank 1 on every
// later day").
function resolveBumpHighlight(days, highlight, ctx) {
  const allSymbols = new Set(days.flatMap((d) => d.entries.map((e) => e.symbol)));
  if (highlight) {
    if (allSymbols.has(highlight)) return highlight;
    ctx?.warnings?.push(`bump: "highlight":"${highlight}" never appears in the data, falling back to auto-detect`);
  }
  if (!days.length || !days[0].entries.length) return null;
  const first = days[0].entries[0].symbol;
  const holdsRank1Always = days.every((d) => d.entries[0] && d.entries[0].symbol === first);
  return holdsRank1Always ? first : null;
}

function checkBumpWarnings(days, ctx) {
  if (!days.length) {
    ctx?.warnings?.push(`bump: "days" is empty, nothing to render`);
    return;
  }
  if (days.length === 1)
    ctx?.warnings?.push(`bump: a single day has no ranking movement to show — this is a "ranking" (or "table"), not a bump chart`);
  if (days.length > 14)
    ctx?.warnings?.push(`bump: ${days.length} days exceeds the ~14-day readability ceiling, dates will crowd even with label thinning`);
  const maxSlots = Math.max(0, ...days.map((d) => d.entries.length));
  if (maxSlots > 6)
    ctx?.warnings?.push(`bump: ${maxSlots} rank slots exceeds the ~6-slot readability ceiling, lines will crowd; cut to the top N that matters`);
}

function bumpBlock(b, ctx) {
  const days = sanitizeBumpDays(b.days, ctx);
  checkBumpWarnings(days, ctx);
  const highlight = resolveBumpHighlight(days, b.highlight, ctx);
  const chart = bump(days, { w: b.w || 936, h: b.h || 520, highlight });
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${chart}</div>`;
}

// ---- sankey sanitize/govern ----
// A link with a non-positive or non-numeric value can't size a ribbon at all — there's no
// shared scale to fall back into the way sanitizeBars' "keep what coerces" can for a bar chart
// — so it's dropped whole and named, same reasoning as scatter's missing x/y.
function sanitizeSankeyLinks(links, ctx) {
  const out = [];
  for (const l of links || []) {
    if (!l || !l.source || !l.target) {
      ctx?.warnings?.push(`sankey: dropped a link with no "source"/"target"`);
      continue;
    }
    if (l.source === l.target) {
      ctx?.warnings?.push(`sankey: dropped link "${l.source}" -> "${l.target}", a node can't flow into itself`);
      continue;
    }
    const value = numOr(l.value);
    if (value == null || value <= 0) {
      ctx?.warnings?.push(`sankey: dropped link "${l.source}" -> "${l.target}", value ${JSON.stringify(l.value)} is not a positive number`);
      continue;
    }
    out.push({ source: l.source, target: l.target, value, display: l.display });
  }
  return out;
}

// A layered left-to-right layout REQUIRES a DAG (sankeyDepths walks parent -> child depth
// assuming no cycles); a cycle (A -> B -> A) has no well-defined "further right" direction to
// draw in. Detected via DFS recursion-stack (a back edge to a node still on the CURRENT path IS
// the cycle); drops the edge that CLOSES it — the one DFS was about to follow when it found the
// back edge — rather than an arbitrary one in the cycle, since that's the edge a reader would
// actually recognize as "the one that loops back." Re-runs after each drop (dropping one edge
// can still leave a second, unrelated cycle elsewhere); the loop bound (link count + 1) can't
// be exceeded since every iteration that doesn't return early removes exactly one link.
function dropCycleEdges(links, ctx) {
  let current = links;
  for (let guard = 0; guard <= current.length; guard++) {
    const adj = new Map();
    for (const l of current) {
      if (!adj.has(l.source)) adj.set(l.source, []);
      adj.get(l.source).push(l);
    }
    const state = new Map(); // 0/undefined unvisited, 1 in-progress, 2 done
    let closingEdge = null;
    const dfs = (node) => {
      if (closingEdge) return;
      state.set(node, 1);
      for (const l of adj.get(node) || []) {
        if (closingEdge) return;
        const s = state.get(l.target) || 0;
        if (s === 1) { closingEdge = l; return; }
        if (s === 0) dfs(l.target);
      }
      state.set(node, 2);
    };
    const allNodes = new Set(current.flatMap((l) => [l.source, l.target]));
    for (const nd of allNodes) {
      if (closingEdge) break;
      if (!state.get(nd)) dfs(nd);
    }
    if (!closingEdge) return current;
    ctx?.warnings?.push(`sankey: dropped link "${closingEdge.source}" -> "${closingEdge.target}", it closes a cycle (a layered layout needs a DAG)`);
    current = current.filter((l) => l !== closingEdge);
  }
  return current;
}

// Links below ~2% of the root total are collapse CANDIDATES, but only merge when a target has
// 2+ of them: a single small link merged alone would just rename that one real segment
// "Other (1)", losing its name for zero decluttering benefit. Calibrated against TLKM's real
// 17-edge tree (sectors-api/data-quality.md's reconciling example): the obvious first guess,
// ~3% of root, collapses THREE of TLKM's real segments (Fixed line 0.3%, Network 2.1%, Lessor
// 2.0%) into the same target, which fails this chart's own reference case ("TLKM renders
// without collapsing"); ~2% leaves only Fixed line below the line (alone, so it doesn't
// qualify for a merge either) and keeps Network/Lessor, both just above 2%, as their own
// named, individually-legible slivers — the outcome an editor would actually want.
const SANKEY_COLLAPSE_PCT = 0.02;

function collapseSmallLinks(links, ctx) {
  const totals = sankeyNodeTotals(links);
  const rootTotal =
    [...totals.entries()].filter(([, t]) => !t.inSum).reduce((s, [, t]) => s + t.outSum, 0) ||
    links.reduce((s, l) => s + l.value, 0) ||
    1;
  const byTarget = new Map();
  for (const l of links) {
    if (!byTarget.has(l.target)) byTarget.set(l.target, []);
    byTarget.get(l.target).push(l);
  }
  const drop = new Set();
  const added = [];
  for (const [target, group] of byTarget) {
    const small = group.filter((l) => l.value / rootTotal < SANKEY_COLLAPSE_PCT);
    if (small.length < 2) continue;
    const total = small.reduce((s, l) => s + l.value, 0);
    small.forEach((l) => drop.add(l));
    added.push({ source: `Other (${small.length})`, target, value: total });
    ctx?.warnings?.push(
      `sankey: collapsed ${small.length} links into "Other (${small.length})" -> "${target}" (${small
        .map((l) => l.source)
        .join(", ")}), each was below ${(SANKEY_COLLAPSE_PCT * 100).toFixed(0)}% of the root total`
    );
  }
  return links.filter((l) => !drop.has(l)).concat(added);
}

// A node's inflow/outflow mismatch is drawn as a visible hatch by sankey() itself (charts.mjs),
// computed from the SAME sankeyNodeTotals() this check calls — reusing that shared helper
// (rather than each re-deriving sums from the link list independently) is what keeps this
// warning's text from ever disagreeing with what the chart actually drew, the same "one shared
// source" principle collectTickers/CHART_KINDS already hold elsewhere in this file.
function checkSankeyMismatch(links, ctx) {
  const totals = sankeyNodeTotals(links);
  for (const [node, t] of totals) {
    if (t.inSum > 0 && t.outSum > 0) {
      const bigger = Math.max(t.inSum, t.outSum), smaller = Math.min(t.inSum, t.outSum);
      const ratio = (bigger - smaller) / bigger;
      if (ratio > SANKEY_MISMATCH_THRESHOLD)
        ctx?.warnings?.push(
          `sankey: node "${node}" doesn't reconcile, inflow ${t.inSum} vs outflow ${t.outSum} (${(ratio * 100).toFixed(
            1
          )}% gap) — drawing the gap as a hatch instead of stretching either side to fit.`
        );
    }
  }
}

function checkSankeyCaps(links, ctx) {
  if (links.length > 24)
    ctx?.warnings?.push(`sankey: ${links.length} links exceeds the ~24-link readability ceiling, trim the tree or split into more slides.`);
  if (!links.length) return;
  const depths = sankeyDepths(links);
  const layerCount = Math.max(0, ...[...depths.values()]) + 1;
  if (layerCount > 5)
    ctx?.warnings?.push(`sankey: ${layerCount} layers exceeds the ~5-layer readability ceiling, the diagram will run wide and thin; cut the deepest branch.`);
}

function sankeyBlock(b, ctx) {
  let links = sanitizeSankeyLinks(b.links, ctx);
  links = dropCycleEdges(links, ctx);
  links = collapseSmallLinks(links, ctx);
  checkSankeyMismatch(links, ctx);
  checkSankeyCaps(links, ctx);
  const chart = sankey(links, { w: b.w || 936, h: b.h || 820, unit: b.unit || "" });
  return `<div class="b-bar">${b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""}${chart}</div>`;
}

// Dated event rows with a connector, for a filing cluster / corporate-action sequence — an
// eval needed to show "4 lonely filings over 6 months, then 6 crammed into one afternoon" and
// had no way to express simultaneity or clustering, only a bar chart (which collapses same-day
// events into one bar) or prose. Consecutive events sharing the same `date` string group under
// ONE date header instead of repeating it, so a cluster visually compresses (many rows, one
// header) while spread-out events each get their own header, the grouping communicates the
// cadence without needing real time-proportional spacing.
function timelineBlock(b) {
  const events = b.events || [];
  const groups = [];
  for (const e of events) {
    const g = groups[groups.length - 1];
    if (g && g.date === e.date) g.items.push(e);
    else groups.push({ date: e.date, items: [e] });
  }
  const html = groups
    .map(
      (g) => `<div class="tl-group">
    <div class="tl-date">${esc(g.date)}</div>
    ${g.items
      .map(
        (e) => `<div class="tl-row"><span class="tl-dot"></span><div class="tl-body"><div class="tl-label">${esc(e.label)}</div>${
          e.detail ? `<div class="tl-detail">${esc(e.detail)}</div>` : ""
        }</div></div>`
      )
      .join("")}
  </div>`
    )
    .join("");
  return `<div class="b-timeline">${html}</div>`;
}

// donut() only draws the ring + ONE center callout — fine for a 2-segment donut (the other
// segment is trivially 100-minus), but analyst-consensus and revenue-mix donuts are
// documented as 3-5 segments, and every segment past the center one had NO number anywhere,
// the same "chart with no numbers" gap multiLine had. Auto-legend each segment's label+pct
// so a multi-segment donut never ships silent on everything but its one callout figure.
function donutBlock(b, ctx) {
  // Filter BEFORE both the ring and the legend so they can't disagree about which
  // segments exist; donut() itself also skips non-finite pct so it can never crash.
  const segments = [];
  for (const s of b.segments || []) {
    const pct = numOr(s.pct);
    if (pct == null)
      ctx?.warnings?.push(`donut: dropped segment "${s.label ?? "?"}", pct ${JSON.stringify(s.pct)} is not a number`);
    else segments.push({ ...s, pct });
  }
  // pct values are documented as percentages of a whole (visual-language.md), so they should
  // sum to ~100, a deck that fed absolute values instead (or just miscounted) used to render
  // a mostly-empty ring with zero signal anywhere that anything was wrong. Warn, don't rescale:
  // silently stretching the segments to fill the ring would draw a shape the data never had,
  // the same "never fabricate to fit the frame" reasoning as the waterfall's self-checking gap.
  const pctSum = segments.reduce((acc, s) => acc + s.pct, 0);
  if (segments.length && Math.abs(pctSum - 100) > 2)
    ctx?.warnings?.push(
      `donut: segments sum to ${trimPct(pctSum)}, not ~100. The ring will look ${pctSum < 100 ? "mostly empty" : "overfull"}. pct values are percentages of a whole; convert absolutes to shares before writing the spec.`
    );
  const chart = donut(segments, { size: b.size || 360, centerLabel: b.centerLabel || "", centerSub: b.centerSub || "" });
  const legend = segments.some((s) => s.label)
    ? `<div class="legend" style="margin-top:8px;flex-wrap:wrap;">${segments
        .filter((s) => s.label)
        .map(
          (s) =>
            `<div class="item"><span class="sw" style="background:${s.color}"></span><span class="caption-t">${esc(s.label)} · ${esc(
              trimPct(s.pct)
            )}%</span></div>`
        )
        .join("")}</div>`
    : "";
  return `<div style="display:flex;flex-direction:column;align-items:center;">${
    b.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(b.caption)}</div>` : ""
  }${chart}${legend}</div>`;
}
const trimPct = (n) => (Math.round(n * 10) / 10).toString();

export function renderBlock(block, ctx = {}) {
  const fn = RENDER[block.kind];
  if (!fn) {
    ctx.warnings?.push(`unknown/unimplemented block kind: "${block.kind}" (skipped)`);
    return "";
  }
  return fn(block, ctx);
}

// ---------- slide composition ----------
const IG_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.4"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.05" fill="currentColor" stroke="none"/></svg>`;
const GLOBE_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9.3"/><path d="M2.7 12h18.6"/><path d="M12 2.7c2.6 2.7 3.9 6 3.9 9.3s-1.3 6.6-3.9 9.3c-2.6-2.7-3.9-6-3.9-9.3s1.3-6.6 3.9-9.3z"/></svg>`;

function footerHTML(deck, ctx, extraAttr) {
  const f = deck.footer || {};
  const handle = f.handle || "@sectorsapp";
  const site = f.site || "sectors.app";
  const attribution = extraAttr ? f.attribution || "supertype.ai" : null;
  const mark = ctx.brand && ctx.brand.mark ? ctx.brand.mark : "";
  return `<div class="footer">
    <div class="brand">${mark}<span class="wordmark">Sectors</span></div>
    <div class="handles">
      <span class="hitem">${IG_SVG}${esc(handle)}</span>
      <span class="hitem">${GLOBE_SVG}${esc(site)}</span>
      ${attribution ? `<span class="divider"></span><span class="attr">${esc(attribution)}</span>` : ""}
    </div>
  </div>`;
}

// The cover's ONE support element (house-style.md §8): a subhead line OR a single stat,
// optionally paired with a second figure for a direct comparison ("12%  vs  6.8%").
// Plain text color, no gradient — the headline's emphasis already owns the one brand moment.
function coverStatHTML(stat) {
  if (!stat || !stat.value) return "";
  const item = (value, label) =>
    `<div class="item"><div class="v num autofit">${esc(value)}</div><div class="l">${esc(label || "")}</div></div>`;
  const compare = stat.compare && stat.compare.value ? `<div class="vs">VS</div>${item(stat.compare.value, stat.compare.label)}` : "";
  return `<div class="cover-stat">${item(stat.value, stat.label)}${compare}</div>`;
}

// Every ticker this cover is "about", from either field: `tickers` (new, N-ticker general
// case) or `chip.ticker` (legacy single-ticker shorthand, kept for backward compat — the
// sample deck and every eval deck so far use it). `tickers` wins if both are somehow given.
// Falls back to `duel.series[].name` last: a duel cover names its tickers there for the
// chart, and requiring the SAME names again in `tickers` was a silent trap (chip row + every
// logo just vanished if a deck only set `duel`, see collectTickers above), not a real choice.
function coverTickers(slide) {
  if (slide.tickers && slide.tickers.length) return slide.tickers;
  if (slide.chip && slide.chip.ticker) return [slide.chip.ticker];
  if (slide.duel && slide.duel.series && slide.duel.series.length) return slide.duel.series.map((s) => s.name).filter(Boolean);
  return [];
}

// Optional cover backdrop art: a subject photograph (a product, an object the story is
// literally about) sitting behind the hook, not a chart. It rides in the same `.layer`
// stack as the nebula and dot grid so it can never collide with the hook or the footer,
// and it is deliberately capped: low opacity plus a soft edge mask, because the cover's
// job is still the headline. A cutout PNG with a transparent surround reads best; a
// photo with its own background will show as a rectangle.
//   coverArt: { src, width?, right?, top?, bottom?, opacity?, fade? }
// `src` is a data URI or path the page can load. Percentages are of the stage.
function coverArtLayer(art, ctx) {
  if (!art || !art.src) return "";
  const width = art.width || "62%";
  const opacity = art.opacity == null ? 0.3 : art.opacity;
  const fade = art.fade === false ? "" : "-webkit-mask-image:radial-gradient(closest-side at 50% 50%,#000 55%,transparent 100%);mask-image:radial-gradient(closest-side at 50% 50%,#000 55%,transparent 100%);";
  const vertical = art.bottom != null ? `bottom:${art.bottom};` : `top:${art.top == null ? "18%" : art.top};`;
  const horizontal = art.left != null ? `left:${art.left};` : `right:${art.right == null ? "-6%" : art.right};`;
  // `.layer` is inset:0; reset it so top/right/width actually position the art
  return `<div class="layer coverart" style="inset:auto;height:auto;${vertical}${horizontal}width:${width};opacity:${opacity};${fade}"><img src="${esc(
    art.src
  )}" alt="" style="width:100%;display:block;"></div>`;
}

function renderCover(slide, deck, ctx) {
  const tickers = coverTickers(slide);
  // Backdrop series go through the same value gate as content charts: a NaN point in the
  // spark path would blank the whole backdrop silently.
  const sparkPoints = ((slide.spark && slide.spark.points) || []).map(numOr).filter((v) => v != null);
  if (slide.spark && slide.spark.points && sparkPoints.length < slide.spark.points.length)
    ctx.warnings?.push("cover spark: dropped non-numeric point(s) from spark.points");
  const spark = sparkPoints.length ? coverSpark(sparkPoints, { dir: slide.spark.change >= 0 ? "up" : "down" }) : "";
  const callout = slide.spark
    ? `<div class="glass spark-callout">${slide.chip ? logoBox(slide.chip.ticker, ctx, slide.chip.logoUrl) : ""}<span class="t">${esc(slide.spark.label || "")}</span><span class="num" style="font-size:26px;color:var(--${
        slide.spark.change >= 0 ? "gain" : "loss"
      })">${slide.spark.change >= 0 ? "+" : ""}${esc(slide.spark.change)}%</span></div>`
    : "";
  // duel: the 2-ticker sibling of spark, for a head-to-head comparison piece's cover backdrop
  // (e.g. two companies' indexed price over the same window); visual-language.md's "Duel"
  // archetype is documented as exactly 2 tickers, 3+ is the "Field" archetype (tickers row,
  // no chart backdrop, see coverChips below). Mutually exclusive with spark, same "warn and
  // pick one" pattern as stat/support below, spark wins since it's the older/more common field
  // so an accidental double-set favors existing behavior.
  if (slide.spark && slide.duel) ctx.warnings?.push('cover has both "spark" and "duel" — use one, using "spark" and dropping "duel".');
  const duelSanitized = !slide.spark && slide.duel ? sanitizeSeries(slide.duel.series, ctx, "cover duel") : [];
  // duel shares multiline's exact series grammar (self/peer, one shared min/max), so it shares
  // its index:true escape hatch and mismatched-scale warning too. See indexSeries/
  // checkMismatchedScale above (multiLineBlock is the other call site).
  const duelSeries = slide.duel && slide.duel.index ? indexSeries(duelSanitized, ctx, "cover duel") : duelSanitized;
  if (slide.duel && !slide.duel.index) checkMismatchedScale(duelSanitized, ctx, "cover duel");
  // The duel backdrop shares the SAME 3-peer-color ceiling as radar/multiline (resolveSeriesColors,
  // same PEER_COLORS array), but used to be the one series-based chart path that never ran
  // checkPeerColorLimit: a 5-series duel cover (1 self + 4 peers) rendered with zero warning,
  // two lines silently sharing a color with no way for a reader to tell them apart.
  checkPeerColorLimit(duelSeries, ctx, "cover duel");
  const duel = duelSeries.length ? coverDuel(duelSeries) : "";
  const size = (slide.headline || "").length > 22 ? 84 : 104;
  // House style allows ONE support element: a subhead line OR a stat, never both.
  if (slide.stat && slide.support)
    ctx.warnings?.push('cover has both "stat" and "support" — house style allows one, using "stat" and dropping "support".');
  const stat = coverStatHTML(slide.stat);
  const support = !slide.stat && slide.support ? `<div class="support">${esc(slide.support)}</div>` : "";
  // Gradient is the one brand moment per slide and is reserved for EMPHASIS only:
  // the headline renders in base text color with just the verdict word/number in gradient.
  // (No full-title gradient — that dilutes the brand moment. Samuel's rule.)
  if (slide.headline && !slide.emphasis)
    ctx.warnings?.push(
      'cover headline has no "emphasis" — gradient is emphasis-only, so the hook renders flat. Add "emphasis" (the verdict word or number to gradient).'
    );
  const headline = slide.headline
    ? `<div class="headline" style="font-size:${size}px;">${emphasize(slide.headline, slide.emphasis)}</div>`
    : "";
  // The standalone chip row is skipped only in the legacy single-ticker-with-spark case,
  // where the spark-callout already embeds that one logo — showing it twice would be
  // redundant clutter. Every other case (no spark, a duel, or 2+ tickers) gets the row, so
  // a cover never silently drops the mark for a ticker it names, whether solo or in a group.
  const skipChipRow = Boolean(slide.spark) && tickers.length <= 1;
  const chips = skipChipRow ? "" : coverChips(tickers, ctx);
  // The spacer's job is to push the hook BELOW the spark/duel graphic (image on top, text at
  // bottom). Without one there's nothing above to push away from, so an unconditional
  // spacer just soaks up the whole cover and collapses the hook into the bottom sliver,
  // leaving the top ~60% empty — a real void an eval caught (covers are the majority case,
  // spark is documented as optional). Center the hook instead when there's no top visual;
  // the footer stays pinned to the very bottom either way since it's outside this wrapper.
  const hasTopVisual = Boolean(spark || callout || duel);
  return `<div class="content">
    <div class="cover-body" style="flex:1;display:flex;flex-direction:column;${hasTopVisual ? "" : "justify-content:center;"}">
      ${spark}
      ${duel}
      ${callout}
      ${hasTopVisual ? '<div class="spacer"></div>' : ""}
      <div class="hook">
        ${chips}
        ${slide.kicker ? `<div class="kicker">${esc(slide.kicker)}</div>` : ""}
        ${headline}
        ${stat}
        ${support}
        ${(slide.blocks || []).length ? `<div class="stack" style="gap:24px;margin-top:28px;">${slide.blocks.map((b) => renderBlock(b, ctx)).join("")}</div>` : ""}
      </div>
    </div>
    ${footerHTML(deck, ctx, true)}
  </div>`;
}

// Hand-built device illustration (laptop + phone), authored at the 1350-tall base and
// scaled by canvas height so it reflows to square/story. Ported from OutroDevices.tsx.
function outroDevices(ctx, canvasH) {
  const v = Math.min(1, canvasH / 1350).toFixed(4);
  const mk = ctx.brand && ctx.brand.mark ? ctx.brand.mark : "";
  const shot = ctx.brand && ctx.brand.appOverview ? `<img class="lp-shot" src="${ctx.brand.appOverview}" alt="">` : "";
  const lock = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><rect x="5" y="10.5" width="14" height="9.5" rx="2.4"/><path d="M8 10.5 V8 a4 4 0 0 1 8 0 v2.5"/></svg>`;
  return `<div class="outro-devices" style="transform:translateX(30px) scale(${v});transform-origin:bottom center;">
    <div class="lp">
      <div class="lp-screen">
        <div class="lp-chrome">
          <div class="lp-row1">
            <span class="lp-traffic"><i style="background:#FF5F57"></i><i style="background:#FEBC2E"></i><i style="background:#28C840"></i></span>
            <span class="lp-tab"><span class="lp-tabmark">${mk}</span>Sectors, Financial Search Engine<span class="lp-x">✕</span></span>
          </div>
          <div class="lp-addr"><span class="lp-nav">‹ ›</span><span class="lp-pill">${lock}sectors.app</span></div>
        </div>
        ${shot}
        <div class="lp-glass"></div>
      </div>
      <div class="lp-base"><i class="lp-notch"></i></div>
    </div>
    <div class="ph">
      <i class="ph-notch"></i>
      <div class="ph-body">
        <div class="ph-head"><span class="ph-mark">${mk}</span>Sectors AI</div>
        <div class="ph-user">How's the IDX doing this month?</div>
        <div class="ph-answer">Rough June. The IHSG fell 8.69% in the first week, then rebounded 5.2% to close at 5,886 on Jun 11 after BI's surprise rate hike to 5.5%. Foreign outflows top Rp 61T this year.<span class="ph-ticks"><i>IHSG</i><i>Foreign flow</i><i>BI rate</i></span></div>
        <div class="ph-suggest"><i>What drove the selloff? →</i><i>Which sectors held up? →</i></div>
        <div class="ph-input"><span class="ph-ph">Ask about the IDX…</span><span class="ph-send">↑</span></div>
      </div>
    </div>
  </div>`;
}

function renderOutro(slide, deck, ctx, canvasH) {
  const ts = Math.min(1, canvasH / 1350);
  const textTop = canvasH >= 1350 ? 86 : Math.max(6, Math.round(86 - (1350 - canvasH) * 0.5));
  const o = slide.outro || {};
  // An override is deck data, so it's escaped like all other deck copy (a raw & or < used
  // to pass through and emit malformed HTML, uniquely among the outro fields); `emphasis`
  // gives an override the same one-gradient-word grammar as the cover headline.
  const headline = o.headline
    ? emphasize(o.headline, o.emphasis)
    : 'Like this <span class="gradient-text" style="font-weight:600">post</span>?';
  const support = esc(o.support || "Stay informed and discover more research on our website.");
  const url = esc(o.url || (deck.footer && deck.footer.site) || "sectors.app");
  const px = (n) => Math.round(n * ts);
  const search = `<svg width="${px(34)}" height="${px(34)}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><circle cx="10.4" cy="10.4" r="6.4"/><path d="M15.3 15.3 L20.6 20.6"/></svg>`;
  return `<div class="outro-text">
    <div class="outro-stack" style="padding-top:${textTop}px;gap:${px(32)}px;">
      <div class="outro-h" style="font-size:${px(96)}px;">${headline}</div>
      <div class="outro-sub" style="font-size:${px(38)}px;">${support}</div>
      <div class="searchpill" style="font-size:${px(34)}px;">${search}${url}</div>
    </div>
  </div>`;
}

// `.content` is a flex column, so a NORMAL (non-absolute) trailing child always reserves its
// own space and every earlier flex:1 sibling shrinks to make room — the previous version
// absolutely-positioned this at a fixed bottom offset, decoupled from actual flow content,
// which meant a bottom-anchored or `justify-content:space-between` slide (a normal, common
// layout, see visual-language.md) could end its own last line in the exact same few px this
// occupies (caught: a dense list slide whose caption text visibly collided with "As of ..." —
// the built-in cushion was thin enough that it wasn't a rare edge case). Reserving real flex
// space makes the collision structurally impossible instead of relying on there happening to
// be enough margin.
function asOfLine(dateStr) {
  return dateStr
    ? `<div class="caption-t" style="flex-shrink:0;padding-top:20px;text-align:center;color:var(--dim)">As of ${esc(dateStr)} · sectors.app</div>`
    : "";
}

function renderContent(slide, deck, ctx) {
  const blocks = (slide.blocks || []).map((b) => renderBlock(b, ctx)).join("");
  // No ticker chip in the header (Samuel's rule): content slides lead with their headline;
  // company identity lives on the cover. priceSnapshot keeps its own in-card chip.
  return `<div class="content">
    <div class="stack" style="gap:40px;flex:1;min-height:0;">${blocks}</div>
    ${asOfLine(slide.asOf)}
  </div>`;
}

// ---------- free-HTML slides (the primary path) ----------
// The agent composes a content slide as HTML against the brand design system
// (references/visual-language.md). The renderer still owns the brand chrome (stage,
// background, canvas, fonts) so the look can't drift, and fills two placeholders so
// charts and logos are ALWAYS on-brand instead of hand-drawn per run:
//   <div data-chart="bar"   data-spec='{"bars":[{"label":"2025","value":57.5,"display":"57.5"}],"caption":"net profit · Rp T"}'></div>
//   <div data-chart="line"  data-spec='{"values":[100,98,103,...],"area":true}'></div>
//   <div data-chart="donut" data-spec='{"segments":[{"pct":58,"color":"#E5337E"}],"centerLabel":"58%","centerSub":"CONTROLLING"}'></div>
//   <span data-logo="BBCA"></span>
// data-spec is single-quoted so the JSON inside can use normal double quotes.

// Exported so brand-lint.mjs's placeholder check reads THIS list instead of hand-copying it,
// the same shared-registry principle as collectTickers above: a lint that keeps its own parallel
// list of known chart kinds can silently drift from what the renderer actually accepts (a kind
// added here and forgotten there either false-flags a valid placeholder or, worse, lets an
// invalid one through unlinted).
export const CHART_KINDS = ["bar", "line", "donut", "radar", "multiline", "stackedbar", "table", "timeline", "waterfall", "scatter", "heatmap", "bump", "sankey", "compose"];

function renderChartSpec(kind, spec, ctx) {
  if (!CHART_KINDS.includes(kind)) {
    ctx.warnings?.push(`unknown data-chart kind "${kind}" (known: ${CHART_KINDS.join(", ")}); placeholder removed`);
    return "";
  }
  let s;
  try {
    s = JSON.parse(spec);
  } catch (e) {
    ctx.warnings?.push(`data-chart="${kind}": invalid data-spec JSON (${e.message}); chart skipped`);
    return "";
  }
  if (kind === "bar") return barBlock({ bars: s.bars || [], caption: s.caption, legend: s.legend, delta: s.delta, benchmark: s.benchmark }, ctx);
  if (kind === "line") {
    // A line has no per-point labels, so filtering a bad point out compresses the shape
    // rather than mislabeling it; still worth a warning since the data changed.
    const values = (s.values || []).map(numOr).filter((v) => {
      if (v == null) ctx.warnings?.push(`line: dropped a non-numeric point from "values"`);
      return v != null;
    });
    // endpointLabel:true only on THIS path (the content-slide line chart), not priceSnapshot's
    // call above (the `priceSnapshot` block renderer): that block already prints the price +
    // delta beside its mini-chart, a second number on the chart itself would double-label.
    const benchmark = sanitizeBenchmark(s.benchmark, ctx, "line");
    const points = Array.isArray(s.points)
      ? s.points.filter((p) => {
          const idx = p?.i ?? p?.index;
          const ok = Number.isInteger(idx) && idx >= 0 && idx < values.length && typeof p.label === "string";
          if (!ok) ctx.warnings?.push(`line: dropped an invalid "points" entry (needs integer i/index within range and a string label)`);
          return ok;
        })
      : undefined;
    // points supersedes the default endpoint %-change: a caller labeling specific points
    // (often including the last one, with its own date/value text) is opting out of the
    // auto pct label, not adding to it, so the two never stack on the same dot.
    return sparkline(values, { w: s.w || 852, h: s.h || 150, area: s.area, strokeWidth: s.strokeWidth || 4, pad: s.pad, endpointLabel: !points, benchmark, startLabel: s.startLabel, extremes: s.extremes, points });
  }
  if (kind === "donut") return donutBlock({ segments: s.segments || [], size: s.size, centerLabel: s.centerLabel, centerSub: s.centerSub, caption: s.caption }, ctx);
  if (kind === "radar") return radarBlock({ axes: s.axes, series: s.series || [], maxValue: s.maxValue, size: s.size, caption: s.caption }, ctx);
  if (kind === "multiline") return multiLineBlock({ series: s.series || [], w: s.w, h: s.h, caption: s.caption, index: s.index, startLabel: s.startLabel }, ctx);
  if (kind === "stackedbar") return stackedBarBlock({ bars: s.bars || [], w: s.w, h: s.h, maxTotal: s.maxTotal, caption: s.caption, legend: s.legend }, ctx);
  if (kind === "table") return matrixBlock({ columns: s.columns || [], rows: s.rows || [] }, ctx);
  if (kind === "waterfall") return waterfallBlock({ bars: s.bars || [], w: s.w, h: s.h, caption: s.caption, legend: s.legend }, ctx);
  if (kind === "timeline") return timelineBlock({ events: s.events || [] });
  if (kind === "scatter")
    return scatterBlock(
      { points: s.points || [], xLabel: s.xLabel, yLabel: s.yLabel, w: s.w, h: s.h, caption: s.caption, xScale: s.xScale, yScale: s.yScale },
      ctx
    );
  if (kind === "heatmap")
    return heatmapBlock({ rows: s.rows || [], cols: s.cols || [], values: s.values || [], mode: s.mode, display: s.display, caption: s.caption }, ctx);
  if (kind === "bump") return bumpBlock({ days: s.days || [], highlight: s.highlight, w: s.w, h: s.h, caption: s.caption }, ctx);
  if (kind === "sankey") return sankeyBlock({ links: s.links || [], unit: s.unit, w: s.w, h: s.h, caption: s.caption }, ctx);
  if (kind === "compose") return composeBlock(s, ctx);
  return "";
}

// The escape hatch for a chart shape none of the 13 named kinds fit: the agent describes it as
// governed layers and compose() (charts.mjs) assembles it from the same primitives — brand
// gradient, mono numerals, semantic-only colors, the "every chart is a promise" check — routing
// every degradation warning into the same ctx.warnings channel the named kinds use.
function composeBlock(s, ctx) {
  const svg = compose(s, { warn: (m) => ctx.warnings?.push(m) });
  return `<div class="b-bar">${s.caption ? `<div class="caption-t" style="margin-bottom:8px;">${esc(s.caption)}</div>` : ""}${svg}</div>`;
}

// The agent's other attributes on a placeholder div (a style for spacing, a class) are
// re-emitted on a wrapper around the injected chart so their layout intent survives; the
// old matcher rejected the whole placeholder if ANY extra attribute was present.
function wrapExtras(inner, ...attrChunks) {
  const extras = attrChunks.join(" ").replace(/\s+/g, " ").trim();
  return extras ? `<div ${extras}>${inner}</div>` : inner;
}

export function injectPlaceholders(html, ctx = {}) {
  // Two forms so data-chart/data-spec can come in either order, with other attributes
  // anywhere around them. The spec group is [\s\S]*? (not [^>]*?) because JSON legitimately
  // contains ">" ("pe_ttm > 12" in a caption). The old matcher demanded the exact canonical
  // shape and attribute order, and anything else was left in the DOM as an invisible empty
  // div: the slide shipped minus its anchor visual with no warning anywhere.
  const out = String(html ?? "")
    .replace(/<div\b([^>]*?)\bdata-chart="([^"]+)"([^>]*?)\bdata-spec='([\s\S]*?)'\s*([^>]*?)><\/div>/g,
      (_m, a1, kind, a2, spec, a3) => wrapExtras(renderChartSpec(kind, spec, ctx), a1, a2, a3))
    .replace(/<div\b([^>]*?)\bdata-spec='([\s\S]*?)'\s+([^>]*?)\bdata-chart="([^"]+)"([^>]*?)><\/div>/g,
      (_m, a1, spec, a2, kind, a3) => wrapExtras(renderChartSpec(kind, spec, ctx), a1, a2, a3))
    .replace(/<span\s+([^>]*?)data-logo="([^"]+)"([^>]*?)><\/span>/g, (_m, before, t, after) =>
      logoBox(t, ctx, undefined, `${before}${after}`.replace(/\s+/g, " ").trim())
    );
  // Residual scan: anything still saying data-chart/data-logo did not match even the
  // tolerant forms (misquoted data-spec, a body inside the div, a self-closing tag, a logo
  // span with text inside). Warn with the reason; silence here is how a deck loses a chart
  // and nobody notices until the PNG is read.
  for (const m of out.matchAll(/data-chart="([^"]*)"/g)) {
    ctx.warnings?.push(
      CHART_KINDS.includes(m[1])
        ? `a data-chart="${m[1]}" placeholder did not render: it must be <div data-chart="…" data-spec='…'></div> with single-quoted JSON and an empty body`
        : `a placeholder with unknown data-chart kind "${m[1]}" did not render (known: ${CHART_KINDS.join(", ")})`
    );
  }
  for (const m of out.matchAll(/data-logo="([^"]*)"/g)) {
    ctx.warnings?.push(`a data-logo="${m[1]}" placeholder did not render: it must be <span data-logo="${m[1]}"></span> with an empty body`);
  }
  return out;
}

function renderFreeHtml(slide, deck, ctx) {
  const inner = injectPlaceholders(slide.html, ctx);
  return `<div class="content">${inner}${asOfLine(slide.asOf)}</div>`;
}

export function renderSlide(slide, deck, ctx = {}) {
  const role = slide.role || "content";
  const dims = formatDims(deck.format);
  const frame = (cls, layers, inner) =>
    `<div class="stage ${cls}" style="width:${dims.w}px;height:${dims.h}px;">${layers}${inner}</div>`;
  if (role === "cover")
    return frame(
      "cover",
      `<div class="layer nebula"></div><div class="layer dots"></div>${coverArtLayer(slide.coverArt, ctx)}`,
      renderCover(slide, deck, ctx)
    );
  if (role === "outro")
    return frame(
      "outro",
      `<div class="layer glow"></div><div class="layer dots"></div>${outroDevices(ctx, dims.h)}<div class="layer frontshadow"></div>`,
      renderOutro(slide, deck, ctx, dims.h) + footerHTML(deck, ctx, true)
    );
  // content: free-HTML (primary) or semantic blocks (helper library)
  const inner = slide.html ? renderFreeHtml(slide, deck, ctx) : renderContent(slide, deck, ctx);
  return frame("", `<div class="layer nebula"></div><div class="layer dots"></div>`, inner);
}

export function formatDims(format) {
  if (format === "square") return { w: 1080, h: 1080 };
  if (format === "story") return { w: 1080, h: 1920 };
  return { w: 1080, h: 1350 };
}
