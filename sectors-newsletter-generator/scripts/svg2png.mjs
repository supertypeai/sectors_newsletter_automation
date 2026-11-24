// Rasterise chart SVGs to PNG, only when the user asks for PNG in a run. Issues reference the SVG by default.
// Renders at 2x the SVG's own width/height, so a 936px canvas becomes a 1872px PNG that the
// HTML shows at 536 CSS px (width="536", height scaled to the canvas ratio).
// usage: node svg2png.mjs <in.svg> [out.png]   (out defaults to in with a .png extension)
// puppeteer: run `npm install puppeteer` once in the skill folder. If this skill has none, an installed
// st-sectors-carousel (or st-sectors-image) install is used instead.
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import os from "os";
import { fileURLToPath } from "url";

async function loadPuppeteer() {
  try { return (await import("puppeteer")).default; } catch {}
  const skills = path.join(os.homedir(), ".claude/skills");
  const here = path.dirname(fileURLToPath(import.meta.url));
  for (const pkg of [
    path.join(here, "..", "..", "st-sectors-carousel", "package.json"),
    path.join(skills, "st-sectors-carousel", "package.json"),
    path.join(skills, "st-sectors-image", "package.json"),
  ]) {
    if (!fs.existsSync(path.join(path.dirname(pkg), "node_modules", "puppeteer"))) continue;
    try { const mod = createRequire(pkg)("puppeteer"); return mod.default || mod; } catch {}
  }
  console.error("ERROR: puppeteer is not installed.\nRun once:  cd " + path.join(here, "..") + " && npm install puppeteer\n(or install st-sectors-carousel, whose puppeteer this script reuses)");
  process.exit(1);
}
const puppeteer = await loadPuppeteer();
const src = path.resolve(process.argv[2]);
const out = path.resolve(process.argv[3] || src.replace(/\.svg$/i, ".png"));
const svg = fs.readFileSync(src, "utf8");
const m = svg.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/);
if (!m) throw new Error("svg needs numeric width and height attributes");
const [w, h] = [Math.ceil(+m[1]), Math.ceil(+m[2])];
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 2 });
await page.setContent(`<body style="margin:0;background:#fcfcfb">${svg}</body>`);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: w, height: h } });
await browser.close();
console.log("wrote", out, `${w * 2}x${h * 2}`, `(ratio for the img tag: width 536, height ${Math.round((536 * h) / w)})`);
