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
  buried. Repeat it once near the close.
- Brand voice, no hype, no dash-connectors, no emoji (`../newsletter-format.md`
  **Prose style**), same as every other issue. Excitement comes from the concrete offer,
  not exclamation.

Compliance note: a workshop that teaches building screeners/analysis on market data is a
skills event, describe what participants learn, never turn a data teaser into a buy call.

## 4. Self-review before delivery

- Are all four detail sets real and user-supplied (date/venue, agenda/speaker/audience,
  registration link, banner), none invented?
- Is the registration link present and the CTA unmistakable?
- Is the banner referenced correctly (copied into the folder if it was a local file)?
- If a data teaser is included, is every figure a real band-checked `sectors.app` field?
- Voice clean (no hype, no dashes, no emoji)?
