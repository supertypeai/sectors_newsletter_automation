// Render a newsletter.html to a paginated PDF. Uses this skill's puppeteer install, or the carousel skill's.
// usage: node html2pdf.mjs <in.html> <out.pdf>
import path from "path";
import { createRequire } from "module";
import os from "os";
// puppeteer: this skill's own `npm install` first, else an installed st-sectors-carousel.
let puppeteer;
try { puppeteer = (await import("puppeteer")).default; } catch {
  puppeteer = createRequire(path.join(os.homedir(), ".claude/skills/st-sectors-carousel/package.json"))("puppeteer");
}
const [src, out] = process.argv.slice(2);
const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.goto("file://" + path.resolve(src), { waitUntil: "networkidle0" });
await page.evaluateHandle("document.fonts.ready");
await page.pdf({
  path: path.resolve(out),
  width: "8.5in",
  height: "11in",
  printBackground: true,
  margin: { top: "0.6in", bottom: "0.6in", left: "0.6in", right: "0.6in" },
});
await browser.close();
console.log("wrote", out);
