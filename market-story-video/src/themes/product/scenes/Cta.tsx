import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Scene } from "../../../types";
import { product, gradient, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { BrandMarkIcon } from "../../../components/BrandMark";

// The close. A product reel ends on the CTA scene rather than the generic story outro, so
// `"outro": false` is the norm for this theme — two sign-offs back to back is one too many, and
// the CTA already carries the mark, the wordmark and the destination.
//
// The URL is a real path a viewer can type. A CTA pointing at the bare homepage when the reel
// was about one feature makes the viewer do the navigation the reel just promised to save them.
export const ProductCta: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const headlineOpacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const markDelay = MOTION.staggerFrames * 3;
  const markScale = spring({ frame: frame - markDelay, fps, config: MOTION.springConfig, from: 0.7, to: 1 });
  const markOpacity = interpolate(frame - markDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const urlDelay = markDelay + MOTION.enterFrames;
  const urlOpacity = interpolate(frame - urlDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 46,
        padding: "0 76px",
      }}
    >
      <EmphasizedHeadline
        text={scene.headline ?? ""}
        emphasis={scene.emphasis}
        style={{
          fontFamily: fontFamilies.sans,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.18,
          textAlign: "center",
          color: product.text,
          opacity: headlineOpacity,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, opacity: markOpacity, transform: `scale(${markScale})` }}>
        <BrandMarkIcon size={68} />
        <div
          style={{
            fontFamily: fontFamilies.sans,
            fontWeight: 800,
            fontSize: 42,
            backgroundImage: gradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Sectors
        </div>
      </div>

      {scene.cta && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: urlOpacity }}>
          <div
            style={{
              background: product.glassBg,
              border: `1px solid ${product.glassBorder}`,
              borderRadius: 999,
              padding: "18px 40px",
              fontFamily: fontFamilies.mono,
              fontSize: 34,
              fontWeight: 600,
              color: product.text,
            }}
          >
            {scene.cta.url}
          </div>
          {scene.cta.action && (
            <div style={{ fontFamily: fontFamilies.sans, fontSize: 26, fontWeight: 500, color: product.muted }}>
              {scene.cta.action}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
