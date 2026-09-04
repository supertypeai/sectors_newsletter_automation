# Sourcing, web research and citation rules

**The web supplies the narrative, the Sectors API supplies every number.** Never let an
unverified figure from an article become a data point in the newsletter — if a source
states a number you need, either confirm it against the API or cite the source inline
and keep it clearly attributed as *reported*, not as this newsletter's own figure.

## When web search is mandatory

- **Macro-reaction issue**: the last ~2 days of macro news is the entire premise. Not
  optional.
- **Three-stock-story issue**: company history, founders, fun facts, and the people
  behind the business are not in the Sectors API. Not optional.
- **Weekly Insights v2**: web search corroborates the "why" behind whatever the data shows was
  the week's biggest mover — the data proves *what* moved, search finds *why*.

Your own knowledge cutoff is stale for "macro news in the past 2 days" and for anything
recent about a company. Verify live via search; never recall market events from memory
and present them as current.

## "Past ~2 days" macro sourcing (macro-reaction issue)

Search for, in rough priority order:
- **Bank Indonesia (BI)** rate decisions or statements.
- **USD/IDR** moves.
- **Commodity prices** that drive large IDX sectors: coal, nickel, CPO (palm oil), gold,
  crude.
- **Indonesian regulation or fiscal policy** news (tax, subsidy, trade policy, OJK
  rulings).
- **Major global macro**: US Fed decisions/statements, China data, regional market
  moves — only when they plausibly transmit to IDX names.

Cross-check the API's own `news/` endpoint (`symbols`/`sector`/`sub_sector`/`keyword`,
with `start`/`end`) as a second, IDX-tagged source once you have a candidate story — it's
big-cap-skewed (see `sectors-api/data-quality.md`), so use it to corroborate and find affected
tickers, not as your only macro-news source.

## Gated sectors.app / docs.sectors.app fetch (how-to issues)

`sectors.app` and `docs.sectors.app` sit behind Cloudflare. A **default fetch user-agent
gets a 403/429**, which reads like an auth wall but is a bot block, not a credential
problem. Fetch these pages with a real browser user-agent and they return 200:

```bash
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  "https://sectors.app/release"
```

- **Release notes are no longer fetchable this way.** `https://sectors.app/release`
  serves a Vercel Security Checkpoint JS challenge (confirmed 2026-07-17, on two
  separate runs), not the old Cloudflare 403/429 a UA swap could clear. The
  `new-release-feature` issue type asks the user for the release note as a PDF or
  Markdown file instead, see `workflows/new-release-feature.md` step 1, don't retry
  this fetch for that type.
- **How-to recipes**: `https://docs.sectors.app/recipes` and its children (e.g.
  `.../recipes/generative-ai-python`) for how-to and use-case-walkthrough issues.
- **Docs index**: `https://docs.sectors.app/llms.txt` enumerates every docs page, fetch it
  first to discover the right recipe URL instead of guessing paths.

These pages are citable sources like any outlet (name + date + link in the **Sources**
list). A feature or how-to claim that isn't on one of these pages gets cut, don't describe
product behaviour from memory.

## What counts as a citable source

**Yes**: a named, dated outlet or primary document — Reuters, Bloomberg, an official Bank
Indonesia release, a company press release or IDX filing, a reputable Indonesian
financial outlet (e.g. Kontan, Bisnis Indonesia, CNBC Indonesia), the Sectors `news/`
endpoint's `results[].source`. Prefer the primary document over a summary of it (the BI
release itself over an article about the release).

**No**: an undated blog post, a forum or social-media post, an unattributed aggregator,
anything you cannot pin a publication date to.

## Inline citation format

Every web-sourced claim gets an inline source as **plain bracketed text**,
`(Source Name, DD Mon YYYY)`, never a clickable link (tightened 2026-08-31, applies to
every issue type). The URL for that source appears in exactly one place, the **Sources**
list closing the issue, one line per source: name, date, link. The earlier option of
hanging a markdown link on the claim itself is withdrawn, because it gives the reader an
exit from the issue before the CTA. See `newsletter-format.md`'s **UTM convention**
section for the full statement of the rule. This is in addition to the
`sectors.app` citation used for API-sourced figures (see `compliance.md` rule 6).

**No source, no claim.** A statement that traces to neither a real Sectors API field nor
a cited source gets cut before the issue ships, no exceptions.

## Recency discipline

The *lead* of every issue has to be something that actually happened or changed
recently — a fresh macro event, this week's market move, a real current reason a
three-stock pick is featured. A standing historical fact (a five-year streak, a
company's founding story) is proof material for the body, never the headline. If the
"why now" search for a candidate comes up empty, that's a signal to re-angle, not to run
a history-only piece and call it news.

## What does not belong in the Sources list (added 2026-08-31)

The Sources block lists the news and research pieces that carried a fact into the issue. A
page consulted only to confirm a calendar date is not one of them, even though it was
genuinely opened during drafting. Drop:

- Public-holiday calendars used to check why a session was closed.
- A central bank's or exchange's published meeting or session schedule, when the issue only
  states the date of a meeting that block 7 already lists as a scheduled event.
- Exchange trading-hour or listing-rule reference pages.
- Any page whose entire contribution is a date the reader can see in the issue's own tables.

Keeping them pads the list and dilutes the entries that actually back a claim. If a scheduled
event's date is contested or was reported rather than published, that is a real citation and
it stays.
