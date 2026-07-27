import { ProductBackground } from "./Background";
import { ProductChrome } from "./Chrome";
import { ProductCover } from "./scenes/Cover";
import { ProductFeature } from "./scenes/Feature";
import { ProductDemo } from "./scenes/Demo";
import { ProductCta } from "./scenes/Cta";
import { NoirStat } from "../noir/scenes/Stat";
import { NoirChart } from "../noir/scenes/Chart";
import { NoirBreakdown } from "../noir/scenes/Breakdown";
import { NoirTakeaway } from "../noir/scenes/Takeaway";
import { NoirOutro } from "../noir/scenes/Outro";

// The product theme shares noir's palette and type ramp exactly, so the roles it does not
// restyle (stat/chart/breakdown/takeaway) reuse noir's renderers rather than being copied and
// left to drift. Those renderers already pick up the talking-head reservation through
// NoirSceneLayout. Only the four feature-reel roles and the chrome are genuinely new.
//
// `Outro` is wired to noir's for the rare reel that sets an explicit `outro`; the normal shape
// is `"outro": false` with a `cta` scene closing the piece (see scenes/Cta.tsx).
export const productTheme = {
  Background: ProductBackground,
  Chrome: ProductChrome,
  scenes: {
    cover: ProductCover,
    feature: ProductFeature,
    demo: ProductDemo,
    cta: ProductCta,
    stat: NoirStat,
    chart: NoirChart,
    breakdown: NoirBreakdown,
    takeaway: NoirTakeaway,
  },
  Outro: NoirOutro,
};
