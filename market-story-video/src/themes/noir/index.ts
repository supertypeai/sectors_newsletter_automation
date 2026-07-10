import { NoirBackground } from "./Background";
import { NoirChrome } from "./Chrome";
import { NoirCover } from "./scenes/Cover";
import { NoirStat } from "./scenes/Stat";
import { NoirChart } from "./scenes/Chart";
import { NoirBreakdown } from "./scenes/Breakdown";
import { NoirTakeaway } from "./scenes/Takeaway";
import { NoirOutro } from "./scenes/Outro";

export const noirTheme = {
  Background: NoirBackground,
  Chrome: NoirChrome,
  scenes: {
    cover: NoirCover,
    stat: NoirStat,
    chart: NoirChart,
    breakdown: NoirBreakdown,
    takeaway: NoirTakeaway,
  },
  Outro: NoirOutro,
};
