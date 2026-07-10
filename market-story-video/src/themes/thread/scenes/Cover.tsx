import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { thread, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { ThreadSceneLayout } from "../SceneLayout";

// The cold-open beat ("A MARKET STORY" + a flag), and the first headline beat ("Getting a
// relegation notice.") both land here — cover carries whichever fields the story gives it.
export const ThreadCover: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const delay = MOTION.staggerFrames;
  const opacity = interpolate(frame - delay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame - delay, [0, MOTION.enterFrames], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <ThreadSceneLayout kicker={scene.kicker} justify="center">
      {scene.headline && (
        <EmphasizedHeadline
          text={scene.headline}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.serif,
            fontWeight: 700,
            fontSize: 68,
            lineHeight: 1.18,
            color: thread.ink,
            opacity,
            transform: `translateY(${y}px)`,
            maxWidth: 880,
          }}
          emphasisStyle={{ fontFamily: fontFamilies.serifItalic, fontStyle: "italic" }}
        />
      )}
    </ThreadSceneLayout>
  );
};
