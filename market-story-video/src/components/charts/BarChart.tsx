import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface Bar {
  label: string;
  value: number;
  display: string;
}

export interface BarChartProps {
  bars: Bar[];
  width: number;
  height: number;
  barColor: string; // solid color or CSS gradient string
  labelColor: string;
  valueColor: string;
  delay?: number;
  staggerFrames?: number;
  growFrames?: number;
  fontFamily?: string;
  monoFontFamily?: string;
}

// Sequential grow-from-baseline bar chart (one series). Each bar starts `staggerFrames`
// after the previous one, so a 3-4 bar chart reads as a small reveal sequence rather than
// one instantaneous pop.
export const BarChart: React.FC<BarChartProps> = ({
  bars,
  width,
  height,
  barColor,
  labelColor,
  valueColor,
  delay = 0,
  staggerFrames = 6,
  growFrames = 20,
  fontFamily,
  monoFontFamily,
}) => {
  const frame = useCurrentFrame();
  const max = Math.max(...bars.map((b) => b.value));
  const gap = 20;
  const barW = (width - gap * (bars.length - 1)) / bars.length;
  const plotH = height - 40; // room for the value label above each bar

  return (
    <div style={{ width, height, display: "flex", alignItems: "flex-end", gap }}>
      {bars.map((b, i) => {
        const localDelay = delay + i * staggerFrames;
        const grow = interpolate(frame - localDelay, [0, growFrames], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const barH = Math.max(0, (b.value / max) * plotH * grow);
        return (
          <div key={b.label} style={{ width: barW, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height, gap: 10 }}>
            <div
              style={{
                fontFamily: monoFontFamily,
                fontWeight: 700,
                fontSize: 26,
                color: valueColor,
                opacity: grow > 0.6 ? 1 : 0,
              }}
            >
              {b.display}
            </div>
            <div style={{ width: "56%", height: barH, borderRadius: "8px 8px 0 0", background: barColor }} />
            <div style={{ fontFamily, fontSize: 22, color: labelColor }}>{b.label}</div>
          </div>
        );
      })}
    </div>
  );
};
