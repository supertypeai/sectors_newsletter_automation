// Shared spine for the newsletter CI scripts: fail-loudly exit, and one place that
// knows how to talk to the mailroom API. Both callers run unattended in a GitHub
// Action, where a half-understood failure is worse than a stopped job, so every
// helper here either succeeds or exits non-zero with the server's own message.

import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

/** Print and exit non-zero. Every failure path in these scripts goes through here. */
export const die = (msg) => {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
};

/**
 * Frontmatter: a leading `---` block of `key: value` lines. Split on the FIRST
 * colon only, since subjects routinely contain one. Deliberately not a YAML
 * parser: the send path stays dependency-free, and the frontmatter this skill
 * emits is a flat scalar map by contract (see newsletter-format.md).
 */
function frontmatter(md, sourcePath) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) die(`${sourcePath} has no --- frontmatter block`);
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
}

/**
 * Read a delivered issue folder into the pieces every consumer needs. Shared so
 * the test send and the real campaign can never disagree about what the issue's
 * subject, body, date or type actually are.
 */
export function readIssue(folder) {
  const mdPath = join(folder, "newsletter.md");
  const htmlPath = join(folder, "newsletter.html");
  for (const p of [mdPath, htmlPath]) {
    if (!existsSync(p)) die(`missing ${p}. Both newsletter.md and newsletter.html are required.`);
  }

  const fm = frontmatter(readFileSync(mdPath, "utf8"), mdPath);
  const html = readFileSync(htmlPath, "utf8").trim();

  if (!fm.subject) die(`${mdPath} frontmatter has no \`subject\``);
  if (!html) die(`${htmlPath} is empty`);

  // The issue date anchors the campaign's idempotency key. Prefer the frontmatter's
  // own `date` (the authoritative issue date per Hard rule 11); fall back to the
  // folder name, which embeds the same date by the delivery convention.
  const issueDate =
    fm.date || (basename(folder).match(/newsletter_(\d{4}-\d{2}-\d{2})_/) || [])[1];
  if (!issueDate) die("could not determine the issue date from frontmatter or folder name");

  return { fm, html, mdPath, htmlPath, issueDate, issueType: fm.issue_type || "weekly-insights-v2" };
}

/**
 * POST to mailroom and return the parsed JSON body.
 *
 * `body` may be a FormData (sent as multipart, boundary set by fetch) or a plain
 * object (sent as JSON). The Authorization header is added here so no caller has to
 * remember the Bearer prefix, and a non-2xx response is fatal rather than returned,
 * since neither caller has a meaningful way to continue without the response.
 */
export async function postToMailroom(url, { apiKey, body, headers = {}, what = "request" }) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      // Let fetch set Content-Type for FormData: it has to include the multipart
      // boundary, and setting it by hand produces a body the server can't parse.
      ...(isForm ? {} : { "content-type": "application/json" }),
      ...headers,
    },
    body: isForm ? body : JSON.stringify(body),
  });

  const text = await res.text();
  if (!res.ok) die(`${what} failed (${res.status}): ${text}`);

  try {
    return JSON.parse(text);
  } catch {
    die(`${what} returned unparseable JSON: ${text}`);
  }
}
