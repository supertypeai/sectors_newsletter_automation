import React from "react";
import { AbsoluteFill } from "remotion";
import { SAFE } from "../../tokens";
import { BrandBadge } from "../../components/BrandMark";

// Product reels carry the brand badge but no dated source footer: there is no market figure on
// screen to date-stamp, and a stale-looking date on an evergreen feature promo shortens the
// clip's shelf life for no gain. `sourceDate` is accepted and ignored so the theme still
// satisfies the shared Chrome signature.
export const ProductChrome: React.FC<{ sourceDate?: string }> = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", top: SAFE.top - 60, right: SAFE.x }}>
      <BrandBadge iconSize={30} tone="light" />
    </div>
  </AbsoluteFill>
);
