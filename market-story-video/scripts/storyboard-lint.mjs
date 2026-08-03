#!/usr/bin/env node
// storyboard-lint.mjs — static checks on a storyboard.json before rendering, the video
// skill's equivalent of the carousel skill's brand-lint.mjs. Run this before scripts/render.mjs.
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const DASH_RE = /[–—]/; // en dash, em dash — brand voice forbids both (writing.md §3)
const ADVICE_RE = /\b(buy|sell|should (buy|sell|hold)|invest in|take profit)\b/i;

// Conversational read-aloud pace. 2.6 words/second (~155 wpm) is a presenter talking to camera
// in a reel, not a newsreader — see references/voiceover.md for why the budget is enforced at
// lint time rather than left to the edit.
const WORDS_PER_SECOND = 2.6;
const PRODUCT_ROLES = new Set(["feature", "demo", "cta"]);
const CLIP_EXT = /\.(mp4|mov|webm|m4v)$/i;
const SHOT_EXT = /\.(png|jpg|jpeg|webp)$/i;

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function inUnitRange(p) {
  return p && typeof p.x === "number" && typeof p.y === "number" && p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1;
}

function collectText(storyboard) {
  const texts = [];
  const push = (label, t) => {
    if (typeof t === "string") texts.push([label, t]);
  };
  storyboard.scenes.forEach((s, i) => {
    push(`scene[${i}].kicker`, s.kicker);
    push(`scene[${i}].headline`, s.headline);
    push(`scene[${i}].body`, s.body);
    push(`scene[${i}].vo`, s.vo);
    (s.badges ?? []).forEach((b, j) => push(`scene[${i}].badges[${j}].text`, b.text));
    if (s.feature) {
      push(`scene[${i}].feature.name`, s.feature.name);
      push(`scene[${i}].feature.promise`, s.feature.promise);
      (s.feature.chips ?? []).forEach((c, j) => push(`scene[${i}].feature.chips[${j}]`, c));
    }
    (s.callouts ?? []).forEach((c, j) => push(`scene[${i}].callouts[${j}].text`, c.text));
    if (s.cta) push(`scene[${i}].cta.action`, s.cta.action);
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
  reel: { errorMin: 10, errorMax: 20, warnMin: 12, warnMax: 18, scenesMin: 3, scenesMax: 6 },
};

const THEMES = ["noir", "thread", "product"];
const LENGTHS = ["short", "long", "reel"];

function lint(storyboard, storyboardPath) {
  const errors = [];
  const warnings = [];

  if (!THEMES.includes(storyboard.theme)) {
    errors.push(`theme must be one of ${THEMES.join("/")}, got ${JSON.stringify(storyboard.theme)}`);
  }
  const isProduct = storyboard.theme === "product";
  const length = storyboard.length ?? (isProduct ? "reel" : "short");
  if (!LENGTHS.includes(length)) {
    errors.push(`length must be one of ${LENGTHS.join("/")}, got ${JSON.stringify(storyboard.length)}`);
  }
  if (length === "reel" && !isProduct) {
    errors.push('length "reel" is only for the "product" theme — a market story is "short" or "long"');
  }
  if (isProduct && length !== "reel") {
    warnings.push(`a "product" reel normally runs the "reel" length (12-18s); this one is "${length}"`);
  }
  const target = LENGTH_TARGETS[length] ?? LENGTH_TARGETS.short;
  if (!Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
    errors.push("scenes must be a non-empty array");
    return { errors, warnings };
  }

  const VALID_ROLES = new Set(["cover", "stat", "chart", "breakdown", "takeaway", "feature", "demo", "cta"]);
  storyboard.scenes.forEach((s, i) => {
    if (!VALID_ROLES.has(s.role)) errors.push(`scene[${i}].role "${s.role}" is not one of ${[...VALID_ROLES].join("/")}`);
    if (PRODUCT_ROLES.has(s.role) && !isProduct) {
      errors.push(`scene[${i}].role "${s.role}" only renders in the "product" theme; this storyboard is "${storyboard.theme}"`);
    }
    if (isProduct && (s.role === "chart" || s.role === "breakdown")) {
      warnings.push(`scene[${i}] is a "${s.role}" in a feature reel — reels prove the product with a demo, not with a market chart`);
    }
    if (!(s.duration > 0)) errors.push(`scene[${i}].duration must be a positive number of seconds`);
    // A demo scene legitimately runs longer than a copy scene: the viewer is watching an
    // interaction play out, not reading a line, so the ceiling is 8s there.
    const maxScene = s.role === "demo" ? 8 : 6;
    if (s.duration < 1.2 || s.duration > maxScene) {
      warnings.push(
        `scene[${i}].duration is ${s.duration}s — the readable range for a "${s.role}" scene is ~1.2-${maxScene}s regardless of story length`
      );
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
    // A chart's caption and body don't finish entering until ~2.4s past the scene start, so a
    // short chart scene shows its so-what sentence for a fraction of a second. A caption is
    // 3-5 words and survives that; a `body` sentence does not, hence the body-only check.
    if (s.role === "chart" && s.body && s.duration < 3.6) {
      warnings.push(
        `scene[${i}] is a ${s.duration}s chart with a body line — the body isn't fully on screen until ~2.4s, leaving about a second to read it. Budget 3.8s, or move the so-what into the headline and drop the body`
      );
    }
    // BarChart heights are value/max, so a wide spread renders the small bars as slivers.
    if (s.chart?.kind === "bar") {
      const values = (s.chart.bars ?? []).map((b) => b.value).filter((v) => typeof v === "number" && v > 0);
      const spread = values.length > 1 ? Math.max(...values) / Math.min(...values) : 1;
      if (spread > 8) {
        warnings.push(
          `scene[${i}].chart spans ${spread.toFixed(0)}x from smallest to largest bar — the small bars will draw as unreadable slivers. Use a breakdown list, or chart a metric whose values are comparable`
        );
      }
    }
    // thread's stat renderer draws value + label only; a compare would vanish with no error.
    if (storyboard.theme === "thread" && s.role === "stat" && s.stat?.compare) {
      warnings.push(
        `scene[${i}].stat.compare is ignored by the thread theme's stat renderer — put the benchmark in a badges entry instead`
      );
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

    // ---- product-theme scene checks ----------------------------------------------------
    if (s.role === "feature") {
      if (!s.feature?.name) errors.push(`scene[${i}] is a "feature" scene with no feature.name`);
      if (!s.feature?.promise) errors.push(`scene[${i}] is a "feature" scene with no feature.promise (what it does for the viewer)`);
      if ((s.feature?.chips ?? []).length > 3) {
        errors.push(`scene[${i}].feature.chips has ${s.feature.chips.length} entries — 3 is the ceiling at reel speed`);
      }
      (s.feature?.chips ?? []).forEach((c, j) => {
        if (wordCount(c) > 4) warnings.push(`scene[${i}].feature.chips[${j}] "${c}" is a phrase, not a tag — chips are 1-4 words`);
      });
      if (s.emphasis) {
        warnings.push(
          `scene[${i}] is a "feature" scene with an emphasis on its headline — the feature NAME is already this scene's one gradient moment`
        );
      }
    }

    if (s.role === "demo") {
      const m = s.media;
      if (!m) {
        errors.push(`scene[${i}] is a "demo" scene with no media — a feature promo showing no product`);
      } else {
        if (m.kind !== "clip" && m.kind !== "shot") errors.push(`scene[${i}].media.kind must be "clip" or "shot", got "${m.kind}"`);
        if (!m.src) errors.push(`scene[${i}].media.src is required`);
        if (m.kind === "clip" && m.src && !CLIP_EXT.test(m.src)) {
          errors.push(`scene[${i}].media.src "${m.src}" is not a video file but kind is "clip"`);
        }
        if (m.kind === "shot" && m.src && !SHOT_EXT.test(m.src)) {
          errors.push(`scene[${i}].media.src "${m.src}" is not an image file but kind is "shot"`);
        }
        if (m.src) {
          const candidates = isAbsolute(m.src)
            ? [m.src]
            : [resolve(dirname(resolve(storyboardPath)), m.src), resolve(root, m.src)];
          if (!candidates.some((p) => existsSync(p))) {
            errors.push(`scene[${i}].media.src "${m.src}" does not exist. Looked in: ${candidates.join(", ")}`);
          }
        }
        if (m.trim) {
          if (!Array.isArray(m.trim) || m.trim.length !== 2) errors.push(`scene[${i}].media.trim must be [start, end] in seconds`);
          else {
            if (m.trim[1] <= m.trim[0]) errors.push(`scene[${i}].media.trim end (${m.trim[1]}s) must be after start (${m.trim[0]}s)`);
            const trimmed = m.trim[1] - m.trim[0];
            if (Math.abs(trimmed - s.duration) > 0.35) {
              warnings.push(
                `scene[${i}] trims ${trimmed.toFixed(1)}s of footage into a ${s.duration}s scene — the clip will be cut short or freeze on its last frame`
              );
            }
          }
          if (m.kind === "shot") warnings.push(`scene[${i}].media.trim is meaningless on a "shot" (still image)`);
        }
        if (m.focus && m.pan) errors.push(`scene[${i}].media sets both focus and pan — pick one, pan already includes its own start point`);
        if (m.focus && !inUnitRange(m.focus)) errors.push(`scene[${i}].media.focus x/y must be 0-1 fractions of the screen box`);
        if (m.pan && (!inUnitRange(m.pan.from) || !inUnitRange(m.pan.to))) {
          errors.push(`scene[${i}].media.pan from/to x/y must be 0-1 fractions of the screen box`);
        }
        if (m.device && !["browser", "phone", "bare"].includes(m.device)) {
          errors.push(`scene[${i}].media.device must be "browser", "phone", or "bare", got "${m.device}"`);
        }
        if (m.device === "browser" && !m.url) {
          warnings.push(`scene[${i}].media uses the browser frame with no url — the empty address bar reads as a mockup`);
        }
      }
      (s.callouts ?? []).forEach((c, j) => {
        if (!inUnitRange(c.anchor)) errors.push(`scene[${i}].callouts[${j}].anchor x/y must be 0-1 fractions of the screen box`);
        if (typeof c.at !== "number" || c.at < 0) errors.push(`scene[${i}].callouts[${j}].at must be seconds into the scene`);
        else if (c.at > s.duration - 0.6) {
          warnings.push(`scene[${i}].callouts[${j}] appears at ${c.at}s of a ${s.duration}s scene — under 0.6s of hold time is unreadable`);
        }
        if (wordCount(c.text) > 6) warnings.push(`scene[${i}].callouts[${j}].text is ${wordCount(c.text)} words — a callout is a label, keep it under 6`);
      });
      if ((s.callouts ?? []).length > 3) {
        warnings.push(`scene[${i}] has ${s.callouts.length} callouts — 3 is the most a viewer reads while footage is moving`);
      }
      (s.cursor ?? []).forEach((k, j) => {
        if (!inUnitRange(k)) errors.push(`scene[${i}].cursor[${j}] x/y must be 0-1 fractions of the screen box`);
        if (k.at > s.duration) warnings.push(`scene[${i}].cursor[${j}].at (${k.at}s) is past the end of a ${s.duration}s scene`);
        if (j > 0 && k.at <= s.cursor[j - 1].at) {
          errors.push(`scene[${i}].cursor[${j}].at (${k.at}s) must be strictly later than the keyframe before it`);
        }
      });
      if ((s.cursor ?? []).length > 0 && s.media?.kind === "clip") {
        warnings.push(`scene[${i}] draws a synthetic cursor over a screen recording — the footage already has one, so two pointers will show`);
      }
    }

    if (s.role === "cta") {
      if (!s.cta?.url) errors.push(`scene[${i}] is a "cta" scene with no cta.url`);
      else {
        if (/^https?:\/\//i.test(s.cta.url)) errors.push(`scene[${i}].cta.url "${s.cta.url}" includes a protocol — write it as "sectors.app/..."`);
        if (!s.cta.url.startsWith("sectors.app")) warnings.push(`scene[${i}].cta.url "${s.cta.url}" does not point at sectors.app`);
        if (s.cta.url.endsWith("/")) warnings.push(`scene[${i}].cta.url has a trailing slash`);
      }
      if (!s.headline) errors.push(`scene[${i}] is a "cta" scene with no headline — the URL alone is not a call to action`);
    }

    // Voiceover budget. A line the presenter cannot say inside the scene either runs over the
    // cut or gets rushed; both are worse than one fewer clause.
    if (s.vo) {
      const words = wordCount(s.vo);
      const budget = Math.floor(s.duration * WORDS_PER_SECOND);
      if (words > budget) {
        warnings.push(
          `scene[${i}].vo is ${words} words for a ${s.duration}s scene (budget ~${budget} at ${WORDS_PER_SECOND} words/sec) — cut a clause`
        );
      }
    }
  });

  // ---- product reel structure: intro, demo, CTA -----------------------------------------
  if (isProduct) {
    const roles = storyboard.scenes.map((s) => s.role);
    if (roles[0] !== "cover") warnings.push(`a feature reel opens on a "cover" hook; scene[0] is a "${roles[0]}"`);
    if (!roles.includes("feature")) errors.push('a feature reel needs a "feature" scene — the beat that names the thing and says what it does');
    if (!roles.includes("demo")) errors.push('a feature reel needs a "demo" scene — the beat that shows the product actually working');
    const ctaCount = roles.filter((r) => r === "cta").length;
    if (ctaCount === 0) errors.push('a feature reel needs a "cta" scene to close on');
    if (ctaCount > 1) errors.push(`a feature reel has ${ctaCount} "cta" scenes — one destination, at the end`);
    if (ctaCount === 1 && roles[roles.length - 1] !== "cta") {
      errors.push('the "cta" scene must be last — anything after it buries the destination');
    }
    if (storyboard.outro !== false && ctaCount > 0) {
      errors.push('a reel with a "cta" scene must set "outro": false — the CTA already carries the mark, the wordmark and the URL');
    }
    const featureIdx = roles.indexOf("feature");
    const demoIdx = roles.indexOf("demo");
    if (featureIdx > -1 && demoIdx > -1 && demoIdx < featureIdx) {
      warnings.push("the demo runs before the feature is named — the viewer watches an interaction without knowing what they are looking at");
    }
    const demoSeconds = storyboard.scenes.filter((s) => s.role === "demo").reduce((a, s) => a + (s.duration || 0), 0);
    const allSeconds = storyboard.scenes.reduce((a, s) => a + (s.duration || 0), 0);
    if (allSeconds > 0 && demoSeconds / allSeconds < 0.28) {
      warnings.push(
        `the demo is ${Math.round((demoSeconds / allSeconds) * 100)}% of the reel — the product working is the proof, give it at least a third`
      );
    }
    if (storyboard.humanSlot && storyboard.humanSlot !== false) {
      const corner = storyboard.humanSlot.corner ?? "bottom-left";
      if (!["bottom-left", "bottom-right", "top-left", "top-right"].includes(corner)) {
        errors.push(`humanSlot.corner "${corner}" is not one of bottom-left/bottom-right/top-left/top-right`);
      }
      if (corner.endsWith("right")) {
        warnings.push(`humanSlot sits ${corner} — the platform's like/share/comment column lives on the right, so a face there gets covered`);
      }
      const withoutVo = storyboard.scenes.filter((s) => !s.vo).length;
      if (withoutVo > 0) {
        warnings.push(
          `${withoutVo} scene(s) have no vo line, but a talking head is on screen for the whole reel — a presenter with nothing to say reads as a freeze`
        );
      }
    }
    if (!storyboard.feature) {
      warnings.push("no top-level `feature` key naming the inputs/features.json entry this reel was built from — the claims are untraceable");
    }
  }

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
  const { errors, warnings } = lint(storyboard, path);
  for (const w of warnings) console.error(`WARN: ${w}`);
  for (const e of errors) console.error(`ERROR: ${e}`);
  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s), ${warnings.length} warning(s).`);
    process.exit(1);
  }
  console.error(`OK — ${warnings.length} warning(s).`);
}

main();
