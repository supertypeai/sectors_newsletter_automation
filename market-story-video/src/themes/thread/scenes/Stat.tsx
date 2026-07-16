import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../../../types";
import { thread, gradient, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { ThreadBadgeStack } from "../Badge";
import { ThreadSceneLayout } from "../SceneLayout";
import { ThreadFrostPanel } from "../FrostPanel";

export const ThreadStat: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const statDelay = MOTION.staggerFrames;
  const scale = spring({ frame: frame - statDelay, fps, config: MOTION.springConfig, from: 0.7, to: 1 });
  const opacity = interpolate(frame - statDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const badgeDelay = statDelay + MOTION.enterFrames + MOTION.staggerFrames * 2;

  return (
    <ThreadSceneLayout kicker={scene.kicker} justify="center">
      {scene.headline && (
        <ThreadFrostPanel opacity={opacity}>
          <EmphasizedHeadline
            text={scene.headline}
            emphasis={scene.emphasis}
            style={{
              fontFamily: fontFamilies.serif,
              fontWeight: 700,
              fontSize: 54,
              lineHeight: 1.2,
              color: thread.ink,
            }}
            emphasisStyle={{ fontFamily: fontFamilies.serifItalic, fontStyle: "italic" }}
          />
        </ThreadFrostPanel>
      )}
      <ThreadFrostPanel opacity={opacity} transform={`scale(${scale})`}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontFamily: fontFamilies.mono,
              fontWeight: 700,
              fontSize: 148,
              lineHeight: 1,
              backgroundImage: gradient,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {scene.stat?.value}
          </div>
          <div style={{ fontFamily: fontFamilies.sans, fontSize: 26, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: thread.muted }}>
            {scene.stat?.label}
          </div>
        </div>
      </ThreadFrostPanel>
      {scene.badges && scene.badges.length > 0 && (
        <ThreadBadgeStack badges={scene.badges} delay={badgeDelay} />
      )}
    </ThreadSceneLayout>
  );
};
