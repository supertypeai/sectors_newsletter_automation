// The storyboard.json contract — theme-agnostic. Both themes (noir/thread) render the same
// scene data differently; see references/storyboard-format.md for the authored contract and
// references/themes.md for which theme fits which story shape.
export interface OwnershipNode {
  ticker?: string;
  name: string;
  sub?: string;
}

export interface OwnershipLink {
  pct: string;
}

export type ChartSpec =
  | { kind: "line"; values: number[]; peakLabel?: string; lowLabel?: string; endLabel?: string; caption?: string }
  | { kind: "bar"; bars: { label: string; value: number; display: string }[]; caption?: string };

export interface NetworkNode {
  id: string; // referenced by NetworkEdge.from/to
  ticker?: string;
  name: string;
  x: number; // 0-1, fraction of the diagram box width
  y: number; // 0-1, fraction of the diagram box height
}

export interface NetworkEdge {
  from: string; // NetworkNode.id
  to: string; // NetworkNode.id
  pct: string; // "from owns pct of to"
  reversePct?: string; // if `to` also owns a stake back in `from`, shows both on one connecting line
  reverseLast?: boolean; // hold the reverse line + label until every other edge has revealed, so it lands as its own punchline
  labelT?: number; // 0-1 position along the line for the label, default 0.5 (true midpoint) — nudge off-center to dodge another edge's label or a crossing line
}

export type BreakdownSpec =
  | { kind: "list"; items: { label: string; sub?: string }[] }
  | { kind: "ownership"; nodes: OwnershipNode[]; links: OwnershipLink[] }
  | { kind: "network"; nodes: NetworkNode[]; edges: NetworkEdge[]; closingCaption?: string }; // closingCaption syncs with the last reveal (a reverseLast edge if present)

export interface StatSpec {
  value: string;
  label: string;
  compare?: { value: string; label: string };
}

export type BadgeColor = "pink" | "gold" | "green" | "dark";

export interface Badge {
  text: string;
  color?: BadgeColor;
}

// ---- product theme (feature reels) ----------------------------------------------------
// Everything below is meaningful only when `theme: "product"`. See references/product-reel.md.

export interface FeatureSpec {
  name: string; // the feature as the product calls it, e.g. "Screener"
  promise: string; // one line, what it does for the viewer
  chips?: string[]; // up to 3 short capability tags — nouns/figures, never sentences
}

// A point of interest inside the footage, in 0-1 fractions of the DEVICE SCREEN box (not the
// canvas): {x:0.5, y:0.5} is the middle of the screen regardless of how the frame is sized.
export interface FocusPoint {
  x: number;
  y: number;
  zoom?: number; // 1 = fit as-is; 1.4-2.0 is the useful range for "look here"
}

export type MediaSpec = {
  kind: "clip" | "shot"; // clip = a screen recording (mp4/mov/webm); shot = a still (png/jpg)
  src: string; // resolved by render.mjs relative to the storyboard file, then the skill root
  device?: "browser" | "phone" | "bare"; // the frame drawn around it; default "browser"
  url?: string; // "browser" device only: what the fake address bar reads
  fit?: "cover" | "contain"; // default "cover"
  trim?: [number, number]; // clip only: [start, end] seconds into the SOURCE file
  focus?: FocusPoint; // hold this point/zoom for the whole scene
  pan?: { from: FocusPoint; to: FocusPoint }; // or ease between two — the Ken Burns move
  resolved?: string; // written by render.mjs (a staticFile path); never authored by hand
};

export interface Callout {
  at: number; // seconds into the scene when it appears
  text: string;
  anchor: { x: number; y: number }; // 0-1 of the device screen box, where the ring is pinned
  side?: "left" | "right" | "above" | "below"; // which way the pill sits off the ring; default "right"
}

export interface CursorKeyframe {
  at: number; // seconds into the scene
  x: number; // 0-1 of the device screen box
  y: number;
  click?: boolean; // draw a click ripple at this keyframe
}

export interface CtaSpec {
  url: string; // where the viewer goes, e.g. "sectors.app/screener" — no protocol, no trailing slash
  action?: string; // one short qualifier line, e.g. "Free plan, no card"
}

export type HumanCorner = "bottom-left" | "bottom-right" | "top-left" | "top-right";

// The reserved talking-head slot. This skill writes the script and holds the space; it does
// not composite footage (see references/voiceover.md).
export interface HumanSlot {
  corner?: HumanCorner; // default "bottom-left" — clear of the Reels like/share column on the right
  size?: number; // canvas px, default PIP.size (320)
  shape?: "circle" | "rounded"; // default "circle"
  reserve?: boolean; // default true — pad every scene's copy out of the slot's band
  note?: string; // direction that lands in script.md's recording notes, e.g. "half-body, plain wall"
}

export type SceneRole =
  | "cover"
  | "stat"
  | "chart"
  | "breakdown"
  | "takeaway"
  | "feature"
  | "demo"
  | "cta";

export interface Scene {
  role: SceneRole;
  duration: number; // seconds; sum of all scenes + outro must land the story's target length (storyboard.length)
  kicker?: string;
  headline?: string;
  emphasis?: string; // must be an exact substring of headline — see EmphasizedHeadline
  body?: string;
  tickers?: string[]; // tickers this scene names — drives the logo(s) shown AND (thread theme) the thread's logo-track markers for this scene
  coverLogos?: string[]; // cover role only: the full logo row to display, decoupled from `tickers` so a cover showing every ticker in the piece doesn't also front-load every marker onto the thread track
  people?: { initials: string; name: string; role?: string }[]; // cover role only: stylized monogram row standing in for a real photo (no photo asset support in this design system) — see references/scenes.md "cover"

  stat?: StatSpec;
  chart?: ChartSpec;
  breakdown?: BreakdownSpec;
  badges?: Badge[]; // "thread" theme only: stacked pill call-outs (thread.md)
  marker?: { kind: "dot" | "logo"; color?: BadgeColor }; // "thread" theme only: the bead on the thread line for this scene

  // "product" theme only — see references/product-reel.md
  feature?: FeatureSpec; // role "feature": the capability being introduced
  media?: MediaSpec; // role "demo": the recording or screenshot being shown
  callouts?: Callout[]; // role "demo": rings + pills pinned into the footage
  cursor?: CursorKeyframe[]; // role "demo": a synthetic pointer path, mainly for `kind: "shot"`
  cta?: CtaSpec; // role "cta": the destination and its one qualifier line

  // The spoken line for this scene. Never rendered on screen — it is the source `script-out.mjs`
  // compiles into the timed voiceover script the presenter reads. See references/voiceover.md.
  vo?: string;
}

export interface OutroSpec {
  headline: string;
  emphasis?: string;
  tagline?: string; // e.g. "Trace the ownership on sectors.app"
}

export interface Storyboard {
  theme: "noir" | "thread" | "product";
  length?: "short" | "long" | "reel"; // "short" (10-15s, default), "long" (~45-75s), "reel" (12-18s, product only)
  tickers?: string[]; // every ticker the piece is about — omitted by a product reel, which names none
  sourceDate?: string; // bare date, e.g. "17 Jun 2026" — stamped once for the whole video
  outro?: OutroSpec | false; // false to suppress; default outro used if omitted
  scenes: Scene[];

  // "product" theme only
  feature?: string; // the key in inputs/features.json this reel was built from — traceability, not display
  humanSlot?: HumanSlot | false; // false (or omitted) means no talking head and no reserved space
}
