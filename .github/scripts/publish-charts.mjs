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

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, copyFileSync, rmSync } from "node:fs";
import { join, basename, resolve } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { die, postToMailroom } from "./mailroom.mjs";

const folder = process.argv[2];
if (!folder) die("no issue folder given. Usage: publish-charts.mjs <issue-folder>");

const {
  MAILROOM_API_KEY,
  MAILROOM_UPLOAD_URL = "https://mailroom.supertype.ai/api/v1/uploads",
  SKILL_DIR = "sectors-newsletter-generator",
  // Env-facing name for rasterize.mjs's --scale, since a workflow step configures
  // through the environment rather than argv. Deliberately has no default here:
  // rasterize.mjs owns that value, and repeating it would let the two drift.
  CHART_SCALE,
  // Optional: compress each PNG through Storing before upload. Unset = skip.
  STORING_API_KEY,
  STORING_PROFILE = "balanced",
  STORING_MAX_SIZE,
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

/** Per-chart ceiling on the Storing round-trip. See the call site for why. */
const COMPRESS_TIMEOUT_MS = 60_000;

/** PNG magic bytes, so we never hand mailroom something that isn't a PNG. */
const isPng = (buf) =>
  buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

/**
 * Shrink a chart PNG through the Storing CLI, in place, and return the new byte
 * count. Charts compress unusually well: flat fills, few distinct colours, and
 * large uniform areas are exactly what PNG quantisation is good at.
 *
 * Three deliberate choices:
 *
 * `--format png` is mandatory, never `auto`. Auto picks AVIF, which Gmail and
 * Outlook do not render, so an auto-formatted chart would vanish for most of the
 * list, the same failure the SVG-to-PNG step exists to prevent. Mailroom also
 * accepts PNG only and would reject anything else with a 422. PNG over JPEG too:
 * these are flat-colour charts with fine text and hairline gridlines, which JPEG
 * rings around.
 *
 * It writes to a scratch directory and only replaces the original on success,
 * because the CLI's output naming isn't something this script should assume.
 *
 * Failure is never fatal. Compression is an optimisation; an uncompressed chart
 * is completely correct, just larger. A Storing outage must not stop the issue.
 *
 * Note the CLI **exits 0 even when authentication fails** (verified 2026-07-27: a
 * bad key prints `Warning: failed to compress … Authentication required` and still
 * returns 0). So success is judged by what landed in the output directory, never by
 * the exit code, and the run prints a compressed-count summary at the end so a key
 * that silently isn't working shows up in the log rather than passing unnoticed.
 */
function compressInPlace(pngPath) {
  const before = readFileSync(pngPath).length;
  const outDir = mkdtempSync(join(tmpdir(), "storing-"));
  try {
    const args = [
      "compress", pngPath,
      "--format", "png",
      "--profile", STORING_PROFILE,
      "--output", outDir,
      "--json",
      ...(STORING_MAX_SIZE ? ["--max-size", STORING_MAX_SIZE] : []),
    ];
    execFileSync("storing", args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, STORING_API_KEY },
      // Bound the call. Compression is a cloud round-trip, and without a timeout a
      // stalled request blocks the whole job until the workflow's own 45-minute
      // limit, turning an optional optimisation into a hung newsletter. On timeout
      // execFileSync throws and the catch below keeps the uncompressed original.
      // 60s is many times a normal ~300KB round-trip.
      timeout: COMPRESS_TIMEOUT_MS,
      killSignal: "SIGKILL",
    });

    const produced = readdirSync(outDir);
    if (produced.length !== 1) {
      console.warn(`  compress: expected 1 output file, got ${produced.length}; keeping the original`);
      return before;
    }

    const outPath = join(outDir, produced[0]);
    const bytes = readFileSync(outPath);

    if (!isPng(bytes)) {
      console.warn(`  compress: output is not a PNG (${produced[0]}); keeping the original`);
      return before;
    }
    if (bytes.length >= before) {
      console.warn(`  compress: output is not smaller (${bytes.length} >= ${before}); keeping the original`);
      return before;
    }

    copyFileSync(outPath, pngPath);
    compressed++;
    const saved = (((before - bytes.length) / before) * 100).toFixed(0);
    console.log(`  compressed ${basename(pngPath)}: ${(before / 1024).toFixed(1)}KB -> ${(bytes.length / 1024).toFixed(1)}KB (-${saved}%)`);
    return bytes.length;
  } catch (err) {
    const msg = err instanceof Error ? err.message.split("\n")[0] : String(err);
    console.warn(`  compress failed for ${basename(pngPath)} (${msg}); uploading the original`);
    return before;
  } finally {
    rmSync(outDir, { recursive: true, force: true });
  }
}

let compressed = 0;
if (!STORING_API_KEY) {
  console.log("STORING_API_KEY not set, skipping compression (charts upload at full size).");
}

// 2 + 3. Compress, upload each PNG, then repoint the HTML at the returned URL.
let html = readFileSync(htmlPath, "utf8");
let changed = 0;

for (const svg of svgs) {
  const png = svg.replace(/\.svg$/i, ".png");
  const pngPath = join(dir, png);
  if (!existsSync(pngPath)) die(`expected ${pngPath} after rasterizing, not found`);

  if (STORING_API_KEY) compressInPlace(pngPath);

  const bytes = readFileSync(pngPath);
  if (!isPng(bytes)) die(`${pngPath} is not a PNG; mailroom accepts PNG only`);
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

if (STORING_API_KEY) {
  console.log(`Compressed ${compressed}/${svgs.length} chart(s).`);
  if (compressed === 0) {
    // Not fatal, the charts are correct at full size, but a key was supplied and
    // did nothing, which is a misconfiguration worth seeing rather than scrolling past.
    console.warn(
      "WARNING: STORING_API_KEY is set but nothing was compressed. Check the key is " +
        "valid and the `storing` CLI is installed; the CLI exits 0 on auth failure, so " +
        "this is the only signal you get."
    );
  }
}
