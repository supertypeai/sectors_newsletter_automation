# New release feature, workflow

Two-part product announcement: the issue itself is a summary of the latest Sectors
release (subject, preview, and headline are about the release, full stop), with a
secondary marketing/education section added on beneath it spotlighting one feature from
the release (not necessarily its own headline item, whichever the user wants promoted).
This is the one issue type whose source is **entirely user-supplied**, not the market
API and not a live fetch, see step 1 for why. Read `../newsletter-format.md`'s
new-release-feature skeleton before drafting.

## 1. Ask, don't fetch (confirmed 2026-07-17)

`https://sectors.app/release` used to be treated as a live-fetchable source (a browser
user-agent cleared Cloudflare's 403/429). As of 2026-07-17 it instead serves a **Vercel
Security Checkpoint** JS challenge (HTTP 403/429, page title "Vercel Security
Checkpoint") on every fetch method tried, `curl` with a browser UA and the `WebFetch`
tool both hit it, confirmed on two separate runs a month apart. This isn't a
friendlier-header problem, it needs real JS execution this skill can't do. Don't retry
the old fetch recipe, ask the user for the release note directly instead:

1. **The release note itself, as a PDF or Markdown file.** A local file path is fine.
   This is what gets summarized in section 1, read it in full before drafting, don't
   summarize off a title or memory of a past release.
2. **The feature to highlight** (may differ from the release's own headline item, the
   user picks), covering:
   - What it does and how to use it, in enough detail to write real "how to use it"
     copy, not a restatement of the release note's own blurb.
   - **A URL straight to the feature**, if one exists (a product page, a report page).
     This becomes the section 2 CTA's link.
   - If no URL exists for this feature, say so, the section 2 CTA becomes **"Try it
     yourself now!"** linking to `https://sectors.app` instead of a dead or generic
     link.

Hold until both are in hand. An invented release note or a guessed feature URL is a
factual error in a piece that goes to real subscribers, same discipline as
`upcoming-event`'s user-supplied intake.

## 2. Two sections, nothing else

This type is deliberately narrow, not a full recap of every release item. The two
sections carry different weight and different jobs, don't blend them.

1. **Release summary — this is the issue.** The subject line, preview text, and
   headline are about **the release itself**, never the highlighted feature (an
   invented "we shipped this one thing" headline when the release actually bundled
   several items is a factual overstatement). Head the H1 with a **"Latest Release"**
   label the same way section 2 gets a "Feature Highlight" label (eyebrow tag in HTML,
   inline colon-joined in Markdown, e.g. "Latest Release: The Straits (3.7.0)"),
   confirmed 2026-07-17. Cover only the release note's own core
   net-new items, what it itself calls its "Highlights" (Sectors release notes tend to
   run three of these per release, confirmed 2026-07-17, though don't hardcode the
   count, cover however many the note's own Highlights section names). **Omit an
   "Announcement" section (community events, upcoming workshops) and an
   "Improvements"/deprecations section entirely if the note has them** — those are
   lower-priority housekeeping items, not release headlines, and don't belong in this
   newsletter's release summary even in passing. A sentence or two per Highlight, don't
   try to cram every sub-bullet in, this section's job is "here's what shipped," not an
   exhaustive changelog. Close with a **Read more** button linking to the release
   note's own URL (the permalink inside the PDF/Markdown if it has one, e.g.
   `sectors.app/release/<version>`, otherwise the general `sectors.app/release` feed).
2. **Feature highlight — an added marketing/education section, not the issue's hook.**
   Editorially secondary to section 1, headed with a **"Feature Highlight"** label (an
   eyebrow/small-caps tag above a specific title, e.g. "Feature Highlight: Conglomerates
   in SG & ID"), not folded into the headline or subject line. **Separation is a divider
   line plus the eyebrow label, not a background-color block** (tried a shaded
   `#f2ede4` box on 2026-07-17, user reverted it, plain card background throughout,
   don't re-introduce a tinted section here without being asked).
   One feature, in depth: what it does, how to use it (steps, where it lives, plan tier
   if gated), and, if the feature produces data, one real example, **a table or figure
   is enough on its own, don't add a generated chart by default** — only include one if
   it carries a takeaway the table doesn't already show, a chart repeating what a
   5-row table already states plainly isn't the key takeaway, skip it (confirmed
   2026-07-17, overriding this skill's usual "every issue gets a hero chart" default
   for this type specifically). A screenshot or data table already published in the
   release note itself counts as real, cited data (cite it `sectors.app`), pulling one
   fresh live API call is optional, not required, since this type's source is the
   release note, not the market API. Close with the CTA from step 1: **"Try the
   feature now"** linking to the feature URL, or **"Try it yourself now!"** to
   `sectors.app` if no feature URL exists.

## 3. Write it as enablement, not hype

- Section 1 stays brief and scannable, a subscriber should get the shape of the release
  in a few seconds. Section 2 is where the depth goes.
- Lead the feature highlight with what the reader can now *do*, not "we're excited to
  announce." The capability itself is the hook.
- No hype, no dash-connectors, no emoji (`../newsletter-format.md` **Prose style**).
  Same brand voice as every other issue.
- **Compliance still applies.** A feature that screens, ranks, or maps ownership is a
  tool, describe what it does, never turn a data example into a buy call.

## 4. Cite the source

The release note is a cited source in the issue's **Sources**, name the release (title,
version if it has one, publish date) and link it. A claim about the highlighted feature
that isn't in the release note or the intake conversation gets cut, don't describe a
capability from memory or assumption.

## 5. Self-review before delivery

- Did drafting start only after both intake items were in hand (the release note file,
  the feature to highlight with its detail and URL/no-URL call), nothing guessed?
- Do the subject line, preview text, and headline name only the release, with no
  mention of the highlighted feature?
- Does section 1 stay a brief summary with a working Read more button, not a full
  changelog dump, and does it cover only the release note's own Highlights, omitting
  any Announcement or Improvements section entirely?
- Does section 2 read as a clearly secondary, bonus add-on under a "Feature Highlight"
  label, not competing with section 1 for the issue's hook, and does it skip a
  generated chart unless one actually adds a takeaway the table doesn't already carry?
- Does section 2 lead with the capability, cover real how-to-use detail, and close with
  the correct CTA copy for whether a feature URL exists ("Try the feature now" vs. "Try
  it yourself now!")?
- Is any data example in section 2 real (from the release note or a fresh API call),
  never invented, and cited `sectors.app`?
- Is any screener/ranking/ownership example framed as a capability, never as a buy/sell
  call?
- Is the release note in the Sources list?
- If a data example includes a ticker, does it read bold, linked, and ticker-blue
  (`#9E0142`), gain/loss green/red (`#568475`/`#D53E50`) if signed
  (`../newsletter-format.md`'s Color convention, applies to every issue)?
- Is the Appendix (endpoint/field trace, or "sourced from the user-supplied release
  note, no live endpoint fetched" if no fresh API call was made) present, after Sources
  and before the disclaimer?
