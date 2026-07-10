import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { OutroSpec } from "../../../types";
import { noir, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { BrandMarkIcon } from "../../../components/BrandMark";

// Fixed brand close, matching "One noodle. A whole empire." + logo + tagline in
// indofood-empire.mp4. Never hand-authored per story beyond headline/tagline — same
// convention as the carousel's autoOutro.
export const NoirOutro: React.FC<{ outro: OutroSpec }> = ({ outro }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headlineOpacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markDelay = MOTION.enterFrames + MOTION.staggerFrames * 3;
  const markScale = spring({ frame: frame - markDelay, fps, config: MOTION.springConfig, from: 0.6, to: 1 });
  const markOpacity = interpolate(frame - markDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, padding: "0 76px" }}>
      <EmphasizedHeadline
        text={outro.headline}
        emphasis={outro.emphasis}
        style={{
          fontFamily: fontFamilies.sans,
          fontWeight: 700,
          fontSize: 52,
          lineHeight: 1.2,
          textAlign: "center",
          color: noir.text,
          opacity: headlineOpacity,
        }}
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: markOpacity, transform: `scale(${markScale})` }}>
        <BrandMarkIcon size={64} />
        <div style={{ fontFamily: fontFamilies.sans, fontWeight: 800, fontSize: 40, backgroundImage: "linear-gradient(to right,#E5337E,#DF9439)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
          Sectors
        </div>
        {outro.tagline && (
          <div style={{ fontFamily: fontFamilies.sans, fontWeight: 600, fontSize: 26, color: noir.muted }}>{outro.tagline}</div>
        )}
      </div>
    </div>
  );
};
