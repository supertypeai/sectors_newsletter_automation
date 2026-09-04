# Scope: not-yet-built types, out-of-scope types

Split out of `SKILL.md` so the per-run path stays short. Read this only when the ask
names something outside the ten built issue types, or when you are unsure whether a
request belongs to this skill at all.

### Not yet built (in scope, will be added iteratively)

These are valid market/editorial content this skill's engine *can* produce, they just
don't have a workflow doc yet. If the user asks for one, say it's not built yet and offer
the closest built type, or build it by following the nearest existing workflow doc as a
template (don't fake it with an ad-hoc pipeline):

- Market Insights: Regulatory / index event, Global spillover, Broker flow digest
- Market Performance: Monthly recap
- Company Insights: Insider activity signal
- FOMO (market content only, targeting is external): Sector rotation miss. (Did you
  catch it is now built, see the numbered list above and
  `references/workflows/did-you-catch-it.md`.) **Missed dividend was dropped on
  2026-08-10, do not build it and do not offer it.** A screen on ex-date, payment size,
  payout ratio and cash payout ratio proves only that a payment was large and covered,
  which is not enough for a reader to decide anything, so the piece implies a judgment
  the data behind it cannot support. The retrospective half is worse: the ex-date has
  already passed, nothing is actionable, and there is no alert worth setting. If asked
  for it, say it was dropped and offer `did-you-catch-it` or `sector-spotlight`.
- Educational: Concept explainer, How-to guide, Use-case walkthrough
- Product Update: Feature enhancement, Deprecation notice

### Out of scope (do not attempt here)

These need live **user-account or billing state** this skill cannot fetch
(`quest_completed`, `credits_used`, onboarding progress, renewal dates). They are
lifecycle/CRM/transactional email, a different system entirely, triggered by account
state rather than market content, and drafted end-to-end by the sibling
`sectors-newsletter-dbquery` skill, not this one:

- Reminder: onboarding nudge, onboarding unclaimed reward, credit-expiry,
  quota-cycle renewal
- Account & Value: notification setup nudge, upgrade prompt, win-back reoffer

The one account-adjacent thing that IS in scope here is **which tickers/sectors a user
tracks**, that's audience/personalization data for the `watchlist-performance-digest`
type above, not a lifecycle trigger, see the **Personalization check** section.

**Recipient grouping, segmentation, frequency caps, and send scheduling are also out of
scope**, including for the personalized type. This skill generates content (one
broadcast piece, or one reusable per-recipient template); who receives it and when is
decided by the delivery/CRM system that consumes the output, not here.

