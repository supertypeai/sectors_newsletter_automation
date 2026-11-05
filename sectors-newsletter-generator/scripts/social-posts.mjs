#!/usr/bin/env node
// List published Sectors social posts from the Mailroom API, so the newsletter can pick
// social card images without anyone pasting URLs by hand.
//
//   node scripts/social-posts.mjs --from 2026-10-26 --to 2026-10-30
//   node scripts/social-posts.mjs --from 2026-10-26 --to 2026-10-30 --all     (keep stories + threads)
//   node scripts/social-posts.mjs --from 2026-10-26 --to 2026-10-30 --save posts.json
//
// Endpoint: GET https://mailroom.supertype.ai/api/v1/social/posts?status=published&since=YYYY-MM-DD
// (the api.mailroom.supertype.ai host in the original handoff has no DNS record; the /api
// path on the main host is the one that answers). Auth: Bearer mr_live_... key, read from
// MAILROOM_API_KEY, else config.json's mailroomApiKey.
//
// Default filter = what the newsletter may use: Instagram feed posts only (stories expire
// after 24h and Threads duplicates the IG post), published inside [--from, --to] in
// Asia/Jakarta time, images not purged. The API's own `until` param does not filter on
// published_at reliably, so the window is applied here.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const BASE = "https://mailroom.supertype.ai/api/v1/social/posts";
const TZ = "Asia/Jakarta";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const from = arg("--from");
const to = arg("--to") ?? from;
const save = arg("--save");
const all = process.argv.includes("--all");

if (!from || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
  console.error("usage: node scripts/social-posts.mjs --from YYYY-MM-DD [--to YYYY-MM-DD] [--all] [--save file.json]");
  process.exit(2);
}

function key() {
  if (process.env.MAILROOM_API_KEY) return process.env.MAILROOM_API_KEY;
  try {
    const cfg = JSON.parse(readFileSync(join(here, "..", "config.json"), "utf8"));
    if (cfg.mailroomApiKey) return cfg.mailroomApiKey;
  } catch {}
  console.error("No Mailroom key: set MAILROOM_API_KEY or config.json mailroomApiKey (Mailroom > Settings > API keys).");
  process.exit(2);
}

// Email clients cannot play video, so .mp4 slides (carousel covers are sometimes video) are
// dropped unless --all is passed.
const stills = (p) => (p.image_urls ?? []).filter((u) => all || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(u));

// Local Jakarta date (YYYY-MM-DD) of an ISO timestamp.
const localDate = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const localTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: TZ, dateStyle: "medium", timeStyle: "short" });

// Pull one day early so posts published just after midnight WIB (still the previous UTC day)
// are not lost; the exact window is applied below.
const since = new Date(Date.parse(from + "T00:00:00Z") - 86400000).toISOString().slice(0, 10);
const url = `${BASE}?status=published&since=${since}&limit=1000`;
const res = await fetch(url, { headers: { Authorization: `Bearer ${key()}` } });
if (!res.ok) {
  console.error(`Mailroom API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  process.exit(1);
}
const body = await res.json();
const posts = (body.data ?? []).filter((p) => {
  const d = localDate(p.published_at ?? p.scheduled_at);
  if (d < from || d > to) return false;
  if (all) return true;
  return p.platform === "ig" && p.post_type === "feed" && !p.assets_purged_at && stills(p).length;
});
posts.sort((a, b) => (a.published_at < b.published_at ? -1 : 1));

const out = posts.map((p) => ({
  published: localTime(p.published_at),
  platform: p.platform,
  post_type: p.post_type,
  content_group: p.content_group,
  content_type: p.content_type,
  caption: p.caption,
  permalink: p.permalink,
  image_urls: stills(p),
}));

if (save) {
  writeFileSync(save, JSON.stringify(out, null, 2));
  console.error(`saved ${out.length} posts to ${save}`);
}
for (const p of out) {
  const cap = (p.caption ?? "").replace(/\s+/g, " ").slice(0, 160);
  console.log(`\n[${p.published}] ${p.platform}/${p.post_type} group=${p.content_group ?? "-"} type=${p.content_type ?? "-"}`);
  console.log(`  ${cap}`);
  console.log(`  ${p.permalink ?? ""}`);
  p.image_urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
}
console.error(`\n${out.length} post(s) between ${from} and ${to} (${TZ})${all ? "" : ", IG feed only"}.`);
