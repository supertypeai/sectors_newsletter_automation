# sectors_newsletter_skills

Claude skills for Sectors content: newsletters, Instagram carousels, and market videos.

| Skill | What it makes |
| --- | --- |
| `sectors-newsletter-generator` | Data-backed IDX newsletter issues (Markdown + send-ready HTML) |
| `sectors-newsletter-dbquery` | Lifecycle/CRM email off user-account data |
| `sectors-carousel` | Instagram carousel decks |
| `market-story-video` | Remotion market-story videos |

## Setup

Every skill that touches live market data reads one environment variable:

```bash
export SECTORS_API_KEY=<your key>
```

Put that in your shell profile (`~/.zshrc` or `~/.bashrc`) so it's always set.
**No API key ships in this repo.** If you'd rather keep it in a file than the
environment, copy `<skill>/config.example.json` to `<skill>/config.json` and fill in
`sectorsApiKey`; that path is gitignored and the env var takes precedence over it.

Verify with:

```bash
node sectors-newsletter-generator/scripts/sectors.mjs "idx-total/?start=2026-07-01&end=2026-07-02"
```

`sectors-carousel` and `market-story-video` each need `npm install` in their own
folder as well; see their `SKILL.md` files. The two newsletter skills need only `node`.

## Automation

`sectors-newsletter-generator` runs unattended on a schedule to draft the weekly
issue, open a review PR, and push to mailroom on merge. See
[`.github/README.md`](.github/README.md).
