# Newsletter automation

One workflow. There is no merge-triggered second stage anymore — reviewing and, if
needed, stopping an issue both happen in mailroom directly, before it sends.

`draft-weekly-insights.yml` runs Monday 01:00 WIB and, in one run:

1. emails a `[TEST]` copy to the reviewer
2. creates the real campaign in mailroom, `scheduled_at` 10:00 WIB that same day
3. commits the issue folder straight to `main` — a git record of what was sent, not a
   review gate

If nobody does anything, step 2 fires at 10:00 WIB. To stop or change it, cancel or
reschedule the campaign from mailroom's Review page before then.

**Review the test email, not a diff.** Layout bugs only surface in a real client: a
table that collapses in Outlook, a blocked image, a subject that truncates in the inbox
list. The draft job emails a `[TEST]` copy so you review what subscribers will actually
see.

That copy goes out transactionally via `POST /api/v1/emails`, so it can never reach the
subscriber list however the workflow is configured — the only recipient is
`MAILROOM_TEST_TO`. The tradeoff: transactional sends skip the campaign pipeline, so the
test has **no unsubscribe footer, no `List-Unsubscribe` header, and no preview text**.
Those are injected at real send time. Body, layout, images and subject are identical.

**If you do nothing, the issue ships.** The same run that emails the test copy also
creates the real mailroom campaign, `scheduled_at` 10am WIB that same day — roughly nine
hours after the 1am WIB draft, which is the actual review window now, not a merge click.
To stop or change it, open the campaign's Review page in mailroom before 10am and cancel
or reschedule it there. Step 3's commit to `main` is just a record; there's nothing to
merge or review there — it happens automatically either way.

Need to re-push a specific issue by hand (a failed automated push, or recreating a
campaign after cancelling it)? Run `push-to-mailroom.yml` (`workflow_dispatch` only,
`issue_folder` required) — that's the entire remaining purpose of what used to be
`send-on-merge.yml`.

## Required secrets

Repo settings → Secrets and variables → Actions → **Secrets**:

| Secret | Used by | What it is |
| --- | --- | --- |
| `CLAUDE_CODE_OAUTH_TOKEN` | draft | Runs Claude Code. Uses your **existing Claude subscription**, no separate API plan needed. See below |
| `SECTORS_API_KEY` | draft | Sectors market data. This is now the only source; no key ships in the repo |
| `MAILROOM_API_KEY` | draft, `push-to-mailroom.yml` | Mailroom API key, sent as `Authorization: Bearer`. The draft job uses it three times now: hosting chart images, sending the `[TEST]` copy, and creating the scheduled campaign itself. `push-to-mailroom.yml` needs it too, for manual re-pushes |
| `NEWSLETTER_PAT` | draft | **Optional.** PAT with `repo` scope, used for the final commit-to-main push instead of `GITHUB_TOKEN`. Only matters if branch protection on `main` requires it; the default token is otherwise sufficient since this commit only ever touches `newsletter/` |
| `STORING_API_KEY` | draft | **Optional.** Compresses chart PNGs through [Storing](https://storing.app) before upload. Leave unset and charts upload at full size. Generate from Storing's Settings page |
| `SUPABASE_ACCESS_TOKEN` | draft | **Optional.** Enables the exchange-definition foreign-flow figure via the Supabase MCP connector. Leave unset and the run falls back to an omitted flow figure, exactly as documented in SKILL.md. Block 4's social-card auto-selection needs no credential at all (it lists our own GCP bucket over plain HTTP) — this token no longer affects it. See **Supabase MCP setup** below before generating one |
| `GEMINI_API_KEY` | draft | **Optional.** Runs the humanizing pass over `newsletter.html` before the `[TEST]` email. Leave all three humanizing keys unset and the step is skipped, shipping Claude's prose as written. Generate at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). See **Humanizing** below |
| `OPENAI_API_KEY` | draft | **Optional.** Only used by the humanizing step, and only when the model chain names a `gpt-*` / `o*` model |
| `ANTHROPIC_API_KEY` | draft | **Optional.** Only used by the humanizing step, and only when the chain names a `claude-*` model. Exposed to that step alone, never at job level — a job-level `ANTHROPIC_API_KEY` would outrank `CLAUDE_CODE_OAUTH_TOKEN` and move drafting onto pay-per-token billing |

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
| `MAILROOM_SCHEDULE_TIME_WIB` | `10:00` | Wall-clock time in `Asia/Jakarta` the **draft** job schedules each issue for — the next future occurrence of this time on the day it runs. This is the actual review window now (draft time to this time), not a merge click. Only affects the automated draft job — see below for the manual tool |
| `MAILROOM_SCHEDULE_DELAY_MINUTES` | `60` | Fallback used only when scheduling by relative delay rather than a fixed WIB time — currently only reachable via `push-to-mailroom.yml`'s `schedule_time_wib` input left blank (see below). `0` sends immediately |
| `HUMANIZE_MODELS` | `gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash` | Comma-separated fallback chain for the humanizing pass, tried left to right on a 429, 5xx, malformed reply, or missing key. Providers may be mixed — the provider is inferred from the model id (`gemini-*`, `gpt-*`/`o*`, `claude-*`), e.g. `claude-opus-5,gpt-5.6,gemini-3.7-flash`. Change this to switch models without touching code |

## First run, safely

The draft job now creates a real scheduled campaign as part of its own run — there's no
separate dry-run gate before that happens the way `send-on-merge.yml`'s `dry_run: true`
used to provide. Do these in order before letting the cron fire:

1. **Point at a throwaway group first.** Set `MAILROOM_GROUP_ID` to a group containing
   only your own address, before running anything for real below.
2. **Test the plumbing with no campaign created.** Run `draft-weekly-insights.yml` via
   *Run workflow* with `skip_draft: true`. This exercises rasterize/upload/commit/test-email
   against a fixture issue and creates no campaign at all — the push step is skipped
   under `skip_draft`, and push-to-mailroom.mjs also refuses any `[FIXTURE]`-subject
   issue outright as a backstop.
3. **Run it for real, still scoped to the throwaway group.** Run
   `draft-weekly-insights.yml` normally (`skip_draft: false`). Check the commit on
   `main`: `newsletter.md`, `newsletter.html`, and a chart should be there, and a
   `run-notes.md` should list which unattended defaults the run took (a separate file,
   never sent — not an appendix in the issue itself). You should also get the `[TEST]`
   copy in your inbox — open it and confirm the chart image loads, since a broken upload
   shows up there and nowhere else. Then check mailroom's Review page: the campaign
   should show `scheduled`, 10am WIB today, and the throwaway group as its audience.
4. **Prove the idempotency key.** Run `push-to-mailroom.yml` manually against that same
   issue folder. Mailroom should not create a second campaign, because the key is
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

### Foreign flow needs Supabase; block 4's social cards no longer do

The weekly **foreign-flow figure** uses the exchange definition, which lives in the
`idx_daily_data` table and is pulled by the pinned query
`scripts/fixed-queries/foreign-flow-range.sql`. No Sectors API endpoint exposes it:
`daily/{symbol}` carries close/volume/market-cap only, and `foreign-flow/{symbol}`
returns the broker-domicile measure, forbidden for this figure since the two disagree
on direction, not just magnitude. This one genuinely needs the Supabase MCP connector;
without it, the skill degrades gracefully rather than failing — the foreign-flow line
is omitted and noted.

Block 4's **visuals** default to a real social card over a generated chart whenever one
is eligible — but this now lists our own GCP bucket (`sectorsapp-sea`) directly over
plain public HTTP (see `references/workflows/weekly-insights-v2.md`'s "Where the
filenames come from"), not Supabase's storage table. **No credential, no MCP connector,
and no setup needed for this one** (changed 2026-08-24 — was through the Supabase MCP
connector, same as foreign flow; the carousel pipeline's Supabase bucket still exists
but the skill no longer reads it).

#### Supabase MCP setup

1. Generate a Personal Access Token at
   [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
   **This token is account-wide**, not scoped to one project — Supabase's own docs warn
   against connecting it to production data for exactly that reason. It's your call
   whether that risk is acceptable for this project; a narrower read-only Postgres role
   scoped to just `idx_daily_data` (all this token is used for now that social cards
   list our own GCP bucket instead) is the safer alternative if not (ask if you want
   that path instead, it needs a different wiring).
2. Add it as the repo secret `SUPABASE_ACCESS_TOKEN`.
3. That's it — the workflow does the rest. It writes a temporary MCP config to the
   runner's own temp directory (never committed, gone when the job ends) pointing at
   `https://mcp.supabase.com/mcp?project_ref=rfiycxgjbnkefczvbosm&read_only=true`, and
   passes it to Claude via `--mcp-config` for that run only.

**The token itself never goes in a file you'd commit.** A project-scoped `.mcp.json` at
the repo root is git-tracked by design (so teammates share the same server config) —
that's exactly why this workflow generates its own config at runtime instead of using
one, and why you should never paste a real token into a committed `.mcp.json` yourself.

### Dry runs

Every draft workflow takes a `dry_run` input. It keeps the expensive, real parts — live
Sectors data, a real Claude draft, a real humanizing pass — and skips everything that
leaves the runner:

| Step | `dry_run` |
| --- | --- |
| Draft the issue (Claude + Sectors) | runs |
| Humanize the prose (Gemini) | runs |
| Host charts on mailroom | skipped |
| `[TEST]` email to the reviewer | skipped |
| Create the scheduled campaign | skipped |
| Commit to `main` | skipped, uploaded as an artifact instead |

The issue lands as a `dryrun-<type>-<date>` artifact on the run page, kept 14 days.
Charts stay as local SVGs since nothing was uploaded, so open the HTML expecting missing
images; the prose, figures and layout are otherwise exactly what would have sent.

This is the opposite of `skip_draft`, which fakes the issue to exercise the delivery path
for free. `dry_run` exercises the generation path and fakes nothing.

To dry-run locally instead, point `NEWSLETTER_HOME` at `newsletter-dryrun/` — it is
gitignored, so nothing you generate can reach the committed record.

### Humanizing

With any of `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY` set, the draft job
runs `sectors-humanizer/scripts/humanize.mjs`
between locating the issue and hosting its charts, as one structured-output request.
Running before the `[TEST]` email means the copy you review is the copy that sends.

Edit the voice in `sectors-humanizer/prompt.md`. Nothing else needs changing.

Only the text between tags is sent, as a JSON array, and only strings come back, so markup
cannot change. Each rewrite is then checked and dropped, keeping Claude's wording for that
fragment, if it moves a number or `$TICKER`, or if it grows — fragments cut mid-sentence
at a markup boundary are where the model tries to complete them and splices in a word that
was never there. Any total failure exits 0 with the original untouched, because a Gemini
outage must not cost a Monday send; `HUMANIZE_STRICT=1` fails the run instead.

Measured over the six archived issues: markup byte-identical every time, all 95-220
figures per issue intact, and 107 of 116 rewrites kept.

The pre-humanized HTML is kept beside the issue as `newsletter.raw.html` and committed
with it, so every send has its before/after pair on record.

One request per issue, roughly 1,600 tokens of prose. On Gemini's free tier that is a
250K TPM and 20 RPD ceiling; expect 40-60s per issue, and expect `gemini-3.7-flash` to
return 503 "experiencing high demand" often enough that the fallback chain earns its keep.
Note that Gemini's free tier permits Google to train on what you send; a billed key does
not, and at four to six issues a month it costs a few cents.

The chain may mix providers — set `HUMANIZE_MODELS` to something like
`claude-opus-5,gpt-5.6,gemini-3.7-flash` and each model is called through its own API with
its own key. Adding a provider is one entry in `sectors-humanizer/scripts/providers.mjs`.

### Charts become hosted PNGs at draft time

`charts.mjs` emits SVG, which cannot be emailed: Gmail and Outlook strip SVG, and both
block `data:` URIs in `<img src>`. So the draft job rasterizes each `chart-*.svg` to PNG
with Puppeteer, uploads it to `POST /api/v1/uploads`, and rewrites `newsletter.html` to point
at the returned `https://storage.googleapis.com/…` URL.

This happens in the **draft** job on purpose, so both the `[TEST]` email and the
committed record hold the real hosted image, matching what subscribers receive. The job
fails if any inline `data:` URI survives the rewrite, rather than shipping an issue
whose chart is invisible to most of the list.

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
- **The old key is still in git history.** `config.json` is untracked as of this
  change, but earlier commits still contain the key. The repo is private, so it was
  never publicly exposed, and rewriting history is not worth it for a private repo.
  Rotate the key if the repo is ever made public or shared outside the team.
