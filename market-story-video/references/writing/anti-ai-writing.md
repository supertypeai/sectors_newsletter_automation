---
name: anti-ai-writing
description: The final filter on every carousel. Run it on each slide's copy and on the post caption before the deck ships. It catches generic finance-AI tells (vagueness, hype, market-speak, negative-parallelism reframes, fabricated specifics, investment-advice framing) and rewrites them in the Sectors markets-desk voice. Reach for it whenever copy feels fluent but hollow, over-formatted, or like every other finance account.
---

# Anti-AI Writing

*Runtime entry is `./writing.md` (section 3, "The AI-tell filter"); open this file for the full treatment and worked examples.*

**The goal is not "don't sound like AI."** That framing loses. Blocklists rot, and chasing a negative gives you a beige voice. The goal is to sound like the Sectors markets desk: someone who read the filing, knows what the number means, and has a point. Specificity is the moat. The brand voice is the moat. Everything below serves those two. The voice itself lives in `./brand-voice.md`; this skill keeps copy true to it.

Apply with judgment. **Spirit beats letter.** If a rule makes a slide worse, break it.

## Where this runs

This is the **last pass on every carousel**, after the rest of the pack has done its work: `./viral-hooks.md` sets the cover hook, `./storytelling.md` sequences the deck, `./dumbify.md` keeps each slide readable. Run the **full pass** here on two things: **every slide's copy** (kicker, headline, body, captions) and **the post caption** that ships with the deck. Both are written text a reader's eye scans, so both get the full filter. We make carousels, not reels, so there is no spoken subset; apply the whole skill to all copy.

## The data-integrity clause (finance-specific, non-negotiable)

This skill pushes hard for specifics. In finance, **the specific must be real.** Three rules sit above every craft rule below:

1. **Never invent a number to satisfy the ladder.** A fabricated specific is worse than a vague true statement. If you don't have the figure, write the qualitative fact plainly ("profit grew, the filing didn't break out by how much") or drop the claim. Every number on a slide is a real Sectors API field this run, inside its plausibility band, with a date. See `../sectors-api/data-quality.md`.
2. **Descriptive, never prescriptive.** Report what the data shows; never tell the reader what to do with the stock. "Buy / sell / load up / accumulate / target IDR X / it's cheap" is investment advice, and it is also an **AI-confidence tell**: the model sounds authoritative by issuing a verdict it has no business issuing. Cut it to the underlying figure.
3. **Accuracy outranks everything.** When a stylish line and a true line conflict, the true line wins, every time.

## The 5 diseases (diagnose before you fix)

Most finance-AI copy fails for one of five reasons. Name the disease and the fix is obvious. If you can't name it, **read the line aloud** and it becomes audible.

1. **Vagueness compression:** describes a category, not a thing. *"The bank faced headwinds"* → "net interest margin fell 40bps to 5.2% as deposit costs rose."
2. **Significance inflation:** treats a normal quarter like a turning point. *"This marks a pivotal shift for Indonesian banking"* → state the fact ("net profit rose 11% to IDR 54T") and let the reader weigh it.
3. **Hedged confidence:** has a position but won't commit. *"It could be argued GOTO is nearing profitability"* → "GOTO's adjusted EBITDA turned positive in Q4, at IDR 78B." Take the position the data supports, or cut the line.
4. **Rhythmic flatness:** every slide the same sentence length, every body three lines. Break the meter.
5. **Borrowed authority:** reads like a sell-side research note or a finfluencer reel. No fingerprint. Say it the way the markets desk would tell one friend.

## Rule priority (when rules collide)

**Accurate > Clear > Specific > Voiced > Stylish.** Accuracy is never traded for style (see the data-integrity clause). A boring true sentence beats an elegant vague one, and a true vague sentence beats an elegant fabricated one.

## Specificity: the whole game

The single highest-leverage rule. Specific beats polished, every time. The ladder, anchored to a markets claim:

| Level | Example |
|---|---|
| Vague | "The bank faced headwinds." |
| Specific | "Margins compressed." |
| Concrete | "Net interest margin fell 40bps to 5.2%." |
| Lived / sourced | "NIM fell to 5.2% as BI held rates and deposit costs rose." |

Aim for **Concrete minimum**, Lived/sourced when the data gives you the why. Replace categories with instances, adjectives with numbers, "the company" with the ticker and the figure. **Every specific comes from a real field or a cited source this run** (data-integrity clause). If you don't have it, say the qualitative fact plainly or drop the claim. Never invent a number to climb the ladder.

## The negative-parallelism ban (the #1 tell)

The biggest single tell of AI writing. The pattern:

> "It's not X. It's Y."

…and every variation that knocks down a frame to sound insightful: *Not X. Y. / Less X, more Y. / Stop watching X, watch Y. / The real story isn't X, it's Y. / It was never about X, it was always about Y.* Plus the softer forms: *Most people think X, but… / On the surface X, but really Y. / X gets the headlines, but…*

**The pivot words** that signal it when they follow a rejected frame: *but, actually, really, instead, rather, ultimately, the truth is, what matters is, the real, the hidden, the overlooked.* These are everywhere in good prose, so count one as a hit only when it follows a **rejected frame**, never on sight. The reframe also crosses sentence boundaries (*"Most people watched the price. Foreigners were leaving."*) and hides in rhetorical questions (*"A record profit? Strip out the asset sale and earnings fell 6%."*), but the boundary-crossing form is banned **only when B is hollow**; a concrete B is fine (see the test below).

**The fix:** delete the rejected half, then rewrite the positive half as a direct claim with real specifics.
> *"It's not about the price. It's about the story."*
> → "It's about the story." (still hollow, no point)
> → "The price rose 4%, but foreigners sold a net IDR 1.4T. The rally was domestic retail."

The reframe was hiding the fact that the writer had no point. The final version has a figure and a mechanism, the actual point.

**Reconciliation with `./viral-hooks.md` (these skills must not fight):** hooks deliberately use A-vs-B contrast as a curiosity mechanic, and that's allowed. The line is **hollow vs earned**:
- **Banned (hollow):** B is vague significance hiding the absence of a point: "It's not about valuation, it's about conviction." Cut it.
- **Allowed (earned):** B is concrete and the slides deliver it: "Most people read the 4% pop. Foreigners sold a net IDR 1.4T that day; the buyers were local retail." The contrast opens a loop the foreign-flow slide pays off.
- **Test (two parts):** (1) Is B concrete, **Level 3+ on the ladder** (a real figure, ratio, or named mechanism, not a category like "conviction" or "the story")? (2) Do the slides deliver it? **At hook stage the slides don't exist yet**, so judge B on part (1) alone, keep it provisionally, and re-check delivery on the post-draft pass. A vague-significance B fails part (1) and gets cut now. Hold this line hard: carousel copy is written prose, not a spoken hook, so there is no looser bar.

## Analogy & metaphor control

Default: **write literally.** Most market analogies make weak thinking sound vivid; they help the writer feel clever, not the reader understand.

Use an analogy only if **all five** are true: (1) the subject is genuinely unfamiliar or abstract (a real mechanism a retail reader won't know, not a number they can just read), (2) it makes understanding easier, not just prettier, (3) it's shorter than the literal explanation, (4) it's exact enough not to mislead, (5) it sounds normal aloud. Any test fails → write literally. On a slide of ≤40 words, the default is zero.

**Banned metaphor families:** journeys, battlefields, machines-for-people, ecosystems, engine/fuel, North star, flywheel, DNA, scaffolding, plumbing, iceberg, bridge, chess, sports, plus the market clichés: rollercoaster, bloodbath, storm/weather (this is what "headwinds / tailwinds" are), tide, perfect storm, David vs Goliath, printing money. **Banned metaphor verbs:** baked in, bolted on, woven, layered, distilled, unpacked, crystallized, surfaced, amplified, threaded, sculpted, anchored, framed. Replace with literal verbs: rose, fell, paid, earned, sold, cut, added, caused, showed.

> *"TLKM is a cash machine."* → "TLKM generates steady cash." → "TLKM converted 92% of EBITDA to free cash flow and paid IDR 16.9T in dividends."

## Blocklists (starting points, the principle outlives the list)

**The principle:** any word doing PR for an idea instead of describing it goes. If a word makes something sound impressive without specifying *how much* or *from what*, cut it.

- **Vocab tells:** delve, realm, harness, unlock, tapestry, leverage, synergy, seamless, robust, elevate, streamline, supercharge, game-changer, cutting-edge, revolutionize, transformative, intricate, crucial, pivotal, testament, foster, empower, holistic, unparalleled, groundbreaking, scalable, intuitive, disruptive.
- **Vague market-speak (finance):** landscape, headwinds, tailwinds, navigate, choppy, "in this market", "uncertain times", "macro environment", "the space", "positioned for", "volatility" as filler. Say the actual move and the actual driver instead.
- **Hype:** skyrocket, explosive, soar, parabolic, must-own, "to the moon", 10x, "the next [big name]", "printing money". If the claim is real the number tells it; if you don't have the number, lower the claim.
- **Finfluencer bait:** "nobody's talking about this", "this is your sign", "you're early", "before it's too late", "the secret", "what they don't want you to know".
- **False precision:** an oddly exact figure with no source ("up exactly 17.34%" behind nothing). A real number cites its field and date; precision with no source reads as confident fabrication. See the data-integrity clause.
- **Bloated verbs** (dodging is/has): serves as, stands as, marks a, represents a, boasts a, plays a role in, helps to, aims to, seeks to. → use: is, has, rose, fell, pays, owns, shows.
- **Dead openings:** "In today's market…", "It's important to note…", "Let's dive in / unpack", "At the end of the day", "Most people don't realize", "In this carousel…".
- **Dead transitions:** Furthermore, Additionally, Moreover, That said, With that in mind. → use a transition that does logical work, or none.
- **Engagement bait:** "Let that sink in", "Read that again", "This changes everything", "Save this", "Tag an investor friend 👇". Insults the reader.
- **Formatting tells:** **em dashes and hyphen-as-connector** (use periods, commas, colons, parens; the brand forbids the dash pause), emoji-and-hashtag spam, walls of bullets to look thorough, the rule-of-three list when the real count is 2 or 4.
- **Dot-glued prose (a real tell, seen often):** a "·" (or "•") stitching two phrases together inside a **title, body, or caption sentence** — "Profit rose · the stock fell", "A record quarter · a falling price" — reads as a keyword list wearing a sentence's punctuation, not a written thought. Rewrite it as an actual sentence: a period, a comma, "and"/"but", or a colon. **This does not touch the "·" in kicker/label/caption-t/chip metadata rows** ("IDX · DIVIDENDS", "$BBCA · 30D", "dividend per share · Rp") — that's fixed house-style chrome for structured labels, documented in `../house-style.md`, and stays exactly as-is; the ban is only on using the same glyph to fake a sentence in running prose.

## AI tells (generic even when no single rule is broken)

- **Investment-advice confidence:** prescriptive framing ("buy", "sell", "load up", "accumulate", "target IDR X", "it's cheap"). The model sounds authoritative by issuing a verdict; cut to the figure and let the reader decide (brand-voice non-negotiable, data-integrity clause).
- **False precision:** an exact number with no nameable source field and date. If you can't cite where it came from, it's a tell, drop it.
- **Hype superlatives:** "best", "strongest ever", "record-smashing" on ordinary facts. State the number; let it be the superlative if it earns it.
- **Rule of three reflex:** every list three items, every claim three supports. Real analysis has uneven counts.
- **False ranges:** "from blue chips to penny stocks." Sweep with no middle. Cut.
- **Elegant variation:** BBCA → the lender → the banking giant. Use the ticker again.
- **Participle fake-depth:** "…signaling strength, …paving the way for growth." If the analysis matters, give it a sentence with a real claim.
- **Throat-clearing first line:** cut the first line and reread; if the slide still works, it was throat-clearing.
- **Symmetric parallelism:** "Strong balance sheet, strong margins, strong outlook." Sounds great, says nothing.
- **"In a world where…" / "In today's market…" opener:** no.

## Writing mode

Write the slide and caption normally first; don't compose against the blocklist, that produces stilted output. Then run the final pass below to strip the machine-made parts. Then check that what's left actually says something true.

## Audit mode (the final pass)

Run on each slide's copy and the caption. Flag each hit with the **exact offending line**, then rewrite:

1. Cut the first line if it's throat-clearing.
2. Replace every category noun with an instance or a real figure.
3. Cut every adjective with no number, ticker, or comparison behind it.
4. Find every "not X but Y" reframe → rewrite as a direct claim (apply the hollow-vs-earned test).
5. Find every analogy → apply the five-test → delete failures; replace banned metaphor verbs with literal ones.
6. Cut every dead opening, transition, bait phrase, hype word, and market-speak filler.
6b. Read every title/body/caption sentence: is a "·" or "•" gluing two phrases together where a real sentence should be? Rewrite it. (Kicker/label/caption-t/chip rows are exempt, that's fixed chrome, not prose.)
7. **Check every number:** real API field, in band, dated? If not, cut it (data-integrity clause).
8. **Flag prescriptive framing** (buy / sell / target / cheap) → rewrite as descriptive.
9. Read aloud → flag any line the same length as the one before → vary it.
10. Cover the byline: could any generic finance account have posted this, or does it read as the Sectors markets desk? If generic, find the one observation only someone who read the filing would make, and lead with it.
11. Cut the ending if it only repeats the point.

Audit output format:
```
ANTI-AI AUDIT:
  Data integrity:       FLAG  "a screaming 18% yield" (no payout field; band-check or cut)
  Negative parallelism: FLAG  "It's not about the price, it's about the story."
  Metaphor:             FLAG  "TLKM is a cash machine" (banned family); state the cash figure
  Investment advice:    FLAG  "load up before earnings" (prescriptive; describe, don't prescribe)
  Specificity:          FLAG  no real, dated number on the slide
  Rewrite: [direct, specific, sourced version in the Sectors markets-desk voice]
```

## Anti-overfitting

This describes taste; it doesn't replace judgment. Don't force fragments. Don't make every slide one sentence to seem punchy. Don't avoid a banned word that's the exact right word with no clean substitute. Don't turn the deck into a checklist of avoided mistakes. And never let a craft rule pressure you into a number you can't source: a missing stat is fine, a fabricated one is fatal.

The test: **does this read like the Sectors markets desk, or like generic finance AI imitating it?** If it feels forced, simplify. If it feels generic, find the specific you skipped. If it feels hollow, you didn't have the point yet, so go read the filing before the next draft.

---

*Adapted from the `content-skills` pack by Artem Novitckii (MIT), tailored for Sectors IDX carousels. Voice lives in `./brand-voice.md`; data rules in `../sectors-api/data-quality.md`.*
</content>
</invoke>
