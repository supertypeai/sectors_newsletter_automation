import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Scene } from "../../../types";
import { thread, MOTION } from "../../../tokens";
import { fontFamilies } from "../../../fonts";
import { EmphasizedHeadline } from "../../../components/GradientText";
import { LineChart } from "../../../components/charts/LineChart";
import { BarChart } from "../../../components/charts/BarChart";
import { ThreadSceneLayout } from "../SceneLayout";
import { ThreadFrostPanel } from "../FrostPanel";

const CHART_W = 900;
const CHART_H = 520;

// The chart-drawn-directly-on-paper beat ("In two days, it vanished." + the price line with
// an ATH label) from indonesia-msci-connected.mp4.
export const ThreadChart: React.FC<{ scene: Scene }> = ({ scene }) => {
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
    <ThreadSceneLayout kicker={scene.kicker} justify="space-between">
      {scene.headline && (
        <ThreadFrostPanel opacity={headlineOpacity}>
          <EmphasizedHeadline
            text={scene.headline}
            emphasis={scene.emphasis}
            style={{
              fontFamily: fontFamilies.serif,
              fontWeight: 700,
              fontSize: 52,
              lineHeight: 1.18,
              color: thread.ink,
            }}
            emphasisStyle={{ fontFamily: fontFamilies.serifItalic, fontStyle: "italic" }}
          />
        </ThreadFrostPanel>
      )}
      {scene.chart?.kind === "line" && (
        <LineChart
          values={scene.chart.values}
          width={CHART_W}
          height={CHART_H}
          lineColor={thread.ink}
          areaFromColor={thread.brandPink}
          peakLabel={scene.chart.peakLabel}
          peakLabelColor={thread.ink}
          lowLabel={scene.chart.lowLabel}
          lowLabelColor={thread.muted}
          endLabel={scene.chart.endLabel}
          endLabelColor={thread.loss}
          endDotColor={thread.loss}
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
          labelColor={thread.muted}
          valueColor={thread.ink}
          delay={chartDelay}
          fontFamily={fontFamilies.sans}
          monoFontFamily={fontFamilies.mono}
        />
      )}
      <div style={{ opacity: captionOpacity, display: "flex", flexDirection: "column", gap: 10 }}>
        {scene.chart?.caption && (
          <div style={{ fontFamily: fontFamilies.mono, fontSize: 22, color: thread.muted }}>{scene.chart.caption}</div>
        )}
        {scene.body && (
          <div style={{ fontFamily: fontFamilies.sans, fontWeight: 600, fontSize: 28, color: thread.ink, maxWidth: 860 }}>
            {scene.body}
          </div>
        )}
      </div>
    </ThreadSceneLayout>
  );
};
