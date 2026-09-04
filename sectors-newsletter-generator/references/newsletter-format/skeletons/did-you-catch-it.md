# Section skeleton: did-you-catch-it

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing.

### Did you catch it
FOMO family, one type-slug (`did-you-catch-it`) off one screener and one fetch pass
(`workflows/did-you-catch-it.md`). Single-ticker spotlight, not a screener dump, one
broadcast piece, same copy for every reader, no assumed reader state (this skill has no
account data, see the workflow doc §3). **Product goal**: prove a `sectors.app`
workflow alert would have caught the moment, so the section order runs **signal first,
payoff second**, matching the real sequence of events, not the reverse.
1. **The signal** — H1 poses the issue's own question ("did you catch it" is the hook,
   not a literal heading to paste in), one-line standfirst naming the trigger date and
   price plainly (`overview.all_time_price`'s dated low, e.g. "hit a 90-day low of IDR
   446 on July 24," workflow doc §1), past tense, no imperative.
2. **What was already true at the low** — the fundamentals guard as a small table (P/E
   vs sector median, ROE vs sector median, leverage trend, see workflow doc §1 for how
   each is derived from documented fields), stated as conditions that already held on
   the trigger date, valuation context only, never "still cheap, don't miss it twice."
3. **What happened next** — the payoff: last close vs the trigger price as a plain
   percentage, hero chart (daily close from the trigger date to today, trough visually
   evident, the up-move following it).
4. **What to watch** — objective, non-prescriptive close.
5. **CTA** — name the actual conditions from step 2 as a settable alert, concrete, not
   generic, then the behavioral ask: set up a workflow alert, or add the ticker to a
   watchlist. Never "buy now," never a price target, no countdown/scarcity language
   (workflow doc §4).
6. **Appendix** — flag the two documented spec adaptations explicitly (fundamentals
   guard read at report date, not literally priced on the trigger date; leverage
   compared annually, not at the literal 90-day mark). Then Sources, disclaimer footer.

