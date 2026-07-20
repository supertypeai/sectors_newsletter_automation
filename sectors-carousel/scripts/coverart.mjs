#!/usr/bin/env node
// Prepare a cover-art cutout: take a product/subject photograph and turn it into a
// transparent PNG the cover can layer behind its hook.
//
//   node scripts/coverart.mjs <src> --ticker H02 [options]
//   node scripts/coverart.mjs <src> --out path/to/file.png [options]
//
// `src` is a URL or a local path. With --ticker the result lands in
// assets/coverart/<TICKER>.png, which is where render.mjs looks it up automatically,
// so a deck never has to carry a megabyte of base64 in its JSON.
//
// Why this exists as a script rather than a paragraph of instructions: the two steps
// that actually matter are easy to get wrong by hand.
//   1. Background removal is a BORDER-SEEDED FLOOD FILL, not a brightness threshold.
//      A threshold ("make every near-white pixel transparent") punches holes through
//      white *inside* the artwork — the whites in a logo, a label, a highlight. The
//      flood fill only ever reaches the surround, so interior whites survive.
//   2. Soft shadows and mirror reflections are grey, not near-white, so they survive
//      the fill and render as a dirty smear on the dark canvas. --crop them off, or
//      raise --shadow to clear low-contrast grey that touches the cleared region.
//
// Options:
//   --ticker T      write to assets/coverart/T.png (render.mjs auto-resolves this)
//   --out PATH      explicit output path (overrides --ticker)
//   --crop x,y,w,h  crop the SOURCE first, in source pixels (use to drop a reflection)
//   --max N         longest edge of the output, default 900
//   --threshold N   a pixel is "background" at or above this on all channels, default 228
//   --shadow N      also clear pixels this close to neutral grey that touch the
//                   cleared surround, default 0 (off). Try 26 for a soft drop shadow.
//   --no-key        skip background removal (source already has transparency)
//   --no-trim       skip trimming to the opaque bounding box
//   --print-uri     also print the data URI to stdout (for a one-off inline embed)
//
// Always LOOK at the result before shipping it. A cutout with a halo, a hole punched
// through the subject, or a surviving shadow is worse on a dark canvas than no art.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);

const flag = (name, fallback = null) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  const v = argv[i + 1];
  if (v == null || v.startsWith("--")) return true;
  return v;
};
const has = (name) => argv.includes(`--${name}`);

const src = argv[0]; // the source must come first, before any flags
if (!src || src.startsWith("--")) {
  console.error("usage: node scripts/coverart.mjs <url-or-path> (--ticker T | --out PATH) [--crop x,y,w,h] [--max N] [--shadow N] [--no-key] [--no-trim]");
  process.exit(1);
}

const ticker = flag("ticker");
let out = flag("out");
if (!out && typeof ticker === "string") out = join(root, "assets", "coverart", `${ticker.toUpperCase().replace(/\.[A-Z]+$/, "")}.png`);
if (!out) {
  console.error("error: need --ticker T or --out PATH");
  process.exit(1);
}

const maxEdge = Number(flag("max", 900)) || 900;
const threshold = Number(flag("threshold", 228)) || 228;
const shadow = Number(flag("shadow", 0)) || 0;
const doKey = !has("no-key");
const doTrim = !has("no-trim");
const cropArg = flag("crop");
const crop = typeof cropArg === "string" ? cropArg.split(",").map(Number) : null;
if (crop && (crop.length !== 4 || crop.some((n) => !Number.isFinite(n)))) {
  console.error(`error: --crop expects x,y,w,h in source pixels, got "${cropArg}"`);
  process.exit(1);
}

// Inline the source ourselves rather than letting the page fetch it: a remote host that
// 403s an unfamiliar agent, or a local path the page has no base URL for, both fail
// silently as a blank canvas otherwise.
async function loadDataUri(s) {
  if (/^data:/.test(s)) return s;
  if (/^https?:\/\//.test(s)) {
    const res = await fetch(s, { headers: { "User-Agent": "Mozilla/5.0 (sectors-carousel coverart)" } });
    if (!res.ok) throw new Error(`fetch ${s} -> HTTP ${res.status}`);
    const type = res.headers.get("content-type") || "image/png";
    if (!/^image\//.test(type)) throw new Error(`fetch ${s} -> content-type "${type}", not an image`);
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  }
  const p = resolve(s);
  if (!existsSync(p)) throw new Error(`no such file: ${p}`);
  const ext = p.toLowerCase().endsWith(".jpg") || p.toLowerCase().endsWith(".jpeg") ? "image/jpeg" : "image/png";
  return `data:${ext};base64,${readFileSync(p).toString("base64")}`;
}

const dataUri = await loadDataUri(src);

const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.setContent("<body></body>");

const result = await page.evaluate(
  async (imgSrc, opts) => {
    const img = new Image();
    img.src = imgSrc;
    await img.decode();

    const sx = opts.crop ? opts.crop[0] : 0;
    const sy = opts.crop ? opts.crop[1] : 0;
    const sw = opts.crop ? opts.crop[2] : img.naturalWidth;
    const sh = opts.crop ? opts.crop[3] : img.naturalHeight;

    const c = document.createElement("canvas");
    c.width = sw;
    c.height = sh;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    const W = c.width, H = c.height;
    const d = ctx.getImageData(0, 0, W, H);
    const p = d.data;

    if (opts.doKey) {
      const t = opts.threshold;
      const isBg = (q) => {
        const i = q * 4;
        return p[i] >= t && p[i + 1] >= t && p[i + 2] >= t;
      };
      // Border-seeded flood fill: only the surround is cleared, interior whites survive.
      const seen = new Uint8Array(W * H);
      const stack = [];
      for (let x = 0; x < W; x++) stack.push(x, x + (H - 1) * W);
      for (let y = 0; y < H; y++) stack.push(y * W, W - 1 + y * W);
      while (stack.length) {
        const q = stack.pop();
        if (seen[q] || !isBg(q)) continue;
        seen[q] = 1;
        const x = q % W, y = (q / W) | 0;
        if (x > 0) stack.push(q - 1);
        if (x < W - 1) stack.push(q + 1);
        if (y > 0) stack.push(q - W);
        if (y < H - 1) stack.push(q + W);
      }
      // Optional second pass for soft shadows/reflections: neutral grey that touches
      // the cleared region. Off by default because it can nibble a genuinely grey subject.
      if (opts.shadow > 0) {
        for (let pass = 0; pass < 3; pass++) {
          let grew = false;
          for (let q = 0; q < W * H; q++) {
            if (seen[q]) continue;
            const i = q * 4;
            const mx = Math.max(p[i], p[i + 1], p[i + 2]);
            const mn = Math.min(p[i], p[i + 1], p[i + 2]);
            if (mx - mn > 14 || mx < opts.threshold - opts.shadow) continue;
            const x = q % W, y = (q / W) | 0;
            let touch = false;
            if (x > 0 && seen[q - 1]) touch = true;
            if (x < W - 1 && seen[q + 1]) touch = true;
            if (y > 0 && seen[q - W]) touch = true;
            if (y < H - 1 && seen[q + W]) touch = true;
            if (touch) { seen[q] = 1; grew = true; }
          }
          if (!grew) break;
        }
      }
      // Feather the boundary so the cutout has no jagged edge on the dark canvas.
      for (let q = 0; q < W * H; q++) {
        const i = q * 4;
        if (seen[q]) { p[i + 3] = 0; continue; }
        const lum = (p[i] + p[i + 1] + p[i + 2]) / 3;
        if (lum > opts.threshold - 18) {
          const x = q % W, y = (q / W) | 0;
          let touch = false;
          if (x > 0 && seen[q - 1]) touch = true;
          if (x < W - 1 && seen[q + 1]) touch = true;
          if (y > 0 && seen[q - W]) touch = true;
          if (y < H - 1 && seen[q + W]) touch = true;
          if (touch) p[i + 3] = Math.round(255 * Math.max(0, Math.min(1, (opts.threshold + 17 - lum) / 35)));
        }
      }
      ctx.putImageData(d, 0, 0);
    }

    // Trim to the opaque bounding box so `width`/`opacity` on the cover mean what they say.
    let bx0 = 0, by0 = 0, bx1 = W - 1, by1 = H - 1;
    if (opts.doTrim) {
      const alpha = ctx.getImageData(0, 0, W, H).data;
      bx0 = W; by0 = H; bx1 = -1; by1 = -1;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (alpha[(y * W + x) * 4 + 3] > 8) {
            if (x < bx0) bx0 = x;
            if (x > bx1) bx1 = x;
            if (y < by0) by0 = y;
            if (y > by1) by1 = y;
          }
        }
      }
      if (bx1 < bx0 || by1 < by0) return { error: "everything was cleared — the whole image read as background. Lower --threshold, or pass --no-key if the source is already a cutout." };
    }
    const tw = bx1 - bx0 + 1, th = by1 - by0 + 1;

    const scale = Math.min(1, opts.maxEdge / Math.max(tw, th));
    const o = document.createElement("canvas");
    o.width = Math.max(1, Math.round(tw * scale));
    o.height = Math.max(1, Math.round(th * scale));
    const octx = o.getContext("2d");
    octx.imageSmoothingQuality = "high";
    octx.drawImage(c, bx0, by0, tw, th, 0, 0, o.width, o.height);

    // How much of the frame the subject actually fills, as a cheap sanity signal.
    const fin = octx.getImageData(0, 0, o.width, o.height).data;
    let opaque = 0;
    for (let i = 3; i < fin.length; i += 4) if (fin[i] > 8) opaque++;
    return {
      uri: o.toDataURL("image/png"),
      width: o.width,
      height: o.height,
      coverage: opaque / (o.width * o.height),
      sourceW: img.naturalWidth,
      sourceH: img.naturalHeight,
    };
  },
  dataUri,
  { crop, doKey, doTrim, maxEdge, threshold, shadow }
);

await browser.close();

if (result.error) {
  console.error(`error: ${result.error}`);
  process.exit(1);
}

mkdirSync(dirname(out), { recursive: true });
const buf = Buffer.from(result.uri.split(",")[1], "base64");
writeFileSync(out, buf);

console.log(`source : ${result.sourceW}x${result.sourceH}${crop ? ` (cropped to ${crop[2]}x${crop[3]})` : ""}`);
console.log(`output : ${out}  ${result.width}x${result.height}, ${(buf.length / 1024).toFixed(0)} KB`);
console.log(`subject fills ${(result.coverage * 100).toFixed(0)}% of the frame`);
if (doKey && result.coverage > 0.97)
  console.log("\nWARNING: almost nothing was removed. If the source had a solid background,\n  it is probably not near-white — this will render as a rectangle on the dark canvas.");
if (doKey && result.coverage < 0.12)
  console.log("\nWARNING: very little survived. Check for holes punched through the subject;\n  lower --threshold if so.");
if (has("print-uri")) console.log(`\n${result.uri}`);
console.log("\nLook at the PNG before shipping it. Then render the cover and look again.");
