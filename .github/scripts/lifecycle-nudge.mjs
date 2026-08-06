// Usage:
//   node lifecycle-nudge.mjs enroll
//   node lifecycle-nudge.mjs cancel --nudge=insider-nudge
//   node lifecycle-nudge.mjs cancel --nudge=setup-nudge
//
// Four lifecycle nudge types compete for the same one-email-per-contact slot:
// credits-expiring, quota-cycle-renewal, insider-nudge, setup-nudge. None of
// their approved queries excludes rows matching another's criteria, so the
// same contact can genuinely qualify for more than one at once. Enroll mode
// resolves that by priority (array order below — most urgent first) and
// enrolls each contact in at most one, in a single coordinated pass across
// all 4 types: a purely sequential per-type loop would miss a contact who's
// already active in a *lower*-priority sequence from a previous run and only
// becomes newly eligible for a *higher*-priority one this run, since that
// requires knowing all 4 sequences' current active sets before deciding
// anything, not just the ones visited so far.
//
// Cancel mode is unaffected by any of this and stays single-type, exactly as
// before: `credits-expiring`/`quota-cycle-renewal` are single-step sequences
// (fire once, no later step to go stale), so there's nothing for a cancel
// check to protect against for them — only `insider-nudge`/`setup-nudge` have
// a +30-day second step worth guarding.
//
// "Never re-enroll" is enforced per-sequence (not cross-type) by excluding
// anyone who has EVER appeared in THAT sequence's enrollment history (any
// status), because mailroom's own enrollContactsInSequence only guards
// against a currently-active duplicate (src/lib/drip.ts). This is a
// permanent, per-sequence block even for the two recurring billing-event
// types (credits-expiring/quota-cycle-renewal) — a deliberate v1 tradeoff: a
// missed second nudge months later, not a duplicate-send risk. Revisit only
// if that turns out to matter in practice.

import { die, getFromMailroom, postToMailroom } from "./mailroom.mjs";
import { openSupabaseSession, executeInSession, runApprovedQuery } from "./query-supabase.mjs";

function approvedQueryPath(file) {
  return new URL(`../../sectors-newsletter-dbquery/scripts/approved-queries/${file}`, import.meta.url).pathname;
}

/**
 * `{{unused_value}}`: credits and/or monthly_quota, whichever the row
 * actually has, joined with "and" if both are nonzero. setup-nudge rows never
 * carry monthly_quota (its query doesn't select it), so this naturally
 * degrades to "always credits" for that type with no special-casing.
 */
function formatUnusedValue(row) {
  const parts = [];
  if (row.credits > 0) parts.push(`${row.credits} credit${row.credits === 1 ? "" : "s"}`);
  if (row.monthly_quota > 0) parts.push(`${row.monthly_quota} in monthly quota`);
  return parts.join(" and ");
}

/**
 * `{{expiry_date}}`: credits_expire_at is a raw timestamp, not display-ready.
 * `timeZone: "UTC"` is required, not cosmetic: without it, toLocaleDateString
 * falls back to the runner's local timezone, and a UTC-midnight timestamp
 * rolls back to the previous calendar day on any negative-UTC-offset machine
 * (verified: renders as "Aug 17" instead of "Aug 18" on US Pacific for the
 * same input) — silently understating the real expiry date by a day.
 */
function formatExpiryDate(row) {
  return new Date(row.credits_expire_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

// Priority order = array order, most urgent first. insider-nudge/setup-nudge
// are effectively tied (their tier conditions are mutually exclusive, so no
// contact can ever be a candidate for both), listed last since neither is
// time-boxed the way the other two are.
const NUDGES = [
  {
    key: "credits-expiring",
    triggerEvent: "sectors_credits_expiring",
    queryPath: approvedQueryPath("credit-plan-lifecycle-credits-expiring.sql"),
    extraVars: (row) => ({ expiry_date: formatExpiryDate(row) }),
  },
  {
    key: "quota-cycle-renewal",
    triggerEvent: "sectors_quota_renewal",
    // days_into_cycle is computed in SQL now, not here — it's a plain returned
    // column like monthly_quota/plan_tier, no extraVars hook needed.
    queryPath: approvedQueryPath("credit-plan-lifecycle-quota-cycle-renewal.sql"),
  },
  {
    key: "insider-nudge",
    triggerEvent: "sectors_insider_nudge",
    queryPath: approvedQueryPath("insider-nudge.sql"),
    extraVars: (row) => ({ unused_value: formatUnusedValue(row) }),
  },
  {
    key: "setup-nudge",
    triggerEvent: "sectors_setup_nudge",
    queryPath: approvedQueryPath("setup-nudge.sql"),
    extraVars: (row) => ({ unused_value: formatUnusedValue(row) }),
  },
];
const NUDGES_BY_KEY = Object.fromEntries(NUDGES.map((n) => [n.key, n]));

const args = process.argv.slice(2);
const mode = args[0]; // "enroll" | "cancel"
if (mode !== "enroll" && mode !== "cancel") die('first argument must be "enroll" or "cancel"');

const { MAILROOM_API_KEY, MAILROOM_API_BASE = "https://mailroom.supertype.ai/api/v1", DRY_RUN } = process.env;
if (!MAILROOM_API_KEY) die("MAILROOM_API_KEY is not set");
const DRY = DRY_RUN === "1";

/** Every sequence on this account, fetched once and paginated — reused to resolve all `NUDGES` entries in one pass. */
async function fetchAllSequences() {
  const all = [];
  let cursor;
  for (;;) {
    const url = new URL(`${MAILROOM_API_BASE}/sequences`);
    if (cursor) url.searchParams.set("cursor", cursor);
    url.searchParams.set("limit", "100");
    const page = await getFromMailroom(url.toString(), { apiKey: MAILROOM_API_KEY, what: "list sequences" });
    all.push(...page.data);
    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
  return all;
}

/** Every enrollment this sequence has ever had, any status, paginated. */
async function fetchAllEnrollments(sequenceId) {
  const all = [];
  let cursor;
  for (;;) {
    const url = new URL(`${MAILROOM_API_BASE}/sequences/${sequenceId}/enrollments`);
    if (cursor) url.searchParams.set("cursor", cursor);
    url.searchParams.set("limit", "500");
    const page = await getFromMailroom(url.toString(), { apiKey: MAILROOM_API_KEY, what: "list sequence enrollments" });
    all.push(...page.enrollments);
    if (!page.next_cursor) break;
    cursor = page.next_cursor;
  }
  return all;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** String-coerce every value for the mailroom vars payload (vars are Record<string,string>). */
function toStringVars(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]));
}

if (mode === "cancel") {
  const nudgeArg = args.find((a) => a.startsWith("--nudge="))?.split("=")[1];
  if (!nudgeArg || !(nudgeArg in NUDGES_BY_KEY)) die(`--nudge must be one of: ${NUDGES.map((n) => n.key).join(", ")}`);
  const { triggerEvent, queryPath } = NUDGES_BY_KEY[nudgeArg];

  const sequences = await fetchAllSequences();
  const sequence = sequences.find((s) => s.trigger_event === triggerEvent);
  if (!sequence) die(`no sequence found with trigger_event="${triggerEvent}". Create it in mailroom first.`);
  console.log(`sequence: ${sequence.id} (${sequence.name}, status=${sequence.status})`);

  const enrollments = await fetchAllEnrollments(sequence.id);
  const activeEmails = new Set(enrollments.filter((e) => e.status === "active").map((e) => e.email.toLowerCase()));

  const eligibleRows = await runApprovedQuery(queryPath);
  const eligibleEmails = new Set(eligibleRows.map((r) => r.email.toLowerCase()));
  console.log(`approved query "${nudgeArg}" returned ${eligibleRows.length} eligible row(s).`);

  // Active enrollments whose contact no longer appears in this run's fresh
  // eligibility query — cancelled before their +30-day walkthrough step would
  // fire. This is the entire mechanism for "don't receive the drips if no
  // longer eligible" — mailroom's drip worker only ever processes
  // status:"active" enrollments, so cancelling here is sufficient on its own.
  const toCancel = [...activeEmails].filter((email) => !eligibleEmails.has(email));
  console.log(`to cancel (active, no longer eligible): ${toCancel.length}`);

  if (DRY) {
    console.log("DRY_RUN=1, not posting. Would cancel:");
    for (const email of toCancel) console.log(`  ${email}`);
    process.exit(0);
  }

  const batches = chunk(toCancel, 200); // API_SEQUENCES_CANCEL_MAX_EMAILS
  for (const [i, batch] of batches.entries()) {
    const result = await postToMailroom(`${MAILROOM_API_BASE}/sequences/${sequence.id}/enrollments/cancel`, {
      apiKey: MAILROOM_API_KEY,
      body: { emails: batch },
      what: "cancel enrollments",
    });
    console.log(`batch ${i + 1}/${batches.length}: cancelled ${result.cancelled.length}, skipped ${result.skipped.length} of ${batch.length}`);
    if (i < batches.length - 1) await sleep(2500); // stay under API_SEQUENCES_WRITE_PER_MINUTE (30/min)
  }
} else {
  // --- Gather phase: full visibility into all 4 sequences BEFORE any decision ---
  const allSequences = await fetchAllSequences();
  const resolvedBase = NUDGES.map((n) => {
    const sequence = allSequences.find((s) => s.trigger_event === n.triggerEvent);
    if (!sequence) die(`no sequence found with trigger_event="${n.triggerEvent}". Create it in mailroom first.`);
    return { ...n, sequence };
  });

  const sessionId = await openSupabaseSession();
  const resolved = await Promise.all(
    resolvedBase.map(async (n) => {
      const [enrollments, rows] = await Promise.all([fetchAllEnrollments(n.sequence.id), executeInSession(sessionId, n.queryPath)]);
      console.log(`approved query "${n.key}" returned ${rows.length} eligible row(s).`);
      return {
        ...n,
        eligibleRows: rows,
        everEnrolled: new Set(enrollments.map((e) => e.email.toLowerCase())),
        active: new Set(enrollments.filter((e) => e.status === "active").map((e) => e.email.toLowerCase())),
      };
    })
  );

  const globallyActiveEmails = new Set(resolved.flatMap((n) => [...n.active]));

  // --- Decide phase: priority order, single claimed set across the whole run ---
  const claimed = new Set();
  const winners = []; // { triggerEvent, key, row, extraVars }[]
  for (const n of resolved) {
    const toEnroll = n.eligibleRows.filter((r) => {
      const email = r.email.toLowerCase();
      return !n.everEnrolled.has(email) && !globallyActiveEmails.has(email) && !claimed.has(email);
    });
    for (const r of toEnroll) claimed.add(r.email.toLowerCase());
    console.log(
      `${n.key}: ${toEnroll.length} to enroll (eligible, never enrolled in this sequence, not active anywhere, not claimed by a higher-priority nudge this run)`
    );
    winners.push(...toEnroll.map((row) => ({ triggerEvent: n.triggerEvent, key: n.key, row, extraVars: n.extraVars })));
  }

  if (DRY) {
    console.log("DRY_RUN=1, not posting. Would enroll:");
    for (const w of winners) console.log(`  ${w.row.email} -> ${w.key}`);
    process.exit(0);
  }

  // --- Act phase: one combined batch/pace loop across ALL winners, all types ---
  const payload = winners.map(({ triggerEvent, row, extraVars }) => {
    const { email, user_id: _user_id, ...rest } = row;
    return { email, event: triggerEvent, vars: { ...toStringVars(rest), ...(extraVars?.(row) ?? {}) } };
  });

  const batches = chunk(payload, 100); // API_EVENTS_BATCH_MAX
  for (const [i, batch] of batches.entries()) {
    const result = await postToMailroom(`${MAILROOM_API_BASE}/events/batch`, {
      apiKey: MAILROOM_API_KEY,
      body: batch,
      what: "events batch (enroll)",
    });
    const failed = result.data.filter((d) => !d.ok);
    if (failed.length > 0) console.error(`${failed.length} enroll item(s) failed:`, failed);
    const newlyEnrolled = result.data.filter((d) => d.ok && d.enrolled > 0).length;
    console.log(`batch ${i + 1}/${batches.length}: ${newlyEnrolled} newly enrolled of ${batch.length}`);
    if (i < batches.length - 1) await sleep(6500); // stay under API_EVENTS_BATCH_PER_MINUTE (10/min), across all types combined
  }
}
