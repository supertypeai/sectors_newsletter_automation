#!/usr/bin/env node
// render.mjs — turn a deck.json into Instagram carousel PNG slides.
//
// Usage:
//   node scripts/render.mjs <deck.json> [--out <dir>] [--scale 2] [--format portrait]
//
// Content (slides, words, data) is the agent's job, written with references/writing/ and real
// figures from references/sectors-api/. This is the deterministic render half: it launches ONE
// headless Chromium (bundled by Puppeteer — same on every Mac/Windows/Linux), builds a
// self-contained HTML per slide (fonts, logos, brand art all inlined as base64/SVG), waits for
// fonts to load, and screenshots each at the canvas size. No system Chrome, no per-slide process.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, basename } from "node:path";
import { renderSlide, formatDims, collectTickers } from "./blocks.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

// ---- args ----
// Flags may come before or after the deck path (`--out foo deck.json` used to crash with a
// raw ENOENT stack from readFileSync("--out")); unknown flags error with usage instead of
// silently reading the next token as a value.
const argv = process.argv.slice(2);
const usage = "usage: node scripts/render.mjs <deck.json> [--out <dir>] [--scale 2] [--format portrait|square|story] [--report] [--slides 2,5|2-4]";
if (argv.includes("-h") || argv.includes("--help")) {
  console.log(usage);
  process.exit(0);
}
const VALUE_FLAGS = new Set(["--out", "--scale", "--format", "--slides"]);
// --report takes no value (a bare switch); kept in its own set instead of piling a third
// state onto VALUE_FLAGS so "does this flag consume the next token" stays a one-line lookup.
const BOOL_FLAGS = new Set(["--report"]);
const flags = {};
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (VALUE_FLAGS.has(a)) {
    if (i + 1 >= argv.length) { console.error(`ERROR: ${a} needs a value\n${usage}`); process.exit(1); }
    flags[a] = argv[++i];
  } else if (BOOL_FLAGS.has(a)) {
    flags[a] = true;
  } else if (a.startsWith("-")) {
    console.error(`ERROR: unknown flag ${a}\n${usage}`);
    process.exit(1);
  } else positional.push(a);
}
if (positional.length !== 1) {
  console.error(usage);
  process.exit(1);
}
const deckPath = resolve(positional[0]);
const outDir = resolve(flags["--out"] || join(root, "output", basename(deckPath).replace(/\.(deck\.)?json$/, "")));
const scale = Number(flags["--scale"] || "2") || 2;
if (flags["--format"] && !["portrait", "square", "story"].includes(flags["--format"])) {
  console.error(`ERROR: unknown --format "${flags["--format"]}" (portrait|square|story)`);
  process.exit(1);
}

// ---- puppeteer (clear message if the one-time install hasn't run) ----
let puppeteer;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  console.error("ERROR: puppeteer is not installed. Run `npm install` in the skill directory once, then retry.");
  process.exit(1);
}

// ---- styles (inlined so each slide is self-contained) ----
const fontsCss = readFileSync(join(root, "assets", "styles", "fonts.css"), "utf8");
const themeCss = readFileSync(join(root, "assets", "styles", "theme.css"), "utf8");

// ---- brand assets (inlined) ----
const brand = {};
const markPath = join(root, "assets", "brand", "sectors-mark.svg");
if (existsSync(markPath))
  brand.mark = readFileSync(markPath, "utf8")
    .replace(/<\?xml[^>]*\?>/, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<svg([^>]*)>/, (m, a) => `<svg${a.replace(/\s(width|height)="[^"]*"/g, "")}>`) // size via CSS
    .trim();
const shotPath = join(root, "assets", "brand", "app-overview.png");
if (existsSync(shotPath)) brand.appOverview = "data:image/png;base64," + readFileSync(shotPath).toString("base64");

// ---- deck ----
const deck = JSON.parse(readFileSync(deckPath, "utf8"));
// --format overrides the deck's own format; written onto the deck (not just dims) because
// renderSlide() derives the stage size from deck.format itself.
if (flags["--format"]) deck.format = flags["--format"];
let slides = deck.slides || [];
if (deck.autoOutro !== false && !slides.some((s) => s.role === "outro")) slides = slides.concat([{ role: "outro" }]);
const dims = formatDims(deck.format);

// ---- --slides: "2,5" / ranges "2-4" / mixed "1,3-5,8" -> a 1-indexed Set of slide numbers to
// render. Filenames still use the FULL deck's numbering (slide-05.png stays slide-05.png even
// when only slide 5 is requested) since the loop below just skips the slides not asked for
// rather than renumbering what's left — a partial render's output has to slot into the same
// filenames a full render would produce, or "render slide 5 again after a tweak" would silently
// clobber the wrong file. Parsed and validated against the deck's ACTUAL slide count (autoOutro
// already applied above) before Puppeteer ever launches: a typo'd spec should fail in
// milliseconds, not after paying for a browser boot.
function parseSlidesSpec(spec, totalSlides) {
  const wanted = new Set();
  for (const token of spec.split(",").map((t) => t.trim())) {
    if (!token) return { error: `empty entry in "${spec}"` };
    const range = token.match(/^(\d+)-(\d+)$/);
    if (range) {
      const lo = Number(range[1]), hi = Number(range[2]);
      if (lo < 1 || lo > hi) return { error: `bad range "${token}" (must be low-high, both >= 1)` };
      if (hi > totalSlides) return { error: `"${token}" is out of range, this deck has ${totalSlides} slide(s) (outro included)` };
      for (let n = lo; n <= hi; n++) wanted.add(n);
      continue;
    }
    if (!/^\d+$/.test(token)) return { error: `"${token}" is not a slide number or a range like 2-4` };
    const n = Number(token);
    if (n < 1) return { error: `"${token}" is not a valid slide number (1-indexed)` };
    if (n > totalSlides) return { error: `slide ${n} is out of range, this deck has ${totalSlides} slide(s) (outro included)` };
    wanted.add(n);
  }
  return { slides: wanted };
}
let wantedSlides = null; // null means "render everything" (the default, unchanged path)
// `!== undefined`, not a truthy check: `--slides ""` DOES set flags["--slides"] (to an empty
// string), which is a real user error (an empty spec), not "the flag was never passed" — a
// truthy check would silently swallow it into "render everything" instead of erroring.
if (flags["--slides"] !== undefined) {
  const parsed = parseSlidesSpec(flags["--slides"], slides.length);
  if (parsed.error) {
    console.error(`ERROR: --slides "${flags["--slides"]}": ${parsed.error}\n${usage}`);
    process.exit(1);
  }
  wantedSlides = parsed.slides;
}

// ---- resolve ticker logos referenced anywhere in the deck -> base64 ----
// collectTickers (blocks.mjs) is the single source of truth for where a deck can name a
// ticker; keeping a local copy of that walk here is exactly how cover `tickers` and table
// rows got silently missed (monograms despite bundled logos).
// Logos live in one generated assets/logos.json ({ TICKER: base64 }), not 957 loose PNGs
// (scripts/build-logos.mjs regenerates it from assets/logos/*.png; that dir is the source
// of truth for "add a new ticker", logos.json is what render.mjs actually reads).
const logoMap = JSON.parse(readFileSync(join(root, "assets", "logos.json"), "utf8"));
const tickers = collectTickers(slides);
const logos = {};
for (const t of tickers) {
  if (logoMap[t]) logos[t] = "data:image/png;base64," + logoMap[t];
}

const ctxWarnings = [];

// ---- resolve cover art -> base64 ----
// A deck names its cover art by ticker or by path; the bytes get inlined here, at render
// time, so deck.json stays a readable document instead of carrying a megabyte of base64.
// Auto-resolution: a cover with no explicit `coverArt` picks up assets/coverart/<TICKER>.png
// if one exists, so preparing the art (scripts/coverart.mjs --ticker T) is the only step.
const coverArtDir = join(root, "assets", "coverart");
const coverArtFile = (t) => join(coverArtDir, `${String(t).toUpperCase().replace(/\.[A-Z]+$/, "")}.png`);
const inlineArt = (p) => "data:image/png;base64," + readFileSync(p).toString("base64");

for (const slide of slides) {
  if ((slide.role || "content") !== "cover") continue;
  const art = slide.coverArt;
  if (art && art.src) {
    if (/^data:/.test(art.src)) continue; // already inline
    const p = art.src.startsWith("/") ? art.src : join(root, art.src);
    if (existsSync(p)) slide.coverArt = { ...art, src: inlineArt(p) };
    else {
      ctxWarnings.push(`cover art "${art.src}" not found — cover renders without it`);
      slide.coverArt = null;
    }
    continue;
  }
  const first = (slide.tickers && slide.tickers[0]) || (slide.chip && slide.chip.ticker);
  const t = typeof first === "string" ? first : first && first.ticker;
  if (!t) continue;
  const p = coverArtFile(t);
  if (existsSync(p)) slide.coverArt = { ...(art || {}), src: inlineArt(p) };
}

const ctx = { logos, brand, warnings: ctxWarnings };

// ---- render ----
mkdirSync(outDir, { recursive: true });
const pageHtml = (slideHtml) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${fontsCss}${themeCss}</style></head><body>${slideHtml}</body></html>`;

const t0 = Date.now();
const failedSlides = [];
// One entry per slide when --report is set (report.json); built alongside the render loop
// rather than re-derived afterward, since the warnings slice below only exists at the moment
// each slide's chunk of ctx.warnings (a single deck-wide array) is still identifiable.
const reportEntries = [];
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--force-color-profile=srgb"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: dims.w, height: dims.h, deviceScaleFactor: scale });
  const pngs = [];
  for (let i = 0; i < slides.length; i++) {
    if (wantedSlides && !wantedSlides.has(i + 1)) continue; // --slides: skip, but keep this slide's numbering reserved for it alone
    const n = String(i + 1).padStart(2, "0");
    const role = slides[i].role || "content";
    // ctx.warnings is one flat array shared by the whole deck; a slide's own warnings are
    // whatever renderSlide/autofit/overflow push between this mark and the next, not a
    // separate per-slide list anywhere else in the pipeline.
    const warnBefore = ctx.warnings.length;
    // Per-slide isolation: a throw mid-loop used to abort the whole run with a stack that
    // pointed at charts.mjs internals and no slide number, AND lose every warning collected
    // so far (the dump runs after the loop). Render what renders, report what doesn't.
    let slideHtml;
    try {
      slideHtml = renderSlide(slides[i], deck, ctx);
    } catch (e) {
      failedSlides.push(`slide ${i + 1} (${role}): ${e.message}`);
      console.error(`  slide-${n}  FAILED: ${e.message}`);
      // Still worth a report row: "this slide has no measurements" is real information,
      // not a gap to leave the reader guessing about.
      if (flags["--report"])
        reportEntries.push({ slide: i + 1, role, warnings: [`FAILED to render: ${e.message}`], overflow: null, voidGap: null, collisions: [] });
      continue;
    }
    await page.setContent(pageHtml(slideHtml), { waitUntil: "load" });
    await page.evaluate(async () => { await document.fonts.ready; });
    const clipped = await page.evaluate(() => {
      // Auto-fit: .value/.price (built-in components) and .autofit (opt-in, free-HTML numbers)
      // are forced single-line (nowrap) in CSS. Shrink font-size in small steps until the
      // rendered text fits its box, so one mechanism covers every numeric display instead of
      // a hand-tuned size tier per component.
      const MIN_SCALE = 0.55, STEP = 0.94;
      const stillClipped = [];
      document.querySelectorAll(".value, .price, .autofit").forEach((el) => {
        // Inline boxes report clientWidth 0, which made autofit a silent no-op on a
        // <span class="num autofit">; inline-block measures the same text identically
        // and changes nothing visually here.
        if (getComputedStyle(el).display === "inline") el.style.display = "inline-block";
        const original = parseFloat(getComputedStyle(el).fontSize);
        let size = original;
        while (el.scrollWidth > el.clientWidth + 1 && size > original * MIN_SCALE) {
          size *= STEP;
          el.style.fontSize = size + "px";
        }
        // Past the shrink floor, the CSS overflow:hidden silently AMPUTATES the string
        // ("Rp 1,234,567,890,123.45T" shipped as "Rp 1,234,567,890,"): a WRONG number on a
        // finance slide, not a style nit. Surface it; never let it ride.
        if (el.scrollWidth > el.clientWidth + 1) stillClipped.push((el.textContent || "").trim().slice(0, 48));
      });
      // Sibling stat cards share one final size: autofit shrinking only the longest value
      // left that card's number visibly smaller than its neighbors' (47px next to 64px in
      // one keyfacts row), which reads as accidental, not adaptive. The group inherits its
      // most-constrained member's size. Applies to keyfacts grids and the cover stat pair.
      document.querySelectorAll(".b-keyfacts, .cover-stat").forEach((group) => {
        const vals = [...group.querySelectorAll(".value, .v")];
        if (vals.length < 2) return;
        const min = Math.min(...vals.map((el) => parseFloat(getComputedStyle(el).fontSize)));
        vals.forEach((el) => { el.style.fontSize = min + "px"; });
      });
      return stillClipped;
    });
    clipped.forEach((t) =>
      ctx.warnings.push(
        `slide ${i + 1}: value "${t}" still overflows at the autofit floor; the PNG shows a TRUNCATED number. Shorten or reformat the value (e.g. "Rp 1,234T").`
      )
    );
    // General overflow: .stage has overflow:hidden, so ANY element that lays out past the
    // canvas is silently clipped in the PNG with no signal anywhere (CLAUDE.md's "Overflow is
    // clipped, and layout isn't linted" gap). The autofit check above only ever caught the
    // ONE specific case of a shrunk-to-the-floor .value/.price/.autofit number. Scoped to the
    // slide's real (non-decorative) content roots, never `.layer`/`.outro-devices` (deliberately
    // full-bleed background/illustration), and skips inside an <svg> (chart geometry is
    // hand-tuned to its own viewBox and gated separately, not a generic layout concern).
    //
    // TWO measurements, not one, because CSS overflow has two independent failure shapes:
    // (a) getBoundingClientRect vs the stage box catches an element whose OWN layout box is
    //     positioned or sized past the canvas (a block that grew too tall, sits offscreen).
    // (b) scrollWidth vs clientWidth (the SAME technique the autofit check above already uses)
    //     catches content that overflows its OWN box without that box itself growing: a
    //     `white-space:nowrap` cell (e.g. `.mx-val`, deliberately given no overflow:hidden so a
    //     long table value stays honestly visible rather than silently ellipsized) paints past
    //     its border under the default overflow:visible, but the element's own
    //     getBoundingClientRect never changes, so (a) alone misses it entirely (verified: a
    //     synthetic long table value produced zero (a)-only warnings even though the PNG
    //     visibly showed the text running off the card).
    //
    // scrollHeight vs clientHeight (the same idea, vertical) looked like the obvious third
    // check but was DROPPED after the false-positive gate below caught it firing on every
    // `.title`/`.autofit`/`.num.autofit` element on BOTH real decks: tight line-height
    // (`line-height:0.92` on the H1 hero number, `1.08` on `.title`) makes a font's natural
    // single-line render height exceed its line-height box by design, a normal typography
    // technique already shipping throughout the archetype library, not lost content. scrollWidth
    // showed zero false positives on the same elements (nowrap text wraps or doesn't; there's
    // no equivalent "tight leading" artifact for width), so only that half of the pair earns
    // its keep.
    //
    // Root resolution used to be a single `document.querySelector(".content")`, which silently
    // returned null (and no-opped the whole check) on cover AND outro slides per the old
    // CLAUDE.md note. Verified directly (a synthetic long-word cover headline DID warn under
    // that old code, an equally long outro headline did NOT): renderCover() has wrapped its
    // output in a real `.content` div all along, so only the outro half of that note was ever
    // true. Outro renders no such wrapper at all — its real content is `.outro-text` (headline/
    // support/pill) and `.footer`, both siblings of the decorative layers and the hand-scaled
    // `.outro-devices` illustration — so falling back to those two when `.content` is absent is
    // what actually closes the outro gap.
    const measurement = await page.evaluate(() => {
      const stage = document.querySelector(".stage");
      const contentRoot = document.querySelector(".content");
      const roots = contentRoot ? [contentRoot] : [...document.querySelectorAll(".outro-text, .footer")];
      if (!stage || !roots.length) return null;
      const TOL = 2;
      const stageBox = stage.getBoundingClientRect();
      const offenders = new Set();
      const overflowDetail = [];
      const leaves = [];
      let lowestBottom = 0;
      for (const root of roots) {
        root.querySelectorAll("*").forEach((el) => {
          if (el.closest("svg") && el.tagName.toLowerCase() !== "svg") return; // chart internals, gated by charts.mjs's own geometry
          const box = el.getBoundingClientRect();
          if (box.width === 0 && box.height === 0) return; // not rendered (display:none, empty)

          const beyondStage =
            box.right > stageBox.right + TOL ||
            box.bottom > stageBox.bottom + TOL ||
            box.left < stageBox.left - TOL ||
            box.top < stageBox.top - TOL;
          const overflowsOwnWidth = el.scrollWidth > el.clientWidth + TOL;
          if (beyondStage || overflowsOwnWidth) {
            const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : "";
            const tag = el.tagName.toLowerCase() + cls;
            offenders.add(tag);
            overflowDetail.push({ tag, overRightPx: Math.round(box.right - stageBox.right), overBottomPx: Math.round(box.bottom - stageBox.bottom) });
          }

          // LEAF elements only (no element children; an <svg> counts as one leaf despite its
          // internal markup, same reasoning as the overflow skip above) that actually carry text
          // or an image, so a wrapper div (`.glass`, `.chip`, `.b-keyfacts`) never "collides"
          // with its own child on a technicality — only the rendered text/logo/chart units a
          // reader would actually see ever reach this list. This is ALSO where lowestBottom
          // (voidGap, below) draws its number from, and it must be leaf-only for the same
          // reason the root-level fix above was needed: a content slide's `.stack` div carries
          // `flex:1;min-height:0` (renderContent, blocks.mjs) so it always stretches to fill
          // whatever vertical room is left in `.content`, regardless of how little it actually
          // holds. Tracking every element's box (as a first pass here did) picked up `.stack`'s
          // own stretched edge as "the lowest content" and reported 0px void on a slide that was
          // visually 80%+ empty (a single caption block, nothing else) — leaf-only tracking
          // reports the caption's own true bottom edge instead.
          const isSvg = el.tagName.toLowerCase() === "svg";
          if (el.childElementCount > 0 && !isSvg) return;
          const text = (el.textContent || "").trim();
          const isImg = el.tagName === "IMG";
          if (!text && !isImg && !isSvg) return;
          if (box.bottom > lowestBottom) lowestBottom = box.bottom;
          const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).join(".") : "";
          leaves.push({ tag: el.tagName.toLowerCase() + cls, box, el, isSvg, isImg });
        });
      }

      // Void gap is measured against the padded INNER edge of whichever root actually owns the
      // house bottom margin (`.content`/`.outro-text`, both `position:absolute; inset:0` with
      // their own padding-bottom), not their outer box: inset:0 makes a root's own
      // getBoundingClientRect().bottom equal the raw stage bottom, so comparing against that
      // directly would report the deliberate ~52-76px design margin as "void" on every single
      // slide (caught: it read a flat 76px on every content/cover slide in both real decks,
      // exactly the padding, zero signal). `.footer` (the outro's other root, only ever
      // absolutely positioned, never a padded flex column) is excluded from this reference calc
      // for the same reason, though it still counts toward lowestBottom below like any other leaf.
      const paddedRoots = roots.filter((r) => parseFloat(getComputedStyle(r).paddingBottom || "0") > 0);
      const referenceRoots = paddedRoots.length ? paddedRoots : roots;
      const innerBottom = Math.max(
        ...referenceRoots.map((r) => r.getBoundingClientRect().bottom - parseFloat(getComputedStyle(r).paddingBottom || "0"))
      );
      const voidGapPx = Math.max(0, Math.round(innerBottom - lowestBottom));

      // Two DELIBERATE overlap patterns exist in the house design system, and both false-fired
      // on the lookbook (the 15-archetype/14-chart-kind ground truth) before these two narrow
      // exclusions: the cover's `.spark-callout` glass pill is `position:absolute` BY DESIGN
      // (theme.css) to float over the backdrop spark/duel chart, a glassmorphism overlay, not a
      // layout accident; and coverChips()'s 7+-ticker "stack" (blocks.mjs) gives every logo past
      // the first a negative `margin-left`, a Slack/Discord-style overlapping-avatar treatment
      // (only the FIRST logo keeps margin-left:0, so checking "does THIS image have a negative
      // margin" misses every pair that includes it — checking "do these two share the same
      // `.chip-row`" catches the whole stack instead, and stays precise because every OTHER use
      // of `.chip-row` lays its chips out with a positive gap, never overlapping). Both
      // exclusions key off the exact mechanism that makes the overlap deliberate, not a blanket
      // "ignore all svg/img", so an unrelated logo genuinely colliding with something (two
      // different rows' logos overlapping from a real layout bug, say) still gets caught.
      const inSparkCallout = (el) => Boolean(el.closest(".spark-callout"));
      const sameChipRow = (elA, elB) => {
        const rowA = elA.closest(".chip-row");
        return rowA !== null && rowA === elB.closest(".chip-row");
      };

      // Pairwise bounding-box intersection of the leaves above. Tolerance on BOTH axes (not
      // area) because two adjacent glass cards sharing a hairline border, or a descender
      // brushing the caption below it, register a sub-pixel overlap on a real, working slide;
      // COLLISION_TOL is tuned against bbri-yield-vs-bonds.deck.json and the 15-archetype/
      // 14-chart-kind lookbook until neither produced a false positive (see CLAUDE.md).
      const COLLISION_TOL = 6;
      const collisions = [];
      for (let a = 0; a < leaves.length; a++) {
        for (let b = a + 1; b < leaves.length; b++) {
          const la = leaves[a], lb = leaves[b];
          if ((la.isSvg && inSparkCallout(lb.el)) || (lb.isSvg && inSparkCallout(la.el))) continue;
          if (la.isImg && lb.isImg && sameChipRow(la.el, lb.el)) continue;
          const overlapX = Math.min(la.box.right, lb.box.right) - Math.max(la.box.left, lb.box.left);
          const overlapY = Math.min(la.box.bottom, lb.box.bottom) - Math.max(la.box.top, lb.box.top);
          if (overlapX > COLLISION_TOL && overlapY > COLLISION_TOL) {
            collisions.push({ a: la.tag, b: lb.tag, overlapPx: Math.round(Math.min(overlapX, overlapY)) });
          }
        }
      }

      return {
        offenders: [...offenders],
        overflow: { offenderCount: offenders.size, stageWidth: Math.round(stageBox.width), stageHeight: Math.round(stageBox.height), detail: overflowDetail },
        voidGap: { px: voidGapPx, pctOfStage: Math.round((voidGapPx / stageBox.height) * 1000) / 10 },
        collisions,
      };
    });
    (measurement ? measurement.offenders : []).forEach((tag) =>
      ctx.warnings.push(
        `slide ${i + 1}: <${tag}> extends beyond the canvas (the PNG clips it silently). Shorten the content or reformat the value that's causing it.`
      )
    );
    const pngPath = join(outDir, `slide-${n}.png`);
    await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: dims.w, height: dims.h } });
    pngs.push(pngPath);
    console.log(`  slide-${n}.png  (${role})`);
    if (flags["--report"])
      reportEntries.push({
        slide: i + 1,
        role,
        // The slice, not the running total: ctx.warnings is one flat array for the whole
        // deck, so "this slide's warnings" only exists as the delta since warnBefore.
        warnings: ctx.warnings.slice(warnBefore),
        overflow: measurement ? measurement.overflow : null,
        voidGap: measurement ? measurement.voidGap : null,
        collisions: measurement ? measurement.collisions : [],
      });
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone: ${pngs.length} slides -> ${outDir}  (${secs}s, ${dims.w * scale}x${dims.h * scale}px @${scale}x)`);
} finally {
  await browser.close();
}

if (ctx.warnings.length) {
  console.log("\nWarnings:");
  for (const w of [...new Set(ctx.warnings)]) console.log("  - " + w);
}
const missing = [...tickers].filter((t) => !logos[t]);
if (missing.length) console.log(`\nNote: no bundled logo for ${missing.join(", ")} (used a letter monogram). Add a PNG to assets/logos/ to fix.`);
if (failedSlides.length) {
  console.error(`\nERROR: ${failedSlides.length} slide(s) failed to render:\n  - ${failedSlides.join("\n  - ")}`);
  process.exitCode = 1;
}
if (flags["--report"]) {
  // partial:true iff --slides narrowed this run; `slides` is already just the rendered
  // subset (the loop above skipped everything else), so a consumer doesn't need a second
  // "which slides did I ask for" field, only the flag saying not to expect the full deck.
  const reportPath = join(outDir, "report.json");
  writeFileSync(reportPath, JSON.stringify({ partial: Boolean(wantedSlides), slides: reportEntries }, null, 2));
  console.log(`\nReport: ${reportPath}`);
}
