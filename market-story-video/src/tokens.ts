// Design tokens for both visual themes. "noir" is ported 1:1 from sectors-carousel's
// assets/styles/theme.css (the dark, warm-black brand). "thread" is reverse-engineered from
// the light-paper "connected dots" reference video (indonesia-msci-connected.mp4). See
// references/themes.md for when to pick which. Keep noir in sync with the carousel skill's
// theme.css by hand; there is no build step linking them.
export const noir = {
  bg: "#0C0A09",
  surface: "#1E1916",
  surface2: "#14100E",
  text: "#F6F1EE",
  muted: "#A99F99",
  dim: "#6E6661",
  brandPink: "#E5337E",
  brandGold: "#DF9439",
  gain: "#1FB36A",
  loss: "#E0003B",
  peerBlue: "#7C93C9",
  peerPlum: "#9B7EBD",
  border: "rgba(246,241,238,0.12)",
  glassBg: "rgba(28,23,20,0.42)",
  glassBorder: "rgba(246,241,238,0.14)",
  nebula: "radial-gradient(ellipse 80% 45% at 50% 0%, rgba(229,51,126,0.22), transparent 70%)",
  dots: "radial-gradient(circle, rgba(246,241,238,0.10) 1.5px, transparent 1.5px)",
} as const;

export const thread = {
  bg: "#F3EEE5",
  ink: "#211B15",
  muted: "#6B6259",
  dim: "#9A9086",
  brandPink: "#E5337E",
  brandGold: "#DF9439",
  gain: "#1D8A4E",
  loss: "#D6295A",
  gridLine: "rgba(33,27,21,0.08)",
  threadLine: "rgba(33,27,21,0.35)",
  pillDark: "#211B15",
} as const;

export const gradient = "linear-gradient(to right, #E5337E 0%, #DF9439 100%)";
export const peerColorsNoir = [noir.muted, noir.peerBlue, noir.peerPlum] as const;

// canvas: portrait video (Reels/TikTok/Shorts), 1080x1920, 30fps. A short (10-15s) story
// is 300-450 frames at this rate; a long-form (~45-75s) story is 1350-2250 frames.
export const CANVAS = { width: 1080, height: 1920, fps: 30 } as const;

// safe area: keep on-screen text clear of native platform UI (Reels caption bar bottom,
// profile/like column right/bottom). Wider than the carousel's 120px bottom margin because
// Reels/TikTok/Shorts chrome eats more of the frame than a static IG carousel post does.
export const SAFE = { top: 140, bottom: 260, x: 76 } as const;

// motion vocabulary — see references/motion.md for the rationale. Centralized so every
// scene's timing reads as one system rather than each component inventing its own.
export const MOTION = {
  enterFrames: 14, // ~0.47s @30fps — headline/logo/stat entrance
  staggerFrames: 4, // gap between successive word/element entrances
  exitFrames: 10, // ~0.33s @30fps — scene-out fade, avoids a hard cut
  springConfig: { damping: 200, mass: 0.6, stiffness: 210 },
} as const;
