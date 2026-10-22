# HTML components for sector-spotlight

Exact markup from the reference issue `newsletter_2026-10-22_sector-spotlight` (also `samples/sector-spotlight/newsletter.html`). Copy these, change only text, numbers and the `{UTM}` string. The shared shell, section divider, CTA card, stat tile, key takeaway callout, data table and captions are in `company-issue-components.md`; this file adds the pieces a valuation-led issue needs. Every colour comes from the Color convention in `../newsletter-format.md`.

`{UTM}` is the full tracking string (`utm_source=newsletter&utm_medium=email&utm_campaign=sector-spotlight_<date>&utm_content=<section>&utm_term=<ticker>`).

## Design rules for this type

- **Break the table rhythm.** No two data blocks of the same shape back to back. Cycle through stat tiles, bars, side-by-side cards, a company card and a callout. A run of heading, paragraph, table, paragraph is a defect.
- **Every number gets a job.** Show the figures that carry the argument and drop the rest. The reader can open a company report for P/B, P/S, debt/equity and the long tail. Three columns in a peer table is normal.
- **Explain before you show.** The first screen carries a plain-English opening and the "How to read" box before any ratio table.
- **Equal-height tiles.** Tiles use `valign="middle"` so a tile with two lines sits centred beside a tile with three. Cards side by side pad the shorter list with blank rows so both end together.
- **Never label a stock "cheap", "expensive", "undervalued" or "a bargain"** (`../compliance.md`). Say "lowest multiples" and "highest multiples", "low-multiple" and "high-multiple". Card titles are neutral descriptions of the screen, not verdicts.
- **Bars are drawn from zero.** One linear scale, stated in the table header. Never size bars against an outlier that squeezes the rest into slivers (a 68x bank beside a 3x bank makes the 3x bar invisible), so use bars only for a series without an outlier, such as the five-year median.
- **Signed values** use `#568475` and `#D53E50` bold. Neutral comparisons (cheap versus rich groups) use tan and tint backgrounds, not green and red.

## Stat tile (vertically centred)

```html
<td width="33%" valign="middle" style="padding:10px 8px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Median P/E</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;">8.0x</div><div style="font-size:11px;color:#6b6b6b;padding-top:3px;line-height:1.4;">five-year low</div></td>
```

Wrap a row of tiles in `<table role="presentation" width="100%" cellpadding="0" cellspacing="6"><tr>...</tr></table>`, and wrap that table in a shaded card: `<div style="background:#fbe9d8;border-radius:12px;padding:16px 14px 10px 14px;">` for "At a Glance", `<div style="background:#f2ede4;border-radius:12px;padding:6px 8px;margin-top:12px;">` for a stat row inside a section. A tile row is never left bare on the page.

## How to read box (required, directly after At a Glance)

```html
<div style="background:#f2ede4;border-radius:12px;padding:16px 20px 18px 20px;">
  <div style="font-size:15px;font-weight:800;color:#1c1c1c;">How to Read the Numbers in This Issue</div>
  <div style="font-size:11px;font-weight:800;color:#9E0142;text-transform:uppercase;letter-spacing:0.06em;padding-top:12px;">P/E, the price of a year of profit</div>
  <p style="font-size:14px;line-height:1.55;color:#333;margin:4px 0 0 0;">A P/E of 8.0x means investors pay IDR 8 for every IDR 1 a bank earns in a year. ...</p>
  <!-- repeat label and paragraph for median and weighted, then P/B -->
</div>
```

Define each metric by the question it answers, in one or two sentences, with a worked example drawn from the issue's own number. Explain only the metrics the issue uses.

## Bar row (five-year series, bars from zero)

```html
<tr style="background:#fbe9d8;font-weight:800;"><td width="44" style="padding:9px 8px;border-bottom:1px solid #eee;">2026</td><td style="padding:9px 8px;border-bottom:1px solid #eee;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ede4;border-radius:3px;"><tr><td width="44.4%" style="background:#9E0142;height:10px;line-height:10px;font-size:0;border-radius:3px;">&nbsp;</td><td style="font-size:0;line-height:10px;">&nbsp;</td></tr></table></td><td width="56" style="padding:9px 8px;border-bottom:1px solid #eee;text-align:right;">8.0x</td></tr>
```

Bar width is `value / axis_max * 100` as a percent, with `axis_max` a round number just above the largest value (18 for a 16.9x series). Earlier years use `#d9b99b`, the current year `#9E0142` on a `#fbe9d8` row. The header cell says "bars drawn from zero".

## Two big-number tiles (median versus weighted)

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="margin-top:10px;"><tr>
<td width="50%" valign="middle" style="padding:14px 12px;text-align:center;background:#f2ede4;border-radius:10px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Median P/E</div><div style="font-size:28px;font-weight:800;color:#1c1c1c;padding-top:2px;">8.0x</div><div style="font-size:12px;color:#6b6b6b;padding-top:2px;">half the banks are lower</div></td>
<td width="50%" valign="middle" style="padding:14px 12px;text-align:center;background:#fbe9d8;border-radius:10px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Weighted P/E</div><div style="font-size:28px;font-weight:800;color:#9E0142;padding-top:2px;">16.1x</div><div style="font-size:12px;color:#6b6b6b;padding-top:2px;">bigger banks count for more</div></td></tr></table>
```

The sub-line states what the figure means in plain words. Never "the middle bank" or any label a reader has to decode.

## Group comparison cards (side by side, with an average)

Two cards, one per group the screener exposes. Each: bold title, one-line grey subtitle, header row (Bank, P/E, Week), up to five rows, then an "Average week" block in 24px bold.

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr>
<td width="50%" valign="top" style="padding-right:6px;"><table role="presentation" width="100%" height="100%" cellpadding="0" cellspacing="0" style="background:#f2ede4;border-radius:10px;font-size:12.5px;height:100%;">
<tr><td colspan="3" style="padding:12px 12px 0 12px;font-size:14px;font-weight:800;color:#1c1c1c;">Lowest multiples</td></tr>
<tr><td colspan="3" style="padding:2px 12px 8px 12px;font-size:11px;color:#6b6b6b;">State-owned and regional lenders</td></tr>
<tr style="color:#6b6b6b;font-weight:700;"><td style="padding:2px 12px;">Bank</td><td style="padding:2px 12px;text-align:right;">P/E</td><td style="padding:2px 12px;text-align:right;">Week</td></tr>
<tr><td style="padding:6px 12px;"><a href="https://sectors.app/idx/bjtm?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">BJTM</a></td><td style="padding:6px 12px;text-align:right;">2.9x</td><td style="padding:6px 12px;text-align:right;"><b style="color:#D53E50;">-2.0%</b></td></tr>
<!-- pad a shorter list with: <tr><td colspan="3" style="padding:6px 12px;font-size:12.5px;">&nbsp;</td></tr> -->
<tr><td colspan="3" valign="bottom" style="padding:10px 12px 14px 12px;text-align:center;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Average week</div><div style="font-size:24px;font-weight:800;color:#D53E50;padding-top:2px;">-5.4%</div></td></tr></table></td>
<td width="50%" valign="top" style="padding-left:6px;"><!-- same table, background:#fdecec, title "Highest multiples" --></td></tr></table>
```

Card backgrounds: `#f2ede4` for the lowest-multiple group, `#fdecec` for the highest. The caption beneath says the averages are simple, lists any member left out and why, and names any member that contradicts the pattern.

## Peer comparison card (one angle, three columns)

A company card (`#f2ede4`, radius 12) holding three stat tiles (last close, 7-day move, 52-week low), a small caps label "What you pay, what you get, how safe", then the table in a `#fdf7ee` panel. Header cells carry the plain question on the first line and the metric on a second grey line:

```html
<td style="padding:8px 10px;text-align:right;">Safety buffer<br><span style="font-weight:400;color:#6b6b6b;">Capital adequacy 2025</span></td>
```

The featured bank's row has `background:#fbe9d8`. Best value per column is bold. Pick the three columns from the angle of the story, never the full ratio set. The caption defines any term the plain-language header leaves implicit.

## Flow strip (seven monthly blocks per bank)

```html
<tr><td width="52" style="padding:8px 8px;border-bottom:1px solid #eee;font-size:13px;">TICKER LINK</td><td style="padding:8px 8px;border-bottom:1px solid #eee;"><table role="presentation" width="100%" cellpadding="0" cellspacing="2"><tr><td width="14%" style="background:#568475;height:12px;line-height:12px;font-size:0;border-radius:3px;">&nbsp;</td><!-- seven cells --></tr></table></td><td width="110" style="padding:8px 8px;border-bottom:1px solid #eee;font-size:12px;text-align:right;color:#333;"><b>7 net-buy months</b></td></tr>
```

Green `#568475` is a net-buy month, red `#D53E50` a net-sell month, grey `#d9d2c6` any other month. Never colour a month the data does not state. Place the strip inside the company card under a label, with a one-line legend beneath.

## Forecast tiles (realized beside forecast)

Three tiles in one row, `valign="middle"`: label, the earnings growth figure at 24px in green or red, then revenue growth at 13px bold. The realized year sits on `#fdecec`, the forecasts on `#f2ede4`.

## Takeaway block

Order: small caps eyebrow "Key takeaway", a claim heading, the "In plain terms" callout (the whole issue in two sentences a non-investor can repeat), then labelled paragraphs "If you follow the economy" and "If you invest", then the "What to watch" callout. Callout markup is the Key takeaway callout in `company-issue-components.md`. Do not close on a standalone "this is not a call" line, since the footer disclaimer carries it, and keep the prose itself free of any recommendation.
