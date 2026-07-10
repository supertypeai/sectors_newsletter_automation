import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { thread, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { OwnershipTree } from "../../../components/charts/OwnershipTree";
import { ThreadBadgeStack } from "../Badge";
import { ThreadSceneLayout } from "../SceneLayout";

export const ThreadBreakdown: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const headlineOpacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyDelay = MOTION.enterFrames + MOTION.staggerFrames;

  return (
    <ThreadSceneLayout kicker={scene.kicker} justify="center">
      {scene.headline && (
        <EmphasizedHeadline
          text={scene.headline}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.serif,
            fontWeight: 700,
            fontSize: 52,
            lineHeight: 1.2,
            color: thread.ink,
            opacity: headlineOpacity,
            maxWidth: 880,
          }}
          emphasisStyle={{ fontFamily: fontFamilies.serifItalic, fontStyle: "italic" }}
        />
      )}
      {scene.badges && scene.badges.length > 0 && <ThreadBadgeStack badges={scene.badges} delay={bodyDelay} />}
      {scene.breakdown?.kind === "ownership" && (
        <OwnershipTree
          nodes={scene.breakdown.nodes}
          links={scene.breakdown.links}
          accentColor={thread.brandPink}
          nameColor={thread.ink}
          subColor={thread.muted}
          lineColor={thread.threadLine}
          delay={bodyDelay}
          fontFamily={fontFamilies.sans}
          monoFontFamily={fontFamilies.mono}
        />
      )}
      {scene.breakdown?.kind === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, alignItems: "center" }}>
          {scene.breakdown.items.map((item, i) => {
            const delay = bodyDelay + i * MOTION.staggerFrames * 2;
            const opacity = interpolate(frame - delay, [0, MOTION.enterFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div key={item.label} style={{ opacity, display: "flex", alignItems: "baseline", gap: 16 }}>
                <div style={{ fontFamily: fontFamilies.serif, fontWeight: 700, fontSize: 34, color: thread.ink }}>{item.label}</div>
                {item.sub && <div style={{ fontFamily: fontFamilies.sans, fontSize: 24, color: thread.muted }}>{item.sub}</div>}
              </div>
            );
          })}
        </div>
      )}
    </ThreadSceneLayout>
  );
};
