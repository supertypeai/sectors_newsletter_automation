#!/usr/bin/env node
// node scripts/selftest.mjs — locks the helpers, the provider shapes, and the model chain at 0 API calls.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  splitHtml,
  joinChunks,
  collectSegments,
  collectBlocks,
  applySegments,
  applyBlocks,
  isProse,
  stripCitations,
  fingerprintMatches,
  reencode,
  callModel,
  humanize,
} from "./humanize.mjs";
import { providerFor, unwrap } from "./providers.mjs";

let passed = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

const SAMPLE = `<table><tr><td style="color:#111">
  $IMPC fell from IDR 1,595 to IDR 1,405 (-11.91%), putting it third among weekly losers.
</td></tr><tr><td>Top Weekly Losers</td></tr></table>
<img src="https://storage.googleapis.com/x.png" alt="chart"><style>.a{color:red}</style>`;

const GOOD = "$IMPC dropped from IDR 1,595 to IDR 1,405, -11.91%, third among weekly losers.";
const REPLY = [GOOD, "Top Weekly Losers"];

test("splitHtml round-trips byte for byte", () => {
  assert.equal(joinChunks(splitHtml(SAMPLE)), SAMPLE);
});

test("style blocks stay markup", () => {
  const styles = splitHtml(SAMPLE).filter((c) => c.value.startsWith("<style"));
  assert.equal(styles.length, 1);
  assert.equal(styles[0].type, "markup");
});

test("short labels are collected so headlines can be rewritten", () => {
  const { segments } = collectSegments(splitHtml(SAMPLE));
  assert.equal(segments.length, 2);
  assert.ok(segments.includes("Top Weekly Losers"));
});

test("whitespace and bare urls are skipped", () => {
  assert.equal(isProse("  \n  "), false);
  assert.equal(isProse("https://storage.googleapis.com/a/b/c.png"), false);
  assert.equal(isProse("1,405"), false);
});

test("citation markers are stripped", () => {
  assert.equal(stripCitations("Foreign flows turned [cite: 12] positive."), "Foreign flows turned positive.");
});

test("fingerprint catches a moved figure", () => {
  assert.equal(fingerprintMatches("fell 11.91% to 1,405", "dropped 11.91% to 1,405"), true);
  assert.equal(fingerprintMatches("fell 11.91%", "fell 11.9%"), false);
  assert.equal(fingerprintMatches("$IMPC fell 5%", "$IMPX fell 5%"), false);
});

test("a rewrite that moves a figure is rejected and markup is preserved", () => {
  const chunks = splitHtml(SAMPLE);
  const { indices } = collectSegments(chunks);
  const { chunks: applied, rejected } = applySegments(chunks, indices, ["$IMPC fell to IDR 1,400, third among losers.", "Top Weekly Losers"]);
  assert.equal(rejected.length, 1);
  assert.equal(joinChunks(applied), SAMPLE);
});

test("a word spliced into a mid-sentence fragment is dropped", () => {
  const chunks = splitHtml("<p>led net selling at</p>");
  const { indices } = collectSegments(chunks);
  const { rejected } = applySegments(chunks, indices, ["led net selling at formulation"]);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason, "rewrite grew");
});

test("a genuine headline tightening still passes", () => {
  const chunks = splitHtml("<div>Supply Shock Meets Low Float</div>");
  const { indices } = collectSegments(chunks);
  const { chunks: applied, rejected } = applySegments(chunks, indices, ["Treasury Share Release Details"]);
  assert.equal(rejected.length, 0);
  assert.ok(joinChunks(applied).includes("Treasury Share Release Details"));
});

test("an accepted rewrite keeps whitespace and all markup", () => {
  const chunks = splitHtml(SAMPLE);
  const { indices } = collectSegments(chunks);
  const { chunks: applied, rejected } = applySegments(chunks, indices, REPLY);
  assert.equal(rejected.length, 0);
  const out = joinChunks(applied);
  assert.ok(out.includes(GOOD));
  assert.ok(out.includes("\n  $IMPC dropped"));
  assert.ok(out.includes('<img src="https://storage.googleapis.com/x.png" alt="chart">'));
  assert.ok(out.includes("<style>.a{color:red}</style>"));
});

test("real newsletters round-trip byte for byte", () => {
  for (const f of ["wi-old-1", "ds-old-1", "sc-old-1"]) {
    const html = readFileSync(new URL(`../../../mailroom-human/${f}.html`, import.meta.url), "utf8");
    assert.equal(joinChunks(splitHtml(html)), html, `${f} must round-trip`);
  }
});

test("block is the default mode, and groups across inline tags", async () => {
  const html = '<p>Trisula listed in <b>2012</b> and stayed there</p>';
  const chunks = splitHtml(html);
  assert.equal(collectSegments(chunks).segments.length, 2, "node mode splits at the <b>");
  const blocks = collectBlocks(chunks);
  assert.equal(blocks.segments.length, 1, "block mode keeps the sentence whole");
  assert.ok(blocks.segments[0].includes("<b>2012</b>"), "inline tags travel inside the fragment");

  let sent;
  await humanize({
    html,
    prompt: "p",
    models: ["gemini-3.6-flash"],
    keyFor: () => "k",
    fetchImpl: async (url, opts) => {
      sent = JSON.parse(JSON.parse(opts.body).contents[0].parts[0].text);
      return replyFor("gemini-3.6-flash", ["Trisula listed in <b>2012</b> and stayed"]);
    },
  });
  assert.equal(sent.length, 1, "default mode sent one block, not two nodes");
});

test("block mode rejects a rewrite that drops an inline tag", () => {
  const chunks = splitHtml('<p>Trisula listed in <b>2012</b> and stayed there</p>');
  const { spans } = collectBlocks(chunks);
  const { rejected } = applyBlocks(chunks, spans, ["Trisula listed in 2012 and stayed"]);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason, "inline markup changed");
});

test("models route to the right provider", () => {
  assert.equal(providerFor("gemini-3.7-flash").name, "gemini");
  assert.equal(providerFor("gpt-5.6").name, "openai");
  assert.equal(providerFor("o4-mini").name, "openai");
  assert.equal(providerFor("claude-opus-5").name, "anthropic");
  assert.equal(providerFor("anthropic/claude-sonnet-4").name, "openrouter");
  assert.equal(providerFor("openai/gpt-5.6").name, "openrouter");
  assert.equal(providerFor("google/gemini-3-flash").name, "openrouter");
  assert.throws(() => providerFor("llama-3"), /no provider matches/);
});

test("openrouter carries a schema and pins endpoints that honour it", () => {
  const p = providerFor("anthropic/claude-sonnet-4");
  assert.equal(p.envKey, "OPENROUTER_API_KEY");
  assert.equal(p.url(), "https://openrouter.ai/api/v1/chat/completions");
  assert.equal(p.headers("K").authorization, "Bearer K");
  const b = p.body("anthropic/claude-sonnet-4", "sys", "[]");
  assert.equal(b.model, "anthropic/claude-sonnet-4");
  assert.equal(b.response_format.json_schema.strict, true);
  assert.equal(b.provider.require_parameters, true);
  assert.equal(b.reasoning_effort, undefined, "reasoning_effort 400s on non-reasoning models");
  assert.equal(p.text({ choices: [{ message: { content: "R" } }] }), "R");
});

test("each provider builds its own auth and schema shape", () => {
  const g = providerFor("gemini-3.7-flash");
  assert.ok(g.url("gemini-3.7-flash").includes(":generateContent"));
  assert.equal(g.headers("K")["x-goog-api-key"], "K");
  assert.ok(g.body("gemini-3.7-flash", "sys", "[]").generationConfig.responseSchema.required.includes("fragments"));

  const o = providerFor("gpt-5.6");
  assert.equal(o.headers("K").authorization, "Bearer K");
  const ob = o.body("gpt-5.6", "sys", "[]");
  assert.equal(ob.response_format.json_schema.strict, true);
  assert.equal(ob.response_format.json_schema.schema.additionalProperties, false);
  assert.ok(ob.max_completion_tokens > 0);
  assert.equal(ob.messages[0].role, "system");

  const a = providerFor("claude-opus-5");
  assert.equal(a.headers("K")["x-api-key"], "K");
  assert.equal(a.headers("K")["anthropic-version"], "2023-06-01");
  const ab = a.body("claude-opus-5", "sys", "[]");
  assert.equal(ab.system, "sys");
  assert.ok(ab.max_tokens > 0);
  assert.equal(ab.output_config.format.type, "json_schema");
  assert.equal(ab.output_config.format.schema.additionalProperties, false);
});

test("each provider extracts text from its own response envelope", () => {
  assert.equal(providerFor("gemini-3.7-flash").text({ candidates: [{ content: { parts: [{ text: "G" }] } }] }), "G");
  assert.equal(providerFor("gpt-5.6").text({ choices: [{ message: { content: "O" } }] }), "O");
  // A thinking block ahead of the answer must not be mistaken for the text.
  assert.equal(providerFor("claude-opus-5").text({ content: [{ type: "thinking", thinking: "..." }, { type: "text", text: "A" }] }), "A");
});

test("unwrap accepts the object envelope and a bare array", () => {
  assert.deepEqual(unwrap({ fragments: ["a"] }), ["a"]);
  assert.deepEqual(unwrap(["a"]), ["a"]);
});

const stub = (status, payload) => ({
  ok: status === 200,
  status,
  json: async () => payload,
  text: async () => JSON.stringify(payload),
});
const wrap = (arr) => JSON.stringify({ fragments: arr });
const replyFor = (model, arr) =>
  model.startsWith("claude")
    ? stub(200, { content: [{ type: "text", text: wrap(arr) }] })
    : model.startsWith("gpt")
      ? stub(200, { choices: [{ message: { content: wrap(arr) } }] })
      : stub(200, { candidates: [{ content: { parts: [{ text: wrap(arr) }] } }] });

test("every provider round-trips through callModel", async () => {
  for (const model of ["gemini-3.7-flash", "gpt-5.6", "claude-opus-5"]) {
    const out = await callModel({ model, apiKey: "k", prompt: "p", segments: ["a", "b"], fetchImpl: async () => replyFor(model, ["x", "y"]) });
    assert.deepEqual(out, ["x", "y"], model);
  }
});

test("arity mismatch is rejected", async () => {
  await assert.rejects(
    () => callModel({ model: "gemini-3.7-flash", apiKey: "k", prompt: "p", segments: ["a", "b"], fetchImpl: async () => replyFor("gemini-3.7-flash", ["one"]) }),
    /expected 2 strings, got 1/,
  );
});

test("429 falls through to the next model, across providers", async () => {
  const tried = [];
  const fetchImpl = async (url) => {
    const model = url.includes("generativelanguage") ? "gemini-3.7-flash" : url.includes("openai") ? "gpt-5.6" : "claude-opus-5";
    tried.push(model);
    return model === "gemini-3.7-flash" ? stub(429, { error: "quota" }) : replyFor(model, REPLY);
  };
  const res = await humanize({ html: SAMPLE, prompt: "p", models: ["gemini-3.7-flash", "claude-opus-5"], keyFor: () => "k", fetchImpl });
  assert.deepEqual(tried, ["gemini-3.7-flash", "claude-opus-5"]);
  assert.equal(res.model, "claude-opus-5");
  assert.equal(res.changed, true);
});

test("a missing key skips that model instead of failing the run", async () => {
  const fetchImpl = async (url) => replyFor(url.includes("openai") ? "gpt-5.6" : "gemini-3.7-flash", REPLY);
  const res = await humanize({
    html: SAMPLE,
    prompt: "p",
    models: ["gpt-5.6", "gemini-3.7-flash"],
    keyFor: (m) => (m.startsWith("gpt") ? null : "k"),
    fetchImpl,
  });
  assert.equal(res.model, "gemini-3.7-flash");
});

test("a model that echoes the input falls through to the next", async () => {
  const { segments } = collectSegments(splitHtml(SAMPLE));
  const tried = [];
  const fetchImpl = async (url) => {
    const model = url.includes("generativelanguage") ? "gemini-3.6-flash" : "claude-opus-5";
    tried.push(model);
    return replyFor(model, model === "gemini-3.6-flash" ? segments : REPLY);
  };
  const res = await humanize({ html: SAMPLE, prompt: "p", models: ["gemini-3.6-flash", "claude-opus-5"], keyFor: () => "k", fetchImpl });
  assert.deepEqual(tried, ["gemini-3.6-flash", "claude-opus-5"]);
  assert.equal(res.model, "claude-opus-5");
});

test("a 4xx on one model still tries the next, including another provider", async () => {
  const tried = [];
  const fetchImpl = async (url) => {
    const model = url.includes("generativelanguage") ? "gemini-3.7-flash" : "claude-opus-5";
    tried.push(model);
    return model === "gemini-3.7-flash" ? stub(403, { error: "key revoked" }) : replyFor(model, REPLY);
  };
  const res = await humanize({ html: SAMPLE, prompt: "p", models: ["gemini-3.7-flash", "claude-opus-5"], keyFor: () => "k", fetchImpl });
  assert.deepEqual(tried, ["gemini-3.7-flash", "claude-opus-5"]);
  assert.equal(res.model, "claude-opus-5");
});

test("a network error is retryable rather than fatal", async () => {
  const tried = [];
  const fetchImpl = async (url) => {
    const model = url.includes("generativelanguage") ? "gemini-3.7-flash" : "claude-opus-5";
    tried.push(model);
    if (model === "gemini-3.7-flash") throw new Error("fetch failed");
    return replyFor(model, REPLY);
  };
  const res = await humanize({ html: SAMPLE, prompt: "p", models: ["gemini-3.7-flash", "claude-opus-5"], keyFor: () => "k", fetchImpl });
  assert.deepEqual(tried, ["gemini-3.7-flash", "claude-opus-5"]);
  assert.equal(res.model, "claude-opus-5");
});

test("sign and unit are part of a figure", () => {
  assert.equal(fingerprintMatches("fell -11.91% this week", "rose +11.91% this week"), false);
  assert.equal(fingerprintMatches("closed at IDR 11,445.45T", "closed at IDR 11,445.45"), false);
  assert.equal(fingerprintMatches("fell -11.91%", "dropped -11.91%"), true);
});

test("decoded entities and stray markup are re-encoded, never spliced raw", () => {
  assert.equal(reencode("• a — b"), "&bull; a &mdash; b");
  assert.equal(reencode("<TICKER>"), "&lt;TICKER&gt;");
  assert.equal(reencode("Trisula & Co"), "Trisula &amp; Co");
  assert.equal(reencode("already &amp; fine &bull; here"), "already &amp; fine &bull; here");
});

test("a candidate carrying a raw tag cannot reach the html", () => {
  const chunks = splitHtml("<p>the filing named a director at the company</p>");
  const { indices } = collectSegments(chunks);
  const { chunks: applied } = applySegments(chunks, indices, ["named <b>a director</b> there"]);
  const out = joinChunks(applied);
  assert.ok(!out.includes("<b>"), "no raw tag spliced in");
  assert.ok(out.includes("&lt;b&gt;"));
});

test("an unknown model stops the chain rather than looping", async () => {
  await assert.rejects(
    () => humanize({ html: SAMPLE, prompt: "p", models: ["llama-3"], keyFor: () => "k", fetchImpl: async () => stub(200, {}) }),
    /no provider matches/,
  );
});

for (const [name, fn] of tests) {
  try {
    await fn();
    passed++;
  } catch (err) {
    console.error(`FAIL ${name}\n  ${err.message}`);
    process.exitCode = 1;
  }
}
console.error(`${passed}/${tests.length} passed`);
