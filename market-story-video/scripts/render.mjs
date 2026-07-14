#!/usr/bin/env node
// render.mjs — storyboard.json -> MP4 via Remotion, the video skill's equivalent of the
// carousel skill's render.mjs. Bundles src/index.ts once, then renders the "MarketStory"
// composition with the storyboard as input props (its duration is computed dynamically by
// Root.tsx's calculateMetadata, so a 4-scene story and an 8-scene story both just work).
//
//   node scripts/render.mjs samples/bbri-vs-bonds.storyboard.json --out output/bbri
//   node scripts/render.mjs samples/bbri-vs-bonds.storyboard.json --out output/bbri --stills
//
// --stills renders one PNG per scene (at each scene's midpoint) instead of the full MP4 —
// much faster for reviewing composition/copy/layout before paying for a full encode, the
// same "fast first pass" idea as the carousel's --scale 1 draft render.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

const USAGE =
  "usage: node scripts/render.mjs <storyboard.json> --out <dir/name> [--stills]\n" +
  "  e.g. node scripts/render.mjs samples/bbri-vs-bonds.storyboard.json --out output/bbri";

function parseArgs(argv) {
  const rest = [...argv];
  const stills = rest.includes("--stills");
  const filtered = rest.filter((a) => a !== "--stills");
  const outIdx = filtered.indexOf("--out");
  if (outIdx === -1) return { kind: "error", message: "missing --out <dir/name>" };
  const out = filtered[outIdx + 1];
  filtered.splice(outIdx, 2);
  const storyboardPath = filtered[0];
  if (!storyboardPath || !out) return { kind: "error", message: "missing storyboard path or --out value" };
  return { kind: "run", storyboardPath, out, stills };
}

const LENGTH_TARGETS = { short: { min: 9, max: 16 }, long: { min: 40, max: 80 } };

function validateDuration(storyboard) {
  const length = storyboard.length ?? "short";
  const { min, max } = LENGTH_TARGETS[length] ?? LENGTH_TARGETS.short;
  const sceneSeconds = storyboard.scenes.reduce((a, s) => a + s.duration, 0);
  const outroSeconds = storyboard.outro === false ? 0 : 2.2;
  const total = sceneSeconds + outroSeconds;
  if (total < min || total > max) {
    console.error(
      `WARNING: total video length is ~${total.toFixed(1)}s (scenes ${sceneSeconds.toFixed(1)}s + outro ${outroSeconds}s), ` +
        `outside the "${length}" target. Run scripts/storyboard-lint.mjs for the full check.`
    );
  }
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.kind === "error") {
    console.error(`ERROR: ${parsed.message}\n\n${USAGE}`);
    process.exit(2);
  }
  const { storyboardPath, out, stills } = parsed;
  const storyboard = JSON.parse(readFileSync(storyboardPath, "utf8"));
  validateDuration(storyboard);

  console.error("bundling...");
  const bundleLocation = await bundle({ entryPoint: join(root, "src", "index.ts") });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: "MarketStory",
    inputProps: { storyboard },
  });

  mkdirSync(out, { recursive: true });

  if (stills) {
    let cursor = 0;
    for (const scene of storyboard.scenes) {
      const frames = Math.round(scene.duration * composition.fps);
      const midFrame = cursor + Math.floor(frames / 2);
      const outPath = join(out, `scene-${storyboard.scenes.indexOf(scene) + 1}-${scene.role}.png`);
      await renderStill({
        composition,
        serveUrl: bundleLocation,
        output: outPath,
        frame: midFrame,
        inputProps: { storyboard },
      });
      console.error(`saved: ${outPath}`);
      cursor += frames;
    }
    return;
  }

  const outPath = join(out, `${basename(out)}.mp4`);
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: "h264",
    outputLocation: outPath,
    inputProps: { storyboard },
    onProgress: ({ progress }) => {
      process.stderr.write(`\rrendering... ${Math.round(progress * 100)}%`);
    },
  });
  process.stderr.write("\n");
  console.error(`saved: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
