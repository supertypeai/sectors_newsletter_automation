import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { noir, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { LineChart } from "../../../components/charts/LineChart";
import { BarChart } from "../../../components/charts/BarChart";
import { NoirSceneLayout } from "../SceneLayout";

const CHART_W = 928;
const CHART_H = 560;

export const NoirChart: React.FC<{ scene: Scene }> = ({ scene }) => {
  const frame = useCurrentFrame();
  const headlineOpacity = interpolate(frame, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const chartDelay = MOTION.enterFrames + MOTION.staggerFrames;
  const captionDelay = chartDelay + 40;
  const captionOpacity = interpolate(frame - captionDelay, [0, MOTION.enterFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <NoirSceneLayout kicker={scene.kicker} justify="space-between">
      <EmphasizedHeadline
        text={scene.headline ?? ""}
        emphasis={scene.emphasis}
        style={{
          fontFamily: fontFamilies.sans,
          fontWeight: 700,
          fontSize: 58,
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          color: noir.text,
          opacity: headlineOpacity,
          maxWidth: 920,
        }}
      />
      <div style={{ alignSelf: "center" }}>
        {scene.chart?.kind === "line" && (
          <LineChart
            values={scene.chart.values}
            width={CHART_W}
            height={CHART_H}
            lineColor={noir.brandPink}
            areaFromColor={noir.brandPink}
            peakLabel={scene.chart.peakLabel}
            peakLabelColor={noir.brandGold}
            lowLabel={scene.chart.lowLabel}
            lowLabelColor={noir.muted}
            endLabel={scene.chart.endLabel}
            endLabelColor={noir.brandGold}
            endDotColor={noir.brandGold}
            delay={chartDelay}
            fontFamily={fontFamilies.mono}
          />
        )}
        {scene.chart?.kind === "bar" && (
          <BarChart
            bars={scene.chart.bars}
            width={CHART_W}
            height={CHART_H}
            barColor="linear-gradient(to top, #E5337E, #DF9439)"
            labelColor={noir.muted}
            valueColor={noir.text}
            delay={chartDelay}
            fontFamily={fontFamilies.sans}
            monoFontFamily={fontFamilies.mono}
          />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, opacity: captionOpacity }}>
        {scene.chart?.caption && (
          <div style={{ fontFamily: fontFamilies.mono, fontSize: 22, color: noir.muted }}>{scene.chart.caption}</div>
        )}
        {scene.body && (
          <div style={{ fontFamily: fontFamilies.sans, fontSize: 32, fontWeight: 500, lineHeight: 1.4, color: noir.text, maxWidth: 900 }}>
            {scene.body}
          </div>
        )}
      </div>
    </NoirSceneLayout>
  );
};
