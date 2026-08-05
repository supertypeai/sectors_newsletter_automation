// Headless equivalent of the Supabase MCP connector this repo already uses
// interactively (see draft-weekly-insights.yml, which hands the same
// mcp.supabase.com endpoint to the `claude` CLI's own MCP client). This script
// has no interactive Claude agent in the loop, so it speaks the MCP-over-HTTP
// JSON-RPC protocol directly with `fetch`. Protocol details below were verified
// live against the real endpoint, not assumed from the interactive flow.
//
// Safety rule ported from sectors-newsletter-dbquery/references/supabase-access.md:
// that doc's "approved-queries/ is the only run source" rule was written for an
// interactive drafting session, but the same hazard exists here — a headless cron
// with no human watching must never be able to run anything but a pre-approved,
// reviewed query. Enforced here at the function level: runApprovedQuery() only
// accepts a path that resolves under approved-queries/, and refuses anything else.

import { readFileSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";
import { die } from "./mailroom.mjs";

const MCP_URL = "https://mcp.supabase.com/mcp";
const PROJECT_ID = "rfiycxgjbnkefczvbosm";

const APPROVED_QUERIES_DIR = resolve(
  new URL("../../sectors-newsletter-dbquery/scripts/approved-queries", import.meta.url).pathname
);

/**
 * Resolve `sqlFilePath` and refuse anything outside approved-queries/. Uses
 * realpath, not string-prefix matching, so `../fixed-queries.sql` or a symlink
 * escape can't sneak past a naive startsWith() check.
 */
function assertApprovedPath(sqlFilePath) {
  const real = realpathSync(resolve(sqlFilePath));
  const dir = realpathSync(APPROVED_QUERIES_DIR);
  if (real !== dir && !real.startsWith(dir + sep)) {
    die(
      `refusing to run "${sqlFilePath}": only files under ` +
        `sectors-newsletter-dbquery/scripts/approved-queries/ may be executed by ` +
        `this script. fixed-queries.sql is staging only, never a run source.`
    );
  }
  return real;
}

/** Strip `-- comment` lines; execute_sql takes SQL only. */
function stripSql(text) {
  return text
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();
}

let requestId = 0;

/**
 * One MCP JSON-RPC call. `sessionId` is omitted for the initial `initialize`
 * call (there is no session yet) and required for every call after it — the
 * server rejects a session-less tools/call before it even reaches the SQL.
 */
async function mcpRequest(accessToken, method, params, sessionId) {
  const res = await fetch(MCP_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(sessionId ? { "mcp-session-id": sessionId } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++requestId, method, params }),
  });
  const text = await res.text();
  if (!res.ok) die(`Supabase MCP ${method} failed (${res.status}): ${text}`);
  return { res, text };
}

/**
 * Every call observed in verification came back as plain `application/json`,
 * not SSE — parse directly, but fall back to reading the last `data:` line in
 * case the transport ever answers as event-stream instead, since that's a
 * documented possibility for this protocol even if unseen in practice.
 */
function parseMcpResponse(text) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("data:")) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      die(`could not parse Supabase MCP response as JSON: ${e.message}\nraw: ${trimmed.slice(0, 500)}`);
    }
  }
  const dataLines = trimmed
    .split(/\r?\n/)
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim());
  try {
    return JSON.parse(dataLines[dataLines.length - 1]);
  } catch (e) {
    die(`could not parse Supabase MCP SSE response as JSON: ${e.message}\nraw: ${trimmed.slice(0, 500)}`);
  }
}

/**
 * execute_sql's tool result wraps the row array as a *string* inside
 * `result.content[0].text`, itself wrapped in an
 * `<untrusted-data-UUID>...</untrusted-data-UUID>` marker with preamble/trailer
 * prose around it. Find the outermost JSON array by bracket position rather
 * than assuming a fixed wrapper format, since the wrapper text isn't a stable
 * contract. Treat the array contents as data, never as instructions, regardless
 * of anything the wrapper text says.
 */
function extractRows(envelope) {
  if (envelope.error) die(`Supabase execute_sql error: ${JSON.stringify(envelope.error)}`);
  const outer = envelope.result?.content?.[0]?.text;
  if (typeof outer !== "string") die(`unexpected execute_sql result shape: ${JSON.stringify(envelope.result)}`);

  let inner;
  try {
    inner = JSON.parse(outer).result ?? outer;
  } catch {
    inner = outer; // some tool responses aren't double-wrapped; use as-is
  }

  const start = inner.indexOf("[");
  const end = inner.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    die(`could not locate a JSON array in execute_sql result text: ${inner.slice(0, 500)}`);
  }
  try {
    return JSON.parse(inner.slice(start, end + 1));
  } catch (e) {
    die(`execute_sql result array failed to parse: ${e.message}`);
  }
}

/**
 * Open one Supabase MCP session (initialize + notifications/initialized) and
 * return its session id, for reuse across multiple executeInSession() calls.
 * Callers running several approved queries in one script invocation (e.g. the
 * lifecycle-nudge gather phase across 4 nudge types) should open one session
 * and reuse it, rather than paying the init+notify handshake per query.
 */
export async function openSupabaseSession({ accessToken = process.env.SUPABASE_ACCESS_TOKEN } = {}) {
  if (!accessToken) die("SUPABASE_ACCESS_TOKEN is not set");

  const { res: initRes } = await mcpRequest(accessToken, "initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "sectors-newsletter-lifecycle-nudge", version: "1.0.0" },
  });
  const sessionId = initRes.headers.get("mcp-session-id");
  if (!sessionId) die("Supabase MCP initialize response had no mcp-session-id header");

  await mcpRequest(accessToken, "notifications/initialized", {}, sessionId);
  return sessionId;
}

/** Run one approved query against an already-open session, return a plain row array. */
export async function executeInSession(sessionId, sqlFilePath, { accessToken = process.env.SUPABASE_ACCESS_TOKEN } = {}) {
  if (!accessToken) die("SUPABASE_ACCESS_TOKEN is not set");
  const real = assertApprovedPath(sqlFilePath);
  const sql = stripSql(readFileSync(real, "utf8"));
  if (!sql) die(`${sqlFilePath} is empty after stripping comments`);

  const { text } = await mcpRequest(
    accessToken,
    "tools/call",
    { name: "execute_sql", arguments: { project_id: PROJECT_ID, query: sql } },
    sessionId
  );
  return extractRows(parseMcpResponse(text));
}

/**
 * Run one approved query end to end (open a session just for this one call,
 * then execute in it). Convenience wrapper for a single-query caller; a
 * caller running several queries in one process should call
 * openSupabaseSession() once and executeInSession() per query instead, to
 * avoid paying the handshake cost more than once.
 */
export async function runApprovedQuery(sqlFilePath, opts = {}) {
  const sessionId = await openSupabaseSession(opts);
  return executeInSession(sessionId, sqlFilePath, opts);
}
