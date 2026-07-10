import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { noir, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { OwnershipTree } from "../../../components/charts/OwnershipTree";
import { NoirSceneLayout } from "../SceneLayout";

export const NoirBreakdown: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const headlineOpacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyDelay = MOTION.enterFrames + MOTION.staggerFrames;

  return (
    <NoirSceneLayout kicker={scene.kicker} justify="center">
      {scene.headline && (
        <EmphasizedHeadline
          text={scene.headline}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.sans,
            fontWeight: 700,
            fontSize: 54,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            color: noir.text,
            opacity: headlineOpacity,
            maxWidth: 920,
          }}
        />
      )}
      {scene.breakdown?.kind === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {scene.breakdown.items.map((item, i) => {
            const delay = bodyDelay + i * MOTION.staggerFrames * 2;
            const opacity = interpolate(frame - delay, [0, MOTION.enterFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const x = interpolate(frame - delay, [0, MOTION.enterFrames], [-20, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={item.label} style={{ display: "flex", alignItems: "baseline", gap: 24, opacity, transform: `translateX(${x}px)` }}>
                <div style={{ fontFamily: fontFamilies.mono, fontWeight: 700, fontSize: 32, color: noir.dim, width: 36 }}>{i + 1}</div>
                <div style={{ fontFamily: fontFamilies.sans, fontWeight: 700, fontSize: 38, color: noir.text }}>{item.label}</div>
                {item.sub && (
                  <div style={{ fontFamily: fontFamilies.sans, fontSize: 26, color: noir.muted }}>{item.sub}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {scene.breakdown?.kind === "ownership" && (
        <OwnershipTree
          nodes={scene.breakdown.nodes}
          links={scene.breakdown.links}
          accentColor={noir.brandPink}
          nameColor={noir.text}
          subColor={noir.muted}
          lineColor={noir.border}
          delay={bodyDelay}
          fontFamily={fontFamilies.sans}
          monoFontFamily={fontFamilies.mono}
        />
      )}
    </NoirSceneLayout>
  );
};
