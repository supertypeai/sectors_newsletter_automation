// Usage:
//   node lifecycle-nudge.mjs enroll [--only=key1,key2]
//   node lifecycle-nudge.mjs cancel --nudge=insider-nudge
//   node lifecycle-nudge.mjs cancel --nudge=setup-nudge
//
// Four lifecycle nudge types compete for the same one-email-per-contact slot:
// quota-cycle-renewal, credits-expiring, insider-nudge, setup-nudge. None of
// their approved queries excludes rows matching another's criteria, so the
// same contact can genuinely qualify for more than one at once. Enroll mode
// resolves that by a strict TIER order (see NUDGES below) and enrolls each
// contact in at most one, in a single coordinated pass across every type at
// or above the tier being decided: a purely sequential per-type loop would
// miss a contact who's already active in a lower-tier sequence and only
// becomes newly eligible for a higher-tier one this run, since that requires
// knowing every relevant sequence's current active set before deciding
// anything, not just the ones visited so far. Exclusion between tiers is
// same-day/same-run only, not permanent — see the decide phase below for why.
//
// The two nudge families also run on genuinely different cadences in
// practice (quota-cycle-renewal weekly, the other three monthly) — that's
// what --only exists for: it restricts which types get ACTED on this
// invocation without losing cross-type correctness, since every type up to
// the least-urgent --only entry's tier still gets queried and still
// participates in deciding who's already spoken for. See
// lifecycle-nudge-enroll.yml for how the two cadences actually invoke this.
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

// Priority is a strict TIER order, not "tied" between credits-expiring and
// quota-cycle-renewal: quota-cycle-renewal outranks credits-expiring (tier 1
// vs 2), which outranks insider-nudge/setup-nudge (tied at tier 3, still
// genuinely tied since their tier conditions are mutually exclusive — no
// contact can ever be a candidate for both). Reordering renewal above
// credits is what lets the weekly renewal-only run skip credits-expiring's
// query entirely (nothing outranks tier 1, so it never has to defer to
// anything) — see requiredQueryKeys() below.
//
// Deliberately decided: cross-tier exclusion is SAME-DAY/SAME-RUN only, not
// permanent. Winning quota-cycle-renewal this month and becoming eligible
// for credits-expiring next month is fine — the only thing to prevent is
// two DIFFERENT sequences both going active for the same contact at once.
// (An earlier version of this also permanently excluded anyone ever
// enrolled in a higher tier, closing a real gap where a contact could win a
// higher tier, have it complete within days, and slip through a later
// lower-tier run once that tier's own fresh query no longer returned them —
// reverted, since that was stricter than actually wanted: it prevented the
// explicitly-desired "different months, both fine" case too.)
const NUDGES = [
  {
    key: "quota-cycle-renewal",
    tier: 1,
    triggerEvent: "sectors_quota_renewal",
    // days_into_cycle is computed in SQL now, not here — it's a plain returned
    // column like monthly_quota/plan_tier, no extraVars hook needed.
    queryPath: approvedQueryPath("credit-plan-lifecycle-quota-cycle-renewal.sql"),
  },
  {
    key: "credits-expiring",
    tier: 2,
    triggerEvent: "sectors_credits_expiring",
    queryPath: approvedQueryPath("credit-plan-lifecycle-credits-expiring.sql"),
    extraVars: (row) => ({ expiry_date: formatExpiryDate(row) }),
  },
  {
    key: "insider-nudge",
    tier: 3,
    triggerEvent: "sectors_insider_nudge",
    queryPath: approvedQueryPath("insider-nudge.sql"),
    extraVars: (row) => ({ unused_value: formatUnusedValue(row) }),
  },
  {
    key: "setup-nudge",
    tier: 3,
    triggerEvent: "sectors_setup_nudge",
    queryPath: approvedQueryPath("setup-nudge.sql"),
    extraVars: (row) => ({ unused_value: formatUnusedValue(row) }),
  },
];
const NUDGES_BY_KEY = Object.fromEntries(NUDGES.map((n) => [n.key, n]));
const TIERS_ASCENDING = [...new Set(NUDGES.map((n) => n.tier))].sort((a, b) => a - b);

/**
 * Which NUDGES keys actually need their Supabase query run for a given
 * --only set: the --only entries themselves, plus any type in a strictly
 * more-urgent tier than SOME --only entry (it could steal that entry's
 * candidates, so its eligibility has to be known). Same-tier siblings of an
 * --only entry are never included just for that reason — same tier means no
 * deferral between them.
 */
function requiredQueryKeys(onlyKeys) {
  const onlyTiers = onlyKeys.map((k) => NUDGES_BY_KEY[k].tier);
  return new Set(NUDGES.filter((n) => onlyKeys.includes(n.key) || onlyTiers.some((t) => n.tier < t)).map((n) => n.key));
}

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
  // Optional --only=key1,key2 restricts which types can actually be ACTED on
  // this run (e.g. a weekly run doing only quota-cycle-renewal, while
  // credits-expiring/insider-nudge/setup-nudge stay on their own monthly
  // run). Priority resolution still needs every type in a strictly
  // more-urgent tier than an --only entry (it could steal that entry's
  // candidates); same-tier siblings of an --only entry are never needed just
  // for that reason, since same tier means no deferral between them — see
  // requiredQueryKeys() above. (Omit --only to act on all 4, the original
  // behavior.)
  const onlyArg = args.find((a) => a.startsWith("--only="))?.split("=")[1];
  const onlyKeys = onlyArg ? onlyArg.split(",") : null;
  if (onlyKeys) {
    for (const k of onlyKeys) if (!(k in NUDGES_BY_KEY)) die(`--only contains unknown key "${k}". Must be one of: ${NUDGES.map((n) => n.key).join(", ")}`);
  }
  const neededKeys = onlyKeys ? requiredQueryKeys(onlyKeys) : new Set(NUDGES.map((n) => n.key));

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
      const needsQuery = neededKeys.has(n.key);
      const [enrollments, rows] = await Promise.all([
        fetchAllEnrollments(n.sequence.id),
        needsQuery ? executeInSession(sessionId, n.queryPath) : Promise.resolve([]),
      ]);
      console.log(
        needsQuery
          ? `approved query "${n.key}" returned ${rows.length} eligible row(s).`
          : `"${n.key}" skipped this run (same-or-lower tier than everything in --only, can't affect its decisions)`
      );
      return {
        ...n,
        eligibleRows: rows,
        everEnrolled: new Set(enrollments.map((e) => e.email.toLowerCase())),
        active: new Set(enrollments.filter((e) => e.status === "active").map((e) => e.email.toLowerCase())),
      };
    })
  );

  const globallyActiveEmails = new Set(resolved.flatMap((n) => [...n.active]));

  // --- Decide phase: one tier at a time, single claimed set across the whole run ---
  //
  // Deliberately SAME-RUN/SAME-DAY exclusion only, not permanent history:
  // getting quota-cycle-renewal this month and credits-expiring next month
  // is fine — the only thing to prevent is two DIFFERENT sequences both
  // going active for the same contact at once. `claimed` (this run's
  // decisions) and `globallyActiveEmails` (currently active anywhere, from
  // real enrollment status) both cover that; `everEnrolled` still blocks
  // forever, but only within its OWN sequence (unchanged, unrelated to
  // cross-tier timing). An earlier version of this also permanently
  // excluded anyone ever enrolled in a higher tier — reverted, that was
  // stricter than actually wanted.
  const claimed = new Set();
  const winners = []; // { triggerEvent, key, row, extraVars }[]
  for (const tier of TIERS_ASCENDING) {
    const tierEntries = resolved.filter((n) => n.tier === tier);
    for (const n of tierEntries) {
      const toEnroll = n.eligibleRows.filter((r) => {
        const email = r.email.toLowerCase();
        return !n.everEnrolled.has(email) && !globallyActiveEmails.has(email) && !claimed.has(email);
      });
      for (const r of toEnroll) claimed.add(r.email.toLowerCase());
      console.log(
        `${n.key}: ${toEnroll.length} to enroll (eligible, never enrolled in this sequence, not active anywhere, not claimed by a higher-tier nudge this run)`
      );
      winners.push(...toEnroll.map((row) => ({ triggerEvent: n.triggerEvent, key: n.key, row, extraVars: n.extraVars })));
    }
  }

  // Claims from every type still counted above (that's what makes the
  // deferral correct even for types not in --only this run) — but only
  // types actually in --only get acted on. A type outside --only that
  // "won" here isn't enrolled by this run at all; it's just correctly
  // excluded from any --only type below it, and stays a candidate for its
  // own run later.
  const actionable = onlyKeys ? winners.filter((w) => onlyKeys.includes(w.key)) : winners;

  if (DRY) {
    console.log("DRY_RUN=1, not posting. Would enroll:");
    for (const w of actionable) console.log(`  ${w.row.email} -> ${w.key}`);
    process.exit(0);
  }

  // --- Act phase: one combined batch/pace loop across every actionable winner ---
  const payload = actionable.map(({ triggerEvent, row, extraVars }) => {
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
