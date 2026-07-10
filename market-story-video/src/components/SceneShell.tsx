import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { MOTION } from "../tokens";

// Wraps every scene so entrances/exits read as one system instead of each scene inventing
// its own timing (see references/motion.md). Fades the whole scene in over enterFrames and
// out over the last exitFrames of its own duration — a scene shorter than enter+exit just
// gets a faster, still-symmetric fade rather than clipping into negative time.
// `fadeOut` defaults true (every mid-story scene cuts cleanly into the next); the final
// Sequence in the whole composition (the outro) is rendered with `fadeOut={false}` so the
// video ends on a fully-opaque last frame instead of fading to black — a social clip's last
// frame is often what gets held on as a thumbnail/loop point, so it shouldn't be mid-fade.
export const SceneShell: React.FC<{
  durationInFrames: number;
  fadeOut?: boolean;
  children: React.ReactNode;
}> = ({ durationInFrames, fadeOut = true, children }) => {
  const frame = useCurrentFrame();
  const enter = Math.min(MOTION.enterFrames, durationInFrames / 2);
  const opacity = fadeOut
    ? interpolate(
        frame,
        [0, enter, durationInFrames - Math.min(MOTION.exitFrames, durationInFrames / 2), durationInFrames],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
      )
    : interpolate(frame, [0, enter], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <div style={{ width: "100%", height: "100%", opacity }}>{children}</div>;
};

// Per-element stagger delay (frames) for the Nth entering item (word, pill, bar…), read
// against the LOCAL scene frame with useEnterProgress below.
export function staggerDelay(index: number): number {
  return index * MOTION.staggerFrames;
}

// 0->1 entrance progress for an element that starts animating `delay` frames after its
// scene begins. Clamp-based (not spring) so callers can drive translateY/opacity/scale
// uniformly; use Remotion's `spring()` directly in a component if a bouncier feel is wanted.
export function useEnterProgress(delay: number, frames = MOTION.enterFrames): number {
  const frame = useCurrentFrame();
  return interpolate(frame - delay, [0, frames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function useFps(): number {
  return useVideoConfig().fps;
}
