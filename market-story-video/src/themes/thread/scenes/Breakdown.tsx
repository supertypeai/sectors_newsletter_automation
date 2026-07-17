import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { thread, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { OwnershipTree } from "../../../components/charts/OwnershipTree";
import { OwnershipNetwork } from "../../../components/charts/OwnershipNetwork";
import { ThreadBadgeStack } from "../Badge";
import { ThreadSceneLayout } from "../SceneLayout";
import { ThreadFrostPanel } from "../FrostPanel";

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
        <ThreadFrostPanel opacity={headlineOpacity}>
          <EmphasizedHeadline
            text={scene.headline}
            emphasis={scene.emphasis}
            style={{
              fontFamily: fontFamilies.serif,
              fontWeight: 700,
              fontSize: 52,
              lineHeight: 1.2,
              color: thread.ink,
            }}
            emphasisStyle={{ fontFamily: fontFamilies.serifItalic, fontStyle: "italic" }}
          />
        </ThreadFrostPanel>
      )}
      {scene.badges && scene.badges.length > 0 && <ThreadBadgeStack badges={scene.badges} delay={bodyDelay} />}
      {scene.breakdown?.kind === "ownership" && (
        <ThreadFrostPanel>
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
        </ThreadFrostPanel>
      )}
      {scene.breakdown?.kind === "network" && (
        <ThreadFrostPanel>
          <OwnershipNetwork
            nodes={scene.breakdown.nodes}
            edges={scene.breakdown.edges}
            width={920}
            height={980}
            accentColor={thread.brandPink}
            reverseColor={thread.brandGold}
            nameColor={thread.ink}
            codeColor={thread.muted}
            lineColor={thread.threadLine}
            labelBgColor={thread.bg}
            closingCaption={scene.breakdown.closingCaption}
            captionColor={thread.brandGold}
            delay={bodyDelay}
            fontFamily={fontFamilies.sans}
            monoFontFamily={fontFamilies.mono}
          />
        </ThreadFrostPanel>
      )}
      {scene.breakdown?.kind === "list" && (
        <ThreadFrostPanel maxWidth={760}>
          <div style={{ display: "grid", gridTemplateColumns: "max-content 1fr", rowGap: 22, columnGap: 20, alignItems: "baseline" }}>
            {scene.breakdown.items.map((item, i) => {
              const delay = bodyDelay + i * MOTION.staggerFrames * 2;
              const opacity = interpolate(frame - delay, [0, MOTION.enterFrames], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              });
              return (
                <React.Fragment key={item.label}>
                  <div style={{ opacity, fontFamily: fontFamilies.serif, fontWeight: 700, fontSize: 34, color: thread.ink, whiteSpace: "nowrap" }}>
                    {item.label}
                  </div>
                  <div style={{ opacity, fontFamily: fontFamilies.sans, fontSize: 24, color: thread.muted }}>
                    {item.sub ?? ""}
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </ThreadFrostPanel>
      )}
    </ThreadSceneLayout>
  );
};
