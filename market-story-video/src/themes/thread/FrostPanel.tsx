import React from "react";

// A frosted-glass backdrop behind headline/stat text, lifting it off the paper grid.
//
// It also used to be the only defence against the thread line, which drew through the centred
// text column for the whole runtime. That is no longer its job: ThreadLine now runs in the
// left gutter and cannot reach scene content, which fixes the collisions a panel could never
// cover anyway (chart bars, axis labels, kickers). Keep the panel for the depth it gives the
// type, not as collision insurance.
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
