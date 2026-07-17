import React, { useId } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Logo } from "../Logo";
import { NetworkNode, NetworkEdge } from "../../types";

export interface OwnershipNetworkProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  width: number;
  height: number;
  accentColor: string; // forward-direction ("from owns pct of to") line + label color
  reverseColor: string; // reverse-direction (reversePct) line + label color — must read as visually distinct from accentColor
  nameColor: string;
  codeColor: string; // the ticker-code line under the node name
  lineColor: string; // unused for edges with a direction color, kept for API parity / future plain connectors
  labelBgColor: string; // pill background behind each label, pick the theme's own canvas color
  closingCaption?: string; // appears synced with the LAST reveal (a reverseLast edge, or the final edge if none) — the piece's closing beat for this diagram
  captionColor?: string;
  logoSize?: number;
  delay?: number; // frames before the first node appears
  nodeStaggerFrames?: number; // gap between successive node entrances
  edgeStaggerFrames?: number; // gap between successive edge reveals (each edge gets its own beat)
  fontFamily?: string;
  monoFontFamily?: string;
}

// A small hand-authored network diagram — unlike OwnershipTree's single parent -> child column,
// this holds every node on screen at once and reveals edges one at a time (each relationship
// gets its own beat, but earlier ones stay visible) so a multi-company ownership loop reads as
// one connected structure instead of a sequence of disconnected pairwise scenes.
//
// Every line carries an arrowhead at its "owned" end — position alone (who's above/left/right)
// is NOT a reliable ownership signal in a hand-placed diagram, the arrow is the only thing that
// is. Don't infer or imply direction from node placement; only the arrow + the `pct`/`reversePct`
// text carry that meaning.
//
// An edge with `reversePct` (both entities own a stake in each other) draws as TWO parallel,
// offset lines, one per direction, each in its own color. Set `reverseLast` to hold the reverse
// line + label back until every other edge has revealed — useful when the "loop closes" beat
// (the reverse stake) is meant to land as its own punchline rather than arriving at the same
// time as the forward stake.
export const OwnershipNetwork: React.FC<OwnershipNetworkProps> = ({
  nodes,
  edges,
  width,
  height,
  accentColor,
  reverseColor,
  nameColor,
  codeColor,
  labelBgColor,
  closingCaption,
  captionColor,
  logoSize = 88,
  delay = 0,
  nodeStaggerFrames = 10,
  edgeStaggerFrames = 26,
  fontFamily,
  monoFontFamily,
}) => {
  const frame = useCurrentFrame();
  const arrowIdA = useId();
  const arrowIdB = useId();
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edgesStart = delay + nodes.length * nodeStaggerFrames + 10;
  const lastDelay = edgesStart + edges.length * edgeStaggerFrames;
  const FONT = 24; // edge label — 19 * 1.25
  const NAME_FONT = 30; // node name — 24 * 1.25
  const NODE_R = logoSize / 2 + 10; // trim line ends clear of the node circle so the arrowhead doesn't sit under it
  // The node's (x,y) anchors the CENTER of the whole logo+name+code stack (for clean scale/fade),
  // but lines should connect to the logo specifically — otherwise a line approaching from below
  // (where the name/code text sits) clips the text instead of clearing past it. Shift the anchor
  // used for line math up toward the logo's own center.
  const LOGO_ANCHOR_OFFSET = 34;
  function anchorY(node: NetworkNode) {
    return node.y * height - (node.ticker ? LOGO_ANCHOR_OFFSET : 0);
  }

  // shorten a segment by r1 at the start and r2 at the end, along its own direction
  function trim(x1: number, y1: number, x2: number, y2: number, r1: number, r2: number) {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    return { x1: x1 + ux * r1, y1: y1 + uy * r1, x2: x2 - ux * r2, y2: y2 - uy * r2 };
  }

  return (
    <div style={{ position: "relative", width, height }}>
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
        <defs>
          <marker id={arrowIdA} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill={accentColor} />
          </marker>
          <marker id={arrowIdB} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 Z" fill={reverseColor} />
          </marker>
        </defs>
        {edges.map((edge, i) => {
          const from = byId[edge.from];
          const to = byId[edge.to];
          const edgeDelay = edgesStart + i * edgeStaggerFrames;
          const opacity = interpolate(frame - edgeDelay, [0, 16], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const x1 = from.x * width;
          const y1 = anchorY(from);
          const x2 = to.x * width;
          const y2 = anchorY(to);
          const t = edge.labelT ?? 0.5;
          const pillW = 128;
          const pillH = 46;

          if (edge.reversePct) {
            const reverseDelay = edge.reverseLast ? lastDelay : edgeDelay;
            const reverseOpacity = interpolate(frame - reverseDelay, [0, 16], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            // perpendicular unit vector, used to offset the two direction lines apart
            const dx = x2 - x1;
            const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const px = -dy / len;
            const py = dx / len;
            const offset = 7;
            const f = trim(x1 + px * offset, y1 + py * offset, x2 + px * offset, y2 + py * offset, NODE_R, NODE_R);
            // reverse line runs to -> from, so its arrowhead (at the segment's end) lands on `from`
            const r = trim(x2 - px * offset, y2 - py * offset, x1 - px * offset, y1 - py * offset, NODE_R, NODE_R);
            const fMidX = f.x1 + (f.x2 - f.x1) * 0.32;
            const fMidY = f.y1 + (f.y2 - f.y1) * 0.32;
            const rMidX = r.x1 + (r.x2 - r.x1) * 0.5;
            const rMidY = r.y1 + (r.y2 - r.y1) * 0.5;
            return (
              <g key={`${edge.from}-${edge.to}`}>
                <line x1={f.x1} y1={f.y1} x2={f.x2} y2={f.y2} stroke={accentColor} strokeWidth={2.5} opacity={opacity} markerEnd={`url(#${arrowIdA})`} />
                <line x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={reverseColor} strokeWidth={2.5} opacity={reverseOpacity} markerEnd={`url(#${arrowIdB})`} />
                <g opacity={opacity}>
                  <rect x={fMidX - pillW / 2} y={fMidY - pillH / 2} width={pillW} height={pillH} rx={9} fill={labelBgColor} opacity={0.92} />
                  <text x={fMidX} y={fMidY} textAnchor="middle" dominantBaseline="middle" fontFamily={monoFontFamily} fontWeight={700} fontSize={FONT} fill={accentColor}>
                    {edge.pct}
                  </text>
                </g>
                <g opacity={reverseOpacity}>
                  <rect x={rMidX - pillW / 2} y={rMidY - pillH / 2} width={pillW} height={pillH} rx={9} fill={labelBgColor} opacity={0.92} />
                  <text x={rMidX} y={rMidY} textAnchor="middle" dominantBaseline="middle" fontFamily={monoFontFamily} fontWeight={700} fontSize={FONT} fill={reverseColor}>
                    {edge.reversePct}
                  </text>
                </g>
              </g>
            );
          }

          const line = trim(x1, y1, x2, y2, NODE_R, NODE_R);
          const midX = line.x1 + (line.x2 - line.x1) * t;
          const midY = line.y1 + (line.y2 - line.y1) * t;
          return (
            <g key={`${edge.from}-${edge.to}`} opacity={opacity}>
              <line x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={accentColor} strokeWidth={2} markerEnd={`url(#${arrowIdA})`} />
              <rect x={midX - pillW / 2} y={midY - pillH / 2} width={pillW} height={pillH} rx={9} fill={labelBgColor} opacity={0.92} />
              <text x={midX} y={midY} textAnchor="middle" dominantBaseline="middle" fontFamily={monoFontFamily} fontWeight={700} fontSize={FONT} fill={accentColor}>
                {edge.pct}
              </text>
            </g>
          );
        })}
      </svg>
      {nodes.map((node, i) => {
        const nodeDelay = delay + i * nodeStaggerFrames;
        const opacity = interpolate(frame - nodeDelay, [0, 14], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const scale = interpolate(frame - nodeDelay, [0, 14], [0.85, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        return (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: node.x * width,
              top: node.y * height,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            {node.ticker && <Logo ticker={node.ticker} size={logoSize} radius={logoSize / 2} />}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
              <div style={{ fontFamily, fontWeight: 700, fontSize: NAME_FONT, color: nameColor, textAlign: "center", whiteSpace: "nowrap" }}>
                {node.name}
              </div>
              {node.ticker && (
                <div style={{ fontFamily: monoFontFamily, fontWeight: 600, fontSize: NAME_FONT * 0.62, color: codeColor, textAlign: "center", whiteSpace: "nowrap" }}>
                  {node.ticker}
                </div>
              )}
            </div>
          </div>
        );
      })}
      {closingCaption && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            textAlign: "center",
            opacity: interpolate(frame - lastDelay, [0, 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ fontFamily, fontWeight: 700, fontSize: 30, color: captionColor ?? nameColor }}>{closingCaption}</div>
        </div>
      )}
    </div>
  );
};
