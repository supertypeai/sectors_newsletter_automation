// Keep mailroom's STANDARD/INSIDER segments (Contact.tags-filtered, confirmed
// tier-only) in sync with the real Sectors subscription tier in Supabase. Those
// segments drive audience targeting for the Week 2 calendar sends
// (three-stock-story, single-company-deep-dive) — see draft-week2-content.yml.
//
// Diff-based, not "PATCH everyone every run": read mailroom's current
// STANDARD/INSIDER segment membership and Supabase's real tier data fully first,
// decide who actually needs to change, act only on those — same gather-then-decide
// shape lifecycle-nudge.mjs already uses. Blind per-contact PATCHing every run would
// touch every contact's updatedAt even when nothing changed, for no reason.
//
// Deliberately never fetches or writes a literal "FREE" tag/segment. Nothing
// downstream ever targets one (three-stock-story targets a group minus the INSIDER
// segment; single-company-deep-dive targets the INSIDER segment directly) — a real
// FREE user just needs to not be stuck in STANDARD or INSIDER, which is a tag clear,
// not a tag to maintain. tier-sync.sql is narrowed to STANDARD/INSIDER rows only for
// exactly this reason: a downgrade to FREE (or to inactive/staff/cancelled) is
// detected by that email's absence from the narrowed query, not by a FREE row.
//
// Usage: node sync-tier-tags.mjs

import { die, getFromMailroom, patchToMailroom } from "./mailroom.mjs";
import { runApprovedQuery } from "./query-supabase.mjs";

const approvedQueryPath = new URL(
  "../../sectors-newsletter-dbquery/scripts/approved-queries/tier-sync.sql",
  import.meta.url
).pathname;

const {
  MAILROOM_API_KEY,
  MAILROOM_API_BASE = "https://mailroom.supertype.ai/api/v1",
  MAILROOM_STANDARD_SEGMENT_ID,
  MAILROOM_INSIDER_SEGMENT_ID,
  DRY_RUN,
} = process.env;

if (!MAILROOM_API_KEY) die("MAILROOM_API_KEY is not set");
if (!MAILROOM_STANDARD_SEGMENT_ID) die("MAILROOM_STANDARD_SEGMENT_ID is not set");
if (!MAILROOM_INSIDER_SEGMENT_ID) die("MAILROOM_INSIDER_SEGMENT_ID is not set");
const DRY = DRY_RUN === "1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Paginate GET /contacts into an email -> contact id map. With a segmentId, that's
 * the segment's current membership (who mailroom believes is STANDARD/INSIDER right
 * now); without one, it's every subscribed contact on the account.
 *
 * Both are needed, and they answer different questions. Segment membership is the
 * current-tag signal deliberately — reading the segment asks "who would a campaign
 * targeting this segment actually reach", which stays correct even if the segment's
 * own rule is later edited; reading Contact.tags directly would silently drift from
 * the thing the send actually uses. But segment membership can't resolve a contact
 * who has NO tier tag yet, and that's exactly the new-upgrade case this sync exists
 * to fix — so the full list supplies the PATCH target id for everyone else.
 */
async function fetchContacts({ segmentId } = {}) {
  const byEmail = new Map();
  let cursor;
  for (;;) {
    const url = new URL(`${MAILROOM_API_BASE}/contacts`);
    if (segmentId) url.searchParams.set("segment_id", segmentId);
    url.searchParams.set("limit", "500");
    if (cursor) url.searchParams.set("cursor", cursor);
    const page = await getFromMailroom(url.toString(), {
      apiKey: MAILROOM_API_KEY,
      what: segmentId ? "list contacts by segment" : "list contacts",
    });
    for (const c of page.contacts) byEmail.set(c.email.toLowerCase(), c.id);
    if (!page.next_cursor) break;
    cursor = page.next_cursor;
  }
  return byEmail;
}

console.log("fetching mailroom contacts (all, plus current STANDARD/INSIDER segment membership)...");
const [allByEmail, standardByEmail, insiderByEmail] = await Promise.all([
  fetchContacts(),
  fetchContacts({ segmentId: MAILROOM_STANDARD_SEGMENT_ID }),
  fetchContacts({ segmentId: MAILROOM_INSIDER_SEGMENT_ID }),
]);
console.log(`  all: ${allByEmail.size}, STANDARD: ${standardByEmail.size}, INSIDER: ${insiderByEmail.size}`);

console.log("fetching real tier data from Supabase (STANDARD/INSIDER only)...");
const tierRows = await runApprovedQuery(approvedQueryPath);
console.log(`  ${tierRows.length} row(s)`);

// Diff. Two directions:
//   1. Real STANDARD/INSIDER row whose current segment doesn't match -> write the
//      real tier (covers new upgrades and tier changes between the two).
//   2. Currently in STANDARD or INSIDER in mailroom, but NOT in this run's Supabase
//      result at all -> the tag is stale (downgraded to FREE, or dropped out of the
//      base filter — inactive/cancelled/now staff) -> clear it.
// Keyed by contactId, not appended to an array, so a contact somehow present in
// BOTH segments at once (corrupted/dual-tagged data — tags is a plain string
// field, so this is possible even though it's meant to be tier-only) gets at most
// one write this run, not one per segment it happened to be found in.
const realTierByEmail = new Map();
const toWrite = new Map(); // contactId -> { email, tag }
let notASubscriber = 0;

for (const row of tierRows) {
  const email = row.email.toLowerCase();
  realTierByEmail.set(email, row.subscription_tier);
  const currentSegment = standardByEmail.has(email) ? "STANDARD" : insiderByEmail.has(email) ? "INSIDER" : null;
  if (currentSegment === row.subscription_tier) continue; // already correct
  // Resolved from the FULL contact list, not the segments: a contact with no tier
  // tag yet is in neither segment, and that's precisely the case needing a write.
  const contactId = allByEmail.get(email);
  if (!contactId) {
    // A Sectors user who isn't a subscribed mailroom contact. Deliberately never
    // created here — this sync tags existing subscribers, it does not add people
    // to the mailing list.
    notASubscriber++;
    continue;
  }
  toWrite.set(contactId, { email, tag: row.subscription_tier });
}

for (const [email, contactId] of [...standardByEmail, ...insiderByEmail]) {
  if (!realTierByEmail.has(email)) {
    toWrite.set(contactId, { email, tag: "" });
  }
}

if (notASubscriber > 0) {
  console.log(`\n${notASubscriber} Supabase tier row(s) have no subscribed mailroom contact — skipped, never auto-created.`);
}

console.log(`\n${toWrite.size} contact(s) need a tag change:`);
for (const [, w] of toWrite) console.log(`  ${w.email} -> ${w.tag || "(cleared)"}`);

if (DRY) {
  console.log("\nDRY_RUN=1, not posting.");
  process.exit(0);
}

const entries = [...toWrite];
let updated = 0;
for (const [i, [contactId, w]] of entries.entries()) {
  await patchToMailroom(`${MAILROOM_API_BASE}/contacts/${contactId}`, {
    apiKey: MAILROOM_API_KEY,
    body: { tags: w.tag },
    what: "update contact tags",
  });
  updated++;
  if (i < entries.length - 1) await sleep(1100); // stay under API_CONTACTS_WRITE_PER_MINUTE (60/min)
}

console.log(`\nupdated ${updated} contact(s).`);
