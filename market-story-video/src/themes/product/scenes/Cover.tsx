import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { product, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { ProductSceneLayout } from "../SceneLayout";

// The hook. A feature reel's cover states the PROBLEM the viewer already has, not the feature
// name — nobody stops scrolling for a product noun. The feature scene that follows is where
// the name earns its screen time. `stat` is optional and only worth using when a number is the
// sharpest way to state the problem ("6 tabs to compare 3 banks").
export const ProductCover: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const headlineDelay = MOTION.staggerFrames * 2;
  const headlineOpacity = interpolate(frame - headlineDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame - headlineDelay, [0, MOTION.enterFrames], [26, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const supportDelay = headlineDelay + MOTION.enterFrames + MOTION.staggerFrames;
  const supportOpacity = interpolate(frame - supportDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <ProductSceneLayout kicker={scene.kicker} justify="center" gap={40}>
      <EmphasizedHeadline
        text={scene.headline ?? ""}
        emphasis={scene.emphasis}
        style={{
          fontFamily: fontFamilies.sans,
          fontWeight: 800,
          fontSize: 92,
          lineHeight: 1.06,
          letterSpacing: "-0.02em",
          color: product.text,
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
        }}
      />
      {scene.stat && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, opacity: supportOpacity }}>
          <div style={{ fontFamily: fontFamilies.mono, fontWeight: 700, fontSize: 104, color: product.text, lineHeight: 1 }}>
            {scene.stat.value}
          </div>
          <div
            style={{
              fontFamily: fontFamilies.sans,
              fontSize: 26,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: product.muted,
            }}
          >
            {scene.stat.label}
          </div>
        </div>
      )}
      {scene.body && (
        <div
          style={{
            fontFamily: fontFamilies.sans,
            fontSize: 36,
            fontWeight: 500,
            lineHeight: 1.4,
            color: product.muted,
            maxWidth: 860,
            opacity: supportOpacity,
          }}
        >
          {scene.body}
        </div>
      )}
    </ProductSceneLayout>
  );
};
