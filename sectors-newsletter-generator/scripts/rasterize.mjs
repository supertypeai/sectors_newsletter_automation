#!/usr/bin/env node
// SVG -> PNG for email delivery. charts.mjs emits SVG, which is the right format
// for the .md draft and for anything rendered in a browser, but it cannot be used
// in an email: Gmail and Outlook strip SVG entirely, and both also block `data:`
// URIs in `<img src>`, so neither an inline SVG nor an inlined data-URI survives.
// A hosted PNG is the only form that renders reliably across clients. Mailroom's
// own upload surface accepts PNG and nothing else, for exactly this reason.
//
// Puppeteer rather than a lighter rasterizer (resvg, sharp) so the charts' own
// fonts are used rather than substituted: charts.mjs sets JetBrains Mono on every
// numeric label, and a fallback metric font shifts the label geometry the chart
// was laid out around. assets/styles/fonts.css carries both faces base64-embedded,
// so rendering needs no network and no system font install. Same engine the
// sibling sectors-carousel skill renders slides with.
//
// Usage:
//   node rasterize.mjs <file.svg> [more.svg ...] [--scale 2] [--bg <css-color>]
//
// Writes <file>.png beside each input. Exits non-zero if any file fails.
//   --scale  device pixel ratio, default 2 (retina-sharp in email clients)
//   --bg     backdrop, default #fcfcfb, the light chart surface newsletter-format.md
//            tells drafts to wrap every chart in. A correctly wrapped SVG carries its
//            own opaque rect, so this only shows on an unwrapped one, where matching
//            that value keeps it identical to the wrapped ones. `transparent` gives an
//            alpha PNG, but prefer an opaque backdrop: some clients composite
//            transparency against a dark background and invert the chart's contrast.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const files = [];
let scale = 2;
let bg = "#fcfcfb";

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--scale") scale = Number(args[++i]);
  else if (args[i] === "--bg") bg = args[++i];
  else files.push(args[i]);
}

if (!files.length) {
  console.error("Usage: rasterize.mjs <file.svg> [...] [--scale 2] [--bg <css-color>]");
  process.exit(1);
}
if (!Number.isFinite(scale) || scale <= 0) {
  console.error(`ERROR: --scale must be a positive number, got "${scale}"`);
  process.exit(1);
}

let puppeteer;
try {
  ({ default: puppeteer } = await import("puppeteer"));
} catch {
  console.error("ERROR: puppeteer is not installed. Run `npm install` in this skill's folder.");
  process.exit(1);
}

// Embedded @font-face rules, so the render never depends on network or system fonts.
const fontsPath = join(here, "..", "assets", "styles", "fonts.css");
let fontCss = "";
if (existsSync(fontsPath)) {
  fontCss = readFileSync(fontsPath, "utf8");
} else {
  console.warn(`WARNING: ${fontsPath} missing; labels will fall back to a system font and may shift.`);
}

// Ask the browser for the SVG's own size rather than parsing the markup: it already
// implements the sizing rules (unit suffixes, viewBox-only sizing, percentage widths)
// that a regex over the source would have to reimplement and would get wrong.
// viewBox wins where present, since it is the authoritative user-space extent; a
// percentage width would otherwise measure the viewport instead of the chart.
const measureSvg = () => {
  const el = document.querySelector("svg");
  if (!el) return null;
  const vb = el.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) {
    return { w: Math.ceil(vb.width), h: Math.ceil(vb.height) };
  }
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { w: Math.ceil(r.width), h: Math.ceil(r.height) } : null;
};

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--force-color-profile=srgb"],
});

let failed = 0;
try {
  const page = await browser.newPage();

  for (const file of files) {
    const inPath = resolve(file);
    if (!existsSync(inPath)) {
      console.error(`ERROR: no such file: ${inPath}`);
      failed++;
      continue;
    }

    const svg = readFileSync(inPath, "utf8");

    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>
         ${fontCss}
         html,body{margin:0;padding:0;background:${bg};}
         svg{display:block;}
       </style>${svg}`,
      { waitUntil: "load" }
    );
    // Block until the embedded faces are actually parsed and ready, otherwise the
    // screenshot can race the font swap and capture fallback metrics.
    await page.evaluate(() => document.fonts.ready);

    const size = await page.evaluate(measureSvg);
    if (!size) {
      console.error(`ERROR: no sizeable <svg> rendered from ${inPath}`);
      failed++;
      continue;
    }

    // Viewport drives deviceScaleFactor, so it has to be set before the capture, and
    // matching the chart's own size keeps the element fully on-screen at any scale.
    await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: scale });

    const el = await page.$("svg");
    if (!el) {
      console.error(`ERROR: no <svg> element rendered from ${inPath}`);
      failed++;
      continue;
    }

    const outPath = inPath.replace(/\.svg$/i, "") + ".png";
    await el.screenshot({
      path: outPath,
      omitBackground: bg === "transparent",
    });

    const bytes = readFileSync(outPath).length;
    const warn = bytes > 1024 * 1024 ? "  ** over mailroom's 1MB cap, lower --scale **" : "";
    console.log(`${outPath}  ${size.w}x${size.h} @${scale}x  ${(bytes / 1024).toFixed(1)}KB${warn}`);
  }
} finally {
  await browser.close();
}

process.exit(failed ? 1 : 0);
