# Section skeleton: watchlist-performance-digest

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing.

### Watchlist/sector performance digest
Personalized, per-recipient template, not a broadcast piece. Same structure for every
recipient, only the values (and which tickers/sectors appear) change per
`{{merge_tag}}`.
1. **Greeting + the headline mover** — `{{first_name}}`, then the single biggest
   7-day mover among that recipient's tracked tickers/sectors (by absolute move,
   regardless of where it lands in the table below), stated as fact with a benchmark
   (vs. the IDX composite for an IDX name, vs. its own recent history for an SGX name
   where the composite isn't a fair comparison), same no-bare-percentage rule as every
   other type here.
2. **The ranked table** — up to 5 of the recipient's tracked tickers/sectors. Columns:
   name, **Exchange** (`IDX` or `SGX`, its own column, always shown), 7-day move, one
   peer-comparison figure. **Row order: group by exchange first (IDX rows before SGX,
   alphabetical by country, Indonesia before Singapore), then by 7-day move descending
   within each group** — this is display order, independent of which row is the
   headline mover in step 1, the headline is chosen by absolute significance, the
   table is ordered by exchange then signed move.
   - **Peer comparison column**: P/E vs. peer average for an IDX ticker with peer
     data (`company/report?sections=peers`). For a row where it isn't available yet
     (every SGX ticker, `sections=peers` 400s there), write **"coming soon"**, never
     leave the cell blank and never silently drop the column.
   - A sector-level row shows the sector's own aggregate move (`subsector/report`'s
     `mcap_change.1w`) plus a one-line callout of its top mover in that
     peer-comparison cell (`companies/top-changes` filtered to the sub-sector).
   - **Ticker link**: IDX tickers link `https://sectors.app/idx/<lowercase, no .JK>`
     (existing convention). **SGX tickers link `https://sectors.app/sgx/<lowercase
     bare code>`** (confirmed 2026-07-16, e.g. `https://sectors.app/sgx/d05`).
   - **Sector link**: `https://sectors.app/indonesia/<sub-sector slug>` (confirmed
     2026-07-16, e.g. `https://sectors.app/indonesia/banks`,
     `https://sectors.app/indonesia/consumer-services`), the same kebab slug
     `subsector/report/{slug}/` uses.
3. **Takeaway paragraph, factors and news, never a call** — after the table, a short
   paragraph naming real, dated, factual drivers behind what the table just showed:
   potential factors affecting a tracked ticker/sector's move, related news, or a
   genuinely upcoming event (an earnings date, a disclosed corporate action). Source
   from the Sectors API first (`news/?symbols=` / `news/?sub_sector=`,
   `company/corporate-actions/{symbol}/`), fall back to a cited web search only for
   what the API can't cover (an SGX name's news, since `news/` is IDX-only), same
   citation discipline as `sourcing.md` (inline `(sectors.app)` for API facts, a
   dated named-outlet citation plus a **Sources** entry for anything web-sourced).
   **Not every row needs a factor.** Only include one for a row where a real source
   actually turned something up, never manufacture a narrative to fill every line,
   same non-advice discipline as sector-spotlight and single-company-deep-dive
   throughout, describe what happened and what's scheduled, never what to do about it.
4. **CTA** — back to `sectors.app` to check the full watchlist/workflow, one link.
5. **Sources** (list any web-sourced facts used in step 3, name + date + link, same
   format as every other issue type; Sectors-API-sourced facts only need the standard
   inline `(sectors.app)` citation, no separate Sources entry) + disclaimer footer.

