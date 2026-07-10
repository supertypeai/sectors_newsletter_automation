import React from "react";
import { gradient } from "../tokens";

// The ONE brand moment: gradient clip-text on a single verdict word/phrase, never a whole
// headline. Mirrors sectors-carousel's .gradient-text exactly (see visual-language.md law 1).
export const GradientText: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ children, style }) => (
  <span
    style={{
      backgroundImage: gradient,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      whiteSpace: "nowrap",
      ...style,
    }}
  >
    {children}
  </span>
);

// Splits a headline string on an exact substring, wrapping only that substring in
// GradientText. Throws loudly on a mismatch instead of silently rendering flat — the same
// failure mode sectors-carousel's brand-lint.mjs catches for `emphasis` at lint time; here
// there is no separate lint pass before render, so this component is the enforcement point.
export const EmphasizedHeadline: React.FC<{
  text: string;
  emphasis?: string;
  style?: React.CSSProperties;
  emphasisStyle?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
}> = ({ text, emphasis, style, emphasisStyle, as: Tag = "div" }) => {
  if (!emphasis) {
    return <Tag style={style}>{text}</Tag>;
  }
  const idx = text.indexOf(emphasis);
  if (idx === -1) {
    throw new Error(
      `EmphasizedHeadline: emphasis "${emphasis}" is not an exact substring of headline "${text}". ` +
        "Fix the storyboard.json — this mirrors brand-lint.mjs's emphasis-match ERROR in the carousel skill."
    );
  }
  const before = text.slice(0, idx);
  const after = text.slice(idx + emphasis.length);
  return (
    <Tag style={style}>
      {before}
      <GradientText style={emphasisStyle}>{emphasis}</GradientText>
      {after}
    </Tag>
  );
};
