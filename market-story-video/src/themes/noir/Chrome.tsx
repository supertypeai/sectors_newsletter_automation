import React from "react";
import { AbsoluteFill } from "remotion";
import { noir, SAFE } from "../../tokens";
import { fontFamilies } from "../../fonts";
import { BrandBadge } from "../../components/BrandMark";

// Persistent overlay across the ENTIRE video (not per-scene): the brand badge top-right and
// the dated source line bottom-left, exactly as seen throughout indofood-empire.mp4. This is
// data-quality.md's "show the date" rule made mechanical for video the same way asOf is for
// carousel slides — one stamp for the whole piece since all figures share one draw date.
export const NoirChrome: React.FC<{ sourceDate?: string }> = ({ sourceDate }) => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: SAFE.top - 60, right: SAFE.x }}>
      <BrandBadge iconSize={30} tone="light" />
    </div>
    {sourceDate && (
      <div
        style={{
          position: "absolute",
          bottom: SAFE.bottom - 180,
          left: SAFE.x,
          fontFamily: fontFamilies.mono,
          fontSize: 18,
          color: noir.dim,
        }}
      >
        Source: sectors.app · as of {sourceDate}
      </div>
    )}
  </AbsoluteFill>
);
