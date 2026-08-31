---
name: sectors-humanizer
description: Rewrite a delivered newsletter's prose through Gemini without touching its markup or figures. Use after sectors-newsletter-generator has produced an issue folder.
---

# Sectors humanizer

One model pass over `newsletter.html` in an issue folder, through Gemini, OpenAI, or
Anthropic. Only the text between tags is
sent, as a JSON array, and only strings come back, so markup cannot change. Every text
node above a low floor goes up, headlines included; which ones to leave alone is the
model's judgement, guided by the prompt, not a heuristic in the script.

## Run it

```bash
export GEMINI_API_KEY=<your key>
node sectors-humanizer/scripts/humanize.mjs newsletter/newsletter_2026-08-24_weekly-insights-v2
```

Preview without writing:

```bash
node sectors-humanizer/scripts/humanize.mjs <folder> --dry-run > /tmp/preview.html
```

On success it rewrites `newsletter.html` and keeps the original as `newsletter.raw.html`.
Undo is `mv newsletter.raw.html newsletter.html`.

## Voice

`prompt.md` holds the voice rules and is the only file to edit for a different result.
The script appends the mechanical contract itself.

`references/editorial-profile.md` is the full editorial profile, including the audit mode
and the clarifying questions that `prompt.md` drops. The pipeline needs one rewritten
fragment back per fragment sent, so a mode that returns findings or asks a question would
break the contract. Read the profile when editing a draft interactively rather than
through the script.

## Models

Gemini, OpenAI, and Anthropic are all supported. The provider is inferred from the model
id, so a chain can mix them freely:

```bash
HUMANIZE_MODELS="claude-opus-5,gpt-5.6,gemini-3.7-flash"
```

| Model id | Provider | Key |
| --- | --- | --- |
| `gemini-*` | Google | `GEMINI_API_KEY` / `geminiApiKey` |
| `gpt-*`, `o*` | OpenAI | `OPENAI_API_KEY` / `openaiApiKey` |
| `claude-*` | Anthropic | `ANTHROPIC_API_KEY` / `anthropicApiKey` |
| anything with a `/` | OpenRouter | `OPENROUTER_API_KEY` / `openrouterApiKey` |

An OpenRouter key covers GPT and Claude with one credential — use vendor-prefixed ids
(`anthropic/claude-sonnet-4`, `openai/gpt-5.6`). Requests pin `require_parameters` so they
only route to endpoints that honour the JSON schema, since support varies per endpoint for
the same model. The direct providers stay available if you would rather not add a hop.

Default chain is `gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash`. It moves to the
next model on a 429, a 5xx, a malformed reply, or a missing key, and stops on a 4xx or an
unrecognised model id. `--model <id>` pins one.

Keys come from the environment first, then `config.json` (see `config.example.json`).
Only fill in the providers your chain uses — a model whose key is absent is skipped.

Tune prompts against `gemini-3.5-flash-lite` (500 RPD) rather than the full Flash models
(20 RPD), then validate on the model you ship.

Adding a fourth provider means one entry in `scripts/providers.mjs`; nothing else in the
pipeline knows which API answered.

## Failure

Exits 0 and leaves the prose untouched when no key is set, the prompt file is empty,
or every model fails, so a provider outage never costs a send. `--strict` or
`HUMANIZE_STRICT=1` exits 1 instead.

A rewrite is dropped, keeping Claude's wording for that fragment, when it moves a figure
or when it grows. The growth rule exists because fragments cut mid-sentence at a markup
boundary are where the model misbehaves: measured across 116 real rewrites it twice
spliced in a word that was never there (`led net selling at` became `led net selling at
formulation`). Both cases grew; no worthwhile rewrite did, since this prompt only cuts.

Sending the whole document instead was tried and measured: given 20KB of HTML, Flash
returns an abridged 3KB document with `finishReason: STOP`. It rewrites the page rather
than echoing it, so fragments are not a stylistic choice.

## Scope

Operates on `newsletter.html` only. `newsletter.md` is the archived record and stays as
Claude wrote it. Do not point this at anything under `sectors-newsletter-dbquery/` while a
free-tier key is in use — free tier permits Google to train on the payload, and those
templates carry customer account state.
