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

const LENGTH_TARGETS = {
  short: { errorMin: 9, errorMax: 16, warnMin: 10, warnMax: 15, scenesMin: 3, scenesMax: 6 },
  long: { errorMin: 40, errorMax: 80, warnMin: 45, warnMax: 75, scenesMin: 8, scenesMax: 18 },
};

function lint(storyboard) {
  const errors = [];
  const warnings = [];

  if (storyboard.theme !== "noir" && storyboard.theme !== "thread") {
    errors.push(`theme must be "noir" or "thread", got ${JSON.stringify(storyboard.theme)}`);
  }
  const length = storyboard.length ?? "short";
  if (length !== "short" && length !== "long") {
    errors.push(`length must be "short" or "long", got ${JSON.stringify(storyboard.length)}`);
  }
  const target = LENGTH_TARGETS[length] ?? LENGTH_TARGETS.short;
  if (!Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
    errors.push("scenes must be a non-empty array");
    return { errors, warnings };
  }

  const VALID_ROLES = new Set(["cover", "stat", "chart", "breakdown", "takeaway"]);
  storyboard.scenes.forEach((s, i) => {
    if (!VALID_ROLES.has(s.role)) errors.push(`scene[${i}].role "${s.role}" is not one of ${[...VALID_ROLES].join("/")}`);
    if (!(s.duration > 0)) errors.push(`scene[${i}].duration must be a positive number of seconds`);
    if (s.duration < 1.2 || s.duration > 6) {
      warnings.push(`scene[${i}].duration is ${s.duration}s — the readable range per scene is ~1.2-6s regardless of story length`);
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
    if (s.breakdown?.kind === "network") {
      const ids = new Set(s.breakdown.nodes.map((n) => n.id));
      for (const edge of s.breakdown.edges) {
        if (!ids.has(edge.from)) errors.push(`scene[${i}].breakdown.network: edge.from "${edge.from}" is not a node id`);
        if (!ids.has(edge.to)) errors.push(`scene[${i}].breakdown.network: edge.to "${edge.to}" is not a node id`);
      }
    }
    if (s.breakdown && s.breakdown.kind !== "list" && s.breakdown.kind !== "ownership" && s.breakdown.kind !== "network") {
      errors.push(`scene[${i}].breakdown.kind must be "list", "ownership", or "network", got "${s.breakdown.kind}"`);
    }
  });

  if (storyboard.scenes.length < target.scenesMin || storyboard.scenes.length > target.scenesMax) {
    warnings.push(
      `${storyboard.scenes.length} scenes — ${target.scenesMin}-${target.scenesMax} is the readable range for a "${length}" story`
    );
  }

  if (storyboard.outro && storyboard.outro !== false && storyboard.outro.emphasis) {
    if (!storyboard.outro.headline.includes(storyboard.outro.emphasis)) {
      errors.push(`outro.emphasis "${storyboard.outro.emphasis}" is not an exact substring of outro.headline`);
    }
  }

  const sceneSeconds = storyboard.scenes.reduce((a, s) => a + (s.duration || 0), 0);
  const outroSeconds = storyboard.outro === false ? 0 : 2.2;
  const total = sceneSeconds + outroSeconds;
  if (total < target.errorMin || total > target.errorMax) {
    errors.push(
      `total video length ~${total.toFixed(1)}s is well outside the "${length}" target ${target.warnMin}-${target.warnMax}s ` +
        `(scenes ${sceneSeconds.toFixed(1)}s + outro ${outroSeconds}s)`
    );
  } else if (total < target.warnMin || total > target.warnMax) {
    warnings.push(`total video length ~${total.toFixed(1)}s is just outside the "${length}" target ${target.warnMin}-${target.warnMax}s`);
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
