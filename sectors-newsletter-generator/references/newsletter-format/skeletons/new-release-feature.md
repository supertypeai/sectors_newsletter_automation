# Section skeleton: new-release-feature

One issue type's section skeleton, split out of `references/newsletter-format.md`. That file still owns every cross-type convention (header block, ticker mentions, UTM, color, prose style, number formatting, sources appendix, disclaimer, length). Read this file only for the type you are actually writing.

### New release feature
Product enablement, not market analysis. Source is a user-supplied release note (PDF
or Markdown), not a live fetch and not the market API, see
`references/workflows/new-release-feature.md` step 1. Exactly two body sections, ask
for the release note and the feature to highlight before drafting either. **The subject
line, preview text, and headline are about the release only** — never mention the
highlighted feature there, it isn't the issue's hook, it's an add-on beneath it.
1. **Release summary — the issue itself.** H1 headed with a **"Latest Release"** label
   (eyebrow tag in HTML, inline colon-joined in Markdown, e.g. "Latest Release: The
   Straits (3.7.0)"), the same pattern section 2's "Feature Highlight" label uses. A
   brief, sentence-or-two-per-highlight recap of what shipped, pulled only from the
   release note's own Highlights section
   (Sectors release notes tend to run three of these). Omit an Announcement section
   (community events, upcoming workshops) or an Improvements/deprecations section
   entirely if the note has them, those are housekeeping, not release headlines. Not
   an exhaustive changelog, the shape of the release, not every sub-bullet. Closes with
   a **Read more** button linking to the release note's own URL.
2. **Feature highlight — a secondary marketing/education section.** Headed with a
   **"Feature Highlight"** label (an eyebrow tag over a specific title), reads as a
   bonus aside beneath the release summary, not a second headline competing with it.
   One feature, in depth (may not be the release's own headline item, whichever the
   user asked to highlight): what it does, how to use it (steps, where it lives, plan
   tier if gated), and, if it produces data, one real example (a table or figure
   already published in the release note counts, cite it `sectors.app`). **A generated
   chart is not the default here**, a table is usually enough, add one only if it
   carries a takeaway the table doesn't already show. Closes with the CTA: **"Try the
   feature now"** linking to the
   feature's own URL if the user supplied one, otherwise **"Try it yourself now!"**
   linking to `sectors.app`.
3. **Sources** — the release note (title, version if it has one, publish date, link) +
   disclaimer footer.

