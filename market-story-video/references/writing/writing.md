# Writing (runtime entry)

Distilled from `./storytelling.md`, `./viral-hooks.md`, `./dumbify.md`, `./anti-ai-writing.md`, `./brand-voice.md`, `./caption.md`. Read once, top to bottom. Open a source file only for its full worked examples or rationale.

## 1. Finding the story

Fires on any story-driven or opinion deck (an earnings turn, a valuation re-rate, an ownership twist). Skip only for a single-slide explainer or a reference table with no arc.

**Before you write (NO-FABRICATION, NO-ADVICE, overrides every craft rule below):**
- Never invent a number, price, or event. Every beat is a real Sectors API field or a cited source. No beat, no deck. See `../sectors-api/data-quality.md`.
- Describe, never advise. No buy, no sell, no "this is cheap, load up." Report what the data shows, the reader decides.
- Structure is this skill's job, the truth is the data's. A turn needing a fake number isn't a turn, find the real one.

**Editorial laws:**
- **Story first, data second.** Find the angle by research before you fetch numbers; numbers are evidence for a story you already have, not the story itself. When the user delegates the topic, SKILL.md step 1's cheap API discovery signals legitimately come before the web search to surface a candidate subject, but the thesis and beats still come from research before any beat is fetched for real.
- **Every slide states a verdict.** Not "EPS growth 4.9%" and move on, say "growth has nearly stopped, the slowest in five years." The number is the proof, the sentence is the point.
- **Omit openly, never curate silently.** A null, implausible, or off-thesis data point gets dropped, the deck re-angles around what's real, and it says what was dropped. Cutting inconvenient years to make a trend look cleaner bends the data to the story, the one thing never to do.
- **Recent is the story, history is the proof, never the headline.** The thesis must center on something that actually happened or changed recently: a print, a filing, a rate move, a flow reversal, a rally or plunge in the last weeks. A five-year streak or long-run ratio is real evidence the recent thing is genuine or unusual, and belongs in the beats, but can't be the lead. "TLKM has paid a dividend every year since 2020" is a reference fact; "TLKM just raised its payout past 100% even as profit fell" is a post. Nothing recent turns up, pick a different subject, don't lead with the history instead.
- **Every beat needs a benchmark.** A number alone isn't a finding: "87% payout" means nothing until the reader knows what's normal. Pair each figure with a comparison anchor, the company's own history, a peer, or a category norm. No anchor, the beat is probably a restated fact, dig further or cut it. Rank beats before writing a line of copy: the single most surprising, hardest-to-explain-away number earns the top third of the deck, never a buried closing clause.

**The arc, six moves (the first four do most of the work):**
1. **The Dance (context vs conflict):** every transition is a BUT or a THEREFORE, never "and then another stat." "BBRI just posted its highest net profit ever. THEREFORE you'd expect the stock to rip. BUT foreign investors sold a net Rp 1.4T into the print." "And then" means the slide is filler, cut it or sharpen it into a turn.
2. **Direction:** write the payoff slide (the last content slide, the "so what") first, then work backward to the cover. Make it the "last dab," memorable enough that reading only it would make someone send it. The outro is auto-appended, never author outro copy; the last authored slide is the payoff, not a sign-off.
3. **Story Lens (the non-obvious angle):** a ticker isn't an angle. Push past the obvious one: invert the villain (the price drop isn't the real story, who sold is), jump to the second-order effect (don't cover the rate cut, cover what it re-rates), switch the POV (the foreign investor's seat, not local retail's). Pick the lens before writing.
4. **Rhythm:** vary sentence length within a slide (short, medium, then one longer line that rolls to a close, a jagged left edge means it's working) and vary slide density across the deck (a big-number slide, a chart, a one-line insight, three dense charts in a row drones).
5. **Tone:** defer to the voice in section 3. Write to one smart, time-poor friend, not "an audience." You/they frame about the ticker and market, never an I-story, there's no founder on this account.
6. **The Hook:** section 2. The cover must be punchy and plot-indicative (not "wait for slide 5"), and must promise exactly the payoff from move 2.

**Slide budget (hard constraint):** 3 to 10 slides, cover + 3 to 8 content slides + the fixed outro. One beat per content slide, never two turns on one. Length follows the story's depth, not a fixed count; cut beats before cutting the lens or the payoff.

**Beat → block:** earnings turn → `quarterlyTrend` · valuation point → `rangeBar` or a peer-average `multiline` · ownership twist → `ownership` · smart-money beat → a `bar` of daily foreign-flow inflow or `ranking` for top brokers · price move → `priceSnapshot`/`rangeBar` · payoff → `insight` card. A number with no source doesn't go on a slide.

## 2. The cover hook

The cover is slide 1's whole job: help the right swiper decide to swipe to slide 2. It must deliver **topic clarity** (the gold kicker, e.g. `IDX · EARNINGS`, does half this work) and **on-target curiosity** (an A-vs-B gap between what the swiper assumes and what the data shows). Clever but unclear fails; clear but flat fails.

**Three parts** (see `../house-style.md` §8): a gold kicker, a display headline with one gradient emphasis word (≤ ~9 words, 1 to 3 short lines), and one support (a subhead OR a single stat, never both).

**Headline length vs the type ramp, reconciled:** a real financial headline at 6 to 9 words almost always runs past the 22-character threshold in `../house-style.md`'s type ramp, so the 84px tier is the normal case, not a failure. The 104px tier is for a genuinely short punch headline, 2 to 4 words ("Profit grew. Losses too."), not the default target.

**The hook inherits section 1's no-fabrication and no-advice rules:** never promise a number the deck can't deliver; never "buy," "sell," "load up," "this is cheap."

**The four hook killers, diagnose which one:**
1. **Delay** (topic arrives too late): delete everything before the topic, let the kicker carry the category.
2. **Confusion** (needs a re-read): fewer, plainer words, one idea per line, explain any ratio in a clause the first time it appears. "The persistence of BBCA's valuation premium reflects a structural ROE differential" → "BBCA trades at a premium. One number says why."
3. **Irrelevance** (clear, not for me): frame around what the swiper holds, watches, or assumes, not the creator's interest.
4. **Disinterest** (clear, relevant, still skippable): the cure is contrast, A (what the swiper believes) vs B (what the data shows). "Everyone watched the price. The real story was who was buying" (stated); "Indonesia's most valuable company is also its most boring" (implied, only B stated).

**Banned openers** (always flagged): "Let me explain"; "A breakdown:" / "Thread:" with no claim in the same breath; a bare news headline with no angle ("[Company] released Q3 earnings"); a CTA as the opener ("Follow for more"); advice or hype as a hook ("Buy BBCA now," "your sign to load up").

**Writing mode:** vary the angle, not the words. Three cover variants by default, each a different lens (the number, the contrast, the who, the why-now), labeled, each deliverable by the deck.

## 3. Slide copy

### Plain words (target ~8th grade for body copy, ~6th for the cover hook)

People swipe away not because a carousel is too simple but because following it is too much work. This lowers the **reading level**, not the analysis: a P/E re-rate can stay sophisticated while the words carrying it stay plain.

**High value:** ratio explainers, earnings breakdowns, valuation-vs-peers slides. **Low value:** the cover hook (already tight) and a `priceSnapshot` (mostly numbers); don't force simplification where there's nothing to simplify.

The moves:
- **Define the deep jargon once, in one plain clause, not a glossary box.** Keep shared vocabulary as-is (ticker, dividend, IDX, rupiah); translate the rest in passing: "P/E of 22, what you pay for each rupiah of annual profit"; "ROE of 21%, the profit earned on shareholders' money"; "an 80% payout, the share of profit paid out as dividends."
- One idea per sentence; break nested clauses into separate lines.
- Plain verbs over sell-side ones: pays out not distributes, owns not holds a position in, earns not generates returns, trades at not is valued at a multiple of, rose/fell not appreciated/depreciated.
- Concrete over abstract: a real number beats an adjective ("Net profit rose 11% to Rp 54T" beats "strong earnings growth"); the clarifying number must be a real Sectors field, never invented.
- Active voice: "BBCA earns 21% on equity," not "a 21% return on equity is generated."
- Cut filler: "in order to," "it is worth noting that," "when it comes to."
- Define a ratio by what it tells you, not its formula: "ROE shows how hard a bank works its shareholders' money" beats "ROE = net income / equity."

**Don't fight the other rules:** simplify words, not cadence, never chop every slide into fragments to hit a grade level. A slide already forces brevity, so the job here is word choice, not cutting length.

### The AI-tell filter

**Rule priority when rules collide: Accurate > Clear > Specific > Voiced > Stylish.** A true vague sentence beats an elegant fabricated one. Read a suspect line aloud, its problem (vague, overstated, hedged, flat, borrowed authority) becomes audible.

**Specificity ladder, aim for Concrete minimum:** vague ("The bank faced headwinds") → specific ("Margins compressed") → concrete ("NIM fell 40bps to 5.2%") → lived/sourced ("NIM fell to 5.2% as BI held rates and deposit costs rose"). Every specific traces to a real field this run; never invent one to climb the ladder.

**The negative-parallelism ban (the #1 AI tell):** "It's not X. It's Y." and its variants ("Not X. Y.", "The real story isn't X, it's Y.", "Most people think X, but..."), flagged whenever a pivot word (but, actually, really, instead, the truth is, the real, the hidden) follows a rejected frame. Fix: cut the rejected half, state the positive half as a direct claim with real specifics. "It's not about the price. It's about the story." → "The price rose 4%, but foreigners sold a net Rp 1.4T; the rally was domestic retail."
Reconciled with the hook's allowed A-vs-B contrast: hollow B ("it's not about valuation, it's about conviction") is banned; concrete B (a real figure or named mechanism) is allowed.

**Analogy control:** write literally by default; an analogy earns its place only if it clarifies, is shorter than the literal version, stays exact, and sounds natural aloud (zero on a slide ≤40 words). Banned metaphor families: journeys, battlefields, machines-for-people, ecosystems, engine/fuel, north star, flywheel, DNA, scaffolding, plumbing, iceberg, bridge, chess, sports, rollercoaster, bloodbath, storm/weather (headwinds/tailwinds), tide, perfect storm, David vs Goliath, printing money. Banned metaphor verbs: baked in, bolted on, woven, layered, distilled, unpacked, crystallized, surfaced, amplified, threaded, sculpted, anchored, framed; use rose, fell, paid, earned, sold, cut, added, caused, showed instead.

**Blocklists (the principle outlives the list: any word doing PR for an idea instead of describing it goes):**
- Vocab tells: delve, realm, harness, unlock, tapestry, leverage, synergy, seamless, robust, elevate, streamline, supercharge, game-changer, cutting-edge, revolutionize, transformative, intricate, crucial, pivotal, testament, foster, empower, holistic, unparalleled, groundbreaking, scalable, intuitive, disruptive.
- Vague market-speak: landscape, headwinds, tailwinds, navigate, choppy, "in this market," "uncertain times," "macro environment," "the space," "positioned for," "volatility" as filler. Say the actual move and driver instead.
- Hype: skyrocket, explosive, soar, parabolic, must-own, "to the moon," 10x, "the next [big name]," "printing money."
- Finfluencer bait: "nobody's talking about this," "this is your sign," "you're early," "before it's too late," "the secret," "what they don't want you to know."
- False precision: an oddly exact figure with no source ("up exactly 17.34%" behind nothing).
- Bloated verbs: serves as, stands as, marks a, represents a, boasts a, plays a role in, helps to, aims to, seeks to → is, has, rose, fell, pays, owns, shows.
- Dead openings: "In today's market...", "It's important to note...", "Let's dive in," "At the end of the day," "Most people don't realize."
- Dead transitions: Furthermore, Additionally, Moreover, That said, With that in mind.
- Engagement bait: "Let that sink in," "Read that again," "This changes everything," "Save this," "Tag an investor friend."
- Formatting tells: em dashes and hyphen-as-connector (use periods, commas, colons, parens), emoji/hashtag spam, walls of bullets, a rule-of-three list when the real count is 2 or 4. A "·" stitching two phrases inside a **running sentence** ("Profit rose · the stock fell") reads as a keyword list, rewrite it; this doesn't touch the "·" in kicker/label/chip rows ("IDX · DIVIDENDS"), fixed house-style chrome.
- Other tells: false ranges ("from blue chips to penny stocks" with no middle); elegant variation (BBCA → the lender → the banking giant, use the ticker again); participle fake-depth ("...signaling strength, paving the way for growth"); throat-clearing openers; symmetric parallelism ("Strong balance sheet, strong margins, strong outlook").

**Every pass:** re-check every number is a real, in-band, dated Sectors field, no prescriptive framing ("buy," "target Rp X," "cheap") slipped in, see Non-negotiables below.

### Voice

Sectors is a sharp markets explainer, the friend who reads the filings and tells you what the number means. Not a finfluencer, not a sell-side analyst. Language is English (Indonesian phrasing in a draft is a bug); confident, plain, curious not breathless, never "GAME CHANGER."

**Non-negotiables:**
1. Never fabricate a number. Every figure traces to a real field or a cited source, or it's left out.
2. Never give investment advice. Describe, don't prescribe. No "buy," "sell," "this is cheap, load up," no price targets framed as our call. **Analyst consensus may be reported as a fact ("34 analysts, consensus Buy"), never endorsed.**
3. No hype vocabulary: no "to the moon," "explosive," "must-own," "skyrocket," "10x."
4. Respect the reader's intelligence while lowering their effort.
5. Cite the source as `sectors.app` on any rendered slide, never "Sectors API" or bare "Sectors" ("Sectors API" is fine in working notes only).

Full off-brand/on-brand table and company background in `./brand-voice.md`.

## 4. The caption

The caption is a second hook. Instagram truncates after roughly the first ~125 characters behind "... more," so the first line gets the same four-killer discipline as the cover (section 2). **The one rule that changes:** the caption's first line must not restate the cover headline verbatim, its job is to deepen or re-angle, add a fact that didn't fit a slide, or name the stake more directly.

**Structure:**
1. Hook line: a re-angled or deepened version of the deck's thesis, never a copy of slide 1.
2. Body (2 to 4 short sentences): expand the payoff in prose, as you'd explain it to a friend after they finished swiping. Plain words, real numbers, the voice above, no new claims the deck doesn't already back.
3. One real, specific, on-topic question (optional): tied to the deck's finding, answerable in one line, not generic bait ("Tag someone who needs to see this!"). Good: "BBCA's ROE beats BBRI by 3.3 points, does the wider margin still make BBRI the better hold for you?"
4. 3 to 5 relevant hashtags, not a long tail: the ticker, the theme, `#IDX` or `#SectorsApp`.

Write in plain English containing the ticker, company, and topic words (Instagram treats captions as searchable), not keyword-stuffed. Where it fits, name someone to send it to ("send this to whoever still thinks BBRI is the safer bank"), a send beats a save.

**Worked example:**
```
Deck thesis: BBCA has a wider ROE despite a smaller lending margin than BBRI.

Caption:
BBCA earns more per rupiah of shareholder equity than BBRI, even with a
narrower spread on every loan. The difference is what each bank does with
its deposits, not what it charges to lend.

Full breakdown in the carousel: cheaper deposits, lower loan-loss provisioning,
and where the two banks trade today.

Do you hold either? Does a wider margin change how you'd read the risk?

#BBCA #BBRI #IDXBanks
```
The first line doesn't repeat a cover headline, it states the same finding from a different angle (efficiency, not margin), which is what makes it worth reading past the truncation.

---

## Final check before shipping

Real sourced beats only, zero invented numbers · lead is recent, history is proof not headline · describe, never advise (consensus may be reported, never endorsed) · a unique lens, but/therefore transitions, 3 to 8 content slides · cover passes all four hook killers, ≤ ~9 words · every ratio explained once · no blocklisted vocab, hype, metaphor, or negative-parallelism reframe · `sectors.app` cited, not "Sectors API" · caption's first line re-angles, doesn't restate the cover.

*Adapted from the `content-skills` pack by Artem Novitckii (MIT), tailored for Sectors IDX carousels. Full worked examples and audit-mode templates live in the six source files this was distilled from; `_source/` holds the pre-adaptation originals.*
