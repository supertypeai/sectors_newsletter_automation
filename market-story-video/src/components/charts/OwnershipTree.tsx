import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Logo } from "../Logo";

export interface OwnershipNode {
  ticker?: string; // drives the logo lookup; omit for a non-listed holding entity
  name: string;
  sub?: string; // e.g. "the Indomie maker"
}

export interface OwnershipLink {
  pct: string; // pre-formatted, e.g. "80%"
}

export interface OwnershipTreeProps {
  nodes: OwnershipNode[]; // top to bottom, length = links.length + 1
  links: OwnershipLink[];
  accentColor: string; // the "owns X%" figure color
  nameColor: string;
  subColor: string;
  lineColor: string;
  logoSize?: number;
  delay?: number;
  staggerFrames?: number;
  fontFamily?: string;
  monoFontFamily?: string;
}

// A parent -> child (-> grandchild) ownership chain, one node per row connected by a
// vertical rule labeled with the ownership %, matching the "Who owns the noodle maker"
// beat in indofood-empire.mp4. Nodes reveal top-to-bottom in sequence.
export const OwnershipTree: React.FC<OwnershipTreeProps> = ({
  nodes,
  links,
  accentColor,
  nameColor,
  subColor,
  lineColor,
  logoSize = 64,
  delay = 0,
  staggerFrames = 16,
  fontFamily,
  monoFontFamily,
}) => {
  const frame = useCurrentFrame();
  if (nodes.length !== links.length + 1) {
    throw new Error("OwnershipTree: nodes.length must be links.length + 1.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      {nodes.map((node, i) => {
        const nodeDelay = delay + i * staggerFrames;
        const opacity = interpolate(frame - nodeDelay, [0, 12], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const link = links[i - 1];
        return (
          <React.Fragment key={i}>
            {link && (
              <div
                style={{
                  opacity,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                <div style={{ width: 2, height: 22, background: lineColor }} />
                <div style={{ fontFamily: monoFontFamily, fontWeight: 700, fontSize: 28, color: accentColor }}>
                  owns {link.pct}
                </div>
                <div style={{ width: 2, height: 22, background: lineColor }} />
              </div>
            )}
            <div style={{ opacity, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              {node.ticker && <Logo ticker={node.ticker} size={logoSize} radius={logoSize / 2} />}
              <div style={{ fontFamily, fontWeight: 700, fontSize: 28, color: nameColor, textAlign: "center" }}>
                {node.name}
              </div>
              {node.sub && (
                <div style={{ fontFamily, fontSize: 22, color: subColor, textAlign: "center" }}>{node.sub}</div>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};
