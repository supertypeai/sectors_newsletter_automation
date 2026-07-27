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

import { die, postToMailroom, readIssue } from "./mailroom.mjs";

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

const { fm, html, issueDate, issueType } = readIssue(folder);

// The skip_draft fixture opens a real PR, and merging it would otherwise create a
// real campaign. Refuse outright: a fixture is for testing the plumbing, never for
// sending. Close that PR rather than merging it.
if (/^\[FIXTURE\]/i.test(fm.subject)) {
  die(
    "this is a skip_draft fixture issue, not a real one, and must never be sent. " +
      "Close the fixture PR instead of merging it."
  );
}

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
