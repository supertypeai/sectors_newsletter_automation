import React from "react";
import { Composition } from "remotion";
import { StoryboardComposition, computeFrames } from "./StoryboardComposition";
import { Storyboard } from "./types";
import sampleStoryboard from "../samples/bbri-vs-bonds.storyboard.json";
import { CANVAS } from "./tokens";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MarketStory"
      component={StoryboardComposition}
      fps={CANVAS.fps}
      width={CANVAS.width}
      height={CANVAS.height}
      durationInFrames={computeFrames(sampleStoryboard as Storyboard, CANVAS.fps).total}
      defaultProps={{ storyboard: sampleStoryboard as Storyboard }}
      calculateMetadata={async ({ props }) => {
        const storyboard = props.storyboard as Storyboard;
        const { total } = computeFrames(storyboard, CANVAS.fps);
        return { durationInFrames: total, fps: CANVAS.fps, width: CANVAS.width, height: CANVAS.height };
      }}
    />
  );
};
