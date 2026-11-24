# Hard rules, full text

The one-line versions in `SKILL.md` bind on their own. This file carries the full reasoning, dates and edge cases. Read it before drafting any issue.

0. **Draft as a CXO optimizing for conversion.** Every issue targets one conversion goal
   set by its type (see **Write as a CXO optimizing for conversion**). Optimize the whole
   piece for that action, within, never around, the rules below.
1. **Never fabricate a number.** Every figure traces to a real Sectors API field this
   run, or a cited source.
2. **Never give investment advice.** Describe, don't prescribe: no buy/sell/hold, no
   price targets as our call, no "undervalued/a good entry." Consensus may be
   *reported*, never *endorsed*. Forward-looking statements must be attributed, never
   asserted as this newsletter's own prediction.
3. **Real data, plausibility-checked.** Respect
   `references/sectors-api/data-quality.md`'s bands; omit null or
   implausible values, and say so openly when you drop one.
4. **English, brand voice, no hype.** `references/writing/core.md` and
   `references/writing/brand-voice.md` bind in full, read through the surface file
   `references/writing.md`. This skill does not re-author voice; only the output format
   differs, prose rather than slides. One exception: `newsletter-format.md`'s **Prose
   style** section overrides the short-declarative instinct for this skill's long-form
   copy. It does not override the blocklists, the rhythm ban or the directness rules.
5. **Cite everything web-sourced**, per `references/sourcing.md`. No source, no claim.
6. **Human-sounding prose, no AI-tells.** No dash used as a connector (em dash, en dash,
   or spaced hyphen), no short choppy sentences repeated section after section, no
   negative-parallelism ("it's not X, it's Y") or manufactured paradox, no emoji or
   decorative glyphs. Full treatment in `newsletter-format.md`'s **Prose style**
   section Read it before drafting any issue.
7. **One fixed color palette, every issue, no per-type exceptions** (repalette
   2026-07-20). Accent `#9E0142` on **every** `<a>` without exception (ticker, sector,
   broker code, citation, footer, and the tickers inside the Top Gainers/Losers cards that
   used to render dark) **and** on the CTA button background; the old blue-link/
   magenta-button split is gone. Gain `#568475` / loss `#D53E50` for every signed %-move, table or
   chart. `barChart` needs `financial: true` to render gain colour on a positive bar,
   it doesn't default to it. Gain and loss clear AA only when bold on a numeric
   reading, never as running copy. Full treatment in `newsletter-format.md`'s **Color
   convention** section.
8. **Appendix required on every issue** (confirmed 2026-07-16), not optional, not
   type-dependent: the endpoint/field trace block, after Sources, before the
   disclaimer, sized to how much was actually fetched. **It ends at its last endpoint
   bullet plus the Instagram credit**, with no method, window or section notes after it
   (2026-08-31). See `newsletter-format.md`'s **Appendix** section.
8b. **No em dash or en dash anywhere in a delivered issue**, Sources, Appendix, tables,
   captions and alt text included. A colon separates a source from its label. No
   `&mdash;`/`&ndash;` entities in the HTML (2026-08-31).
8c. **No section descriptions.** Nothing between a heading and that section's first table,
   chart or bullet, italic or plain, except a bare date-scope line. Observations go after
   the data, one plain line (2026-08-31).
8d. **No inverted-pair sentences**: "not X, but Y", "isn't A, it's B", "A rather than B",
   "not proof of". Positive claim, then stop (2026-08-31).
8e. **Sources list only pieces that carried a fact.** Public-holiday calendars, published
   meeting schedules and other date-confirmation pages are dropped (2026-08-31, see
   `sourcing.md`).
9. **Every broker code links** to `sectors.app/idx/broker/<lower>`, same accent `#9E0142`
   ticker styling, on any type that has a broker/flow table (confirmed 2026-07-16).
10. **"Upcoming Events" closing block, only when an event is upcoming**
    (confirmed 2026-07-20, revised same day to cover every still-upcoming row, not just
    the nearest): a small promo for Sectors workshops, live-fetched from a shared Google
    Sheet (`references/upcoming-events-source.md`), not user-supplied, placed after the
    issue's own CTA and before Sources. One card per still-upcoming row, soonest first,
    each with poster image, title, description, details list, and a "Register here"
    button to `eventUrl`, five fields per event straight off the sheet, nothing
    invented. Heading is the fixed text "Upcoming Events," not a variable lead-in. If no
    row is still upcoming, the issue carries no block and no heading. See
    `newsletter-format.md`'s **Upcoming events closing block** section for the exact
    contract.
11. **Weekly Insights v2 sends Monday, not Saturday** (confirmed 2026-07-20): the
    header line's issue/send date is the Monday immediately after the reporting week's
    Friday close, e.g. week of 6-10 Jul → issue date 13 Jul, week of 13-17 Jul → issue
    date 20 Jul. `date:` in the frontmatter, the delivery folder's `<YYYY-MM-DD>`, and
    every `utm_campaign` suffix all use this same Monday date, not the Friday
    `data_as_of` date and not the old same-week Saturday. See
    `workflows/weekly-insights-v2.md` and the **Header block** section of
    `newsletter-format.md`.
12. **HTML disclaimer footer uses fixed markup, verbatim, every issue** (confirmed
    2026-07-24): the bordered `<tr>` block with the non-advice line, the `sectors.app`
    citation link, and the `Sectors | sectors.app | @sectorsapp` line. Fill only the
    UTM campaign slug/date, the `data_as_of` date, both `sectors.app` links carrying
    the same footer UTM string, Instagram left untagged. Exact HTML in
    `newsletter-format.md`'s **Standard disclaimer footer** section, don't hand-write
    a variant per issue.

13. **Every ticker mention is linked, every occurrence, every type** (confirmed
    2026-08-31): not first-mention-per-section, not tables only. The same ticker appearing
    nine times carries nine links to `sectors.app/idx/<lower>` (SGX: `/sgx/<code>`), each
    with that block's `utm_content` and `utm_term=<ticker>`. Grep the finished HTML for the
    ticker string and confirm every hit sits inside an `<a>`. See `newsletter-format.md`'s
    **Ticker-mention convention**.
14. **No clickable citation in body copy, any type** (and, for `weekly-insights-v2`, `monthly-market-pulse` and `sector-spotlight`, no inline citation of any kind since 2026-10-19, `sector-spotlight` since 2026-10-22: Sources list only) (confirmed 2026-08-31): a news source
    is attributed as plain `(Source Name, DD Mon YYYY)` text, and its URL appears only in
    the Sources list. The only body links are `sectors.app` links and our own Instagram and
    Threads follow lines. An outbound link mid-issue hands the reader an exit before the
    CTA. See `newsletter-format.md`'s **UTM convention** and `sourcing.md`'s **Inline
    citation format**.
15. **Two rules are `weekly-insights-v2` only, and stay that way** (confirmed 2026-08-31):
    (a) **ticker alone, no company name** in any block, where every other type still pairs
    the ticker with the company's full name once per section; (b) **published Instagram
    post images only, no generated graph anywhere in the issue**, where every other type ships a
    generated `chart-<slug>.svg`. Do not port either to another type, and do not apply
    another type's opposite habit to v2.

16. **No `$` before a ticker, anywhere, ever, in any issue type** (confirmed 2026-08-31,
    and this rule is not overridable). Write `BBCA`, `**BBCA**`, or
    `[**BBCA**](https://sectors.app/idx/bbca)`, never `$BBCA`. This holds in every block of
    every one of the five types, in tables, prose, headings, subject lines, preview text,
    chart labels, alt text, image captions, Sources, the Appendix and the footer, on IDX
    and SGX names alike. The cashtag is a social-media convention that reads as retail
    trading-floor shorthand, and it is not the register this newsletter writes in.

    **Precedence:** this rule outranks every skeleton, workflow doc, sample and worked
    example in the skill. If any file, including a type's own skeleton or a sample in
    `newsletter/samples/`, shows a `$`-prefixed ticker, that file is stale, the `$` is a
    defect, and this rule wins with no judgment call to make. Never reintroduce the `$`
    to match a sample. Before shipping any issue, grep both `newsletter.md` and
    `newsletter.html` for a literal `$`; a single hit is a defect. Note this is the one
    ticker rule with no per-type variation at all: hard rule 15's v2-only carve-outs
    cover the company-name pairing and the chart, and neither touches this.

Full treatment, including the "good time to purchase" / "great future forecast"
reconciliation, lives in `references/compliance.md`, read it before drafting the
three-stock-story or single-company-deep-dive types.
