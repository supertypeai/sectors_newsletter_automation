# Upcoming event — resolved query pattern (worked example: 2026-07-13 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/upcoming-event.md`. This type is **not market-data
driven** — its content is user-supplied event details, never fetched or web-researched
(see workflow doc §1). This file documents what IS a query here: the one optional data
teaser, and the intake-question set, so both stay consistent run to run.

## 1. What is NOT a query here

Date/time/venue, agenda, speaker, registration link, and banner are asked of the user
every run, never fetched, never inferred, never reused verbatim from a prior event issue.
There is no "resolve the window" step because there is no market window in this type.

## 2. The one optional query: the "what you'll build" teaser

Resolved this run: a bank P/E screen (the workshop teaches screener-building).

| Section | Endpoint | Resolved params this run |
|---|---|---|
| "Your first screener could surface these" teaser table | `companies/` screener | `?where=sub_sector = 'banks' AND pe_ttm < 12&order_by=pe_ttm` (screening IDX banks under 12x trailing P/E) |

Fields cited: `pe_ttm` per ticker, band-checked against
`sectors-newsletter-generator/references/sectors-api/data-quality.md` before display, same discipline as every other
issue type. This teaser is optional and skippable if the agenda already speaks for
itself (workflow doc §2).

## 3. Intake question set (reapply verbatim every run)

1. Time, date, venue (with timezone; online/offline/hybrid).
2. Topic, agenda, speaker(s) (name + role), target participants.
3. Registration link (the exact CTA URL).
4. Marketing image/banner (local file path, copied into the issue folder, or a URL).

Never fill a gap with a plausible-looking placeholder — hold and ask which of the four
is missing.

## Reuse checklist for the next upcoming-event run

1. Ask all four intake items fresh, don't inherit any value from a prior event issue.
2. If a teaser is included, pick the screener/series that matches *this* workshop's
   actual taught skill, not a copy of the banks-P/E screen above — that screen was
   specific to an n8n screener-building workshop.
3. Diff the finished draft's section order against `newsletter.md` in this folder: hook
   headline → banner → essentials block → what you walk away with → optional
   "how we get there" → optional data teaser → speaker → CTA close.
4. `newsletter.html` must exist alongside `newsletter.md` and match it section for
   section (this type ships as send-ready HTML, same as weekly-wrap).
