import React from "react";
import { AbsoluteFill } from "remotion";
import { thread } from "../../tokens";

// Light paper + faint grid, reverse-engineered from indonesia-msci-connected.mp4. Persists
// across the whole video the same way NoirBackground does.
export const ThreadBackground: React.FC = () => (
  <AbsoluteFill style={{ background: thread.bg }}>
    <AbsoluteFill
      style={{
        backgroundImage: `linear-gradient(${thread.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${thread.gridLine} 1px, transparent 1px)`,
        backgroundSize: "72px 72px",
      }}
    />
  </AbsoluteFill>
);
