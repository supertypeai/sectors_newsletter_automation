#!/usr/bin/env node
// Push a delivered newsletter issue to mailroom as a campaign.
//
// Usage: node push-to-mailroom.mjs <issue-folder>
//
// Reads <issue-folder>/newsletter.md for the `subject` / `preview` / `date`
// frontmatter and <issue-folder>/newsletter.html for the body, then POSTs to
// mailroom's POST /v1/campaigns.
//
// Three properties of that endpoint carry the safety of this step, see
// mailroom/src/app/api/v1/campaigns/route.ts:
//   - Idempotency-Key    a re-run of the merge workflow cannot double-send to the
//                        list. Keyed on the issue date, so it is stable across retries.
//   - schedule_at        creates a `scheduled` campaign rather than sending on the
//                        spot, leaving a cancellation window in the mailroom UI.
//                        Set MAILROOM_SCHEDULE_DELAY_MINUTES=0 to send immediately.
//   - series             groups recurring issues into one newsletter for combined
//                        stats; the endpoint documents this exact weekly case.
// The campaign pipeline also skips unsubscribed contacts and injects the unsubscribe
// footer and List-Unsubscribe header, so the newsletter HTML carries none of that.

import { readFileSync, existsSync } from "node:fs";
import { join, basename } from "node:path";
import { die, postToMailroom } from "./mailroom.mjs";

const folder = process.argv[2];
if (!folder) die("no issue folder given. Usage: push-to-mailroom.mjs <issue-folder>");

const {
  MAILROOM_API_KEY,
  MAILROOM_API_URL = "https://mailroom.supertype.ai/api/v1/campaigns",
  MAILROOM_FROM,
  MAILROOM_GROUP_ID,
  MAILROOM_REPLY_TO,
  MAILROOM_SCHEDULE_DELAY_MINUTES = "60",
  DRY_RUN,
} = process.env;

if (!MAILROOM_API_KEY) die("MAILROOM_API_KEY is not set");
if (!MAILROOM_FROM) die("MAILROOM_FROM is not set (must be a verified sender)");

const mdPath = join(folder, "newsletter.md");
const htmlPath = join(folder, "newsletter.html");
for (const p of [mdPath, htmlPath]) {
  if (!existsSync(p)) die(`missing ${p}. Both newsletter.md and newsletter.html are required.`);
}

// Frontmatter: a leading `---` block of `key: value` lines. Split on the FIRST colon
// only, subjects routinely contain one.
function frontmatter(md) {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) die(`${mdPath} has no --- frontmatter block`);
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

const fm = frontmatter(readFileSync(mdPath, "utf8"));
const html = readFileSync(htmlPath, "utf8").trim();

if (!fm.subject) die(`${mdPath} frontmatter has no \`subject\``);
if (!html) die(`${htmlPath} is empty`);

// The issue date anchors the idempotency key. Prefer the frontmatter's own `date`
// (the authoritative issue date per Hard rule 11); fall back to parsing the folder
// name, which embeds the same date by the delivery convention.
const issueDate =
  fm.date || (basename(folder).match(/newsletter_(\d{4}-\d{2}-\d{2})_/) || [])[1];
if (!issueDate) die(`could not determine the issue date from frontmatter or folder name`);

const issueType = fm.issue_type || "weekly-insights-v2";

const payload = {
  from: MAILROOM_FROM,
  subject: fm.subject,
  html,
  name: `${issueType} ${issueDate}`,
  series: issueType,
  ...(fm.preview ? { preheader: fm.preview } : {}),
  ...(MAILROOM_REPLY_TO ? { reply_to: MAILROOM_REPLY_TO } : {}),
  // Exactly one of group_id | audience:"all" is required by the endpoint.
  ...(MAILROOM_GROUP_ID ? { group_id: MAILROOM_GROUP_ID } : { audience: "all" }),
};

const delay = Number(MAILROOM_SCHEDULE_DELAY_MINUTES);
if (!Number.isFinite(delay) || delay < 0) {
  die(`MAILROOM_SCHEDULE_DELAY_MINUTES must be a non-negative number, got "${MAILROOM_SCHEDULE_DELAY_MINUTES}"`);
}
if (delay > 0) {
  payload.schedule_at = new Date(Date.now() + delay * 60_000).toISOString();
}

const idempotencyKey = `${issueType}_${issueDate}`;

console.log(`issue folder : ${folder}`);
console.log(`subject      : ${payload.subject}`);
console.log(`series       : ${payload.series}`);
console.log(`audience     : ${payload.group_id ? `group ${payload.group_id}` : "all contacts"}`);
console.log(`schedule     : ${payload.schedule_at ?? "immediate"}`);
console.log(`idempotency  : ${idempotencyKey}`);
console.log(`html bytes   : ${html.length}`);

if (DRY_RUN === "1") {
  console.log("\nDRY_RUN=1, not posting.");
  process.exit(0);
}

const campaign = await postToMailroom(MAILROOM_API_URL, {
  apiKey: MAILROOM_API_KEY,
  body: payload,
  headers: { "idempotency-key": idempotencyKey },
  what: "campaign create",
});

console.log(`\nmailroom accepted the campaign: ${JSON.stringify(campaign)}`);
