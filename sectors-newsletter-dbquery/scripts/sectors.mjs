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
// in a batch of ten doesn't cost the other nine their fetch.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

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
async function fetchOne(path, key) {
  const url = `https://api.sectors.app/v2/${String(path).replace(/^\/+/, "")}`;
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
      console.error(`HTTP ${result.status} ${result.statusText} for ${result.url}\n${result.body.slice(0, 2000)}`);
      continue;
    }

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
