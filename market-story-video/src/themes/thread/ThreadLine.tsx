import React, { useId } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { thread } from "../../tokens";
import { Logo } from "../../components/Logo";

// Deterministic (no Math.random — Remotion renders frames out of order across worker
// processes, so the path shape must be a pure function of position, not chance) gentle
// left-right wobble, matching the wandering dotted "thread" that runs through the whole
// indonesia-msci-connected.mp4 reference, tying every beat to the one continuous line.
//
// The thread runs down the LEFT GUTTER, not the centre. It draws for the full duration of
// the video underneath every scene, so a centred path put its dots and its 56px logo
// markers straight through kickers, headlines and chart bars — a frosted panel behind the
// headline hid some of that but nothing protected a chart or an eyebrow label. Keeping the
// whole path (wobble included) inside the margin left of SAFE.x means it can never collide
// with scene content, whatever role that scene renders.
function pathX(t: number, centerX: number, amplitude: number, waves: number, phase: number): number {
  return centerX + amplitude * Math.sin(t * Math.PI * 2 * waves + phase);
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
  centerX?: number;
  amplitude?: number;
  waves?: number;
}

const SAMPLES = 60;

export const ThreadLine: React.FC<ThreadLineProps> = ({
  width,
  height,
  totalFrames,
  markers,
  centerX = 46,
  amplitude = 16,
  waves = 2.4,
}) => {
  const frame = useCurrentFrame();
  const clipId = useId();
  const phase = 0.6;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES;
    points.push({ x: pathX(t, centerX, amplitude, waves, phase), y: t * height });
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
        const x = pathX(t, centerX, amplitude, waves, phase);
        // Keep the first and last markers fully on canvas — a marker at t=0 or t=1 would
        // otherwise sit half off the top or bottom edge and read as a rendering slip.
        const markerSize = m.kind === "logo" ? 44 : 18;
        const y = Math.min(Math.max(t * height, markerSize / 2 + 10), height - markerSize / 2 - 10);
        const opacity = interpolate(frame - m.atFrame, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(frame - m.atFrame, [0, 14], [0.4, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        // Sized to fit the gutter: a logo marker spans centerX ± (amplitude + size/2), which
        // has to stay clear of the 900px-wide chart box starting at x=90.
        const size = markerSize;
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
