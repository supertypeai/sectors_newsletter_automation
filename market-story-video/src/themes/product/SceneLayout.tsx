import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { product, SAFE, MOTION } from "../../tokens";
import { fontFamilies } from "../../fonts";
import { useReservedPadding } from "../../components/HumanSlot";

// Per-scene chrome for the product theme: the same gold mono kicker as noir, plus the
// talking-head reservation. The reservation is padding rather than a positioned void, so a
// long headline reflows above the slot instead of running under it.
export const ProductSceneLayout: React.FC<{
  kicker?: string;
  justify?: "center" | "space-between" | "flex-start";
  gap?: number;
  children: React.ReactNode;
}> = ({ kicker, justify = "center", gap = 32, children }) => {
  const frame = useCurrentFrame();
  const reserved = useReservedPadding();
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
        padding: `${SAFE.top + reserved.top}px ${SAFE.x}px ${SAFE.bottom + reserved.bottom}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: justify,
        gap,
      }}
    >
      {kicker && (
        <div
          style={{
            fontFamily: fontFamilies.mono,
            fontSize: 30,
            fontWeight: 600,
            color: product.brandGold,
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
