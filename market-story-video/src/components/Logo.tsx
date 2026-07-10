import React from "react";
import { Img } from "remotion";
import logos from "../../assets/logos.json";
import { gradient } from "../tokens";
import { fontFamilies } from "../fonts";

const registry = logos as Record<string, string>;

// Ticker strings normalize the same way as the carousel skill: "bbca.jk", "BBCA.JK", "BBCA"
// all resolve to the same logo.
function normalize(ticker: string): string {
  return ticker.trim().toUpperCase().replace(/\.JK$/, "");
}

export const Logo: React.FC<{
  ticker: string;
  size: number;
  radius?: number;
}> = ({ ticker, size, radius = size * 0.26 }) => {
  const key = normalize(ticker);
  const b64 = registry[key];
  if (b64) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          overflow: "hidden",
          flexShrink: 0,
          background: "transparent",
        }}
      >
        <Img
          src={`data:image/png;base64,${b64}`}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
        />
      </div>
    );
  }
  // fallback: gradient monogram, same convention as carousel's .logo--mono
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        flexShrink: 0,
        background: gradient,
        color: "#fff",
        fontFamily: fontFamilies.mono,
        fontWeight: 700,
        fontSize: size * 0.32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {key.slice(0, 2)}
    </div>
  );
};

// Inline mention: sits at 1em next to a ticker named in running prose, matching the
// carousel's logo-inline convention (visual-language.md's "inline mention" rule).
export const LogoInline: React.FC<{ ticker: string; em: number }> = ({ ticker, em }) => (
  <span
    style={{
      display: "inline-block",
      width: em,
      height: em,
      verticalAlign: "-0.14em",
      marginRight: em * 0.12,
      borderRadius: em * 0.2,
      overflow: "hidden",
    }}
  >
    <Logo ticker={ticker} size={em} radius={em * 0.2} />
  </span>
);
