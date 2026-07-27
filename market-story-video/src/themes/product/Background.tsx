import React from "react";
import { AbsoluteFill } from "remotion";
import { product } from "../../tokens";

// Same warm-black stage as noir, so a feature reel and a market story read as the same
// publisher rather than as two different accounts. The nebula sits slightly higher and tighter
// than noir's because a product reel's hero is the device frame in the middle of the canvas,
// and a wide top glow behind it flattens the bezel's edge.
export const ProductBackground: React.FC = () => (
  <AbsoluteFill style={{ background: product.bg }}>
    <AbsoluteFill style={{ backgroundImage: product.nebula }} />
    <AbsoluteFill style={{ backgroundImage: product.dots, backgroundSize: "30px 30px", opacity: 0.4 }} />
  </AbsoluteFill>
);
