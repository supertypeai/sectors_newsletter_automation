import React from "react";
import { fontFamilies } from "../fonts";

// Inlined from assets/brand/sectors-mark.svg (official artwork) so the outro/chrome never
// depends on Remotion's public/staticFile serving — it's a handful of paths, safe to embed.
export const BrandMarkIcon: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size * (789.8 / 653.7)}
    viewBox="0 0 653.7 789.8"
    role="img"
    aria-label="Sectors"
  >
    <defs>
      <linearGradient id="sm-bar-mid" gradientUnits="userSpaceOnUse" x1="0" y1="394.9245" x2="653.6682" y2="394.9245">
        <stop offset="0" stopColor="#E11D48" />
        <stop offset="0.2463" stopColor="#E62D3E" />
        <stop offset="0.7285" stopColor="#F25826" />
        <stop offset="1" stopColor="#F97316" />
      </linearGradient>
      <linearGradient id="sm-bar-top" gradientUnits="userSpaceOnUse" x1="0.1532" y1="158.3701" x2="653.6682" y2="158.3701">
        <stop offset="0" stopColor="#E11D48" stopOpacity="0.7" />
        <stop offset="1" stopColor="#E11D48" />
      </linearGradient>
      <linearGradient id="sm-bar-bot" gradientUnits="userSpaceOnUse" x1="0.0766" y1="635.0032" x2="653.5916" y2="635.0032">
        <stop offset="0" stopColor="#F97316" />
        <stop offset="1" stopColor="#F97316" stopOpacity="0.7" />
      </linearGradient>
    </defs>
    <rect y="299.6" width="653.7" height="190.7" opacity="0.75" fill="url(#sm-bar-mid)" />
    <polygon points="653.7,204.3 0.2,303.1 0.2,112.5 653.7,13.6" fill="url(#sm-bar-top)" />
    <polygon points="653.6,680.9 0.1,779.8 0.1,589.1 653.6,490.3" fill="url(#sm-bar-bot)" />
    <path fill="#E0003B" d="M18.2,517.5H9.1c-5,0-9.1-4.1-9.1-9.1V90.8c0-5,4.1-9.1,9.1-9.1h9.1c5,0,9.1,4.1,9.1,9.1v417.6C27.2,513.4,23.2,517.5,18.2,517.5z" />
    <path fill="#F76400" d="M644.6,708.1h-9.1c-5,0-9.1-4.1-9.1-9.1V281.4c0-5,4.1-9.1,9.1-9.1h9.1c5,0,9.1,4.1,9.1,9.1v417.6C653.7,704.1,649.6,708.1,644.6,708.1z" />
    <path fill="#F76400" d="M18.2,789.8H9.1c-5,0-9.1-4.1-9.1-9.1V581c0-5,4.1-9.1,9.1-9.1h9.1c5,0,9.1,4.1,9.1,9.1v199.7C27.2,785.8,23.2,789.8,18.2,789.8z" />
    <path fill="#E0003B" d="M644.6,217.9h-9.1c-5,0-9.1-4.1-9.1-9.1V9.1c0-5,4.1-9.1,9.1-9.1h9.1c5,0,9.1,4.1,9.1,9.1v199.7C653.7,213.8,649.6,217.9,644.6,217.9z" />
  </svg>
);

// Small persistent corner badge (icon + "Sectors" wordmark), as seen top-right in the
// indofood-empire.mp4 reference. `tone` controls wordmark color for the light "thread" theme
// vs. the dark "noir" theme.
export const BrandBadge: React.FC<{ iconSize?: number; tone?: "light" | "dark" }> = ({
  iconSize = 26,
  tone = "light",
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
    <BrandMarkIcon size={iconSize} />
    <span
      style={{
        fontFamily: fontFamilies.sans,
        fontWeight: 700,
        fontSize: iconSize * 0.5,
        color: tone === "light" ? "#F6F1EE" : "#211B15",
        letterSpacing: "-0.01em",
      }}
    >
      Sectors
    </span>
  </div>
);
