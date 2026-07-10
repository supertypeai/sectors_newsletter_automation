#!/usr/bin/env node
// storyboard-lint.mjs — static checks on a storyboard.json before rendering, the video
// skill's equivalent of the carousel skill's brand-lint.mjs. Run this before scripts/render.mjs.
import { readFileSync } from "node:fs";

const DASH_RE = /[–—]/; // en dash, em dash — brand voice forbids both (writing.md §3)
const ADVICE_RE = /\b(buy|sell|should (buy|sell|hold)|invest in|take profit)\b/i;

function collectText(storyboard) {
  const texts = [];
  const push = (label, t) => {
    if (typeof t === "string") texts.push([label, t]);
  };
  storyboard.scenes.forEach((s, i) => {
    push(`scene[${i}].kicker`, s.kicker);
    push(`scene[${i}].headline`, s.headline);
    push(`scene[${i}].body`, s.body);
    (s.badges ?? []).forEach((b, j) => push(`scene[${i}].badges[${j}].text`, b.text));
    if (s.chart) push(`scene[${i}].chart.caption`, s.chart.caption);
    if (s.stat) {
      push(`scene[${i}].stat.label`, s.stat.label);
      if (s.stat.compare) push(`scene[${i}].stat.compare.label`, s.stat.compare.label);
    }
  });
  if (storyboard.outro && storyboard.outro !== false) {
    push("outro.headline", storyboard.outro.headline);
    push("outro.tagline", storyboard.outro.tagline);
  }
  return texts;
}

function lint(storyboard) {
  const errors = [];
  const warnings = [];

  if (storyboard.theme !== "noir" && storyboard.theme !== "thread") {
    errors.push(`theme must be "noir" or "thread", got ${JSON.stringify(storyboard.theme)}`);
  }
  if (!Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
    errors.push("scenes must be a non-empty array");
    return { errors, warnings };
  }

  const VALID_ROLES = new Set(["cover", "stat", "chart", "breakdown", "takeaway"]);
  storyboard.scenes.forEach((s, i) => {
    if (!VALID_ROLES.has(s.role)) errors.push(`scene[${i}].role "${s.role}" is not one of ${[...VALID_ROLES].join("/")}`);
    if (!(s.duration > 0)) errors.push(`scene[${i}].duration must be a positive number of seconds`);
    if (s.duration < 1.2 || s.duration > 6) {
      warnings.push(`scene[${i}].duration is ${s.duration}s — the readable range for a 10-15s story is ~1.2-6s per scene`);
    }
    if (s.emphasis) {
      if (!s.headline) errors.push(`scene[${i}] has emphasis but no headline to match it against`);
      else if (!s.headline.includes(s.emphasis)) {
        errors.push(`scene[${i}].emphasis "${s.emphasis}" is not an exact substring of headline "${s.headline}"`);
      }
    }
    if (s.chart && s.chart.kind !== "line" && s.chart.kind !== "bar") {
      errors.push(`scene[${i}].chart.kind must be "line" or "bar", got "${s.chart.kind}"`);
    }
    if (s.breakdown?.kind === "ownership") {
      if (s.breakdown.nodes.length !== s.breakdown.links.length + 1) {
        errors.push(`scene[${i}].breakdown.ownership: nodes.length must be links.length + 1`);
      }
    }
    if (s.breakdown && s.breakdown.kind !== "list" && s.breakdown.kind !== "ownership") {
      errors.push(`scene[${i}].breakdown.kind must be "list" or "ownership", got "${s.breakdown.kind}"`);
    }
  });

  if (storyboard.scenes.length < 3 || storyboard.scenes.length > 6) {
    warnings.push(`${storyboard.scenes.length} scenes — 3-6 is the readable range for a 10-15s story`);
  }

  if (storyboard.outro && storyboard.outro !== false && storyboard.outro.emphasis) {
    if (!storyboard.outro.headline.includes(storyboard.outro.emphasis)) {
      errors.push(`outro.emphasis "${storyboard.outro.emphasis}" is not an exact substring of outro.headline`);
    }
  }

  const sceneSeconds = storyboard.scenes.reduce((a, s) => a + (s.duration || 0), 0);
  const outroSeconds = storyboard.outro === false ? 0 : 2.2;
  const total = sceneSeconds + outroSeconds;
  if (total < 9 || total > 16) {
    errors.push(`total video length ~${total.toFixed(1)}s is well outside the 10-15s target (scenes ${sceneSeconds.toFixed(1)}s + outro ${outroSeconds}s)`);
  } else if (total < 10 || total > 15) {
    warnings.push(`total video length ~${total.toFixed(1)}s is just outside the 10-15s target`);
  }

  for (const [label, text] of collectText(storyboard)) {
    if (DASH_RE.test(text)) errors.push(`${label} contains an em/en dash: "${text}" — brand voice forbids both, use a period or comma`);
    if (ADVICE_RE.test(text)) warnings.push(`${label} reads as prescriptive advice: "${text}" — describe, don't prescribe (hard rule 2)`);
  }

  return { errors, warnings };
}

function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("usage: node scripts/storyboard-lint.mjs <storyboard.json>");
    process.exit(2);
  }
  const storyboard = JSON.parse(readFileSync(path, "utf8"));
  const { errors, warnings } = lint(storyboard);
  for (const w of warnings) console.error(`WARN: ${w}`);
  for (const e of errors) console.error(`ERROR: ${e}`);
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.error(`OK — ${warnings.length} warning(s).`);
}

main();
