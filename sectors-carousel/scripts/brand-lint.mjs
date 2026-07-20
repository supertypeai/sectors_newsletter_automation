#!/usr/bin/env node
// brand-lint.mjs — static brand + editorial check for a deck before you render.
//
//   node scripts/brand-lint.mjs <deck.json>
//
// This is the safety net for free-coded slides: it catches the brand and house-rule
// violations that are cheap to check in text, so the rendered output stays on-brand and
// on-voice. It does NOT check layout (overflow, balance, collisions) — that's what reading
// the rendered PNGs is for. ERRORS are real violations (exit 1); WARN are advisory (exit 0).
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const LINT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
import { collectTickers, CHART_KINDS } from "./blocks.mjs";
import { COMPOSE_MARKS, COMPOSE_COLOR_TOKENS } from "./charts.mjs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/brand-lint.mjs <deck.json>");
  process.exit(2);
}
const deck = JSON.parse(readFileSync(resolve(path), "utf8"));
const slides = deck.slides || [];

const issues = []; // { slide, level, rule, msg }
const add = (slide, level, rule, msg) => issues.push({ slide, level, rule, msg });

const stripTags = (html) =>
  String(html || "")
    // Drop chart-spec payloads first (numbers/labels aren't prose). The spec attribute is
    // stripped wherever it sits so a reordered/extra-attribute placeholder (now legal, see
    // injectPlaceholders) can't leak its JSON into the prose checks.
    .replace(/data-spec='[\s\S]*?'/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// prose collected per slide for voice checks
function slideText(s) {
  if (s.html) return stripTags(s.html);
  // Cover stat/spark labels are rendered text too; they used to escape every voice check,
  // so a dash or a "Sectors API" citation in a stat label sailed through.
  const bits = [s.kicker, s.headline, s.support];
  if (s.stat) bits.push(s.stat.label, s.stat.sub, s.stat.compare && s.stat.compare.label);
  if (s.spark) bits.push(s.spark.label);
  for (const b of s.blocks || []) {
    bits.push(b.title, b.text, b.kicker, b.label, b.caption, b.metric, b.attribution);
    (b.items || []).forEach((i) => bits.push(i));
    (b.facts || []).forEach((f) => bits.push(f.label, f.sub));
  }
  return bits.filter(Boolean).join(" · ");
}

// ---- gradient (one brand moment, emphasis only) ----
function gradientCount(s) {
  if (s.role === "cover") return s.emphasis ? 1 : 0;
  if (s.html) {
    const spans = (s.html.match(/gradient-text/g) || []).length;
    const inline = (s.html.match(/-webkit-background-clip\s*:\s*text|background-clip\s*:\s*text/g) || []).length;
    return spans + inline;
  }
  // semantic blocks
  let n = 0;
  for (const b of s.blocks || []) {
    if (b.gradient) n++;
    else if (b.emphasis) n++;
    if (b.kind === "headline" && b.gradient) n = Math.max(n, 1);
  }
  return n;
}

// ---- voice: no investment advice (descriptive only) ----
// NOTE: "strong buy"/"buy"/"sell" as bare analyst-rating-tier NAMES are deliberately not
// banned here — brand-voice.md's own canonical example is "34 analysts, consensus Buy",
// reporting consensus is permitted (hard rule 2), only endorsing it isn't. An eval hit this:
// reporting a real "14 of 20 analysts rate it a buy" figure got flagged and had to be
// paraphrased around. The patterns below catch PRESCRIPTIVE framing (should/now/our call/
// price target/must-buy) regardless of which rating tier is named, that's the real risk.
// ERROR only on genuinely PRESCRIPTIVE framing. "(buy|sell) shares/the stock" used to be an
// ERROR too, but that phrasing is how a *descriptive* flow story reads ("foreign investors
// sell shares worth Rp 2T" is exactly the story shape this skill is built for), and an ERROR
// there trains the agent to paraphrase away accurate wording. Descriptive-but-ambiguous
// phrasings are WARNs for a human/judgment pass instead.
const ADVICE = [
  /\bshould\s+(buy|sell|hold|own)\b/i,
  /\b(buy|sell)\s+(now|today|before|the\s+dip)\b/i,
  /\b(price\s+target|target\s+price|must[-\s]?buy|time\s+to\s+buy)\b/i,
  /\bwe\s+(recommend|rate)\b/i,
  /\bour\s+(pick|call)\b/i,
  /\b(load\s+up|back\s+up\s+the\s+truck)\b/i,
];
const ADVICE_SOFT = [/\b(buy|sell)\s+(the\s+stock|shares)\b/i];
// ---- house rule: no dash-connectors in prose ----
const EM_EN = /[—–]/; // — –
const HYPHEN_CONNECTOR = / - /; // space hyphen space used as a pause

// ---- house rule: cite the data source as sectors.app, never "Sectors API" or bare "Sectors" ----
// "Sectors API" is our own internal engineering name for the data layer; it means nothing to
// a retail reader and leaks implementation detail onto a public slide. Two independent eval
// decks both wrote "Sectors API" in a caption source line unprompted (naturally, since that's
// literally the name of the reference docs the agent just read) — a real, recurring slip,
// not a one-off, hence a mechanical check rather than relying on the writing rule alone.
// The old check flagged EVERY bare "Sectors" and hit the plain English noun ("Sectors like
// banking absorbed the outflow"): ERROR only in a citation context, WARN elsewhere.
const SECTORS_CITE = /\bSectors\s+API\b|(?:source|per|via|from|data|powered\s+by|according\s+to)\s*[:\-]?\s*Sectors\b(?!\.app)|·\s*Sectors\b(?!\.app)/i;
const SECTORS_BARE = /\bSectors\b(?!\.app)(?!\s+API)/;

// ---- foreign fonts ----
const FONT_OK = /(var\(--sans\)|var\(--mono\)|Plus Jakarta Sans|JetBrains Mono)/i;

// ---- ticker mentions must carry a logo-inline mark somewhere on the slide ----
// The deck-wide ticker registry comes only from tickers the deck ITSELF already uses,
// never a blind text scan, so a finance acronym that happens to look like a ticker (ROE,
// NPL, CASA) can never false-positive: it's simply not in this deck's registry unless it's
// also a real ticker actually referenced elsewhere. The registry is collectTickers() from
// blocks.mjs, THE list the renderer itself resolves logos from, so the lint can never again
// miss a source the renderer honors (it used to keep its own partial copy and skipped the
// cover `tickers` array and table rows entirely, which silently exempted whole decks).
const TICKERS = [...collectTickers(slides)];

// Tickers this slide names in prose (title/body/insight sentences — not a kicker/label/
// caption row, those are typographic metadata, not narrative) with NO logo mark anywhere
// on the slide. Per visual-language.md, ONE mark anywhere on the slide satisfies every
// repeat of that ticker — so the check is simply "named in prose AND zero data-logo for it
// on this slide" (the old version demanded the mark be immediately adjacent to the ticker
// text, which docs never required, and rejected a sized data-logo box in a header).
function missingLogoMarks(slide, tickers) {
  if (!slide.html || slide.role === "cover") return [];
  const hasMarkFor = (tEsc) => new RegExp(`data-logo="${tEsc}(?:\\.JK)?"`, "i").test(slide.html);
  // Chrome rows are not prose. The class-anchored strips tolerate extra attributes
  // (a kicker with a style="margin-top" used to dodge the strip and false-error).
  const base = slide.html
    .replace(/data-spec='[\s\S]*?'/g, " ")
    .replace(/<div\s+class="kicker"[^>]*>[\s\S]*?<\/div>/g, " ")
    .replace(/<div\s+class="caption-t"[^>]*>[\s\S]*?<\/div>/g, " ")
    .replace(/<div\s+class="label"[^>]*>[\s\S]*?<\/div>/g, " ");
  const text = base.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ");
  const missing = [];
  for (const t of tickers) {
    const tEsc = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${tEsc}\\b`).test(text) && !hasMarkFor(tEsc)) missing.push(t);
  }
  return missing;
}

// Blocks-path slides can name tickers in prose too, but the block library has no
// logo-inline primitive, so this can't be an ERROR demanding one; it's a WARN steering
// that slide to free-HTML (the primary path). Block kinds that already display the
// ticker's logo themselves (priceSnapshot, ranking/comparison rows) satisfy the mention.
function blocksSlideBareTickers(slide, tickers) {
  if (!slide.blocks || slide.role === "cover") return [];
  const shown = new Set();
  const prose = [];
  const walk = (blocks) => {
    for (const b of blocks || []) {
      if (b.kind === "row") { walk(b.blocks); continue; }
      if (b.kind === "priceSnapshot" && b.ticker) shown.add(String(b.ticker).toUpperCase().replace(/\.JK$/, ""));
      if (b.kind === "ranking" || b.kind === "comparison")
        (b.rows || []).forEach((r) => r.ticker && shown.add(String(r.ticker).toUpperCase().replace(/\.JK$/, "")));
      prose.push(b.title, b.text, b.attribution, ...(b.items || []));
    }
  };
  walk(slide.blocks);
  const text = prose.filter(Boolean).join(" · ");
  return tickers.filter((t) => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(text) && !shown.has(t));
}

// ---- placeholder shape (static mirror of injectPlaceholders' residual warnings) ----
// A placeholder that won't inject means a slide silently missing its anchor visual; catch
// it BEFORE the render. Valid = <div … data-chart="known" … data-spec='parseable JSON' …>
// </div> (either attribute order, empty body) / <span … data-logo="X" …></span>.
// CHART_KINDS comes from blocks.mjs (the renderer's own list, imported above), not a hand-
// copy, so this check can never accept or reject a kind the renderer disagrees with.
function placeholderProblems(html) {
  const problems = [];
  const consume = (m, kind, spec) => {
    if (!CHART_KINDS.includes(kind)) { problems.push(`unknown data-chart kind "${kind}" (known: ${CHART_KINDS.join(", ")})`); return " "; }
    let parsed;
    try { parsed = JSON.parse(spec); } catch (e) { problems.push(`data-chart="${kind}" has invalid data-spec JSON (${e.message})`); return " "; }
    // compose is the only kind whose SHAPE the agent authors freely, so it's the only one whose
    // layers/colors need static validation: an unknown mark or an off-brand color (raw hex, a
    // typo'd token, a peer past the 3-peer ceiling) is caught here rather than degrading quietly
    // at render. COMPOSE_MARKS/COMPOSE_COLOR_TOKENS are imported from charts.mjs, not hand-copied.
    if (kind === "compose") {
      for (const layer of parsed.layers || []) {
        if (layer.mark && !COMPOSE_MARKS.includes(layer.mark))
          problems.push(`compose: unknown mark "${layer.mark}" (known: ${COMPOSE_MARKS.join(", ")})`);
        const cols = [layer.color, ...(layer.items || []).map((it) => it && it.color)].filter((c) => c != null);
        for (const c of cols)
          if (!COMPOSE_COLOR_TOKENS.includes(c))
            problems.push(`compose: off-brand color "${c}" — use a house token (${COMPOSE_COLOR_TOKENS.join(", ")}), never raw hex or a peer past peer2.`);
      }
    }
    return " ";
  };
  const rest = String(html || "")
    .replace(/<div\b[^>]*?\bdata-chart="([^"]+)"[^>]*?\bdata-spec='([\s\S]*?)'\s*[^>]*?><\/div>/g, (m, k, s) => consume(m, k, s))
    .replace(/<div\b[^>]*?\bdata-spec='([\s\S]*?)'\s+[^>]*?\bdata-chart="([^"]+)"[^>]*?><\/div>/g, (m, s, k) => consume(m, k, s))
    .replace(/<span\s+[^>]*?data-logo="[^"]+"[^>]*?><\/span>/g, " ");
  for (const m of rest.matchAll(/data-chart="([^"]*)"/g))
    problems.push(`malformed data-chart="${m[1]}" placeholder: must be <div data-chart="…" data-spec='…'></div>, single-quoted JSON, empty body`);
  for (const m of rest.matchAll(/data-logo="([^"]*)"/g))
    problems.push(`malformed data-logo="${m[1]}" placeholder: must be <span data-logo="…"></span> with an empty body`);
  return problems;
}

for (let i = 0; i < slides.length; i++) {
  const s = slides[i];
  const n = i + 1;
  const role = s.role || "content";
  if (role === "outro") continue; // renderer-owned, fixed copy

  // gradient
  const g = gradientCount(s);
  if (role === "cover" && g === 0)
    add(n, "ERROR", "gradient", 'cover has no "emphasis" — gradient is emphasis-only; set emphasis to the verdict word/number.');
  if (g > 1) add(n, "ERROR", "gradient", `${g} gradient emphases on one slide — use exactly ONE (the verdict word).`);

  // cover art: every cover should carry a representative image of its subject, either an
  // explicit `coverArt.src` or a prepared assets/coverart/<TICKER>.png that render.mjs
  // auto-resolves. WARN not ERROR: some subjects genuinely have no honest, licensable
  // image (an index, a flow story, a screener of 40 names), and a wrong or generic photo
  // is worse than none. See SKILL.md's cover-art step for how to source and prepare one.
  if (role === "cover" && !(s.coverArt && s.coverArt.src)) {
    const first = (s.tickers && s.tickers[0]) || (s.chip && s.chip.ticker);
    const t = typeof first === "string" ? first : first && first.ticker;
    const key = t ? String(t).toUpperCase().replace(/\.[A-Z]+$/, "") : null;
    const prepared = key && existsSync(resolve(LINT_ROOT, "assets", "coverart", `${key}.png`));
    if (!prepared)
      add(
        n,
        "WARN",
        "cover-art",
        key
          ? `cover has no subject image — prepare one with "node scripts/coverart.mjs <src> --ticker ${key}", or say why this subject has none.`
          : 'cover has no subject image and names no ticker — see SKILL.md\'s cover-art step.'
      );
  }
  // emphasis must be an EXACT, case-sensitive substring: the renderer does indexOf and
  // silently renders the hook flat on a mismatch, while the presence-based count above
  // still says "1 gradient" — a typo'd emphasis used to pass lint and render no gradient.
  if (role === "cover" && s.emphasis && s.headline && !s.headline.includes(s.emphasis))
    add(n, "ERROR", "gradient", `"emphasis" (${JSON.stringify(s.emphasis)}) is not an exact substring of the headline — the renderer matches case-sensitively and renders the hook FLAT on mismatch.`);
  for (const b of s.blocks || [])
    if (b.kind === "headline" && b.emphasis && b.title && !b.title.includes(b.emphasis))
      add(n, "ERROR", "gradient", `headline block "emphasis" (${JSON.stringify(b.emphasis)}) is not an exact substring of its title — it will render flat.`);
  if (role === "content" && s.html && g === 0)
    add(n, "WARN", "gradient", "no gradient emphasis — fine for a pure-text slide, but most slides have one verdict word in gradient.");

  // cover headline length — viral-hooks.md caps it at ~9 words / 1-3 short lines. Nothing else
  // catches a long headline before render: it doesn't fail lint on content grounds, it just
  // wraps to 4+ lines and crowds the line-height budget (a real cover rendered 12 words as 4
  // lines and the descenders read as nearly touching the line below, tight but not what a
  // ~9-word cover hook is supposed to produce).
  if (role === "cover" && s.headline) {
    const words = s.headline.trim().split(/\s+/).filter(Boolean).length;
    if (words > 10)
      add(n, "WARN", "headline-length", `cover headline is ${words} words — viral-hooks.md caps it at ~9 words / 1-3 short lines; this will likely wrap to 4+ lines and crowd the cover.`);
  }

  // voice + dashes (prose only)
  const text = slideText(s);
  for (const re of ADVICE)
    if (re.test(text)) add(n, "ERROR", "advice", `possible investment advice ("${(text.match(re) || [])[0]}") — stay descriptive, never prescribe.`);
  for (const re of ADVICE_SOFT)
    if (re.test(text))
      add(n, "WARN", "advice", `"${(text.match(re) || [])[0]}" — fine if it DESCRIBES what happened ("foreign investors sell shares"), a violation if it prescribes; check the sentence's subject.`);
  if (EM_EN.test(text)) add(n, "ERROR", "dash", "em/en dash in copy — house rule is no dash-connectors; use commas/periods.");
  if (HYPHEN_CONNECTOR.test(text)) add(n, "WARN", "dash", 'hyphen-as-connector (" - ") in copy — prefer a comma/period.');
  if (SECTORS_CITE.test(text))
    add(n, "ERROR", "sourcing", `cites "${(text.match(SECTORS_CITE) || [])[0]}" — cite the data source as "sectors.app", never "Sectors API" or bare "Sectors".`);
  else if (SECTORS_BARE.test(text))
    add(n, "WARN", "sourcing", `bare "Sectors" in copy — fine as plain English ("sectors like banking"), a violation if it names the data source; if citing, write "sectors.app".`);

  // fonts + raw hex (free HTML only)
  if (s.html) {
    const fonts = s.html.match(/font-family\s*:\s*([^;"']+)/gi) || [];
    for (const f of fonts) if (!FONT_OK.test(f)) add(n, "ERROR", "font", `foreign font-family (${f.trim()}) — use var(--sans)/var(--mono) only.`);
    // raw hex inside style="" attributes (chart data-spec is allowed to carry hex)
    const styleHex = (s.html.match(/style="[^"]*#[0-9a-fA-F]{3,6}[^"]*"/g) || []).length;
    if (styleHex) add(n, "WARN", "token", `${styleHex} raw hex color(s) in inline style — prefer var(--token) so theme changes propagate.`);
    // hand-authored footer / handles (renderer owns the footer on cover/outro)
    if (/supertype\.ai|@sectorsapp|class="footer"/.test(s.html))
      add(n, "ERROR", "footer", "footer / handles authored in slide HTML — the renderer owns the footer; remove it from content slides.");
    // raw <svg> hand-authored in slide HTML — the ONE thing the agent must never do. Charts come
    // through governed placeholders (the 13 named kinds, or data-chart="compose" for a novel
    // shape); a hand-rolled <svg> escapes every chart law (brand gradient, mono numerals,
    // semantic colors, "every chart is a promise"), so compose stays the only door to a custom
    // chart and the door is always governed.
    if (/<svg\b/i.test(s.html))
      add(n, "ERROR", "raw-svg", 'raw <svg> in slide HTML — never hand-roll a chart; use a governed placeholder (a named data-chart kind, or <div data-chart="compose" data-spec=\'…\'> to build a novel one). Raw SVG bypasses all brand governance.');
    // placeholders that won't inject (typo'd kind, wrong quoting, body inside the div)
    for (const p of placeholderProblems(s.html)) add(n, "ERROR", "placeholder", p);
  }

  // ticker named in prose with no logo mark anywhere on the slide
  for (const t of missingLogoMarks(s, TICKERS))
    add(n, "ERROR", "logo", `names "${t}" in prose with no logo mark on this slide — wrap it <span class="logo-inline" data-logo="${t}"></span>${t} (one mark anywhere on the slide is enough).`);
  for (const t of blocksSlideBareTickers(s, TICKERS))
    add(n, "WARN", "logo", `blocks slide names "${t}" in prose; the block library can't express a logo-inline mark — consider free-HTML for this slide (the primary path), or a block that shows the logo (priceSnapshot/ranking).`);
}

// ---- report ----
const errors = issues.filter((x) => x.level === "ERROR");
const warns = issues.filter((x) => x.level === "WARN");
if (!issues.length) {
  console.log(`brand-lint: PASS — ${slides.length} slides, no issues.`);
  process.exit(0);
}
console.log(`brand-lint: ${errors.length} error(s), ${warns.length} warning(s) across ${slides.length} slides\n`);
for (const x of issues) console.log(`  [${x.level}] slide ${x.slide} · ${x.rule}: ${x.msg}`);
console.log(
  errors.length
    ? "\nFix the ERRORs before rendering. WARNs are advisory — use judgment."
    : "\nNo errors. WARNs are advisory — use judgment."
);
process.exit(errors.length ? 1 : 0);
