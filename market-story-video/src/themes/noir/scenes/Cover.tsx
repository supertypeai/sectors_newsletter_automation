import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { noir, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { Logo } from "../../../components/Logo";
import { NoirSceneLayout } from "../SceneLayout";

export const NoirCover: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const headlineDelay = MOTION.staggerFrames * 2;
  const headlineOpacity = interpolate(frame - headlineDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame - headlineDelay, [0, MOTION.enterFrames], [24, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const statDelay = headlineDelay + MOTION.enterFrames + MOTION.staggerFrames;
  const statOpacity = interpolate(frame - statDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NoirSceneLayout kicker={scene.kicker} justify="center">
      <EmphasizedHeadline
        text={scene.headline ?? ""}
        emphasis={scene.emphasis}
        style={{
          fontFamily: fontFamilies.sans,
          fontWeight: 800,
          fontSize: 88,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          color: noir.text,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
        }}
      />
      {scene.tickers && scene.tickers.length > 0 && (
        <div style={{ display: "flex", gap: 16, opacity: statOpacity }}>
          {scene.tickers.map((t) => (
            <Logo key={t} ticker={t} size={72} />
          ))}
        </div>
      )}
      {scene.stat && (
        <div style={{ display: "flex", alignItems: "flex-end", gap: 32, opacity: statOpacity }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontFamily: fontFamilies.mono, fontWeight: 700, fontSize: 96, color: noir.text, lineHeight: 1 }}>
              {scene.stat.value}
            </div>
            <div style={{ fontFamily: fontFamilies.sans, fontSize: 24, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: noir.muted }}>
              {scene.stat.label}
            </div>
          </div>
          {scene.stat.compare && (
            <>
              <div style={{ fontFamily: fontFamilies.mono, fontSize: 28, color: noir.dim, paddingBottom: 14 }}>vs</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontFamily: fontFamilies.mono, fontWeight: 700, fontSize: 72, color: noir.muted, lineHeight: 1 }}>
                  {scene.stat.compare.value}
                </div>
                <div style={{ fontFamily: fontFamilies.sans, fontSize: 22, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: noir.dim }}>
                  {scene.stat.compare.label}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </NoirSceneLayout>
  );
};
