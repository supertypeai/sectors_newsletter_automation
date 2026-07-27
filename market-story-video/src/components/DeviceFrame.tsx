import React from "react";
import { Img, OffthreadVideo, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Callout, CursorKeyframe, FocusPoint, MediaSpec } from "../types";
import { product, MOTION } from "../tokens";
import { fontFamilies } from "../fonts";

// The hardware the app footage sits in, plus the annotation layer drawn on top of it.
//
// Why a frame at all: a raw screen recording pasted edge to edge on a 9:16 canvas reads as
// someone's screenshot, not as a product. A bezel says "this is the app" in the first frame,
// and it gives callouts an edge to hang off. The frame is brand furniture, so it lives here
// rather than being restyled per scene.
//
// Coordinates: every anchor/focus/cursor point in the storyboard is a 0-1 fraction of the
// SCREEN box (the area inside the bezel), never of the 1080x1920 canvas. That way a callout
// pinned at {x:0.62,y:0.38} stays on the same pixel of the app no matter which device frame
// the scene picked or how the frame gets sized.

const DEVICE_SIZES = {
  browser: { width: 928, screenHeight: 580, chromeHeight: 56, radius: 26 },
  phone: { width: 452, screenHeight: 980, chromeHeight: 0, radius: 44 },
  bare: { width: 928, screenHeight: 522, chromeHeight: 0, radius: 22 },
} as const;

function focusStyle(f: FocusPoint | undefined): React.CSSProperties {
  if (!f) return {};
  return {
    transform: `scale(${f.zoom ?? 1})`,
    transformOrigin: `${f.x * 100}% ${f.y * 100}%`,
  };
}

// Ease between two focus points across the scene. Cubic in-out rather than linear: a Ken Burns
// move that starts and stops abruptly reads as a glitch, not a camera.
function usePannedFocus(media: MediaSpec, durationInFrames: number): FocusPoint | undefined {
  const frame = useCurrentFrame();
  if (!media.pan) return media.focus;
  const t = interpolate(frame, [0, Math.max(durationInFrames - 1, 1)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const { from, to } = media.pan;
  return {
    x: from.x + (to.x - from.x) * eased,
    y: from.y + (to.y - from.y) * eased,
    zoom: (from.zoom ?? 1) + ((to.zoom ?? 1) - (from.zoom ?? 1)) * eased,
  };
}

// A callout is a sibling of the media, not a child of it, so it does not inherit the media's
// zoom transform — which would leave a ring pinned to the search bar sliding off the search bar
// the moment the scene pushes in. Applying the same transform to the anchor point by hand keeps
// the ring locked to its pixel while the pill's own text stays at a readable, unscaled size.
function project(point: { x: number; y: number }, focus: FocusPoint | undefined) {
  if (!focus) return point;
  const z = focus.zoom ?? 1;
  return { x: focus.x + (point.x - focus.x) * z, y: focus.y + (point.y - focus.y) * z };
}

const MediaSurface: React.FC<{ media: MediaSpec; focus: FocusPoint | undefined }> = ({ media, focus }) => {
  const { fps } = useVideoConfig();
  const src = staticFile(media.resolved ?? media.src);
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: media.fit ?? "cover",
    ...focusStyle(focus),
  };
  if (media.kind === "shot") {
    return <Img src={src} style={style} />;
  }
  const trim = media.trim;
  return (
    <OffthreadVideo
      src={src}
      muted
      startFrom={trim ? Math.round(trim[0] * fps) : undefined}
      endAt={trim ? Math.round(trim[1] * fps) : undefined}
      style={style}
    />
  );
};

const BrowserChrome: React.FC<{ url?: string; height: number }> = ({ url, height }) => (
  <div
    style={{
      height,
      background: product.deviceChrome,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 20px",
      borderBottom: `1px solid ${product.deviceInner}`,
    }}
  >
    {["#4A403B", "#4A403B", "#4A403B"].map((c, i) => (
      <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />
    ))}
    {url && (
      <div
        style={{
          marginLeft: 12,
          flex: 1,
          height: 30,
          borderRadius: 15,
          background: product.surface2,
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          fontFamily: fontFamilies.mono,
          fontSize: 17,
          color: product.dim,
        }}
      >
        {url}
      </div>
    )}
  </div>
);

export const DeviceFrame: React.FC<{
  media: MediaSpec;
  durationInFrames: number;
  callouts?: Callout[];
  cursor?: CursorKeyframe[];
}> = ({ media, durationInFrames, callouts, cursor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const device = media.device ?? "browser";
  const size = DEVICE_SIZES[device];
  const focus = usePannedFocus(media, durationInFrames);
  const enter = spring({ frame, fps, config: MOTION.springConfig, from: 0.94, to: 1 });
  const opacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The wrapper carries the entrance transform but is NOT clipped, so a callout label pinned
  // near an edge can spill past the bezel instead of being cut off. Only the hardware (bezel +
  // chrome + screen) is clipped, to keep the rounded corners and stop a zoomed pan bleeding
  // over the frame. The annotation layer is positioned exactly over the screen box (below the
  // chrome), so a 0-1 anchor still lands on the same app pixel.
  return (
    <div style={{ position: "relative", width: size.width, alignSelf: "center", transform: `scale(${enter})`, opacity }}>
      <div
        style={{
          borderRadius: size.radius,
          background: product.deviceBezel,
          border: `1px solid ${product.deviceEdge}`,
          boxShadow: product.deviceGlow,
          overflow: "hidden",
        }}
      >
        {device === "browser" && <BrowserChrome url={media.url} height={size.chromeHeight} />}
        <div style={{ position: "relative", height: size.screenHeight, overflow: "hidden", background: product.surface2 }}>
          <MediaSurface media={media} focus={focus} />
          {/* top glare: a single soft highlight so the screen reads as glass, not a flat rectangle */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(160deg, rgba(246,241,238,0.10) 0%, rgba(246,241,238,0) 42%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: size.chromeHeight, height: size.screenHeight }}>
        {cursor && cursor.length > 0 && <CursorLayer keyframes={cursor} focus={focus} />}
        {(callouts ?? []).map((c, i) => (
          <CalloutPill key={i} callout={c} focus={focus} />
        ))}
      </div>
    </div>
  );
};

// A ring pinned into the footage plus a pill naming what the viewer is looking at. The ring
// pulses once on entry and then holds — a callout that keeps pulsing competes with the app it
// is pointing at.
const CalloutPill: React.FC<{ callout: Callout; focus?: FocusPoint }> = ({ callout, focus }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = Math.round(callout.at * fps);
  const local = frame - start;
  if (local < 0) return null;
  const scale = spring({ frame: local, fps, config: MOTION.springConfig, from: 0.7, to: 1 });
  const opacity = interpolate(local, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = interpolate(local, [0, 10, 22], [1, 1.35, 1], { extrapolateRight: "clamp" });
  const anchor = project(callout.anchor, focus);
  const side = callout.side ?? "right";
  const pillPosition: React.CSSProperties =
    side === "left"
      ? { right: "calc(100% + 26px)" }
      : side === "above"
        ? { bottom: "calc(100% + 22px)", left: "50%", transform: "translateX(-50%)" }
        : side === "below"
          ? { top: "calc(100% + 22px)", left: "50%", transform: "translateX(-50%)" }
          : { left: "calc(100% + 26px)" };

  return (
    <div
      style={{
        position: "absolute",
        left: `${anchor.x * 100}%`,
        top: `${anchor.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: "50%",
          border: `3px solid ${product.calloutRing}`,
          transform: `scale(${pulse})`,
          boxShadow: "0 0 24px rgba(229,51,126,0.55)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          whiteSpace: "nowrap",
          ...pillPosition,
          ...(side === "left" || side === "right" ? { transform: "translateY(-50%)" } : {}),
          background: product.calloutBg,
          border: `1px solid ${product.glassBorder}`,
          borderRadius: 999,
          padding: "10px 20px",
          fontFamily: fontFamilies.sans,
          fontSize: 24,
          fontWeight: 600,
          color: product.text,
        }}
      >
        {callout.text}
      </div>
    </div>
  );
};

// A synthetic pointer walking a keyframed path. Mainly for `kind: "shot"`, where there is no
// recorded cursor to follow — it is what makes a still read as an interaction rather than a
// screenshot. On a real recording the footage already has a cursor, so adding a second one is
// a bug, not a flourish.
const CursorLayer: React.FC<{ keyframes: CursorKeyframe[]; focus?: FocusPoint }> = ({ keyframes, focus }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const sorted = [...keyframes]
    .sort((a, b) => a.at - b.at)
    .map((k) => ({ ...k, ...project({ x: k.x, y: k.y }, focus) }));
  // interpolate() needs at least two strictly increasing stops; a single keyframe is a valid
  // authoring choice (park the pointer somewhere) and must not throw.
  const single = sorted.length < 2;
  const times = sorted.map((k) => k.at);
  const x = single ? sorted[0].x : interpolate(t, times, sorted.map((k) => k.x), { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = single ? sorted[0].y : interpolate(t, times, sorted.map((k) => k.y), { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(t, [sorted[0].at - 0.25, sorted[0].at], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {sorted
        .filter((k) => k.click)
        .map((k, i) => {
          const local = t - k.at;
          if (local < 0 || local > 0.7) return null;
          const r = interpolate(local, [0, 0.7], [10, 56]);
          const ringOpacity = interpolate(local, [0, 0.7], [0.85, 0]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${k.x * 100}%`,
                top: `${k.y * 100}%`,
                width: r * 2,
                height: r * 2,
                marginLeft: -r,
                marginTop: -r,
                borderRadius: "50%",
                border: `3px solid ${product.calloutRing}`,
                opacity: ringOpacity,
              }}
            />
          );
        })}
      <svg
        width={38}
        height={44}
        viewBox="0 0 38 44"
        style={{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, opacity, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.6))" }}
      >
        <path d="M2 2 L2 32 L10 25 L15 38 L22 35 L17 22 L28 22 Z" fill={product.cursor} stroke="#0C0A09" strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </>
  );
};
