import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { Storyboard } from "./types";
import { noirTheme } from "./themes/noir";
import { threadTheme, ThreadLine, ThreadMarker } from "./themes/thread";
import { SceneShell } from "./components/SceneShell";

const DEFAULT_OUTRO_SECONDS = 2.2;
const MARKER_COLOR_CYCLE = ["#E5337E", "#DF9439", "#1D8A4E", "#211B15"];

// The outro's tagline is the story's one clickable pointer back to the source — for a
// single-ticker story that means the ticker's own sectors.app page, not a generic homepage
// link, so a viewer who wants to verify a number lands exactly where it lives.
function defaultTagline(storyboard: Storyboard): string {
  if (storyboard.tickers.length === 1) {
    return `sectors.app/idx/${storyboard.tickers[0].toLowerCase()}`;
  }
  return "sectors.app";
}

export function computeFrames(storyboard: Storyboard, fps: number) {
  const sceneFrames = storyboard.scenes.map((s) => Math.round(s.duration * fps));
  const outroFrames = storyboard.outro === false ? 0 : Math.round(DEFAULT_OUTRO_SECONDS * fps);
  const total = sceneFrames.reduce((a, b) => a + b, 0) + outroFrames;
  return { sceneFrames, outroFrames, total };
}

export const StoryboardComposition: React.FC<{ storyboard: Storyboard }> = ({ storyboard }) => {
  const { fps } = useVideoConfig();
  const { sceneFrames, outroFrames, total } = computeFrames(storyboard, fps);
  const theme = storyboard.theme === "thread" ? threadTheme : noirTheme;

  let cursor = 0;
  const starts = sceneFrames.map((f) => {
    const start = cursor;
    cursor += f;
    return start;
  });

  // The logo track shows each of the story's tickers once, in the fixed order given by the
  // envelope's `tickers` array — not once per scene mention. A ticker already shown earlier
  // in the current lap is skipped rather than re-pinned, so the thread doesn't fill up with
  // repeat dots for a hub entity that recurs across many scenes. Once every ticker in the
  // envelope order has appeared, the lap resets so a later repeat starts a fresh lap instead
  // of being dropped — "loop it if necessary" for a story with more beats than tickers.
  let seenThisLap = new Set<string>();
  const colorFor = (color: NonNullable<typeof storyboard.scenes[number]["marker"]>["color"]) =>
    color ? { pink: "#E5337E", gold: "#DF9439", green: "#1D8A4E", dark: "#211B15" }[color] : undefined;
  const markers: ThreadMarker[] = storyboard.scenes.flatMap((scene, i) => {
    if (scene.marker || !scene.tickers || scene.tickers.length === 0) {
      return [
        {
          atFrame: starts[i],
          kind: scene.marker?.kind ?? "dot",
          color: colorFor(scene.marker?.color) ?? MARKER_COLOR_CYCLE[i % MARKER_COLOR_CYCLE.length],
        },
      ];
    }
    const newThisScene = scene.tickers.filter((ticker) => {
      if (seenThisLap.has(ticker)) return false;
      seenThisLap.add(ticker);
      if (seenThisLap.size >= storyboard.tickers.length) seenThisLap = new Set();
      return true;
    });
    return newThisScene.map((ticker, j) => ({
      atFrame: starts[i] + Math.round(((j + 1) * sceneFrames[i]) / (newThisScene.length + 1)),
      kind: "logo" as const,
      ticker,
    }));
  });

  // Markers are positioned along the thread purely by time-fraction (atFrame / total), and
  // a scene that names several tickers close together in time lands them close together in
  // SPACE too (the path's y is linear in time) — close enough that two 56px logo circles can
  // visibly overlap. Enforce a minimum frame gap between consecutive markers (in chronological
  // order) so no two logos ever sit closer than one logo-diameter-plus-margin apart.
  const MIN_MARKER_GAP_PX = 80;
  const minGapFrames = Math.ceil((MIN_MARKER_GAP_PX / 1920) * total);
  let lastMarkerFrame = -Infinity;
  const spacedMarkers: ThreadMarker[] = markers
    .slice()
    .sort((a, b) => a.atFrame - b.atFrame)
    .map((m) => {
      const atFrame = Math.min(Math.max(m.atFrame, lastMarkerFrame + minGapFrames), total - 1);
      lastMarkerFrame = atFrame;
      return { ...m, atFrame };
    });

  return (
    <AbsoluteFill>
      <theme.Background />
      {storyboard.theme === "thread" && (
        <ThreadLine width={1080} height={1920} totalFrames={total} markers={spacedMarkers} />
      )}
      {theme.Chrome && <theme.Chrome sourceDate={storyboard.sourceDate} />}
      {storyboard.scenes.map((scene, i) => {
        const SceneComponent = theme.scenes[scene.role];
        if (!SceneComponent) {
          throw new Error(`No "${storyboard.theme}" theme renderer for scene role "${scene.role}".`);
        }
        // If there's no outro (outroFrames === 0, i.e. "outro": false), the last authored
        // scene IS the last frame of the video, so it inherits the outro's no-fade-out rule.
        const isFinalScene = outroFrames === 0 && i === storyboard.scenes.length - 1;
        return (
          <Sequence key={i} from={starts[i]} durationInFrames={sceneFrames[i]} layout="none">
            <SceneShell durationInFrames={sceneFrames[i]} fadeOut={!isFinalScene}>
              <SceneComponent scene={scene} />
            </SceneShell>
          </Sequence>
        );
      })}
      {outroFrames > 0 && storyboard.outro !== false && (
        <Sequence from={cursor} durationInFrames={outroFrames} layout="none">
          <SceneShell durationInFrames={outroFrames} fadeOut={false}>
            <theme.Outro
              outro={
                storyboard.outro ?? {
                  headline: "Get the full picture.",
                  emphasis: "full picture.",
                  tagline: defaultTagline(storyboard),
                }
              }
            />
          </SceneShell>
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
