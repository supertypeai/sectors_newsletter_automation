# Section skeleton: single-company-deep-dive, earnings-review format

Second format of the `single-company-deep-dive` type. Pick it at the format question in
`../../workflows/single-company-deep-dive.md` step 0. Use it when the reason to publish is
one quarterly or half-year earnings print and the reader wants that print explained, not
the whole company re-underwritten. Reference shape: a PDF earnings review that opens on the
stock's long-run record, shows how the company makes money in one picture, lists the
quarter at a glance, then argues three things that mattered and ends on the open question.

Everything in `../../newsletter-format.md` still applies (header block, ticker mentions,
UTM, color, number formatting, Sources, Appendix, disclaimer). The 900-1,200 word cap, the
three-figures-per-paragraph cap and the "five body sections" rule of the full format do
not apply here.

**Length.** 1,000 to 1,500 words, delivered as `newsletter.md`, `newsletter.html` and
`newsletter.pdf`. The PDF is the primary deliverable, the HTML is its source.

**Voice.** Plain editorial voice, never first person, bold on the claim words
inside a paragraph so a skimmer can read the bold alone and get the story. Roughly one
bold phrase per sentence at most, never whole sentences.

1. **Headline and date line** — Title Case, `<Company> Earnings Review (<Qn FYyyyy>)`
   style is acceptable here, it is a recurring label. Date of issue under it.
2. **Opening hook** — two short paragraphs, no heading. First: the stock's long-run record
   against its index (annualised return over a stated window, and what a fixed sum would
   have become), from `daily/{symbol}` and the index series. Second: the year to date, the
   one or two worries the market has priced, then one sentence saying the business kept
   growing through them. End with "Let's dive in."
3. **Disclaimer** — one italic paragraph, wording from `../../compliance.md`.
4. **Company block** — set in a shaded box (`#f2ede4`, rounded; a blockquote in the Markdown). H2 of company name and linked ticker, the 5-year price chart
   (`daily/{symbol}`, non-zero y-axis, caption states the window and total change), then a
   three-sentence italic description: what the company does, how revenue splits, what the
   quarter was mostly about, with the single headline surprise.
5. **How It Makes Money** — the `sankey` of the income statement for the quarter: revenue
   segments in, operating costs and profit out, with YoY on each node
   (`financials/quarterly`, `company/get-segments`). Banks use net interest income and fee
   income in, provisions and opex out. Chart only, one caption sentence.
6. **Quarter at a Glance** — bullet list, each bullet a bold metric label and the figure
   with YoY, plus one indented sub-bullet giving the driver in a sentence. Fixed metrics:
   revenue, net profit, EPS, the sector's key margin (operating margin, or NIM for a bank),
   each reported segment, and guidance. Guidance bullet only if the company gave one,
   attributed to the company, never invented.
7. **What Mattered** — three numbered items, `1. <claim as a heading>`. Each is two or
   three paragraphs: the finding stated plainly, the mechanism, then what management or the
   filing said about it, attributed. Each item carries one visual: a chart generated from
   API data (quarterly revenue by segment as paired bars against the year-ago quarter is
   the default), or a table of monthly or segment growth. Do not screenshot or reproduce a
   company's own slides, regenerate the figures as a Sectors chart and cite the filing.
   Two of the three items are about the business, the third about the setup (a structural
   shift, a regulatory change, a new market) so the issue is not a pure recap.
8. **The Open Question** — one call-out block (left rule, bold question), stating the
   debate the quarter leaves open and naming what the next section would weigh. Never
   answer it as a buy, hold or sell. Valuation context may follow as one short paragraph
   against the name's own band and peers, as context only (`../../compliance.md`).
9. **What to Watch Next** — three or four forward-looking bullets, as in the full format.
10. **Sectors CTA** — replaces any paywall block. One short paragraph and one button, either
    "Set up a workflow or add <TICKER> to your watchlist" (workflow/watchlist setup page) or
    "Read <TICKER> on Sectors" linking `https://sectors.app/idx/<lower-ticker>`. Pick the
    ticker page unless the issue's last section points at a recurring metric worth alerting
    on, then pick the workflow CTA. Apply the UTM convention
    (`~/.claude/skills/UTM_CONVENTION.md`), never copy it into the repo.
11. **Sources, Appendix, disclaimer footer** — as in the full format.

**Headings.** Section headings 5 to 8 may use the fixed slot names above (this format is
meant to be recognisable quarter to quarter), except the three `What Mattered` item titles,
which state this quarter's finding.

**What this format is not.** Not a deep dive: it does not test the moat, run the margin
ladder across eight years, or build the macro section. If the user wants those, use the
full format.
