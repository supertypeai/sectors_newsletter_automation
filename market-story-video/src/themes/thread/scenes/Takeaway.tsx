import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { thread, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { ThreadSceneLayout } from "../SceneLayout";
import { ThreadFrostPanel } from "../FrostPanel";

export const ThreadTakeaway: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <ThreadSceneLayout kicker={scene.kicker} justify="center">
      <ThreadFrostPanel opacity={opacity}>
        <EmphasizedHeadline
          text={scene.headline ?? ""}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.serif,
            fontWeight: 700,
            fontSize: 60,
            lineHeight: 1.2,
            color: thread.ink,
          }}
          emphasisStyle={{ fontFamily: fontFamilies.serifItalic, fontStyle: "italic" }}
        />
      </ThreadFrostPanel>
    </ThreadSceneLayout>
  );
};
