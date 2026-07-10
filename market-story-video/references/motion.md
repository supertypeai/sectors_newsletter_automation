# Motion vocabulary

Every scene's timing reads as one system because it's driven from one place: `src/tokens.ts`'s
`MOTION` constants and the shared `SceneShell`/`useEnterProgress` helpers in
`src/components/SceneShell.tsx`. You don't choreograph animation by hand per scene — you pick
WHAT enters (a headline, a stat, a chart, a badge stack) and the shared timing does the rest.

## The constants (`src/tokens.ts`)

| constant | value | meaning |
|---|---|---|
| `enterFrames` | 14 (~0.47s @30fps) | how long any single element's entrance animation takes |
| `staggerFrames` | 4 | gap between successive items in a sequence (words, bars, list rows) |
| `exitFrames` | 10 (~0.33s @30fps) | the scene-out fade at the end of every scene |
| `springConfig` | damping 200, mass 0.6, stiffness 210 | the one spring feel used for scale-in moments (stat numbers, the outro mark) |

## The two motion primitives

- **`SceneShell`** wraps every scene (`StoryboardComposition` does this for you — scene
  components never wrap themselves). It fades the WHOLE scene in over `enterFrames` and out
  over the last `exitFrames`, so cuts between scenes never hard-flash. A scene shorter than
  `enterFrames + exitFrames` just gets a proportionally faster fade, never clipped.
- **`useEnterProgress(delay, frames)`** gives any element inside a scene a 0->1 clamp-based
  entrance starting `delay` frames after the scene begins. Use `staggerDelay(index)` for the
  Nth item in a sequence (a headline word, a list row, a badge).

Reach for Remotion's own `spring()` directly (not `useEnterProgress`) only for a moment that
should feel bouncy rather than a clean fade/slide — currently just the stat-scene number and
the outro brand mark, both using `MOTION.springConfig`. Don't invent a third feel; two is
already the ceiling for "reads as one system."

## Per-role entrance choreography (what actually enters, in what order)

1. **Kicker** — fades + slides up first, frame 0 of the scene (both themes' `SceneLayout`).
2. **Headline** — fades + slides up starting ~1 stagger step after the kicker.
3. **The proof** (stat number / chart / breakdown) — enters after the headline, using its own
   internal draw-on (bar grow, line draw, ownership-node cascade) rather than a plain fade,
   because the proof is usually the reason the scene exists.
4. **Caption/body** — last, once the proof has had time to register (chart scenes wait
   ~40 frames after the chart starts before fading the caption in).

## Chart draw-on specifics

- **`BarChart`**: bars grow from a 0-height baseline, each starting `staggerFrames * i` after
  the previous, over `growFrames` (default 20). The value label above each bar only becomes
  fully opaque once that bar is >60% grown, so a number never appears floating above nothing.
- **`LineChart`**: the line + area reveal via a widening clip rectangle over `drawFrames`
  (default 36), left to right. A peak label / end dot only appear once the reveal has actually
  reached that x-position — never before the line "gets there".
- **`OwnershipTree`**: nodes cascade top-to-bottom, each `staggerFrames`-multiple after the
  previous (default stagger 16, wider than the standard 4 because a reader needs a beat to
  register each entity before the next one arrives).

## The "thread" theme's extra primitive

`ThreadLine` is NOT scene-local — it reads the ABSOLUTE composition frame (not a scene-local
one) because it draws continuously across the entire video's duration, the visual spine tying
every beat together. Its reveal is a simple linear `frame/totalFrames` clip, no easing — a
constant draw speed is what reads as "one continuous line," not a decorative flourish that
should feel bouncy. Each scene's marker (`ThreadMarker`) fades in independently at that
scene's absolute start frame, positioned wherever the line's path naturally is at that
time-fraction (see `pathX()` in `ThreadLine.tsx` — a deterministic sine wobble, never
`Math.random()`, since Remotion can render frames out of order across worker processes and a
non-deterministic path would visibly jump between renders).

## Reviewing your own timing

Watch (or step through stills of) the rendered scene and ask the same questions the carousel
skill asks of a static slide, adapted for time:
- Does the proof (chart/stat) finish its draw-on with enough hold time left to actually read
  it before the scene cuts? A 3s scene where the chart doesn't finish growing until frame 80
  of 90 leaves no reading time — shorten `growFrames`/`drawFrames` or lengthen the scene.
- Does any scene's exit fade overlap its own entrance (duration too short for
  `enterFrames + exitFrames`)? The shell degrades gracefully but a <0.8s scene is probably too
  short to read regardless.
- Two adjacent scenes both doing a big spring scale-in back to back reads as repetitive —
  vary which role leads (a `stat` scene next to a `chart` scene naturally alternates already).
