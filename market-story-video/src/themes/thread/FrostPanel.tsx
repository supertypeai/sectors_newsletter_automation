import React from "react";

// A frosted-glass backdrop behind headline/stat text. The thread line and its logo markers
// draw continuously through the whole video, including straight through the centered text
// column (see ThreadLine's amplitude) — a translucent blurred panel fully occludes whatever
// passes behind it, which is a more robust fix than a text-shadow/drop-shadow halo (which
// only softens the collision, it doesn't hide it).
export const ThreadFrostPanel: React.FC<{
  children: React.ReactNode;
  opacity?: number;
  transform?: string;
  maxWidth?: number;
}> = ({ children, opacity = 1, transform, maxWidth = 880 }) => (
  <div
    style={{
      display: "inline-block",
      backgroundColor: "rgba(243,238,229,0.82)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      borderRadius: 32,
      padding: "22px 40px",
      maxWidth,
      opacity,
      transform,
    }}
  >
    {children}
  </div>
);
