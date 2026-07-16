# Upcoming event, workflow

A promo issue for a **Sectors in-house event**: an online or offline workshop teaching
participants to build systems and products on live Sectors API data. This is an event
announcement, not market analysis, its content comes from **user-supplied event details**,
not the market API and not web research. Read `../newsletter-format.md`'s upcoming-event
skeleton before drafting.

## 1. Collect the event details first (ask, don't invent)

The whole issue is built from details only the user has. Before drafting anything, ask for
all four. Do **not** fabricate or guess any of them, an invented date, venue, or speaker
is a factual error in a promo that goes to real subscribers.

1. **Time, date, venue** — start (and end) time with timezone; online (platform/link) or
   offline (physical address); or hybrid.
2. **Topic, agenda, speaker(s), target participants** — what it covers, the run of show,
   who's presenting (name + role), and who it's for (skill level, audience).
3. **Registration link** — the exact URL the CTA points to.
4. **Marketing image / banner** — the asset to feature. A local file path or a URL. If
   local, copy it into the issue folder and reference it with a relative Markdown image
   link; if a URL, reference it directly.

If the user is missing one, say which, and hold rather than fill the gap with a
plausible-looking placeholder. A registration link is the CTA, the issue doesn't ship
without it.

## 2. Optional: a real "what you'll build" teaser

The workshop runs on Sectors API data, so a short, concrete teaser of what participants
will build lands harder than an abstract pitch. If it fits, run one real `sectors.mjs`
call that produces the kind of output the workshop teaches (a screener result, a price
series, a sector leaderboard) and show the actual data as a "this is what you'll be
working with" example. Same discipline as every issue: real band-checked fields only
(`../sectors-api/data-quality.md`), cited `sectors.app`. Optional, skip it if the agenda
already speaks for itself.

## 3. Write the promo

- **Lead with the hook**: what the participant walks away able to do, and the single most
  compelling logistical fact (a named speaker, a hard date, "hands-on, live data").
- **Banner up top**, right after the headline, with a one-line caption.
- **The essentials as a scannable block or small table**: date/time, venue/format,
  who it's for. A reader should catch the when/where/who in one glance.
- **Agenda** as a short list; **speaker(s)** with name + role.
- **Clear single CTA**: the registration link, stated plainly ("Register here"), not
  buried. Repeat it once right after the essentials and again at the close (three total
  touches: hook, essentials, sign-off).
- Brand voice, no hype, no dash-connectors, no emoji (`../newsletter-format.md`
  **Prose style**), same as every other issue. Excitement comes from the concrete offer,
  not exclamation.

Compliance note: a workshop that teaches building screeners/analysis on market data is a
skills event, describe what participants learn, never turn a data teaser into a buy call.

### The "what you walk away with" section, write it like a CxO deciding whether to expense it

This is the section that actually converts a browser into a paid registrant, the agenda
tells them what happens in the room, this tells them why it's worth their evening and
their company card. Draft it by asking, for each agenda item, "so what does the
participant get to stop doing, or start doing, because of this" and lead the bullet with
that answer, not the feature.

- **One short list, benefit first.** Each bullet opens with the bolded payoff stated as
  an outcome ("Zero manual screening, ever again," "You hear about the move before your
  group chat does"), then one sentence of mechanism after the payoff, never before it. A
  reader skimming just the bolded openers should get the full pitch.
- **Pick factors a buyer actually weighs**, not a restatement of the agenda: time saved
  or a manual task eliminated, being first to know something (competitive/informational
  edge), an outcome achievable with no technical background (lowers the buyer's risk),
  and the instructor's real-world credibility (de-risks "will this actually work for
  me"). Four to five bullets, no more, a CxO skims a short list, not a case study.
- **No emoji as a bullet marker or label.** They read as decoration standing in for the
  point rather than making it, plain bold text carries more weight here. This holds even
  though the rest of `newsletter-format.md`'s no-emoji rule is about body prose, it
  applies to this section's list markers too.
- **Don't add a table for this section.** An `upcoming-event` issue already carries the
  essentials block and, when a data teaser is included, a screener-results table, a third
  table in one short promo email reads as spreadsheet fatigue, not scannable. A
  bold-lead bullet list is the scannable form here, save tables for the two slots that
  already own them.
- **A short numbered "how we get there" list is optional, and separate.** If the agenda
  naturally chunks into stages (connect, filter, deliver, ship), a compact 3-5 item
  numbered list right after the walk-away bullets shows the path without diluting the
  benefit-first list above it with process detail. Keep each line to a bolded stage name
  plus a short clause, not a re-explanation of the benefit already stated above.

## 4. Ship both `newsletter.md` and `newsletter.html`

`upcoming-event` ships as a send-ready HTML email (`newsletter.html`), not just the
Markdown draft, same as `weekly-wrap` (`../newsletter-format.md`'s delivery note, and
`SKILL.md`'s delivery section). Keep `newsletter.md` as the review draft; build
`newsletter.html` from it using the shared house chrome (email-safe inline styles, table
layout, `#fdf7ee` card on `#f2ede4` background, `#d6336c` accent), the same pattern
`single-company-deep-dive.md`'s worked HTML uses. The banner image sits inline right
after the headline block, same placement as the Markdown version. The worked reference
for this type is `newsletter/newsletter_2026-07-13_upcoming-event/newsletter.html`.

## 5. Self-review before delivery

- Are all four detail sets real and user-supplied (date/venue, agenda/speaker/audience,
  registration link, banner), none invented?
- Is the registration link present and the CTA unmistakable, appearing near the top,
  after the essentials, and again at the close?
- Is the banner referenced correctly (copied into the folder if it was a local file), and
  identical between the `.md` and `.html`?
- Does "what you walk away with" lead every bullet with the benefit, not the feature, and
  stay emoji-free and table-free?
- If a data teaser is included, is every figure a real band-checked `sectors.app` field?
- Voice clean (no hype, no dashes, no emoji)?
- Does `newsletter.html` exist alongside `newsletter.md` and match it section for
  section?
