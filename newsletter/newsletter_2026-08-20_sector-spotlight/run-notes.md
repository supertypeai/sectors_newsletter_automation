# Unattended-run notes, 2026-08-20

Issue type (`sector-spotlight`) was named explicitly in the run instructions, so no
default was needed there. Everything below is a decision this run made on its own
because no human was reachable to ask.

- **`NEWSLETTER_HOME` resolution**: environment variable was set
  (`/home/runner/work/sectors_newsletter_skills/sectors_newsletter_skills/newsletter`),
  used per the documented resolution order's first option. No fallback needed.
- **Issue date**: set to 2026-08-20 per the explicit WIB date supplied in the run
  instructions (Hard rule 11), not inferred from the runner's own system clock.
  `data_as_of` is 2026-08-19, the latest date the Sectors API actually returned across
  every fetch this run.
- **Sub-sector and hook selection (not named in the prompt, chosen this run)**: the
  prompt only said "sector spotlight" with no sub-sector specified, so one was picked
  following the "you pick this week's issue" instruction, choose and state why. Chose
  Food & Beverage's poultry corner (CPIN vs. JPFA vs. MAIN) because CPIN closed at a
  fresh 52-week/YTD low on 2026-08-19 (this run's own `overview.all_time_price` and
  `daily/` pull, self-consistent) in the same window MSCI's August review dropped it
  from the Global Standard Index, a real, dated, already-reportable hook, and because
  the same-sub-industry poultry peers gave a genuine like-for-like comparison rather
  than the sub-sector's much noisier full membership (palm oil planters, packaged
  food, coffee chains all sit in the same "Food & Beverage" sub-sector but aren't
  comparable to CPIN on a shared basis).
- **Web sourcing for the MSCI claim**: the two outlets most likely to carry this
  (Bisnis, Kontan) both returned HTTP 403/429 to `WebFetch` this run. Verified the
  same underlying fact (CPIN moved from MSCI Global Standard to Global Small Cap,
  effective after close 31 Aug 2026) against Kalderanews's 13 Aug 2026 coverage
  instead, which did fetch cleanly and is a named, dated outlet, so the citation
  discipline in `sourcing.md` still holds. Noting the substitution here since the
  most recent weekly-insights-v2 issue (2026-08-16) cited a Kontan piece for the
  same broader MSCI story; this issue cites a different outlet for the CPIN-specific
  angle of that same event, not the same article.
- **`$NEWSLETTER_HOME/samples/sector-spotlight/`**: present, used as the structural
  reference (section order, table shape, chart pairing with `barChart`'s `benchmark`
  option). No absence to note.
- **Upcoming events sheet**: reachable via `curl`, returned one row (24-25 Aug 2026
  Claude/Sectors MCP workshop), still upcoming relative to the issue date, included
  in full. No omission.
- **Foreign-flow / Supabase MCP connector**: not applicable to this issue type, no
  attempt made, nothing to note.
