import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { thread, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { Logo } from "../../../components/Logo";
import { ThreadSceneLayout } from "../SceneLayout";
import { ThreadFrostPanel } from "../FrostPanel";

// The cold-open beat ("A MARKET STORY" + a flag), and the first headline beat ("Getting a
// relegation notice.") both land here — cover carries whichever fields the story gives it.
export const ThreadCover: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const delay = MOTION.staggerFrames;
  const opacity = interpolate(frame - delay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame - delay, [0, MOTION.enterFrames], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const statDelay = delay + MOTION.enterFrames + MOTION.staggerFrames;
  const statOpacity = interpolate(frame - statDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <ThreadSceneLayout kicker={scene.kicker} justify="center">
      {scene.headline && (
        <ThreadFrostPanel opacity={opacity} transform={`translateY(${y}px)`}>
          <EmphasizedHeadline
            text={scene.headline}
            emphasis={scene.emphasis}
            style={{
              fontFamily: fontFamilies.serif,
              fontWeight: 700,
              fontSize: 68,
              lineHeight: 1.18,
              color: thread.ink,
            }}
            emphasisStyle={{ fontFamily: fontFamilies.serifItalic, fontStyle: "italic" }}
          />
        </ThreadFrostPanel>
      )}
      {(() => {
        const logos = scene.coverLogos ?? scene.tickers;
        return (
          logos &&
          logos.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, opacity: statOpacity, maxWidth: 900 }}>
              {logos.map((t) => (
                <Logo key={t} ticker={t} size={logos.length > 4 ? 52 : 64} />
              ))}
            </div>
          )
        );
      })()}
      {scene.stat && (
        <ThreadFrostPanel opacity={statOpacity}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div
              style={{
                fontFamily: fontFamilies.mono,
                fontWeight: 700,
                fontSize: 96,
                lineHeight: 1,
                color: thread.ink,
              }}
            >
              {scene.stat.value}
            </div>
            <div style={{ fontFamily: fontFamilies.sans, fontSize: 24, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: thread.muted }}>
              {scene.stat.label}
            </div>
          </div>
        </ThreadFrostPanel>
      )}
    </ThreadSceneLayout>
  );
};
