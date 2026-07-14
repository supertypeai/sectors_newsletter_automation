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

  const markers: ThreadMarker[] = storyboard.scenes.map((scene, i) => ({
    atFrame: starts[i],
    kind: scene.marker?.kind ?? (scene.tickers && scene.tickers.length > 0 ? "logo" : "dot"),
    color: scene.marker?.color
      ? { pink: "#E5337E", gold: "#DF9439", green: "#1D8A4E", dark: "#211B15" }[scene.marker.color]
      : MARKER_COLOR_CYCLE[i % MARKER_COLOR_CYCLE.length],
    ticker: scene.tickers?.[0],
  }));

  return (
    <AbsoluteFill>
      <theme.Background />
      {storyboard.theme === "thread" && (
        <ThreadLine width={1080} height={1920} totalFrames={total} markers={markers} />
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
