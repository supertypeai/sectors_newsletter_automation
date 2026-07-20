## Upcoming events closing block: data source

Every issue except `upcoming-event` itself ends with a small closing promo block
for Sectors workshops, sourced live from one shared Google Sheet. This is
not user-supplied per run, it is fetched fresh every time. See
`newsletter-format.md`'s **Upcoming events closing block** section for where it
goes and how it's formatted; this doc is only the data-fetch recipe.

### Fetch

```bash
curl -sL "https://docs.google.com/spreadsheets/d/1zC3bLnW_IDN7X4iznoY1hFkBomFEhzpUSrh5grAxbjk/export?format=csv&gid=0"
```

Public sheet, no auth needed, `curl` alone resolves it (no WebFetch summarization,
the `details` column is JSON and must come back verbatim, character for character).
If `curl` ever gets blocked, `WebFetch` on the same URL works too, it 307-redirects
to a `googleusercontent.com` signed URL, follow that redirect once.

Sheet URL for reference (edit view, not the fetch URL):
`https://docs.google.com/spreadsheets/d/1zC3bLnW_IDN7X4iznoY1hFkBomFEhzpUSrh5grAxbjk/edit?gid=0#gid=0`

### Columns (fixed schema, don't rename or reorder when reading)

| Column | Type | Use |
| --- | --- | --- |
| `eventUrl` | URL | the Register button's `href` |
| `posterUrl` | URL | banner image `src`, hotlinked, never downloaded/copied into the delivered folder |
| `title` | text | event title |
| `description` | text | one paragraph |
| `details` | JSON array string | `[{"key": "...", "value": "..."}, ...]`, render as a definition list, in the array's given order, key text as-is (don't retitle "Medium" to "Format" or similar) |

`details` rows vary per event (a Zoom event has Medium/Language, an in-person one
has Venue/Language, dates are always present as `key: "Date"`), print whatever
keys that event actually has, don't force a fixed key set.

### Selecting which events to feature (revised 2026-07-20, supersedes the original nearest-only rule)

**Every row still in the future relative to this issue's send/data-as-of date**, not
just the nearest one, one card per event, ordered soonest first. Parse each row's
`Date` value out of `details`, compare to the issue date, drop anything already past,
keep everything that's left, sorted ascending. If a row's date range is ambiguous
("27th and 28th July, 2026"), use the first date in the range for comparison. If every
row in the sheet is already in the past relative to the issue date, drop the closing
block entirely for that run rather than featuring a stale event, and say so in the
self-review pass.

### Snapshot (2026-07-20, illustrative only, always refetch)

Two rows as of this writing: an n8n/Sectors API automation workshop (27-28 Jul
2026, online, Zoom) and a Hermes Agent x Sectors community meetup (1 Aug 2026,
in-person, Jakarta). Don't hardcode these into a template, the sheet is the
source of truth and gets new rows over time.
