# Sectors writing core

**This file is the single source of truth for how Sectors writes, in every medium.** Carousels, reels, newsletters, publications, ads and story images all read it. Nothing below is skill-specific. Each skill layers its own surface rules on top, in its own `references/writing.md`, and a surface file may add a constraint but may never relax a rule stated here.

> **Reference copy.** Pulled in from the Sectors skills repo's shared `_shared/writing/core.md` (jigsawinthecity/claudeskills) so this skill stays self-contained and needs no other repo checked out alongside it. This copy is static, not auto-synced from there — re-pull it by hand if the canonical file changes upstream.

Companion files in this folder: `brand-voice.md` (who is talking, the register, the off-brand vs on-brand table) and `audit.md` (the gate every piece passes before delivery).

**"Unit" throughout this file** means one self-contained piece of copy in whatever medium is being written: a carousel slide, a reel scene, a newsletter section, an article section, an ad, a story image. Where a rule says "every unit," read it as whatever your skill's unit is.

---

## 1. Non-negotiables

These override every craft rule below. A piece that breaks one of these does not ship, no matter how well it reads.

1. **Never fabricate a number.** Every figure traces to a real Sectors field fetched this run or to a cited source. No estimates dressed as facts, no prices rounded from memory, no figure computed mid-composition and left unchecked. If you do not have it, leave it out and say the piece dropped it. See your skill's `references/sectors-api/data-quality.md` for the plausibility bands.
2. **Never give investment advice.** Describe, do not prescribe. No "buy," no "sell," no "this is cheap, load up," no price target framed as our call. Report what the data shows and let the reader decide. Analyst consensus may be *reported* as a fact ("34 analysts, consensus Buy"), never *endorsed*.
3. **No hype vocabulary.** No "to the moon," "explosive," "must-own," "skyrocket," "10x." The market is interesting enough told straight.
4. **Respect the reader's intelligence while lowering their effort.** Plain words carrying real analysis. Simple is not simplistic.
5. **Cite the data source as `sectors.app`**, never "Sectors API" and never a bare "Sectors," on anything a reader sees. "Sectors API" is an internal engineering name that means nothing to a reader and leaks implementation detail. It is fine in working notes; it never reaches published copy.
6. **English.** Indonesian market context, English copy. Indonesian phrasing in a draft is a bug.

**Rule priority when rules collide: Accurate > Clear > Specific > Voiced > Stylish.** A true vague sentence beats an elegant fabricated one.

---

## 2. Finding the story

**Editorial laws:**

- **Story first, data second.** Find the angle by research before fetching numbers. Numbers are evidence for a story you already have, not the story itself. Cheap discovery calls may legitimately surface a candidate subject, but the thesis and the beats come from research before any beat is fetched for real.
- **Every unit states a verdict.** Not "EPS growth 4.9%" and move on. Say "growth has nearly stopped, the slowest in five years." The number is the proof, the sentence is the point.
- **Omit openly, never curate silently.** A null, implausible or off-thesis data point gets dropped, the piece re-angles around what is real, and it says what was dropped. Cutting inconvenient years to make a trend look cleaner bends the data to the story, the one thing never to do.
- **Recent is the story, history is the proof, never the headline.** The thesis centers on something that actually happened or changed recently: a print, a filing, a rate move, a flow reversal, a rally or a plunge in the last weeks. A five-year streak or a long-run ratio is real evidence that the recent thing is genuine or unusual, and belongs in the beats, but cannot be the lead. "TLKM has paid a dividend every year since 2020" is a reference fact. "TLKM just raised its payout past 100% even as profit fell" is a story. If nothing recent turns up for a subject, pick a different subject rather than leading with the history.
- **Every beat needs a benchmark.** A number alone is not a finding: "87% payout" means nothing until the reader knows what is normal. Pair each figure with a comparison anchor, the company's own history, a peer, or a category norm. With no anchor the beat is probably a restated fact, so dig further or cut it.
- **Rank the beats before writing a line of copy.** The single most surprising, hardest-to-explain-away number earns the opening third of the piece, never a buried closing clause.

**The arc, six moves. The first four do most of the work.**

1. **The dance, context against conflict.** Every transition is a BUT or a THEREFORE, never "and then another stat." "BBRI just posted its highest net profit ever. THEREFORE you would expect the stock to rip. BUT foreign investors sold a net IDR 1.4T into the print." If a transition is "and then," the unit is filler: cut it or sharpen it into a turn.
2. **Direction.** Write the payoff, the last content unit, the "so what," first, then work backward to the opening. Make it memorable enough that reading only it would make someone send the piece on.
3. **Story lens, the non-obvious angle.** A ticker is not an angle. Push past the obvious one: invert the villain (the price drop is not the story, who sold is), jump to the second-order effect (do not cover the rate cut, cover what it re-rates), switch the point of view (the foreign investor's seat rather than local retail's). Pick the lens before writing.
4. **Rhythm.** See section 5. Vary sentence length inside every unit, and vary density across units.
5. **Tone.** Defer to `./brand-voice.md`. Write to one smart, time-poor friend, not to "an audience." Frame around the ticker and the market in you/they terms, never as an I-story. There is no founder on this account.
6. **The hook.** Whatever opens the piece, a cover slide, a subject line, a title, a headline, must be plot-indicative rather than a promise to wait, and must promise exactly the payoff written in move 2. Each skill's surface file states the form its hook takes.

---

## 3. Plain words

Target roughly an 8th-grade reading level for body copy and 6th grade for a hook. This lowers the **reading level, not the analysis**: a P/E re-rate can stay sophisticated while the words carrying it stay plain. People leave not because a piece is too simple but because following it is too much work.

- **Define deep jargon once, in a plain clause, not a glossary box.** Keep shared vocabulary as-is (ticker, dividend, IDX, rupiah) and translate the rest in passing: "P/E of 22, what you pay for each rupiah of annual profit"; "ROE of 21%, the profit earned on shareholders' money"; "an 80% payout, the share of profit paid out as dividends."
- **One idea per sentence.** Break nested clauses into separate sentences.
- **Plain verbs over sell-side ones:** pays out not distributes, owns not holds a position in, earns not generates returns, trades at not is valued at a multiple of, rose and fell not appreciated and depreciated.
- **Concrete over abstract.** A real number beats an adjective: "Net profit rose 11% to IDR 54T" beats "strong earnings growth." The clarifying number must be a real field, never invented to make the sentence land.
- **Active voice.** "BBCA earns 21% on equity," not "a 21% return on equity is generated."
- **Cut filler:** "in order to," "it is worth noting that," "when it comes to."
- **Define a ratio by what it tells you, not by its formula.** "ROE shows how hard a bank works its shareholders' money" beats "ROE = net income / equity."

**Do not let this fight section 5.** Simplify word choice, not cadence. Chopping copy into fragments to hit a grade level produces exactly the staccato rhythm section 5 bans.

---

## 4. The AI-tell filter

Read a suspect line aloud. Its problem, whether vague, overstated, hedged, flat, or borrowing authority it has not earned, becomes audible.

**Specificity ladder, aim for concrete as the minimum:** vague ("the bank faced headwinds") to specific ("margins compressed") to concrete ("NIM fell 40bps to 5.2%") to lived and sourced ("NIM fell to 5.2% as BI held rates and deposit costs rose"). Every specific traces to a real field from this run. Never invent one to climb the ladder.

### 4a. The negative-parallelism ban

This is the single loudest AI tell. It is a sentence that defines something by rejecting a frame first, instead of just stating what is true. All of the following shapes are banned, in any medium, at any length.

**The classic, "It's not X, it's Y."** Also "Not X. Y.", "The real story isn't X, it's Y.", "Most people think X, but..."

> Banned: "It's not about the price. It's about the story."
> Fixed: "The price rose 4%, but foreigners sold a net IDR 1.4T. The rally was domestic retail."

**The inverse, "It's X, not Y."** The same move with the halves swapped, and it slips past a filter that only watches for the classic.

> Banned: "This is a funding story, not a demand story."
> Fixed: "Demand held at 4% growth. The shortfall came from a IDR 2.1T maturity the company had to refinance at 11%."

**The concessive, "X isn't just Y, it's Z."** Escalation dressed up as clarification.

> Banned: "BBCA isn't just a bank, it's a deposit franchise."
> Fixed: "68% of BBCA's funding is current and savings accounts, the highest ratio of any big-four bank."

**The rhetorical question flip.** A question posed only so it can be knocked down.

> Banned: "So is it a turnaround? Not quite. It's a one-off gain."
> Fixed: "Q2 2025's IDR 21.1T included a one-off gain on the Aster purchase. Strip it out and profit fell 3%."

**The soft comparatives, "A rather than B" and "less A than B."** The same retraction with the rhetoric filed off. They are the shapes that survive when a writer knows the classic is banned.

> Banned: "The move was a funding decision rather than a demand signal."
> Banned: "The result is less a turnaround than a one-off."
> Fixed: "The company refinanced a IDR 2.1T maturity at 11%. Demand held at 4% growth throughout."

**The "real story" family.** "The real story here is...", "What's actually happening is...", "The number nobody is looking at...", "What this really means is...", "The truth is...", "The hidden..." Any construction that announces an explanation instead of giving it.

> Banned: "The real improvement is hiding behind the headline."
> Fixed: "Q2 2025's IDR 21.1T was a one-off gain on the Aster purchase."

**How to fix any of them:** delete the rejected half entirely and state the positive half as a direct claim with real specifics. If the sentence has nothing left once the rejected half is gone, it was never carrying a fact.

**The one allowed contrast.** A hook may set up A against B, what the reader assumes against what the data shows, when **B is concrete**: a real figure or a named mechanism. "It's not about valuation, it's about conviction" is hollow B and stays banned. "Everyone watched the price. Foreigners sold a net IDR 1.4T into the rally" is concrete B and is allowed.

### 4b. Analogy control

Write literally by default. An analogy earns its place only if it clarifies, is shorter than the literal version, stays exact, and sounds natural read aloud. In copy under 40 words, use none.

**Banned metaphor families:** journeys, battlefields, machines-for-people, ecosystems, engine and fuel, north star, flywheel, DNA, scaffolding, plumbing, iceberg, bridge, chess, sports, rollercoaster, bloodbath, storm and weather (headwinds, tailwinds), tide, perfect storm, David vs Goliath, printing money.

**Banned metaphor verbs:** baked in, bolted on, woven, layered, distilled, unpacked, crystallized, surfaced, amplified, threaded, sculpted, anchored, framed. Use rose, fell, paid, earned, sold, cut, added, caused, showed instead.

A skill whose medium genuinely needs one everyday comparison to explain a mechanic may carve that out in its own surface file, and this skill does not. The banned families and verbs above still bind inside any such carve-out.

### 4c. Blocklists

The principle outlives the list: any word doing PR for an idea instead of describing it goes.

- **Vocab tells:** delve, realm, harness, unlock, tapestry, leverage, synergy, seamless, robust, elevate, streamline, supercharge, game-changer, cutting-edge, revolutionize, transformative, intricate, crucial, pivotal, testament, foster, empower, holistic, unparalleled, groundbreaking, scalable, intuitive, disruptive.
- **Vague market-speak:** landscape, headwinds, tailwinds, navigate, choppy, "in this market," "uncertain times," "macro environment," "the space," "positioned for," and "volatility" used as filler. Say the actual move and its driver.
- **Hype:** skyrocket, explosive, soar, parabolic, must-own, "to the moon," 10x, "the next [big name]," "printing money."
- **Finfluencer bait:** "nobody's talking about this," "this is your sign," "you're early," "before it's too late," "the secret," "what they don't want you to know."
- **False precision:** an oddly exact figure with nothing behind it ("up exactly 17.34%").
- **Bloated verbs:** serves as, stands as, marks a, represents a, boasts a, plays a role in, helps to, aims to, seeks to. Use is, has, rose, fell, pays, owns, shows.
- **Dead openings:** "In today's market...", "It's important to note...", "Let's dive in," "At the end of the day," "Most people don't realize."
- **Dead transitions:** Furthermore, Additionally, Moreover, That said, With that in mind.
- **Engagement bait:** "Let that sink in," "Read that again," "This changes everything," "Save this," "Tag an investor friend."
- **Formatting tells:** em dashes, en dashes and a spaced hyphen used as a connector (use periods, commas, colons or parentheses); emoji and hashtag spam; walls of bullets; a rule-of-three list when the real count is two or four. A "·" stitching two phrases inside a running sentence ("Profit rose · the stock fell") reads as a keyword list and gets rewritten. This does not touch the "·" in kicker, label and chip rows ("IDX · DIVIDENDS"), which is fixed house-style chrome.
- **Other tells:** false ranges ("from blue chips to penny stocks" with no middle); elegant variation (BBCA becoming the lender, then the banking giant, when the ticker should just repeat); participle fake-depth ("...signaling strength, paving the way for growth"); throat-clearing openers; symmetric parallelism ("strong balance sheet, strong margins, strong outlook").

---

## 5. Rhythm

AI prose gives itself away by cadence as reliably as by vocabulary. A run of clipped sentences of near-identical length reads as generated even when every word passes the blocklist.

**The rule: no three or more consecutive sentences under about eight words.** This is measured inside a single unit, not across units. A carousel slide's body copy is one run. A newsletter paragraph is one run. A voiceover script is one run. Consecutive slides are separate units and are not compared to each other.

**Also banned, anywhere:**

- **The three-item parallel fragment run.** "Fast. Cheap. Reliable." "Cheaper deposits. Lower provisions. Higher returns." Three noun-or-adjective fragments in a row is the most recognizable AI cadence there is.
- **Multi-sentence headlines built from clipped halves.** A headline is one clause.

> Banned headline: "Profit grew. Losses too."
> Allowed headline: "Profit grew, so did losses." Or: "Losses grew faster than profit."

**Vary length deliberately.** A good paragraph runs short, then medium, then one longer sentence that rolls to a close. A jagged left edge means it is working. An even one means it is not.

> Banned: "Margins fell. Costs rose. The market noticed."
> Fixed: "Margins fell 40bps as deposit costs rose, and the market noticed within a session: foreigners sold a net IDR 1.4T that week."

The fix is almost never to add words for their own sake. It is to join two clipped sentences with the causal link that was there all along, and to attach the real number that the clipped version left out.

**This does not license bloat.** A single short sentence is fine and often the strongest thing on the page. Two in a row are fine. The ban is on the third, and on the parallel-fragment pattern at any count of three.

---

## 6. Directness

Say the thing. Copy that makes the reader work out what it is about has failed, no matter how well it reads aloud.

**Name the subject in every unit.** Each unit gets read alone: a slide surfaces as a thumbnail, a reader swipes in from the middle, a newsletter reader jumps to the section that interests them, a heading shows up in a search result. So a headline may never point at something that lives in another unit. "Four things settle this" and "The market has already repriced it" both fail, because *this* and *it* are defined three units earlier. Write "Four numbers show whether the profit turn is real" and "TPIA's price to book fell from 13.7x to 2.4x."

> The test: cover every other unit and read this one. If a pronoun, a demonstrative (this, that, these, those), or a bare abstraction (the turn, the story, the shift, the problem) has no antecedent inside the unit itself, replace it with the noun.

**Lead with the finding, not the setup.** The first clause carries the verdict; context follows if there is room. "Take out that one quarter and 2026 looks steadier" buries the point behind an instruction to the reader. "Both 2026 quarters earned IDR 2.5T" states it. Cut any opener that tells the reader how to look ("Take out", "Strip away", "Look closer", "Here's what", "What if", "Consider"), then check whether the sentence still needs the rest.

**Name the mechanism instead of gesturing at it.** "The real improvement is hiding behind the headline" describes that an explanation exists. "Q2 2025's IDR 21.1T was a one-off gain on the Aster purchase" is the explanation. Whenever a sentence refers to a fact rather than stating it (the actual improvement, the thing nobody noticed, what the number hides, the story underneath), delete the reference and write the fact. This overlaps the "real story" family in section 4a on purpose.

**No hedged verbs in a headline, heading or subject line:** looks, seems, appears, suggests, hints at, points to, may signal. The data either shows it or the beat gets cut. "Profit looks steadier" is a guess; "Profit held at IDR 2.5T for two straight quarters" is the finding. Hedging belongs in body copy, once, when the uncertainty is real and worth stating.

**Say it in the order it happened.** Cause then effect, purchase then revenue, not the clever inversion. Copy that reveals its subject in the last clause is a riddle.

---

## 7. Voice

Full treatment, including the audience, the register and the off-brand vs on-brand table, in `./brand-voice.md`. In one paragraph: Sectors is a sharp markets explainer, the friend who reads the filings and tells you what the number means. Not a finfluencer, not a sell-side analyst. Confident, plain, curious rather than breathless, and never "GAME CHANGER."

---

## 8. Before delivering

Run `./audit.md`. It is a gate, not a suggestion. Fix every hit, then deliver.
