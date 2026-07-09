#!/usr/bin/env node
// Build assets/logos.json, a single { TICKER: base64png } map from assets/logos/*.png.
// One JSON file instead of 957 loose PNGs is what keeps the packaged .skill under
// Claude Desktop's 200-file zip cap. Re-run only when assets/logos/ changes (new/updated
// ticker PNGs); render.mjs reads logos.json, never the raw PNGs, at render time.
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const logosDir = join(here, "..", "assets", "logos");
const out = join(here, "..", "assets", "logos.json");

const files = readdirSync(logosDir).filter((f) => f.endsWith(".png"));
const map = {};
for (const file of files.sort()) {
  const ticker = file.slice(0, -4);
  map[ticker] = readFileSync(join(logosDir, file)).toString("base64");
}

writeFileSync(out, JSON.stringify(map));
const kb = (JSON.stringify(map).length / 1024).toFixed(0);
console.log(`Wrote ${out} (${kb} KB) from ${files.length} logo PNGs`);
