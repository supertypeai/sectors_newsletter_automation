import React from "react";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../../../types";
import { product, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { DeviceFrame } from "../../../components/DeviceFrame";
import { ProductSceneLayout } from "../SceneLayout";

// The proof beat: the app actually doing the thing. This is the scene the whole reel exists to
// deliver, so it gets the longest duration and the least competing copy — one short headline
// above the frame, the callouts inside it, nothing else.
//
// A demo scene with no `media` is an authoring error, not a layout to render around: it would
// silently ship a reel whose feature promo shows no product. Throwing here mirrors
// EmphasizedHeadline's stance on a mismatched emphasis.
export const ProductDemo: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!scene.media) {
    throw new Error(
      'A "demo" scene needs a `media` object (kind, src). See references/product-reel.md — a demo scene with no footage is a feature promo showing no product.'
    );
  }
  const headlineOpacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bodyDelay = MOTION.enterFrames + MOTION.staggerFrames * 3;
  const bodyOpacity = interpolate(frame - bodyDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <ProductSceneLayout kicker={scene.kicker} justify="center" gap={44}>
      {scene.headline && (
        <EmphasizedHeadline
          text={scene.headline}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.sans,
            fontWeight: 700,
            fontSize: 54,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            color: product.text,
            maxWidth: 900,
            opacity: headlineOpacity,
          }}
        />
      )}
      <DeviceFrame
        media={scene.media}
        durationInFrames={Math.round(scene.duration * fps)}
        callouts={scene.callouts}
        cursor={scene.cursor}
      />
      {scene.body && (
        <div
          style={{
            fontFamily: fontFamilies.sans,
            fontSize: 32,
            fontWeight: 500,
            lineHeight: 1.38,
            color: product.muted,
            maxWidth: 900,
            opacity: bodyOpacity,
          }}
        >
          {scene.body}
        </div>
      )}
    </ProductSceneLayout>
  );
};
