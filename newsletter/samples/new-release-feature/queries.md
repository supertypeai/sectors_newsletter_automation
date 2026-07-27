# New release feature — resolved intake pattern (worked example: 2026-07-17 issue)

Source recipe: `sectors-newsletter-generator/references/workflows/new-release-feature.md`.
Pinned against the real run that produced `newsletter.md` in this folder (The Straits /
Singapore & Indonesia Groups issue).

## 1. Why this type has no API queries

This is the one issue type with **no `sectors.mjs` call at all**. Its source is a
user-supplied release note, not the market API, and `sectors.app/release` itself is no
longer live-fetchable (see below), so there's no query recipe to pin the way every other
type's `queries.md` does. What's pinned here instead is the **intake pattern**: what to
ask for, and how the two answers map onto the issue's two sections.

## 2. `sectors.app/release` fetch status (confirmed dead end, 2026-07-17)

Two separate runs, a month apart, both hit the same wall:

- 2026-06-12 run (this folder's prior content, when the type was still called
  `new-feature-release` and covered an SGX-screener issue): `sectors.app/release`
  served a Cloudflare-style 403/429, worked around at the time by falling back to
  `docs.sectors.app/api-references/v2/changelog.md`.
- 2026-07-17 run (this issue): retried `sectors.app/release` directly, both `curl -A
  "<browser UA>"` and the `WebFetch` tool got a **Vercel Security Checkpoint** JS
  challenge page (HTTP 403/429, title "Vercel Security Checkpoint"), not a plain bot
  block a UA header clears. The changelog fallback had also gone stale by then, its
  newest entry was still the prior run's SGX screener release, nothing about "The
  Straits" in it, the changelog and the release-notes page turned out to be two
  different content sources, one doesn't substitute for the other.

**Resolution, set by the user this run**: stop trying to fetch either page for this
type. Ask the user directly for the release note (PDF or Markdown) and treat that file
as the source of truth. This is now step 1 of the workflow doc, not a fallback, and the
type itself was renamed `new-release-feature` to match the new two-section shape.

## 3. The two intake questions, and what each produced this run

| Ask | User supplied this run | Feeds |
|---|---|---|
| The release note, as a PDF or Markdown | `<user-supplied path>/New Release Note - The Straits.pdf` — Sectors release v3.7.0, "The Straits," by Samuel, published 2 July 2026, permalink `sectors.app/release/3.7.0` | Section 1 (release summary) + the Sources/Appendix citation |
| The feature to highlight, its usage, and a URL if one exists | Affiliate tickers of conglomerate groups (Singapore + Indonesia), i.e. the release's own "Singapore & Indonesia Groups" item; feature URL `https://sectors.app/indonesia/group` | Section 2 (feature highlight) + its CTA (URL given, so "Try the feature now" rather than the no-URL fallback "Try it yourself now!") |

The highlighted feature happened to be the release's own headline item this run, but
that's not a rule, the workflow doc is explicit the user can pick any feature from the
note, not necessarily the biggest one. The user separately supplied a second, more
specific URL mid-draft, `https://sectors.app/indonesia/group/salim-group`, the exact
Salim Group page backing the worked data example, distinct from the general feature URL
above: the general URL is the section's CTA link, the specific page URL is the inline
citation on the "Salim Group page" mention next to the real-data example. Don't
conflate the two when a user gives both, a feature has one CTA link and can also cite a
specific example page inline.

**Headline/subject scope (added after a follow-up correction this same run)**: the
subject line, preview text, and H1 headline must name only the release, never the
highlighted feature. The first draft of this issue led with the feature ("Every
conglomerate's affiliate tickers, mapped"), which the user corrected: the feature
highlight is a secondary marketing/education section beneath the release recap, not the
issue's hook. In `newsletter.html` this is rendered as a visually distinct shaded box
(`#f2ede4` on the `#fdf7ee` card) set apart by a divider line from the release-summary
section above it; in `newsletter.md` it's a `---` rule plus its own `##` heading. The
eyebrow label over that heading went through two names this run, "Spotlight" first,
then corrected to **"Feature Highlight"** in the very next round of feedback, see
section 5.

## 4. Where the feature-highlight figures came from

No live `sectors.mjs` call. The Salim Group ownership table (LSIP 59.51%, DCII 11.12%,
UNIC 10.34%, EMTK 8.97%, MEGA 1.69%) and DCI Indonesia's shareholder detail (99.85%
tracked ownership, 10 named shareholders, 0.15% free float) are transcribed directly
from a screenshot embedded in the release note PDF itself (page 2, the group page's own
"Group stakes across the portfolio" and "Portfolio & Affiliations" panels). That
screenshot is real, published product output, cited `sectors.app` same as any other
figure, just captured by the release note rather than fetched fresh this run.

## 5. Second follow-up correction, same run (five fixes at once)

A second review pass on the finished draft caught five things, applied together:

1. **Frontmatter failed to parse.** The `subject` value was unquoted plain YAML
   containing both an embedded `"..."` pair and a `: ` mid-string ("The Straits" is
   live: 80+ group pages..."), a colon-space inside an unquoted scalar reads as a
   nested-mapping start to a YAML parser. **Fix: wrap `subject` and `preview` fully in
   double quotes**, with no unescaped double quotes inside. Any frontmatter value that
   contains a colon-space or an embedded quote needs to be quoted end to end, not just
   have the visually "quoted" phrase inside marked off.
2. **Release summary trimmed to the note's own Highlights only.** "The Straits" note
   itself is structured Highlights (3 items: Groups, 3x SG coverage, Onboarding Quests)
   / Announcement (the OpenClaw recap + upcoming workshop) / Improvements (pricing
   page, deprecated pages, Search Console). Only Highlights belong in this newsletter's
   release summary, Announcement and Improvements are omitted entirely, not even in
   passing. The user's framing: "There are only 3 things shipped every release" — Sectors
   release notes tend to run three core Highlights, don't hardcode the number 3 as a
   rule, but do treat the note's own Highlights/Announcement/Improvements split as the
   real signal for what's in-scope vs. out-of-scope for this section.
3. **Headline and intro paragraph rewritten to the user's own wording**: H1 "The
   Straits (3.7.0)", intro paragraph naming exactly the three Highlights, matching the
   trimmed bullet list one-for-one (no bullet appears that the intro doesn't already
   gesture at, and vice versa).
4. **Eyebrow label corrected from "Spotlight" to "Feature Highlight"**, heading text
   "Conglomerates in SG & ID". Note: the user's own message said "SG & MY", read here
   as a slip for "SG & ID" (Indonesia) since the release note only ever launched
   Singapore Groups and Indonesia Groups, no Malaysia group pages exist in this
   release or anywhere in Sectors' current coverage per the note itself, using "MY"
   verbatim would have been a fabricated capability claim. Flagged to the user rather
   than silently guessed.
5. **Removed the Salim Group bar chart entirely** (image, caption, and the
   `chart-salim-group-stakes.svg` file deleted from this folder), the 5-row ticker
   table already carries the same figures, the chart wasn't adding a distinct
   takeaway. This type's own workflow doc now says a generated chart isn't the
   default here, add one only if it shows something the table doesn't already.

## 6. Third follow-up correction, same run: "Latest Release" label on the headline

Added a **"Latest Release"** label on section 1's H1 too, the same eyebrow-tag
convention section 2's "Feature Highlight" label already used: HTML gets a small
uppercase magenta eyebrow div above the headline div, Markdown gets it inline
colon-joined into the H1 itself ("Latest Release: The Straits (3.7.0)"). Same asymmetry
as the Feature Highlight label: HTML stacks eyebrow + title as two elements, Markdown
folds them into one heading line, since Markdown has no eyebrow-tag styling primitive.

## 7. Fourth follow-up correction, same run: DCI paragraph order + "tracked ownership" link

Two more fixes on the same draft:
- The DCI Indonesia detail paragraph ("99.85% tracked ownership across 10 named
  shareholders...") sat before the "Try the feature now" CTA. Moved to **after** the
  CTA instead, still inside the shaded Feature Highlight box (its own row, same
  `#f2ede4` background, right below the CTA row) rather than spilling into the
  Sources/Appendix area below.
- Every mention of the phrase **"tracked ownership"** in the Feature Highlight section
  (three of them: the "How to use it" paragraph, the "See it on real data" intro line,
  and the DCI detail paragraph) now links to
  `https://sectors.app/indonesia/company-ownership`, same ticker-blue `#9E0142` link
  styling as every other in-body link, not just the first occurrence.

## 8. Fifth follow-up correction, same run: shaded-box table rows had no background

User caught a real rendering bug from a screenshot: inside the grey `#f2ede4` Feature
Highlight box, the ticker table's data rows (LSIP/DCII/UNIC/EMTK/MEGA, everything
below the tan header row) rendered as a plain white/cream patch, not the surrounding
grey, because the nested `<table>` and its data `<tr>`s had no `background` set at all
— a `<td>`/`<tr>` with no background is transparent, but the inline HTML email
rendering here didn't reliably let the ancestor `<td>`'s grey show through, so it fell
back to the card's base white. **Fix: set `background:#f2ede4` on both the nested
table's own `<table>` style and on every data `<tr>`** (the header `<tr>` keeps its own
`#fbe9d8` override, which still wins since it's more specific). Also swapped the row
divider color from `#eee` (near-invisible on the grey box) to `#e4cdb4` (the same tan
used for the divider line elsewhere), same underlying bug: a color picked assuming a
white card background silently disappears once a section's background changes to grey.
**Lesson for reuse: any table/row dropped inside a colored (non-`#fdf7ee`) section
needs its own background and border colors set explicitly, don't rely on transparency
inheriting correctly.**

Separately, the user had directly edited `newsletter.md` mid-session (split the first
Feature Highlight paragraph in two, trimmed the "How to use it" sentence to drop "or
jump straight to one you already track" and the shareholder-breakdown detail, which
also removed one of the three "tracked ownership" links, leaving two). `newsletter.html`
was stale against that edit and was brought back in sync in the same pass as the
background fix, per [[feedback_html_md_sync]] discipline: a manual edit to one file
still requires checking the other before the next round of changes, not just reacting
to the next explicit instruction.

## 9. Sixth follow-up correction, same run: dropped the shaded box entirely

Asked the user directly (background-inheritance fix in section 8 prompted a "why does
this section look different" question): keep the grey `#f2ede4` tint on the Feature
Highlight box, or go back to a plain card background throughout? **User chose plain.**
Removed `background:#f2ede4` from every row in that section (content, CTA, DCI detail)
and from the nested ticker table and its data rows, reverted the table's row-divider
color from `#e4cdb4` back to the file's standard `#eee` (safe again on a white card),
and added a `border-bottom:1px solid #e4cdb4` on the DCI-detail row to close the
section with a bottom divider now that there's no color block doing that job visually.
**Net result: Feature Highlight is set apart by the divider line + eyebrow label alone,
same as every other section boundary in this file, no background-color block.** This
reverses part of section 6/8's earlier design call, the eyebrow-label convention itself
stands, the shaded-box treatment doesn't.

## Reuse checklist for the next new-release-feature run

1. Don't attempt `sectors.app/release` or its changelog fallback, both are dead ends
   for this type as of 2026-07-17. Ask for the release note file directly.
2. Ask for the feature to highlight in the same message: what it does, how to use it,
   and its URL if one exists. Hold on both before drafting anything.
3. If no feature URL is given, the CTA copy changes to "Try it yourself now!" linking
   to `sectors.app`, not a broken or invented feature link.
4. Section 1 stays a brief, sentence-or-two-per-highlight summary of the release
   note's own Highlights only (omit any Announcement/Improvements section entirely),
   closing with a Read more button to the release note's own URL.
5. Section 2 carries the depth under a "Feature Highlight" label: what it does, how to
   use it, one real example (the release note's own data counts if no fresh API call
   is warranted; skip a generated chart unless it adds a takeaway the table doesn't
   already show), then the CTA.
6. Quote every frontmatter value that contains a colon or an embedded quote mark, end
   to end, not just around the visually "quoted" phrase inside it.
7. Diff the finished draft's section order against `newsletter.md` in this folder:
   headline → what shipped (3 Highlights, bulleted, brief) → Read more → Feature
   Highlight (prose + real example, no chart by default) → Try the feature now →
   Sources → Appendix → disclaimer.
