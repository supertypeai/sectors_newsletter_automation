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

export type BreakdownSpec =
  | { kind: "list"; items: { label: string; sub?: string }[] }
  | { kind: "ownership"; nodes: OwnershipNode[]; links: OwnershipLink[] };

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

export type SceneRole = "cover" | "stat" | "chart" | "breakdown" | "takeaway";

export interface Scene {
  role: SceneRole;
  duration: number; // seconds; sum of all scenes + outro must land the story's target length (storyboard.length)
  kicker?: string;
  headline?: string;
  emphasis?: string; // must be an exact substring of headline — see EmphasizedHeadline
  body?: string;
  tickers?: string[]; // tickers this scene names — drives the logo(s) shown AND (thread theme) the thread's logo-track markers for this scene
  coverLogos?: string[]; // cover role only: the full logo row to display, decoupled from `tickers` so a cover showing every ticker in the piece doesn't also front-load every marker onto the thread track
  stat?: StatSpec;
  chart?: ChartSpec;
  breakdown?: BreakdownSpec;
  badges?: Badge[]; // "thread" theme only: stacked pill call-outs (thread.md)
  marker?: { kind: "dot" | "logo"; color?: BadgeColor }; // "thread" theme only: the bead on the thread line for this scene
}

export interface OutroSpec {
  headline: string;
  emphasis?: string;
  tagline?: string; // e.g. "Trace the ownership on sectors.app"
}

export interface Storyboard {
  theme: "noir" | "thread";
  length?: "short" | "long"; // "short" (10-15s, default) or "long" (~45-75s) — see storyboard-format.md
  tickers: string[]; // every ticker the piece is about
  sourceDate?: string; // bare date, e.g. "17 Jun 2026" — stamped once for the whole video
  outro?: OutroSpec | false; // false to suppress; default outro used if omitted
  scenes: Scene[];
}
