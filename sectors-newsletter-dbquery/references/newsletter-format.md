# Template format, the Markdown output contract

Every issue is a single `.md` file: a personalized email **template**, not a rendered
batch. It carries `{{merge_tag}}` placeholders for every per-recipient field, and is
proven against one real sample row (see SKILL.md's shared pipeline, step 4).

## Header block (top of the file, before the body)

```markdown
---
subject: <the email subject line, may itself contain merge tags>
preview: <the inbox preview/preheader text>
issue_type: onboarding-nudge | onboarding-unclaimed-reward |
  credit-plan-lifecycle-credits-expiring | credit-plan-lifecycle-quota-cycle-renewal |
  notification-setup-nudge
date: <YYYY-MM-DD, the template/draft date>
data_as_of: <YYYY-MM-DD, the approved-query run date>
sample_recipient: <a scrubbed placeholder identifier for the worked example, never a
  real email or full name, e.g. "sample-row-1">
---
```

- **`subject`**: ≤ ~9 words after merge tags resolve. States the real hook for that
  recipient ("Your 3 remaining credits expire Friday"), not a category ("Your Monthly
  Update"). No hype, no advice framing.
- **`preview`**: ~40-90 characters, re-angles the subject with a second real detail,
  never restates it verbatim.
- **`issue_type`**: one of the five built slugs.
- **`date`**: when this template was drafted. **`data_as_of`**: when the underlying
  Supabase row was actually fetched, this can differ from the send date, which this
  skill doesn't control.
- **`sample_recipient`**: identifies which approved-query result row the worked
  example in the body was rendered from, without embedding the real identifier
  (`references/supabase-access.md`'s PII rule).

## Merge-tag convention

- Every per-recipient field is a `{{snake_case_field}}` tag, matching the column name
  the approved query returns for that field (e.g. `{{first_name}}`,
  `{{credits_remaining}}`, `{{credits_expire_at}}`). Don't invent a tag name that
  doesn't correspond to an actual column in this issue type's file under
  `scripts/approved-queries/`.
- The **worked example** immediately below the template (or in a clearly separated
  "Rendered example" section) shows the same body with every tag resolved against one
  real sample row, proving the template actually reads right once filled in. Scrub any
  real email/name/account number in that rendering per `supabase-access.md`, unless the
  user explicitly wants the real value kept for their own review.
- Date and number tags render pre-formatted, not raw: `{{credits_expire_at}}` resolves
  to "July 22" in prose, not an ISO timestamp; `{{credits_remaining}}` resolves to a
  plain integer, not a raw JSON value. Document the expected formatting inline next to
  a tag's first use if it isn't obvious from the merge tag name.

## Prose style (overrides any short-declarative slide instinct)

Read as continuous email prose, not swiped fragments:

- **No dash as a connector** (em dash, en dash, spaced hyphen joining two clauses). Use
  a comma, a period, or "and"/"but." A hyphen inside a compound word or numeric range
  stays as is. Single biggest human-readable tell of AI-written copy.
- **Vary sentence length and structure** the way a person drafting on deadline would,
  don't chop every sentence into three-word fragments for punch.
- **No negative-parallelism, no manufactured paradox** ("it's not X, it's Y").
- **No emoji, emoticons, or decorative Unicode glyphs** anywhere in body copy.
- **Second person is expected here** (this is a direct-to-recipient email, unlike the
  sibling skill's broadcast newsletter), but stays descriptive about their own real
  data ("you have 4 credits left"), never prescriptive about action with their money
  (`compliance.md`'s no-advice rule still bans "you should buy more").

## Bite-sized & visual formatting

- **Short blocks.** Two to four sentences per paragraph. A lifecycle email is read on a
  phone in a few seconds, shorter than the sibling skill's newsletter norm.
- **No tables, no charts, for any currently built issue type.** All five built issue
  types are single-fact, single-CTA emails (a stalled-onboarding state, an unclaimed
  reward, a credit or quota-cycle number, an unused-value state), text-only.
  `scripts/charts.mjs` and a ranked/compared Markdown table are dead weight here,
  don't reach for either unless a future issue type is approved that actually needs
  one.

## Number formatting

- Rupiah as `IDR` (`IDR 10,150`), percentages as `%`, multiples as `x`.
- Credits, counts, and dates render as a person would read them, not as raw database
  values: `4 credits`, not `4.0`; `July 22`, not `2026-07-22T00:00:00Z`.

## Section heading rule

Headings state the finding for that recipient, not the slot name. Bad: `## Your
Update`. Good: `## Your 3 credits expire July 18`. A recipient skimming just the
headings should get the gist without reading the body.

## Section skeleton per issue type

### Onboarding nudge
1. **Greeting + the gap** — `{{first_name}}`, named plainly, then the fact that
   onboarding hasn't started yet, not a generic "get more from Sectors."
2. **Why it matters to them** — one or two sentences on the concrete value finishing
   onboarding unlocks.
3. **The one CTA** — a single clear next action and link, repeated at most once more
   near the close, not stacked with unrelated secondary CTAs.
4. Disclaimer footer + unsubscribe line (see below).

### Onboarding unclaimed reward
1. **Greeting + the unclaimed reward** — `{{first_name}}`, then the fact that
   onboarding is partway done and a credit reward is sitting unclaimed.
2. **Why it matters to them** — one or two sentences on what finishing the last step
   takes and what the reward unlocks.
3. **The one CTA** — back into onboarding, one link, stated plainly.
4. Disclaimer footer + unsubscribe line.

### Credit/plan lifecycle, credits-expiring
1. **The real number, stated first** — `{{credits_remaining}}` credits, expiring
   `{{credits_expire_at}}`. No countdown language beyond what the real date/number
   already implies.
2. **What happens next** — plainly: what changes when the credits expire, factual, not
   scare-framed.
3. **The one CTA** — renew / top up, one link, stated plainly.
4. Disclaimer footer + unsubscribe line.

### Credit/plan lifecycle, quota-cycle-renewal
1. **The real state, stated first** — their `{{monthly_quota}}`-credit monthly quota,
   current cycle started `{{quota_cycle_start}}`, renewal coming up soon. No countdown
   language beyond what the real date already implies.
2. **What happens next** — plainly: the quota resets/renews, factual, not scare-framed.
3. **The one CTA** — review plan / manage billing, one link, stated plainly.
4. Disclaimer footer + unsubscribe line.

### Notification setup nudge
1. **Greeting + the unused value** — `{{first_name}}`, then the real number
   (`{{credits}}` credits or `{{monthly_quota}}` monthly quota, whichever is nonzero
   for that row), stated plainly as sitting unused.
2. **Why it matters to them** — one or two sentences on what a watchlist or
   workflow/alert does with that value once set up.
3. **The one CTA** — set up a watchlist or workflow, one link, stated plainly.
4. Disclaimer footer + unsubscribe line.

## Standard disclaimer footer (fixed text, appended to every issue)

```markdown
---
*This email is account and market information, not investment advice or a
recommendation to buy or sell any security. Market figures are from sectors.app as of
{data_as_of} unless otherwise cited. Do your own research.*

*You're receiving this because of your Sectors account activity. Unsubscribe / manage
preferences: {{unsubscribe_link}}*
```

- The unsubscribe line's `{{unsubscribe_link}}` is a merge tag like any other field,
  this skill never invents or hardcodes a real unsubscribe URL, that's the sending
  system's responsibility to populate.

## Length guidance

Short, phone-read email copy: 80-200 words for all five built issue types. Nowhere
near the sibling skill's 400-900 word newsletter length, this is a nudge, not a
briefing.

## Worked micro-example (header + rendered body)

```markdown
---
subject: "{{first_name}}, your 3 credits expire Friday"
preview: Renew now to keep your screens running without interruption.
issue_type: credit-plan-lifecycle-credits-expiring
date: 2026-07-15
data_as_of: 2026-07-15
sample_recipient: sample-row-1
---

Hi {{first_name}},

You have **{{credits_remaining}} credits** left on your {{plan_tier}} plan, and they
expire on **{{credits_expire_at}}**. After that, saved screens and alerts tied to those
credits will stop refreshing until you renew.

[Renew now]({{renewal_link}}) to keep everything running without a gap.

---
*This email is account and market information, not investment advice or a
recommendation to buy or sell any security.*

*You're receiving this because of your Sectors account activity. Unsubscribe / manage
preferences: {{unsubscribe_link}}*
```

Rendered against sample-row-1 (`first_name: "Rangga"`, `credits_remaining: 3`,
`plan_tier: "Pro"`, `credits_expire_at: "July 18"`):

```markdown
Hi Rangga,

You have **3 credits** left on your Pro plan, and they expire on **July 18**. After
that, saved screens and alerts tied to those credits will stop refreshing until you
renew.

[Renew now](https://sectors.app/billing/renew) to keep everything running without a
gap.
```
