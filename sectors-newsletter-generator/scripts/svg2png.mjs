// Rasterise chart SVGs to PNG for the email. Mail clients strip or block inline and linked SVG,
// so newsletter.html always references the PNG; the SVG stays beside it as the source.
// Renders at 2x the SVG's own width/height, so a 936px canvas becomes a 1872px PNG that the
// HTML shows at 536 CSS px (width="536", height scaled to the canvas ratio). Reuses the carousel skill's puppeteer install, like html2pdf.mjs.
// usage: node svg2png.mjs <in.svg> [out.png]   (out defaults to in with a .png extension)
import path from "path";
import fs from "fs";
import { createRequire } from "module";
import os from "os";
const require = createRequire(path.join(os.homedir(), ".claude/skills/sectors-carousel/package.json"));
const puppeteer = require("puppeteer");
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
