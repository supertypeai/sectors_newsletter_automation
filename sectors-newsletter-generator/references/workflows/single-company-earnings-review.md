# Single company deep dive, earnings-review format, workflow

Second format of `single-company-deep-dive`. One company, one earnings print, explained
quarter-style and delivered as a PDF. Read `../newsletter-format/skeletons/single-company-earnings-review.md`,
`../sourcing.md` and `../compliance.md` before drafting.

## 1. Confirm there is a print to review

The company must have a quarterly or half-year result published in the last few weeks.
```bash
node ../../scripts/sectors.mjs \
  "company/get_quarterly_financial_dates/<TICKER>/" \
  "financials/quarterly/<TICKER>/?report_date=<latest>" \
  "financials/quarterly/<TICKER>/?report_date=<same-quarter-last-year>" \
  "company/get-segments/<TICKER>/" \
  "company/report/<TICKER>/?sections=overview,valuation,future" \
  "daily/<TICKER>/?start=<5y-ago>&end=<data_as_of>" \
  --save-dir <scratch-dir>
```
No quarter on file, or no year-ago quarter to compare, means this format cannot run: say
so and offer the full format. Segment data absent means the sankey falls back to the
income-statement ladder only (revenue, cost, operating profit, tax, net profit).

Daily ranges clamp to 90 days (`../sectors-api/data-quality.md`). For the 5-year price
chart, page the range in 90-day windows or use the monthly series if the API offers it,
and confirm the echoed `start`/`end`.

## 2. Gather the narrative

The API gives numbers, not what management said. Web-search the results release, the
call summary and the filing for the three items under "What Mattered" (`../sourcing.md`).
Attribute every management statement and date it. Guidance appears only if the company
published it. If nothing citable explains a driver, say the filing did not explain it.

## 3. Build

- Charts via `../../scripts/charts.mjs`: price line, `sankeySite` (site-matching look, see `newsletter-format.md` Color convention), paired `barChart` or
  `stackedBar` for quarter vs year-ago by segment. Opaque background rect, labels inside
  the canvas (`../newsletter-format.md`). Chart numbers must equal the table and bullet
  numbers, derive both from the same saved JSON.
- Band-check every ratio (`../sectors-api/data-quality.md`) and reconcile segment sums to
  group revenue before quoting either.
- Write `newsletter.md` and `newsletter.html` together (never one alone), then render:
```bash
node ../../scripts/html2pdf.mjs newsletter.html newsletter.pdf
```
- Open the PDF and check page breaks: no chart split across pages, no heading stranded at
  a page bottom, no clipped right edge. Add `break-inside: avoid` on chart and table
  wrappers in the HTML if needed, then re-render.

## 4. Self-review

- Opening hook states a stated-window record with a source, and the worry paragraph names
  priced concerns without endorsing them.
- Quarter at a Glance figures match the sankey and the bars exactly.
- Every driver sentence is either from the API or attributed to a dated outside source.
- Three What Mattered items, two about the business, one about the setup, each with its
  own generated visual and none a copy of a company slide.
- Open question stated, not answered. No "cheap", no target, no buy/hold/sell, no first
  person (`../compliance.md`).
- Delivered `newsletter.md`, `newsletter.html`, `newsletter.pdf` and the chart SVGs, with
  the Appendix (endpoints and fields only) and the disclaimer present in all three.
