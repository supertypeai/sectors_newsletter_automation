// Inline-SVG chart generators. Forked from sectors-carousel's scripts/charts.mjs (same
// geometry, same chart-kind grammar) for a LIGHT chart surface: the carousel original is
// dark-card-only (comments there say so explicitly — near-white label ink, a near-black
// donut track), which reads as low/no-contrast the moment it's dropped on the newsletter's
// white finance-email background. This fork keeps every chart function and its geometry
// unchanged; only the color constants below and the literal dark-surface hex sprinkled
// through the file (near-white text -> #0B0B0B, near-white low-alpha overlays -> dark-ink
// low-alpha, the donut's hidden background track -> the light chart surface) were swapped.
//
// Identity colors are constrained to the newsletter's approved palette (a fixed 22-hex
// list), not swapped freely. Running that list through dataviz's validate_palette.js
// against surface #fcfcfb left only 6 hexes clearing BOTH the categorical lightness band
// and >=3:1 contrast (the rest are pastels that read near-invisible on white): a rose
// (#c14d94), a red (#D53E4F), a blue (#3288BD), and a purple (#5E4FA2, in use; #6D5FA6 is
// a same-family spare for a 4th peer slot if one's ever needed), plus #8B004C which passes
// contrast alone but fails the shared lightness band next to the others. That 22-hex list
// has no green clearing 3:1 on white (a genuine green, #5BAA5A, sits at 2.79:1 and fails
// the CVD floor next to this list's red), which is why GAIN/LOSS used blue/red here for a
// while instead of the usual green/red finance convention.
//
// GAIN/LOSS now use a green/red pair sourced from OUTSIDE that 22-hex list instead: the
// light-mode `gain`/`loss` tokens already shipped in the sibling `market-story-video`
// skill's own brand tokens (`src/tokens.ts`, light theme: gain #1D8A4E, loss #D6295A),
// picked over the newsletter's own list on explicit request to match the plain finance
// green/red convention. Checked against this file's #fcfcfb chart surface: #1D8A4E is
// ~4.2:1, #D6295A is ~4.7:1, both clear the >=3:1 mark comfortably (loss also lands close
// to the brand mark's own crimson, #E11D48). This is a deliberate override of the 22-hex
// list for this one semantic pair only, not a precedent for picking other hues outside it.
// Every chart still prints its own signed value net to the mark regardless (this file's
// long-standing rule, see the bottom "every chart is a promise" note in the sibling
// skill's charts.md), so the polarity is never color-alone even for a colorblind reader.
//
// GOLD (#8B004C, a darker maroon in PINK's own magenta family) is PINK's own endpoint/
// highlight accent, e.g. a sparkline's endpoint dot, never a second competing series. Fed
// through the validator ALONGSIDE PINK it fails the categorical lightness band (a check
// for keeping N *separate* series visually even-weighted), which doesn't actually apply
// here, the two are one subject's own base/accent shades, the same relationship as the
// carousel original's PINK/GOLD pair, not two series a reader needs to tell apart. The
// real cross-series set that matters (self=PINK, GAIN, LOSS, and the two peer hues, GOLD
// excluded) passes all four checks clean: `node validate_palette.js
// "#C14D94,#3288BD,#D53E4F,#5E4FA2" --mode light`.
//
// Neutral ink (primary text, muted/secondary text, reference-line gray) is deliberately
// NOT drawn from that same 22-hex list. Per the dataviz skill's own separation, "text
// wears text tokens, never series color": muted axis labels, benchmark dashed lines, and
// donut center subtext are chrome/annotation, not series identity, so they use the
// standard light-mode ink tokens (#0B0B0B primary, #52514E secondary) the same way a
// diverging chart's neutral midpoint or a status color is never pulled from the
// categorical set either.

let _uid = 0;
const uid = (p) => `${p}${_uid++}`;

// SELF: two shades of the SAME identity hue (subject line/bar/donut-slice base, and the
// endpoint/highlight accent the original carousel engine drew in a second hue). Both are
// solid, on-brand marks in their own right here (an endpoint dot, a compose "self" fill,
// a multiline self series), not just a decorative gradient tail, so both had to clear
// >=3:1 on their own: PINK is the rose (#c14d94, 4.3:1), GOLD is a darker maroon from the
// same magenta family (#8B004C, 9.3:1) rather than the original's separate warm gold hue,
// nothing warm in the approved list clears 3:1 on white (see header note).
const PINK = "#C14D94";
const GOLD = "#8B004C";
// GAIN/LOSS: bar/flow polarity, brand green/red sourced from market-story-video's light
// tokens (see header note above), not the newsletter's own 22-hex categorical list.
const GAIN = "#1D8A4E";
const LOSS = "#D6295A";
// TICKER: every ticker mention (a bar's own category label, a prose $TICKER, a table
// cell) renders in this blue throughout a newsletter issue, kept from the same 22-hex
// list so it stays distinguishable from GAIN/LOSS's green/red semantics right next to it.
const TICKER = "#3288BD";
// Neutral ink for muted text + reference/benchmark lines (not from the 22-hex list, see
// header note above).
const MUTED = "#52514E";

// rose->orange horizontal stroke gradient + vertical rose area gradient
// w/h size the gradient in USER SPACE (the chart's own viewBox), not the default
// objectBoundingBox units. A perfectly flat/frozen series (every value identical — real on
// IDX during a floor-price suspension) produces a path with a ZERO-HEIGHT bounding box, and
// per SVG spec an objectBoundingBox paint is entirely suppressed when its shape's bbox has
// zero width OR height — not just squashed, gone, leaving an invisible stroke on what should
// be a plainly visible flat line (caught: normFrac already fixed this same case's *position*,
// centering the flat line instead of collapsing it to an edge, but the gradient stroke on
// that exact line was still silently dropped; the two bugs looked identical and had to be
// fixed separately). userSpaceOnUse ties the gradient to the chart's fixed pixel dimensions
// instead of the path's own shape, so it can never depend on that shape's bbox being nonzero.
function gradDefs(id, w = 100, h = 100) {
  // PINK -> GOLD stroke gradient, same as the carousel original, but both stops are now
  // the two contrast-safe magenta-family shades (rose/maroon) instead of rose/true-gold,
  // so the far end of a wide bar or long line never fades into a sub-3:1 color.
  return `<defs>
    <linearGradient id="${id}s" x1="0" y1="0" x2="${w}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${PINK}"/><stop offset="100%" stop-color="${GOLD}"/>
    </linearGradient>
    <linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="${h}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="rgba(193,77,148,0.18)"/><stop offset="100%" stop-color="rgba(193,77,148,0)"/>
    </linearGradient>
  </defs>`;
}

// Value -> 0..1 fraction of a min..max range (0=min end, 1=max end). When every value is
// identical (a flat/frozen price, real on IDX during a suspension or a stuck-at-floor stock),
// there's no span to divide by; centering at 0.5 draws a flat mid-line instead of every point
// collapsing onto one edge, which is what (v-min)/(span||1) does when min===max. Shared by
// sparkline/coverSpark/multiLine, each had this bug independently before it was one decision.
function normFrac(v, min, max) {
  return max === min ? 0.5 : (v - min) / (max - min);
}

// Simple line sparkline. values: number[]. Returns <svg> sized w x h.
// endpointLabel (opt-in, default off): prints the end value + %-change-from-start at the
// endpoint, same convention as multiLine's self endpoint (below). "Every chart is a promise"
// (visual-language.md) named radar as the one deliberate no-numbers exception, but this was an
// undocumented second one, the content-slide `line` chart printed zero text of its own. Kept
// OPT-IN (not the sparkline() default) because priceSnapshot's mini-chart (the other caller)
// already prints the price + delta right next to it, a second number on the chart itself would
// double-label, not inform.
// benchmark (opt-in): { value, label, display? } draws the same dashed reference line barChart
// does (a sector average, a historical mean), so a price/ratio line can answer "vs what" too.
// startLabel (opt-in): prints the line's STARTING value at the left, so the endpoint's
// %-change reads against a real anchor instead of thin air. The endpoint alone gives the eye
// exactly one number; with no y-axis, the slope's magnitude is otherwise a guess. Muted and
// smaller than the endpoint so the end value stays the loud verdict and the start is the quiet
// baseline. Pass `true` for the raw start value, or a string to label it your way (e.g. "100").
// extremes (opt-in): labels the interior peak and trough with their values (endpoints excluded,
// they already carry start/end numbers), the same "label the narratively load-bearing points"
// rule barChart uses past 6 bars — gives a y-sense without a gridded axis.
export function sparkline(values, { w = 852, h = 150, strokeWidth = 4, area = false, pad = 10, endpointLabel = false, benchmark, startLabel = false, extremes = false } = {}) {
  const id = uid("sp");
  const vs = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  let min = Math.min(...vs), max = Math.max(...vs);
  // Same reasoning as barChart's benchmarkPos/benchmarkNegAbs below: fold the benchmark into
  // the SAME min/max the line itself scales against, so a benchmark outside the series' own
  // range still lands inside the plot instead of being silently clipped or ignored.
  if (benchmark) { min = Math.min(min, benchmark.value); max = Math.max(max, benchmark.value); }
  const n = vs.length;
  // Reserve room on the right for the endpoint dot + label (same reason multiLine keeps a
  // padRight): without it, the label clips at the viewBox edge instead of just sitting inside it.
  const padRight = endpointLabel ? Math.max(pad, 100) : pad;
  const X = (i) => pad + (i / (n - 1)) * (w - pad - padRight);
  const Y = (v) => pad + (1 - normFrac(v, min, max)) * (h - 2 * pad);
  const pts = vs.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const areaPath = `${line} L${X(n - 1).toFixed(1)},${h} L${X(0).toFixed(1)},${h} Z`;
  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}
    ${area ? `<path d="${areaPath}" fill="url(#${id}f)"/>` : ""}`;
  if (benchmark) {
    const by = Y(benchmark.value);
    const label = `${benchmark.label ? benchmark.label + " · " : ""}${benchmark.display ?? trimNum(benchmark.value)}`;
    // Right-aligned, but pulled left of padRight's reserved zone (above) rather than flush
    // with the canvas edge: when endpointLabel is also on, that zone is already claimed by
    // the line's own endpoint %-change text, and the two labels would otherwise overlap.
    const bx = w - padRight - 14;
    const ly = Math.min(Math.max(by - 10, pad + 8), h - 8);
    out += `<line x1="${pad}" y1="${by.toFixed(1)}" x2="${(w - pad).toFixed(1)}" y2="${by.toFixed(1)}" stroke="#52514E" stroke-width="2" stroke-dasharray="8 6" opacity="0.85"/>
    <text x="${bx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#52514E" font-family="${MONO}" font-size="22" font-weight="700" text-anchor="end">${esc(label)}</text>`;
  }
  out += `<path d="${line}" fill="none" stroke="url(#${id}s)" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (endpointLabel) {
    const first = vs[0], last = vs[n - 1];
    // A series starting at 0 has no defined %-change, same fallback multiLine uses: the raw
    // end value beats silence.
    const pct = first ? ((last - first) / first) * 100 : null;
    const label = pct == null ? trimNum(last) : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    const ex = X(n - 1), ey = Y(last);
    const labelY = Math.min(Math.max(ey, pad + 8), h - 10);
    out += `<circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="5" fill="${GOLD}"/>
    <text x="${(ex + 12).toFixed(1)}" y="${(labelY + 7).toFixed(1)}" fill="#0B0B0B" font-family="${MONO}" font-size="24" font-weight="800" text-anchor="start">${esc(label)}</text>`;
  }
  if (startLabel) {
    const first = vs[0];
    const sx = X(0), sy = Y(first);
    const lbl = typeof startLabel === "string" ? startLabel : trimNum(first);
    // At the far-left edge the label can't go further left, so it sits BELOW a high start
    // (a declining line) and ABOVE a low one (a rising line), never on top of the line's own
    // early run. Clamped to stay inside the viewBox.
    const ly = sy < h / 2 ? Math.min(sy + 30, h - 8) : Math.max(sy - 14, pad + 18);
    out += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="4" fill="${MUTED}"/>
    <text x="${sx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${MUTED}" font-family="${MONO}" font-size="22" font-weight="700" text-anchor="start">${esc(lbl)}</text>`;
  }
  if (extremes && n > 3) {
    const maxV = Math.max(...vs), minV = Math.min(...vs);
    const maxI = vs.indexOf(maxV), minI = vs.indexOf(minV);
    // Interior extrema only: index 0 / n-1 already carry start (startLabel) and end
    // (endpointLabel) numbers, so labeling them again would double up.
    const mark = (idx, val, above) => {
      if (idx <= 0 || idx >= n - 1) return "";
      const px = X(idx), py = Y(val);
      const ty = above ? Math.max(py - 14, pad + 16) : Math.min(py + 26, h - 8);
      return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="3.5" fill="${MUTED}"/>
      <text x="${px.toFixed(1)}" y="${ty.toFixed(1)}" fill="${MUTED}" font-family="${MONO}" font-size="20" font-weight="600" text-anchor="middle">${esc(trimNum(val))}</text>`;
    };
    if (maxI !== minI) out += mark(maxI, maxV, true) + mark(minI, minV, false);
  }
  return out + `</svg>`;
}

// Cover backdrop spark: gradient line + area + endpoint marker/halo. dir: 'up'|'down'.
export function coverSpark(values, { w = 1080, h = 440, dir = "up", pad = 72 } = {}) {
  const id = uid("cv");
  // Single-point fallback duplicates the REAL value (flat line at mid-height), same as
  // sparkline. The old [0, 1] stand-in fabricated a full-width rising line out of thin air,
  // an invented uptrend regardless of what the one data point (or `dir`) said.
  const vs = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0];
  const min = Math.min(...vs), max = Math.max(...vs);
  const n = vs.length;
  // top=132 (not the naive 40) reserves headroom for the spark-callout badge, which is
  // ALWAYS rendered whenever coverSpark is (renderCover's `callout` is unconditional on
  // `slide.spark`, see blocks.mjs), positioned at absolute top:206px while this SVG sits at
  // absolute top:170px — i.e. callout occupies this SVG's internal y ~36-98. A dataset whose
  // most recent point is also its period max/min (a "hit a new high/low" cover, a very common
  // hook) puts the endpoint marker (r=7 dot + r=14 ring) right at y=top, colliding with the
  // badge and reading as a stray dot poking out from under it. 132 clears the badge's bottom
  // edge (98) by a real margin even accounting for the ring's radius, at the cost of ~28% less
  // vertical amplitude for the line, an acceptable trade since the callout is never absent.
  const top = 132, bot = h - 60;
  const X = (i) => pad + (i / (n - 1)) * (w - pad - 72);
  const Y = (v) => top + (1 - normFrac(v, min, max)) * (bot - top);
  const pts = vs.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`);
  const line = `M${pts.join(" L")}`;
  const ex = X(n - 1), ey = Y(vs[n - 1]);
  const endColor = dir === "down" ? LOSS : GOLD;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:170px;opacity:0.62;pointer-events:none;">${gradDefs(id, w, h)}
    <path d="${line} L${ex.toFixed(1)},${bot} L${X(0).toFixed(1)},${bot} Z" fill="url(#${id}f)"/>
    <path d="${line}" fill="none" stroke="url(#${id}s)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="7" fill="${endColor}"/>
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="14" fill="none" stroke="${endColor}" stroke-opacity="0.35" stroke-width="3"/>
  </svg>`;
}

// Cover backdrop for a 2+-ticker comparison ("duel"): every series on one shared scale, the
// "self" series solid+gradient+endpoint marker like coverSpark, every other series a thinner
// dashed/muted line so the subject still reads as the lead. resolveSeriesColors is called here
// (not passed pre-resolved) so a cover duel and a content-slide multiline never disagree on
// which peer got which color, same single-source-of-truth reason multiLine/radar share it.
export function coverDuel(series, { w = 1080, h = 440, pad = 72 } = {}) {
  const id = uid("cd");
  const resolved = resolveSeriesColors(series);
  const self = resolved.find((s) => s.self) || resolved[0];
  const peers = resolved.filter((s) => s !== self);
  const all = resolved.flatMap((s) => s.values || []);
  const min = Math.min(...all), max = Math.max(...all);
  const n = Math.max(1, ...resolved.map((s) => (s.values || []).length));
  const top = 40, bot = h - 60;
  // Right padding reserves room for the endpoint ticker labels below (same reason
  // multiLine keeps a padRight): a label that clips at the viewBox edge attributes nothing.
  const X = (i) => pad + (i / (n - 1 || 1)) * (w - pad - 132);
  const Y = (v) => top + (1 - normFrac(v, min, max)) * (bot - top);
  const lineOf = (s) => `M${(s.values || []).map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" L")}`;
  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:170px;opacity:0.55;pointer-events:none;">${gradDefs(id, w, h)}`;
  peers.forEach((s) => {
    out += `<path d="${lineOf(s)}" fill="none" stroke="${s.color}" stroke-width="3" stroke-dasharray="7 6" opacity="0.8"/>`;
  });
  if (self && self.values && self.values.length) {
    const line = lineOf(self);
    const ex = X(self.values.length - 1), ey = Y(self.values[self.values.length - 1]);
    const dir = self.values[self.values.length - 1] >= self.values[0] ? "up" : "down";
    const endColor = dir === "down" ? LOSS : GOLD;
    out += `<path d="${line} L${ex.toFixed(1)},${bot} L${X(0).toFixed(1)},${bot} Z" fill="url(#${id}f)"/>
    <path d="${line}" fill="none" stroke="url(#${id}s)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="7" fill="${endColor}"/>
    <circle cx="${ex.toFixed(1)}" cy="${ey.toFixed(1)}" r="14" fill="none" stroke="${endColor}" stroke-opacity="0.35" stroke-width="3"/>`;
  }
  // Each line carries its ticker at the endpoint. An unattributed duel is a misreading
  // machine: a real BBCA-vs-BBRI cover had the FALLING solid line as the subject and the
  // rising dashed one as the peer, with nothing on-canvas to say which was which, under a
  // headline about the subject's strength. Same de-collision + clamp approach as multiLine.
  const endpoints = resolved
    .filter((s) => s.values && s.values.length && s.name)
    .map((s) => ({
      x: X(s.values.length - 1),
      labelY: Y(s.values[s.values.length - 1]),
      name: s.name,
      fill: s.self ? "#0B0B0B" : s.color,
      weight: s.self ? 800 : 700,
    }))
    .sort((a, b) => a.labelY - b.labelY);
  const MIN_GAP = 30;
  for (let i = 1; i < endpoints.length; i++)
    if (endpoints[i].labelY - endpoints[i - 1].labelY < MIN_GAP) endpoints[i].labelY = endpoints[i - 1].labelY + MIN_GAP;
  if (endpoints.length) {
    const over = endpoints[endpoints.length - 1].labelY - (h - 14);
    if (over > 0) endpoints.forEach((e) => { e.labelY -= over; });
  }
  endpoints.forEach((e) => {
    out += `<text x="${(e.x + 14).toFixed(1)}" y="${(e.labelY + 8).toFixed(1)}" fill="${e.fill}" font-family="${MONO}" font-size="22" font-weight="${e.weight}">${esc(e.name)}</text>`;
  });
  return out + `</svg>`;
}

// Vertical bar chart. bars: [{label, value, display?}]. Positive => gradient, negative => loss.
// Used by quarterlyTrend / chart(bar). viewBox 936 x 460.
// benchmark (opt-in): { value, label, display? } draws ONE dashed reference line (a sector
// average, a historical mean) so a bar can answer "vs what" without the caption carrying it,
// no chart in this file could show that before. Its value is folded into the SAME maxPos/
// maxNegAbs the bars themselves scale against (below), not read as a display-only overlay on
// top of a scale that ignores it; a benchmark above every bar would otherwise draw off the
// plot (or get silently clipped) instead of stretching the axis to include it.
// financial (opt-in): this bar set is a signed gain/loss reading (a %-move list), not a
// plain magnitude series (an earnings-by-year bar, a P/E comparison) — positive bars fill
// solid GAIN green instead of the brand PINK/GOLD gradient, keeping the gradient reserved
// for "this is our own subject's magnitude," not "this went up." Negative bars were always
// LOSS red regardless, this only changes what a *positive* bar means visually.
// labelAll (opt-in): forces every bar's value label to render, bypassing the n<=6 /
// extremes-only thinning below — for a short, fully-enumerated movers list (a top-10
// gainers+losers table's own chart) where every bar IS the load-bearing point, not a long
// series where only the extremes matter.
export function barChart(bars, { w = 936, h = 460, benchmark, financial = false, labelAll = false } = {}) {
  const id = uid("bar");
  const left = 10, right = w - 10, top = 40, plotBottom = 348, labelY = 424;
  const n = bars.length || 1;
  const benchmarkPos = benchmark && benchmark.value > 0 ? benchmark.value : 0;
  const benchmarkNegAbs = benchmark && benchmark.value < 0 ? -benchmark.value : 0;
  // baseY splits the plot area between positive and negative headroom IN PROPORTION to the
  // actual magnitudes present, instead of a fixed baseY that assumes positive dominates. An
  // all-negative dataset (narrowing losses — this skill's own flagship story shape) needs the
  // FULL plot height for its bars just like an all-positive one does; a fixed split gave it a
  // sliver and the tallest bar overflowed the viewBox by 260px (caught rendering GOTO's loss chart).
  const maxPos = Math.max(0, benchmarkPos, ...bars.map((b) => Math.max(0, b.value)));
  const maxNegAbs = Math.max(0, benchmarkNegAbs, ...bars.map((b) => Math.max(0, -b.value)));
  const totalRange = maxPos + maxNegAbs || 1;
  const plotH = plotBottom - top;
  const baseY = top + (maxPos / totalRange) * plotH;
  const posH = baseY - top;
  const negH = plotBottom - baseY;
  const slot = (right - left) / n;
  const bw = slot * 0.56;
  const showAll = labelAll || n <= 6;
  const everyOther = !labelAll && n > 7;
  // Beyond 6 bars we stop labeling every point, but first/last alone can silently drop the
  // most story-relevant bar — a mid-series dip or peak (a streak's one bad year, a spike)
  // is exactly the point a reader needs the number for, and prose asserting it elsewhere
  // isn't a substitute (caught: a 7-bar dividend streak whose 2022 dip had no on-chart
  // number at all, while body copy still cited it — "every chart is a promise", broken).
  const values = bars.map((b) => b.value);
  const maxIdx = values.indexOf(Math.max(...values));
  const minIdx = values.indexOf(Math.min(...values));
  const fmt = (b) => (b.display != null ? b.display : trimNum(b.value));
  // Same positive/negative split the bars themselves use (see bh below), so the benchmark
  // line lands at the exact y a bar of that same value would.
  const Y = (v) =>
    v >= 0 ? (maxPos ? baseY - (v / maxPos) * posH : baseY) : maxNegAbs ? baseY + (-v / maxNegAbs) * negH : baseY;
  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}
    <line x1="0" y1="${baseY.toFixed(1)}" x2="${w}" y2="${baseY.toFixed(1)}" stroke="rgba(11,11,11,0.12)" stroke-width="2"/>`;
  bars.forEach((b, i) => {
    const cx = left + slot * i + slot / 2;
    const x = cx - bw / 2;
    const neg = b.value < 0;
    const bh = neg ? (maxNegAbs ? (-b.value / maxNegAbs) * negH : 0) : (maxPos ? (b.value / maxPos) * posH : 0);
    const y = neg ? baseY : baseY - bh;
    const fill = neg ? LOSS : financial ? GAIN : `url(#${id}s)`;
    out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, bh).toFixed(1)}" rx="8" fill="${fill}"/>`;
    if (showAll || i === 0 || i === n - 1 || i === maxIdx || i === minIdx) {
      const ly = neg ? baseY + bh + 34 : y - 14;
      out += `<text x="${cx.toFixed(1)}" y="${ly.toFixed(1)}" fill="#0B0B0B" font-family="${MONO}" font-size="28" font-weight="700" text-anchor="middle">${esc(fmt(b))}</text>`;
    }
    if (b.label && (!everyOther || i % 2 === 0)) {
      out += `<text x="${cx.toFixed(1)}" y="${labelY}" fill="#52514E" font-family="${MONO}" font-size="24" text-anchor="middle">${esc(b.label)}</text>`;
    }
  });
  if (benchmark) {
    const by = Y(benchmark.value);
    const label = `${benchmark.label ? benchmark.label + " · " : ""}${benchmark.display ?? trimNum(benchmark.value)}`;
    const ly = Math.min(Math.max(by - 12, top + 16), plotBottom - 4);
    out += `<line x1="0" y1="${by.toFixed(1)}" x2="${w}" y2="${by.toFixed(1)}" stroke="#52514E" stroke-width="2" stroke-dasharray="8 6" opacity="0.85"/>
    <text x="${right}" y="${ly.toFixed(1)}" fill="#52514E" font-family="${MONO}" font-size="22" font-weight="700" text-anchor="end">${esc(label)}</text>`;
  }
  return out + `</svg>`;
}

// Ranked movers strip: a diverging horizontal bar per ticker, logo + ticker on the left,
// a green/red bar reading off a shared zero-line, full value label at the bar's outer end.
// Built for a "top gainers + top losers" movers list where every row needs to be legible at
// once (barChart's own n<=6 label-thinning drops most of a 10-row list, and it has no room
// for a logo at all) — this is the shape charts.mjs didn't cover, not a barChart variant.
// items: [{ symbol, value, display?, logoBase64? }], value is the signed %-move (or any
// signed metric) driving both bar length and polarity. logoBase64 is a raw base64 PNG
// (no `data:` prefix, e.g. straight from a ticker-logo registry); rows without one just
// skip the image and keep the row's spacing, so a missing logo never misaligns the list.
export function moversChart(items, { w = 936, rowH = 46, labelZone = 190, pad = 16 } = {}) {
  const n = items.length || 1;
  const h = pad * 2 + n * rowH;
  const plotL = labelZone, plotR = w - pad;
  const cx = (plotL + plotR) / 2;
  const halfW = cx - plotL;
  const maxAbs = Math.max(1e-9, ...items.map((it) => Math.abs(it.value)));
  const fmt = (it) => (it.display != null ? it.display : `${it.value >= 0 ? "+" : ""}${trimNum(it.value)}%`);
  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <line x1="${cx.toFixed(1)}" y1="${pad}" x2="${cx.toFixed(1)}" y2="${(h - pad).toFixed(1)}" stroke="rgba(11,11,11,0.14)" stroke-width="2"/>`;
  items.forEach((it, i) => {
    const rowY = pad + i * rowH;
    const midY = rowY + rowH / 2;
    if (i > 0) out += `<line x1="${plotL - 8}" y1="${rowY.toFixed(1)}" x2="${plotR.toFixed(1)}" y2="${rowY.toFixed(1)}" stroke="rgba(11,11,11,0.08)" stroke-width="1.5"/>`;
    const logoSize = Math.min(30, rowH - 12);
    if (it.logoBase64) {
      out += `<image href="data:image/png;base64,${it.logoBase64}" x="${pad}" y="${(midY - logoSize / 2).toFixed(1)}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`;
    }
    const tickerX = pad + logoSize + 10;
    out += `<text x="${tickerX}" y="${(midY + 7).toFixed(1)}" fill="${TICKER}" font-family="${MONO}" font-size="24" font-weight="800" text-anchor="start">${esc(it.symbol)}</text>`;
    const neg = it.value < 0;
    const barLen = (Math.abs(it.value) / maxAbs) * halfW * 0.86;
    const barX = neg ? cx - barLen : cx;
    const fill = neg ? LOSS : GAIN;
    out += `<rect x="${barX.toFixed(1)}" y="${(rowY + 8).toFixed(1)}" width="${Math.max(2, barLen).toFixed(1)}" height="${(rowH - 16).toFixed(1)}" rx="6" fill="${fill}"/>`;
    const labelX = neg ? barX - 10 : barX + barLen + 10;
    out += `<text x="${labelX.toFixed(1)}" y="${(midY + 7).toFixed(1)}" fill="${fill}" font-family="${MONO}" font-size="23" font-weight="800" text-anchor="${neg ? "end" : "start"}">${esc(fmt(it))}</text>`;
  });
  return out + `</svg>`;
}

// Bridge/waterfall: a start total, named +/- contributors, an end total. bars: [{label,
// value, isTotal?, display?}] — mark the anchor bars (usually first and last) `isTotal:true`
// so they draw full-height from zero; every other bar floats between the running cumulative
// total before and after it. Two evals independently needed this and had no way to build it:
// bar/donut/stackedbar all show A's shape or B's shape separately, none show the STEPS from
// A to B (a margin walk, an earnings bridge) in one visual — a reader had to mentally
// reassemble 3-4 separate slides into the walk themselves. isTotal is an explicit flag, not
// inferred from position, so a chart with only one real total (e.g. an ending balance with no
// stated start) doesn't silently misread bar 1 as an anchor it was never meant to be.
export function waterfall(bars, { w = 936, h = 460 } = {}) {
  const id = uid("wf");
  const left = 10, right = w - 10, top = 40, plotBottom = 348, labelY = 424;
  const n = bars.length || 1;

  let running = 0;
  const windows = bars.map((b) => {
    if (b.isTotal) {
      running = b.value;
      return { from: 0, to: b.value };
    }
    const from = running;
    running += b.value;
    return { from, to: running };
  });

  const allEdges = windows.flatMap((win) => [win.from, win.to]);
  const maxV = Math.max(0, ...allEdges);
  const minV = Math.min(0, ...allEdges);
  const totalRange = maxV - minV || 1;
  const plotH = plotBottom - top;
  const Y = (v) => plotBottom - ((v - minV) / totalRange) * plotH;

  const slot = (right - left) / n;
  const bw = slot * 0.56;
  const fmt = (b) => (b.display != null ? b.display : `${!b.isTotal && b.value >= 0 ? "+" : ""}${trimNum(b.value)}`);

  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}
    <line x1="0" y1="${Y(0).toFixed(1)}" x2="${w}" y2="${Y(0).toFixed(1)}" stroke="rgba(11,11,11,0.12)" stroke-width="2"/>`;
  bars.forEach((b, i) => {
    const cx = left + slot * i + slot / 2;
    const x = cx - bw / 2;
    const win = windows[i];
    const yTop = Y(Math.max(win.from, win.to));
    const yBot = Y(Math.min(win.from, win.to));
    const barH = Math.max(2, yBot - yTop);
    const fill = b.isTotal ? `url(#${id}s)` : win.to >= win.from ? GAIN : LOSS;
    out += `<rect x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${bw.toFixed(1)}" height="${barH.toFixed(1)}" rx="8" fill="${fill}"/>`;
    if (i < n - 1) {
      const nextCx = left + slot * (i + 1) + slot / 2;
      const connY = Y(win.to);
      out += `<line x1="${(cx + bw / 2).toFixed(1)}" y1="${connY.toFixed(1)}" x2="${(nextCx - bw / 2).toFixed(1)}" y2="${connY.toFixed(
        1
      )}" stroke="rgba(11,11,11,0.18)" stroke-width="2" stroke-dasharray="4 4"/>`;
    }
    out += `<text x="${cx.toFixed(1)}" y="${(yTop - 14).toFixed(1)}" fill="#0B0B0B" font-family="${MONO}" font-size="26" font-weight="700" text-anchor="middle">${esc(
      fmt(b)
    )}</text>`;
    if (b.label) out += `<text x="${cx.toFixed(1)}" y="${labelY}" fill="#52514E" font-family="${MONO}" font-size="22" text-anchor="middle">${esc(b.label)}</text>`;
  });
  return out + `</svg>`;
}

// Donut from segments [{pct, color, label?}]. centerLabel/centerSub optional. size px square.
export function donut(segments, { size = 360, centerLabel = "", centerSub = "" } = {}) {
  const R = 15.9, C = 2 * Math.PI * R; // ~99.9 ~= 100, so pct maps ~1:1
  let cum = 0;
  let arcs = `<circle cx="21" cy="21" r="${R}" fill="none" stroke="#FCFCFB" stroke-width="6"/>`;
  for (const s of segments) {
    // Coerce + skip, never crash: `s.pct.toFixed()` on an undefined or string pct used to
    // throw and abort the WHOLE render mid-loop (losing every collected warning with it),
    // and a quoted "54.9" is a likely slip given deck values are display strings elsewhere.
    // blocks.mjs warns about what got dropped; this pure fn just stays total.
    const pct = Number(s.pct);
    if (!Number.isFinite(pct)) continue;
    const dash = `${pct.toFixed(2)} ${(100 - pct).toFixed(2)}`;
    const offset = (25 - cum).toFixed(2);
    arcs += `<circle cx="21" cy="21" r="${R}" fill="none" stroke="${s.color}" stroke-width="6" stroke-dasharray="${dash}" stroke-dashoffset="${offset}"/>`;
    cum += pct;
  }
  const center = centerLabel
    ? `<text x="21" y="${centerSub ? 20 : 22.5}" fill="#0B0B0B" font-family="${MONO}" font-size="5" font-weight="700" text-anchor="middle">${esc(centerLabel)}</text>
       ${centerSub ? `<text x="21" y="25.5" fill="#52514E" font-family="${SANS}" font-size="2.4" letter-spacing="0.1" text-anchor="middle">${esc(centerSub)}</text>` : ""}`
    : "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 42 42">${arcs}${center}</svg>`;
}

// Palette for non-"self" series (peers in a comparison): peer0 stays neutral ink (a
// baseline peer reads as "the reference," not a second identity), peer1/peer2 are the
// two remaining validated hues from the approved list not already spent on SELF/GAIN/LOSS
// (blue #3288BD, dark purple #5E4FA2), both pass >=3:1 contrast and clear the adjacent-CVD
// floor next to SELF (see the file header note). Exported so a caller can draw a matching
// legend swatch.
export const PEER_COLORS = ["#52514E", "#3288BD", "#5E4FA2"];

// Assigns each series its plot color ONCE, by peer order (self excluded from the count),
// so a chart (radar/multiLine) and its legend can never disagree — both must read `.color`
// off THIS resolved list rather than each re-deriving their own index into PEER_COLORS.
export function resolveSeriesColors(series) {
  let peerIdx = 0;
  return (series || []).map((s) => {
    if (s.self) return { ...s, color: s.color || null };
    const color = s.color || PEER_COLORS[peerIdx % PEER_COLORS.length];
    peerIdx++;
    return { ...s, color };
  });
}

// Radar/spider chart for multi-axis comparisons (e.g. peer point_summaries scorecards).
// series: [{name, values:number[], self?:boolean, color?:string}], values aligned to `axes`.
// self:true draws the brand gradient fill+stroke on top; every other series is a dashed
// muted outline with no fill, so overlapping peers stay legible instead of a color soup.
//
// The canvas is deliberately WIDER than the polygon (size + hPad each side), not square:
// side-axis labels (cos near ±1) sit almost as far out horizontally as the polygon itself
// is wide, so a square viewBox clips them. A square chart with rectangular label margins
// keeps the radar shape true while giving labels real room. Keep axis labels short (one
// word or a short abbreviation, e.g. "ROE", "Div Yield") — hPad is sized for that, not prose.
// maxValue is either one number shared by every axis (the right call for already-normalized
// 0-100 data like point_summaries) or an array of per-axis ceilings. Raw ratios of different
// natural scales (ROE ~20, CASA ~85, loan growth ~14) under ONE shared maxValue don't distort
// by competitive position, they distort by unit, an axis with a small natural range pins near
// center regardless of how strong that value actually is (caught: a 3-bank scorecard built from
// real ratios, not point_summaries — see visual-language.md's radar section for which data needs
// which form).
export function radar(series, { axes = [], maxValue = 100, size = 400, hPad = 130, vPad = 50 } = {}) {
  const id = uid("rd");
  const w = size + hPad * 2, h = size + vPad * 2;
  const cx = w / 2, cy = h / 2;
  const outerR = size / 2 - 20;
  const n = axes.length || 1;
  const axisMax = (i) => (Array.isArray(maxValue) ? maxValue[i] || 100 : maxValue);
  const angle = (i) => -Math.PI / 2 + (i / n) * 2 * Math.PI;
  const pt = (i, frac) => [cx + Math.cos(angle(i)) * outerR * frac, cy + Math.sin(angle(i)) * outerR * frac];
  const poly = (frac) => Array.from({ length: n }, (_, i) => pt(i, frac).map((v) => v.toFixed(1)).join(",")).join(" ");
  const seriesPoly = (s) =>
    (s.values || []).map((v, i) => pt(i, Math.max(0, Math.min(1, v / axisMax(i)))).map((n) => n.toFixed(1)).join(",")).join(" ");

  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}`;
  [0.25, 0.5, 0.75, 1].forEach((frac) => {
    out += `<polygon points="${poly(frac)}" fill="none" stroke="rgba(11,11,11,0.10)" stroke-width="1.5"/>`;
  });
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, 1);
    out += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(11,11,11,0.10)" stroke-width="1.5"/>`;
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = pt(i, 1.14);
    const c = Math.cos(angle(i));
    const anchor = Math.abs(c) < 0.28 ? "middle" : c > 0 ? "start" : "end";
    out += `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" fill="#52514E" font-family="${SANS}" font-size="20" font-weight="600" text-anchor="${anchor}" dominant-baseline="middle">${esc(axes[i])}</text>`;
  }

  const resolved = resolveSeriesColors(series);
  const peers = resolved.filter((s) => !s.self);
  const self = resolved.find((s) => s.self);
  peers.forEach((s) => {
    out += `<polygon points="${seriesPoly(s)}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.85"/>`;
  });
  if (self) {
    out += `<polygon points="${seriesPoly(self)}" fill="url(#${id}f)" stroke="url(#${id}s)" stroke-width="3.5"/>`;
    (self.values || []).forEach((v, i) => {
      const [x, y] = pt(i, Math.max(0, Math.min(1, v / axisMax(i))));
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${GOLD}"/>`;
    });
  }
  return out + `</svg>`;
}

// Multi-series line/area on one shared axis (e.g. an indexed price vs. peers, or a metric's
// trend across several companies). series: [{name, values:number[], color?, self?, area?}].
// All series share one min/max scale so they stay visually comparable; only the "self"
// series can fill an area (a filled peer would visually dominate and read as the subject).
// startLabel (opt-in): anchors the SELF series' starting value at the left, so its endpoint
// %-change reads against a real number. Only self gets it (a start label on every peer too
// would clutter the left edge with 3-4 numbers); each peer's own endpoint %-change already
// carries how much it moved.
export function multiLine(series, { w = 936, h = 320, pad = 14, padRight = 112, startLabel = false } = {}) {
  const id = uid("ml");
  const all = series.flatMap((s) => s.values || []);
  const min = Math.min(...all), max = Math.max(...all);
  const n = Math.max(1, ...series.map((s) => (s.values || []).length));
  const X = (i) => pad + (i / (n - 1 || 1)) * (w - pad - padRight);
  const Y = (v) => pad + (1 - normFrac(v, min, max)) * (h - 2 * pad);
  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}`;
  const resolved = resolveSeriesColors(series);
  const peers = resolved.filter((s) => !s.self);
  const self = resolved.find((s) => s.self);
  peers.forEach((s) => {
    const pts = (s.values || []).map((v, j) => `${X(j).toFixed(1)},${Y(v).toFixed(1)}`);
    out += `<path d="M${pts.join(" L")}" fill="none" stroke="${s.color}" stroke-width="2.5" stroke-dasharray="6 5" opacity="0.85"/>`;
  });
  if (self) {
    const pts = (self.values || []).map((v, j) => `${X(j).toFixed(1)},${Y(v).toFixed(1)}`);
    const line = `M${pts.join(" L")}`;
    if (self.area) {
      out += `<path d="${line} L${X(self.values.length - 1).toFixed(1)},${h} L${X(0).toFixed(1)},${h} Z" fill="url(#${id}f)"/>`;
    }
    out += `<path d="${line}" fill="none" stroke="url(#${id}s)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  // Every line ends in a dot + its own %-change-from-start label, so the chart carries its
  // own numbers instead of being a bare shape the reader has to trust the caption to explain
  // (a real gap: the chart alone gave no way to tell how much either series actually moved).
  const endpoints = resolved
    .filter((s) => s.values && s.values.length)
    .map((s) => {
      const vals = s.values;
      const first = vals[0], last = vals[vals.length - 1];
      // A series legitimately starting at 0 (a cumulative-flow line) has no defined
      // %-change; it used to lose its endpoint dot AND label entirely, rendering naked
      // next to fully-labeled siblings. Fall back to printing the raw end value: a real
      // number beats silence ("every chart is a promise").
      const pct = first ? ((last - first) / first) * 100 : null;
      const dotY = Y(last);
      return {
        x: X(vals.length - 1),
        dotY,
        labelY: dotY,
        color: s.self ? GOLD : s.color,
        textColor: s.self ? "#0B0B0B" : s.color,
        weight: s.self ? 800 : 700,
        label: pct == null ? trimNum(last) : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`,
      };
    });
  endpoints.sort((a, b) => a.labelY - b.labelY);
  const MIN_GAP = 26;
  for (let i = 1; i < endpoints.length; i++) {
    if (endpoints[i].labelY - endpoints[i - 1].labelY < MIN_GAP) endpoints[i].labelY = endpoints[i - 1].labelY + MIN_GAP;
  }
  // The push-down pass only ever moves labels DOWN, so converging endpoints near the chart
  // floor (the "everything sold off together" shape, exactly when these numbers matter
  // most) used to shove the stack below the viewBox and clip 3 of 4 labels. Shift the
  // resolved stack back up as a unit, then re-space from the top if that pinned the first
  // label above the ceiling (labels render at labelY+7 with a 24px font).
  const maxLabelY = h - 16, minLabelY = 10;
  if (endpoints.length) {
    const overshoot = endpoints[endpoints.length - 1].labelY - maxLabelY;
    if (overshoot > 0) endpoints.forEach((e) => { e.labelY -= overshoot; });
    if (endpoints[0].labelY < minLabelY) {
      endpoints[0].labelY = minLabelY;
      for (let i = 1; i < endpoints.length; i++) {
        if (endpoints[i].labelY - endpoints[i - 1].labelY < MIN_GAP) endpoints[i].labelY = endpoints[i - 1].labelY + MIN_GAP;
      }
    }
  }
  endpoints.forEach((e) => {
    out += `<circle cx="${e.x.toFixed(1)}" cy="${e.dotY.toFixed(1)}" r="5" fill="${e.color}"/>`;
    out += `<text x="${(e.x + 12).toFixed(1)}" y="${(e.labelY + 7).toFixed(1)}" fill="${e.textColor}" font-family="${MONO}" font-size="24" font-weight="${e.weight}" text-anchor="start">${esc(e.label)}</text>`;
  });
  if (startLabel && self && self.values && self.values.length) {
    const first = self.values[0];
    const sx = X(0), sy = Y(first);
    const lbl = typeof startLabel === "string" ? startLabel : trimNum(first);
    const ly = sy < h / 2 ? Math.min(sy + 28, h - 8) : Math.max(sy - 12, 18);
    out += `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="4" fill="${MUTED}"/>
    <text x="${sx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${MUTED}" font-family="${MONO}" font-size="22" font-weight="700" text-anchor="start">${esc(lbl)}</text>`;
  }
  return out + `</svg>`;
}

// Segmented/stacked bar: composition across categories (e.g. revenue by segment per year,
// a cost or funding-mix breakdown). bars: [{label, display?, segments:[{value, color?}]}].
// Segments stack bottom-up in array order. Height is each bar's own total against the tallest
// bar's total (or a shared `maxTotal`), so bar-to-bar height still reads as absolute size,
// it is not forced to 100%.
export function stackedBar(bars, { w = 936, h = 460, maxTotal } = {}) {
  const id = uid("sb");
  const left = 10, right = w - 10, top = 40, baseY = 380, labelY = 424;
  const n = bars.length || 1;
  const totals = bars.map((b) => (b.segments || []).reduce((s, seg) => s + seg.value, 0));
  const max = maxTotal || Math.max(1, ...totals);
  const slot = (right - left) / n;
  const bw = slot * 0.56;
  // Geometry precomputed for every bar so the in-place label rule can be consistent ACROSS
  // bars: a flat per-bar cutoff labeled the same category in one year and silently not in
  // the next (43.6px vs 39.2px on adjacent bars, identical semantics), which reads as an
  // omission error, not a threshold. A segment index that earns a label anywhere (>=40px)
  // also labels in any sibling bar where the 22px text still physically fits (>=28px);
  // segments thin everywhere stay unlabeled everywhere.
  const geoms = bars.map((b, i) => {
    // `total` is the REAL sum (a zero-total bar's label used to print the "|| 1" divisor
    // fallback, i.e. a fabricated "1"); `safeTotal` exists only to keep segment division
    // finite — a zero-height bar divided any which way is still zero-height.
    const total = totals[i];
    const safeTotal = total || 1;
    const barH = (total / max) * (baseY - top);
    return { total, barH, segHs: (b.segments || []).map((seg) => (seg.value / safeTotal) * barH) };
  });
  const labeledIdx = new Set();
  geoms.forEach((g) => g.segHs.forEach((segH, si) => { if (segH >= 40) labeledIdx.add(si); }));
  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}
    <line x1="0" y1="${baseY}" x2="${w}" y2="${baseY}" stroke="rgba(11,11,11,0.12)" stroke-width="2"/>`;
  bars.forEach((b, i) => {
    const cx = left + slot * i + slot / 2;
    const x = cx - bw / 2;
    const { total, barH, segHs } = geoms[i];
    const barTop = baseY - barH;
    const clipId = `${id}c${i}`;
    out += `<clipPath id="${clipId}"><rect x="${x.toFixed(1)}" y="${barTop.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, barH).toFixed(1)}" rx="8"/></clipPath><g clip-path="url(#${clipId})">`;
    let y = baseY;
    (b.segments || []).forEach((seg, si) => {
      const segH = segHs[si];
      y -= segH;
      const fill = seg.color || (si === 0 ? `url(#${id}s)` : PEER_COLORS[(si - 1) % PEER_COLORS.length]);
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(1, segH).toFixed(1)}" fill="${fill}"/>`;
      // A stackedbar's own legend only ever anchors to the MOST RECENT bar (blocks.mjs's
      // seriesLegend), so every earlier bar was shape-only — no number a reader could check
      // without body copy standing in for the chart (caught: a 3-year ownership-mix story
      // whose first two years had no on-chart figure at all). Print each segment's own value
      // in place when there's room (see the cross-bar consistency rule above).
      if (segH >= 40 || (labeledIdx.has(si) && segH >= 28)) {
        out += `<text x="${cx.toFixed(1)}" y="${(y + segH / 2 + 8).toFixed(1)}" fill="#0B0B0B" font-family="${MONO}" font-size="22" font-weight="700" text-anchor="middle">${esc(
          seg.display ?? trimNum(seg.value)
        )}</text>`;
      }
    });
    out += `</g>`;
    out += `<text x="${cx.toFixed(1)}" y="${(barTop - 14).toFixed(1)}" fill="#0B0B0B" font-family="${MONO}" font-size="26" font-weight="700" text-anchor="middle">${esc(b.display ?? trimNum(total))}</text>`;
    if (b.label) out += `<text x="${cx.toFixed(1)}" y="${labelY}" fill="#52514E" font-family="${MONO}" font-size="24" text-anchor="middle">${esc(b.label)}</text>`;
  });
  return out + `</svg>`;
}

// Two-axis positioning ("who's cheap AND big"): unlike every other chart in this file, x and
// y each get their OWN domain instead of one shared min/max, because the two things being
// plotted (a peers report's pe_ttm vs market_cap for ~10 peers, a broker's gross vs net) don't
// share a natural scale at all. radar's 3-peer-color ceiling can't hold a 10-way comparison
// and table shows the same numbers without the CLUSTERING read (cheap-and-big vs cheap-and-
// small looks identical in a column of numbers, not in a scatter). points are pre-sanitized by
// scatterBlock in blocks.mjs (numeric x/y, log-scale non-positive values dropped, at most one
// "self") — this fn is pure geometry + label placement, it pushes no warnings itself.
export function scatter(points, { w = 936, h = 560, xLabel = "", yLabel = "", xScale, yScale } = {}) {
  const id = uid("sc");
  const left = 104, right = w - 32, top = 56, bottom = h - 118;
  // inset keeps dots (and the biggest bubble) off the axis lines themselves, so an extreme
  // point never sits glued to the frame it's being measured against.
  const inset = 30;
  const plotL = left + inset, plotR = right - inset, plotT = top + inset, plotB = bottom - inset;

  const xf = xScale === "log" ? Math.log10 : (v) => v;
  const yf = yScale === "log" ? Math.log10 : (v) => v;
  const xsRaw = points.map((p) => p.x), ysRaw = points.map((p) => p.y);
  const xMinRaw = xsRaw.length ? Math.min(...xsRaw) : 0, xMaxRaw = xsRaw.length ? Math.max(...xsRaw) : 1;
  const yMinRaw = ysRaw.length ? Math.min(...ysRaw) : 0, yMaxRaw = ysRaw.length ? Math.max(...ysRaw) : 1;
  const xMinT = xf(xMinRaw), xMaxT = xf(xMaxRaw), yMinT = yf(yMinRaw), yMaxT = yf(yMaxRaw);

  const X = (v) => plotL + normFrac(xf(v), xMinT, xMaxT) * (plotR - plotL);
  const Y = (v) => plotB - normFrac(yf(v), yMinT, yMaxT) * (plotB - plotT);

  // size -> radius via SQRT scaling (area, not radius, should track the value — a 4x bigger
  // number should look ~2x the visual size to the eye, not 4x), capped so the biggest bubble
  // can't dwarf the ~386px-tall plot. Points with no size use a fixed dot radius; self is a
  // touch bigger so it reads as the subject even before the gradient fill registers.
  const sizes = points.map((p) => p.size).filter((v) => Number.isFinite(v) && v > 0);
  const maxSize = sizes.length ? Math.max(...sizes) : 0;
  const MIN_R = 8, MAX_R = 28;
  const radiusOf = (p) =>
    maxSize && Number.isFinite(p.size) && p.size > 0
      ? MIN_R + Math.sqrt(p.size / maxSize) * (MAX_R - MIN_R)
      : p.self
      ? 10
      : 7;

  const self = points.find((p) => p.self);
  // <=6 points: there's room, label everyone. Past that, only self + the min/max outlier on
  // EACH axis get a label — the unlabeled dots still carry the clustering SHAPE, the labels
  // carry the specific numbers a reader needs (the same "narratively load-bearing points
  // survive the thinning" logic barChart already applies past 6 bars). This does not de-
  // collide labels from EACH OTHER (only from the viewBox edges, below) — perfection isn't
  // required, a rare overlap between two close outliers is a smaller sin than an unreadable
  // wall of 10+ labels.
  let labelSet;
  if (points.length <= 6) labelSet = new Set(points);
  else {
    labelSet = new Set();
    if (self) labelSet.add(self);
    const byX = [...points].sort((a, b) => a.x - b.x);
    const byY = [...points].sort((a, b) => a.y - b.y);
    [byX[0], byX[byX.length - 1], byY[0], byY[byY.length - 1]].forEach((p) => labelSet.add(p));
  }

  const fmtDisp = (v, d) => (d != null ? d : trimNum(v));
  const fmtPoint = (p) => `${p.label ?? "?"} (${fmtDisp(p.x, p.displayX)}, ${fmtDisp(p.y, p.displayY)})`;

  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}
    <line x1="${left}" y1="${top}" x2="${left}" y2="${bottom}" stroke="rgba(11,11,11,0.12)" stroke-width="2"/>
    <line x1="${left}" y1="${bottom}" x2="${right}" y2="${bottom}" stroke="rgba(11,11,11,0.12)" stroke-width="2"/>`;

  // dots: peers first, self last, so the subject always sits on top of any overlap
  for (const p of points) {
    if (p.self) continue;
    out += `<circle cx="${X(p.x).toFixed(1)}" cy="${Y(p.y).toFixed(1)}" r="${radiusOf(p).toFixed(1)}" fill="${MUTED}" opacity="0.82"/>`;
  }
  if (self) {
    const r = radiusOf(self);
    out += `<circle cx="${X(self.x).toFixed(1)}" cy="${Y(self.y).toFixed(1)}" r="${(r + 6).toFixed(1)}" fill="none" stroke="${GOLD}" stroke-opacity="0.3" stroke-width="3"/>
    <circle cx="${X(self.x).toFixed(1)}" cy="${Y(self.y).toFixed(1)}" r="${r.toFixed(1)}" fill="url(#${id}s)"/>`;
  }

  // labels: drawn after every dot so text always sits on top. Nudged inward when they'd
  // otherwise clip past the right edge (flip text-anchor, same endpoint-label precedent as
  // multiLine/coverDuel), then hard-clamped as a last resort so an adversarial case (an
  // extreme corner point, a long name) still can't render outside the canvas.
  for (const p of labelSet) {
    const cx = X(p.x), cy = Y(p.y);
    const text = fmtPoint(p);
    const estW = text.length * 12.5; // ~0.57em/char estimate for 22px mono, no text-measurement available here
    let anchor = "start", tx = cx + 14;
    if (tx + estW > w - 10) {
      anchor = "end";
      tx = cx - 14;
    }
    if (tx <= 8) {
      tx = 8;
      anchor = "start";
    } else if (tx >= w - 8) {
      tx = w - 8;
      anchor = "end";
    }
    const ty = Math.max(16, Math.min(h - 16, cy + 6));
    const fill = p.self ? "#0B0B0B" : MUTED;
    const weight = p.self ? 800 : 700;
    out += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${fill}" font-family="${MONO}" font-size="22" font-weight="${weight}" text-anchor="${anchor}">${esc(
      text
    )}</text>`;
  }

  // axis frame: minimal, faint baseline lines (same convention as bar/waterfall's single
  // baseline) plus xLabel/yLabel AND each axis's numeric min/max printed at the plot edges —
  // no gridlines needed to read the scale. The min/max text reuses the SAME resolved display
  // string as that point's own label (found by matching the raw extreme value back to its
  // point) rather than re-deriving formatting, so the axis edge can never disagree with the
  // point label sitting right next to it.
  const xMinPt = points.find((p) => p.x === xMinRaw), xMaxPt = points.find((p) => p.x === xMaxRaw);
  const yMinPt = points.find((p) => p.y === yMinRaw), yMaxPt = points.find((p) => p.y === yMaxRaw);
  const xMinDisp = xMinPt ? fmtDisp(xMinPt.x, xMinPt.displayX) : trimNum(xMinRaw);
  const xMaxDisp = xMaxPt ? fmtDisp(xMaxPt.x, xMaxPt.displayX) : trimNum(xMaxRaw);
  const yMinDisp = yMinPt ? fmtDisp(yMinPt.y, yMinPt.displayY) : trimNum(yMinRaw);
  const yMaxDisp = yMaxPt ? fmtDisp(yMaxPt.y, yMaxPt.displayY) : trimNum(yMaxRaw);
  if (xLabel)
    out += `<text x="${((left + right) / 2).toFixed(1)}" y="${h - 14}" fill="${MUTED}" font-family="${SANS}" font-size="22" font-weight="600" text-anchor="middle">${esc(
      xLabel
    )}</text>`;
  out += `<text x="${left}" y="${bottom + 34}" fill="${MUTED}" font-family="${MONO}" font-size="22" text-anchor="start">${esc(xMinDisp)}</text>
    <text x="${right}" y="${bottom + 34}" fill="${MUTED}" font-family="${MONO}" font-size="22" text-anchor="end">${esc(xMaxDisp)}</text>`;
  if (yLabel) out += `<text x="8" y="26" fill="${MUTED}" font-family="${SANS}" font-size="22" font-weight="600" text-anchor="start">${esc(yLabel)}</text>`;
  out += `<text x="${left - 12}" y="${top + 8}" fill="${MUTED}" font-family="${MONO}" font-size="22" text-anchor="end">${esc(yMaxDisp)}</text>
    <text x="${left - 12}" y="${bottom - 2}" fill="${MUTED}" font-family="${MONO}" font-size="22" text-anchor="end">${esc(yMinDisp)}</text>`;

  return out + `</svg>`;
}

// Ranked leaderboard over time ("bump chart"): each symbol's rank (1..N slots) tracked across
// a run of days, e.g. the daily top-5-by-volume leaderboard whose membership rotates day to
// day (examples/most_traded.json). days: [{date, entries:[{symbol,value?,display?}]}], entries
// already in rank order (index 0 = rank 1). Points are pre-sanitized by bumpBlock in blocks.mjs
// (duplicate symbols within a day dropped, `highlight` resolved to a real symbol or null) —
// this fn is pure geometry + label placement, the same "sanitize in blocks.mjs, draw in
// charts.mjs" split scatter()/heatmapBlock already use.
//
// COLOR DECISION: a bump chart can legitimately involve 8+ distinct symbols (a 10-day top-5
// leaderboard easily rotates through a dozen names over its run), far past the 3-peer-color
// ceiling every other multi-series chart in this file enforces (radar/multiLine/coverDuel).
// Coloring every line distinctly was considered and rejected: past ~4 simultaneous colors on a
// near-black background they stop being distinguishable anyway (the exact reason the 3-peer
// ceiling exists elsewhere), so an 8-color bump chart would be louder, not more informative,
// than a 2-color one. Instead exactly ONE symbol — the explicit `highlight`, or a symbol that
// holds rank 1 on EVERY day (the same "same name every single day" pattern
// sectors-api/endpoints.md's most-traded doc calls a story on its own) — gets the brand
// gradient; every other symbol renders in the SAME muted treatment. Identity for the muted
// lines is carried by their own endpoint label (and a label at each re-entry point after a
// gap), not by color, the same "identity via label, not palette" move scatter already makes
// past 6 points.
export function bump(days, { w = 936, h = 520, highlight } = {}) {
  const id = uid("bp");
  const left = 56, padRight = 250, top = 44, bottom = h - 66;
  const n = days.length || 1;
  const slots = Math.max(1, ...days.map((d) => (d.entries || []).length));
  const X = (i) => left + (n > 1 ? (i / (n - 1)) * (w - left - padRight) : 0);
  const Y = (rank) => top + (slots > 1 ? ((rank - 1) / (slots - 1)) * (bottom - top) : (bottom - top) / 2);

  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}`;

  // rank grid: faint horizontal guides + the rank numbers themselves, mono, muted, down the
  // left margin — visual-language.md's "print the rank numbers down the left."
  for (let r = 1; r <= slots; r++) {
    const y = Y(r);
    out += `<line x1="${left}" y1="${y.toFixed(1)}" x2="${(w - padRight).toFixed(1)}" y2="${y.toFixed(1)}" stroke="rgba(11,11,11,0.08)" stroke-width="1.5"/>
    <text x="${(left - 14).toFixed(1)}" y="${(y + 7).toFixed(1)}" fill="${MUTED}" font-family="${MONO}" font-size="22" font-weight="700" text-anchor="end">${r}</text>`;
  }

  // date labels along the bottom, thinned past 7 days the SAME way barChart's x-axis labels
  // are (n>7 -> print every other one) — a bump chart is read left-to-right same as a bar
  // chart's time axis, no reason to invent a second thinning convention.
  const everyOther = n > 7;
  days.forEach((d, i) => {
    if (everyOther && i % 2 !== 0) return;
    out += `<text x="${X(i).toFixed(1)}" y="${(h - 24).toFixed(1)}" fill="${MUTED}" font-family="${MONO}" font-size="22" text-anchor="middle">${esc(d.date ?? "")}</text>`;
  });

  // group entries by symbol -> sparse per-day {dayIndex, rank, value, display}, day order
  // preserved so a contiguous run can be found below.
  const bySymbol = new Map();
  days.forEach((d, i) => {
    (d.entries || []).forEach((e, rankIdx) => {
      if (!bySymbol.has(e.symbol)) bySymbol.set(e.symbol, []);
      bySymbol.get(e.symbol).push({ i, rank: rankIdx + 1, value: e.value, display: e.display });
    });
  });

  // A symbol absent from a day breaks its line into a new subpath, BY DESIGN (visual-
  // language.md): a name that drops off the tracked leaderboard for a stretch and comes back
  // is a different shape than one that never left, and drawing a straight connector across the
  // gap would erase that difference.
  const runsOf = (points) => {
    const runs = [];
    for (const p of points) {
      const last = runs[runs.length - 1];
      if (last && p.i === last[last.length - 1].i + 1) last.push(p);
      else runs.push([p]);
    }
    return runs;
  };

  const endpointLabels = [];
  const reentryLabels = [];
  const exitLabels = [];
  let highlightRuns = null;

  // muted lines drawn first, the highlight last, so it always sits on top at every crossing.
  const symbols = [...bySymbol.keys()];
  const order = highlight ? [...symbols.filter((s) => s !== highlight), highlight] : symbols;

  for (const symbol of order) {
    const points = bySymbol.get(symbol);
    const runs = runsOf(points);
    const isHi = symbol === highlight;
    if (isHi) highlightRuns = runs;
    const stroke = isHi ? `url(#${id}s)` : MUTED;
    const strokeWidth = isHi ? 4.5 : 2.5;
    const opacity = isHi ? 1 : 0.55;
    const dotR = isHi ? 5 : 3.5;
    const dotFill = isHi ? GOLD : MUTED;

    runs.forEach((run, ri) => {
      const pts = run.map((p) => `${X(p.i).toFixed(1)},${Y(p.rank).toFixed(1)}`);
      out += `<path d="M${pts.join(" L")}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${opacity}"/>`;
      run.forEach((p) => {
        out += `<circle cx="${X(p.i).toFixed(1)}" cy="${Y(p.rank).toFixed(1)}" r="${dotR}" fill="${dotFill}" opacity="${isHi ? 1 : 0.75}"/>`;
      });
      // A run's boundaries get small bare-symbol waypoint labels, EXCEPT the run that ends
      // the chart's actual final day (that one gets the full "#rank · value" endpoint
      // treatment below instead, with its own de-collision pass). Two boundary events:
      //   RE-ENTRY (this run's START, only when ri>0 — a comeback after a gap)
      //   EXIT     (this run's END, when it doesn't already end on the final day — a name
      //             that drops off, with or without ever coming back)
      // A single-point run has the SAME point as both its start and end, so a naive "push
      // both" doubles up an identical label on top of itself (caught rendering this exact
      // demo: a symbol with a one-day comeback mid-chart drew "SYMBOL" twice, stacked exactly
      // on the same coordinate). Push at most once per run: re-entry wins when this run is
      // itself a comeback (ri>0), otherwise the lone/lingering point still needs exactly one
      // identifying label (a symbol appearing once and never returning, e.g. one day at the
      // bottom slot, would otherwise carry no label anywhere on the chart).
      const first = run[0], last = run[run.length - 1];
      const isFinalRun = ri === runs.length - 1;
      const isEndpointRun = isFinalRun && last.i === n - 1;
      if (!isEndpointRun) {
        if (ri > 0) reentryLabels.push({ x: X(first.i), y: Y(first.rank), symbol, isHi });
        if (run.length > 1) exitLabels.push({ x: X(last.i), y: Y(last.rank), symbol, isHi });
        else if (ri === 0) exitLabels.push({ x: X(last.i), y: Y(last.rank), symbol, isHi });
      }
      // (isEndpointRun's own re-entry, if ri>0, is deliberately unmarked: the endpoint label
      // a few pixels away plus the visible gap in the line itself already say "this just came
      // back," a second tag right next to an already-dense endpoint cluster would crowd more
      // than it would clarify.)
    });

    const last = points[points.length - 1];
    if (last.i === n - 1) {
      const valuePart = last.display != null || last.value != null ? ` · ${last.display ?? trimNum(last.value)}` : "";
      endpointLabels.push({ x: X(last.i), y: Y(last.rank), rank: last.rank, isHi, text: `${symbol} #${last.rank}${valuePart}` });
    }
  }

  // exit/re-entry waypoint labels: small, clamped to the viewbox, no cross-label
  // de-collision — these points are scattered across different x AND y positions (unlike the
  // endpoint cluster below, which all share one x), so a collision here is rare enough not to
  // warrant the multiLine-style de-collision pass the endpoint cluster gets.
  [...reentryLabels, ...exitLabels].forEach((r) => {
    const tx = Math.min(Math.max(r.x + 10, 8), w - 8);
    const ty = Math.min(Math.max(r.y - 12, 16), h - 16);
    out += `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}" fill="${r.isHi ? "#0B0B0B" : MUTED}" font-family="${MONO}" font-size="20" font-weight="${r.isHi ? 800 : 600}" opacity="0.9">${esc(r.symbol)}</text>`;
  });

  // endpoint labels: the SAME de-collision + clamp approach as multiLine/coverDuel (sort by y,
  // enforce a min gap, then shift the whole stack back inside the viewbox as a unit rather
  // than letting a converging cluster near the floor clip below it).
  endpointLabels.sort((a, b) => a.y - b.y);
  const MIN_GAP = 26;
  for (let i = 1; i < endpointLabels.length; i++) {
    if (endpointLabels[i].y - endpointLabels[i - 1].y < MIN_GAP) endpointLabels[i].y = endpointLabels[i - 1].y + MIN_GAP;
  }
  if (endpointLabels.length) {
    const maxY = h - 16, minY = 16;
    const overshoot = endpointLabels[endpointLabels.length - 1].y - maxY;
    if (overshoot > 0) endpointLabels.forEach((e) => { e.y -= overshoot; });
    if (endpointLabels[0].y < minY) {
      endpointLabels[0].y = minY;
      for (let i = 1; i < endpointLabels.length; i++) {
        if (endpointLabels[i].y - endpointLabels[i - 1].y < MIN_GAP) endpointLabels[i].y = endpointLabels[i - 1].y + MIN_GAP;
      }
    }
  }
  endpointLabels.forEach((e) => {
    // Adversarial-length guard (a pathologically long symbol string): estimate the label's
    // rendered width and hard-clamp its anchor inside the viewbox, the same precedent as
    // scatter's label placement. The selftest checks the printed x/y ATTRIBUTE stays in
    // bounds (not the rendered glyph extent); the root <svg>'s default overflow:hidden is the
    // last line of defense if an extreme string still paints past its anchor.
    const estW = e.text.length * 15;
    let anchor = "start", tx = e.x + 14;
    if (tx + estW > w - 16) { anchor = "end"; tx = w - 16; }
    if (tx < 8) tx = 8;
    out += `<circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="${e.isHi ? 6 : 4}" fill="${e.isHi ? GOLD : MUTED}"/>
    <text x="${tx.toFixed(1)}" y="${(e.y + 7).toFixed(1)}" fill="${e.isHi ? "#0B0B0B" : MUTED}" font-family="${MONO}" font-size="24" font-weight="${e.isHi ? 800 : 700}" text-anchor="${anchor}">${esc(e.text)}</text>`;
  });

  // The highlighted symbol's streak prints as a small annotation, but only when it's
  // genuinely a streak (2+ consecutive tracked days at rank 1) — an explicit `highlight`
  // need not be the rank-1 leader at all, in which case this simply doesn't print (the
  // endpoint label above still carries its real final rank/value either way, "every chart is
  // a promise" holds regardless of whether a streak exists to brag about).
  if (highlight && highlightRuns) {
    let best = 0, bestStartI = null, curRun = 0, curStartI = null;
    for (const run of highlightRuns) {
      curRun = 0;
      for (const p of run) {
        if (p.rank === 1) {
          if (curRun === 0) curStartI = p.i;
          curRun++;
          if (curRun > best) { best = curRun; bestStartI = curStartI; }
        } else curRun = 0;
      }
    }
    if (best >= 2) {
      const label = best === n ? `${highlight} · #1 ALL ${n} DAYS` : `${highlight} · #1, ${best} STRAIGHT DAYS`;
      const sx = Math.min(X(bestStartI), w - 300);
      out += `<text x="${sx.toFixed(1)}" y="${(top - 16).toFixed(1)}" fill="${GOLD}" font-family="${MONO}" font-size="22" font-weight="700">${esc(label)}</text>`;
    }
  }

  return out + `</svg>`;
}

// Pure depth/throughput helpers shared with blocks.mjs's sankeyBlock (cap and self-check
// warnings), so a warning's text can never disagree with what the chart itself draws — the
// same "one shared source, not two copies that can drift" principle as collectTickers/
// resolveSeriesColors elsewhere in this file.
//
// Depth = longest path from a root (a node with no incoming link), via Kahn's topological
// order, so a node with parents at different depths always lands one past its DEEPEST parent
// — never drawn to the left of a link that feeds it. Assumes a DAG; blocks.mjs's
// dropCycleEdges guarantees that before this ever runs.
export function sankeyDepths(links) {
  const nodes = new Set();
  const outAdj = new Map();
  const inDeg = new Map();
  for (const l of links) {
    nodes.add(l.source); nodes.add(l.target);
    if (!outAdj.has(l.source)) outAdj.set(l.source, []);
    outAdj.get(l.source).push(l.target);
    inDeg.set(l.target, (inDeg.get(l.target) || 0) + 1);
    if (!inDeg.has(l.source)) inDeg.set(l.source, inDeg.get(l.source) || 0);
  }
  const depth = new Map();
  const remaining = new Map(inDeg);
  const q = [...nodes].filter((nd) => !inDeg.get(nd));
  q.forEach((nd) => depth.set(nd, 0));
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    for (const v of outAdj.get(u) || []) {
      depth.set(v, Math.max(depth.get(v) ?? 0, (depth.get(u) ?? 0) + 1));
      remaining.set(v, remaining.get(v) - 1);
      if (remaining.get(v) === 0) q.push(v);
    }
  }
  // A node untouched by the pass above (shouldn't happen on a real DAG reachable from its own
  // roots, but a node stripped down to nothing but cycle membership could end up orphaned)
  // defaults to depth 0 rather than being silently dropped from the diagram.
  for (const nd of nodes) if (!depth.has(nd)) depth.set(nd, 0);
  return depth;
}

export function sankeyNodeTotals(links) {
  const totals = new Map();
  const get = (nd) => {
    if (!totals.has(nd)) totals.set(nd, { inSum: 0, outSum: 0 });
    return totals.get(nd);
  };
  for (const l of links) {
    get(l.source).outSum += l.value;
    get(l.target).inSum += l.value;
  }
  return totals;
}

// A node's inflow and outflow are supposed to reconcile (that's what makes it a decomposition
// TREE, not just a bag of unrelated flows); sectors-api/data-quality.md documents that most
// real P&L trees do NOT. 1.5%, not 0%, so ordinary rounding in the source financials (values
// already rounded to whole units before they ever reach this chart) doesn't trip a false
// alarm on data that's actually fine.
export const SANKEY_MISMATCH_THRESHOLD = 0.015;

// Multi-level flow decomposition ("where does the revenue actually go"). links:
// [{source,target,value,display?}], nodes are DERIVED from the links (no separate node list) —
// layered left to right by topological depth (sankeyDepths above), a node's bar height is
// proportional to its throughput (max of its in-sum/out-sum), links are smooth ribbons whose
// thickness is proportional to value. Links are pre-sanitized by sankeyBlock in blocks.mjs
// (non-numeric/self-loop/cycle-closing links dropped, small links auto-collapsed into
// "Other (n)") — same "sanitize in blocks.mjs, draw in charts.mjs" split as
// scatter()/heatmapBlock, so this fn can assume a clean DAG and just do geometry + labels.
//
// BRAND MOMENT: the gradient goes on the single DOMINANT root-to-leaf CHAIN (start at the
// biggest root, always follow each node's largest outgoing link until a leaf), not on the
// single largest link in isolation. A chain tells "where most of the money actually ends up"
// as one coherent thread, a stronger and more legible story than lighting up one disconnected
// ribbon while its neighbors on the very same path stay muted. Every node bar stays neutral
// regardless of whether it sits on the chain — the emphasis lives in the flow, not the boxes —
// so this is still ONE brand moment per slide even though it spans several links.
//
// SELF-CHECK: a node with both inflows and outflows whose sums disagree beyond
// SANKEY_MISMATCH_THRESHOLD draws a hatched gap at the short side's shortfall instead of
// silently stretching either side to fit — the same "never fabricate to fit the frame"
// reasoning as waterfall's connector gap and donut's pct-sum warning, made visible instead of
// just logged, because a reader scrolling past won't see the console warning.
export function sankey(links, { w = 936, h = 820, unit = "" } = {}) {
  const id = uid("sk");
  const NODE_W = 28, GAP = 30, MIN_BAR = 3;
  const top = 60, bottom = h - 46, left = 26, right = w - 26;

  const depths = sankeyDepths(links);
  const totals = sankeyNodeTotals(links);
  const nodeIds = [...totals.keys()];
  const maxDepth = Math.max(0, ...nodeIds.map((nd) => depths.get(nd) ?? 0));
  const layerCount = maxDepth + 1;
  const xOf = (d) => (layerCount > 1 ? left + (d / (layerCount - 1)) * (right - left - NODE_W) : left);
  const nodeTotal = (nd) => { const t = totals.get(nd); return Math.max(t.inSum, t.outSum) || 0; };

  const roots = nodeIds.filter((nd) => !totals.get(nd).inSum);
  const rootTotal = roots.reduce((s, nd) => s + totals.get(nd).outSum, 0) || Math.max(1, ...nodeIds.map(nodeTotal));

  const byLayer = Array.from({ length: layerCount }, () => []);
  nodeIds.forEach((nd) => byLayer[depths.get(nd) ?? 0].push(nd));
  // Bigger flows toward the top within a layer: simple, deterministic, legible. A true
  // crossing-minimization pass (barycenter ordering across the whole diagram) is complexity a
  // hand-rolled static-slide chart doesn't need — real trees this size (TLKM's own reconciling
  // 17-edge tree tops out at 8 nodes in its widest layer) don't produce enough crossings for
  // it to matter.
  byLayer.forEach((layer) => layer.sort((a, b) => nodeTotal(b) - nodeTotal(a)));

  const plotH = bottom - top;
  const maxNodesInLayer = Math.max(1, ...byLayer.map((l) => l.length));
  const scale = Math.max(0.00001, (plotH - (maxNodesInLayer - 1) * GAP) / rootTotal);

  // Node geometry, each layer's stack CENTERED in the plot rather than top-aligned: a layer
  // downstream of a leaf that already peeled off (Cost of Revenue exits at depth 2, so depth
  // 3's stack is shorter than depth 0's) reads as a narrowing flow instead of a stack glued to
  // the ceiling with dead space below it — the exact "void" anti-pattern visual-language.md
  // already bans on a slide level, here at the level of one layer.
  const geom = new Map();
  byLayer.forEach((layer, d) => {
    const heights = layer.map((nd) => Math.max(MIN_BAR, nodeTotal(nd) * scale));
    const stackH = heights.reduce((a, b) => a + b, 0) + (layer.length - 1) * GAP;
    let y = top + (plotH - stackH) / 2;
    layer.forEach((nd, i) => {
      const hgt = heights[i];
      geom.set(nd, { x: xOf(d), y0: y, y1: y + hgt, h: hgt });
      y += hgt + GAP;
    });
  });

  const centerY = (nd) => { const g = geom.get(nd); return g ? (g.y0 + g.y1) / 2 : 0; };
  const outLinks = new Map(), inLinks = new Map();
  links.forEach((l) => {
    if (!outLinks.has(l.source)) outLinks.set(l.source, []);
    outLinks.get(l.source).push(l);
    if (!inLinks.has(l.target)) inLinks.set(l.target, []);
    inLinks.get(l.target).push(l);
  });
  // A node's outgoing ribbons stack in the order of their TARGETS' vertical position (and
  // incoming ribbons in the order of their SOURCES'), so ribbons fan out without crossing each
  // other unnecessarily right at the node they share — a local, cheap stand-in for full
  // crossing minimization that's enough for a tree this size (see the sort comment above).
  outLinks.forEach((arr) => arr.sort((a, b) => centerY(a.target) - centerY(b.target)));
  inLinks.forEach((arr) => arr.sort((a, b) => centerY(a.source) - centerY(b.source)));

  const linkSpan = new Map();
  nodeIds.forEach((nd) => {
    const g = geom.get(nd);
    let ySrc = g.y0;
    (outLinks.get(nd) || []).forEach((l) => {
      const hgt = Math.max(0.6, l.value * scale);
      const rec = linkSpan.get(l) || {};
      rec.sy0 = ySrc; rec.sy1 = ySrc + hgt;
      linkSpan.set(l, rec);
      ySrc += hgt;
    });
    let yTgt = g.y0;
    (inLinks.get(nd) || []).forEach((l) => {
      const hgt = Math.max(0.6, l.value * scale);
      const rec = linkSpan.get(l) || {};
      rec.ty0 = yTgt; rec.ty1 = yTgt + hgt;
      linkSpan.set(l, rec);
      yTgt += hgt;
    });
  });

  // A node's bar height already equals max(inSum,outSum)*scale (the taller side, by
  // construction of `heights` above), so the SHORTER side's own ribbon stack, built the exact
  // same way, naturally comes up short of the bar's full height — that shortfall IS the gap,
  // computed once here from real stacked geometry rather than re-derived from the raw sums, so
  // the drawn hatch can never disagree with where the ribbons actually stop.
  const hatchNodes = [];
  nodeIds.forEach((nd) => {
    const t = totals.get(nd);
    if (t.inSum > 0 && t.outSum > 0) {
      const bigger = Math.max(t.inSum, t.outSum), smaller = Math.min(t.inSum, t.outSum);
      if ((bigger - smaller) / bigger > SANKEY_MISMATCH_THRESHOLD) {
        const g = geom.get(nd);
        const solidH = Math.max(MIN_BAR, smaller * scale);
        hatchNodes.push({ y0: g.y0 + solidH, y1: g.y1, x: g.x });
      }
    }
  });

  // dominant root-to-leaf chain: start at the biggest root, always take the biggest outgoing
  // link, stop at a leaf. `seen` guards against an infinite loop; shouldn't trigger on a DAG.
  const dominantLinks = new Set();
  if (roots.length) {
    let cur = roots.reduce((a, b) => (totals.get(b).outSum > totals.get(a).outSum ? b : a));
    const seen = new Set();
    while ((outLinks.get(cur) || []).length && !seen.has(cur)) {
      seen.add(cur);
      const biggest = outLinks.get(cur).reduce((a, b) => (b.value > a.value ? b : a));
      dominantLinks.add(biggest);
      cur = biggest.target;
    }
  }

  const ribbonPath = (l) => {
    const sp = linkSpan.get(l);
    const sx = geom.get(l.source).x + NODE_W, tx = geom.get(l.target).x;
    const xm = (sx + tx) / 2;
    return `M${sx.toFixed(1)},${sp.sy0.toFixed(1)} C${xm.toFixed(1)},${sp.sy0.toFixed(1)} ${xm.toFixed(1)},${sp.ty0.toFixed(1)} ${tx.toFixed(1)},${sp.ty0.toFixed(1)} L${tx.toFixed(1)},${sp.ty1.toFixed(1)} C${xm.toFixed(1)},${sp.ty1.toFixed(1)} ${xm.toFixed(1)},${sp.sy1.toFixed(1)} ${sx.toFixed(1)},${sp.sy1.toFixed(1)} Z`;
  };

  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}
    <pattern id="${id}hatch" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
      <line x1="0" y1="0" x2="0" y2="10" stroke="${LOSS}" stroke-width="3" opacity="0.6"/>
    </pattern>`;

  // links drawn first so the node bars sit cleanly on top of their ribbon ends. Muted ribbons
  // read at 0.32, not the 0.14-0.18 range every other muted fill in this file uses: those are
  // thin STROKES on top of the near-black background, but a ribbon is a large FILLED area, and
  // at stroke-grade alpha a whole non-dominant flow all but vanished into the background in an
  // early render, undermining the entire "everything else stays muted, but still legible"
  // premise (a chart whose non-highlighted majority is invisible isn't muted, it's missing).
  links.forEach((l) => {
    const hi = dominantLinks.has(l);
    out += `<path d="${ribbonPath(l)}" fill="${hi ? `url(#${id}s)` : MUTED}" opacity="${hi ? 0.55 : 0.32}"/>`;
  });

  nodeIds.forEach((nd) => {
    const g = geom.get(nd);
    out += `<rect x="${g.x.toFixed(1)}" y="${g.y0.toFixed(1)}" width="${NODE_W}" height="${Math.max(1, g.h).toFixed(1)}" rx="5" fill="rgba(11,11,11,0.12)" stroke="rgba(11,11,11,0.30)" stroke-width="1.3"/>`;
  });
  hatchNodes.forEach((hn) => {
    out += `<rect x="${hn.x.toFixed(1)}" y="${hn.y0.toFixed(1)}" width="${NODE_W}" height="${Math.max(1, hn.y1 - hn.y0).toFixed(1)}" rx="3" fill="url(#${id}hatch)" stroke="${LOSS}" stroke-width="1" stroke-opacity="0.7"/>`;
  });

  const fmtTotal = (v) => `${trimNum(v)}${unit}`;
  const truncate = (s, max) => (s.length > max ? s.slice(0, Math.max(1, max - 1)).trimEnd() + "…" : s);
  const layerGapPx = layerCount > 1 ? (right - left - NODE_W) / (layerCount - 1) : w;
  const nameCharBudget = Math.max(8, Math.min(30, Math.floor((layerGapPx * 0.92) / 9.2)));

  // Nodes whose bar was too short for the rotated in-bar total fall back to a "name · total"
  // label instead (below); tracked here so the link-label pass can skip re-printing that
  // SAME number a few px away on a single-degree node's one ribbon (see the link-label
  // comment below for why only that specific adjacency is suppressed, not every redundancy).
  const shortLabeledNodes = new Set();

  // Name labels are CENTERED over their bar for a middle layer (ribbons flow past on both
  // sides, there's no "outward" direction to lean on), but the outermost layers get a real
  // canvas edge on one side: a centered label there bleeds off the left/right edge of the
  // whole diagram (caught rendering this exact demo — "Data & Internet" clipped to "ta &
  // Internet" against the left margin, "Gross Profit" clipped to "Gross Profi" against the
  // right). Anchor those two layers OUTWARD from the canvas edge instead — start-anchored at
  // the bar's own left edge for depth 0, end-anchored at the bar's own right edge for the
  // last depth — so the text always grows INTO the canvas, never out of it.
  //
  // A LEAF that ISN'T in the last layer (a branch that ends early, e.g. TLKM's "Operating
  // Income" has no further split while its sibling "Operating Expense" keeps branching two
  // more layers deep) gets the SAME end-anchored treatment as a true last-layer node, not
  // "middle": nothing flows rightward from a leaf, so there's no ribbon on its right side to
  // center over, and a centered label there has nothing stopping it from reaching into a
  // deeper layer's column that happens to share similar vertical space (caught rendering the
  // real TLKM tree: "Operating Income," centered on depth 3, ran straight into "Interconnection"
  // sitting in depth 4 a row below).
  nodeIds.forEach((nd) => {
    const g = geom.get(nd);
    const cx = g.x + NODE_W / 2;
    const depth = depths.get(nd) ?? 0;
    const isLeaf = !(outLinks.get(nd) || []).length;
    const isFirstLayer = depth === 0, isLastLayer = depth === maxDepth || (isLeaf && depth > 0);
    const nameAnchor = isFirstLayer ? "start" : isLastLayer ? "end" : "middle";
    const nameX = isFirstLayer ? g.x : isLastLayer ? g.x + NODE_W : cx;
    const dispTotal = fmtTotal(nodeTotal(nd));
    const name = truncate(String(nd), nameCharBudget);
    // The bar is only NODE_W (28px) wide, far too narrow for horizontal text once a total has
    // more than 2-3 digits, so the value goes INSIDE the bar rotated -90deg (reading along its
    // height, which for a value big enough to need this is usually well past 28px) whenever
    // the bar is tall enough to hold the rotated string; otherwise it's appended to the name
    // label above the bar instead, so a tiny sliver of a node never loses its number.
    const textLen = dispTotal.length * 9.5 + 16;
    if (g.h >= textLen) {
      out += `<text x="${nameX.toFixed(1)}" y="${(g.y0 - 10).toFixed(1)}" fill="${MUTED}" font-family="${SANS}" font-size="17" font-weight="600" text-anchor="${nameAnchor}">${esc(name)}</text>
      <text x="${cx.toFixed(1)}" y="${((g.y0 + g.y1) / 2).toFixed(1)}" fill="#0B0B0B" font-family="${MONO}" font-size="15" font-weight="700" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90 ${cx.toFixed(1)} ${((g.y0 + g.y1) / 2).toFixed(1)})">${esc(dispTotal)}</text>`;
    } else {
      shortLabeledNodes.add(nd);
      out += `<text x="${nameX.toFixed(1)}" y="${(g.y0 - 10).toFixed(1)}" fill="${MUTED}" font-family="${SANS}" font-size="16" font-weight="600" text-anchor="${nameAnchor}"><tspan>${esc(name)}</tspan><tspan font-family="${MONO}" fill="#0B0B0B" font-weight="700"> · ${esc(dispTotal)}</tspan></text>`;
    }
  });

  // link value labels: only where the ribbon is thick enough to hold text cleanly, or the
  // link itself is a big enough share of the whole tree to be load-bearing (visual-language's
  // "print the value when it's readable OR >=~8% of the root" — smaller links still count
  // toward both endpoints' printed totals, they just don't repeat their own number a second
  // time on a ribbon too thin to hold it).
  links.forEach((l) => {
    const sp = linkSpan.get(l);
    const thicknessPx = Math.abs(sp.sy1 - sp.sy0);
    if (thicknessPx < 22 && l.value / rootTotal < 0.08) return;
    // A node/link total both printing the SAME number is normal Sankey convention when
    // they're spatially apart (a node's own total and a mid-ribbon value read as two
    // independent data points). It stops reading that way when the ribbon's source OR target
    // is a single-degree node that ALREADY spelled its total out as "name · total" a few px
    // away (caught twice rendering real fixtures: "Fixed Line · 3T" sat directly next to a
    // floating "3T" for the SOURCE side; TLKM's real tree caught the TARGET side too,
    // "Interconnection · 6.88T" right next to a floating "6.88T" for its one inbound link) —
    // skip only that specific adjacency, not the general redundancy this chart is fine with.
    const soleOutflow = (outLinks.get(l.source) || []).length === 1;
    const soleInflow = (inLinks.get(l.target) || []).length === 1;
    if ((soleOutflow && shortLabeledNodes.has(l.source)) || (soleInflow && shortLabeledNodes.has(l.target))) return;
    const sx = geom.get(l.source).x + NODE_W, tx = geom.get(l.target).x;
    const xm = (sx + tx) / 2;
    const midY = ((sp.sy0 + sp.sy1) / 2 + (sp.ty0 + sp.ty1) / 2) / 2;
    const text = l.display ?? fmtTotal(l.value);
    out += `<text x="${xm.toFixed(1)}" y="${midY.toFixed(1)}" fill="#0B0B0B" font-family="${MONO}" font-size="18" font-weight="700" text-anchor="middle">${esc(text)}</text>`;
  });

  return out + `</svg>`;
}

const MONO = "'JetBrains Mono',ui-monospace,monospace";
const SANS = "'Plus Jakarta Sans',system-ui,sans-serif";

function trimNum(v) {
  if (!isFinite(v)) return String(v);
  return (Math.round(v * 100) / 100).toString();
}
function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ── Compose: a brand-governed toolkit for charts we did NOT pre-build ─────────────────────
// The 13 named kinds above carry the vast majority of IDX stories; `compose` is the escape
// hatch for the rare shape none of them fit (a slope/dumbbell/lollipop, a gauge, a
// candlestick-ish range, a bespoke annotated scatter). The agent describes the chart
// DECLARATIVELY as a list of governed layers and this assembles it entirely from the same
// primitives the named kinds use, so a novel chart still cannot drift off-brand:
//   • colors are SEMANTIC tokens only (self/gain/loss/muted/text/peer0-2), never raw hex, so
//     the agent can pick a house role but can't introduce a foreign color;
//   • the one gradient is always the house pink->gold (`gradient:true`);
//   • every number renders in JetBrains Mono;
//   • "every chart is a promise" (visual-language.md) is ENFORCED — a compose chart that prints
//     no number at all warns;
//   • the agent never emits raw SVG (the lint blocks that), so this declarative door is the
//     ONLY path to a custom chart, and every pixel through it is governed.
//
// spec = {
//   w?, h?,
//   x?: { type:"linear"|"band"|"log", domain:[...] },   // omit to auto-derive a linear domain
//   y?: { type:"linear"|"log", domain:[min,max] },       // omit to auto-derive (bars/areas force 0 in)
//   axes?: { x?:{label?,ticks?:[...]}, y?:{label?,ticks?:[...]} },   // OPT-IN, off by default
//   layers: [ {mark, ...}, ... ]
// }
// All mark coordinates are DATA values, mapped through the scales (never raw pixels, except a
// `label` with px:true). Marks:
//   {mark:"line",   points:[[x,y],...], color?, gradient?, width?}
//   {mark:"area",   points:[[x,y],...], color?, gradient?}            // fills down to the y baseline
//   {mark:"bar",    points:[[x,y],...], color?, gradient?, width?}    // from the y baseline (0) to y
//   {mark:"dot",    points:[[x,y,label?],...], color?, r?}            // 3rd point element = its label
//     A label on a point sitting at the domain's own right edge (a series' endpoint) can
//     run past the canvas: the label draws AFTER the dot with no auto-margin or wrap.
//     Pad the x domain past your last real x value (e.g. `+10` on a ~56-point series) so
//     the endpoint lands short of `w`, leaving room for its label inside the canvas
//     instead of spilling off it (where it renders outside the chart's own background
//     rect, invisible against whatever sits behind the image).
//   {mark:"rect",   x,y,w,h, color?, gradient?}                       // data-space rect (x,y = a corner)
//   {mark:"path",   points:[[x,y],...], color?, gradient?, close?, fill?}
//   {mark:"refLine",axis:"x"|"y", value, label?, color?}             // dashed reference across the plot
//   {mark:"label",  at:[x,y], text, anchor?, color?, size?, px?}     // px:true -> `at` is pixel coords
//   {mark:"legend", items:[{label,color}]}                            // swatch row under the plot
export const COMPOSE_MARKS = ["line", "area", "bar", "dot", "rect", "path", "refLine", "label", "legend"];

// The ONLY colors a composed chart can name. No raw hex — an agent picks a house role, never a
// foreign color. peer3+ reuses peer0 (the same 3-peer ceiling every multi-series kind enforces);
// an unknown/hex token falls back to muted, always with a warning so the substitution is visible.
const COMPOSE_COLORS = { self: GOLD, gain: GAIN, loss: LOSS, muted: MUTED, text: "#0B0B0B", peer0: PEER_COLORS[0], peer1: PEER_COLORS[1], peer2: PEER_COLORS[2] };
export const COMPOSE_COLOR_TOKENS = Object.keys(COMPOSE_COLORS);

export function resolveComposeColor(token, warn) {
  if (token == null) return MUTED;
  if (COMPOSE_COLORS[token]) return COMPOSE_COLORS[token];
  const m = /^peer(\d+)$/.exec(String(token));
  if (m) { warn?.(`compose: color "${token}" exceeds the 3-peer ceiling (peer0-2); reused peer0`); return PEER_COLORS[0]; }
  warn?.(`compose: off-brand color "${token}" is not a house token (${COMPOSE_COLOR_TOKENS.join(", ")}); fell back to muted`);
  return MUTED;
}

// data->pixel scale. `range` is already oriented ([bottom, top] for y, so the data minimum sits
// at the bottom). Returns a mapping fn tagged with kind/domain, and zeroPx = the pixel a bar or
// area drops to (the value 0 when it's in range, else the domain floor).
function composeScale(def, range, warn, name) {
  const [r0, r1] = range;
  def = def || { type: "linear", domain: [0, 1] };
  const type = def.type || "linear";
  if (type === "band") {
    const cats = def.domain || [];
    const nn = cats.length || 1;
    const step = (r1 - r0) / nn;
    const fn = (v) => {
      const i = typeof v === "number" ? v : cats.indexOf(v);
      return r0 + step * ((i < 0 ? 0 : i) + 0.5);
    };
    fn.kind = "band"; fn.step = Math.abs(step); fn.cats = cats; fn.zeroPx = r0;
    return fn;
  }
  let [d0, d1] = def.domain || [0, 1];
  if (type === "log") {
    if (d0 > 0 && d1 > 0) {
      const l0 = Math.log10(d0), l1 = Math.log10(d1);
      const span = l1 - l0 || 1;
      const fn = (v) => (v > 0 ? r0 + ((Math.log10(v) - l0) / span) * (r1 - r0) : r0);
      fn.kind = "log"; fn.domain = [d0, d1]; fn.zeroPx = r0;
      return fn;
    }
    warn?.(`compose: ${name} log scale needs a positive domain; got [${d0}, ${d1}], used linear instead`);
  }
  if (d0 === d1) { warn?.(`compose: ${name} scale domain [${d0}] has zero width; nudged so marks stay visible`); d1 = d0 + 1; }
  const fn = (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  fn.kind = "linear"; fn.domain = [d0, d1];
  fn.zeroPx = 0 >= Math.min(d0, d1) && 0 <= Math.max(d0, d1) ? fn(0) : r0;
  return fn;
}

// When a scale is omitted, derive its domain from every layer's data so the agent can drop in
// points without hand-computing ranges. includeZero pins a baseline in for bar/area layers, so
// they render from 0 by default (honest bars) instead of from the data minimum.
function composeAutoDomain(layers, idx, includeZero) {
  const vals = includeZero ? [0] : [];
  for (const l of layers || []) {
    for (const p of l.points || []) if (Array.isArray(p) && Number.isFinite(Number(p[idx]))) vals.push(Number(p[idx]));
    if (l.mark === "rect") {
      const a = idx === 0 ? l.x : l.y, b = idx === 0 ? l.x + (l.w ?? 0) : l.y + (l.h ?? 0);
      if (Number.isFinite(Number(a))) vals.push(Number(a));
      if (Number.isFinite(Number(b))) vals.push(Number(b));
    }
  }
  if (!vals.length) return [0, 1];
  let lo = Math.min(...vals), hi = Math.max(...vals);
  if (lo === hi) { lo -= 1; hi += 1; }
  return [lo, hi];
}

export function compose(spec = {}, { warn } = {}) {
  const id = uid("cx");
  const w = spec.w || 936, h = spec.h || 520;
  const axes = spec.axes || {};
  const hasX = !!axes.x, hasY = !!axes.y;
  const plotL = hasY ? 100 : 16, plotR = w - 28, plotT = 30, plotB = h - (hasX ? 66 : 16);
  const layers = spec.layers || [];
  const baselineMark = layers.some((l) => l.mark === "bar" || l.mark === "area");
  const xDef = spec.x || { type: "linear", domain: composeAutoDomain(layers, 0, false) };
  const yDef = spec.y || { type: "linear", domain: composeAutoDomain(layers, 1, baselineMark) };
  const SX = composeScale(xDef, [plotL, plotR], warn, "x");
  const SY = composeScale(yDef, [plotB, plotT], warn, "y");

  let printedNumber = false;
  const textEl = (x, y, str, { anchor = "start", color = "text", size = 22, weight = 700, font = MONO } = {}) => {
    if (/\d/.test(String(str))) printedNumber = true;
    return `<text x="${(+x).toFixed(1)}" y="${(+y).toFixed(1)}" fill="${resolveComposeColor(color, warn)}" font-family="${font}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${esc(str)}</text>`;
  };
  const clampX = (v, oob) => { const p = SX(v); if (p < plotL - 0.5 || p > plotR + 0.5) { oob.n++; return Math.max(plotL, Math.min(plotR, p)); } return p; };
  const clampY = (v, oob) => { const p = SY(v); if (p < plotT - 0.5 || p > plotB + 0.5) { oob.n++; return Math.max(plotT, Math.min(plotB, p)); } return p; };
  const fillOf = (l, kind) => (l.gradient ? `url(#${id}${kind})` : resolveComposeColor(l.color, warn));

  let out = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${gradDefs(id, w, h)}`;

  // axes (opt-in) — faint baseline lines + mono ticks + a SANS axis title, the same minimal
  // frame scatter uses (no gridlines; the ticks carry the scale).
  if (hasX || hasY) out += `<line x1="${plotL}" y1="${plotB}" x2="${plotR}" y2="${plotB}" stroke="rgba(11,11,11,0.14)" stroke-width="2"/>`;
  if (hasY) out += `<line x1="${plotL}" y1="${plotT}" x2="${plotL}" y2="${plotB}" stroke="rgba(11,11,11,0.14)" stroke-width="2"/>`;
  if (hasX) {
    (axes.x.ticks || (SX.kind === "band" ? SX.cats : SX.domain)).forEach((t) => { out += textEl(SX(t), plotB + 34, String(t), { anchor: "middle", color: "muted", weight: 600 }); });
    if (axes.x.label) out += textEl((plotL + plotR) / 2, h - 12, axes.x.label, { anchor: "middle", color: "muted", weight: 600, font: SANS });
  }
  if (hasY) {
    (axes.y.ticks || SY.domain).forEach((t) => { out += textEl(plotL - 12, SY(t) + 7, String(t), { anchor: "end", color: "muted", weight: 600 }); });
    if (axes.y.label) out += textEl(8, 24, axes.y.label, { anchor: "start", color: "muted", weight: 600, font: SANS });
  }

  // On a band x-axis the point's x is a category (a string), which must NOT be coerced to a
  // number; on a linear/log axis it must. Only y is always numeric.
  const xIsBand = SX.kind === "band";
  const xOk = (v) => (xIsBand ? v != null && v !== "" : Number.isFinite(Number(v)));
  const xVal = (v) => (xIsBand ? v : Number(v));
  for (const layer of layers) {
    const mark = layer.mark;
    if (!COMPOSE_MARKS.includes(mark)) { warn?.(`compose: unknown mark "${mark}" skipped (known: ${COMPOSE_MARKS.join(", ")})`); continue; }
    const oob = { n: 0 };
    const raw = layer.points || [];
    const pts = raw.filter((p) => Array.isArray(p) && xOk(p[0]) && Number.isFinite(Number(p[1])));
    if (raw.length && pts.length < raw.length) warn?.(`compose: ${mark} dropped ${raw.length - pts.length} non-numeric point(s)`);
    if (xIsBand) pts.forEach((p) => { if (typeof p[0] === "string" && !SX.cats.includes(p[0])) warn?.(`compose: ${mark} x-category "${p[0]}" is not in the band domain [${SX.cats.join(", ")}]`); });
    const XY = (p) => [clampX(xVal(p[0]), oob), clampY(Number(p[1]), oob)];

    if (mark === "line" || mark === "path") {
      const P = pts.map(XY);
      if (P.length) {
        const d = `M${P.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")}${mark === "path" && layer.close ? " Z" : ""}`;
        const fill = mark === "path" && layer.fill ? fillOf(layer, "f") : "none";
        out += `<path d="${d}" fill="${fill}" stroke="${fillOf(layer, "s")}" stroke-width="${layer.width || 4}" stroke-linecap="round" stroke-linejoin="round"/>`;
      }
    } else if (mark === "area") {
      const P = pts.map(XY);
      if (P.length) {
        const base = SY.zeroPx;
        const line = `M${P.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L")}`;
        out += `<path d="${line} L${P[P.length - 1][0].toFixed(1)},${base.toFixed(1)} L${P[0][0].toFixed(1)},${base.toFixed(1)} Z" fill="${layer.gradient ? `url(#${id}f)` : resolveComposeColor(layer.color, warn)}"/>`;
      }
    } else if (mark === "bar") {
      const base = SY.zeroPx;
      const bw = layer.width || (SX.kind === "band" ? SX.step * 0.56 : 26);
      pts.map(XY).forEach(([x, y]) => {
        out += `<rect x="${(x - bw / 2).toFixed(1)}" y="${Math.min(y, base).toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(2, Math.abs(base - y)).toFixed(1)}" rx="6" fill="${fillOf(layer, "s")}"/>`;
      });
    } else if (mark === "dot") {
      const r = layer.r || 7;
      pts.forEach((p) => {
        const [x, y] = XY(p);
        out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="${fillOf(layer, "s")}"/>`;
        if (p[2] != null) out += textEl(x + r + 8, y + 7, String(p[2]), { anchor: "start", color: layer.color === "self" ? "text" : layer.color || "muted" });
      });
    } else if (mark === "rect") {
      const x0 = clampX(layer.x, oob), x1 = clampX(layer.x + (layer.w ?? 0), oob), y0 = clampY(layer.y, oob), y1 = clampY(layer.y + (layer.h ?? 0), oob);
      out += `<rect x="${Math.min(x0, x1).toFixed(1)}" y="${Math.min(y0, y1).toFixed(1)}" width="${Math.abs(x1 - x0).toFixed(1)}" height="${Math.abs(y1 - y0).toFixed(1)}" rx="6" fill="${fillOf(layer, "s")}"/>`;
    } else if (mark === "refLine") {
      const lbl = layer.label != null ? String(layer.label) : "";
      const stroke = resolveComposeColor(layer.color || "muted", warn);
      if (layer.axis === "x") {
        const x = SX(layer.value);
        out += `<line x1="${x.toFixed(1)}" y1="${plotT}" x2="${x.toFixed(1)}" y2="${plotB}" stroke="${stroke}" stroke-width="2" stroke-dasharray="8 6" opacity="0.85"/>`;
        if (lbl) out += textEl(x, plotT - 8, lbl, { anchor: "middle", color: layer.color || "muted" });
      } else {
        const y = SY(layer.value);
        out += `<line x1="${plotL}" y1="${y.toFixed(1)}" x2="${plotR}" y2="${y.toFixed(1)}" stroke="${stroke}" stroke-width="2" stroke-dasharray="8 6" opacity="0.85"/>`;
        // labelSide:"left" tucks the label by the y-axis, away from data that ends on the right
        // (a slope/trend converges its endpoint labels there); default "right" matches the
        // sparkline benchmark. No auto de-collision here — compose is low-level, the author
        // places labels, same as scatter.
        if (lbl) {
          const left = layer.labelSide === "left";
          out += textEl(left ? plotL + 8 : plotR, Math.max(plotT + 8, y - 10), lbl, { anchor: left ? "start" : "end", color: layer.color || "muted" });
        }
      }
    } else if (mark === "label") {
      const at = layer.at || [0, 0];
      out += textEl(layer.px ? at[0] : SX(at[0]), layer.px ? at[1] : SY(at[1]), String(layer.text ?? ""), { anchor: layer.anchor || "start", color: layer.color || "text", size: layer.size || 22, weight: layer.weight || 700 });
    } else if (mark === "legend") {
      let lx = plotL;
      const ly = h - 10;
      (layer.items || []).forEach((it) => {
        out += `<rect x="${lx.toFixed(1)}" y="${(ly - 16).toFixed(1)}" width="20" height="20" rx="5" fill="${resolveComposeColor(it.color, warn)}"/>`;
        out += textEl(lx + 28, ly, String(it.label ?? ""), { anchor: "start", color: "muted", weight: 600, font: SANS });
        lx += 62 + String(it.label ?? "").length * 13;
      });
    }
    if (oob.n) warn?.(`compose: ${mark} had ${oob.n} coordinate(s) outside the scale domain; clamped into the plot`);
  }

  if (!printedNumber) warn?.(`compose: chart printed no numbers — every chart is a promise (charts.md); add axis ticks, a dot/refLine label, or a value label`);
  return out + `</svg>`;
}
