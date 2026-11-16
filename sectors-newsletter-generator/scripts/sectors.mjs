#!/usr/bin/env node
// sectors.mjs — one authenticated GET against the Sectors API v2, with the connection
// gotchas handled once instead of re-derived per hand-written curl (the most error-prone
// mechanical step in the pipeline: the raw key with NO Bearer prefix, a real User-Agent or
// Cloudflare returns 403 "error code: 1010", the v2 base URL).
//
//   node scripts/sectors.mjs "company/report/BBCA/?sections=overview,valuation"
//   node scripts/sectors.mjs "companies/?where=pe_ttm > 0 and pe_ttm < 12" --save out.json
//
// Batch form: 2+ paths fetched sequentially in ONE process instead of N serial Bash round
// trips. stdout can only carry one JSON body, so a batch requires --save-dir instead of
// --save: each response lands under a sanitized, collision-safe filename derived from its
// path (see sanitizePathToFilename below).
//
//   node scripts/sectors.mjs "company/report/BBCA/?sections=overview" "daily/BBCA" --save-dir out/
//
// (Considered a delimited-stdout form instead — e.g. NUL-joined JSON blobs — but that pushes
// a fragile parsing contract onto every caller for no real gain over just naming files, so
// --save-dir is what's implemented.)
//
// Pretty JSON goes to stdout (single-path, no --save-dir, only); diagnostics (credits spent
// via the limit-consumption header, save confirmations, per-path status in batch mode) go to
// stderr so piped stdout stays clean JSON. A non-200 response prints status + body to stderr.
// Single-path: that's a hard exit 1. Batch: one path's failure stays loud but does NOT abort
// the remaining paths — the process exits 1 at the end if ANY path failed, so one bad ticker
// in a batch of ten doesn't cost the other nine their fetch. EXCEPTION: a batch aborts when its
// FIRST path fails (smoke test) or after 3 consecutive failures, because that pattern means a
// systematic problem (bad path shape, auth, quota), not one bad ticker.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { homedir } from "node:os";

const here = dirname(fileURLToPath(import.meta.url));

const USAGE =
  'usage: node scripts/sectors.mjs "<path?query>" [--save <file>]\n' +
  '   or: node scripts/sectors.mjs "<path1>" "<path2>" ... --save-dir <dir>\n' +
  '  e.g. node scripts/sectors.mjs "company/report/BBCA/?sections=overview,dividend"\n' +
  '  e.g. node scripts/sectors.mjs "company/report/BBCA/?sections=overview" "daily/BBCA" --save-dir out/\n' +
  "The key comes from SECTORS_API_KEY, else config.json's sectorsApiKey.";

// ---- pure helpers: zero I/O, zero fetch, so selftest.mjs can lock their behavior directly
// (import + call) at 0 API credits instead of exercising them through a live process ----

// One API path -> one filesystem-safe filename for --save-dir. Slashes and query-string
// punctuation (?, &, =) both collapse to "_" — to a person scanning a --save-dir listing
// they're the same kind of structural separator, not meaningfully different. Anything else
// unsafe (spaces, comparison operators from a `where=` clause, etc.) becomes "-". Never
// resolves collisions on its own; sanitizePathsToFilenames (below) is what makes a BATCH of
// paths collision-safe, this one just needs to be deterministic and readable per path.
export function sanitizePathToFilename(path) {
  const trimmed = String(path)
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  const safe = trimmed
    .replace(/[/?&=]/g, "_")
    .replace(/[^a-zA-Z0-9_.-]/g, "-")
    .replace(/_+/g, "_")
    .replace(/-+/g, "-")
    .replace(/^[-_.]+|[-_.]+$/g, "");
  return `${safe || "response"}.json`;
}

// The API 403s any path whose path part lacks a trailing slash ("daily/DEWA" fails,
// "daily/DEWA/" works). Add the slash before any query string, once, here, so no caller can
// forget it. "daily/DEWA?x=1" -> "daily/DEWA/?x=1"; already-slashed paths are untouched.
export function normalizeApiPath(path) {
  const trimmed = String(path).replace(/^\/+/, "");
  const q = trimmed.indexOf("?");
  const base = q >= 0 ? trimmed.slice(0, q) : trimmed;
  const query = q >= 0 ? trimmed.slice(q) : "";
  return `${base.replace(/\/*$/, "")}/${query}`;
}

// Credits are NOT flat per call. Cost rules below are copied from the "Costs ..." line of each
// endpoint page on docs.sectors.app (checked 2026-10-28); everything not listed costs 1.
// Returns { credits, note }: credits is a number, or null when the docs give no upper bound
// for this request shape (the caller then refuses without explicit confirmation).
const count = (query, key, fallback) => {
  const v = query.get(key);
  return v ? v.split(",").filter(Boolean).length : fallback;
};
export function estimateCredits(path) {
  const norm = normalizeApiPath(path);
  const q = norm.indexOf("?");
  const base = q >= 0 ? norm.slice(0, q) : norm;
  const query = new URLSearchParams(q >= 0 ? norm.slice(q + 1) : "");
  if (/^financials\/quarterly\/[^/]+\/$/.test(base)) {
    if (query.get("report_date")) return { credits: 1, note: "1 per quarter, one report_date" };
    const n = Number(query.get("n_quarters"));
    if (n > 0) return { credits: n, note: `1 per quarter, n_quarters=${n}` };
    return { credits: null, note: "1 per quarter and no n_quarters or report_date: returns every quarter on file" };
  }
  const sections = [
    [/^company\/report\/[^/]+\/$/, 8],
    [/^sgx\/company\/report\/[^/]+\/$/, 6],
    [/^klse\/company\/report\/[^/]+\/$/, 4],
    [/^subsector\/report\/[^/]+\/$/, 6],
  ];
  for (const [re, all] of sections) {
    if (re.test(base)) {
      const n = count(query, "sections", all);
      return { credits: n, note: `1 per section, ${n} of ${all}` };
    }
  }
  if (base === "companies/top-changes/") {
    const n = count(query, "classifications", 2) * count(query, "periods", 5);
    return { credits: n, note: "1 per classification x period" };
  }
  if (base === "sgx/companies/top/" || base === "klse/companies/top/") {
    const n = count(query, "classifications", 5);
    return { credits: n, note: "1 per classification" };
  }
  if (base === "corporate-actions/") {
    const n = count(query, "type", 7);
    return { credits: n, note: "1 per action type" };
  }
  if (/^(most-traded|brokers\/top|broker-summary\/[^/]+\/top|broker-activity\/[^/]+\/top)\/$/.test(base)) {
    return { credits: 2, note: "flat 2" };
  }
  if (base === "free-float/") {
    return { credits: null, note: "1 per 100 companies returned, unbounded without a filter" };
  }
  if (query.get("q")) return { credits: 3, note: "natural-language q" };
  return { credits: 1, note: "1 per call (or per page on paginated feeds)" };
}

// Two different paths can sanitize to the identical name (a query string stripped by hand
// vs. left in, or two paths that just happen to collapse the same way) — a real risk once N
// paths land in the same directory from one invocation, where a silent overwrite would look
// exactly like a response that never arrived, zero error. First occurrence of a name keeps
// it plain; every repeat gets a "-2", "-3", ... suffix so nothing is ever overwritten.
export function sanitizePathsToFilenames(paths) {
  const seenCount = new Map();
  return paths.map((path) => {
    const base = sanitizePathToFilename(path);
    const priorCount = seenCount.get(base) ?? 0;
    seenCount.set(base, priorCount + 1);
    if (priorCount === 0) return base;
    const stem = base.slice(0, -".json".length);
    return `${stem}-${priorCount + 1}.json`;
  });
}

// Argument parsing AND validation in one pure function (no fetch, no fs): selftest asserts
// every shape here directly — single-path back-compat, multi-path requiring --save-dir,
// --save/--save-dir mutual exclusivity — without spending a credit or touching disk.
export function parseArgs(argv) {
  const rest = [...argv];

  const saveIdx = rest.indexOf("--save");
  let savePath = null;
  if (saveIdx >= 0) {
    savePath = rest[saveIdx + 1] ?? null;
    rest.splice(saveIdx, 2);
  }

  const saveDirIdx = rest.indexOf("--save-dir");
  let saveDir = null;
  if (saveDirIdx >= 0) {
    saveDir = rest[saveDirIdx + 1] ?? null;
    rest.splice(saveDirIdx, 2);
  }

  const paths = rest;
  const first = paths[0];
  if (!first || first === "-h" || first === "--help") {
    // Same usage text either way; the ONLY difference is exit code, preserved from the
    // pre-batch script (no path at all is a usage error, -h/--help is a normal exit).
    return { kind: "help", exitCode: first ? 0 : 2 };
  }
  if (paths.length > 1 && !saveDir) {
    return {
      kind: "error",
      message:
        `${paths.length} paths given but no --save-dir <dir>: stdout can only carry ONE JSON ` +
        "body, so a batch fetch needs somewhere for every response to land.",
    };
  }
  if (savePath && saveDir) {
    return { kind: "error", message: "--save and --save-dir are mutually exclusive: pick one destination." };
  }
  return { kind: "run", paths, savePath, saveDir };
}

// ---- impure edge: one authenticated GET, reused identically for the single-path and batch
// code paths so the two can never drift on auth headers, credit parsing, or status handling ----
//
// Credit guards (added after a runaway loop burned ~4,800 credits of the shared team quota in
// one hour; cost varies by endpoint, see estimateCredits above):
//   0. pre-flight estimate: uncached paths are priced before any is sent; over
//      SECTORS_CREDIT_CONFIRM (default 5) or any unbounded shape, the run is refused until
//      re-run with SECTORS_CONFIRM=1 (after the user has okayed the spend).
//   1. disk cache: a successful response is reused for SECTORS_CACHE_TTL_H hours (default 12),
//      keyed on the full URL. SECTORS_FRESH=1 bypasses it. Only 200s are cached, so errors retry.
//   2. hourly ledger: live calls are counted in .cache/ledger.json across ALL processes; past
//      SECTORS_MAX_CALLS_PER_HOUR (default 150) the call is refused instead of sent.
//   3. quota errors (MONTHLY_LIMIT_EXCEEDED / 429) abort the whole process, never retry.
// Callers must never loop over dates or symbols without a known, bounded list (an empty 200
// means "no data", not "try the next day").
// Shared across every Sectors skill (carousel, reels, newsletter, publication) because the
// quota is one shared team key; a per-skill dir would give each skill its own hourly cap.
const CACHE_DIR = process.env.SECTORS_CACHE_DIR ?? join(homedir(), ".cache", "sectors-api");
const MAX_CALLS_PER_HOUR = Number(process.env.SECTORS_MAX_CALLS_PER_HOUR ?? 150);
const CACHE_TTL_MS = Number(process.env.SECTORS_CACHE_TTL_H ?? 12) * 3600_000;

const CREDIT_CONFIRM = Number(process.env.SECTORS_CREDIT_CONFIRM ?? 5);

function cacheFile(url) {
  return join(CACHE_DIR, createHash("sha1").update(url).digest("hex") + ".json");
}

function isCached(path) {
  if (process.env.SECTORS_FRESH) return false;
  try {
    const hit = JSON.parse(readFileSync(cacheFile(`https://api.sectors.app/v2/${normalizeApiPath(path)}`), "utf8"));
    return Date.now() - hit.at < CACHE_TTL_MS;
  } catch {
    return false;
  }
}

// Prices the whole invocation before anything is sent. Cached paths are free. Prints the
// estimate always; exits 4 (distinct from HTTP failure's 1) when confirmation is needed.
function preflight(paths) {
  const live = paths.filter((p) => !isCached(p));
  if (live.length === 0) return;
  const priced = live.map((p) => ({ p, ...estimateCredits(p) }));
  const unbounded = priced.filter((x) => x.credits === null);
  const total = priced.reduce((s, x) => s + (x.credits ?? 0), 0);
  console.error(
    `estimated credits: ${unbounded.length ? `${total}+ (unbounded)` : total} for ${live.length} live path(s)`
  );
  if (process.env.SECTORS_CONFIRM) return;
  if (unbounded.length || total > CREDIT_CONFIRM) {
    for (const x of priced) console.error(`  ${x.credits ?? "?"}  ${x.p}  (${x.note})`);
    console.error(
      `REFUSED: estimate exceeds ${CREDIT_CONFIRM} credits${unbounded.length ? " or has an unbounded path" : ""}. ` +
        "Trim the request (n_quarters, report_date, sections) or get the user's okay, then re-run with SECTORS_CONFIRM=1."
    );
    process.exit(4);
  }
}

// Failure guard, shared across processes: errors cost 0 credits but still burn the hourly cap
// and signal a systematic bug (bad path shape, auth, quota). If the last 3 live calls ALL
// failed within 5 minutes, refuse further calls until the cause is fixed (or SECTORS_FORCE=1).
const OUTCOMES_PATH = () => join(CACHE_DIR, "outcomes.json");
function readOutcomes() {
  try {
    return JSON.parse(readFileSync(OUTCOMES_PATH(), "utf8"));
  } catch {
    return [];
  }
}
function recordOutcome(ok) {
  const now = Date.now();
  const kept = readOutcomes().filter((o) => now - o.t < 300_000).slice(-9);
  kept.push({ t: now, ok });
  writeFileSync(OUTCOMES_PATH(), JSON.stringify(kept));
}
function assertNoRecentFailureStreak() {
  if (process.env.SECTORS_FORCE) return;
  const now = Date.now();
  const recent = readOutcomes().filter((o) => now - o.t < 300_000).slice(-3);
  if (recent.length === 3 && recent.every((o) => !o.ok)) {
    throw new Error(
      "refused: the last 3 live Sectors calls all failed in the past 5 minutes. Fix the cause " +
        "(path needs a trailing slash? key? quota?) and test ONE call before retrying. " +
        "SECTORS_FORCE=1 overrides."
    );
  }
}

function reserveLiveCall() {
  mkdirSync(CACHE_DIR, { recursive: true });
  const ledgerPath = join(CACHE_DIR, "ledger.json");
  const now = Date.now();
  let calls = [];
  try {
    calls = JSON.parse(readFileSync(ledgerPath, "utf8")).filter((t) => now - t < 3600_000);
  } catch {
    // no ledger yet
  }
  if (calls.length >= MAX_CALLS_PER_HOUR) {
    throw new Error(
      `refused: ${calls.length} live Sectors calls in the last hour (cap ${MAX_CALLS_PER_HOUR}). ` +
        "Check for a loop, or raise SECTORS_MAX_CALLS_PER_HOUR deliberately."
    );
  }
  calls.push(now);
  writeFileSync(ledgerPath, JSON.stringify(calls));
  return now;
}

// A failed call cost 0 credits, so it must not eat the hourly cap: drop its ledger entry.
function refundLiveCall(stamp) {
  const ledgerPath = join(CACHE_DIR, "ledger.json");
  try {
    const calls = JSON.parse(readFileSync(ledgerPath, "utf8"));
    const i = calls.indexOf(stamp);
    if (i >= 0) calls.splice(i, 1);
    writeFileSync(ledgerPath, JSON.stringify(calls));
  } catch {
    // no ledger, nothing to refund
  }
}

async function fetchOne(path, key) {
  const url = `https://api.sectors.app/v2/${normalizeApiPath(path)}`;
  const cached = cacheFile(url);
  if (!process.env.SECTORS_FRESH) {
    try {
      const hit = JSON.parse(readFileSync(cached, "utf8"));
      if (Date.now() - hit.at < CACHE_TTL_MS) {
        return { url, ok: true, status: 200, statusText: "OK (cache)", body: hit.body, pretty: hit.pretty, credits: "0" };
      }
    } catch {
      // miss
    }
  }
  assertNoRecentFailureStreak();
  const stamp = reserveLiveCall();
  const res = await fetch(url, {
    headers: {
      Authorization: key, // raw key: a "Bearer " prefix is rejected
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) sectors-carousel-skill",
      Accept: "application/json",
    },
  });
  const body = await res.text();
  const credits = res.headers.get("limit-consumption");
  let pretty = body;
  try {
    pretty = JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    // non-JSON 200s (shouldn't happen on this API) pass through verbatim
  }
  recordOutcome(res.ok);
  if (!res.ok) refundLiveCall(stamp);
  if (res.ok) {
    writeFileSync(cached, JSON.stringify({ at: Date.now(), body, pretty }));
  } else if (res.status === 429 || /LIMIT_EXCEEDED/.test(body)) {
    console.error(`QUOTA ERROR from Sectors API, aborting: ${body.slice(0, 300)}`);
    process.exit(3);
  }
  return { url, ok: res.ok, status: res.status, statusText: res.statusText, body, pretty, credits };
}

function loadKey() {
  let key = process.env.SECTORS_API_KEY;
  if (!key) {
    try {
      key = JSON.parse(readFileSync(join(here, "..", "config.json"), "utf8")).sectorsApiKey;
    } catch {
      // fall through to the explicit error below; a missing/broken config.json and a missing
      // env var are the same user-facing problem
    }
  }
  return key;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.kind === "help") {
    console.error(USAGE);
    process.exit(parsed.exitCode);
  }
  if (parsed.kind === "error") {
    console.error(`ERROR: ${parsed.message}\n\n${USAGE}`);
    process.exit(2);
  }

  const key = loadKey();
  if (!key) {
    console.error("ERROR: no API key found. Set SECTORS_API_KEY or put sectorsApiKey in config.json.");
    process.exit(1);
  }

  const { paths, savePath, saveDir } = parsed;
  preflight(paths);

  if (paths.length === 1 && !saveDir) {
    // Single path, no --save-dir: byte-compatible with the pre-batch script. JSON to stdout
    // (or --save file), credits/save confirmation to stderr, loud non-200 to stderr, exit 1.
    const result = await fetchOne(paths[0], key);
    if (result.credits) console.error(`credits: ${result.credits}`);
    if (!result.ok) {
      console.error(`HTTP ${result.status} ${result.statusText} for ${result.url}\n${result.body.slice(0, 2000)}`);
      process.exit(1);
    }
    if (savePath) {
      writeFileSync(savePath, result.pretty);
      console.error(`saved: ${savePath} (${result.pretty.length.toLocaleString()} bytes)`);
    } else {
      console.log(result.pretty);
    }
    return;
  }

  // Batch (2+ paths, or a single path opting into --save-dir for its sanitized-filename
  // behavior). --save-dir is required for 2+ paths, enforced above in parseArgs.
  mkdirSync(saveDir, { recursive: true });
  const filenames = sanitizePathsToFilenames(paths);
  let anyFailed = false;
  let consecutiveFailures = 0;
  let creditsTotal = 0;
  let creditsAllNumeric = true;

  for (let i = 0; i < paths.length; i++) {
    const path = paths[i];
    const filePath = join(saveDir, filenames[i]);
    const result = await fetchOne(path, key);

    if (result.credits) {
      const parsedCredits = Number(result.credits);
      if (Number.isFinite(parsedCredits)) creditsTotal += parsedCredits;
      else creditsAllNumeric = false;
      console.error(`credits: ${result.credits}  (${path})`);
    }

    if (!result.ok) {
      // Loud, but the loop keeps going — one bad path must never cost the rest of the batch.
      anyFailed = true;
      consecutiveFailures++;
      console.error(`HTTP ${result.status} ${result.statusText} for ${result.url}\n${result.body.slice(0, 2000)}`);
      // First path failing is the smoke test failing; 3 in a row is a systematic fault.
      // Either way stop spending calls on the other paths.
      if (i === 0 || consecutiveFailures >= 3) {
        console.error(
          `ABORT: ${i === 0 ? "first path failed (smoke test)" : "3 consecutive failures"}; ` +
            `skipped ${paths.length - i - 1} remaining paths. Fix the cause before retrying.`
        );
        process.exit(1);
      }
      continue;
    }
    consecutiveFailures = 0;

    writeFileSync(filePath, result.pretty);
    console.error(`saved: ${filePath} (${result.pretty.length.toLocaleString()} bytes)`);
  }

  console.error(
    creditsAllNumeric
      ? `total credits: ${creditsTotal}`
      : "total credits: unavailable (a non-numeric limit-consumption value was seen)"
  );
  if (anyFailed) process.exit(1);
}

// Guarded so `import ... from "./sectors.mjs"` (selftest.mjs, testing the pure helpers above)
// never triggers a live fetch or a process.exit — only running this file directly does.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await main();
}
