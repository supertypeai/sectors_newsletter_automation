# HTML components for company issues (three-stock-story and single-company-deep-dive)

Exact markup copied from the two reference issues, `newsletter_2026-10-15_three-stock-story`
and `newsletter_2026-10-14_single-company-deep-dive`. Copy these, change only the text, the
numbers and the `{UTM}` string. Do not re-derive spacing, radii or colours: the point of this
file is that every issue of these two types looks the same.

`{UTM}` stands for the full tracking string described in `../newsletter-format.md`
(`utm_source=newsletter&utm_medium=email&utm_campaign=<type>_<date>&utm_content=<section>&utm_term=<ticker>`).

**Page shell.** Outer table `#f2ede4` page ground, inner 600px table `#fdf7ee`, radius 14px,
`-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif`. Header row: title left at 24px
weight 800 (`Sectors Three Stock Story`, `Sectors Company Deep Dive`), wide Sectors wordmark
right, date line `15 October 2026 | data as of 14 October 2026` below at 13px `#6b6b6b`,
2px `#1c1c1c` rule underneath. Every content block is its own `<tr><td style="padding:22px 32px 0 32px;">`.
Body text 14px, line-height 1.55, `#333`. Section headings 17px weight 800 `#1c1c1c`.
Captions 12px italic `#6b6b6b`. Gains `#568475` and losses `#D53E50`, bold, on numeric readings only.
Ticker links `#9E0142` bold, no underline. Chart `<img>` tags point at the PNG, never the SVG.

## Section divider (own row, between major sections)

```html
<tr><td style="padding:22px 32px 0 32px;"><div style="border-top:3px solid #9E0142;width:120px;margin:0 auto;"></div></td></tr>
```

## Company card with three stat tiles (three-stock-story variant; the deep dive variant adds the 90 day price chart inside the same card and uses `padding:18px 20px 20px 20px`)

```html
<div style="background:#f2ede4;border-radius:12px;padding:16px 20px 12px 20px;"><div style="font-size:15px;font-weight:800;color:#1c1c1c;">PT Bayan Resources Tbk <a href="https://sectors.app/idx/byan?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">BYAN</a></div><table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="margin-top:12px;"><tr><td width="33%" style="padding:10px 8px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Last close</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;">IDR 11,300</div></td><td width="33%" style="padding:10px 8px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Vs 52-week high</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;"><b style="color:#D53E50;">-39.4%</b></div></td><td width="33%" style="padding:10px 8px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Market cap</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;">IDR 376.67T</div></td></tr></table></div></div>
```

## Dated timeline (one row per dated event; left cell is the date, right cell the event)

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr><td width="82" valign="top" style="padding:0 12px 14px 0;font-size:12px;font-weight:800;color:#9E0142;line-height:1.55;text-align:right;">1972</td><td valign="top" style="border-left:2px solid #e4cdb4;padding:0 0 14px 16px;font-size:14px;line-height:1.55;color:#333;">Born in Singapore in 1948, he moves to Indonesia.</td></tr></table>
```

## Key takeaway callout (closes each per-company block)

```html
<div style="margin-top:16px;border-left:4px solid #9E0142;background:#fbe9d8;padding:14px 18px;"><div style="font-size:11px;font-weight:800;color:#9E0142;text-transform:uppercase;letter-spacing:0.06em;">Key takeaway</div><div style="font-size:14px;font-weight:700;line-height:1.5;color:#1c1c1c;padding-top:4px;">The IDR 5.60B purchase is 0.02% of the IDR 26.05T sale and changes nothing. What matters is the 32.00% the Low family still holds against Jhonlin's 30.25%, and a net margin that has halved on flat revenue.</div></div>
```

## Labelled paragraph pair (small caps label, then body)

```html
<div style="font-size:11px;font-weight:800;color:#9E0142;text-transform:uppercase;letter-spacing:0.06em;padding-top:16px;">What it can signal</div>
    <p style="font-size:14px;line-height:1.55;color:#333;margin:8px 0 0 0;">These holders know the contracts and the pipeline better than any analyst, so a purchase puts their own money behind a view of value. A repeated pattern says more than one trade, since a single purchase can also be about tidying a stake or defending a voting threshold.</p>
```

## Pull quote (single bold sentence, no label)

```html
<div style="margin-top:16px;border-left:4px solid #9E0142;background:#fbe9d8;padding:14px 18px;"><div style="font-size:15px;font-weight:800;line-height:1.45;color:#1c1c1c;">A filing shows what an insider did. The share price still follows earnings, commodity prices and the wider market.</div></div>
```

## Filing summary card inside the shaded At a Glance box (three-stock-story)

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:6px 0 0 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf7ee;border-radius:10px;"><tr><td style="padding:12px 16px 12px 16px;"><div style="font-size:15px;font-weight:800;color:#1c1c1c;"><a href="https://sectors.app/idx/byan?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">BYAN</a> <span style="font-weight:600;color:#6b6b6b;font-size:13px;">Bayan Resources</span></div><div style="font-size:13.5px;line-height:1.55;color:#333;padding-top:5px;">Low Tuck Kwong sold 30.25% of Bayan to Haji Isam's Jhonlin on 7 October at IDR 2,588 a share, about 79% below the market. Six days later he filed a purchase of 500,000 shares at IDR 11,200, worth 0.02% of the sale.</div> ...
```

## Data table (header row `#fbe9d8`, last row has no bottom border)

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:13px;border-collapse:collapse;"><tr style="background:#fbe9d8;color:#1c1c1c;font-weight:700;"><td style="padding:8px 12px;">Year</td><td style="padding:8px 12px;">Revenue</td><td style="padding:8px 12px;">Change</td><td style="padding:8px 12px;">Net profit</td><td style="padding:8px 12px;">Net margin</td></tr><tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">2022</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">IDR 73.34T</td><td style="padding:8px 12px;border-bottom:1px solid #eee;"><b style="color:#568475;">+80.1%</b></td><td style="padding:8px 12px;border-bottom:1px solid #eee;">IDR 33.97T</td><td style="padding:8px 12px;border-bottom:1px solid #eee;">46.3%</td></tr> ...
```

## Chart image plus caption

```html
<div style="padding:4px 0 0 0;"><img src="chart-byan-ownership.png" width="536" height="99" alt="Bayan ownership before and after the 7 October sale: Low Tuck Kwong from 40.15% to 9.95%, Elaine Low 22.10% to 22.05%, Jhonlin Baratama from none to 30.25%, others and public unchanged at 37.75%" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;"></div><p style="font-size:12px;font-style:italic;line-height:1.5;color:#6b6b6b;margin:6px 0 0 0;">The Low family still holds 32.00% against Jhonlin's 30.25%.</p>
```

## CTA card

```html
<div style="background:#fbe9d8;border-radius:10px;padding:18px 20px;text-align:center;">
      <div style="font-size:17px;font-weight:800;color:#1c1c1c;">Follow <a href="https://sectors.app/idx/byan?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">BYAN</a>, <a href="https://sectors.app/idx/mapi?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">MAPI</a> and <a href="https://sectors.app/idx/srtg?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">SRTG</a> on Your Watchlist</div>
      <p style="font-size:14px;line-height:1.55;color:#333;margin:8px 0 14px 0;">Add them to a <a href="https://sectors.app/watchlist?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">watchlist</a> on sectors.app to see new insider filings and results as they come in.</p>
      <a href="https://sectors.app/watchlist?{UTM}" style="display:inline-block;background:#9E0142;color:#ffffff;font-size:14px;font-weight:800;text-decoration:none;padding:12px 28px;border-radius:8px;">Build your watchlist</a></div>
```

## At a Glance box with bold lead-in bullets (deep dive)

```html
<div style="background:#fbe9d8;border-radius:12px;padding:16px 20px 18px 20px;">
      <div style="font-size:15px;font-weight:800;color:#1c1c1c;">At a Glance</div>
      <ul style="font-size:14px;line-height:1.5;color:#333;margin:8px 0 0 0;padding-left:20px;">
        <li style="margin:7px 0 0 0;"><b>Operating Cash Flow:</b> <b style="color:#D53E50;">-IDR 160.78B</b> in Q2 against <b style="color:#568475;">+IDR 2.11T</b> a year earlier, the only negative quarter of the last five.</li> ...
```

## Headline with inline company logo (deep dive)

```html
<div style="font-size:21px;font-weight:800;color:#1c1c1c;line-height:1.3;"><img src="logo-smar.png" width="32" height="32" alt="Company logo" style="display:inline-block;vertical-align:middle;width:32px;height:32px;border-radius:6px;margin-right:10px;"><a href="https://sectors.app/idx/smar?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">SMAR</a> Margins Doubled, but Operating Cash Flow Turned Negative</div>
```

## Company card with stat tiles and price chart (deep dive)

```html
<div style="background:#f2ede4;border-radius:12px;padding:18px 20px 20px 20px;">
      <div style="font-size:17px;font-weight:800;color:#1c1c1c;">PT Sinar Mas Agro Resources and Technology Tbk (<a href="https://sectors.app/idx/smar?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">SMAR</a>)</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="6" style="margin-top:12px;"><tr><td width="33%" style="padding:10px 8px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Last close</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;">IDR 8,075</div></td><td width="33%" style="padding:10px 8px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Market cap</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;">IDR 23.19T</div></td><td width="33%" style="padding:10px 8px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">Market cap rank</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;">88th</div></td></tr></table>
      <div style="padding:10px 0 4px 0;"><img src="chart-smar-price.png" width="536" height="126" alt="Share price rising from IDR 4,880 on 8 July 2026 to IDR 8,075 on 13 October, up 65.5%, after a peak of IDR 9,000 on 5 October" style="display:block;width:100%;max-width:536px;height:auto;border-radius:8px;"></div>...
```

## What to Watch Next list item

```html
<div ...>What to Watch Next</div>
    <ul style="font-size:14px;line-height:1.5;color:#333;margin:6px 0 0 0;padding-left:20px;">
      <li style="margin:8px 0 0 0;"><b>Third quarter 2026 results.</b> This is the first quarter to include B50. Gross margin holding above the 17.3% of Q2, and operating cash flow returning above zero after Q2's negative IDR 160.78B, are the two readings to track.</li> ...
```

