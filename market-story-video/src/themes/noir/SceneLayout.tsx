import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { noir, SAFE } from "../../tokens";
import { fontFamilies } from "../../fonts";
import { MOTION } from "../../tokens";

// Shared per-scene chrome: the mono uppercase kicker top-left, fading/sliding in first, then
// its children. Matches sectors-carousel's .kicker exactly (gold mono, uppercase, tracked).
export const NoirSceneLayout: React.FC<{
  kicker?: string;
  justify?: "center" | "space-between" | "flex-start";
  children: React.ReactNode;
}> = ({ kicker, justify = "center", children }) => {
  const frame = useCurrentFrame();
  const kickerOpacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const kickerY = interpolate(frame, [0, MOTION.enterFrames], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: `${SAFE.top}px ${SAFE.x}px ${SAFE.bottom}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: justify,
        gap: 32,
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: fontFamilies.mono,
            fontSize: 30,
            fontWeight: 600,
            color: noir.brandGold,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            opacity: kickerOpacity,
            transform: `translateY(${kickerY}px)`,
          }}
        >
          {kicker}
        </div>
      )}
      {children}
    </div>
  );
};
