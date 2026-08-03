import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { noir, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { NoirSceneLayout } from "../SceneLayout";

// The pre-outro verdict scene ("THE TAKEAWAY" in indofood-empire.mp4): a short, plain
// statement, never advice-framed (hard rule 2 — describe, don't prescribe).
export const NoirTakeaway: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, MOTION.enterFrames], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyDelay = MOTION.enterFrames + MOTION.staggerFrames * 2;
  const bodyOpacity = interpolate(frame - bodyDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NoirSceneLayout kicker={scene.kicker ?? "THE TAKEAWAY"} justify="center">
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <EmphasizedHeadline
          text={scene.headline ?? ""}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.sans,
            fontWeight: 700,
            fontSize: 64,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            color: noir.text,
            opacity,
            transform: `translateY(${y}px)`,
            maxWidth: 920,
          }}
        />
        {scene.body && (
          <div
            style={{
              fontFamily: fontFamilies.sans,
              fontSize: 32,
              fontWeight: 500,
              lineHeight: 1.4,
              color: noir.muted,
              maxWidth: 860,
              opacity: bodyOpacity,
            }}
          >
            {scene.body}
          </div>
        )}
      </div>
    </NoirSceneLayout>
  );
};
