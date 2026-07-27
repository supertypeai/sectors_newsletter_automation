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
  // Cream-colored halo behind headline/stat text so the thread line and its markers, which
  // pass directly through the centered text column (see ThreadLine's amplitude), never
  // visually blend into a letter or digit sitting on top of them. A `filter: drop-shadow`
  // (not `text-shadow`) — drop-shadow follows the element's actual rendered alpha, so a
  // gradient-clipped, color-transparent emphasis word still shows its gradient; text-shadow
  // instead fills the whole transparent glyph with the shadow color, erasing the gradient.
  textHalo: "drop-shadow(0 0 6px #F3EEE5) drop-shadow(0 0 10px #F3EEE5)",
} as const;

// "product" is the feature-promo system: the same warm-black brand shell as noir (so a feature
// reel and a market story read as the same publisher) plus the things a market story never
// needs — a device frame to hold real app footage, callout pills that point into that footage,
// and a reserved corner for a talking head. Palette is deliberately identical to noir; only the
// hardware/annotation tokens below are new. See references/themes.md and references/product-reel.md.
export const product = {
  bg: noir.bg,
  surface: noir.surface,
  surface2: noir.surface2,
  text: noir.text,
  muted: noir.muted,
  dim: noir.dim,
  brandPink: noir.brandPink,
  brandGold: noir.brandGold,
  border: noir.border,
  glassBg: "rgba(28,23,20,0.62)",
  glassBorder: "rgba(246,241,238,0.16)",
  nebula: "radial-gradient(ellipse 92% 38% at 50% 6%, rgba(229,51,126,0.20), transparent 72%)",
  dots: noir.dots,
  // device frame: the bezel holding a screen recording or screenshot of the app
  deviceBezel: "#161210",
  deviceEdge: "rgba(246,241,238,0.16)",
  deviceInner: "rgba(246,241,238,0.08)",
  deviceGlow: "0 40px 120px rgba(0,0,0,0.55), 0 0 90px rgba(229,51,126,0.16)",
  deviceChrome: "#221C18",
  // annotation layer drawn on top of the footage
  calloutBg: "rgba(20,16,14,0.92)",
  calloutRing: "rgba(229,51,126,0.9)",
  cursor: "#F6F1EE",
} as const;

// The reserved talking-head corner. This skill does NOT composite footage — it reserves the
// space, keeps every scene's copy out of it, and renders a dashed guide in draft/stills so the
// framing is checkable before filming. The clip gets dropped in downstream, in the editor.
// Sized in canvas px (1080-wide) so it matches what SAFE/`SceneLayout` already speak.
export const PIP = {
  size: 320, // default box edge; storyboard.humanSlot.size overrides
  margin: 48, // gap from the safe-area edge, not from the raw canvas edge
  ringWidth: 5,
  gap: 40, // extra breathing room between the slot and the nearest copy
} as const;

export const gradient = "linear-gradient(to right, #E5337E 0%, #DF9439 100%)";
export const peerColorsNoir = [noir.muted, noir.peerBlue, noir.peerPlum] as const;

// canvas: portrait video (Reels/TikTok/Shorts), 1080x1920, 30fps. A short (10-15s) story
// is 300-450 frames at this rate; a long-form (~45-75s) story is 1350-2250 frames; a product
// feature reel (12-18s) is 360-540 frames.
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
