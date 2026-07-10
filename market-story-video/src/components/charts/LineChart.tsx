import React, { useId } from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface LineChartPoint {
  x: number;
  y: number;
}

export interface LineChartProps {
  values: number[];
  width: number;
  height: number;
  lineColor: string;
  areaFromColor?: string; // area fill gradient top color (near the line)
  areaToColor?: string; // area fill gradient bottom color (transparent-ish)
  peakLabel?: string; // e.g. "ATH 9,174" — placed above the highest point
  peakLabelColor?: string;
  lowLabel?: string; // e.g. "Rp 775 · 8 Jun" — placed below the lowest point
  lowLabelColor?: string;
  endLabel?: string; // e.g. "Rp 940 · now" — placed next to the current/last point
  endLabelColor?: string;
  endDotColor?: string;
  delay?: number; // frames before the draw-on starts
  drawFrames?: number; // how many frames the draw-on animation takes
  strokeWidth?: number;
  fontFamily?: string;
}

// A single-series line/area chart that draws itself on, left to right, the way the
// indonesia-msci-connected.mp4 reference draws its price line directly on the paper (no
// axes, no box — the line and its peak/end annotations ARE the chart). Used by both themes;
// callers pass the palette.
export const LineChart: React.FC<LineChartProps> = ({
  values,
  width,
  height,
  lineColor,
  areaFromColor,
  areaToColor = "transparent",
  peakLabel,
  peakLabelColor = lineColor,
  lowLabel,
  lowLabelColor = lineColor,
  endLabel,
  endLabelColor = lineColor,
  endDotColor = lineColor,
  delay = 0,
  drawFrames = 36,
  strokeWidth = 6,
  fontFamily,
}) => {
  const frame = useCurrentFrame();
  const gradId = useId();
  const clipId = useId();

  const progress = interpolate(frame - delay, [0, drawFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (values.length < 2) {
    throw new Error("LineChart requires at least 2 values.");
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const padTop = peakLabel ? 56 : 12;
  const padBottom = lowLabel ? 56 : 12;
  const plotH = height - padTop - padBottom;

  const points: LineChartPoint[] = values.map((v, i) => ({
    x: (i / (values.length - 1)) * width,
    y: padTop + (1 - (v - min) / span) * plotH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  const peakIndex = values.indexOf(max);
  const peakPoint = points[peakIndex];
  const lowIndex = values.indexOf(min);
  const lowPoint = points[lowIndex];
  const endPoint = points[points.length - 1];

  // reveal width follows draw progress; peak/low label / end dot only show once the line has
  // actually reached that x position, not just when progress > 0.
  const revealW = width * progress;
  const peakVisible = peakPoint.x <= revealW + 2;
  const lowVisible = lowPoint.x <= revealW + 2;
  const endVisible = progress > 0.97;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      <defs>
        {areaFromColor && (
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={areaFromColor} stopOpacity={0.35} />
            <stop offset="100%" stopColor={areaToColor} stopOpacity={0} />
          </linearGradient>
        )}
        <clipPath id={clipId}>
          <rect x={0} y={0} width={revealW} height={height} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {areaFromColor && <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {peakVisible && peakLabel && (
        <text
          x={Math.min(Math.max(peakPoint.x, 60), width - 60)}
          y={padTop - 22}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontWeight={700}
          fontSize={26}
          fill={peakLabelColor}
        >
          {peakLabel}
        </text>
      )}
      {lowVisible && lowLabel && (
        <text
          x={Math.min(Math.max(lowPoint.x, 60), width - 60)}
          y={lowPoint.y + 40}
          textAnchor="middle"
          fontFamily={fontFamily}
          fontWeight={700}
          fontSize={26}
          fill={lowLabelColor}
        >
          {lowLabel}
        </text>
      )}
      {endVisible && (
        <circle cx={endPoint.x} cy={endPoint.y} r={9} fill={endDotColor} />
      )}
      {endVisible && endLabel && (
        <text
          x={Math.min(endPoint.x, width - 8)}
          y={endPoint.y < height / 2 ? endPoint.y + 44 : endPoint.y - 24}
          textAnchor="end"
          fontFamily={fontFamily}
          fontWeight={700}
          fontSize={26}
          fill={endLabelColor}
        >
          {endLabel}
        </text>
      )}
    </svg>
  );
};
