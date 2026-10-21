// Rasterise chart SVGs to PNG for the email. Mail clients strip or block inline and linked SVG,
// so newsletter.html always references the PNG; the SVG stays beside it as the source.
// Renders at 2x the SVG's own size, so a 936px canvas becomes a 1872px PNG that the HTML shows
// at 536 CSS px (width="536", height scaled to the canvas ratio).
//
// Runs both locally and in CI (the draft workflows' publish-charts step calls it). Puppeteer is
// taken from this skill's own `npm install` first; the carousel skill's install is only a local
// fallback. The charts' embedded fonts (assets/styles/fonts.css) are always loaded, so labels
// render the same on a bare runner as on a laptop.
//
// usage: node svg2png.mjs <in.svg> [out.png]
//        node svg2png.mjs <a.svg> [b.svg ...] [--scale 2] [--bg <css-color>]
//   out.png defaults to the input with a .png extension; it is only honoured for a single SVG.
//   --scale  device pixel ratio, default 2
//   --bg     backdrop, default #fcfcfb (the chart surface newsletter-format.md wraps charts in);
//            `transparent` gives an alpha PNG, but prefer an opaque backdrop: some clients
//            composite transparency against a dark background and invert the chart's contrast.
// Exits non-zero if any file fails.
import path from "path";
import fs from "fs";
import os from "os";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const positional = [];
let scale = 2;
let bg = "#fcfcfb";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--scale") scale = Number(args[++i]);
  else if (args[i] === "--bg") bg = args[++i];
  else positional.push(args[i]);
}
if (!positional.length) {
  console.error("Usage: svg2png.mjs <in.svg> [out.png]  |  svg2png.mjs <a.svg> [b.svg ...] [--scale 2] [--bg <css-color>]");
  process.exit(1);
}
if (!Number.isFinite(scale) || scale <= 0) {
  console.error(`ERROR: --scale must be a positive number, got "${scale}"`);
  process.exit(1);
}

// `svg2png.mjs in.svg out.png` keeps working; anything else is a list of SVGs.
const jobs =
  positional.length === 2 && /\.png$/i.test(positional[1])
    ? [{ src: path.resolve(positional[0]), out: path.resolve(positional[1]) }]
    : positional.map((f) => {
        const src = path.resolve(f);
        return { src, out: src.replace(/\.svg$/i, "") + ".png" };
      });

let puppeteer;
try {
  ({ default: puppeteer } = await import("puppeteer"));
} catch {
  try {
    puppeteer = createRequire(path.join(os.homedir(), ".claude/skills/sectors-carousel/package.json"))("puppeteer");
  } catch {
    console.error("ERROR: puppeteer is not installed. Run `npm install` in the sectors-newsletter-generator folder.");
    process.exit(1);
  }
}

const fontsPath = path.join(here, "..", "assets", "styles", "fonts.css");
let fontCss = "";
if (fs.existsSync(fontsPath)) fontCss = fs.readFileSync(fontsPath, "utf8");
else console.warn(`WARNING: ${fontsPath} missing; labels will fall back to a system font and may shift.`);

// Ask the browser for the SVG's own size rather than parsing the markup: it already implements the
// sizing rules (unit suffixes, viewBox-only sizing, percentage widths). viewBox wins where present,
// since it is the authoritative user-space extent.
const measureSvg = () => {
  const el = document.querySelector("svg");
  if (!el) return null;
  const vb = el.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) return { w: Math.ceil(vb.width), h: Math.ceil(vb.height) };
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? { w: Math.ceil(r.width), h: Math.ceil(r.height) } : null;
};

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox", "--force-color-profile=srgb"] });
let failed = 0;
try {
  const page = await browser.newPage();
  for (const { src, out } of jobs) {
    if (!fs.existsSync(src)) {
      console.error(`ERROR: no such file: ${src}`);
      failed++;
      continue;
    }
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>${fontCss}
         html,body{margin:0;padding:0;background:${bg};}
         svg{display:block;}
       </style>${fs.readFileSync(src, "utf8")}`,
      { waitUntil: "load" }
    );
    // Wait for the embedded faces to load, or the screenshot can capture fallback metrics.
    await page.evaluate(() => document.fonts.ready);
    const size = await page.evaluate(measureSvg);
    const el = size && (await page.$("svg"));
    if (!el) {
      console.error(`ERROR: no sizeable <svg> rendered from ${src}`);
      failed++;
      continue;
    }
    await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: scale });
    await el.screenshot({ path: out, omitBackground: bg === "transparent" });
    const kb = fs.statSync(out).size / 1024;
    const warn = kb > 1024 ? "  ** over mailroom's 1MB cap, lower --scale **" : "";
    console.log("wrote", out, `${size.w * scale}x${size.h * scale}`, `${kb.toFixed(1)}KB`, `(ratio for the img tag: width 536, height ${Math.round((536 * size.h) / size.w)})${warn}`);
  }
} finally {
  await browser.close();
}
process.exit(failed ? 1 : 0);
