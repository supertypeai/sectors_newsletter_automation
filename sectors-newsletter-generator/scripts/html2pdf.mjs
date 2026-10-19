// Render a newsletter.html to a paginated PDF. Reuses the carousel skill's puppeteer install.
// usage: node html2pdf.mjs <in.html> <out.pdf>
import path from "path";
import { createRequire } from "module";
import os from "os";
const require = createRequire(path.join(os.homedir(), ".claude/skills/sectors-carousel/package.json"));
const puppeteer = require("puppeteer");
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
