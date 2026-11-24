---
name: st-sectors-newsletter
description: Generate an on-brand, data-backed Markdown and HTML newsletter issue about the Indonesian (IDX) and Singapore (SGX) stock markets from live Sectors data and cited research, with a required chart or Instagram-post visual. Five core issue types plus six more kept for this repo (macro-reaction, upcoming-event, new-release-feature, did-you-catch-it, watchlist-performance-digest, single-company-earnings-review), one per run. Use for "write the newsletter", "weekly insights", "weekly wrap", "monthly pulse", "deep dive on BBRI earnings", "sector spotlight on the banks", "three-stocks story". Not for Instagram carousels or slides (st-sectors-carousel), single-image posts (st-sectors-image), web articles (st-sectors-articles), or CRM email and recipient selection (st-sectors-dbquery).
metadata:
  department: marketing
  owner: evelyn
  tags: "newsletter, data, research, copywriting"
  events: "weekly, monthly-recap, evergreen"
  output: "markdown, html, svg"
  status: stable
  version: "1.1"
---

# Sectors Newsletter Generator

Turn an IDX or SGX story into a finished, cited, brand-voice newsletter issue. Two
disciplines govern everything: **insight, not data** (every number states what it means)
and **factual by construction** (every claim is a real Sectors API field or a cited source,
nothing prescriptive, see `references/compliance.md`).

## 1. Before picking a type

**Exchange.** An Indonesian 4-letter ticker, IDX, rupiah, BI or OJK means IDX. An SGX code
(D05, O39, U11), SGX, STI or MAS means SGX. Nothing named: default to IDX and say so in one
line. For SGX, read `references/sectors-api/endpoints.md` §4 first and prefer the
`fetch-sgx-*` MCP tools over the raw REST paths. Foreign flow, broker
summary and corporate actions are IDX only, so an SGX issue picks an angle SGX data can
prove. Label the exchange whenever both appear.

**Data source order.** Sectors API first (`scripts/sectors.mjs`). Invoke the
`st-sectors-dbquery` skill only when the API fails (no endpoint, error after retry, empty, or
fails the band check), and record why in the data notes. For broker or foreign flow over a
window, loop `brokers/top` per trading day or `foreign-flow/{symbol}` per ticker and sum it
yourself; only if that fails, use dbquery's approved `broker-summary-range` or
`foreign-flow-range` query. User-account data (watchlists,
users, billing) is out of scope here, see `references/scope.md`, with one exception: the `watchlist-performance-digest` type reads each recipient's tracked tickers through `st-sectors-dbquery`'s approved `watchlist-tracked-interest` query (`references/workflows/watchlist-performance-digest.md`). Never call
`mcp__supabase__*` directly and never write SQL.

## 2. Pick the issue type

One issue per run. If the ask names the type or subject, go straight in. If the user
delegates ("you pick"), choose and give a one-line why-now. Only a bare "write the
newsletter" gets the menu below. Each slug has a workflow doc at
`references/workflows/<slug>.md` and a section skeleton at
`references/newsletter-format/skeletons/<slug>.md`. Open those two for the settled type and
no other type's files.

| slug | what it is | conversion goal |
|---|---|---|
| `weekly-insights-v2` | **Default weekly send**, Monday. Nine info-packed blocks built on published Instagram post images, no generated chart | Click through to the week's names |
| `monthly-market-pulse` | Trailing 30 days: big events, movers and broker flow with reasons, three or four names worth a closer look | Check the month's moves live |
| `three-stock-story` | Three companies sharing one pattern, each with dated timeline, numbers, attributed forward view | Open each company page |
| `single-company-deep-dive` | One company whole, 1,300 to 1,900 words | Open the company report |
| `sector-spotlight` | One sub-sector read as a whole, valuation context, the outlier name. Check `workflows/sector-spotlight-history.md` rotation | Screen the sub-sector |
| `macro-reaction` | tie the last ~2 days of macro news to affected sectors/tickers, then report each name's fundamentals and valuation context | Open the affected tickers |
| `upcoming-event` | promo for a Sectors in-house workshop. Content is **user-supplied**: ask for date/time/venue, agenda/speaker/target audience, registration link, and marketing banner before drafting. Not market-data driven | Register for the event |
| `new-release-feature` | a brief summary of the latest release off a user-supplied release note (`sectors.app/release` is not live-fetchable), plus a secondary section spotlighting one feature the user picks, with a "Try the feature now" CTA. Subject/preview/headline name only the release, never the feature | Try the new feature |
| `did-you-catch-it` | a single ticker that hit a real dated low (`overview.all_time_price`), already cleared a fundamentals guard on that date (P/E and ROE vs sector median, leverage trend), then rallied >=10% off it. Told signal-first, to prove a workflow alert would have caught the moment. One broadcast piece, no per-recipient framing | Open the ticker page and set an alert |
| `watchlist-performance-digest` | a fixed template, same structure for every recipient, ranked performance + peer comparison table for up to 5 of that user's own tracked tickers/sectors (from the sibling dbquery skill's `watchlist-tracked-interest` query), only the values differ per recipient. The one type that isn't a single broadcast piece, see **Personalization check** above | Open Sectors to check their own watchlist |
| `single-company-earnings-review` | Second format of `single-company-deep-dive`: one company, one earnings print explained quarter-style, delivered as `newsletter.pdf` (`scripts/html2pdf.mjs`) | Open the company report |

Weighing two types: `references/type-briefs.md`. Unbuilt types and out-of-scope asks:
`references/scope.md`.

**Write as a CXO optimizing for that conversion goal.** Name the goal before drafting, lead
with the payoff, put the CTA above the fold and repeat it, use concrete stakes over vague
ones, and cut what doesn't serve the goal. The hard rules still bind.

## 3. Pipeline

1. **Research** the angle: web search and API discovery before drafting.
2. **Fetch and validate.** When `~/Desktop/newsletter/samples/<slug>/queries.md` exists, read
   it for the type's endpoint list and date window; otherwise follow the workflow doc's
   recipe and write the file after the run. Then fetch with `sectors.mjs` and band-check
   against `references/sectors-api/data-quality.md`. If no sample exists for the type yet,
   follow the documented recipe and populate the sample after this run.
3. **Draft** against `references/newsletter-format.md` and `references/writing.md`.
   Bite-sized, bolded stats, tables for any list of 3+, one hero chart via the `dataviz`
   skill (none for `weekly-insights-v2`; run `scripts/social-posts.mjs --from <Mon> --to <Fri>`
   for its images). Open `references/compliance.md` before any valuation or forward-looking
   section. The page shell, event card, Sources, Appendix and footer markup to copy is in
   `references/newsletter-format/html-chrome.md`. For `weekly-insights-v2`, blocks 4 to 8
   (findings with social cards, Insider Filings, Headlines, What's Ahead grid, Summary) are in
   `references/newsletter-format/weekly-insights-components.md`: copy that markup, never invent table styling.
4. **Self-review**: the workflow doc's checklist, compliance's one-line test, every link
   against `./_shared/UTM_CONVENTION.md`, section order against
   `~/Desktop/newsletter/samples/<slug>/newsletter.md` when it exists, and grep both output files for `$`,
   em dash, en dash, `&mdash;` and `&ndash;`.
5. **Deliver** per `references/delivery.md`.

`weekly-insights-v2` foreign flow uses the exchange definition (`idx_daily_data`)
throughout, never the broker definition (workflow doc §3).

## 4. Hard rules

These override style every time. Full text, dates and edge cases in
`references/hard-rules.md`; read it before drafting.

1. Never fabricate a number. Every figure traces to a Sectors API field this run or a cited source.
2. Never give investment advice. No buy/sell/hold, no own price targets, no "undervalued". Consensus is reported, never endorsed; forward-looking claims are attributed.
3. Omit null or implausible values per `data-quality.md`, and say so.
4. English, brand voice, no hype, per `references/writing.md`.
5. Cite everything web-sourced per `references/sourcing.md`. Sources list only pieces that carried a fact.
6. No em dash, en dash or spaced-hyphen connector anywhere, including Sources, Appendix, tables, alt text and HTML entities. No choppy rhythm, no "not X but Y" pairs, no emoji.
7. One palette, every type: accent `#9E0142` on every `<a>` and the CTA button background, gain `#568475`, loss `#D53E50` on every signed move in tables and charts (`barChart` needs `financial: true`). Gain and loss only bold on a number, never on running copy. Exact HTML chrome in `newsletter-format.md`'s **Color convention**.
8. Appendix on every issue: endpoint/field trace after Sources, before the disclaimer, ending at the last endpoint bullet plus the Instagram credit.
9. No description text between a heading and its first table, chart or bullet, except a date-scope line.
10. Every ticker mention is linked, every occurrence (`sectors.app/idx/<lower>`, SGX `/sgx/<code>`), each with that block's `utm_content` and `utm_term=<ticker>`. Every broker code links to `sectors.app/idx/broker/<lower>`.
11. No `$` before a ticker, anywhere, any type. Outranks every sample and skeleton.
12. No clickable citation in body copy. Source as plain `(Source Name, DD Mon YYYY)`; URL only in Sources. `weekly-insights-v2`, `monthly-market-pulse` and `sector-spotlight` carry no inline citation at all.
13. "Upcoming Events" closing block only when the live sheet in `references/upcoming-events-source.md` has at least one still-upcoming event: after the CTA, before Sources, one card per event, soonest first. No upcoming event means no block and no heading.
14. Fixed disclaimer footer HTML, verbatim, from `newsletter-format.md`.
15. `weekly-insights-v2` sends Monday: frontmatter `date`, folder date and every `utm_campaign` suffix use the Monday after the week's Friday close.
16. `weekly-insights-v2` only: ticker alone with no company name, and no generated graph. Every other type pairs ticker with full name once per section.

## 5. Delivery and setup

Output goes to `~/Desktop/newsletter/newsletter_<YYYY-MM-DD>_<slug>/` as `newsletter.md`
plus send-ready `newsletter.html`, plus chart (SVG, PNG only on request) and logo files by type. Full file list and
the samples refresh rule: `references/delivery.md`.

No install for drafting: `node` built-ins only. API key: set `SECTORS_API_KEY`, or put `sectorsApiKey` in a local `config.json` (git ignores it). Turning a chart into a PNG, on request only, needs puppeteer (`npm install puppeteer` once in the skill folder, or an installed `st-sectors-carousel`). File map:
`references/setup.md`. Charts come from `scripts/charts.mjs`; the `dataviz` skill decides
which chart fits. Sanity check:

```bash
node scripts/sectors.mjs "idx-total/?start=2026-07-01&end=2026-07-08"
```
