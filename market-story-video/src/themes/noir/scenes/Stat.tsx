import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../../../types";
import { noir, gradient, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { NoirSceneLayout } from "../SceneLayout";

export const NoirStat: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const statDelay = MOTION.staggerFrames * 2;
  const scale = spring({ frame: frame - statDelay, fps, config: MOTION.springConfig, from: 0.7, to: 1 });
  const opacity = interpolate(frame - statDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyDelay = statDelay + MOTION.enterFrames + MOTION.staggerFrames * 2;
  const bodyOpacity = interpolate(frame - bodyDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NoirSceneLayout kicker={scene.kicker} justify="center">
      <div style={{ display: "flex", flexDirection: "column", gap: 18, opacity, transform: `scale(${scale})` }}>
        <div
          style={{
            fontFamily: fontFamilies.mono,
            fontWeight: 700,
            fontSize: 176,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            backgroundImage: gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {scene.stat?.value}
        </div>
        <div style={{ fontFamily: fontFamilies.sans, fontSize: 30, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: noir.muted }}>
          {scene.stat?.label}
        </div>
        {scene.stat?.compare && (
          <div style={{ fontFamily: fontFamilies.mono, fontSize: 30, color: noir.dim, marginTop: 8 }}>
            vs {scene.stat.compare.value} · {scene.stat.compare.label}
          </div>
        )}
      </div>
      {scene.headline && (
        <EmphasizedHeadline
          text={scene.headline}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.sans,
            fontWeight: 600,
            fontSize: 40,
            lineHeight: 1.3,
            color: noir.text,
            opacity: bodyOpacity,
            maxWidth: 880,
          }}
        />
      )}
    </NoirSceneLayout>
  );
};
