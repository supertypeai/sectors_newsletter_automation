# Voiceover and the talking-head corner

A product reel usually wants a human: a voice guiding the viewer through the feature, and often
a face in the corner doing the guiding. This skill handles the WORDS and the SPACE. It does not
record, synthesize, or composite audio or video. That split is deliberate: a real presenter's
voice and face are what make a promo feel like a person recommending a tool instead of an ad,
and neither is something to fake.

So the skill produces two things:

1. A **timed script** the presenter reads, compiled from the storyboard's per-scene `vo` lines
   against the same scene durations the renderer uses (`scripts/script-out.mjs`).
2. A **reserved corner** in the render where the talking-head clip will be dropped in later. The
   skill keeps every scene's copy out of that corner's band and, in a draft/stills pass, draws a
   dashed guide box at the exact size and position to film for. The delivered MP4 leaves the
   corner empty; compositing the clip happens downstream, in the editor.

## Writing the `vo` lines

Each scene carries an optional `vo` string: the line spoken WHILE that scene is on screen. It is
never rendered on screen; it exists only to compile the script.

- **Say what the screen can't.** The on-screen text already states the headline and the feature
  name. A `vo` line that reads them back out loud wastes the one channel the text can't use.
  Let the voice add the aside, the reason, the "here's why you'd care" that wouldn't fit on the
  frame. `script-out.mjs` prints the on-screen text next to each line so you can hear the clash.
- **Fit the clock.** The budget is ~2.6 words per second (a presenter talking to camera, not a
  newsreader): a 2.8s scene holds ~7 words, a 5.6s demo ~14. The lint warns when a line runs
  over; a line the presenter can't finish inside the cut either spills past it or gets rushed.
- **Brand voice, same as everywhere.** Plain, specific, no hype, no advice, no dashes
  (`writing/brand-voice.md`). The lint's dash and advice checks cover `vo` too.
- **Silence is allowed.** A demo scene can carry no `vo` at all and let the footage and callouts
  do the talking. But if a talking-head slot is reserved (a face is on screen the whole reel), a
  scene with no line reads as the presenter freezing, so the lint warns on it. Either give every
  scene a line, or don't reserve a slot and treat the script as pure voiceover.

## Reserving the corner: `humanSlot`

```jsonc
"humanSlot": {
  "corner": "bottom-left",     // default; keeps clear of the Reels like/share column on the right
  "size": 320,                  // canvas px, the box edge
  "shape": "circle",            // "circle" | "rounded"
  "note": "Half-body, plain wall, look down the lens."   // lands in the script's recording notes
}
```

Omit `humanSlot` (or set it `false`) for a reel with no face — the script then comes out as a
pure voiceover with audio-only recording notes.

- **Corner.** Default `bottom-left`. The right edge belongs to the platform's like / comment /
  share column, so a face on the right gets covered; the lint warns if you put it there.
- **The reservation is whole-reel.** Copy is padded out of the slot's band on EVERY scene, not
  only the scenes the presenter appears in, because copy that jumps up and down between cuts
  reads as a layout bug even when each frame is individually fine.
- **Check the framing before filming.** A `--stills` pass (or `--guides` on a full MP4) draws
  the dashed box at the exact size and position. Film so the head sits in the middle third of
  that box; the mask is a circle by default, so anything in the corners of the source frame gets
  cut.

## The workflow

1. Write the storyboard with `vo` lines and (optionally) a `humanSlot`.
2. `node scripts/storyboard-lint.mjs <storyboard.json>` — fix vo-budget and slot warnings.
3. `node scripts/script-out.mjs <storyboard.json> --out <folder>/script.md` — the timed script
   with per-scene timecodes, on-screen context, callout cues, and recording notes.
4. `node scripts/render.mjs <storyboard.json> --out output/_draft --stills` — check the framing
   box and copy positions.
5. Render the final MP4 (`render.mjs` without `--stills`): the slot renders empty.
6. Deliver the MP4 and `script.md` together. The presenter records against the script; whoever
   edits composites the clip into the reserved corner. Re-run `script-out.mjs` after any
   duration change so the timecodes never drift from the render.

Nothing in this skill records audio, synthesizes a voice, or overlays a video clip. The script
and the empty, correctly-framed slot are the deliverables.
