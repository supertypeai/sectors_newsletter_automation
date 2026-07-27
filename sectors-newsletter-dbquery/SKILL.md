---
name: sectors-newsletter-dbquery
description: >-
  Generate an on-brand, personalized lifecycle/CRM email for Sectors users, backed by
  live Supabase user-account data and cited market context. Use whenever the user wants
  to write, draft, or produce a Sectors lifecycle or transactional-adjacent email, the
  category the sibling `sectors-newsletter-generator` skill explicitly declines because
  it has no user-account access. Handles five built issue types: ONBOARDING NUDGE
  (never started onboarding), ONBOARDING UNCLAIMED REWARD (started onboarding but
  hasn't claimed the completion credits), CREDIT-PLAN-LIFECYCLE CREDITS-EXPIRING
  (credit balance expiring soon), CREDIT-PLAN-LIFECYCLE QUOTA-CYCLE-RENEWAL
  (25+ days into the current monthly quota cycle), and NOTIFICATION SETUP NUDGE (has
  spendable credits or quota but never set up a watchlist or workflow/alert). Every
  issue type pulls its audience and personalization fields through the Supabase MCP
  connector using ONE individually-approved SQL query per type, living in
  `scripts/approved-queries/`, the only folder this skill is ever allowed to run a
  query from, never an ad-hoc query written per run. Trigger on phrases like "write
  the onboarding nudge", "unclaimed-reward nudge", "credit-expiry reminder", "quota
  renewal reminder", "notification setup nudge". This skill also supplies one
  data-only query, `watchlist-tracked-interest`, that just returns each user's tracked
  tickers/sectors (no drafting, no delivery folder) for the sibling
  `sectors-newsletter-generator` skill's personalized ticker/sector performance +
  peer comparison newsletter, invoked when that skill determines the Sectors API alone
  can't supply the personalization it needs. Do NOT
  use it for market-wide content with no per-user personalization (weekly wrap,
  macro-reaction, sector spotlight, company deep dives, three-stock stories,
  feature-release or event announcements), those stay with
  `sectors-newsletter-generator`. Do NOT use it for Instagram carousels or video.
---

# Sectors Lifecycle Newsletter Generator

The sibling `sectors-newsletter-generator` skill can't touch lifecycle/CRM email
because it has no user-account data. This skill exists to fill exactly that gap: it
reads real per-user rows from Supabase (via the Supabase MCP connector, read-only,
project-scoped) and turns them into a personalized, on-brand email template. It inherits
`sectors-newsletter-generator`'s brand voice and non-advice discipline wholesale, and
adds two disciplines of its own:

- **Fixed query only.** Every issue type has exactly one individually-approved SQL
  query living in `scripts/approved-queries/<slug>.sql`, the only folder this skill
  ever runs a query from. `scripts/fixed-queries.sql` is a staging area for drafting
  a new one, never a run source. Never write, edit, or improvise SQL against
  production tables mid-run. See `references/supabase-access.md`, read it before
  touching the Supabase MCP tool for the first time in a session.
- **Template, not a batch send.** This skill drafts one reusable per-recipient template
  (subject line, body, merge-tag placeholders) and validates it against real sample
  rows pulled by the fixed query. It does not bulk-render or send individualized emails
  to every eligible user, that is the downstream ESP/CRM system's job. See Delivery
  below.

## Pick the issue type (always first)

**One issue per run.** Five issue types are built, across three families:

1. **Onboarding nudge** (`onboarding-nudge`) — re-engage a user who has zero rows in
   both `onboarding_progress` and `onboarding_claims`, i.e. never started onboarding
   at all.
2. **Onboarding unclaimed reward** (`onboarding-unclaimed-reward`) — a user has
   started onboarding (has `onboarding_progress` rows) but has never claimed the
   completion reward (zero `onboarding_claims` rows). Nudge them to finish the quest
   and claim the free 500 credits.
3. **Credit/plan lifecycle, credits-expiring** (`credit-plan-lifecycle-credits-expiring`)
   — a user's credit balance expires within 14 days.
4. **Credit/plan lifecycle, quota-cycle-renewal** (`credit-plan-lifecycle-quota-cycle-renewal`)
   — a user on a real monthly quota (`monthly_quota > 0`) is 25+ days into their
   current cycle, renewal is coming up soon.
5. **Notification setup nudge** (`notification-setup-nudge`) — a user has spendable
   credits or quota (`credits > 0` or `monthly_quota > 0`) but zero `user_watchlist`
   and zero `user_workflow` rows, i.e. nothing set up to actually use that value.

Each maps to a workflow doc in `references/workflows/`. **Skip the menu when the ask
already resolves it**: if the user names the type ("write the credit-expiry email"), go
straight into that pipeline. A bare "write a lifecycle email" with no type named gets
the five-item menu.

### Not yet built
Other CRM-shaped content this skill's engine *could* produce but doesn't have an
approved query or workflow doc for yet: value-recap, NPS/feedback-request emails, a
win-back/subscription-cancellation nudge. If asked for any of these, say it's not
built, and that building it starts with drafting a candidate query in
`scripts/fixed-queries.sql`, getting it explicitly approved, then adding it to
`scripts/approved-queries/`, never with an ad-hoc query as a workaround.

### Out of scope (do not attempt here)
Anything that is market-wide content with no per-user personalization belongs to
`sectors-newsletter-generator`, not here: weekly wrap, daily market pulse,
macro-reaction, three-stock story, single-company deep dive, sector spotlight, new
feature release, upcoming event. If the user asks for one of these, say so and hand off
to that skill.

### Data-only queries for the sibling skill (not a dbquery issue type)
`scripts/approved-queries/watchlist-tracked-interest.sql` is a different kind of
approved query: it doesn't back a dbquery-drafted lifecycle email at all. It exists so
`sectors-newsletter-generator` can get each user's tracked tickers/sectors (unioned
from `user_watchlist` and active `user_workflow` rows) when drafting its personalized
ticker/sector performance + peer comparison newsletter, an issue type that skill owns
and drafts, this skill only supplies the audience query. When invoked for this
purpose: **run the approved query and return the raw rows, stop there.** No template,
no `newsletter.md`, no delivery folder, none of the shared pipeline shape below
applies, that shape is for this skill's own five lifecycle issue types only. The same
approved-query-only discipline still applies in full, see
`references/supabase-access.md`, this query is no less gated than the other five.

## Shared pipeline shape

1. **Confirm an approved query exists.** Check `scripts/approved-queries/<slug>.sql`
   for this issue type. If it's missing, this issue type isn't approved to run yet:
   draft a candidate in `scripts/fixed-queries.sql`, test it read-only for a sane
   match count, get the user's explicit sign-off on the exact SQL, then write it to
   `scripts/approved-queries/<slug>.sql` before doing anything else. Never substitute
   a guessed or unapproved query.
2. **Run the approved query, read-only.** Via the Supabase MCP connector, execute the
   exact query text from `scripts/approved-queries/<slug>.sql`, unmodified. See
   `references/supabase-access.md` for the connector contract and the PII rules.
3. **Draft the template** against `references/newsletter-format.md`'s contract and this
   skill's voice rules: one subject line, one preview line, one body with `{{merge_tag}}`
   placeholders for every per-recipient field, rendered once against a real sample row
   as the worked example.
4. **Self-review** — the checklist at the end of the chosen workflow doc, plus
   `references/compliance.md`.
5. **Deliver** — see Delivery below.

### Onboarding nudge
Open `references/workflows/onboarding-nudge.md`. In brief: approved query returns
users who never started onboarding at all; template nudges them to start, not a
generic "come back" message.

### Onboarding unclaimed reward
Open `references/workflows/onboarding-unclaimed-reward.md`. In brief: approved query
returns users who started onboarding but never claimed the completion reward; template
names the concrete unclaimed 500-credit reward and the one step left to claim it.

### Credit/plan lifecycle
Open `references/workflows/credit-plan-lifecycle.md`. Two approved sub-queries live
here: `credit-plan-lifecycle-credits-expiring` and
`credit-plan-lifecycle-quota-cycle-renewal`, run and drafted separately, never merged
into one email. In brief: approved query returns users near a real credit-expiry or
quota-cycle trigger; template states their real numbers (credits remaining, expiry or
renewal timing) plainly, no manufactured urgency beyond what the real date/number
already implies.

### Notification setup nudge
Open `references/workflows/notification-setup-nudge.md`. In brief: approved query
returns users with real spendable credits/quota but no watchlist and no
workflow/alert set up; template names the real unused value and nudges toward setting
one of those up.

## Hard rules (override style every time)

1. **Approved query only, never ad-hoc SQL.** See `references/supabase-access.md`.
2. **Read-only, always.** The Supabase MCP connector is configured `--read-only`; never
   attempt an insert/update/delete, and never ask the user to reconfigure it writable
   for this skill's sake.
3. **Never expose one user's data to another.** Every query result stays scoped to the
   run that fetched it; sample rows used in a worked example are illustrative only, and
   any real email/name shown while drafting gets scrubbed before the file is delivered
   or shown outside this session unless the user explicitly wants a real worked example
   kept.
4. **Never fabricate a number.** Every figure traces to a real Supabase row fetched
   this run, or a cited source.
5. **Never give investment advice.** Same non-advice discipline as the sibling skill
   (`references/compliance.md`): describe performance, never prescribe action.
6. **English, brand voice, no hype.** Inherit `references/writing/writing.md` and
   `brand-voice.md` wholesale.
7. **Human-sounding prose, no AI-tells.** Same rules as the sibling skill's
   `newsletter-format.md` **Prose style** section.
8. **This skill drafts a template, not a send.** Recipient grouping, segmentation,
   frequency caps, throttling, unsubscribe handling, and the actual send are the
   downstream CRM/ESP's job, not this skill's.

## Delivery

Finished issues land at:

```
/Users/evelyn/Desktop/newsletter/lifecycle_<YYYY-MM-DD>_<type-slug>/
    newsletter.md              the template: subject/preview/body with {{merge_tag}}s
    sample-rows.csv            the real rows the approved query returned this run
                                (local only, contains PII, never copy elsewhere or
                                commit)
```

- `<type-slug>` is one of `onboarding-nudge`, `onboarding-unclaimed-reward`,
  `credit-plan-lifecycle-credits-expiring`, `credit-plan-lifecycle-quota-cycle-renewal`,
  `notification-setup-nudge` — matching the filename (minus `.sql`) in
  `scripts/approved-queries/`.
- `sample-rows.csv` is scratch/working data, same spirit as the sibling skill's raw
  `sectors.mjs --save-dir` dumps: it exists to prove the query and template work
  against real data, it is not itself a deliverable to hand off to the send system.
  Flag to the user that it contains real user PII and should not leave this machine.
- `newsletter/` is a plain folder, no git init, shared with the sibling skill's own
  `newsletter_<date>_<type-slug>/` issues in the same parent directory.

## What's in this skill

```
SKILL.md                          you are here
references/
  supabase-access.md              Supabase MCP connector contract: approved-query-only,
                                   staging/approval flow, read-only, PII handling
  newsletter-format.md            template output contract: header metadata, merge-tag
                                   convention, per-type section skeletons, disclaimer
  compliance.md                   hard rules, non-advice discipline, PII rules
  sourcing.md                     web research + citation rules (for any non-DB claim)
  workflows/
    onboarding-nudge.md
    onboarding-unclaimed-reward.md
    credit-plan-lifecycle.md      covers both approved sub-queries (credits-expiring,
                                   quota-cycle-renewal)
    notification-setup-nudge.md
  sectors-api/                    endpoints, data-quality; shared reference synced with
                                   the sibling skills, not currently used by any built
                                   issue type in this skill
  writing/
    writing.md, brand-voice.md    the craft/voice reference this skill inherits wholesale
scripts/
  approved-queries/                the ONLY folder this skill is allowed to run a query
                                    from, one file per issue-type slug:
    onboarding-nudge.sql
    onboarding-unclaimed-reward.sql
    credit-plan-lifecycle-credits-expiring.sql
    credit-plan-lifecycle-quota-cycle-renewal.sql
    notification-setup-nudge.sql
    watchlist-tracked-interest.sql   data-only, supports the sibling generator
                                      skill's personalized content, see "Data-only
                                      queries" above, not one of the 5 lifecycle types
  fixed-queries.sql                staging area for drafting a new/edited query before
                                    it earns a file in approved-queries/, never a run
                                    source itself
  sectors.mjs                      authenticated Sectors API GET; not used by any
                                    currently built issue type
  charts.mjs                       inline-SVG chart generator; not used by any
                                    currently built issue type
config.example.json                template for the optional local Sectors key file
                                    (SECTORS_API_KEY env is the primary source), unused
                                    by any currently built issue type; Supabase access is
                                    via the separate `supabase` MCP connector, not this
                                    file, no DB credential lives here
```

## Setup

**Supabase MCP connector**, required before this skill can fetch anything: a `supabase`
MCP server must be connected, project-scoped and `--read-only`
(`references/supabase-access.md` has the full contract). Check it's live with
`claude mcp list` before starting a run; if it's missing, stop and set it up first
(needs a Supabase personal access token and the project ref), don't attempt to fetch
user data any other way.

No other install: `node` built-ins only, no npm packages, no build step.
