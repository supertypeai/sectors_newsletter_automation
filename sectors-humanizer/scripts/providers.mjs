// One provider per API shape. Add a provider by adding an entry: the rest of the
// pipeline only ever sees `send(model, key, system, fragments) -> string[]`.
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Every provider returns the same object-wrapped array: OpenAI's strict mode rejects a
// bare array at the schema root, so all three wrap rather than special-casing one.
const FIELD = "fragments";
const arraySchema = {
  type: "object",
  properties: { [FIELD]: { type: "array", items: { type: "string" } } },
  required: [FIELD],
  additionalProperties: false,
};

export const PROVIDERS = {
  gemini: {
    match: /^gemini-/,
    envKey: "GEMINI_API_KEY",
    configKey: "geminiApiKey",
    url: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    headers: (key) => ({ "x-goog-api-key": key }),
    body: (model, system, user) => ({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: user }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: { [FIELD]: { type: "ARRAY", items: { type: "STRING" } } },
          required: [FIELD],
        },
        temperature: 0.4,
        maxOutputTokens: 65536,
      },
    }),
    text: (json) => json?.candidates?.[0]?.content?.parts?.[0]?.text,
    stopReason: (json) => json?.candidates?.[0]?.finishReason,
  },

  openai: {
    match: /^(gpt|o\d)/,
    envKey: "OPENAI_API_KEY",
    configKey: "openaiApiKey",
    url: () => "https://api.openai.com/v1/chat/completions",
    headers: (key) => ({ authorization: `Bearer ${key}` }),
    body: (model, system, user) => ({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "humanized", strict: true, schema: arraySchema },
      },
      reasoning_effort: "low",
      max_completion_tokens: 32000,
    }),
    text: (json) => json?.choices?.[0]?.message?.content,
    stopReason: (json) => json?.choices?.[0]?.finish_reason,
  },

  anthropic: {
    match: /^claude-/,
    envKey: "ANTHROPIC_API_KEY",
    configKey: "anthropicApiKey",
    url: () => "https://api.anthropic.com/v1/messages",
    headers: (key) => ({ "x-api-key": key, "anthropic-version": "2023-06-01" }),
    body: (model, system, user) => ({
      model,
      max_tokens: 16000,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema: arraySchema }, effort: "low" },
    }),
    // Thinking blocks can precede the answer, so select the text block rather than [0].
    text: (json) => json?.content?.find((b) => b.type === "text")?.text,
    stopReason: (json) => json?.stop_reason,
  },
};

export function providerFor(model) {
  const hit = Object.entries(PROVIDERS).find(([, p]) => p.match.test(model));
  if (!hit) throw Object.assign(new Error(`no provider matches model "${model}"`), { fatal: true });
  return { name: hit[0], ...hit[1] };
}

export function resolveKey(provider, config = loadConfig()) {
  return process.env[provider.envKey] || config[provider.configKey] || null;
}

export function loadConfig() {
  const path = join(here, "..", "config.json");
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return {};
  }
}

export const unwrap = (parsed) => (Array.isArray(parsed) ? parsed : parsed?.[FIELD]);
