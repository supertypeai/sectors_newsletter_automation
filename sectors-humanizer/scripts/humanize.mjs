#!/usr/bin/env node
// humanize.mjs — one model pass over a delivered newsletter's prose, in place.
//
//   node scripts/humanize.mjs ../newsletter/newsletter_2026-08-24_weekly-insights-v2
//   node scripts/humanize.mjs <folder> --dry-run
//   node scripts/humanize.mjs <folder> --model claude-opus-5
//
// Only prose is sent, as a JSON array, and only strings come back, so block structure,
// images, links and styles cannot change. Sending the whole document instead was measured
// and is unsafe: it produces better prose but dropped a figure and moved a gain/loss
// colour onto a different number in the one run that was checked.
//
// Default mode is "block": a fragment spans a run of text joined by inline tags (<b>, <a>),
// so the model sees whole sentences and can restructure across them. "--mode node" is the
// older one-text-node-per-fragment split, kept as a fallback — it cannot restructure a
// sentence, and asking for 89 exact strings failed arity on all three models where the 28
// block fragments succeeded first try.
//
// A rewrite is dropped, keeping the original wording, if its numbers or $TICKERs moved, if
// it grew, or (block mode) if its inline tags changed. On total failure the original ships
// and the process exits 0; HUMANIZE_STRICT=1 exits 1.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { providerFor, resolveKey, loadConfig, unwrap } from "./providers.mjs";

const here = dirname(fileURLToPath(import.meta.url));

const DEFAULT_MODELS = ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash"];
const MIN_CHARS = 12;
const MIN_WORDS = 2;

const parseList = (value) => String(value || "").split(",").map((s) => s.trim()).filter(Boolean);

// Sign and unit are part of the figure: "-11.91%" -> "+11.91%" and "IDR 11,445.45T" ->
// "IDR 11,445.45" both keep the same digits, and the second is a 10^12 error.
export function fingerprint(text) {
  return {
    numbers: String(text).match(/[+-]?\d[\d,._]*\d[TBMKtbmk%]?|[+-]?\d[TBMKtbmk%]?/g) || [],
    tickers: String(text).match(/\$[A-Z]{2,6}\b/g) || [],
  };
}

export function fingerprintMatches(before, after) {
  const a = fingerprint(before);
  const b = fingerprint(after);
  return a.numbers.join("|") === b.numbers.join("|") && a.tickers.join("|") === b.tickers.join("|");
}

export const stripCitations = (text) => String(text).replace(/\[cite:\s*[\d,\s]*\]/g, "").replace(/[ \t]{2,}/g, " ");

// Models decode entities: "&amp;bull;" comes back as "•", "&amp;lt;X&amp;gt;" as "<X>". The prose is
// spliced into HTML raw, so a literal < would open a tag in an email client, and the
// document carries no <meta charset> to guarantee a bare • survives. Re-encode rather
// than reject, since decoding is the common case and otherwise costs every rewrite.
const ENTITIES = [
  [/•/g, "&bull;"],
  [/—/g, "&mdash;"],
  [/–/g, "&ndash;"],
  [/ /g, "&nbsp;"],
  [/’/g, "&rsquo;"],
  [/“/g, "&ldquo;"],
  [/”/g, "&rdquo;"],
];

export function reencode(text) {
  let out = String(text).replace(/&(?!(?:[a-zA-Z][a-zA-Z0-9]*|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");
  for (const [re, ent] of ENTITIES) out = out.replace(re, ent);
  return out.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function isProse(text) {
  const t = text.trim();
  return (
    t.length >= MIN_CHARS &&
    t.split(/\s+/).length >= MIN_WORDS &&
    /[a-z]{3}/i.test(t) &&
    !/^https?:\/\/\S+$/.test(t)
  );
}

// Deliberately not a parser: re-serializing would normalize the email HTML that mailroom sends byte for byte.
export function splitHtml(html) {
  const chunks = [];
  const pattern = /(<(?:style|script)\b[\s\S]*?<\/(?:style|script)>|<!--[\s\S]*?-->|<[^>]+>)/gi;
  let last = 0;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    if (match.index > last) chunks.push({ type: "text", value: html.slice(last, match.index) });
    chunks.push({ type: "markup", value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < html.length) chunks.push({ type: "text", value: html.slice(last) });
  return chunks;
}

export function collectSegments(chunks) {
  const indices = [];
  const segments = [];
  chunks.forEach((chunk, i) => {
    if (chunk.type === "text" && isProse(chunk.value)) {
      indices.push(i);
      segments.push(chunk.value.trim());
    }
  });
  return { indices, segments };
}

// Inline tags sit inside a sentence; block tags end one. Grouping across the inline set
// is what lets a fragment be a whole sentence rather than the piece before the next <b>.
const INLINE = /^<\/?(a|b|strong|i|em|span|u|small|sup|sub|br|code|font|mark|abbr)\b/i;

// A block-mode fragment spans one run of text chunks joined by inline markup, so the
// model can restructure across a <b> or <a> instead of rewriting either side blind.
export function collectBlocks(chunks) {
  const spans = [];
  const segments = [];
  let i = 0;
  while (i < chunks.length) {
    if (chunks[i].type !== "text") {
      i++;
      continue;
    }
    let end = i;
    // Extend while the next non-text chunk is inline and a text chunk follows it.
    for (let j = i + 1; j < chunks.length; ) {
      if (chunks[j].type === "markup" && INLINE.test(chunks[j].value)) {
        let k = j;
        while (k < chunks.length && chunks[k].type === "markup" && INLINE.test(chunks[k].value)) k++;
        if (k < chunks.length && chunks[k].type === "text") {
          end = k;
          j = k + 1;
          continue;
        }
      }
      break;
    }
    const value = chunks.slice(i, end + 1).map((c) => c.value).join("");
    if (isProse(value.replace(/<[^>]+>/g, " "))) {
      spans.push({ start: i, end });
      segments.push(value.trim());
    }
    i = end + 1;
  }
  return { spans, segments };
}

const innerTags = (s) => (String(s).match(/<[^>]+>/g) || []).join("|");

export function applyBlocks(chunks, spans, humanized) {
  const rejected = [];
  const replaced = new Map();
  spans.forEach((span, i) => {
    const original = chunks.slice(span.start, span.end + 1).map((c) => c.value).join("");
    const cleaned = stripCitations(humanized[i] ?? "").trim();
    if (!cleaned || cleaned === original.trim()) return;
    const reason =
      innerTags(cleaned) !== innerTags(original) ? "inline markup changed"
      : !fingerprintMatches(original, cleaned) ? "figure moved"
      : grew(original.trim(), cleaned) ? "rewrite grew"
      : null;
    if (reason) return rejected.push({ reason, original: original.trim(), candidate: cleaned });
    const [, lead = "", , trail = ""] = original.match(/^(\s*)([\s\S]*?)(\s*)$/) || [];
    replaced.set(span.start, `${lead}${cleaned}${trail}`);
    for (let k = span.start + 1; k <= span.end; k++) replaced.set(k, "");
  });
  const next = chunks.map((c, i) => (replaced.has(i) ? { ...c, value: replaced.get(i) } : { ...c }));
  return { chunks: next, rejected };
}

// Fragments cut mid-sentence at a markup boundary are where models misbehave: they try to
// complete them and splice in a word that was never there ("led net selling at" -> "led net
// selling at formulation"). Measured over 116 real rewrites, this ratio drops both observed
// corruptions and keeps 107, including the headline rewrites the prompt asks for.
const grew = (original, candidate) => candidate.length > original.length * 1.05 + 2;

export function applySegments(chunks, indices, humanized) {
  const rejected = [];
  const next = chunks.map((c) => ({ ...c }));
  indices.forEach((chunkIndex, i) => {
    const original = next[chunkIndex].value;
    const cleaned = reencode(stripCitations(humanized[i] ?? "")).trim();
    if (!cleaned || cleaned === original.trim()) return;
    if (!fingerprintMatches(original, cleaned)) {
      rejected.push({ reason: "figure moved", original: original.trim(), candidate: cleaned });
      return;
    }
    if (grew(original.trim(), cleaned)) {
      rejected.push({ reason: "rewrite grew", original: original.trim(), candidate: cleaned });
      return;
    }
    const [, lead = "", , trail = ""] = original.match(/^(\s*)([\s\S]*?)(\s*)$/) || [];
    next[chunkIndex].value = `${lead}${cleaned}${trail}`;
  });
  return { chunks: next, rejected };
}

export const joinChunks = (chunks) => chunks.map((c) => c.value).join("");

const retryable = (message) => Object.assign(new Error(message), { retryable: true });

const CONTRACT = [
  "",
  "---",
  "",
  "You are given a JSON array of text fragments taken from one newsletter, in reading",
  'order. Return {"fragments": [...]} with the SAME number of strings, same order.',
  "",
  "Hard rules, in priority order:",
  "1. Never change, drop, add, or reformat any number, percentage, date, or $TICKER.",
  "   A fragment whose figures moved is discarded, so the rewrite is wasted.",
  "2. Return exactly one output string per input string. Never merge or split fragments.",
  "3. Return a fragment unchanged when it should not be rewritten. That includes the",
  "   masthead, navigation, footers, legal text, button labels, table headers, and the",
  "   recurring section labels that must read identically from issue to issue. Rewrite",
  "   editorial headlines and body prose.",
  "4. A fragment may begin or end mid-sentence because it was cut at a markup boundary.",
  "   Preserve that shape: do not add a capital letter or a full stop to close it off.",
  "5. Emit no HTML tags, no markdown, and no citation markers.",
].join("\n");

export async function callModel({ model, apiKey, prompt, segments, fetchImpl = fetch, timeoutMs = 120000 }) {
  const provider = providerFor(model);
  let res;
  try {
    res = await fetchImpl(provider.url(model), {
      method: "POST",
      headers: { "content-type": "application/json", ...provider.headers(apiKey) },
      body: JSON.stringify(provider.body(model, prompt.trim() + CONTRACT, JSON.stringify(segments))),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    // DNS, reset, TLS, timeout: transient and provider-local, so the next model gets a turn.
    throw retryable(`${model}: ${err.name === "TimeoutError" ? `no response in ${timeoutMs}ms` : err.message}`);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Every HTTP failure moves to the next model. A revoked key, a typo'd model id, or a
    // parameter one provider rejects are all provider-local — treating them as fatal
    // would let a single bad entry in HUMANIZE_MODELS disable the whole chain.
    throw retryable(`${model}: HTTP ${res.status} ${detail.replace(/\s+/g, " ").slice(0, 200)}`);
  }

  const json = await res.json();
  const text = provider.text(json);
  if (!text) throw retryable(`${model}: empty response (${provider.stopReason(json) || "no candidate"})`);

  let parsed;
  try {
    parsed = unwrap(JSON.parse(text));
  } catch {
    throw retryable(`${model}: response was not JSON`);
  }
  if (!Array.isArray(parsed) || parsed.length !== segments.length) {
    throw retryable(`${model}: expected ${segments.length} strings, got ${Array.isArray(parsed) ? parsed.length : typeof parsed}`);
  }
  return parsed;
}

export async function humanize({ html, prompt, models = DEFAULT_MODELS, keyFor, fetchImpl = fetch, log = () => {}, mode = "block" }) {
  const chunks = splitHtml(html);
  const block = mode === "block";
  const picked = block ? collectBlocks(chunks) : collectSegments(chunks);
  const { segments } = picked;
  const apply = block
    ? (h) => applyBlocks(chunks, picked.spans, h)
    : (h) => applySegments(chunks, picked.indices, h);
  if (!segments.length) return { html, changed: false, model: null, segments: 0, rewritten: 0, rejected: [] };

  const config = loadConfig();
  const resolve_ = keyFor || ((model) => resolveKey(providerFor(model), config));
  const errors = [];

  for (const model of models) {
    try {
      const apiKey = resolve_(model);
      if (!apiKey) throw retryable(`${model}: no key for ${providerFor(model).envKey}`);
      log(`trying ${model} (${segments.length} fragments)`);
      const humanized = await callModel({ model, apiKey, prompt, segments, fetchImpl });
      const rewritten = humanized.filter((h, i) => typeof h === "string" && h.trim() && h.trim() !== segments[i]).length;
      // Some models echo the input back untouched — measured on gemini-3.6-flash, which
      // returned 0/181 on a document gemini-3.5-flash rewrote 28 fragments of. The outcome
      // is the same as a failure, so treat it as one and let the chain try the next model.
      if (rewritten === 0) throw retryable(`${model}: returned every fragment unchanged`);
      const { chunks: applied, rejected } = apply(humanized);
      const nextHtml = joinChunks(applied);
      return { html: nextHtml, changed: nextHtml !== html, model, segments: segments.length, rewritten, rejected };
    } catch (err) {
      errors.push(err.message);
      log(`  ${err.message}`);
      if (!err.retryable && !err.fatal) break;
    }
  }
  throw new Error(`every model failed:\n  ${errors.join("\n  ")}`);
}

function resolvePrompt(explicit) {
  for (const candidate of [explicit, process.env.HUMANIZE_PROMPT_FILE, join(here, "..", "prompt.md")].filter(Boolean)) {
    const path = resolve(candidate);
    if (!existsSync(path)) continue;
    const body = readFileSync(path, "utf8").trim();
    if (body) return { path, body };
  }
  return null;
}

async function main(argv) {
  const args = argv.slice(2);
  const has = (flag) => args.includes(flag);
  const valueOf = (name) => (args.indexOf(name) >= 0 ? args[args.indexOf(name) + 1] : undefined);
  const folder = args.filter((a) => !a.startsWith("--"))[0];

  const strict = process.env.HUMANIZE_STRICT === "1" || has("--strict");
  // Exiting 0 keeps a provider outage from costing a send, but a green check with no
  // signal is how a permanently-broken key ships un-humanized for weeks. Annotate.
  const notice = (msg) => {
    console.error(`humanize: ${msg}`);
    if (process.env.GITHUB_STEP_SUMMARY) console.log(`::warning::humanize: ${msg}`);
  };
  const bail = (msg) => {
    notice(`shipped un-humanized — ${msg}`);
    process.exit(strict ? 1 : 0);
  };

  if (!folder) {
    console.error("usage: node scripts/humanize.mjs <issue-folder> [--dry-run] [--model <id>] [--prompt <file>] [--strict]");
    process.exit(1);
  }

  const htmlPath = join(folder, "newsletter.html");
  if (!existsSync(htmlPath)) return bail(`no newsletter.html in ${folder}`);

  const prompt = resolvePrompt(valueOf("--prompt"));
  if (!prompt) return bail("no humanizing prompt found. Write one at sectors-humanizer/prompt.md, or point HUMANIZE_PROMPT_FILE / --prompt at it");

  const configured = parseList(process.env.HUMANIZE_MODELS || process.env.GEMINI_MODELS);
  const models = valueOf("--model") ? [valueOf("--model")] : configured.length ? configured : DEFAULT_MODELS;
  const html = readFileSync(htmlPath, "utf8");
  console.error(`humanize: prompt from ${prompt.path}`);

  let result;
  try {
    const mode = valueOf("--mode") || process.env.HUMANIZE_MODE || "block";
    result = await humanize({ html, prompt: prompt.body, models, mode, log: (m) => console.error(`humanize: ${m}`) });
  } catch (err) {
    return bail(err.message);
  }

  for (const r of result.rejected) {
    console.error(`humanize: dropped a rewrite (${r.reason})\n  was: ${r.original.slice(0, 150)}\n  got: ${r.candidate.slice(0, 150)}`);
  }
  const kept = result.rewritten - result.rejected.length;
  const summary = `${kept}/${result.segments} fragments rewritten via ${result.model}`;
  console.error(`humanize: ${summary}`);
  // A run that rewrites almost nothing is a near-no-op the chain did not catch.
  if (kept < 5) notice(`only ${summary}`);
  else if (process.env.GITHUB_STEP_SUMMARY) console.log(`humanize: ${summary}`);

  if (has("--dry-run")) {
    console.error("humanize: --dry-run, nothing written");
    process.stdout.write(result.html);
    return;
  }
  if (!result.changed) return console.error("humanize: no change to write");

  writeFileSync(join(folder, "newsletter.raw.html"), html, "utf8");
  writeFileSync(htmlPath, result.html, "utf8");
  console.error("humanize: wrote newsletter.html (original kept as newsletter.raw.html)");
}

if (process.argv[1]?.endsWith("humanize.mjs")) {
  main(process.argv).catch((err) => {
    console.error(`humanize: ${err.stack || err.message}`);
    process.exit(process.env.HUMANIZE_STRICT === "1" ? 1 : 0);
  });
}
