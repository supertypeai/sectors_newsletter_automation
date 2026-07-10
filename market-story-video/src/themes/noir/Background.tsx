import React from "react";
import { AbsoluteFill } from "remotion";
import { noir } from "../../tokens";

// Warm-black + top nebula glow, ported from sectors-carousel's .stage/.layer.nebula. Persists
// across the whole video (one continuous backdrop, not re-painted per scene) so scene cuts
// never flash or reset the background.
export const NoirBackground: React.FC = () => (
  <AbsoluteFill style={{ background: noir.bg }}>
    <AbsoluteFill style={{ backgroundImage: noir.nebula }} />
    <AbsoluteFill style={{ backgroundImage: noir.dots, backgroundSize: "30px 30px", opacity: 0.5 }} />
  </AbsoluteFill>
);
