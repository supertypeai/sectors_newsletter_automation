# Newsletter automation

Two workflows, in sequence. The PR merge between them is the only human gate.

```
Monday 07:00 WIB                    human reviews         on merge
draft-weekly-insights.yml ──> PR ─────> merge ──> send-on-merge.yml ──> mailroom
     drafts the issue      └─> [TEST] email                creates the campaign
                               to the reviewer
```

**Review the test email, not the PR diff.** The PR carries the issue for the record and
is the approval gate, but layout bugs only surface in a real client: a table that
collapses in Outlook, a blocked image, a subject that truncates in the inbox list. The
draft job emails a `[TEST]` copy so you review what subscribers will actually see.

That copy goes out transactionally via `POST /api/v1/emails`, so it can never reach the
subscriber list however the workflow is configured — the only recipient is
`MAILROOM_TEST_TO`. The tradeoff: transactional sends skip the campaign pipeline, so the
test has **no unsubscribe footer, no `List-Unsubscribe` header, and no preview text**.
Those are injected at real send time. Body, layout, images and subject are identical.

Nothing reaches subscribers from stage 1. Stage 2 creates the campaign with a
`schedule_at` a short way out rather than sending on the spot, so a mistake caught
right after merge can still be cancelled in the mailroom UI.

### One branch, reused every week

The PR branch is `newsletter/weekly-insights-v2`, fixed rather than per-run — this is
`create-pull-request`'s own default design, meant for exactly this: a scheduled job
that reuses one branch instead of accumulating a new one every week.

**That reuse has a real hazard if a week gets skipped.** If last week's PR is still
open when this week's cron fires, a plain push to the same branch would silently
*update that same PR*, replacing last week's still-unreviewed draft with this week's —
no conflict, no warning, the old content just isn't in git anymore. The **first step**
of the workflow guards against this: it checks for an open PR on the branch before
doing anything else (before spending any Claude usage or Sectors API credits) and
fails the run if one exists, with a link to the PR that needs attention.

In practice this means **the cron goes quiet if you fall behind on review** — no new
issue drafts until the pending one is merged or closed. That's the tradeoff for never
losing an unreviewed issue silently. `delete-branch: true` on the PR step cleans the
branch up once merged, so it doesn't linger.

## Required secrets

Repo settings → Secrets and variables → Actions → **Secrets**:

| Secret | Used by | What it is |
| --- | --- | --- |
| `CLAUDE_CODE_OAUTH_TOKEN` | draft | Runs Claude Code. Uses your **existing Claude subscription**, no separate API plan needed. See below |
| `SECTORS_API_KEY` | draft | Sectors market data. This is now the only source; no key ships in the repo |
| `MAILROOM_API_KEY` | draft + send | Mailroom API key, sent as `Authorization: Bearer`. The draft job needs it too, to host chart images |
| `NEWSLETTER_PAT` | draft | **Recommended.** PAT with `repo` + `workflow` scope for the PR push. `GITHUB_TOKEN` cannot push anything under `.github/workflows/`, and no `permissions:` key can grant it that |
| `STORING_API_KEY` | draft | **Optional.** Compresses chart PNGs through [Storing](https://storing.app) before upload. Leave unset and charts upload at full size. Generate from Storing's Settings page |

### Claude auth: subscription, not a second subscription

You do **not** need a pay-per-token API plan. If you already have Claude Pro, Max, Team,
or Enterprise, mint a one-year OAuth token against that subscription:

```bash
claude setup-token
```

It opens the normal browser approval flow and prints the token once, without saving it
anywhere. Copy it into the repo secret `CLAUDE_CODE_OAUTH_TOKEN`. This is the officially
documented path for "CI pipelines and scripts where browser login isn't available".

Worth knowing:

- The token is good for **one year**, then the job starts failing and you re-run
  `claude setup-token`. Put a calendar reminder on it.
- It can only make model requests. It **cannot** pull claude.ai connectors, so if you
  wire up Supabase for the foreign-flow figure it has to be a locally-configured MCP
  server (via `--mcp-config`), not a claude.ai connector.
- Automated runs draw on your subscription's usage limits like any other usage. One
  weekly issue is light, but a tight `/loop` or a retry storm is not.
- Don't set `ANTHROPIC_API_KEY` as well: it takes precedence over the OAuth token.
- Don't add `--bare` to the `claude` invocation; bare mode ignores this token.

To bill the API instead, set `ANTHROPIC_API_KEY` and swap the env line in
`draft-weekly-insights.yml` (it's commented there).

## Required variables

Same page → **Variables** (not secrets, these are not sensitive):

| Variable | Default | What it is |
| --- | --- | --- |
| `MAILROOM_FROM` | *(required)* | Sender address, used by both the test send and the campaign. Must be your configured SES address or a verified sender, or the API rejects with `invalid_from_address` |
| `MAILROOM_TEST_TO` | `aurellia@supertype.ai` | Where the `[TEST]` review copy goes. Set this to change reviewer |
| `MAILROOM_GROUP_ID` | *(unset → all contacts)* | Subscriber group to send to. **Leave unset only if you really mean every contact** |
| `MAILROOM_REPLY_TO` | *(unset)* | Optional reply-to |
| `MAILROOM_SCHEDULE_DELAY_MINUTES` | `60` | Cancellation window. `0` sends immediately |

## First run, safely

Do these in order before letting the cron fire:

1. **Draft only.** Run `draft-weekly-insights.yml` via *Run workflow*. Check the PR
   it opens: `newsletter.md`, `newsletter.html`, and a chart should be there, and the
   appendix should list which unattended defaults the run took. You should also get the
   `[TEST]` copy in your inbox — open it and confirm the chart image loads, since a
   broken upload shows up there and nowhere else.
2. **Dry-run the send.** Run `send-on-merge.yml` via *Run workflow* with the issue
   folder path and `dry_run: true`. It prints the payload and posts nothing.
3. **Send to yourself.** Point `MAILROOM_GROUP_ID` at a throwaway group containing
   only your own address, then merge the PR for real.
4. **Prove the idempotency key.** Re-run `send-on-merge.yml` on the same folder.
   Mailroom should not create a second campaign, because the key is
   `weekly-insights-v2_<issue-date>` and is stable across retries.
5. Only then point `MAILROOM_GROUP_ID` at the real subscriber group.

## What the drafting run assumes

`NEWSLETTER_UNATTENDED=1` tells the skill no human is reachable. It then takes a
documented default at every point it would normally ask; see **Running unattended**
in `sectors-newsletter-generator/SKILL.md` for the full table. The short version:
issue type defaults to `weekly-insights-v2`, foreign flow uses the exchange
definition, block 4 visuals are generated with `charts.mjs` rather than waiting on
social-card URLs, and a missing `samples/` folder is noted rather than fatal.

Two things still fail the run loudly, because the alternative is publishing something
false: a required block whose data comes back empty, and any figure that would have to
be invented to fill a gap.

### Foreign flow needs Supabase, not just the Sectors API

The weekly foreign-flow figure uses the **exchange** definition, which lives in the
`idx_daily_data` table and is pulled by the pinned query
`sectors-newsletter-generator/scripts/fixed-queries/foreign-flow-range.sql`. No Sectors
API endpoint exposes it: `daily/{symbol}` carries close/volume/market-cap only, and
`foreign-flow/{symbol}` returns the broker-domicile measure, which is forbidden for this
figure because the two disagree on direction, not just magnitude.

So the runner needs the **Supabase MCP connector** configured (read-only) for that line
to appear. Without it the skill omits the flow line and notes the omission; the issue is
otherwise complete, since flow is a single Key Data Bite rather than a required block.
Decide which you want before the first real send:

- **Skip it for now** — no extra secret; automated issues carry no flow figure.
- **Wire it up** — add the Supabase MCP server to the runner with a read-only,
  project-scoped credential, and the flow line works unattended.

### Charts become hosted PNGs at draft time

`charts.mjs` emits SVG, which cannot be emailed: Gmail and Outlook strip SVG, and both
block `data:` URIs in `<img src>`. So the draft job rasterizes each `chart-*.svg` to PNG
with Puppeteer, uploads it to `POST /api/v1/uploads`, and rewrites `newsletter.html` to point
at the returned `https://storage.googleapis.com/…` URL.

This happens in the **draft** job on purpose, so the PR you review contains the real
hosted image and the preview matches what subscribers receive. The job fails if any
inline `data:` URI survives the rewrite, rather than shipping an issue whose chart is
invisible to most of the list.

`POST /api/v1/uploads` is the API-key twin of the dashboard's session-authenticated
`/api/uploads`. It accepts PNG only, 1MB max, and returns a permanent public URL.

#### Optional compression

With `STORING_API_KEY` set, each PNG goes through the Storing CLI before upload.
Charts compress unusually well: flat fills and few distinct colours are exactly what
PNG quantisation handles best.

Two things are deliberate and shouldn't be "simplified" later:

- **`--format png` is forced, never `auto`.** Auto picks AVIF, which Gmail and Outlook
  don't render — the same failure the SVG-to-PNG step exists to prevent. Mailroom would
  reject it with a 422 anyway. PNG over JPEG too: these are flat-colour charts with fine
  text and hairline gridlines, which JPEG rings around. The upload is guarded by a PNG
  magic-byte check regardless.
- **Compression failure never fails the run.** An uncompressed chart is completely
  correct, just larger, so a Storing outage costs bytes rather than the issue.

⚠️ **The CLI exits 0 even when authentication fails** (verified 2026-07-27 — a bad key
prints `Authentication required` and still returns 0). Success is therefore judged by
what lands in the output directory, not the exit code. If a key is set but nothing
compresses, the run prints `Compressed 0/N chart(s)` plus a warning — that line is the
only signal that the key is wrong, so check it on the first run.

Tunable via variables: `STORING_PROFILE` (`conservative` / `balanced` / `aggressive`,
default `balanced`) and `STORING_MAX_SIZE` (e.g. `200KB`, unset by default).

## Known gaps
- **Social cards can't be fetched unattended.** The Supabase bucket needs a credential
  to list. CI generates charts instead. To get real cards into automated runs, have the
  carousel pipeline write a `manifest_<YYYYMMDD>.json` to the same public bucket; see
  `references/workflows/weekly-insights-v2.md` §3.
- **The old key is still in git history.** `config.json` is untracked as of this
  change, but earlier commits still contain the key. The repo is private, so it was
  never publicly exposed, and rewriting history is not worth it for a private repo.
  Rotate the key if the repo is ever made public or shared outside the team.
