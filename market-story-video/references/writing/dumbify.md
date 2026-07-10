---
name: dumbify
description: Use when writing or auditing IDX carousel copy that has to land fast, earnings explainers, ratio breakdowns, "by the numbers" decks, any slide that teaches a finance idea to non-specialists, or when a draft reads dense, jargony, or like sell-side homework. Lowers reading level and mental load so a finance-curious follower keeps swiping. Pairs with the other writing skills in this pack; defers to `./brand-voice.md` for tone.
---

# Dumbify

*Runtime entry is `./writing.md` (section 3, "Plain words"); open this file for the full treatment and worked examples.*

People don't swipe away because a markets carousel is too simple. They swipe because following it is **too much work.** Every undefined ratio, every nested clause, every sell-side word is a reason to scroll past. This skill cuts that effort without cutting the insight.

**Target: ~8th-grade reading level for body copy, ~6th for the slide-1 hook.** Easy to follow = low strain = the reader actually reaches the payoff.

## Simple language, not simple ideas

You are lowering the **reading level**, not dumbing down the analysis. A P/E re-rate or a foreign-flow reversal can be sophisticated; the words carrying it should not be. **Simple ≠ simplistic.** Someone who doesn't trade should be able to *follow* the slide on the first pass. That does not mean the insight is beneath a numerate reader. (This is also a brand non-negotiable, see `./brand-voice.md`.)

## Where it earns its keep

This skill earns its keep on a markets carousel more than almost anywhere, because finance buries its jargon in plain sight.

- **High value:** ratio explainers (P/E, ROE, payout, free float), earnings breakdowns, valuation-vs-peers slides, anything where a term does work the reader may not share. This is where dense copy kills retention.
- **Low value:** the cover hook and short kicker lines come out tight already. A `priceSnapshot` is mostly numbers. Don't force simplification where there's nothing to simplify.

## The moves

1. **Define the deep jargon the first time, in one plain clause. Don't drop it in a glossary box.** The audience already shares *ticker, dividend, IDX, rupiah*; keep those, they're shared vocabulary, not friction. Translate the rest in passing: "P/E of 22, what you pay for each rupiah of annual profit"; "ROE of 21%, the profit earned on shareholders' money"; "an 80% payout, the share of profit paid out as dividends"; "free float, the slice of shares the public can actually trade"; "net foreign flow, foreign money in minus foreign money out."
2. **One idea per sentence.** A slide isn't a paragraph; break nested clauses into separate lines.
3. **Plain verbs over sell-side ones.** *pays out* not distributes, *owns* not holds a position in, *earns* not generates returns, *trades at* not is valued at a multiple of, *rose/fell* not appreciated/depreciated.
4. **Concrete over abstract: a real number beats an adjective.** "Net profit rose 11% to IDR 54T" beats "strong earnings growth." The clarifying number must be a **real Sectors field, never invented** (see `../sectors-api/data-quality.md`). A vague adjective and a fabricated figure are both failures; the fix is the true number.
5. **Active voice.** "BBCA earns 21% on equity," not "a 21% return on equity is generated."
6. **Cut filler that adds no meaning.** "in order to," "it is worth noting that," "when it comes to."
7. **Define a ratio by what it tells you, not its formula.** "ROE shows how hard a bank works its shareholders' money" lands faster than "ROE = net income / equity."

## Don't let it fight the other skills

- **Rhythm (storytelling):** simplify the **words, not the cadence.** A slightly longer line is fine if it's plain words that read in one breath. **Never chop every slide into choppy fragments to "hit a grade level."** That flattens the music. Vary length, keep words plain. Defer rhythm to `./storytelling.md`.
- **A slide already forces brevity.** The frame caps length for you, so here the job is mostly **word choice and jargon**, not cutting length. Don't pad a thin slide just to "simplify" it.
- **Specificity (anti-ai-writing):** these *agree*. A concrete figure makes a slide easier to follow, not harder. "Foreign investors sold a net IDR 1.4T last month" is more specific *and* more readable than "foreign sentiment weakened." See `./anti-ai-writing.md`.
- **Voice:** don't sand off the markets-desk confidence while simplifying. Keep the plain declaratives and the straight talk; cut the complexity *around* them, not the spine. `./brand-voice.md` is the target.

## How to gauge the level (no tool needed)

- **Read the slide aloud.** Stumble, run out of breath, or re-read it? Too dense, split it.
- **The friend test.** Could a smart friend who doesn't follow markets repeat the point after one pass?
- **Spot the load:** undefined ratios, words over 3 syllables that have a plain swap, lines over ~20 words on a slide, more than one nested clause, any sell-side term the audience may not share.

## Writing mode

Draft the slide copy normally first. Then do a load pass: find the densest line and the first undefined ratio, and lighten them. Plainer verbs, one idea per line, a one-clause gloss where a term is doing silent work.

## Audit mode

Flag each high-load spot with the **exact line**, then give the simpler rewrite. Keep the meaning, the real numbers, and the voice intact.

```
SIMPLIFY AUDIT (target ~8th grade, ~6th for the hook):
  Jargon:        FLAG: "BBRI's ROE leads its peer set"
                 → "BBRI earns more on shareholders' money than any big bank on the IDX"
  Nested clause: FLAG: "The payout ratio, which has risen for five straight years, now sits at 80%"
                 → "The payout has climbed five years running. It now sits at 80% of profit."
  Abstraction:   FLAG: "foreign sentiment weakened materially"
                 → "foreigners sold a net IDR 1.4T last month"
  Reading level: ~12th grade → rewrite lands ~7th
  Rewrite: [plainer version, real Sectors figures, rhythm and voice preserved]
```

## Anti-overfitting

Don't baby-talk a numerate reader. Don't strip the nuance a thesis needs. Don't gloss *ticker* or *dividend* as if they were hard words. Don't chop every slide into fragments; that's flattening, not simplifying. And never swap a vague word for a clearer one by inventing the number that makes it clear. The test: **could a finance-curious follower get the point without effort, while still feeling the slide respects their intelligence?** If it reads dumbed-down, you went too far.

---

*Adapted from the `dumbify` skill in `content-skills` by Artem Novitckii (MIT), tailored for Sectors IDX carousels. Voice lives in `./brand-voice.md`; never fabricate the clarifying number (`../sectors-api/data-quality.md`).*
