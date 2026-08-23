# Weekly Insights v2, workflow

Intended send: Monday morning (confirmed 2026-07-20, moved off the original Saturday
cadence). Covers the trading week that just closed (Mon-Fri); the issue date is
**today's actual date, whatever day the draft is generated on** (revised 2026-07-27,
see **Header block, weekly-insights-v2** below), not the `data_as_of` Friday date and
not a computed Monday. The successor to `weekly-wrap.md`. Both are live while the
migration finishes; when v1 is retired this file becomes the only weekly recipe.

Read `../newsletter-format.md`'s **Weekly Insights v2** skeleton and `../compliance.md`
before drafting. Worked reference: `newsletter/samples/weekly-insights-v2/`.

## What changed from v1, and why

v1 ran eleven sections and read like a long-form market report. The revamp cut it to eight
blocks, on the brief that the issue is an **info-packed digest, not a lengthy read**. The
market-level prose sections (Week in Numbers, What's the Buzz, Chart of the Week, What
Actually Traded, Sector Pulse, Takeaway) are gone; their numbers survive as single lines
inside Key Data Bites. What replaces them is one analysis block that has to earn its place.

The format borrows from two references the user supplied: Carbon Finance (dated masthead,
one-line greeting, a dense linked-facts box, tagless headline one-liners) and Algo Research
(a findings block, a forward calendar). **The greeting itself was dropped 2026-07-29**
(see `newsletter-format.md`'s **Weekly Insights v2** skeleton, block 1) — everything
else about the Carbon Finance masthead influence still applies.

## 1. Settle the window

Identical to v1. The API's "today" lags ~1 day (UTC), so anchor to whatever `data_as_of`
you actually get back, and use the most recently completed Mon-Fri window. Prior week for
the WoW compare is that same window shifted back exactly 7 days.

One extra call this type needs: the **Friday before the prior week** for `index-daily`,
because the prior-week WoW figure is a Friday-to-Friday change and the index endpoints carry
no prior-close field. Fetch `?start=<prior-mon-minus-2>&end=<prior-fri-minus-7>` and take the
last row.

### Header block, weekly-insights-v2 (revised 2026-07-27)

The header line under the masthead reads `Issue #{n} | {issue_date} | week of
{mon}-{fri} | data as of {data_as_of}`, four fields, three different dates. Don't
collapse any two of them:

- **`week of {mon}-{fri}`**: the Mon-Fri window settled above.
- **`data as of {data_as_of}`**: that window's Friday, the API's last trading day,
  matches the frontmatter `data_as_of` field.
- **`{issue_date}`**: **today's actual date**, the real date this draft is generated
  on, whatever day of the week that is. This is the send date, it goes in the
  frontmatter `date:` field, the delivery folder's `<YYYY-MM-DD>`, the HTML `<!-- -->`
  header comment, and every `utm_campaign=` suffix on every link in the issue, all
  four must agree.

  **Superseded 2026-07-27**: earlier revisions computed this as a theoretical Monday
  (`window_monday + 7 days`, "the Monday immediately after that Friday's close") or an
  even older same-week Saturday. Both are retired. Neither survives a draft that
  actually runs on a different day than assumed, e.g. a manually re-triggered run or a
  merge that lands a day late: the masthead would then name a date the issue didn't
  actually go out on. Using the real run date makes the header self-consistent by
  construction regardless of when drafting or sending happens.

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

Endpoint gotchas carry over from `weekly-wrap.md` §2 unchanged. The ones that bit on the
worked run:

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
and three to five short bullets. Never paragraphs.

### Visuals: the social cards

Block 4's images come from the carousel pipeline, hosted on our own GCP bucket (see
**Where the filenames come from**, below, for the listing mechanism and the exact URL
shape). There's no separate publish/rehost step in the draft workflow for these —
unlike a generated chart, a real card already has a permanent public URL by the time
it's selected, so whatever gets written into `<img src>` during drafting is final.

Filenames follow `<topic>_<YYYYMMDD>_<n>.jpg`, sometimes with a slide index
(`foreign-flow-1_20260718_1.jpg`). **The date is the generation date, not the data window**,
so read the window off the image itself and state it in copy. The worked sample's CUAN card
is dated 10 July and covers 19 Jan to 9 Jul, which is why its bullets say so explicitly.

Two images under one heading go **side by side, two columns** (each ~263-268px, half the
content column); **a single image under its own heading runs at 500px** (revised
2026-07-29, was half column at 268px), near the full content width, not squeezed to
the two-column size just because it happens to be alone.

**Credit every social image to `instagram.com/sectorsapp`, always, whatever the actual
source.** That is the public home of this content and the only attribution a reader should
see. The GCP bucket is internal plumbing: it may appear in an `<img src>` because that is
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

**Where the filenames come from.** The carousel pipeline writes every card to a GCP
bucket we own, `sectorsapp-sea`, under `social_media/<filename>` (changed 2026-08-24 —
was the carousel's Supabase bucket; that copy still exists but is no longer where this
skill looks). **List it directly, unattended, no MCP connector and no credential at
all** — this bucket allows anonymous listing over its plain public HTTP API, unlike the
Supabase one (which never did; see the retired approach below):

```bash
curl -s "https://storage.googleapis.com/storage/v1/b/sectorsapp-sea/o?prefix=social_media/&fields=items(name,timeCreated)"
```

Verified live 2026-08-24: 547 objects, one page, no `nextPageToken` (the JSON API pages
past ~1000 results — if a future run's response includes one, follow it with
`&pageToken=<token>` rather than assuming the list is complete). **Ignore `timeCreated`
entirely for both filtering and ordering** — it's the date this bucket was backfilled
from Supabase (every object clustered around 2026-08-19 regardless of the card's actual
content date), not when the card was generated. The filename's own `YYYYMMDD` is the
only date that means anything here; that's already the selection criteria's date filter
below, unchanged.

Build each eligible name's public URL as:

```
https://storage.googleapis.com/sectorsapp-sea/social_media/<filename>
```

and **reference it directly in `<img src>`** — public, unauthenticated, no signed-URL
expiry, so email clients load it with no rehosting step. A human can also browse the
bucket directly at
[console.cloud.google.com/storage/browser/sectorsapp-sea/social_media](https://console.cloud.google.com/storage/browser/sectorsapp-sea/social_media)
for the same file list.

<details>
<summary>Retired approach (through 2026-08-24): Supabase MCP connector</summary>

The carousel pipeline's Supabase bucket (`social_media_generation`) held the same files
under the same filenames, but Supabase's own public HTTP API refuses to list a bucket
without a credential (`POST /storage/v1/object/list/<bucket>` returns `headers must have
required property 'authorization'`), so this skill queried `storage.objects` — the
Postgres table Supabase Storage keeps that metadata in — through the Supabase MCP
connector instead (`scripts/fixed-queries/social-media-bucket-listing.sql`, now deleted).
That worked, but made card selection depend on a connector/credential
(`SUPABASE_ACCESS_TOKEN`) that the GCP bucket's own public listing API doesn't need at
all. Kept here only in case the GCP bucket's public listing is ever locked down and this
has to be resurrected.

</details>

### Auto-selecting cards, unattended (always — no connector, no credential)

**Prefer this over generating a chart, always — a real social card beats a generated
one whenever one is actually eligible.** Chart generation is the fallback for when
nothing eligible exists that week, not a first choice taken for convenience. Unlike the
retired Supabase-based approach, there's no "connector unavailable" branch to consider
here at all — the GCP bucket's listing endpoint is a plain public HTTP call, always
reachable from any runner with internet access:

1. Derive the week's two or three findings from the API exactly as always ("Findings
   first, images second," above — this doesn't change).
2. List the bucket per **Where the filenames come from**, above.
3. Apply the existing selection criteria above (date filter, drop story-only prefixes,
   relevance, window-gap note, reconciliation, sets, budget) to the returned list exactly
   as an interactive run would against a human-read file list, then build each eligible
   card's URL per **Where the filenames come from**, above. This is the one visual path
   in this skill that involves no local file at all: **never save a real card under a
   `chart-<slug>.svg` name or any name the delivery pipeline's chart step would match.**
   The unattended CI run rasterizes and re-uploads every `chart-*.svg` it finds in the
   delivery folder on the assumption that it's a locally-generated chart in need of
   hosting; a real card already has a permanent public URL and doesn't need or want that
   treatment. Giving one that filename would upload a duplicate copy to mailroom's own
   bucket for no reason and rewrite a perfectly good URL into a different one.
4. **Distinguish the two reasons this can come up empty — they are not the same, and
   collapsing them hides real bugs.** Silently treating both as "just use charts" is
   how a broken listing call gets mistaken for a genuinely quiet week and never fixed:

   | What happened | How you can tell | What to record in `run-notes.md` |
   | --- | --- | --- |
   | **Listing call errored** | the HTTP request itself failed (network error, non-200 status, bucket renamed/moved) | **Quote the actual error text.** This is a defect (a real outage, or the bucket path changed), not a config gap, and needs fixing rather than absorbing |
   | **Listing fine, nothing eligible** | the call returned objects, but none pass the date/story-prefix/relevance filters | "N objects listed, none eligible for the 20-24 Jul window." Normal, not a fault |

   The endpoint itself is known-good: verified live 2026-08-24 against the real bucket
   (547 objects returned via the JSON API's `items(name,timeCreated)` fields, no auth).
   So an error after that date means something actually changed (the bucket went
   private, moved, or renamed), and should be surfaced loudly, never quietly swallowed
   into the chart fallback.

   In both cases, fall back to a generated chart for that finding so the issue is
   never image-less:
   - Render with `../../scripts/charts.mjs` instead. Pick the chart kind from the
     finding's own shape, the same judgement the `dataviz` skill's form heuristic
     describes: `moversChart` for a ranked signed list, `barChart` (with
     `financial: true`) for a signed comparison, `sparkline`/`line` for a path over the
     week, `donut` for a mix.
   - Skip the Instagram/Threads credit line under a generated chart, it credits card
     artwork that isn't there. Keep the follow-us block at the end of block 4, that one
     is a standing CTA rather than an attribution.
   - Note in `run-notes.md` (never inside the sent HTML, see SKILL.md's
     **Running unattended** section) that this finding's visual was generated rather
     than sourced from a card, and why, so a reviewer knows without having to guess.

A mixed issue is normal and correct: one finding illustrated by a real card, another by
a generated chart, because only one of them had an eligible card that week. Don't force
consistency across findings at the expense of using a real card wherever one exists.

> **Resolved 2026-07-27: default to the exchange definition (`idx_daily_data`) for weekly
> aggregated foreign flow. Never use the broker-domicile aggregation (`idx_broker_summary_daily`
> / `idx_broker_registry`, what `broker-summary/top` and `foreign-flow/{symbol}` return) for this
> figure.** The 18 Jul 2026 issue was left mixed (broker figure in Key Data Bites next to
> exchange-definition cards) and is not a model to copy.

> **The cards and the API use two different definitions of foreign flow. Never mix them
> in one issue.** Resolved 2026-07-20 against the database, after an earlier note here
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
> **Use the exchange definition** (`idx_daily_data`) for this issue type, always. It is what
> Indonesian press quotes as "asing net buy/sell", and it is what the cards show, so card and
> copy agree by construction. Caveat on the exchange figure: net volume
> times `close` is an approximation, since only volumes are stored and a true value would need
> separate buy-side and sell-side average prices.

**Fixed query, not a per-ticker API loop.** Run
`../../scripts/fixed-queries/foreign-flow-range.sql` through the Supabase MCP connector
(read-only), substituting the week's Mon-Fri `{{start}}`/`{{end}}`:

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
the type's substitute for the standard `chart-<slug>.svg` hero chart: if no suitable card
exists for the week's findings, generate a chart with `charts.mjs` instead, so the issue is
never image-less.

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

## 4c. The Other Side

The two-sided read, placed after What's Ahead and immediately before the CTA. Ported from
`monthly-market-pulse.md` §8.9, compressed for a weekly.

**No new fetches.** Every bullet is grounded in a number or citation that already appears
earlier in this issue. If a bullet needs a figure the issue doesn't carry, that figure
belongs in Key Data Bites first, and then the bullet may reference it.

Shape:

- **The bull read** — two or three bullets.
- **The bear read** — two or three bullets. Give it genuine weight; a token bear block that
  concedes nothing is worse than no block.
- **What would settle it** — one closing line naming the specific dated print or event that
  distinguishes the two reads. Normally this is one of block 7's own rows, corporate action
  or macro, which is why the two blocks sit next to each other.

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

## 5. Keep the two content sources separate

This is a hard rule for this type, and the one the user corrected on the first draft:

- **Key Data Bites** is *derived from data*. Every line traces to an endpoint computation.
- **Other Major Headlines** is *from news sources*. Every line has an outbound citation.

A fact must not appear in both. If `news/` reports a dividend declaration and you also have
the number from an endpoint, it goes in Headlines with its citation, and Key Data Bites gets
a different, computed line instead (sub-sector valuation, a flow aggregate, a breadth read).

Headlines carry **no category prefix** ("Dividends —", "Commodities —"). Just the fact and
its source link. Close the block with the news link.

## 5b. Writing rules applied throughout (ported from monthly-market-pulse)

These two cost the issue almost no length and apply to every block, not to one section.

### Claim subtitles

Every block heading from Key Data Bites onward carries one italic sentence directly under
it, stating what that block's own numbers argue. **The heading name itself never changes**,
the heading names the data and the subtitle names the argument.

```markdown
## Top Weekly Movers

*Both ends of the table are Basic Materials names, so the sector label says nothing about
what actually happened.*
```

The subtitle must be falsifiable by that block's own figures. A restatement of the heading
("Here are the week's movers", "The latest insider disclosures") is not a claim; cut it and
write the real one. One sentence, never two.

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
bullet in The Other Side are where this bites hardest.

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
| The Other Side tickers | `sectors.app/idx/<ticker>` | `other-side` |
| Macro row citations | BI, BPS, wire coverage | **no UTM** |
| CTA button | `sectors.app/watchlist` | `cta` |
| CTA body, "workflow" | `sectors.app/workflow` | `cta` |
| Footer citation | `sectors.app` | `footer` |
| Block 4 close | `instagram.com/sectorsapp`, `threads.net/@sectorsapp` | **no UTM** |
| Headline citations | Bisnis, Kontan, Kompas, … | **no UTM** |

## 7. Self-review before delivery

- Nine blocks, in order, nothing reinstated from v1's prose sections? No thesis paragraph
  added above Key Data Bites, that was considered and declined (2026-08-03).
- Does every block from Key Data Bites onward carry a one-sentence italic claim subtitle,
  with the heading name itself unchanged, and is each subtitle falsifiable by that block's
  own numbers rather than a restatement of the heading?
- Does every linking sentence pass §5b's test: the reader can see who asserts what and how
  confident they are, and the newsletter itself never predicts a price?
- What's Ahead: are the scheduled macro rows real, dated, cited, and each one mapped to a
  ticker or sector that appears elsewhere in this issue? Unmapped rows cut?
- The Other Side: two or three bullets per side, every one traceable to a figure already in
  the issue with no new number introduced, the bear read given genuine weight, and **What
  would settle it** a specific dated event rather than a vague "time will tell"? Every
  forward-looking bullet attributed or reframed as a condition?
- Key Data Bites: every line computed from an endpoint, none duplicated in Headlines?
- Headlines: every line news-sourced and cited, no category prefixes, off-topic non-IDX
  stories dropped?
- Block 4: two or three findings, each a **join** of two sources, not a single-endpoint
  restatement? Bullets, never paragraphs?
- Were the findings derived from the API **first**, with cards picked to illustrate them,
  rather than written around whatever images existed?
- **Foreign flow uses the exchange definition (`idx_daily_data`) throughout, never the broker
  aggregation** (§3), pulled via the fixed `foreign-flow-range.sql` query, not a per-ticker API
  loop. Card figures and prose figures must come from the same method; exchange and broker
  disagree on direction, so mixing them publishes a contradiction.
- Card windows read off the image and stated in copy where they differ from the wrapped week?
- Movers labelled with the window they belong to, `latest_close_date` checked, and the
  computed-LQ45 route (§2b) used plus disclosed if the snapshot didn't match?
- Filings filtered by `timestamp` to on-or-before the window's Friday, structured fields only?
- Calendar: `null` guards in place, week grid plus beyond-the-week table, dividend link?
- Ticker style: bare linked `$TICKER` everywhere, **never** `Company Name ($TICKER)`, in
  tables and prose alike, including the movers tables?
- Every figure restated as text under its image, alt text complete?
- Appendix credits `instagram.com/sectorsapp` for every social image, with no bucket name,
  filename or storage path anywhere in reader-facing copy?
- No story-only render used (`filings-plain`, `filings_daily`, `broker-bandar`,
  `broker-trending`, `broker-weekly`, `macro-news`, `news-tier1`)? Those expire in 24 hours
  and would make the Instagram credit a dead end.
- **UTMs on every `sectors.app` link and on nothing else?** Third-party citations, Instagram
  and Threads stay clean. `&amp;` separators in the HTML, plain `&` in the Markdown.
- `newsletter.md` and `newsletter.html` both updated, never one alone?
