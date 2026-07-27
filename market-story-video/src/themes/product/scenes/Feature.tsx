import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../../../types";
import { product, gradient, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { ProductSceneLayout } from "../SceneLayout";

// The introduction beat: this is the thing, this is what it does for you. The feature NAME is
// the one gradient moment on this scene (the brand's single emphasis law applies here exactly
// as it does to a headline verdict), so a scene that also carries a `headline` should leave
// that headline's `emphasis` unset rather than compete for a second gradient.
//
// Chips are capability tags, not sentences: "60 filters", "900+ IDX names", "Export to CSV".
// Three is the ceiling — a fourth stops being read at reel speed.
export const ProductFeature: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const feature = scene.feature;
  const nameDelay = MOTION.staggerFrames * 2;
  const nameScale = spring({ frame: frame - nameDelay, fps, config: MOTION.springConfig, from: 0.85, to: 1 });
  const nameOpacity = interpolate(frame - nameDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const promiseDelay = nameDelay + MOTION.enterFrames;
  const promiseOpacity = interpolate(frame - promiseDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <ProductSceneLayout kicker={scene.kicker} justify="center" gap={36}>
      {/* No brand mark here: the persistent top-right badge already signs the frame, and a
          second mark beside a feature name long enough to wrap collides with the second line.
          The gradient on the name is this scene's one brand moment. */}
      <div
        style={{
          fontFamily: fontFamilies.sans,
          fontWeight: 800,
          fontSize: 84,
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          backgroundImage: gradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          opacity: nameOpacity,
          transform: `scale(${nameScale})`,
          transformOrigin: "left center",
        }}
      >
        {feature?.name}
      </div>

      {feature?.promise && (
        <div
          style={{
            fontFamily: fontFamilies.sans,
            fontSize: 46,
            fontWeight: 600,
            lineHeight: 1.28,
            color: product.text,
            maxWidth: 880,
            opacity: promiseOpacity,
          }}
        >
          {feature.promise}
        </div>
      )}

      {feature?.chips && feature.chips.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
          {feature.chips.map((chip, i) => {
            const delay = promiseDelay + MOTION.enterFrames + i * MOTION.staggerFrames;
            const opacity = interpolate(frame - delay, [0, MOTION.enterFrames], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const y = interpolate(frame - delay, [0, MOTION.enterFrames], [14, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={chip}
                style={{
                  background: product.glassBg,
                  border: `1px solid ${product.glassBorder}`,
                  borderRadius: 999,
                  padding: "14px 26px",
                  fontFamily: fontFamilies.sans,
                  fontSize: 28,
                  fontWeight: 600,
                  color: product.text,
                  opacity,
                  transform: `translateY(${y}px)`,
                }}
              >
                {chip}
              </div>
            );
          })}
        </div>
      )}

      {scene.headline && (
        <EmphasizedHeadline
          text={scene.headline}
          emphasis={scene.emphasis}
          style={{
            fontFamily: fontFamilies.sans,
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.4,
            color: product.muted,
            maxWidth: 880,
            opacity: promiseOpacity,
          }}
        />
      )}
    </ProductSceneLayout>
  );
};
