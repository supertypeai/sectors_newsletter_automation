import { ThreadBackground } from "./Background";
import { ThreadCover } from "./scenes/Cover";
import { ThreadStat } from "./scenes/Stat";
import { ThreadChart } from "./scenes/Chart";
import { ThreadBreakdown } from "./scenes/Breakdown";
import { ThreadTakeaway } from "./scenes/Takeaway";
import { ThreadOutro } from "./scenes/Outro";

export const threadTheme = {
  Background: ThreadBackground,
  Chrome: null, // the thread line is rendered separately by StoryboardComposition (needs total-frame context)
  scenes: {
    cover: ThreadCover,
    stat: ThreadStat,
    chart: ThreadChart,
    breakdown: ThreadBreakdown,
    takeaway: ThreadTakeaway,
  },
  Outro: ThreadOutro,
};

export { ThreadLine } from "./ThreadLine";
export type { ThreadMarker } from "./ThreadLine";
