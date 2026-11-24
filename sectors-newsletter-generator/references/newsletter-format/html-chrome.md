# HTML chrome, copy verbatim

The shared email markup every issue uses, taken from delivered issues so this skill does not
depend on any file outside it. Fill only the `{{placeholders}}`. Inline styles, widths,
colors and order never change. Type-specific blocks (tiles, cards, charts, tables) come from
`company-issue-components.md`, `monthly-pulse-components.md` or
`sector-spotlight-components.md`.

Output is a fragment, not a full document: a `<!-- -->` comment line naming the issue, then the
outer `<div>`. No `<html>`, `<head>` or `<body>`.

## Header title by type

| `issue_type` | `{{header_title}}` |
|---|---|
| weekly-insights-v2 | copy from the previous weekly issue's `newsletter.html` |
| monthly-market-pulse | Sectors Monthly Market Pulse |
| three-stock-story | Sectors Three Stock Story |
| single-company-deep-dive | Sectors Company Deep Dive |
| sector-spotlight | Sectors Sector Spotlight |

First line of the file, then the shell:

```html
<!-- {{header_title}}. Issue {{issue_date_long}}, data as of {{data_as_of_long}}. All figures from sectors.app unless cited. -->
```

## Page shell and header row

```html
<div style="margin:0;padding:0;background:#f2ede4;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2ede4;padding:24px 0;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#fdf7ee;border-radius:14px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1c1c1c;">
<tr><td style="padding:28px 32px 8px 32px;border-bottom:2px solid #1c1c1c;">
<table role="presentation" width="100%"><tr>
<td style="font-size:24px;font-weight:800;color:#1c1c1c;">{{header_title}}</td>
<td align="right" width="110"><img src="https://storage.googleapis.com/sectorsapp-sea/app_assets/sectors_logo_wide.png" alt="Sectors" width="110" height="29" style="display:block;width:110px;height:auto;"></td>
</tr></table>
<div style="font-size:13px;color:#6b6b6b;padding-top:4px;">{{issue_date_long}} &nbsp;|&nbsp; data as of {{data_as_of_long}}</div>
</td></tr>
```

## Upcoming Events (only when the sheet has an upcoming event)

After the CTA, before Sources. One card per still-upcoming row under one shared heading. The
`<tr><td>` wrapper and heading appear once; repeat the card `<table>` per event.

```html
  <tr><td style="padding:22px 32px 0 32px;">
    <div style="font-size:17px;font-weight:800;color:#1c1c1c;padding-bottom:10px;">Upcoming Events</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbe9d8;border-radius:10px;overflow:hidden;"><tr><td>
      <img src="{{posterUrl}}" alt="{{title}}" width="536" style="display:block;width:100%;max-width:536px;height:auto;">
      <div style="padding:16px 18px 0 18px;font-size:15px;font-weight:800;color:#1c1c1c;">{{title}}</div>
      <p style="padding:0 18px;font-size:13px;line-height:1.6;color:#333;margin:8px 0 0 0;">{{description}}</p>
      <div style="padding:10px 18px 0 18px;font-size:12.5px;line-height:1.8;color:#6b6b6b;">
 <b>{{details[0].key}}:</b> {{details[0].value}}<br>
 <b>{{details[1].key}}:</b> {{details[1].value}}<br>
 ...one line per entry, in the sheet's own order and wording
      </div>
      <div style="padding:16px 18px 18px 18px;"><a href="{{eventUrl}}" style="display:inline-block;background:#9E0142;color:#ffffff;font-size:13px;font-weight:800;text-decoration:none;padding:11px 26px;border-radius:8px;">Register here</a></div>
    </td></tr></table>
  </td></tr>
```

## Sources

```html
  <tr><td style="padding:22px 32px 0 32px;">
    <div style="font-size:13px;font-weight:800;color:#1c1c1c;padding-bottom:6px;">Sources</div>
    <p style="font-size:12px;line-height:1.7;color:#6b6b6b;margin:0;">
      <a href="{{url}}" style="color:#9E0142;">{{article title}}</a>: {{Outlet}}, {{DD Mon YYYY}}<br>
      ...one line per source that carried a fact
      {{description of a filing set}}: <a href="https://sectors.app/idx/{{ticker lower}}?utm_source=newsletter&utm_medium=email&utm_campaign={{campaign}}&utm_content=sources&utm_term={{ticker lower}}" style="color:#9E0142;font-weight:700;text-decoration:none;">{{TICKER}}</a>, ...
    </p>
  </td></tr>
```

## Appendix

```html
  <tr><td style="padding:22px 32px 0 32px;">
    <div style="font-size:13px;font-weight:800;color:#1c1c1c;padding-bottom:6px;">Appendix: Sectors API endpoints (fields used)</div>
    <p style="font-size:12px;line-height:1.7;color:#6b6b6b;margin:0;">
      <code style="background:#f2ede4;padding:1px 4px;border-radius:3px;">{{endpoint}}</code>: <code style="background:#f2ede4;padding:1px 4px;border-radius:3px;">{{field.path}}</code>, <code style="background:#f2ede4;padding:1px 4px;border-radius:3px;">{{field.path}}</code><br>
 ...one line per endpoint actually used; escape &gt; and &amp; inside code
    </p>
  </td></tr>
```

## Disclaimer footer and closing tags

```html

  <tr><td style="padding:20px 32px 30px 32px;">
    <div style="border-top:1px solid #e4cdb4;padding-top:14px;font-size:11.5px;line-height:1.6;color:#8a8a8a;">
      This newsletter is data reporting and market commentary, not investment advice or a recommendation to buy or sell any security. Figures are from <a href="https://sectors.app?utm_source=newsletter&utm_medium=email&utm_campaign={{campaign}}&utm_content=footer" style="color:#9E0142;">sectors.app</a> as of {{data_as_of_long}} unless otherwise cited. Do your own research.<br><br>
 Sectors &nbsp;|&nbsp; <a href="https://sectors.app?utm_source=newsletter&utm_medium=email&utm_campaign={{campaign}}&utm_content=footer" style="color:#9E0142;text-decoration:underline;">sectors.app</a> &nbsp;|&nbsp; <a href="https://www.instagram.com/sectorsapp" style="color:#9E0142;text-decoration:underline;">@sectorsapp</a>
    </div>
  </td></tr>
</table>
</td></tr>
</table>
</div>

```
