#!/usr/bin/env node
// Send the drafted issue to a reviewer's inbox, so the PR can be reviewed against a
// real rendering instead of an HTML diff. Email clients are where the bugs actually
// show up: a table that collapses in Outlook, an image a client blocks, a subject
// that truncates in the inbox list. None of that is visible in a diff.
//
// Usage: node send-test.mjs <issue-folder>
//
// Goes through POST /api/v1/emails (transactional), NOT /campaigns, so it cannot
// touch the subscriber list no matter how the workflow is misconfigured: the only
// recipient is MAILROOM_TEST_TO. That safety comes with one honest caveat, worth
// remembering when reviewing:
//
//   A transactional send skips the campaign pipeline, so the test copy has no
//   unsubscribe footer, no List-Unsubscribe header, and no click tracking. Those
//   are injected by /campaigns at real send time. The body, layout, images and
//   subject are identical; the footer you see is not the one subscribers get.
//   /v1/emails also takes no `preheader`, so inbox preview text is not exercised.
//
// The subject is prefixed [TEST], matching what the dashboard's own send-test does,
// so a review copy can never be mistaken for the real issue in your inbox.

import { die, postToMailroom, readIssue } from "./mailroom.mjs";

const folder = process.argv[2];
if (!folder) die("no issue folder given. Usage: send-test.mjs <issue-folder>");

const {
  MAILROOM_API_KEY,
  MAILROOM_EMAIL_URL = "https://mailroom.supertype.ai/api/v1/emails",
  MAILROOM_FROM,
  MAILROOM_TEST_TO,
  DRY_RUN,
} = process.env;

if (!MAILROOM_API_KEY && DRY_RUN !== "1") die("MAILROOM_API_KEY is not set");
if (!MAILROOM_FROM) die("MAILROOM_FROM is not set (must be a verified sender)");
if (!MAILROOM_TEST_TO) die("MAILROOM_TEST_TO is not set (the reviewer's address)");

const { fm, html, issueDate, issueType } = readIssue(folder);

const payload = {
  from: MAILROOM_FROM,
  to: MAILROOM_TEST_TO,
  subject: `[TEST] ${fm.subject}`,
  html,
};

console.log(`issue        : ${issueType} ${issueDate}`);
console.log(`to           : ${payload.to}`);
console.log(`subject      : ${payload.subject}`);
console.log(`html bytes   : ${html.length}`);

if (DRY_RUN === "1") {
  console.log("\nDRY_RUN=1, not sending.");
  process.exit(0);
}

const sent = await postToMailroom(MAILROOM_EMAIL_URL, {
  apiKey: MAILROOM_API_KEY,
  body: payload,
  what: "test send",
});

console.log(`\ntest email sent: ${JSON.stringify(sent)}`);
