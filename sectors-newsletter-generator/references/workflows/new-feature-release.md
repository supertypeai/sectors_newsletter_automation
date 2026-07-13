# New feature release, workflow

Product enablement copy off a real Sectors release: a net-new capability shipped, framed
so a subscriber understands what it does and tries it. This is the one issue type whose
source is **not** the market API, it's the Sectors release notes. Read
`../newsletter-format.md`'s feature-release skeleton and `../sourcing.md`'s **gated
sectors.app / docs.sectors.app fetch** note before drafting.

## 1. Source the release (never from memory)

The release feed is at `https://sectors.app/release`. Your knowledge cutoff is stale for
"what shipped recently", fetch it live. These hosts block a default fetch user-agent
(Cloudflare 403/429), so fetch with a real browser UA (see `../sourcing.md`).

- Pick the **newest net-new feature**, not an enhancement or a fix (those are separate
  issue types). One release per issue, the biggest one.
- Capture: the feature name, what it does, the date, and any usage detail (where it lives
  in the product, what plan tier it needs).
- If the release links to a docs recipe (`docs.sectors.app/recipes`), fetch that too for
  the concrete "how you use it" steps. The docs index is discoverable at
  `https://docs.sectors.app/llms.txt`.

## 2. Optional: a real data example the feature enables

A feature-release issue is stronger when it *shows* the capability on real data rather than
only describing it. If the feature is a new screener field, endpoint, or chart, run one
real `sectors.mjs` call that the feature would produce and put the actual result in the
issue as a concrete "here's what it surfaces" example. Same data discipline as every other
type: real fields only, band-checked (`../sectors-api/data-quality.md`), cited as
`sectors.app`. This is optional, a clear description of a non-data feature (a UI change, an
export format) doesn't need a forced data example.

## 3. Write it as enablement, not hype

- Lead with what the reader can now *do* that they couldn't before, in one line. Not "We're
  excited to announce", the capability itself.
- One short "how to use it" block: where it is, the steps, the plan tier if gated. If a
  docs recipe exists, link it.
- No hype, no dash-connectors, no emoji (`../newsletter-format.md` **Prose style**). Same
  brand voice as every other issue.
- **Compliance still applies.** A feature that screens or ranks stocks is a tool, describe
  what it does, never turn the example into a buy call ("use it to find the best stock to
  buy now"). Keep any data example as capability demonstration, not a recommendation.

## 4. Cite the source

The release page (and any docs recipe) is a cited source like any other, list it in the
issue's **Sources**. A feature claim that isn't on the release page or in the docs gets
cut, don't describe a capability from memory or assumption.

## 5. Self-review before delivery

- Is the feature real and current, pulled live from the release page this run, not recalled?
- Does the issue lead with what the user can now do, not a hype opener?
- If a data example is included, is every figure a real band-checked field cited to
  `sectors.app`?
- Is any screener/ranking example framed as a capability, never as a buy/sell call?
- Is the release page (and docs recipe, if used) in the Sources list?
