# HTML components for monthly-market-pulse

Exact markup from the reference issue `newsletter_2026-11-01_monthly-market-pulse` (also
`samples/monthly-market-pulse/`). Copy these, change only text, numbers and `{UTM}`. Shares the
page shell, divider, data table, chart and CTA from `company-issue-components.md`. Every block
sits in its own `<tr><td style="padding:22px 32px 0 32px;">`; event and closer-look cards use
`padding:12px 32px 0 32px` so they stack tightly.

## Stat tiles on a shaded card

Placed under At a Glance. The context line is optional only on closer-look cards.

```html
<div style="background:#f2ede4;border-radius:12px;padding:6px 10px 8px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="6"><tr><td width="25%" valign="top" style="padding:10px 6px;text-align:center;background:#fdf7ee;border-radius:8px;"><div style="font-size:11px;line-height:1.3;color:#6b6b6b;text-transform:uppercase;letter-spacing:0.04em;">IDX market cap</div><div style="font-size:16px;font-weight:800;color:#1c1c1c;padding-top:3px;white-space:nowrap;"><b style="color:#D53E50;">-16.66%</b></div><div style="font-size:11.5px;line-height:1.3;color:#333;padding-top:3px;">IDR 8,963.49T</div></td> ... </tr></table></div>
```

## At a Glance

The deep dive's box, from `company-issue-components.md`, background `#fbe9d8`, bold lead-ins,
gains and losses coloured, last bullet **Open Question**.

## Event card with conclusion callout

The callout has no label. Its first sentence is bold and is the conclusion. The rest is regular weight.

```html
<div style="background:#f2ede4;border-radius:12px;padding:16px 20px 18px 20px;"><div style="font-size:11px;font-weight:800;color:#9E0142;text-transform:uppercase;letter-spacing:0.06em;">16 October</div><div style="font-size:15px;font-weight:800;color:#1c1c1c;padding-top:3px;">Plain event title</div><p style="font-size:14px;line-height:1.55;color:#333;margin:8px 0 0 0;">What happened.</p><div style="margin-top:12px;border-left:4px solid #9E0142;background:#fbe9d8;padding:12px 16px;"><div style="font-size:14px;line-height:1.5;color:#1c1c1c;"><b>The conclusion in one sentence.</b> The stocks and numbers behind it.</div></div></div>
```

## Two-column gainers and losers, or buyers and sellers

Left and right tables in one wrapper. Ticker or broker code sits above an 11px company name.
Movers take Ticker, Close, 30d. Brokers take Broker, 30d net. Header `#e6f4ea` on the gain side
and `#fbe7e7` on the loss side, the last row has no bottom border.

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr><td width="50%" valign="top" style="padding-right:7px;"><div style="font-size:13px;font-weight:700;color:#568475;padding:0 0 6px 0;">Gainers</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:12px;border-collapse:collapse;"><tr style="background:#e6f4ea;font-weight:700;"><td style="padding:6px;white-space:nowrap;">Ticker</td><td align="right" style="padding:6px;white-space:nowrap;">Close</td><td align="right" style="padding:6px;white-space:nowrap;">30d</td></tr><tr><td valign="top" style="padding:7px 6px;border-bottom:1px solid #eee;"><a href="https://sectors.app/idx/bswd?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">BSWD</a><div style="font-size:11px;line-height:1.3;color:#6b6b6b;padding-top:1px;">Bank of India Indonesia</div></td><td valign="top" align="right" style="padding:7px 6px;border-bottom:1px solid #eee;">8,075</td><td valign="top" align="right" style="padding:7px 6px;border-bottom:1px solid #eee;color:#568475;font-weight:700;white-space:nowrap;">+249.57%</td></tr></table></td><td width="50%" valign="top" style="padding-left:7px;"> ...same, Losers, #D53E50, #fbe7e7... </td></tr></table>
```

## Before, during and after chart

A 15px bold title, the chart image plus caption from `company-issue-components.md`, width 536
and height 321, then one line of copy. Built with `eventLines` in `scripts/charts.mjs`.

## Closer-look card

Three tiles (30d price, Net foreign, P/E) with `width="33%"`, using the tile markup above, then
the reason, then a closing action under a thin rule. No label and no box on the closing line,
and each card's action differs. Heading is `Company Name` followed by the linked ticker.

```html
<div style="background:#f2ede4;border-radius:12px;padding:16px 20px 18px 20px;"><div style="font-size:15px;font-weight:800;color:#1c1c1c;">Bank Central Asia <a href="https://sectors.app/idx/bbca?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">BBCA</a></div> ...tiles... <p style="font-size:14px;line-height:1.55;color:#333;margin:10px 0 0 0;">Why it stands out.</p><p style="font-size:14px;line-height:1.55;color:#1c1c1c;margin:12px 0 0 0;border-top:1px solid #e4cdb4;padding-top:10px;"><a href="https://sectors.app/idx/bbca?{UTM}" style="color:#9E0142;font-weight:700;text-decoration:none;">The action as a link</a> and why it helps.</p></div>
```

## Bull and bear panels

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;"><tr><td width="50%" valign="top" style="padding-right:6px;"><div style="background:#e6f4ea;border-radius:10px;padding:12px 14px;"><div style="font-size:13px;font-weight:800;color:#568475;">The bull read</div><ul style="font-size:13.5px;line-height:1.5;color:#333;margin:6px 0 0 0;padding-left:18px;"><li style="margin-bottom:6px;">Point.</li></ul></div></td><td width="50%" valign="top" style="padding-left:6px;"><div style="background:#fbe7e7;border-radius:10px;padding:12px 14px;"><div style="font-size:13px;font-weight:800;color:#D53E50;">The bear read</div><ul style="font-size:13.5px;line-height:1.5;color:#333;margin:6px 0 0 0;padding-left:18px;"><li style="margin-bottom:6px;">Point.</li></ul></div></td></tr></table>
```
