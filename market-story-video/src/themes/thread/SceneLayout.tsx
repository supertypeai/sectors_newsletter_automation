import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { thread, SAFE, MOTION } from "../../tokens";
import { fontFamilies } from "../../fonts";

export const ThreadSceneLayout: React.FC<{
  kicker?: string;
  justify?: "center" | "space-between" | "flex-start";
  children: React.ReactNode;
}> = ({ kicker, justify = "center", children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
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
        alignItems: "center",
        justifyContent: justify,
        gap: 30,
        textAlign: "center",
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: fontFamilies.sans,
            fontSize: 26,
            fontWeight: 600,
            color: thread.muted,
            textTransform: "uppercase",
            letterSpacing: "0.22em",
            opacity,
          }}
        >
          {kicker}
        </div>
      )}
      {children}
    </div>
  );
};
