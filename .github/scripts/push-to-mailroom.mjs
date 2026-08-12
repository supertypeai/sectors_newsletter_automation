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
//   - Idempotency-Key    a re-run of this workflow cannot double-send to the list.
//                        Keyed on the issue date, so it is stable across retries.
//   - schedule_at        creates a `scheduled` campaign rather than sending on the
//                        spot, leaving a cancellation/edit window in the mailroom
//                        Review page. Two ways to set it, in priority order:
//                          MAILROOM_SCHEDULE_TIME_WIB="HH:MM" — the next future
//                          occurrence of that wall-clock time in Asia/Jakarta
//                          (fixed UTC+7, Indonesia has no DST, so a plain offset
//                          is correct here — no IANA tz database needed). This is
//                          what draft-weekly-insights.yml uses: drafted ~1am WIB,
//                          scheduled for that same day's 10am WIB, so the ~9-hour
//                          gap between draft and send doubles as the review
//                          window — no extra relative delay needed on top.
//                          MAILROOM_SCHEDULE_DELAY_MINUTES — the older relative
//                          mode (send N minutes from whenever this script
//                          happens to run), for callers with no fixed daily slot.
//                          Set to 0 to send immediately. Ignored if
//                          MAILROOM_SCHEDULE_TIME_WIB is set.
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
  MAILROOM_SCHEDULE_TIME_WIB,
  MAILROOM_SCHEDULE_DELAY_MINUTES = "60",
  DRY_RUN,
} = process.env;

/** Next future UTC instant matching "HH:MM" on a Jakarta (WIB, fixed UTC+7) wall clock. */
function nextWIBOccurrence(hhmm) {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) die(`MAILROOM_SCHEDULE_TIME_WIB must be "HH:MM" (24h), got "${hhmm}"`);
  const [, hh, mm] = m;
  const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
  const now = Date.now();
  const nowWIB = new Date(now + WIB_OFFSET_MS);
  const todayAtTimeWIB = Date.UTC(nowWIB.getUTCFullYear(), nowWIB.getUTCMonth(), nowWIB.getUTCDate(), Number(hh), Number(mm));
  let candidateUTC = todayAtTimeWIB - WIB_OFFSET_MS;
  if (candidateUTC <= now) candidateUTC += 24 * 60 * 60 * 1000; // already passed today — use tomorrow
  return new Date(candidateUTC).toISOString();
}

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

if (MAILROOM_SCHEDULE_TIME_WIB) {
  payload.schedule_at = nextWIBOccurrence(MAILROOM_SCHEDULE_TIME_WIB);
} else {
  const delay = Number(MAILROOM_SCHEDULE_DELAY_MINUTES);
  if (!Number.isFinite(delay) || delay < 0) {
    die(`MAILROOM_SCHEDULE_DELAY_MINUTES must be a non-negative number, got "${MAILROOM_SCHEDULE_DELAY_MINUTES}"`);
  }
  if (delay > 0) {
    payload.schedule_at = new Date(Date.now() + delay * 60_000).toISOString();
  }
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
