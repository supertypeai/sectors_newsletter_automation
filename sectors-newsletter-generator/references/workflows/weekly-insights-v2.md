# Weekly Insights v2, workflow

Intended send: Monday morning (confirmed 2026-07-20, moved off the original Saturday
cadence). Covers the trading week that just closed (Mon-Fri); the issue date is the
Monday immediately after that week's Friday close, not the same-week Saturday and not
the `data_as_of` Friday date. See **Header block, weekly-insights-v2** below for the
exact date math. The successor to the v1 `weekly-wrap` type, retired 2026-08-31; this is now the
only weekly type, and a request for "the wrap" routes here.

Read `../newsletter-format/skeletons/weekly-insights-v2.md` and `../compliance.md`
before drafting. Worked reference: `newsletter/samples/weekly-insights-v2/`.

## What changed from v1, and why

v1 ran eleven sections and read like a long-form market report. The revamp cut it to eight
blocks, on the brief that the issue is an **info-packed digest, not a lengthy read**. The
market-level prose sections (Week in Numbers, What's the Buzz, Chart of the Week, What
Actually Traded, Sector Pulse, Takeaway) are gone; their numbers survive as single lines
inside Key Data Bites. What replaces them is one analysis block that has to earn its place.

The format borrows from two references the user supplied: Carbon Finance (dated masthead,
one-line greeting, a dense linked-facts box, tagless headline one-liners) and Algo Research
(a findings block, a forward calendar).

## 1. Settle the window

Identical to v1. The API's "today" lags ~1 day (UTC), so anchor to whatever `data_as_of`
you actually get back, and use the most recently completed Mon-Fri window. Prior week for
the WoW compare is that same window shifted back exactly 7 days.

One extra call this type needs: the **Friday before the prior week** for `index-daily`,
because the prior-week WoW figure is a Friday-to-Friday change and the index endpoints carry
no prior-close field. Fetch `?start=<prior-mon-minus-2>&end=<prior-fri-minus-7>` and take the
last row.

### Header block, weekly-insights-v2 (confirmed 2026-07-20)

The header line under the masthead reads `Issue #{n} | {issue_date} | week of
{mon}-{fri} | data as of {data_as_of}`, four fields, three different dates. Don't
collapse any two of them:

- **`week of {mon}-{fri}`**: the Mon-Fri window settled above.
- **`data as of {data_as_of}`**: that window's Friday, the API's last trading day,
  matches the frontmatter `data_as_of` field.
- **`{issue_date}`**: **the Monday immediately after that Friday**, one full week
  minus 4 days after the window's own Monday, i.e. `window_monday + 7 days`. This is
  the send date, it goes in the frontmatter `date:` field, the delivery folder's
  `<YYYY-MM-DD>`, the HTML `<!-- -->` header comment, and every `utm_campaign=`
  suffix on every link in the issue, all four must agree. Example: week of 6-10 Jul →
  issue date 13 Jul (not 11 Jul, the old same-week Saturday convention this replaced).
  Never use the window's own Monday here either, that's already shown in the "week
  of" field and would make the two fields redundant.

## 2. Fetch

```bash
node ../../scripts/sectors.mjs \
  "idx-total/?start=<mon>&end=<fri>" \
  "idx-total/?start=<prev-mon>&end=<prev-fri>" \
  "index-daily/lq45/?start=<mon>&end=<fri>" \
  "index-daily/idx30/?start=<mon>&end=<fri>" \
  "index-daily/lq45/?start=<prev-mon>&end=<prev-fri>" \
  "index-daily/idx30/?start=<prev-mon>&end=<prev-fri>" \
  "companies/top-changes/?classifications=top_gainers,top_losers&periods=7d" \
  "most-traded/?start=<mon>&end=<fri>&n_stock=3" \
  "subsector/report/<slug>/" \
  "filings/?limit=10" \
  "news/?start=<mon>&end=<fri>&limit=20" \
  --save-dir <scratch-dir>
```

Then, once the movers are known, per-ticker flow for whichever names the findings block
features, and the corporate-action poll for the calendar (see §4).

Endpoint gotchas, the ones that bit on the worked run:

- `companies/top-changes` **ignores `start`/`end`** and returns a live snapshot pinned to its
  own `latest_close_date`. Check that value every run. If it equals the window's Friday you
  may use it; if not, **it is unusable and you must compute the movers** (see §2b).
- `filings/` — **do NOT use `start`/`end` here.** Those params filter on the *transaction*
  date; we report on the *filing* date, which is the `timestamp` field. Verified live
  2026-07-20: `?start=2026-07-06&end=2026-07-10` returned rows timestamped only 9-10 Jul and
  silently dropped every filing lodged on 6, 7 and 8 Jul (82 of them existed). Instead
  **paginate `?limit=30&offset=N` and filter client-side on `timestamp`**, walking back until
  the oldest row predates the window. Reaching a Mon-Fri window a week back took offsets up to
  210. Free on credits. Then take the five most recent in-window rows by `timestamp`.
- `news/` **caps at 30 rows per call**, whatever `limit` you pass (asked for 60, got 30), and
  it returns newest-first anchored to `end`. On a busy day that means a 5-day window returns
  only the final day: the 6-10 Jul run came back 30/30 from 10 Jul, and `offset=30` returned
  30 *more* rows still all from 10 Jul. `start`/`end` do work, the volume is just high. To
  cover the whole week, **call once per day with `end=<that day>`** rather than paginating.
  **Then drop every insider / shareholding-disclosure item.** Those are filings, not news, and
  they belong in the Filings block, not Headlines. The KSEI PDFs on `idx.co.id` are the
  obvious ones, but filter on the substance (a holder buying or selling a stake), not the
  source domain.
- `subsector/report/{slug}/` needs the trailing slash. Median P/E is at
  `statistics.filtered_median_pe`, the P/E and P/B history at
  `valuation.historical_valuation`, the YTD cap move at
  `market_cap.mcap_summary.mcap_change.ytd`. Its `1w` figure is live as-of the report's own
  date, not your window, so don't quote it as the week's move.

## 2b. When `top-changes` can't serve the week (back-dated issues)

`top-changes` is a live snapshot, so for **any issue not anchored to today** it returns the
wrong week and the Top Movers block cannot be built from it. The screener has no historical
period-change field either. Compute the movers instead:

```bash
# 1. the universe (free, one call)
node ../../scripts/sectors.mjs "companies/?where=indices in ['LQ45']&limit=100" --save-dir <dir>
# 2. one daily series per constituent, anchored to the PRIOR Friday for the base close (free)
node ../../scripts/sectors.mjs "daily/<TICKER>/?start=<prev-fri>&end=<fri>" ... --save-dir <dir>/daily
```

Then rank on `close[fri] / close[prev-fri] - 1`. 45 calls, **zero credits**, and it gives you
LQ45 breadth (up/down counts) for free as a Key Data Bite.

**Label the universe honestly.** These are the top movers *among LQ45 constituents*, not the
whole exchange, so the block says so and the appendix explains why `top-changes` was not used.
Note the side effect: a heavily-traded non-index name (BUMI, on the worked run) will not
appear in the tables at all even while it tops the volume list, which is itself a usable
finding for block 4.

Using the index universe also has an editorial upside worth keeping in mind: it strips the
illiquid micro-caps whose 30% weekly moves say nothing about the market.

## 3. Block 4 is the one that earns its place

**What the Data Unearthed** is the only analysis in the issue, and its job is to surface
something a reader would *not* get from the tables above it. In practice that means
**joining two sources**, not reporting one.

The worked run's example: the week's top two gainers, MLPT +59.70% and VKTR +35.58%, both
have a corporate action dated 29 July, a 1:25 split and a rights ex-date respectively.
Neither the movers table nor the corporate-actions calendar shows that on its own. Other
joins that work: a mover whose foreign flow contradicts its price direction; a name topping
the volume table while foreign money exits it; an insider filing against the same ticker's
weekly move.

Cap it at **two or three findings**, each with a heading that states the finding, a visual,
and **three bullets**, four at the absolute outside. Never paragraphs. Three is the target,
not the floor: the 16 Aug issue shipped five-bullet findings and the user cut each back to
three by merging related facts into one bullet.

### What gets cut when compressing a finding

The user's edit removed one category of line every time, so treat these as non-shippable:

- **Restated caveats.** "Nothing in the filing record explains the price decline on its own;
  the transfer and the fall are concurrent, not proven cause and effect." §5b's causation
  policy is satisfied by *how* the bullets are worded, not by appending a disclaimer that
  takes back what was just written. Word the claim carefully, then stop.
- **Recaps of the issue's own structure.** "TPIA isn't an LQ45 constituent, so this flow and
  price move sit entirely outside the benchmark tables above." The reader can see that.
- **"Taken together" closers** that re-summarize the bullets directly above them.
- **Self-referential production notes.** Never write "chart generated this run, no matching
  social card was available for the window, see appendix" in a caption or anywhere else. The
  reader does not care how the visual was made; a caption describes what the visual shows.

Merge rather than delete when two bullets carry one fact between them. The IMPC finding's
transfer bullet, the counterparty bullet and the foreign-flow bullet became a single bullet
that states the transfer, names the counterparty, and closes on what it means ("an internal
transfer rather than fresh open-market accumulation"), with the flow figure folded into the
last sentence.

### Fixed section titles (identical in every issue)

Every issue uses these exact titles, spelled and cased the same, never renamed, shortened or
"improved" per run (a 2026-10-19 run shipped "Market Developments" and "Key Triggers Ahead"
and both were reverted):

| Block | Exact title |
|---|---|
| 2 | Key Data Bites |
| 3 | Top Weekly Movers |
| 4 | What the Data Unearthed |
| 5 | Insider Filings |
| 6 | Other Major Headlines |
| 7 | What's Ahead (sub-labels: Beyond the week, Scheduled macro) |
| 8 | Summary (sub-headings: The bull read, The bear read, What to watch next) |
| 9 | the CTA panel, no title |
| after CTA | Upcoming Events |
| end | Sources, then Appendix: Sectors API endpoints (fields used) |

Finding headings inside What the Data Unearthed **state the weekly figure** (the Friday to
Friday or Mon-Fri move the issue is about). Sub-window detail (Monday to Thursday, a single
day, a pre-announcement leg) belongs in the bullets, never the heading. Where a draft and an
earlier hand-edited version say the same thing, keep the hand-edited wording.

### Summary never drops, structure never varies

Block 8 ships in **every** issue with its three parts in order: The bull read, The bear read,
What to watch next. It is never dropped, merged into another block, or shrunk to one line,
including a thin week. When few inferences are new, derive them from the week's own flow,
level and ratio facts (who bought against whom, the size of a flow against the repricing,
how long a trend has run) rather than restating blocks 2 to 7. Block order, titles and
sub-blocks stay identical from issue to issue, so a reader always finds each part in the
same place.

### Locked copy and layout (2026-10-19)

- **CTA sentence is verbatim from the skeleton, never edited per issue.** In particular no
  ", and the ones that did not make the cut,", or any other per-run addition. The wording is:
  "Keep these names on your radar: add them to a watchlist for our exclusive reports, or set a
  workflow alert that pings you on the next filing or foreign-flow swing." (Same in monthly-market-pulse.)
- **Beyond the week table** (block 7) uses fixed column widths with `table-layout:fixed`:
  Date 70px, Ticker 60px, Action 130px, Detail takes the rest, and Date and Action carry
  `white-space:nowrap` so "Rights period ends" and "30 Oct" never wrap to two lines. The
  Scheduled macro Date column is also `nowrap`.
- **Key Data Bites has no "Next on Friday" style sub-bullet** listing the runners-up in share
  volume. The volume bullet names the leader only; a share-count ranking over-rewards cheap
  stocks and the large caps' volume is already covered in block 4.
- **Insider Filings has no note under the table.** The table is ranked by transaction value and
  stands alone: no standout-filing line, no explanation of what was left out.

### Copy voice: conclusion first, data as support

Hand-edited copy is the reference for voice (the 2026-10-19 pasted draft's finding bullets
read better than the generated ones). Write like an analyst talking to a reader, not like a
data dump:

- **Lead with the reading, then back it with one or two figures.** "Most of the damage came
  before the fines" first, then the numbers that show it. Never stack four figures in one
  bullet with the claim left implied.
- **Round secondary ratios into plain words** ("about nine times the usual outflow", "roughly
  five to seven times the index"). Keep exact figures for the headline stat of a bullet.
- **State what the number means** in the same sentence ("which says thin bids drove the
  fall", "so the crash had a domestic bid under it"), as a data-supported conclusion, never a
  prediction.
- Natural sentence rhythm, no staccato fragments, no "not X, but Y" or "rather than".
- Ask of every bullet: would a person say this out loud? If it reads as a table row in a
  sentence, rewrite it.

### Visuals: the social cards

**Block 4 never renders its own images.** Its visuals are existing social cards from the
carousel pipeline's bucket. Do not call `charts.mjs` for this block, do not produce a
`chart-<slug>.svg` for it, and do not substitute a rendered chart because the card URLs were
not to hand. Since the bucket cannot be listed without a credential (see below), the correct
move when you don't have URLs is to **stop and ask the user for them**, not to generate
something. There is no chart fallback in this type (confirmed 2026-08-31): if the user has
no eligible card for a finding, drop that finding and write one the available cards support,
or ship the block with fewer findings. A generated graph in a weekly-insights-v2 issue is a
defect in every case, including a week with no eligible card.

Block 4's images come from the carousel pipeline's Google Cloud Storage bucket:

```
https://storage.googleapis.com/sectorsapp-sea/social_media/<filename>
```

Public, unauthenticated, no signed-URL expiry, so email clients load them directly with no
mirroring step. Filenames follow `<topic>_<YYYYMMDD>_<n>.jpg`, sometimes with a slide index
(`foreign-flow-1_20260718_1.jpg`). **The date is the generation date, not the data window**,
so read the window off the image itself and state it in copy. The worked sample's CUAN card
is dated 10 July and covers 19 Jan to 9 Jul, which is why its bullets say so explicitly.

**Every bucket image is exactly 268px wide, strictly, no exceptions.** One image under a
heading runs at 268px; two images under one heading go side by side, two columns, each 268px.
Never full width, never `width:100%`, never a percentage, never another pixel value. Use this
exact tag shape, `width` attribute and inline style both:

```html
<img src="<bucket url>" width="268" alt="..." style="display:block;width:268px;max-width:100%;height:auto;border-radius:8px;">
```

`max-width:100%` is only the narrow-phone safety net and must never replace the 268px width.
Height stays `auto` so the card keeps its ratio.

**Credit every social image to `instagram.com/sectorsapp`, always, whatever the actual
source.** That is the public home of this content and the only attribution a reader should
see. The storage bucket is internal plumbing: it may appear in an `<img src>` because that is
how the image loads, and nowhere else. Never name the bucket, a filename, or a storage path in
the appendix or in body copy, and never credit a different origin even when the asset came
from somewhere else.

Instagram itself is not scrapeable: `instagram.com/sectorsapp` returns no post data
unauthenticated. Don't try. The bucket is upstream of the posts anyway.

### How to pick which images to use

**Findings first, images second. Never the reverse.**

Derive the week's findings from the API, then look for a card that illustrates one. Do not
browse the week's renders and write findings around whatever exists — that hands editorial
control to whatever marketing happened to produce, and it is how a card's numbers end up
driving copy (the ANTM sign-flip below is exactly that failure). The copy's figures always
come from the API; the card illustrates them.

Selection criteria, applied in order:

1. **Date filter first, and it is a hard filter.** Every filename carries a `YYYYMMDD`.
   **Only cards whose `YYYYMMDD` falls inside the issue's Mon-Fri window are eligible.** A
   card stamped after the window belongs to a later issue; one stamped before it has already
   run. On the 6-10 Jul run this left exactly one eligible card,
   `insider_cluster_cuan_20260710_2.jpg`, and correctly excluded the 20260717 and 20260718
   renders.
2. **Drop the story-only renders.** These prefixes go to Instagram Stories, not the feed, so
   they expire after 24 hours. Exclude any filename starting with:

   `filings-plain`, `filings_daily`, `broker-bandar`, `broker-trending`, `broker-weekly`,
   `macro-news`, `news-tier1`

   (Note the inconsistent separators, `filings-plain` with a hyphen but `filings_daily` with
   an underscore. Match the strings exactly as listed.) Everything else in the bucket is
   feed-eligible and fair game.

   This rule exists because of the credit rule below. We attribute every image to
   `instagram.com/sectorsapp`, so a reader who goes looking has to be able to find it. A story
   render will be long gone by the time the newsletter lands, which makes the credit a dead
   end and the issue look sloppy.
3. **Then, does it illustrate a finding you have, or suggest one worth building?** The date
   filter decides what is *available*; relevance decides what is *used*. A card that passes
   both filters and carries a real story is worth writing a finding around, provided the
   finding is still derived from the API (see below).
4. **Note the window gap.** The stamp is the generation date, not the data window. The CUAN
   card is stamped 10 Jul but covers 19 Jan to 9 Jul, so its bullets say so. Read the window
   off the image, always.
5. **Reconciliation.** Every figure quoted from the card must match the API. If it doesn't,
   either drop the finding or keep the card as decoration and quote the API's numbers in the
   bullets. Never publish the card's number unchecked.
6. **Sets.** A numbered pair (`-1`/`-2`) that shows both sides of one story, buy and sell,
   counts as **one** finding and renders side by side in two columns.
7. **Budget.** Two or three findings, so at most about four images. Cut the weakest.

**Where the filenames come from.** The bucket lives at
`https://console.cloud.google.com/storage/browser/sectorsapp-sea/social_media`.
Read the file list there, take the names whose `YYYYMMDD` falls in the window, and build the
public URLs from them.

The bucket cannot be listed programmatically without a credential, and public reads only
resolve for an exactly-known filename (a guessed name 404s, and the trailing `_<n>` is not
predictable). So today the URLs are **supplied by the user at generation time**. Ask for
them; do not attempt to enumerate or guess.

**This ask is a blocking step in the run, not an optional convenience.** Sequence: derive
the findings from the API, then ask the user for the week's card URLs, then write block 4
around the cards that pass the filters. Ask once, listing the window's date range so the
user knows which renders qualify. Do not proceed past block 4 having silently rendered a
chart in place of the cards, and do not treat "no URLs in the prompt" as permission to
generate. If the user answers that there is no eligible card this week, the findings block
is rebuilt around the cards that do exist or shipped with fewer findings; a chart is never
substituted.

Two ways to fix that, when the user wants to:

- **Manifest file (preferred, no credential).** Have the carousel pipeline write a small JSON
  to a predictable public path as it renders, e.g.
  `.../social_media/manifest_<YYYYMMDD>.json`, listing each render's filename, topic,
  tickers and data window. The skill then fetches one known URL and picks against the
  criteria above. Keeps the bucket private-by-obscurity and needs no key in this skill.
- **Storage credential.** Give the skill a GCS credential so it can list by date prefix.
  More power, more setup, and another secret to hold alongside `config.json`'s API key.

> **Resolved 2026-07-27: default to the exchange definition (`idx_daily_data`) for weekly
> aggregated foreign flow. Never use the broker-domicile aggregation (`idx_broker_summary_daily`
> / `idx_broker_registry`, what `broker-summary/top` and `foreign-flow/{symbol}` return) for this
> figure.** The 18 Jul 2026 issue was left mixed (broker figure in Key Data Bites next to
> exchange-definition cards) and is not a model to copy.

> **The cards and the API use two different definitions of foreign flow. Pick one per issue
> and never mix them.** Resolved 2026-07-20 against the database, after an earlier note here
> wrongly called the cards buggy.
>
> | Source | Definition | Table |
> |---|---|---|
> | Social cards | Exchange foreign flag, volume-based: `sum((foreign_buy_volume - foreign_sell_volume) * close)` | `idx_daily_data` |
> | `foreign-flow/{symbol}` | Broker domicile, value-based: `sum(nval)` where `is_foreign` | `idx_broker_summary_daily` + `idx_broker_registry` |
>
> Both reproduce their own outputs to the cent. They can disagree on **direction**, not just
> magnitude: BBRI over 13-17 Jul was -30.27B by the exchange definition and +660.36B by the
> broker one; ANTM was +237.89B versus -136.67B. A foreign investor trading through a domestic
> broker lands in a different bucket under each method.
>
> **Default to the exchange definition** (`idx_daily_data`) for this issue type. It is what
> Indonesian press quotes as "asing net buy/sell", and it is what the cards show, so card and
> copy agree by construction. If you quote `foreign-flow/{symbol}` instead, say so and do not
> also show a card built on the other definition. Caveat on the exchange figure: net volume
> times `close` is an approximation, since only volumes are stored and a true value would need
> separate buy-side and sell-side average prices.

**Approved query, not a per-ticker API loop.** Invoke the `sectors-dbquery` skill for
its approved `foreign-flow-range` query, giving it the week's Mon-Fri `{{start}}`/`{{end}}`.
Never run this SQL yourself; it is reproduced here only so you can see what comes back:

```sql
select symbol,
       sum((foreign_buy_volume - foreign_sell_volume) * close) as net_foreign_flow,
       count(distinct date) as days_active
from idx_daily_data
where date between '<mon>' and '<fri>'
group by symbol
order by net_foreign_flow desc;
```

One query ranks the whole market for the week; top rows are net foreign buys, bottom
rows net foreign sells, no need to loop `foreign-flow/{symbol}` per ticker per day.
Add `and symbol in ('BBCA.JK', ...)` to check a specific name's own figure instead of
the full ranking. Mind the `.JK` suffix, a bare ticker returns zero rows silently, not
an error. `days_active` should equal 5 for every row in a normal Mon-Fri week; a lower
count means that name was suspended or newly listed mid-week, not a data gap. Verified
live 2026-07-27 against 13-17 Jul: reproduces the hand-checked figures above to the
cent (BMRI +563.16B, ANTM +237.89B, TPIA +237.83B, BBCA +145.62B, ASII -534.22B,
MAPI -187.83B, BBRI -30.27B).

Every figure in block 4 is restated as HTML text under its image, because many clients block
remote images by default. Alt text carries the full figure set for the same reason. This is
the type's substitute for the standard `chart-<slug>.svg` hero chart. This type ships no
`chart-<slug>.svg` at all: `charts.mjs` is not called anywhere in a weekly-insights-v2 run,
and the bucket cards are the issue's only images.

## 4. The What's Ahead calendar

`company/corporate-actions/{symbol}/` is **per-symbol with no market-wide variant**, so the
calendar is built by polling a ticker list. The worked run polled ~50 (LQ45 constituents plus
the week's movers), cost **zero credits**, and found four events. Widen the list if a week
comes back empty; the whole board is free but slow.

**Empty action types return `null`, not `[]`.** Guard before iterating or the poll throws.

Split the output two ways: a **Mon-Fri week grid** for anything landing in the next five
trading days, and a **"beyond the week" table** for everything further out.

### 4b. Scheduled macro rows (ported from monthly-market-pulse §8.10)

Corporate actions alone leave the block blind to the events that actually move the whole
tape. Append a third compact table, columns **Date, Event, Why it matters**, two to four
rows, placed after "beyond the week" and before the dividend-calendar link.

Rows are real, scheduled, verifiable events with a published date: a BI RDG decision, a BPS
CPI or trade-balance release, an FOMC decision, an index rebalance effective date, a named
company's scheduled result date. Nothing here comes from the Sectors market endpoints; each
row is sourced and cited like a Headlines item, and goes in **Sources**, not the Appendix.

Two hard rules, both inherited from the monthly type:

- **Mapped only.** Every row's "why" names a ticker or sector that already appears
  somewhere in this issue's own tables. A rate decision with no bank, property or
  rate-sensitive name anywhere in the issue is a wire feed line, cut it. This is what keeps
  the addition to a few lines instead of turning block 7 into a macro digest.
- **Dated and scheduled, never speculative.** A plausible-sounding but unscheduled item
  ("earnings season should pick up") does not ship. If a window genuinely has no scheduled
  macro event, run the table with one row or omit it, do not pad it.

Close the block with the dividend calendar link, as before.

## 4c. Summary

The two-sided read, placed after What's Ahead and immediately before the CTA. Ported from
`monthly-market-pulse.md` §8.9, compressed for a weekly. **The heading is `Summary`**
(renamed from "The Other Side", 2026-08-17); the sub-headings inside it keep the bull/bear
names.

**No new fetches.** Every bullet is grounded in a number or citation that already appears
earlier in this issue. If a bullet needs a figure the issue doesn't carry, that figure
belongs in Key Data Bites first, and then the bullet may reference it.

**Every bullet ends somewhere new.** This block is macro and structural analysis, not a
second pass over the same facts. The bullet has to close on a claim the issue hasn't made:
what the numbers imply for positioning, liquidity, rotation, institutional behaviour or
policy transmission.

- Restatement, cut or finish it: "all five of the week's biggest gainers were non-LQ45 names,
  each posting a double-digit weekly move."
- Finished: "all five of the week's biggest gainers were non-LQ45 names, each posting a
  double-digit weekly move. Capital is rotating down the market-cap ladder."

**Repeat a figure only when the claim needs it.** The test is whether the sentence still
lands with the number taken out. Scale, direction and reversal usually are load-bearing, so
they stay: "foreign investors flipped to a net IDR 2.37 trillion sell, a reversal from the
prior week's IDR 583.99B net buy, so global capital is derisking Indonesian exposure ahead of
the coming rate decisions" needs both figures, because the reversal is the whole argument.
Decoration is not load-bearing and reads as padding: if the claim is that bank fundamentals
are supportive, "BBCA and BMRI both grew profit again in July" carries it, and re-printing
`+1.57%` and `+24%` next to it only makes the reader re-read Headlines. Same for a price
level, a close, or a stake percentage repeated for colour.

When in doubt, write the claim first, then add back only the figures without which it would
be vague.

Write the closing claim in plain declarative prose. It is the one place in the issue that
interprets rather than reports, so it should read like a view, not like a caption.

Shape:

- **The bull read** — two or three bullets.
- **The bear read** — two or three bullets. Give it genuine weight; a token bear block that
  concedes nothing is worse than no block.
- **What to watch next** — the closing sub-block (renamed from "What would settle it",
  2026-08-17). One line naming the specific dated event that distinguishes the two reads,
  normally one of block 7's own rows, then **two conditional bullets**, one per read, each
  saying what outcome would validate that side. Conditions, never predictions:

  ```markdown
  Monitor price action and volume in GOTO and CPIN into the 31 August MSCI effective date:

  - If the market absorbs the passive outflow with minimal price damage in both names, it
    confirms broad-market resilience as the primary trend, validating the bull case.
  - If the rebalancing triggers a heavy, unabsorbed unwind that spills into broader benchmark
    constituents, foreign selling and blue-chip drag are the leading indicators instead.
  ```

Attribution follows §5b's causation policy without relaxation: a forward-looking bullet is
either quoted and attributed to a named analyst, house or official with a date, or reframed
as a condition ("if the 10y INDOGB holds below X"). The newsletter never predicts a price on
its own authority. See `../compliance.md`.

This is not a takeaway or a verdict. Do not reinstate v1's Takeaway section under a new
name; the block's whole value is that it argues both ways and then names the tiebreaker.

Types worth surfacing: `stock_split{date, split_ratio}`, `right_issue{ex_date, old_ratio,
new_ratio, price, trading_period_start/end}`, `agm{agm_date, agm_time}`, and
`dividend{ex_date, dividend_amount, dividend_yield, payment_date}`. A dividend announced in
the news but with no ex-date in the endpoint yet belongs in Headlines, **not** the calendar.

## 5. Keep the four blocks' functions separate

This is a hard rule for this type, and the one the user corrected on the first draft. The
repetition failure mode is one fact appearing under Bites, again under Headlines, again
under Summary, each time slightly reworded.

- **Key Data Bites** is *derived from data*. Every line traces to an endpoint computation.
- **Other Major Headlines** is *from news sources*, and strictly **new factual events** in
  the window: bank earnings released, a merger rumor, a ruling, a mandate. Past tense,
  cited, one event per line. No analysis, no forecast, no Bites number reworded.
- **What's Ahead** is strictly **forward-looking catalysts** with a future date: the BI Rate
  decision, an MSCI rebalance effective date, an ex-date, a scheduled result. Nothing that
  already happened, including as background inside a "why it matters" cell.
- **Summary** is strictly **macro and structural analysis** over what the three blocks above
  already reported. A figure may recur here, but only carried inside a structural claim the
  issue has not made yet: what the number means for positioning, liquidity, rotation or
  policy transmission. The claim is the payload, the figure is context. A bullet that stops
  where the earlier block stopped is a restatement, cut it or finish it.

  ```markdown
  Restatement: Foreign investors flipped to a net IDR 2.37 trillion sell this week, a
  reversal from the prior week's IDR 583.99B net buy, led by a IDR 932.28B exit from TPIA.

  Finished: Foreign investors flipped to a net IDR 2.37 trillion sell this week, a reversal
  from the prior week's IDR 583.99B net buy, led by a IDR 932.28B exit from TPIA. Global
  capital is derisking its Indonesian exposure ahead of the coming rate decisions.
  ```

Before shipping, run a duplication pass: list every distinct fact in the issue and the
blocks it appears in. A fact in two blocks is a defect unless the second mention carries a
new claim. Resolve it by keeping the fact in the earliest block that owns it, then either
finishing the later mention with a real structural read or cutting it. An event that already
has a row in What's Ahead does not also get a Headlines bullet: the MSCI review's effective
date is a What's Ahead row, so the announcement drops out of Headlines rather than running
in both.

A fact must not appear in both. If `news/` reports a dividend declaration and you also have
the number from an endpoint, it goes in Headlines with its citation, and Key Data Bites gets
a different, computed line instead (sub-sector valuation, a flow aggregate, a breadth read).

Headlines carry **no category prefix** ("Dividends,", "Commodities,"). Just the fact and a
plain-text attribution.

**No citations in the body at all** (changed 2026-10-19, replaces the earlier plain-text
`(Source Name, DD Mon YYYY)` form for this type). Headlines bullets, macro rows in What's
Ahead, findings bullets and every other block state the fact with no parenthetical
attribution, no "(Kontan, 12 Oct 2026)", no "per Kontan". The attribution lives only in the
Sources list at the foot of the issue, one line per source carrying name, date, a short
description of the article and the link. Write each Sources description so a reader can match
it to the body fact by its content. Sectors API figures need no attribution either, the
footer already says figures are from sectors.app unless otherwise cited. The one credit that
stays in the body is the `instagram.com/sectorsapp` line under each social card.

The only links allowed in body copy are `sectors.app` links (tickers, sectors, brokers,
read-more and calendar links, the CTA) plus the Instagram and Threads follow-us line, all of
which keep the reader inside our own properties. Close the block with the news link.

## 5b. Writing rules applied throughout (ported from monthly-market-pulse)

These two cost the issue almost no length and apply to every block, not to one section.

### No claim subtitles (changed 2026-08-17)

**This type carries no italic claim subtitle under any heading.** The rule was ported from
`monthly-market-pulse` and the user cut every one of them from the 16 Aug issue: the
subtitles previewed the block's own bullets, so a reader met each fact twice within four
lines, which is the same repetition problem in miniature. Heading, then straight into the
data.

Where a block genuinely needs an observation, it goes **after** the data, as one short line
under the table or bullets, saying something the rows don't already say:

```markdown
## Top Weekly Movers

<gainers table>  <losers table>

All five of the week's biggest gainers sit outside the LQ45.
```

One line, no italics, no restating the table. If the only line you can write is a summary of
the rows above it, write nothing. `monthly-market-pulse` keeps its own subtitle convention
for now; this change is scoped to `weekly-insights-v2`.

### Key Data Bites: one point per subject (changed 2026-08-26)

Facts about the same subject share one bullet instead of scattering across the list. The
failure the user flagged: LQ45's weekly return sat on one line, LQ45 breadth on another, and
the best and worst LQ45 constituents on two more, so a reader assembling the benchmark
picture had to walk four separate bullets.

Group them under a labelled lead line with indented sub-points:

```markdown
- **LQ45 and IDX30 outperformed**: LQ45 +1.95% and IDX30 +1.77%, Friday to Friday, reversing
  last week's -1.25% and -1.58%. Breadth was 34 up, 9 down, two unchanged of 45.
  - Best constituent: HRTA (Hartadinata Abadi), +8.84%, closing at IDR 2,340.
  - Worst constituent: JPFA (Japfa Comfeed Indonesia), -4.74%, closing at IDR 2,210.
```

Same treatment for foreign flow: the market-wide net figure leads, the largest net buy and
net sell sit under it as sub-points. The block still ships around eight facts; it just
carries them in fewer, tidier points.

### No internal method notes in reader-facing copy (added 2026-08-26)

The reader gets the result, never the plumbing. These never appear in the body of an issue:

- Data-source qualifiers: "(exchange definition, `idx_daily_data`)", "(pinned Supabase
  query)", "computed-LQ45 route", endpoint or table names of any kind.
- Production notes: "chart generated this run", "no matching social card was available for
  the window, see appendix".
- Methodology asides that only exist to defend a number against an alternative method.

Write "foreign investors sold a net IDR 319.95B of ISAT this week" and stop. §3's rule that
foreign flow uses the exchange definition throughout governs **which number you compute**,
not what you tell the reader. The appendix is where method belongs, and it is the only place.

### Cut dead-end observations everywhere (generalised 2026-08-26)

The §3 rule against restated caveats applies to the whole issue, not just block 4. A line
whose content is that nothing is known carries no information, so it does not ship:

- "Nothing in this week's filings or corporate-action record explains who was on the other
  side of that foreign selling."
- "Nothing in the disclosed record ties the sale directly to the week's price action; the
  filing and the decline are concurrent, not proven cause and effect."

If the join has no meaning behind it, the finding itself is the thing to cut, not to publish
with a disclaimer attached. Careful wording under the causation policy below is what keeps a
claim honest; a trailing hedge is not. Every bullet in the issue should be actionable or
meaningful on its own.

### No section-level descriptions of any kind (tightened 2026-08-31)

Stricter than the italic-subtitle ban above, because the ban was evaded by writing the same
line without the italics. **Nothing sits between a section heading and that section's first
piece of data.** No subtitle, no framing line, no "here's what to look for", italic or not.
Heading, then the table, chart or bullets.

The one permitted exception is a plain date-scope line the reader needs to read the rows
("Five most recent disclosures in the 24-28 August window.", "Week of 31 August-4
September"). That states the window, never a conclusion about it.

An observation still goes **after** the data, as one plain line, and only when it says
something the rows do not. If the only line available summarises what is already visible
above it, write nothing.

### No inverted-pair sentence structures (added 2026-08-31)

Ban the "not X, but Y" family and its mirror in every block. These read as manufactured
insight and cost words without adding a fact:

- "not proof of what caused it", "confirmation that showed up alongside the rally, not proof"
- "a macro story rather than anything specific to BBRI's own results"
- "the split ran along sector lines, not just a handful of outliers"
- "the pattern isn't clean", "it reads as X, not Y"
- Anything of the shape "isn't A, it's B", "less A than B", "A, not B".

Write the positive claim and stop. If the contrast is genuinely load-bearing, state both
sides as facts in sequence ("BBNI saw net foreign selling and still closed up +1.34%"),
without the rhetorical pivot. The same rule kills the trailing hedge covered above: a
sentence whose second half retracts its first half ships neither half.

### Causation policy

Replaces the older hedge-everything phrasing, which produced flat prose without being any
more careful. The rule is **name the mechanism and label its status**:

- **Preferred:** "the mechanism would be translation: coal names earn in USD, so a weaker
  rupiah lifts reported revenue, consistent with what the tape did this week, though nothing
  in the disclosures confirms it drove the move."
- **Allowed, weaker link:** "consistent with", "the timing lines up with", "the same
  session", "which would show up first in".
- **Allowed, full causal claim, only when someone else said it:** quoted and attributed to a
  named analyst, house or official, with a date. Attribution carries the claim.
- **Still banned:** our own unattributed prediction, any price target we invented, any
  "will" about future prices, any advice framing. See `../compliance.md`; this policy does
  not relax the forward-looking-must-be-attributed rule.

Practical test: a reader can see exactly who is asserting what and how confident they are.
It fails if the newsletter itself is quietly predicting a price. Bites in block 4 and every
bullet in Summary are where this bites hardest.

## 6. Standing links

All `sectors.app` links carry UTMs, see `../newsletter-format.md`'s **UTM convention**.
`utm_campaign` is `weekly-insights-v2_<issue-date>`; `utm_content` is the block slug in the
right-hand column below.

| Slot | URL | `utm_content` |
|---|---|---|
| Key Data Bites tickers | `sectors.app/idx/<ticker>` | `key-data-bites` |
| Movers tables | `sectors.app/idx/<ticker>` | `top-movers` |
| Findings block tickers | `sectors.app/idx/<ticker>` | `data-unearthed` |
| Filings tickers | `sectors.app/idx/<ticker>` | `insider-filings` |
| Headlines tickers | `sectors.app/idx/<ticker>` | `headlines` |
| Headlines, read more | `sectors.app/indonesia/news` | `headlines` |
| What's Ahead tickers | `sectors.app/idx/<ticker>` | `whats-ahead` |
| What's Ahead, calendar | `sectors.app/indonesia/calendars/dividend-calendar` | `whats-ahead` |
| Summary tickers | `sectors.app/idx/<ticker>` | `other-side` |
| Macro row citations | BI, BPS, wire coverage | **no UTM** |
| CTA button | `sectors.app/watchlist` | `cta` |
| CTA body, "workflow" | `sectors.app/workflow` | `cta` |
| Footer citation | `sectors.app` | `footer` |
| Block 4 close | `instagram.com/sectorsapp`, `threads.net/@sectorsapp` | **no UTM** |
| Headline citations | plain text in body, URL in **Sources** only | **not linked** |

## 7. Self-review before delivery

- Nine blocks, in order, nothing reinstated from v1's prose sections? **The issue opens on
  the Key Data Bites heading**, with nothing between the header block and it: no thesis
  paragraph, no hook line, no scene-setter naming the week's tickers (declined 2026-08-03,
  re-confirmed 2026-08-31 after one shipped anyway). A hook belongs in the subject line.
- Are there **no** section descriptions under any heading, italic or plain (§5b, tightened
  2026-08-31)? The only line allowed between a heading and its first data is a bare date
  scope. Every block-level observation sits after the data as one plain line that says
  something the rows do not.
- **No inverted-pair sentences anywhere** (§5b): no "not X, but Y", "rather than", "isn't
  A, it's B", "not proof of", "the pattern isn't clean". Positive claim, then stop.
- **Every bucket image in block 4 carries `width="268"` and `style="...width:268px;max-width:100%;..."`.**
  `width:100%` or any other width is a defect, fix before shipping.
- **Block 4's images are bucket social cards only.** Every `<img src>` in the block starts
  `https://storage.googleapis.com/sectorsapp-sea/social_media/`. A `mailroom-email-assets`
  URL, a `charts.mjs` render or any other generated image in this block is a defect: stop
  and ask the user for the week's card URLs instead of shipping a substitute. If no eligible
  card exists for a finding, cut the finding.
- **Does the Summary ship in full** (bull read, bear read, What to watch next), and does every bullet in blocks 4 and 8 lead with a reading and use at most two figures?
- **Are all section titles exactly the fixed titles above**, and does every finding heading carry the weekly figure?
- **No em dashes or en dashes anywhere in the issue**, Sources and Appendix included. Use a
  colon between a source and its label, a comma or a full stop in prose.
- Sources list carries only the **news and research pieces actually cited for a fact in this
  issue**. Reference pages that merely confirm a date (public-holiday calendars, a central
  bank's published meeting schedule, exchange session hours) are not sources, drop them.
- Appendix ends at the last endpoint-and-fields bullet plus the Instagram credit. Nothing
  after it: no method note, no window description, no chart or section attribution.
- Does every linking sentence pass §5b's test: the reader can see who asserts what and how
  confident they are, and the newsletter itself never predicts a price?
- What's Ahead: are the scheduled macro rows real, dated, cited, and each one mapped to a
  ticker or sector that appears elsewhere in this issue? Unmapped rows cut?
- Summary: two or three bullets per side, every one traceable to a figure already in
  the issue with no new number introduced **and no figure reprinted** (conceptual reference
  only), each bullet joining two reported things rather than restating one, the bear read
  given genuine weight, and **What to watch next** a specific dated event rather than a
  vague "time will tell"? Every forward-looking bullet attributed or reframed as a condition?
- Key Data Bites: every line computed from an endpoint, none duplicated in Headlines, and
  **facts about the same subject grouped into one point** with indented sub-points (benchmark
  returns with breadth and best/worst constituent, foreign flow with largest buy and sell)?
- **No internal method notes anywhere in the body**: no "(exchange definition, ...)", no
  endpoint, table or query names, no "chart generated this run", no "no matching social card
  available"? Method confined to the appendix?
- **No dead-end lines**: nothing saying the record explains nothing, no "concurrent, not
  proven cause and effect" trailer? Findings with no meaning behind them cut outright?
- Headlines: every line news-sourced and cited, strictly new factual events in the window,
  no analysis or forward-looking items, no category prefixes, off-topic non-IDX stories
  dropped?
- **Duplication pass run (§5):** every distinct fact appears in exactly one of Bites,
  Headlines, What's Ahead, Summary? Any fact found in two blocks resolved by keeping
  it in the earliest owning block?
- Block 4: two or three findings, each a **join** of two sources, not a single-endpoint
  restatement? Bullets, never paragraphs?
- Were the findings derived from the API **first**, with cards picked to illustrate them,
  rather than written around whatever images existed?
- **Are block 4's visuals real bucket social cards, not generated charts?** Was the user
  asked for the week's card URLs before drafting the block? A rendered `chart-*.svg` in this
  block is a defect, with no exception: a week short on cards ships fewer findings.
- Does every card URL's `YYYYMMDD` fall inside this issue's Mon-Fri window, with story-only
  prefixes excluded and every image credited to `instagram.com/sectorsapp`?
- **Foreign flow uses the exchange definition (`idx_daily_data`) throughout, never the broker
  aggregation** (§3), pulled via the fixed `foreign-flow-range.sql` query, not a per-ticker API
  loop. Card figures and prose figures must come from the same method; exchange and broker
  disagree on direction, so mixing them publishes a contradiction.
- Card windows read off the image and stated in copy where they differ from the wrapped week?
- Movers labelled with the window they belong to, `latest_close_date` checked, and the
  computed-LQ45 route (§2b) used plus disclosed if the snapshot didn't match?
- Filings filtered by `timestamp` to on-or-before the window's Friday, structured fields only?
- Calendar: `null` guards in place, week grid plus beyond-the-week table, dividend link?
- Ticker style: bare linked `TICKER` everywhere, **never** `TICKER (Company Name)` and
  never `Company Name (TICKER)`, in tables and prose alike, including the movers tables,
  Key Data Bites, the findings bullets and Other Major Headlines. **No exceptions**
  (the former Headlines carve-out was removed 2026-08-31): a Headlines bullet about a
  company names the ticker only. If a company has no IDX ticker, name the company plainly
  and link nothing.
- **Every single ticker occurrence is linked**, not just the first per section and not just
  table cells (skill-wide, `SKILL.md` hard rule 13). The same ticker appearing eight times across the issue
  carries eight `sectors.app/idx/<lower>` links, each with the block's own `utm_content` and
  `utm_term=<ticker>`. Grep the finished HTML for the ticker string and check every hit sits
  inside an `<a>`. Grep for a literal `$` as well, it should return nothing.
- **No citation of any kind in the body** (no `(Source, date)` text, no outlet name in a bracket). Grep the body for `(Kontan`, `(Bisnis`, `(Kompas`, `(Bloomberg`, `(Metro` and similar, zero hits outside Sources. Only the Instagram credit under a social card stays.
- **No clickable citation in the body.** Grep the HTML for `<a href="http` and confirm every
  hit is a `sectors.app` link, an Instagram/Threads follow link, or sits inside the Sources
  list. A news outlet URL anywhere in Headlines, What's Ahead or the findings bullets is a
  defect: move it to Sources and leave nothing in the body.
- **No generated chart anywhere in the issue.** No `chart-*.svg` in the delivery folder, no
  `charts.mjs` call in the run. Block 4's images are bucket social cards or the finding is
  cut.
- Bullets in the findings block: **three each**, four at the outside? Any restated caveat,
  structural recap, "taken together" closer or production note ("chart generated this run",
  "no matching social card") cut?
- Headings carry **no italic claim subtitle** anywhere in the issue? Where a block needs an
  observation, does it sit as one plain line *after* the table or bullets?
- Is the two-sided block headed **Summary**, closing with **What to watch next** and its two
  conditional bullets, one per read?
- Every figure restated as text under its image, alt text complete?
- Is the Appendix (endpoint/field trace) present, after Sources and before the
  disclaimer? **Endpoints and field names only**, one bullet per endpoint, with no section
  label, chart name, table name, derivation or usage note attached to any bullet
  (`../newsletter-format.md`'s Appendix section)?
- Appendix credits `instagram.com/sectorsapp` for every social image, with no bucket name,
  filename or storage path anywhere in reader-facing copy?
- No story-only render used (`filings-plain`, `filings_daily`, `broker-bandar`,
  `broker-trending`, `broker-weekly`, `macro-news`, `news-tier1`)? Those expire in 24 hours
  and would make the Instagram credit a dead end.
- **UTMs on every `sectors.app` link and on nothing else?** Third-party citations, Instagram
  and Threads stay clean. `&amp;` separators in the HTML, plain `&` in the Markdown.
- `newsletter.md` and `newsletter.html` both updated, never one alone?
