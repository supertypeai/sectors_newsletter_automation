import React, { useId } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { thread } from "../../tokens";
import { Logo } from "../../components/Logo";

// Deterministic (no Math.random — Remotion renders frames out of order across worker
// processes, so the path shape must be a pure function of position, not chance) gentle
// left-right wobble, matching the wandering dotted "thread" that runs through the whole
// indonesia-msci-connected.mp4 reference, tying every beat to the one continuous line.
function pathX(t: number, width: number, amplitude: number, waves: number, phase: number): number {
  return width / 2 + amplitude * Math.sin(t * Math.PI * 2 * waves + phase);
}

export interface ThreadMarker {
  atFrame: number; // absolute composition frame this beat's marker appears at
  kind: "dot" | "logo";
  color?: string;
  ticker?: string;
}

export interface ThreadLineProps {
  width: number;
  height: number;
  totalFrames: number;
  markers: ThreadMarker[];
  amplitude?: number;
  waves?: number;
}

const SAMPLES = 60;

export const ThreadLine: React.FC<ThreadLineProps> = ({
  width,
  height,
  totalFrames,
  markers,
  amplitude = 90,
  waves = 2.4,
}) => {
  const frame = useCurrentFrame();
  const clipId = useId();
  const phase = 0.6;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    points.push({ x: pathX(t, width, amplitude, waves, phase), y: t * height });
  }
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");

  const progress = interpolate(frame, [0, totalFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={width} height={height * progress} />
          </clipPath>
        </defs>
        <path
          d={path}
          fill="none"
          stroke={thread.threadLine}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="2 14"
          clipPath={`url(#${clipId})`}
        />
      </svg>
      {markers.map((m, i) => {
        const t = Math.min(1, Math.max(0, m.atFrame / totalFrames));
        const x = pathX(t, width, amplitude, waves, phase);
        const y = t * height;
        const opacity = interpolate(frame - m.atFrame, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(frame - m.atFrame, [0, 14], [0.4, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const size = m.kind === "logo" ? 56 : 22;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x - size / 2,
              top: y - size / 2,
              width: size,
              height: size,
              opacity,
              transform: `scale(${scale})`,
            }}
          >
            {m.kind === "logo" && m.ticker ? (
              <Logo ticker={m.ticker} size={size} radius={size / 2} />
            ) : (
              <div
                style={{
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: m.color ?? thread.brandPink,
                  boxShadow: `0 0 0 8px ${m.color ?? thread.brandPink}22`,
                }}
              />
            )}
          </div>
        );
      })}
    </>
  );
};
