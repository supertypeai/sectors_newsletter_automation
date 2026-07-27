import React from "react";
import { AbsoluteFill } from "remotion";
import { HumanSlot as HumanSlotSpec } from "../types";
import { product, PIP, SAFE } from "../tokens";
import { fontFamilies } from "../fonts";

// The talking-head corner. Two jobs, neither of them compositing video:
//
//   1. RESERVE — every scene's copy gets padded out of the slot's band, so a headline written
//      today still clears a face filmed next week. The reservation is applied to the WHOLE
//      video rather than only the scenes the presenter appears in, because copy that jumps
//      up and down between cuts reads as a layout bug even when each frame is individually fine.
//   2. GUIDE — in a --stills/draft pass, draw a dashed box at the exact size and position the
//      clip must land in, so framing is checkable before anything is filmed. The delivered MP4
//      renders the area empty; the clip is dropped in downstream, in the editor.
//
// See references/voiceover.md for why this skill stops at the script and the empty slot.

export function resolveSlot(slot: HumanSlotSpec | false | undefined) {
  if (!slot) return null;
  return {
    corner: slot.corner ?? "bottom-left",
    size: slot.size ?? PIP.size,
    shape: slot.shape ?? "circle",
    reserve: slot.reserve !== false,
    note: slot.note,
  };
}

// Extra padding a scene layout must add so no copy lands under the slot.
export function reservedPadding(slot: HumanSlotSpec | false | undefined): { top: number; bottom: number } {
  const resolved = resolveSlot(slot);
  if (!resolved || !resolved.reserve) return { top: 0, bottom: 0 };
  const band = resolved.size + PIP.gap;
  return resolved.corner.startsWith("top") ? { top: band, bottom: 0 } : { top: 0, bottom: band };
}

export const ReservedPaddingContext = React.createContext<{ top: number; bottom: number }>({ top: 0, bottom: 0 });

export function useReservedPadding() {
  return React.useContext(ReservedPaddingContext);
}

function position(corner: string, size: number): React.CSSProperties {
  const inset = PIP.margin;
  const vertical = corner.startsWith("top") ? { top: SAFE.top - 20 + inset } : { bottom: SAFE.bottom - 120 + inset };
  const horizontal = corner.endsWith("left") ? { left: SAFE.x + inset } : { right: SAFE.x + inset };
  return { position: "absolute", width: size, height: size, ...vertical, ...horizontal };
}

export const HumanSlotGuide: React.FC<{ slot: HumanSlotSpec | false | undefined }> = ({ slot }) => {
  const resolved = resolveSlot(slot);
  if (!resolved) return null;
  const { corner, size, shape } = resolved;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          ...position(corner, size),
          borderRadius: shape === "circle" ? "50%" : 44,
          border: `${PIP.ringWidth}px dashed ${product.calloutRing}`,
          background: "rgba(229,51,126,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textAlign: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            fontFamily: fontFamilies.mono,
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: product.brandPink,
          }}
        >
          Talking head
        </div>
        <div style={{ fontFamily: fontFamilies.sans, fontSize: 19, fontWeight: 500, color: product.muted, lineHeight: 1.25 }}>
          {size}px {shape}
        </div>
      </div>
    </AbsoluteFill>
  );
};
