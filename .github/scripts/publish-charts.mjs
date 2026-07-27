#!/usr/bin/env node
// Turn an issue's chart SVGs into hosted PNGs and rewrite the HTML to point at them.
//
// Usage: node publish-charts.mjs <issue-folder>
//
// Why this exists: charts.mjs emits SVG, which cannot be used in an email. Gmail and
// Outlook strip SVG outright, and both also block `data:` URIs in `<img src>`, so
// neither an inline <svg> nor a base64 data URI survives the trip. The only form that
// renders reliably is a PNG at a public https URL. Mailroom's upload surface accepts
// PNG and nothing else for exactly that reason.
//
// Runs in the DRAFT workflow, not the send workflow, so the reviewed PR contains the
// final hosted URL and a reviewer sees precisely the image subscribers will get.
//
// Steps, per chart-*.svg in the folder:
//   1. rasterize to PNG via the skill's scripts/rasterize.mjs (Puppeteer, real fonts)
//   2. POST it to mailroom POST /v1/uploads, which returns a permanent public URL
//   3. rewrite newsletter.html so any reference to that chart points at the URL
//
// Idempotent on the HTML: a second run re-uploads and re-points, it doesn't double-wrap.

import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { die, postToMailroom } from "./mailroom.mjs";

const folder = process.argv[2];
if (!folder) die("no issue folder given. Usage: publish-charts.mjs <issue-folder>");

const {
  MAILROOM_API_KEY,
  MAILROOM_UPLOAD_URL = "https://api.mailroom.supertype.ai/v1/uploads",
  SKILL_DIR = "sectors-newsletter-generator",
  // Env-facing name for rasterize.mjs's --scale, since a workflow step configures
  // through the environment rather than argv. Deliberately has no default here:
  // rasterize.mjs owns that value, and repeating it would let the two drift.
  CHART_SCALE,
  DRY_RUN,
} = process.env;

if (!MAILROOM_API_KEY && DRY_RUN !== "1") die("MAILROOM_API_KEY is not set");

const dir = resolve(folder);
if (!existsSync(dir)) die(`no such folder: ${dir}`);

const htmlPath = join(dir, "newsletter.html");
if (!existsSync(htmlPath)) die(`missing ${htmlPath}`);

const svgs = readdirSync(dir).filter((f) => /^chart-.*\.svg$/i.test(f));
if (!svgs.length) {
  // Legitimate: weekly-insights-v2 can satisfy its visual requirement with social
  // cards instead of a generated chart. Nothing to do, and not an error.
  console.log("No chart-*.svg in this issue, nothing to publish.");
  process.exit(0);
}

console.log(`Found ${svgs.length} chart(s): ${svgs.join(", ")}`);

// 1. Rasterize them all in one Puppeteer launch.
const rasterize = join(SKILL_DIR, "scripts", "rasterize.mjs");
if (!existsSync(rasterize)) die(`missing ${rasterize}. Is SKILL_DIR correct?`);
try {
  execFileSync(
    "node",
    [rasterize, ...svgs.map((f) => join(dir, f)), ...(CHART_SCALE ? ["--scale", CHART_SCALE] : [])],
    { stdio: "inherit" }
  );
} catch {
  die("rasterize.mjs failed, see output above");
}

// 2 + 3. Upload each PNG, then repoint the HTML at the returned URL.
let html = readFileSync(htmlPath, "utf8");
let changed = 0;

for (const svg of svgs) {
  const png = svg.replace(/\.svg$/i, ".png");
  const pngPath = join(dir, png);
  if (!existsSync(pngPath)) die(`expected ${pngPath} after rasterizing, not found`);

  const bytes = readFileSync(pngPath);
  let url;

  if (DRY_RUN === "1") {
    url = `https://storage.googleapis.com/EXAMPLE-BUCKET/dry-run/${png}`;
    console.log(`DRY_RUN: would upload ${png} (${(bytes.length / 1024).toFixed(1)}KB)`);
  } else {
    const form = new FormData();
    form.append("file", new Blob([bytes], { type: "image/png" }), png);

    ({ url } = await postToMailroom(MAILROOM_UPLOAD_URL, {
      apiKey: MAILROOM_API_KEY,
      body: form,
      what: `upload of ${png}`,
    }));
    if (!url) die(`upload of ${png} returned no url`);
    console.log(`uploaded ${png} (${(bytes.length / 1024).toFixed(1)}KB) -> ${url}`);
  }

  // Prefer repointing a reference that actually names this chart file.
  const before = html;
  const stem = basename(svg, ".svg").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  html = html.replace(
    new RegExp(`(<img[^>]*\\bsrc=")[^"]*${stem}\\.(?:svg|png)(")`, "gi"),
    `$1${url}$2`
  );

  if (html === before) {
    // No named reference. A draft may instead have inlined the chart as a data URI.
    // Only rewrite that when this issue has exactly one chart: with several, there is
    // nothing tying a given data URI to a given file, and guessing would silently put
    // the wrong image under the wrong heading.
    if (svgs.length === 1) {
      html = html.replace(
        /(<img[^>]*\bsrc=")data:image\/svg\+xml;base64,[A-Za-z0-9+/=]+(")/i,
        `$1${url}$2`
      );
    } else {
      console.warn(
        `WARNING: no <img> in ${htmlPath} names ${svg}, and this issue has ${svgs.length} charts, ` +
          `so an inlined data URI can't be matched to it safely. Reference charts by filename.`
      );
    }
  }

  if (html !== before) changed++;
  else console.warn(`WARNING: ${htmlPath} had no reference to ${svg} to rewrite`);
}

if (html.includes("data:image/svg+xml")) {
  die(`${htmlPath} still contains an inline SVG data URI after rewriting; it would not render in Gmail or Outlook`);
}

writeFileSync(htmlPath, html);
console.log(`Rewrote ${changed}/${svgs.length} chart reference(s) in ${htmlPath}`);
