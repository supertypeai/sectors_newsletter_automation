#!/usr/bin/env node
// script-out.mjs — compile a storyboard's `vo` lines into the timed script the presenter reads.
//
//   node scripts/script-out.mjs <storyboard.json>                    # prints to stdout
//   node scripts/script-out.mjs <storyboard.json> --out script.md    # writes a file
//
// The script is generated, never hand-kept: the timecodes come from the same scene durations
// the renderer uses, so a storyboard edit can't leave the presenter reading against a stale
// clock. Run it again after every duration change.
//
// This skill writes the words and reserves the corner; it does not record or composite audio or
// video. See references/voiceover.md.
import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const WORDS_PER_SECOND = 2.6; // matches storyboard-lint.mjs

function wordCount(text) {
  return String(text ?? "").trim().split(/\s+/).filter(Boolean).length;
}

function fmt(seconds) {
  return `${seconds.toFixed(1)}s`;
}

// What the viewer is READING while the presenter talks. Printed next to each vo line so the
// presenter can hear the clash: a line that says out loud exactly what is already on screen
// wastes the only channel the on-screen text can't use.
function onScreen(scene) {
  const bits = [];
  if (scene.kicker) bits.push(`kicker: ${scene.kicker}`);
  if (scene.headline) bits.push(`headline: "${scene.headline}"`);
  if (scene.feature?.name) bits.push(`feature: ${scene.feature.name}`);
  if (scene.feature?.promise) bits.push(`promise: "${scene.feature.promise}"`);
  if (scene.feature?.chips?.length) bits.push(`chips: ${scene.feature.chips.join(" · ")}`);
  if (scene.stat) bits.push(`stat: ${scene.stat.value} (${scene.stat.label})`);
  if (scene.body) bits.push(`body: "${scene.body}"`);
  if (scene.cta) bits.push(`cta: ${scene.cta.url}${scene.cta.action ? ` · ${scene.cta.action}` : ""}`);
  return bits;
}

function build(storyboard, sourceName) {
  const lines = [];
  const scenes = storyboard.scenes ?? [];
  const sceneSeconds = scenes.reduce((a, s) => a + (s.duration || 0), 0);
  const outroSeconds = storyboard.outro === false ? 0 : 2.2;
  const total = sceneSeconds + outroSeconds;
  const words = scenes.reduce((a, s) => a + wordCount(s.vo), 0);
  const budget = Math.floor(total * WORDS_PER_SECOND);

  const title = storyboard.feature ? `${storyboard.feature} reel` : basename(sourceName, ".json");
  lines.push(`# ${title}, voiceover script`);
  lines.push("");
  lines.push(
    `${fmt(total)} total · ${words} words spoken · budget ~${budget} words at ${WORDS_PER_SECOND} words/sec. ` +
      `Generated from ${basename(sourceName)}; regenerate after any duration change.`
  );
  lines.push("");

  let cursor = 0;
  scenes.forEach((scene, i) => {
    const start = cursor;
    const end = cursor + (scene.duration || 0);
    cursor = end;
    const sceneBudget = Math.floor((scene.duration || 0) * WORDS_PER_SECOND);
    const spoken = wordCount(scene.vo);
    const verdict = !scene.vo ? "no line" : spoken > sceneBudget ? `${spoken} words, OVER by ${spoken - sceneBudget}` : `${spoken}/${sceneBudget} words`;

    lines.push(`## ${fmt(start)} to ${fmt(end)} · ${scene.role.toUpperCase()} · ${verdict}`);
    lines.push("");
    for (const bit of onScreen(scene)) lines.push(`- ON SCREEN, ${bit}`);
    if (scene.callouts?.length) {
      for (const c of scene.callouts) {
        lines.push(`- CALLOUT at ${fmt(start + c.at)}, "${c.text}" appears over the app`);
      }
    }
    lines.push("");
    lines.push(scene.vo ? `> ${scene.vo}` : "> (silent beat, let the footage carry it)");
    lines.push("");
  });

  if (outroSeconds > 0) {
    lines.push(`## ${fmt(cursor)} to ${fmt(cursor + outroSeconds)} · OUTRO`);
    lines.push("");
    lines.push("> (silent, brand sign-off)");
    lines.push("");
  }

  const slot = storyboard.humanSlot;
  if (slot && slot !== false) {
    const corner = slot.corner ?? "bottom-left";
    const size = slot.size ?? 320;
    const shape = slot.shape ?? "circle";
    lines.push("## Recording notes");
    lines.push("");
    lines.push(`- The frame reserves a ${size}px ${shape} at ${corner}. Copy is padded out of that band for the whole reel, so the clip can run start to finish without covering a word.`);
    lines.push(`- Render a stills pass (\`--stills\`, or \`--guides\` on the MP4) to see the exact box before filming.`);
    if (slot.note) lines.push(`- Direction: ${slot.note}`);
    lines.push(`- Film at 1080x1080 or larger, framed so your head sits in the middle third. The mask is a ${shape}, so anything at the corners of your frame gets cut.`);
    lines.push(`- Read against the timecodes above, and leave roughly 0.3s of silence at each scene boundary so a cut never lands mid-word.`);
    lines.push(`- The delivered MP4 leaves the slot empty. Composite the clip over it in your editor; nothing in this skill records or overlays footage.`);
    lines.push("");
  } else {
    lines.push("## Recording notes");
    lines.push("");
    lines.push("- No talking-head slot is reserved on this reel, so the script is a pure voiceover: record audio only, over the finished MP4.");
    lines.push("- Read against the timecodes above, and leave roughly 0.3s of silence at each scene boundary so a cut never lands mid-word.");
    lines.push("");
  }

  return lines.join("\n");
}

function main() {
  const argv = process.argv.slice(2);
  const outIdx = argv.indexOf("--out");
  const out = outIdx === -1 ? null : argv[outIdx + 1];
  const positional = outIdx === -1 ? argv : argv.filter((_, i) => i !== outIdx && i !== outIdx + 1);
  const path = positional[0];
  if (!path) {
    console.error("usage: node scripts/script-out.mjs <storyboard.json> [--out script.md]");
    process.exit(2);
  }
  const storyboard = JSON.parse(readFileSync(path, "utf8"));
  const text = build(storyboard, path);
  if (out) {
    writeFileSync(out, `${text}\n`);
    console.error(`saved: ${out}`);
  } else {
    process.stdout.write(`${text}\n`);
  }
}

main();
