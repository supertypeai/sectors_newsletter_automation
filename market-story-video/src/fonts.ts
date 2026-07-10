// Central font registry. Two distinct type systems, one per theme (see references/themes.md):
// "noir" reuses sectors-carousel's exact type ramp (Plus Jakarta Sans + JetBrains Mono).
// "thread" is the lighter, editorial system from the news/trend reference video (Lora serif
// for headlines, Plus Jakarta Sans for supporting UI text, JetBrains Mono for numbers/labels).
import { loadFont as loadSans } from "@remotion/google-fonts/PlusJakartaSans";
import { loadFont as loadMono } from "@remotion/google-fonts/JetBrainsMono";
import { loadFont as loadSerif } from "@remotion/google-fonts/Lora";

const sans = loadSans("normal", { weights: ["500", "600", "700", "800"], subsets: ["latin"] });
const mono = loadMono("normal", { weights: ["500", "600", "700"], subsets: ["latin"] });
const serifNormal = loadSerif("normal", { weights: ["600", "700"], subsets: ["latin"] });
const serifItalic = loadSerif("italic", { weights: ["600", "700"], subsets: ["latin"] });

export const fontFamilies = {
  sans: sans.fontFamily,
  mono: mono.fontFamily,
  serif: serifNormal.fontFamily,
  serifItalic: serifItalic.fontFamily,
};
