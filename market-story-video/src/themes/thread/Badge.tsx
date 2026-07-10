import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { thread } from "../../tokens";
import { fontFamilies } from "../../fonts";
import { Badge, BadgeColor } from "../../types";

const BADGE_STYLE: Record<BadgeColor, { bg: string; fg: string }> = {
  dark: { bg: thread.pillDark, fg: "#F3EEE5" },
  pink: { bg: thread.brandPink, fg: "#FFFFFF" },
  gold: { bg: thread.brandGold, fg: "#241A0C" },
  green: { bg: thread.gain, fg: "#FFFFFF" },
};

// The stacked rounded pill call-outs from indonesia-msci-connected.mp4 ("Exchange &
// regulator chiefs resign", "Float rule 7.5% -> 15%", "Rates hiked to 5.50%") — each a
// short supporting fact in its own color-coded capsule, revealing top to bottom.
export const ThreadBadgeStack: React.FC<{ badges: Badge[]; delay?: number; stagger?: number }> = ({
  badges,
  delay = 0,
  stagger = 8,
}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      {badges.map((b, i) => {
        const localDelay = delay + i * stagger;
        const opacity = interpolate(frame - localDelay, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(frame - localDelay, [0, 12], [14, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const style = BADGE_STYLE[b.color ?? "dark"];
        return (
          <div
            key={b.text}
            style={{
              opacity,
              transform: `translateY(${y}px)`,
              background: style.bg,
              color: style.fg,
              fontFamily: fontFamilies.serifItalic,
              fontWeight: 700,
              fontSize: 28,
              padding: "12px 28px",
              borderRadius: 999,
              whiteSpace: "nowrap",
            }}
          >
            {b.text}
          </div>
        );
      })}
    </div>
  );
};
