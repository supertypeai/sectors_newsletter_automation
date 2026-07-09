#!/usr/bin/env node
// selftest.mjs — regression suite for the renderer's known-fixed failure modes.
//
//   node scripts/selftest.mjs
//
// Every test here locks a bug that actually shipped once (see the git log for each fix's
// story); if one fails, a silent-failure class has come back. Pure string-level checks, no
// Puppeteer, so it runs in ~1s anywhere node runs. The two lint fixtures at the end spawn
// brand-lint.mjs as a child because its checks are the contract SKILL.md promises the
// agent ("will error").
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, readdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { injectPlaceholders, renderBlock, collectTickers, renderSlide, CHART_KINDS } from "./blocks.mjs";
import { multiLine, stackedBar, coverSpark, coverDuel, donut, bump, sankey, sparkline, compose, resolveComposeColor } from "./charts.mjs";
import { parseArgs, sanitizePathToFilename, sanitizePathsToFilenames } from "./sectors.mjs";

const here = dirname(fileURLToPath(import.meta.url));
let failures = 0;
const check = (name, ok, detail = "") => {
  if (!ok) failures++;
  console.log(`${ok ? "ok  " : "FAIL"}  ${name}${ok || !detail ? "" : `  [${detail}]`}`);
};
const chart = (kind, spec) => `<div data-chart="${kind}" data-spec='${JSON.stringify(spec)}'></div>`;

// ---- logo collection (cover tickers / table rows / row-nested blocks used to be missed) ----
{
  const got = collectTickers([
    { role: "cover", tickers: ["BBCA", { ticker: "BBRI.JK" }] },
    { html: chart("table", { columns: ["P/E"], rows: [{ ticker: "DEWA", values: ["2.7x"] }] }) },
    { blocks: [{ kind: "row", blocks: [{ kind: "ranking", rows: [{ ticker: "TLKM", value: "1" }] }] }] },
  ]);
  check("collectTickers sees cover tickers, table rows, row-nested blocks",
    ["BBCA", "BBRI", "DEWA", "TLKM"].every((t) => got.has(t)), [...got].join(","));
}

// ---- CHART_KINDS registry: brand-lint.mjs used to hand-copy this array from blocks.mjs (two
// independent lists that happened to agree today, but nothing stopped them drifting the moment
// one changed and not the other, exactly the class of bug collectTickers already closed for
// ticker registries). It now imports blocks.mjs's CHART_KINDS directly; this locks that every
// kind the renderer accepts also lints clean, not just the ones someone remembered to copy. ----
{
  const SPEC = {
    bar: { bars: [{ label: "a", value: 1 }] },
    line: { values: [1, 2] },
    donut: { segments: [{ pct: 100, color: "#fff" }] },
    radar: { axes: ["A"], series: [{ name: "X", self: true, values: [1] }] },
    multiline: { series: [{ name: "X", self: true, values: [1, 2] }] },
    stackedbar: { bars: [{ label: "a", segments: [{ value: 1, color: "#fff" }] }] },
    table: { columns: ["A"], rows: [{ ticker: "BBCA", values: ["1"] }] },
    timeline: { events: [{ date: "1 Jan", label: "x" }] },
    waterfall: { bars: [{ label: "a", value: 1, isTotal: true }] },
    scatter: { points: [{ x: 1, y: 1, label: "X", self: true }] },
    heatmap: { rows: ["A"], cols: ["B"], values: [[1]] },
    bump: { days: [{ date: "1 Jan", entries: [{ symbol: "A" }] }, { date: "2 Jan", entries: [{ symbol: "A" }] }] },
    sankey: { links: [{ source: "A", target: "B", value: 1 }] },
  };
  const dir = mkdtempSync(join(tmpdir(), "sectors-selftest-"));
  const p = join(dir, "d.json");
  writeFileSync(p, JSON.stringify({ slides: [{ html: CHART_KINDS.map((k) => chart(k, SPEC[k])).join("") }] }));
  let out;
  try {
    out = execFileSync(process.execPath, [join(here, "brand-lint.mjs"), p], { encoding: "utf8" });
  } catch (e) {
    out = String(e.stdout);
  }
  check(
    "brand-lint accepts every CHART_KINDS entry from blocks.mjs (shared registry, not a hand-copy)",
    !/unknown data-chart kind/.test(out),
    out
  );
  rmSync(dir, { recursive: true, force: true });
}

// ---- duel cover with NO separate `tickers` field: reported live (logo silently absent from
// the cover, zero warning) — deck-format.md says to set `tickers` redundantly alongside
// `duel.series`, but nothing enforced it, so a deck that only set `duel` rendered a chart
// with text-only endpoint labels and no chip row / no logo at all ----
{
  const duelSlide = { role: "cover", headline: "Test.", emphasis: "Test", duel: { series: [{ name: "GOTO", self: true, values: [1, 2] }, { name: "ASII", values: [2, 1] }] } };
  const got = collectTickers([duelSlide]);
  check("collectTickers derives tickers from duel.series when `tickers` is unset",
    ["GOTO", "ASII"].every((t) => got.has(t)), [...got].join(","));
  const html = renderSlide(duelSlide, { format: "portrait" }, { logos: { GOTO: "x", ASII: "y" }, warnings: [] });
  check("duel cover with no `tickers` still renders a chip row", /class="chip-row"/.test(html));
  check("duel cover with no `tickers` resolves real logos, not monograms", /logo--img/.test(html) && !/logo--mono/.test(html));
}

// ---- coverDuel peer-color governance: radar/multiline both run checkPeerColorLimit, but the
// cover's duel path (the same self/peer chart grammar, same 3-color PEER_COLORS palette) never
// did. A 5-series duel cover (1 self + 4 peers) rendered with zero warning, two lines silently
// sharing a color with no way for a reader to tell them apart. ----
{
  const fiveWay = {
    role: "cover",
    headline: "Five-way test.",
    emphasis: "Five-way",
    duel: {
      series: [
        { name: "GOTO", self: true, values: [1, 2] },
        { name: "ASII", values: [2, 1] },
        { name: "BBCA", values: [1.5, 1.8] },
        { name: "BBRI", values: [1.2, 1.4] },
        { name: "TLKM", values: [1.1, 1.3] },
      ],
    },
  };
  const ctx = { logos: {}, warnings: [] };
  renderSlide(fiveWay, { format: "portrait" }, ctx);
  check("5-series duel cover warns on peer-color reuse", ctx.warnings.some((w) => /peer colors/.test(w)), ctx.warnings.join(" | "));
  const twoWay = { role: "cover", headline: "Two.", emphasis: "Two", duel: { series: [{ name: "A", self: true, values: [1, 2] }, { name: "B", values: [2, 1] }] } };
  const ctx2 = { logos: {}, warnings: [] };
  renderSlide(twoWay, { format: "portrait" }, ctx2);
  check("2-series duel cover does not warn", ctx2.warnings.length === 0, ctx2.warnings.join(" | "));
}

// ---- cover duel shares multiline's index:true/mismatched-scale governance (same self/peer
// series grammar, same shared min/max scale in coverDuel(); see indexSeries/
// checkMismatchedScale in blocks.mjs, the multiline selftest block above has the full "why") ----
{
  const mismatchedDuel = (index) => ({
    role: "cover",
    headline: "Test duel.",
    emphasis: "Test",
    duel: {
      series: [
        { name: "PRICE", self: true, values: [4800, 4900, 5100, 5300, 5000] },
        { name: "RATIO", values: [0.11, 0.12, 0.13, 0.14, 0.115] },
      ],
      index,
    },
  });
  const ctxUnindexed = { logos: {}, warnings: [] };
  renderSlide(mismatchedDuel(false), { format: "portrait" }, ctxUnindexed);
  check(
    "cover duel: unindexed 20x+-scale mismatch warns, suggests index:true",
    ctxUnindexed.warnings.some((w) => /differ by .*x in scale/.test(w) && /index":true/.test(w)),
    ctxUnindexed.warnings.join(" | ")
  );
  const ctxIndexed = { logos: {}, warnings: [] };
  const html = renderSlide(mismatchedDuel(true), { format: "portrait" }, ctxIndexed);
  check("cover duel: index:true suppresses the mismatched-scale warning", !ctxIndexed.warnings.some((w) => /differ by/.test(w)), ctxIndexed.warnings.join(" | "));
  const peerY = (() => {
    const m = html.match(/<path d="([^"]+)" fill="none" stroke="#A99F99"/);
    return m ? [...m[1].matchAll(/,([\d.]+)(?: |$)/g)].map((x) => parseFloat(x[1])) : [];
  })();
  check(
    "cover duel: index:true turns the flat, collapsed peer line into a real, non-flat path",
    peerY.length > 0 && Math.max(...peerY) - Math.min(...peerY) > 50,
    peerY.join(",")
  );
}

// ---- donut sum sanity: pct values are documented as shares of ~100, but were never checked
// against that. A deck summing to 35 (absolutes fed where shares belong, or a plain miscount)
// rendered a mostly-empty ring with zero signal anything was wrong ----
{
  const low = { warnings: [] };
  injectPlaceholders(chart("donut", { segments: [{ pct: 20, color: "#E5337E", label: "A" }, { pct: 15, color: "#DF9439", label: "B" }] }), low);
  check("donut: segments summing to 35 warn", low.warnings.some((w) => /sum to 35/.test(w)), low.warnings.join(" | "));
  const closeEnough = { warnings: [] };
  injectPlaceholders(chart("donut", { segments: [{ pct: 60, color: "#E5337E", label: "A" }, { pct: 39.5, color: "#DF9439", label: "B" }] }), closeEnough);
  check("donut: segments summing to 99.5 do not warn", closeEnough.warnings.length === 0, closeEnough.warnings.join(" | "));
}

// ---- logos.json is well-formed, and (in the full dev repo) stays in sync with
// assets/logos/. render.mjs reads only the generated map, never the raw PNGs; a
// new/changed PNG with no scripts/build-logos.mjs re-run would silently monogram-fallback
// forever, exactly the "two partial copies disagree" bug class. assets/logos/ itself is
// deliberately absent from a packaged .skill (see CLAUDE.md "Packaging for handover"), so
// the sync half only runs when the raw source dir is actually present. ----
{
  const map = JSON.parse(readFileSync(join(here, "..", "assets", "logos.json"), "utf8"));
  check("logos.json: parses and is non-empty", Object.keys(map).length > 0);
  const logosDir = join(here, "..", "assets", "logos");
  if (existsSync(logosDir)) {
    const pngTickers = readdirSync(logosDir).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4));
    const missing = pngTickers.filter((t) => !map[t]);
    check("logos.json: every assets/logos/*.png has a matching entry", missing.length === 0, missing.slice(0, 5).join(","));
    const sample = pngTickers.slice(0, 5);
    const mismatched = sample.filter((t) => readFileSync(join(logosDir, `${t}.png`)).toString("base64") !== map[t]);
    check("logos.json: sampled entries byte-match their source PNG", mismatched.length === 0, mismatched.join(","));
  } else {
    console.log("skip  logos.json <-> assets/logos/ sync (raw PNGs not bundled here, expected in a packaged .skill)");
  }
}

// ---- NaN poisoning (one bad value used to blank the WHOLE chart, silently) ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("bar", { bars: [{ label: "a", value: 31 }, { label: "b", display: "40" }, { label: "c", value: 57 }] }), ctx);
  check("bar: bad value dropped, no NaN, warns", !/NaN/.test(out) && (out.match(/<rect/g) || []).length === 2 && ctx.warnings.length === 1);
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("waterfall", { bars: [{ label: "Q1", value: 14, isTotal: true }, { label: "x", display: "1" }, { label: "Q2", value: 16, isTotal: true }] }), ctx);
  check("waterfall: bad value dropped, no NaN, warns", !/NaN/.test(out) && ctx.warnings.length === 1);
}
{
  const ctx = { warnings: [] };
  // The two VALID segments sum to 100 on purpose, so this stays scoped to the coercion/drop
  // behavior it was written to test rather than also tripping the sum-sanity check below.
  const out = injectPlaceholders(chart("donut", { segments: [{ pct: "54.9", color: "#E5337E", label: "A" }, { pct: 45.1, color: "#DF9439", label: "B" }, { color: "#A99F99", label: "C" }] }), ctx);
  check("donut: string pct coerced, missing pct dropped, no crash", /54\.9/.test(out) && ctx.warnings.length === 1);
  check("donut() pure fn is total on garbage", typeof donut([{ pct: undefined, color: "#fff" }]) === "string");
}
{
  const ctx = { warnings: [] };
  const out = renderBlock({ kind: "ownership", holders: [{ name: "F", pct: "54.9" }, { name: "P", pct: null }] }, ctx);
  check("ownership: coerces/drops pct, no NaN", !/NaN/.test(out) && ctx.warnings.length === 1);
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("multiline", { series: [{ name: "A", self: true, values: [100, 98] }, { name: "B", values: [100, null] }] }), ctx);
  check("multiline: sick series dropped whole, self survives", (out.match(/<path/g) || []).length === 1 && ctx.warnings.length === 1);
}

// ---- geometry edge cases ----
{
  const conv = (end) => [100, 90, 80, end];
  const out = multiLine([{ name: "A", self: true, values: conv(72.0) }, { name: "B", values: conv(72.2) }, { name: "C", values: conv(72.4) }, { name: "D", values: conv(72.6) }]);
  const ys = [...out.matchAll(/<text[^>]*y="([\d.]+)"/g)].map((m) => parseFloat(m[1]));
  check("multiline: converging endpoint labels stay inside the viewBox", ys.length === 4 && ys.every((y) => y <= 311 && y >= 0), ys.join(","));
}
{
  const out = multiLine([{ name: "FLOW", self: true, values: [0, 12, 25, 40] }]);
  check("multiline: zero-start series keeps dot + raw-value label", /<circle/.test(out) && />40<\/text>/.test(out));
}

// ---- multiline/duel index:true: combining series of different natural scales (a 4800-5300
// price series with a 0.11-0.14 ratio series) shares ONE min/max scale by construction,
// collapsing the smaller series to a flat, information-free line with zero warning. index:true
// rebases every series to 100 at its own first value BEFORE that shared scale is computed
// (indexSeries/checkMismatchedScale in blocks.mjs, one helper shared by multiLineBlock and the
// cover duel path) ----
{
  const mismatched = () => ({
    series: [
      { name: "PRICE", self: true, values: [4800, 4900, 5100, 5300, 5000] },
      { name: "RATIO", values: [0.11, 0.12, 0.13, 0.14, 0.115] },
    ],
  });
  const peerPathY = (out) => {
    const m = out.match(/<path d="([^"]+)" fill="none" stroke="#A99F99"/);
    return m ? [...m[1].matchAll(/,([\d.]+)(?: |$)/g)].map((x) => parseFloat(x[1])) : [];
  };
  const ctxUnindexed = { warnings: [] };
  const unindexed = injectPlaceholders(chart("multiline", mismatched()), ctxUnindexed);
  check(
    "multiline: unindexed 20x+-scale mismatch warns, suggests index:true",
    ctxUnindexed.warnings.some((w) => /differ by .*x in scale/.test(w) && /index":true/.test(w)),
    ctxUnindexed.warnings.join(" | ")
  );
  const spreadUnindexed = (() => { const y = peerPathY(unindexed); return y.length ? Math.max(...y) - Math.min(...y) : 0; })();

  const ctxIndexed = { warnings: [] };
  const indexed = injectPlaceholders(chart("multiline", { ...mismatched(), index: true }), ctxIndexed);
  check("multiline: index:true suppresses the mismatched-scale warning", !ctxIndexed.warnings.some((w) => /differ by/.test(w)), ctxIndexed.warnings.join(" | "));
  const spreadIndexed = (() => { const y = peerPathY(indexed); return y.length ? Math.max(...y) - Math.min(...y) : 0; })();
  check(
    "multiline: index:true turns the flat, collapsed peer line (0px spread) into a real, non-flat path",
    spreadUnindexed <= 1 && spreadIndexed > 50,
    `unindexed spread=${spreadUnindexed.toFixed(1)} indexed spread=${spreadIndexed.toFixed(1)}`
  );
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(
    chart("multiline", { series: [{ name: "A", self: true, values: [100, 105, 110] }, { name: "ZERO", values: [0, 5, 10] }], index: true }),
    ctx
  );
  check(
    "multiline: index:true drops a series starting at 0 (can't rebase), warns naming it",
    ctx.warnings.some((w) => /dropped series "ZERO" from index:true/.test(w)) && (out.match(/<path/g) || []).length === 1,
    ctx.warnings.join(" | ")
  );
}
{
  // The %-change endpoint label is scale-invariant under index:true by construction: rebasing
  // multiplies every value by a positive constant (100/firstValue), and (last-first)/first is
  // unchanged under any positive scalar. Verified against the raw, un-rebased %-change.
  const raw = [4800, 4900, 5100, 5300, 5000];
  const rawPct = (((raw[raw.length - 1] - raw[0]) / raw[0]) * 100).toFixed(1);
  const out = injectPlaceholders(chart("multiline", { series: [{ name: "A", self: true, values: raw }], index: true }), { warnings: [] });
  check(`multiline: indexed endpoint label still matches the raw %-change (+${rawPct}%)`, out.includes(`+${rawPct}%`), out);
}

{
  const out = stackedBar([
    { label: "2023", segments: [{ value: 40, color: "#a" }, { value: 20, color: "#b" }, { value: 10, color: "#c" }] },
    { label: "2025", segments: [{ value: 48, color: "#a" }, { value: 21, color: "#b" }, { value: 9, color: "#c" }] },
  ]);
  const labels = [...out.matchAll(/font-size="22"[^>]*>([^<]+)</g)].map((m) => m[1]);
  check("stackedbar: cross-bar label consistency (the 9 labels like the 10)", labels.includes("9") && labels.includes("10"), labels.join(","));
}
{
  const out = stackedBar([{ label: "z", segments: [{ value: 0, color: "#a" }] }, { label: "n", segments: [{ value: 69, color: "#a" }] }]);
  const totals = [...out.matchAll(/font-size="26"[^>]*>([^<]+)</g)].map((m) => m[1]);
  check("stackedbar: zero-total bar prints 0, not the divisor fallback 1", totals[0] === "0", totals.join(","));
}

// ---- stackedbar negative-segment governance: geometry assumes non-negative segments, a
// negative value shrinks the total below the positive segments' own sum, drawing them taller
// than the bar's own frame (reproduced: -15 among {40} rendered the 40 at 544px inside a
// 340px bar). Also: >4 uncolored segments mathematically reuse a color (PEER_COLORS has 3
// entries), same ceiling as checkPeerColorLimit ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("stackedbar", { bars: [{ label: "2025", segments: [{ value: 40, color: "#a" }, { value: -15, color: "#b" }] }] }), ctx);
  check("stackedbar: negative segment drops (zeroed) and warns", ctx.warnings.some((w) => /segment 2 value -15 is negative/.test(w)), ctx.warnings.join(" | "));
  const heights = [...out.matchAll(/<rect[^>]*height="([\d.]+)"[^>]*fill="#a"/g)].map((m) => parseFloat(m[1]));
  check("stackedbar: with the negative segment dropped, the positive segment fits the bar frame (<=340px plot height)", heights.length === 1 && heights[0] <= 340, heights.join(","));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("stackedbar", { bars: [{ label: "x", segments: [{ value: 10 }, { value: 10 }, { value: 10 }, { value: 10 }, { value: 10 }] }] }), ctx);
  check("stackedbar: 5 uncolored segments warns on color reuse", ctx.warnings.some((w) => /only 4 distinct auto-colors/.test(w)), ctx.warnings.join(" | "));
  const ctx2 = { warnings: [] };
  injectPlaceholders(chart("stackedbar", { bars: [{ label: "y", segments: [{ value: 10 }, { value: 10 }, { value: 10 }, { value: 10 }] }] }), ctx2);
  check("stackedbar: 4 uncolored segments (right at the cap) does not warn", ctx2.warnings.length === 0, ctx2.warnings.join(" | "));
}
{
  const p = /d="M([\d.]+),([\d.]+) L([\d.]+),([\d.]+)"/.exec(coverSpark([57.5]));
  check("coverSpark: single point renders flat, not a fabricated rise", p && p[2] === p[4]);
}
{
  const out = coverDuel([{ name: "BBCA", self: true, values: [100, 90] }, { name: "BBRI", values: [100, 110] }]);
  check("coverDuel: endpoint ticker labels attribute the lines", />BBCA<\/text>/.test(out) && />BBRI<\/text>/.test(out));
}

// ---- placeholder tolerance + residual warnings ----
{
  const spec = { bars: [{ label: "2025", value: 57.5 }], caption: "pe > 12 ok" };
  const ctxA = { warnings: [] };
  const a = injectPlaceholders(`<div data-spec='${JSON.stringify(spec)}' data-chart="bar"></div>`, ctxA);
  const ctxB = { warnings: [] };
  const b = injectPlaceholders(`<div class="m" data-chart="bar" data-spec='${JSON.stringify(spec)}' style="margin-top:20px"></div>`, ctxB);
  check("placeholders: reversed attribute order renders", /<svg/.test(a) && !ctxA.warnings.length);
  check("placeholders: extra attributes render AND survive on a wrapper", /<svg/.test(b) && /class="m" style="margin-top:20px"/.test(b));
  const ctxC = { warnings: [] };
  injectPlaceholders(`<div data-chart="pie" data-spec='{}'></div>`, ctxC);
  check("placeholders: unknown kind warns by name", /unknown data-chart kind "pie"/.test(ctxC.warnings[0] || ""));
  const ctxD = { warnings: [] };
  injectPlaceholders(`<div data-chart="bar" data-spec='{"bars":[]}'>oops</div><span data-logo="BBRI">BBRI</span>`, ctxD);
  check("placeholders: residual chart + logo shapes warn", ctxD.warnings.length === 2, ctxD.warnings.join(" | "));
}

// ---- radar honesty: negative values used to clamp to 0 with zero warning (-10 and 0 draw the
// identical vertex, actively misleading, not just imprecise) and axes past the documented
// 7-axis ceiling rendered silently ----
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("radar", { axes: ["ROE"], series: [{ name: "X", self: true, values: [-10] }] }), ctx);
  check("radar: negative value warns instead of silently clamping to 0", ctx.warnings.some((w) => /is negative/.test(w)), ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("radar", { axes: Array.from({ length: 8 }, (_, i) => `A${i}`), series: [{ name: "X", self: true, values: Array(8).fill(50) }] }), ctx);
  check("radar: 8 axes warns past the documented 7-axis ceiling", ctx.warnings.some((w) => /axes exceeds/.test(w)), ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("radar", { axes: Array.from({ length: 7 }, (_, i) => `A${i}`), series: [{ name: "X", self: true, values: Array(7).fill(50) }] }), ctx);
  check("radar: 7 axes does not warn", ctx.warnings.length === 0, ctx.warnings.join(" | "));
}

// ---- line keeps the promise: "every chart is a promise" (visual-language.md) named radar as
// the ONE deliberate no-numbers exception, but the content-slide `line` chart printed zero text
// of its own, an undocumented second one. It now self-labels its endpoint; priceSnapshot's
// sparkline (which already shows price + delta beside it) must stay untouched. ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("line", { values: [100, 98, 103, 96, 90] }), ctx);
  check("line: prints an endpoint label", /<text[^>]*>[^<]*<\/text>/.test(out), out);
}
{
  const out = renderBlock(
    { kind: "priceSnapshot", ticker: "BBCA", price: "Rp 9,500", change: { dir: "up", text: "+1.2%" }, spark: [100, 102, 98, 105] },
    { logos: {}, warnings: [] }
  );
  const svgMatch = out.match(/<svg[^]*?<\/svg>/);
  check("priceSnapshot: sparkline output unchanged, no new <text> elements", svgMatch && !/<text/.test(svgMatch[0]), svgMatch && svgMatch[0]);
}

// ---- benchmark reference line (bar/line): no chart in this skill could show "this value vs
// the sector average / historical mean" without prose carrying it. The benchmark's own value
// is folded into the SAME min/max the bars/line already scale against (barChart's
// benchmarkPos/benchmarkNegAbs, sparkline's min/max widening in charts.mjs), so a benchmark
// outside the data's own range still lands inside the plot instead of drawing off it. ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("bar", { bars: [{ label: "a", value: 10 }, { label: "b", value: 20 }], benchmark: { value: 15, label: "SECTOR AVG" } }), ctx);
  check("bar: benchmark renders a dashed reference line + label", /stroke-dasharray="8 6"/.test(out) && /SECTOR AVG/.test(out), ctx.warnings.join(" | "));
}
{
  // benchmark (500) sits far above both bars (10, 20), so the shared scale must widen to
  // include it, or the dashed line would draw outside the 0..460 viewBox.
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("bar", { bars: [{ label: "a", value: 10 }, { label: "b", value: 20 }], benchmark: { value: 500, label: "X" } }), ctx);
  const y = parseFloat((out.match(/<line x1="0" y1="([\d.]+)" x2="936" y2="[\d.]+" stroke="#A99F99"/) || [])[1]);
  check("bar: a benchmark far above every bar still lands inside the viewBox (0..460)", Number.isFinite(y) && y >= 0 && y <= 460, `y=${y}`);
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("bar", { bars: [{ label: "a", value: 10 }], benchmark: { value: "not-a-number", label: "BAD" } }), ctx);
  check(
    "bar: non-numeric benchmark warns and is skipped (no reference line drawn)",
    ctx.warnings.some((w) => /dropped benchmark/.test(w)) && !/stroke-dasharray="8 6"/.test(out),
    ctx.warnings.join(" | ")
  );
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("line", { values: [100, 98, 103, 96, 90], benchmark: { value: 97, label: "5Y AVG" } }), ctx);
  check("line: benchmark renders a dashed reference line + label", /stroke-dasharray="8 6"/.test(out) && /5Y AVG/.test(out), ctx.warnings.join(" | "));
}
{
  // benchmark (500) sits far above every point (100, 105, 98), same viewBox-containment
  // requirement as the bar case above, on sparkline's own 0..150 default height.
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("line", { values: [100, 105, 98], benchmark: { value: 500, label: "X" } }), ctx);
  const y = parseFloat((out.match(/<line x1="10" y1="([\d.]+)"/) || [])[1]);
  check("line: a benchmark far above every point still lands inside the viewBox (0..150)", Number.isFinite(y) && y >= 0 && y <= 150, `y=${y}`);
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("line", { values: [100, 98, 103], benchmark: { value: "bad", label: "X" } }), ctx);
  check(
    "line: non-numeric benchmark warns and is skipped (no reference line drawn)",
    ctx.warnings.some((w) => /dropped benchmark/.test(w)) && !/stroke-dasharray="8 6"/.test(out),
    ctx.warnings.join(" | ")
  );
}

// ---- keyFacts grid ----
{
  const out = renderBlock({ kind: "keyFacts", facts: [{ label: "a", value: "1" }, { label: "b", value: "2" }, { label: "c", value: "3" }, { label: "d", value: "4" }] }, {});
  check("keyFacts: 4 facts render 2x2, never the 3+1 orphan", /cols-2/.test(out));
}

// ---- table governance: matrixBlock was the one chart primitive outside "degradation is never
// silent" (missing name/ticker, a values.length that didn't match columns.length, and a
// non-primitive/null cell all rendered blank with zero warning, reproduced live before this
// fix) and had no `self` row marker (peerBars' r.self has one) ----
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("table", { columns: ["P/E", "Yield"], rows: [{ ticker: "DEWA", values: ["2.67x"] }] }), ctx);
  check("table: row with fewer values than columns warns naming the row", ctx.warnings.some((w) => /1 value\(s\) for 2 column\(s\)/.test(w)), ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("table", { columns: ["P/E"], rows: [{ ticker: "DEWA", values: [null] }] }), ctx);
  check("table: null cell value warns", ctx.warnings.some((w) => /has no value/.test(w)), ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("table", { columns: [], rows: [{ values: [] }] }), ctx);
  check("table: row with no name/ticker warns", ctx.warnings.some((w) => /no "name" or "ticker"/.test(w)), ctx.warnings.join(" | "));
}
{
  const out = injectPlaceholders(chart("table", { columns: ["P/E"], rows: [{ ticker: "DEWA", values: ["2.67x"], self: true }, { ticker: "BBCA", values: ["10x"] }] }), {});
  check("table: self row renders the self marker class", /class="mx-name self"/.test(out) && !/class="mx-name self"[\s\S]*class="mx-name self"/.test(out), out);
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("table", { columns: ["P/E"], rows: [{ ticker: "DEWA", values: ["2.67x"] }] }), ctx);
  check("table: a well-formed row does not warn", ctx.warnings.length === 0, ctx.warnings.join(" | "));
}

// ---- scatter: two independent axes ("who's cheap AND big"), no shared min/max like every
// other chart here. A point missing a coordinate can't be placed at all (no shared scale to
// fall into like sanitizeBars' "keep what coerces"), so it's dropped whole; a log-scale axis
// additionally can't place a non-positive value (log of 0/negative is undefined) ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(
    chart("scatter", { points: [{ x: 1, y: 2, label: "A" }, { x: "bad", y: 3, label: "B" }, { x: 4, y: 5, label: "C" }] }),
    ctx
  );
  check(
    "scatter: non-numeric point dropped, warns naming it",
    ctx.warnings.some((w) => /dropped point "B"/.test(w)) && (out.match(/<circle/g) || []).length === 2,
    ctx.warnings.join(" | ")
  );
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(
    chart("scatter", { yScale: "log", points: [{ x: 1, y: 10, label: "A" }, { x: 2, y: -5, label: "B" }, { x: 3, y: 20, label: "C" }] }),
    ctx
  );
  check(
    "scatter: log-scale axis drops a non-positive value, warns naming it",
    ctx.warnings.some((w) => /dropped point "B".*y=-5.*log/.test(w)) && (out.match(/<circle/g) || []).length === 2,
    ctx.warnings.join(" | ")
  );
}
{
  const out = injectPlaceholders(
    chart("scatter", {
      xLabel: "P/E",
      yLabel: "Mkt cap",
      points: [
        { x: 11.9, y: 689, label: "BBCA", self: true, displayX: "11.9×", displayY: "Rp 689T" },
        { x: 9.4, y: 205, label: "BBRI" },
      ],
    }),
    { warnings: [] }
  );
  check("scatter: self point labels its own (x, y) values", out.includes("BBCA (11.9×, Rp 689T)"), out);
}
{
  const twelve = Array.from({ length: 12 }, (_, i) => ({ x: i, y: i, label: `P${i}` }));
  const ctxOk = { warnings: [] };
  injectPlaceholders(chart("scatter", { points: twelve }), ctxOk);
  check("scatter: exactly 12 points does not warn on crowding", !ctxOk.warnings.some((w) => /readability ceiling/.test(w)), ctxOk.warnings.join(" | "));
  const thirteen = [...twelve, { x: 13, y: 13, label: "P13" }];
  const ctxWarn = { warnings: [] };
  injectPlaceholders(chart("scatter", { points: thirteen }), ctxWarn);
  check(
    "scatter: 13 points warns on crowding, suggests table",
    ctxWarn.warnings.some((w) => /readability ceiling/.test(w) && /"table"/.test(w)),
    ctxWarn.warnings.join(" | ")
  );
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("scatter", { points: [{ x: 1, y: 1, label: "A", self: true }, { x: 2, y: 2, label: "B", self: true }] }), ctx);
  check("scatter: a second self warns and demotes to peer (first wins)", ctx.warnings.some((w) => /point "B".*already claimed/.test(w)), ctx.warnings.join(" | "));
}
{
  // Adversarial edge case: a point at the extreme corner with a long label, and past the
  // 6-point "label everyone" threshold so it's forced through the outlier-labeling path too.
  const points = [
    { x: 0, y: 0, label: "TINY", self: true },
    { x: 1000, y: 1000, label: "A VERY LONG COMPANY NAME THAT SHOULD NOT ESCAPE THE CANVAS" },
    { x: 5, y: 5, label: "C" },
    { x: 6, y: 6, label: "D" },
    { x: 7, y: 7, label: "E" },
    { x: 8, y: 8, label: "F" },
    { x: 9, y: 9, label: "G" },
  ];
  const out = injectPlaceholders(chart("scatter", { points }), { warnings: [] });
  const xs = [...out.matchAll(/<text x="(-?[\d.]+)"/g)].map((m) => parseFloat(m[1]));
  const ys = [...out.matchAll(/<text[^>]*y="(-?[\d.]+)"/g)].map((m) => parseFloat(m[1]));
  check("scatter: every label stays inside the viewBox (x, 0..936)", xs.length > 0 && xs.every((x) => x >= 0 && x <= 936), xs.join(","));
  check("scatter: every label stays inside the viewBox (y, 0..560)", ys.length > 0 && ys.every((y) => y >= 0 && y <= 560), ys.join(","));
}

// ---- heatmap: category x time/metric matrix, cell background = intensity (mode-dependent),
// cell text = its own value. Same coerce/warn/never-silent contract as table (matrixBlock) ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("heatmap", { rows: ["A"], cols: ["X", "Y"], values: [[10, "bad"]] }), ctx);
  check(
    "heatmap: non-numeric cell warns naming row/col, renders empty",
    ctx.warnings.some((w) => /row "A" col "Y" value "bad"/.test(w)) && /<span class="hm-cell"[^>]*><\/span>/.test(out),
    ctx.warnings.join(" | ")
  );
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("heatmap", { rows: ["A"], cols: ["X", "Y", "Z"], values: [[1, 2]] }), ctx);
  check(
    "heatmap: row shorter than cols warns naming the row",
    ctx.warnings.some((w) => /row 1 \("A"\) has 2 value\(s\) for 3 column\(s\)/.test(w)),
    ctx.warnings.join(" | ")
  );
}
{
  const out = injectPlaceholders(chart("heatmap", { mode: "diverging", rows: ["A"], cols: ["X", "Y"], values: [[10, -10]] }), { warnings: [] });
  check("heatmap: diverging positive cell gets the gain color", /background:rgba\(31,179,106,/.test(out), out);
  check("heatmap: diverging negative cell gets the loss color", /background:rgba\(224,0,59,/.test(out), out);
}
{
  const ctx = { warnings: [] };
  const wideRow = Array.from({ length: 20 }, (_, i) => i);
  injectPlaceholders(chart("heatmap", { rows: ["A"], cols: Array.from({ length: 20 }, (_, i) => `C${i}`), values: [wideRow] }), ctx);
  check("heatmap: a 20-column grid warns past the ~56px cell-width density ceiling", ctx.warnings.some((w) => /readability floor/.test(w)), ctx.warnings.join(" | "));
  const ctxOk = { warnings: [] };
  injectPlaceholders(chart("heatmap", { rows: ["A"], cols: ["X", "Y"], values: [[1, 2]] }), ctxOk);
  check("heatmap: a 2-column grid does not warn on density", !ctxOk.warnings.some((w) => /readability floor/.test(w)), ctxOk.warnings.join(" | "));
}
{
  const out = injectPlaceholders(chart("heatmap", { rows: ["ROE", "NPL"], cols: ["2024", "2025"], values: [[20, 21], [2, 3]] }), { warnings: [] });
  check("heatmap: every cell's own value prints in the output", ["20", "21", "2", "3"].every((v) => new RegExp(`>${v}<`).test(out)), out);
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("heatmap", { mode: "diverging3", rows: ["A"], cols: ["X"], values: [[5]] }), ctx);
  check(
    "heatmap: unknown mode warns and falls back to sequential",
    ctx.warnings.some((w) => /unknown "mode"/.test(w)) && /background:rgba\(229,51,126,/.test(out),
    ctx.warnings.join(" | ")
  );
}

// ---- bump: ranked leaderboard over time, day-by-day rank-order entries. Same coerce/warn
// contract as every other chart primitive here, plus a color-governance rule of its own (only
// ONE symbol, explicit or auto-detected, ever gets the brand gradient) and a labeling contract
// (right-endpoint labels only for symbols reaching the chart's actual final day; everything
// else gets a bare-symbol waypoint label, at most once per boundary point) ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(
    chart("bump", { days: [{ date: "1 Jan", entries: [{ symbol: "A" }, { symbol: "A" }] }, { date: "2 Jan", entries: [{ symbol: "A" }] }] }),
    ctx
  );
  check("bump: duplicate symbol within one day warns, keeps the first", ctx.warnings.some((w) => /duplicate symbol "A"/.test(w) && /day "1 Jan"/.test(w)), ctx.warnings.join(" | "));
  check("bump: duplicate symbol doesn't crash the render", /<svg/.test(out));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("bump", { days: [] }), ctx);
  check("bump: empty days warns", ctx.warnings.some((w) => /"days" is empty/.test(w)), ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("bump", { days: [{ date: "1 Jan", entries: [{ symbol: "A" }] }] }), ctx);
  check("bump: a single day warns, suggests ranking/table", ctx.warnings.some((w) => /single day/.test(w) && /"ranking"/.test(w)), ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  const sevenSlots = Array.from({ length: 7 }, (_, i) => ({ symbol: `S${i}` }));
  injectPlaceholders(chart("bump", { days: [{ date: "1 Jan", entries: sevenSlots }, { date: "2 Jan", entries: sevenSlots }] }), ctx);
  check("bump: 7 rank slots warns past the ~6-slot ceiling", ctx.warnings.some((w) => /7 rank slots exceeds/.test(w)), ctx.warnings.join(" | "));
  const ctxOk = { warnings: [] };
  const sixSlots = sevenSlots.slice(0, 6);
  injectPlaceholders(chart("bump", { days: [{ date: "1 Jan", entries: sixSlots }, { date: "2 Jan", entries: sixSlots }] }), ctxOk);
  check("bump: 6 rank slots (at the cap) does not warn", !ctxOk.warnings.some((w) => /rank slots exceeds/.test(w)), ctxOk.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  const fifteenDays = Array.from({ length: 15 }, (_, i) => ({ date: `Day ${i}`, entries: [{ symbol: "A" }] }));
  injectPlaceholders(chart("bump", { days: fifteenDays }), ctx);
  check("bump: 15 days warns past the ~14-day ceiling", ctx.warnings.some((w) => /15 days exceeds/.test(w)), ctx.warnings.join(" | "));
}
{
  // auto-detect: no "highlight" field, but symbol "A" holds rank 1 on every day — same "same
  // name every single day" pattern most-traded's own doc calls a story on its own.
  const days = [
    { date: "1 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] },
    { date: "2 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] },
    { date: "3 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] },
  ];
  const out = injectPlaceholders(chart("bump", { days }), { warnings: [] });
  check("bump: highlight auto-detects a symbol holding rank 1 every day and labels its streak", /A · #1 ALL 3 DAYS/.test(out), out);
}
{
  const ctx = { warnings: [] };
  const days = [{ date: "1 Jan", entries: [{ symbol: "A" }] }, { date: "2 Jan", entries: [{ symbol: "A" }] }];
  injectPlaceholders(chart("bump", { days, highlight: "GHOST" }), ctx);
  check("bump: a highlight symbol absent from the data warns and falls back to auto-detect", ctx.warnings.some((w) => /"highlight":"GHOST" never appears/.test(w)), ctx.warnings.join(" | "));
}
{
  // A symbol dropping off the tracked slots and coming back gets a re-entry label at its
  // comeback point (a bare symbol tag), distinct from the full "#rank · value" endpoint
  // treatment reserved for a symbol that survives to the chart's actual final day.
  const days = [
    { date: "1 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] },
    { date: "2 Jan", entries: [{ symbol: "A" }] }, // B drops off
    { date: "3 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] }, // B re-enters
  ];
  const out = injectPlaceholders(chart("bump", { days }), { warnings: [] });
  check("bump: a broken line's re-entry point gets a bare-symbol label", />B<\/text>/.test(out), out);
}
{
  // Regression: a symbol whose line stops mid-chart (never reaches the final day) used to
  // still claim the FULL "#rank · value" endpoint treatment at wherever it happened to stop,
  // cluttering the middle of the chart and colliding with unrelated re-entry labels. Only a
  // symbol reaching the chart's actual last day should print "#rank".
  const days = [
    { date: "1 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] },
    { date: "2 Jan", entries: [{ symbol: "A" }] }, // B gone for good
  ];
  const out = injectPlaceholders(chart("bump", { days }), { warnings: [] });
  check("bump: a symbol that drops off and never returns gets no '#rank' endpoint label", !/B #\d/.test(out), out);
}
{
  // Regression: a single-point run that is a TRUE middle run (ri>0, and not the final run
  // reaching the chart's last day) used to push BOTH a re-entry label (ri>0) and an exit
  // label (not the final reconciling run) at the exact same coordinate, stacking two
  // identical texts on top of each other. B here gets 3 separate single-point runs (day 1,
  // day 3, day 5): day 1's run is a plain exit, day 3's is the true "stacked-duplicate" risk
  // (a middle run, ri=1 of 3), day 5 reaches the final day and gets the full endpoint
  // treatment instead of a waypoint label — exactly 2 bare-symbol waypoint labels total
  // (day 1 exit, day 3 re-entry), never a third stacked on top of either.
  const days = [
    { date: "1 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] },
    { date: "2 Jan", entries: [{ symbol: "A" }] },
    { date: "3 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] }, // B: one-day comeback (a TRUE middle run)
    { date: "4 Jan", entries: [{ symbol: "A" }] },
    { date: "5 Jan", entries: [{ symbol: "A" }, { symbol: "B" }] }, // B: reaches the final day
  ];
  const out = injectPlaceholders(chart("bump", { days }), { warnings: [] });
  check("bump: a comeback-then-gone-again symbol gets one label per distinct waypoint, never two stacked at the same point", (out.match(/<text[^>]*>B<\/text>/g) || []).length === 2, out);
}
{
  // Adversarial: a pathologically long symbol string on the final day must still keep its
  // endpoint label's anchor coordinate inside the viewBox (936x520 default), same precedent
  // as scatter's label-placement guard.
  const days = [
    { date: "1 Jan", entries: [{ symbol: "A_VERY_LONG_SYMBOL_NAME_THAT_SHOULD_NOT_ESCAPE_THE_CANVAS", value: 12345.678, display: "12,345.7B" }] },
  ];
  const out = bump(days, {});
  const xs = [...out.matchAll(/<text[^>]*\sx="(-?[\d.]+)"/g)].map((m) => parseFloat(m[1]));
  const ys = [...out.matchAll(/<text[^>]*\sy="(-?[\d.]+)"/g)].map((m) => parseFloat(m[1]));
  check("bump: adversarial long-symbol endpoint label stays inside the viewBox (x, 0..936)", xs.length > 0 && xs.every((x) => x >= 0 && x <= 936), xs.join(","));
  check("bump: adversarial long-symbol endpoint label stays inside the viewBox (y, 0..520)", ys.length > 0 && ys.every((y) => y >= 0 && y <= 520), ys.join(","));
}

// ---- sankey: multi-level flow decomposition. Links pre-sanitized (numeric/self-loop/cycle),
// small links auto-collapsed, then a self-check pass draws (and warns about) any node whose
// in/out sums don't reconcile — sectors-api/data-quality.md documents that most real P&L trees
// don't, so this chart makes that visible instead of hiding it ----
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("sankey", { links: [{ source: "A", target: "B", value: "bad" }, { source: "A", target: "C", value: 5 }] }), ctx);
  check("sankey: a non-numeric link value drops the link, warns naming it", ctx.warnings.some((w) => /dropped link "A" -> "B"/.test(w)) && (out.match(/<rect/g) || []).length > 0, ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  injectPlaceholders(chart("sankey", { links: [{ source: "A", target: "A", value: 5 }, { source: "B", target: "C", value: 3 }] }), ctx);
  check("sankey: a source===target link drops, warns, node can't flow into itself", ctx.warnings.some((w) => /can't flow into itself/.test(w)), ctx.warnings.join(" | "));
}
{
  const ctx = { warnings: [] };
  const out = injectPlaceholders(
    chart("sankey", { links: [{ source: "A", target: "B", value: 5 }, { source: "B", target: "C", value: 4 }, { source: "C", target: "A", value: 1 }] }),
    ctx
  );
  check("sankey: a cycle drops the closing link, warns naming it (a layered layout needs a DAG)", ctx.warnings.some((w) => /closes a cycle/.test(w) && /"C" -> "A"/.test(w)), ctx.warnings.join(" | "));
  check("sankey: with the cycle broken, the remaining DAG still renders", /<svg/.test(out) && !/NaN/.test(out));
}
{
  // B's inflow (10) and outflow (5) differ by 50%, far past the 1.5% reconciliation
  // threshold: the chart must draw a visible hatch AND warn, naming the node and both sums —
  // both halves of the promise are asserted, not just one.
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("sankey", { links: [{ source: "A", target: "B", value: 10 }, { source: "B", target: "C", value: 5 }] }), ctx);
  check(
    "sankey: a non-reconciling node warns naming the node and both sums",
    ctx.warnings.some((w) => /node "B" doesn't reconcile/.test(w) && /10/.test(w) && /5/.test(w)),
    ctx.warnings.join(" | ")
  );
  check("sankey: a non-reconciling node draws the hatch gap marker in the SAME render", /hatch/.test(out), out);
}
{
  // Two links into "Z" (from A and B) both sit under 2% of the root total (198): they
  // collapse into one "Other (2)" pseudo-source. A third link (C, 196) stays its own node.
  const ctx = { warnings: [] };
  const out = injectPlaceholders(
    chart("sankey", { links: [{ source: "A", target: "Z", value: 1 }, { source: "B", target: "Z", value: 1 }, { source: "C", target: "Z", value: 196 }] }),
    ctx
  );
  check("sankey: 2+ small same-target links auto-collapse into Other (n), warns naming what merged", ctx.warnings.some((w) => /collapsed 2 links into "Other \(2\)"/.test(w) && /\(A, B\)/.test(w)), ctx.warnings.join(" | "));
  check("sankey: the collapsed Other node appears in the rendered output", /Other \(2\)/.test(out), out);
}
{
  // A single small link with no same-target sibling stays its own named node — collapsing it
  // alone would just rename it "Other (1)" for zero decluttering benefit.
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("sankey", { links: [{ source: "TINY", target: "Z", value: 1 }, { source: "BIG", target: "Z", value: 500 }] }), ctx);
  check("sankey: a lone small link does not collapse", !ctx.warnings.some((w) => /collapsed/.test(w)) && /TINY/.test(out), ctx.warnings.join(" | "));
}
{
  const out = injectPlaceholders(chart("sankey", { links: [{ source: "Root", target: "Mid", value: 10 }, { source: "Mid", target: "Leaf", value: 10 }] }), { warnings: [] });
  check("sankey: every node's own total is present in the rendered output", ["Root", "Mid", "Leaf"].every((n) => out.includes(n)) && (out.match(/>10</g) || []).length >= 2, out);
}
{
  const manyLinks = Array.from({ length: 25 }, (_, i) => ({ source: `S${i}`, target: "HUB", value: 1 }));
  const ctx = { warnings: [] };
  injectPlaceholders(chart("sankey", { links: manyLinks }), ctx);
  check("sankey: 25 links warns past the ~24-link readability ceiling", ctx.warnings.some((w) => /25 links exceeds/.test(w)), ctx.warnings.join(" | "));
}
{
  // 6 layers deep (A0->A1->...->A5), one link per hop: past the ~5-layer ceiling.
  const chain = Array.from({ length: 6 }, (_, i) => ({ source: `A${i}`, target: `A${i + 1}`, value: 1 }));
  const ctx = { warnings: [] };
  injectPlaceholders(chart("sankey", { links: chain }), ctx);
  check("sankey: 6 layers warns past the ~5-layer readability ceiling", ctx.warnings.some((w) => /7 layers exceeds|6 layers exceeds/.test(w)), ctx.warnings.join(" | "));
}
{
  // The real TLKM FY2024 revenue_breakdown, unfiltered (responses/segments_telco.json): 17
  // edges, reconciling exactly at every level. This is the reference case the auto-collapse
  // threshold (blocks.mjs's SANKEY_COLLAPSE_PCT) was calibrated against — it must render with
  // NOTHING collapsed, every node's total printed, and no label escaping the viewBox.
  const TLKM_LINKS = [
    { source: "Cellular telephone revenue", target: "Total Revenue", value: 6.26 },
    { source: "Fixed line telephone revenue", target: "Total Revenue", value: 0.479 },
    { source: "Interconnection revenues", target: "Total Revenue", value: 9.187 },
    { source: "Data, internet and IT services revenues", target: "Total Revenue", value: 94.338 },
    { source: "Network revenues", target: "Total Revenue", value: 3.179 },
    { source: "IndiHome revenues", target: "Total Revenue", value: 26.262 },
    { source: "Lessor transactions", target: "Total Revenue", value: 3.029 },
    { source: "Others", target: "Total Revenue", value: 7.233 },
    { source: "Total Revenue", target: "Cost of Revenue", value: 41.202 },
    { source: "Total Revenue", target: "Gross Profit", value: 108.765 },
    { source: "Gross Profit", target: "Operating Income", value: 42.386 },
    { source: "Gross Profit", target: "Operating Expense", value: 66.379 },
    { source: "Operating Expense", target: "Depreciation and amortization", value: 32.643 },
    { source: "Operating Expense", target: "Personnel", value: 16.807 },
    { source: "Operating Expense", target: "Interconnection", value: 6.88 },
    { source: "Operating Expense", target: "General and administration", value: 6.225 },
    { source: "Operating Expense", target: "Marketing", value: 3.824 },
  ];
  const ctx = { warnings: [] };
  const out = injectPlaceholders(chart("sankey", { unit: "T", h: 1050, links: TLKM_LINKS }), ctx);
  check(
    "sankey: TLKM's real 17-edge tree renders with no collapse/cap/mismatch warnings (it reconciles at every level)",
    !ctx.warnings.some((w) => /collapsed|readability ceiling|doesn't reconcile/.test(w)),
    ctx.warnings.join(" | ")
  );
  check(
    "sankey: TLKM fixture — every node's total is present in the output",
    ["149.97T", "41.2T", "108.77T", "42.39T", "66.38T"].every((v) => out.includes(v)),
    out
  );
  const xs = [...out.matchAll(/<text[^>]*\sx="(-?[\d.]+)"/g)].map((m) => parseFloat(m[1]));
  const ys = [...out.matchAll(/<text[^>]*\sy="(-?[\d.]+)"/g)].map((m) => parseFloat(m[1]));
  check("sankey: TLKM fixture — every label's x stays inside the viewBox (0..936)", xs.length > 0 && xs.every((x) => x >= 0 && x <= 936), xs.filter((x) => x < 0 || x > 936).join(","));
  check("sankey: TLKM fixture — every label's y stays inside the viewBox (0..1050)", ys.length > 0 && ys.every((y) => y >= 0 && y <= 1050), ys.filter((y) => y < 0 || y > 1050).join(","));
}

// ---- brand-lint contract fixtures (spawned; its ERRORs are what SKILL.md promises) ----
{
  const dir = mkdtempSync(join(tmpdir(), "sectors-selftest-"));
  const lint = (deck) => {
    const p = join(dir, "d.json");
    writeFileSync(p, JSON.stringify(deck));
    try {
      return { code: 0, out: execFileSync(process.execPath, [join(here, "brand-lint.mjs"), p], { encoding: "utf8" }) };
    } catch (e) {
      return { code: e.status, out: String(e.stdout) };
    }
  };
  const bad = lint({
    slides: [
      { role: "cover", tickers: ["BBCA"], headline: "It fell 38%.", emphasis: "Fell 38%" },
      { html: `<div class="title">BBCA gained.</div><div data-chart="barchart" data-spec='{}'></div>` },
    ],
  });
  check("lint: registry from cover tickers catches bare prose mention", /names "BBCA" in prose/.test(bad.out) && bad.code === 1);
  check("lint: emphasis exact-substring mismatch is an ERROR", /not an exact substring/.test(bad.out));
  check("lint: unknown chart kind is an ERROR", /unknown data-chart kind "barchart"/.test(bad.out));
  const good = lint({
    slides: [
      { role: "cover", tickers: ["BBCA"], headline: "It fell 38%.", emphasis: "fell 38%" },
      { html: `<div class="title"><span class="logo-inline" data-logo="BBCA"></span>BBCA gained. Sectors like banking sell shares daily.</div>` },
    ],
  });
  check("lint: descriptive 'sell shares' + English 'Sectors' are not ERRORs", good.code === 0, `exit=${good.code}`);
  rmSync(dir, { recursive: true, force: true });
}

// ---- line/multiline start anchor (locked decision: label the STARTING value so the endpoint
// %-change reads against a real number without a gridded axis; extremes label the interior
// peak/trough) ----
{
  // interior peak (120 @ idx1) and interior trough (85 @ idx2); the endpoints (100/100) are
  // deliberately NOT re-labeled by extremes since start/end already carry their own numbers.
  const s = sparkline([100, 120, 85, 95, 100], { endpointLabel: true, startLabel: true, extremes: true });
  check("sparkline: startLabel prints the starting value", s.includes(">100<"), "no start anchor");
  check("sparkline: extremes label the interior peak and trough", s.includes(">120<") && s.includes(">85<"));
  const m = multiLine([{ name: "BBRI", self: true, values: [100, 90] }, { name: "IHSG", values: [100, 98] }], { startLabel: true });
  check("multiLine: startLabel anchors the self series' start value", m.includes(">100<"));
}

// ---- compose toolkit: the escape hatch for a chart shape none of the 13 named kinds fit.
// Every governance law the named kinds get by construction must hold for a hand-composed one
// too, or "the brand cannot drift" stops being true the moment the agent reaches for compose. ----
{
  const warns = [];
  const svg = compose(
    {
      x: { type: "band", domain: ["FY24", "FY25"] },
      y: { type: "linear", domain: [0, 30] },
      axes: { y: { ticks: [0, 15, 30] } },
      layers: [
        { mark: "line", points: [["FY24", 12], ["FY25", 24]], gradient: true },
        { mark: "dot", points: [["FY25", 24, "24%"]], color: "self" },
      ],
    },
    { warn: (mm) => warns.push(mm) }
  );
  check("compose: band x-categories are not coerced to numbers (no spurious clamp)", !warns.some((w) => w.includes("outside the scale domain")), warns.join("|"));
  check("compose: gradient:true renders the house pink->gold gradient", /stroke="url\(#cx\d+s\)"/.test(svg));

  const w2 = [];
  compose({ layers: [{ mark: "line", points: [[0, 0], [1, 1]], color: "muted" }] }, { warn: (mm) => w2.push(mm) });
  check("compose: a chart printing NO number warns (every chart is a promise)", w2.some((w) => w.includes("promise")));

  const w3 = [];
  compose({ axes: { y: { ticks: [0, 10] } }, layers: [{ mark: "bar", points: [[0, 8]], color: "self" }] }, { warn: (mm) => w3.push(mm) });
  check("compose: axis ticks satisfy the promise (no false promise warn)", !w3.some((w) => w.includes("promise")));

  const w4 = [];
  const svg4 = compose({ axes: { y: { ticks: [0, 1] } }, layers: [{ mark: "dot", points: [[0, 1, "x1"]], color: "#00ff00" }] }, { warn: (mm) => w4.push(mm) });
  check("compose: an off-brand color warns and never leaks its hex into the SVG", w4.some((w) => w.includes("off-brand")) && !svg4.includes("#00ff00"));

  const w5 = [];
  resolveComposeColor("peer9", (mm) => w5.push(mm));
  check("compose: a peer past peer2 warns (the 3-peer color ceiling holds)", w5.some((w) => w.includes("3-peer ceiling")));
}

// ---- brand-lint: the compose guardrails. Raw <svg> is blocked so compose is the ONLY door to
// a novel chart, and a compose spec's marks/colors are validated statically before render. ----
{
  const dir = mkdtempSync(join(tmpdir(), "sectors-selftest-"));
  const lint = (deck) => {
    const p = join(dir, "d.json");
    writeFileSync(p, JSON.stringify(deck));
    try {
      return { code: 0, out: execFileSync(process.execPath, [join(here, "brand-lint.mjs"), p], { encoding: "utf8" }) };
    } catch (e) {
      return { code: e.status, out: String(e.stdout) };
    }
  };
  const rawSvg = lint({ slides: [{ role: "content", html: `<div class="title">x</div><svg width="10" height="10"><circle cx="1" cy="1" r="1"/></svg>` }] });
  check("lint: raw <svg> in slide HTML is an ERROR (compose is the only novel-chart door)", /raw <svg>/.test(rawSvg.out) && rawSvg.code === 1);

  const badCompose = lint({ slides: [{ role: "content", html: `<div data-chart="compose" data-spec='{"layers":[{"mark":"blob","color":"#ff0000"}]}'></div>` }] });
  check("lint: compose unknown mark is an ERROR", /unknown mark "blob"/.test(badCompose.out) && badCompose.code === 1);
  check("lint: compose off-brand color is an ERROR", /off-brand color "#ff0000"/.test(badCompose.out));

  const goodCompose = lint({
    slides: [{ html: `<div data-chart="compose" data-spec='{"axes":{"y":{"ticks":[0,20]}},"layers":[{"mark":"line","points":[[0,4],[1,18]],"gradient":true},{"mark":"dot","points":[[1,18,"18"]],"color":"self"}]}'></div>` }],
  });
  check("lint: a governed compose chart passes clean", goodCompose.code === 0, `exit=${goodCompose.code}`);
  rmSync(dir, { recursive: true, force: true });
}

// ---- sectors.mjs: pure helpers only (parseArgs, sanitizePathToFilename,
// sanitizePathsToFilenames). Importing sectors.mjs does NOT run its main() or touch the
// network — see the import.meta.url guard at the bottom of that file — so every check below
// runs at 0 API credits, same hard rule as everything else in this file. ----
{
  // single-path shapes must parse exactly as before the batch form landed: no accidental
  // behavior change for the one invocation shape every existing SKILL.md call site uses.
  const bare = parseArgs(["company/report/BBCA"]);
  check(
    "sectors.mjs parseArgs: bare single path (pre-batch shape)",
    bare.kind === "run" && bare.paths.length === 1 && bare.paths[0] === "company/report/BBCA" && bare.savePath === null && bare.saveDir === null,
    JSON.stringify(bare)
  );
  const withSave = parseArgs(["company/report/BBCA", "--save", "out.json"]);
  check(
    "sectors.mjs parseArgs: single path + --save (pre-batch shape)",
    withSave.kind === "run" && withSave.paths.length === 1 && withSave.savePath === "out.json" && withSave.saveDir === null,
    JSON.stringify(withSave)
  );
  const noPath = parseArgs([]);
  check("sectors.mjs parseArgs: no path is a usage error (exit 2, matches the pre-batch script)", noPath.kind === "help" && noPath.exitCode === 2, JSON.stringify(noPath));
  const help = parseArgs(["--help"]);
  check("sectors.mjs parseArgs: --help exits 0 (matches the pre-batch script)", help.kind === "help" && help.exitCode === 0, JSON.stringify(help));
}
{
  // the whole reason a batch form needs --save-dir: stdout can carry exactly one JSON body,
  // so 2+ paths with nowhere to land must fail loud before any fetch, not silently pick one.
  const multiNoDir = parseArgs(["company/report/BBCA", "daily/BBCA"]);
  check("sectors.mjs parseArgs: 2+ paths without --save-dir is an error", multiNoDir.kind === "error" && /--save-dir/.test(multiNoDir.message), JSON.stringify(multiNoDir));
  const multiWithDir = parseArgs(["company/report/BBCA", "daily/BBCA", "--save-dir", "out/"]);
  check(
    "sectors.mjs parseArgs: 2+ paths with --save-dir parses both paths in order",
    multiWithDir.kind === "run" && multiWithDir.paths.join(",") === "company/report/BBCA,daily/BBCA" && multiWithDir.saveDir === "out/",
    JSON.stringify(multiWithDir)
  );
  const flagsFirst = parseArgs(["--save-dir", "out/", "company/report/BBCA", "daily/BBCA"]);
  check(
    "sectors.mjs parseArgs: flag position doesn't matter (--save-dir before the paths)",
    flagsFirst.kind === "run" && flagsFirst.paths.length === 2 && flagsFirst.saveDir === "out/",
    JSON.stringify(flagsFirst)
  );
  const both = parseArgs(["company/report/BBCA", "--save", "out.json", "--save-dir", "out/"]);
  check("sectors.mjs parseArgs: --save and --save-dir together is an error (mutually exclusive)", both.kind === "error" && /mutually exclusive/.test(both.message), JSON.stringify(both));
}
{
  // path -> filename: slashes and query punctuation collapse to "_", anything else unsafe
  // becomes "-", never an empty basename.
  check("sectors.mjs sanitizePathToFilename: slashes collapse to _", sanitizePathToFilename("daily/BBCA") === "daily_BBCA.json", sanitizePathToFilename("daily/BBCA"));
  check(
    "sectors.mjs sanitizePathToFilename: query string (?, =) sanitizes and keeps the section name legible",
    sanitizePathToFilename("company/report/BBCA/?sections=overview") === "company_report_BBCA_sections_overview.json",
    sanitizePathToFilename("company/report/BBCA/?sections=overview")
  );
  check(
    "sectors.mjs sanitizePathToFilename: a where= clause with spaces/operators has no illegal filename characters and no empty segments",
    /^[a-zA-Z0-9_.-]+\.json$/.test(sanitizePathToFilename("companies/?where=pe_ttm > 0 and pe_ttm < 12")),
    sanitizePathToFilename("companies/?where=pe_ttm > 0 and pe_ttm < 12")
  );
  check("sectors.mjs sanitizePathToFilename: an all-slash path never yields an empty basename", sanitizePathToFilename("///") === "response.json", sanitizePathToFilename("///"));
}
{
  // collision safety: two different paths that sanitize to the SAME name must not overwrite
  // each other under one --save-dir — the exact silent-loss shape this scheme exists to close.
  const collided = sanitizePathsToFilenames(["company/report/BBCA", "company_report_BBCA"]);
  check(
    "sectors.mjs sanitizePathsToFilenames: colliding sanitized names get -2, -3, ... suffixes, first-seen wins the plain name",
    collided[0] === "company_report_BBCA.json" && collided[1] === "company_report_BBCA-2.json",
    JSON.stringify(collided)
  );
  const distinct = sanitizePathsToFilenames(["company/report/BBCA", "daily/BBCA"]);
  check(
    "sectors.mjs sanitizePathsToFilenames: non-colliding paths keep their own plain names (no spurious suffix)",
    distinct[0] === "company_report_BBCA.json" && distinct[1] === "daily_BBCA.json",
    JSON.stringify(distinct)
  );
  const tripleCollision = sanitizePathsToFilenames(["daily/BBCA", "daily/BBCA", "daily/BBCA"]);
  check(
    "sectors.mjs sanitizePathsToFilenames: a 3-way collision suffixes every repeat uniquely",
    tripleCollision.join(",") === "daily_BBCA.json,daily_BBCA-2.json,daily_BBCA-3.json",
    tripleCollision.join(",")
  );
}

// ---- render.mjs --report: report.json's overflow (now cover/outro-aware, previously silently
// no-opped on outro because outro renders no `.content` wrapper), voidGap, and collisions.
// One 4-slide synthetic deck, ONE render.mjs child process (a Puppeteer launch is the slow
// part of this check, not the slide count), so all four lock cases run in a single pass and
// selftest stays close to its usual runtime. The two real decks (bbri sample + the 15-
// archetype/14-chart-kind lookbook) were hand-verified report-clean while tuning this feature
// (COLLISION_TOL, the spark-callout/chip-row overlap exclusions, leaf-only voidGap — see
// CLAUDE.md for the false-positive tuning notes) but are deliberately NOT re-rendered here
// every run: 21+7 real slides through a fresh Chromium would multiply this suite's runtime
// several times over for a regression this suite already caught once by hand. ----
{
  const dir = mkdtempSync(join(tmpdir(), "sectors-selftest-report-"));
  const deckPath = join(dir, "deck.json");
  const outDir = join(dir, "out");
  const LONGWORD = "SUPERCALIFRAGILISTICEXPIALIDOCIOUSWORDTHATWONTWRAPNOMATTERWHAT";
  writeFileSync(
    deckPath,
    JSON.stringify({
      format: "portrait",
      autoOutro: false,
      slides: [
        { role: "cover", headline: `This is a ${LONGWORD} test.`, emphasis: LONGWORD },
        { role: "content", blocks: [{ kind: "caption", text: "Just one short caption." }] },
        {
          role: "content",
          html:
            '<div style="position:relative;height:600px;">' +
            '<div style="position:absolute;top:100px;left:100px;font-size:40px;">Label A</div>' +
            '<div style="position:absolute;top:120px;left:120px;font-size:40px;">Label B</div>' +
            "</div>",
        },
        { role: "outro", outro: { headline: `Like this ${LONGWORD} post?`, emphasis: LONGWORD } },
      ],
    })
  );
  execFileSync(process.execPath, [join(here, "render.mjs"), deckPath, "--out", outDir, "--report"], { encoding: "utf8" });
  const report = JSON.parse(readFileSync(join(outDir, "report.json"), "utf8"));

  check("report: partial is false on a full render", report.partial === false, JSON.stringify(report.partial));

  const cover = report.slides[0];
  check(
    "report: an overflowing cover headline warns and shows in overflow.offenderCount (cover already had `.content`, this locks it stays true)",
    cover.warnings.some((w) => /extends beyond the canvas/.test(w)) && cover.overflow.offenderCount > 0,
    JSON.stringify(cover.overflow)
  );

  const sparse = report.slides[1];
  check(
    "report: a near-empty content slide's voidGap is large (leaf-only lowestBottom, not `.stack`'s own flex:1-stretched box)",
    sparse.voidGap.px > 500,
    JSON.stringify(sparse.voidGap)
  );

  const collided = report.slides[2];
  check(
    "report: two deliberately overlapping labels show up in collisions with a real overlapPx",
    collided.collisions.length > 0 && collided.collisions.every((c) => c.overlapPx > 6),
    JSON.stringify(collided.collisions)
  );

  const outro = report.slides[3];
  check(
    "report: an overflowing OUTRO headline now warns too — the actual bug this feature fixes (outro renders no `.content` wrapper, the old check no-opped here)",
    outro.warnings.some((w) => /extends beyond the canvas/.test(w)) && outro.overflow.offenderCount > 0,
    JSON.stringify(outro.overflow)
  );

  rmSync(dir, { recursive: true, force: true });
}

// ---- render.mjs --slides: partial renders by number ("2,5") and range ("2-4"), filenames kept
// at FULL-deck numbering (a partial render's slide-05.png must be the exact file a full render
// would have produced for slide 5, or "re-render slide 5 after a tweak" would silently land on
// the wrong filename). One 5-slide synthetic deck (cover + 3 content + outro, so the range case
// spans slide numbers that mean something) shared across the sub-checks below; only the invalid-
// spec checks need their own runs since those must exit before Chromium ever launches. ----
{
  const dir = mkdtempSync(join(tmpdir(), "sectors-selftest-slides-"));
  const deckPath = join(dir, "deck.json");
  writeFileSync(
    deckPath,
    JSON.stringify({
      format: "portrait",
      slides: [
        { role: "cover", headline: "Test.", emphasis: "Test" },
        { role: "content", html: '<div class="title">Two.</div>' },
        { role: "content", html: '<div class="title">Three.</div>' },
        { role: "content", html: '<div class="title">Four.</div>' },
      ],
      // autoOutro defaults true, so this deck is 5 slides: cover, 2, 3, 4, outro.
    })
  );

  const fullOutDir = join(dir, "full");
  execFileSync(process.execPath, [join(here, "render.mjs"), deckPath, "--out", fullOutDir], { encoding: "utf8" });
  const fullFiles = readdirSync(fullOutDir).sort();
  check("--slides baseline: a full 5-slide render (4 authored + autoOutro) produces slide-01..05.png", fullFiles.join(",") === "slide-01.png,slide-02.png,slide-03.png,slide-04.png,slide-05.png", fullFiles.join(","));

  const commaOutDir = join(dir, "comma");
  execFileSync(process.execPath, [join(here, "render.mjs"), deckPath, "--out", commaOutDir, "--slides", "2,5", "--report"], { encoding: "utf8" });
  const commaFiles = readdirSync(commaOutDir).sort();
  check(
    "--slides \"2,5\": produces exactly slide-02.png and slide-05.png, no others",
    commaFiles.join(",") === "report.json,slide-02.png,slide-05.png",
    commaFiles.join(",")
  );
  const commaReport = JSON.parse(readFileSync(join(commaOutDir, "report.json"), "utf8"));
  check("--slides \"2,5\": report.json sets partial:true", commaReport.partial === true, JSON.stringify(commaReport.partial));
  check(
    "--slides \"2,5\": report.json's slide entries carry the FULL-deck slide numbers (2 and 5), not a renumbered 1/2",
    commaReport.slides.map((s) => s.slide).join(",") === "2,5",
    JSON.stringify(commaReport.slides.map((s) => s.slide))
  );

  const rangeOutDir = join(dir, "range");
  execFileSync(process.execPath, [join(here, "render.mjs"), deckPath, "--out", rangeOutDir, "--slides", "2-4"], { encoding: "utf8" });
  const rangeFiles = readdirSync(rangeOutDir).sort();
  check(
    "--slides \"2-4\" (a range): produces exactly slide-02/03/04.png, no slide-01 or slide-05",
    rangeFiles.join(",") === "slide-02.png,slide-03.png,slide-04.png",
    rangeFiles.join(",")
  );

  // Numbering identical to a full render: slide 5 of THIS deck is unambiguously the autoOutro
  // (cover, 2, 3, 4, outro), so a partial render asked for "slide 5" must report role "outro",
  // the same slide a full render would put at that position, not an off-by-one from the request
  // only rendering 2 of 5 slides. (Not a byte-for-byte PNG comparison: two INDEPENDENT full
  // renders of this same unmodified deck, no --slides involved at all, were themselves found to
  // differ by a few bytes on 2 of 7 slides during this work — almost certainly headless
  // Chromium's `backdrop-filter: blur()` glassmorphism cards rasterizing with tiny run-to-run
  // variance, a pre-existing renderer property, not something introduced by --slides, and not
  // this repro's job to fix. Role + slide-number alignment is the honest thing to assert here.)
  check(
    "--slides \"2,5\": partial render's slide 5 has role \"outro\" (the same slide a full render puts at position 5)",
    commaReport.slides.find((s) => s.slide === 5)?.role === "outro",
    JSON.stringify(commaReport.slides.map((s) => ({ slide: s.slide, role: s.role })))
  );
  const partialSlide5Size = readFileSync(join(commaOutDir, "slide-05.png")).length;
  const fullSlide5Size = readFileSync(join(fullOutDir, "slide-05.png")).length;
  check(
    "--slides: partial render's slide-05.png is a real, similarly-sized PNG (not blank/truncated)",
    partialSlide5Size > 1000 && Math.abs(partialSlide5Size - fullSlide5Size) / fullSlide5Size < 0.05,
    `partial=${partialSlide5Size} full=${fullSlide5Size}`
  );

  // Invalid specs error loudly with usage, before Chromium ever launches (checked by the run
  // completing near-instantly and never producing an output dir, not just by the exit code).
  const invalidCases = [
    ["99", /out of range/],
    ["abc", /not a slide number or a range/],
    ["5-2", /bad range/],
    ["0", /not a valid slide number/],
    ["", /empty entry|not a slide number/],
  ];
  for (const [spec, pattern] of invalidCases) {
    const badOutDir = join(dir, `bad-${spec || "empty"}`);
    let code = 0, stderr = "";
    try {
      execFileSync(process.execPath, [join(here, "render.mjs"), deckPath, "--out", badOutDir, "--slides", spec], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) {
      code = e.status;
      stderr = String(e.stderr);
    }
    check(
      `--slides "${spec}": errors loudly with usage (exit 1, no Chromium launch, no output dir)`,
      code === 1 && pattern.test(stderr) && /^usage:/m.test(stderr) && !existsSync(badOutDir),
      stderr
    );
  }

  rmSync(dir, { recursive: true, force: true });
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nselftest: all checks passed");
process.exit(failures ? 1 : 0);
