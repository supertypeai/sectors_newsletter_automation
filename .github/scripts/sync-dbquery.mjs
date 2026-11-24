#!/usr/bin/env node
// Refresh this repo's copy of the st-sectors-dbquery skill from the skills repo.
//
// Usage: node .github/scripts/sync-dbquery.mjs [path-to-skills-repo]   (default: ../skills)
//
// Why a copy: the draft workflows run the Supabase connector only through this skill's
// approved queries and its guard hook (scripts/supabase-guard.mjs), and a GitHub runner has
// neither unless the folder is in this repo. The skills repo stays the source of truth, so
// re-run this whenever a query is approved there, review the diff, and commit it.
import { cpSync, existsSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const skillsRepo = resolve(process.argv[2] ?? "../skills");
const src = join(skillsRepo, "skills", "marketing", "st-sectors-dbquery");
const dest = resolve("st-sectors-dbquery");

if (!existsSync(join(src, "SKILL.md"))) {
  console.error(`No st-sectors-dbquery skill at ${src}. Pass the path to the skills repo checkout.`);
  process.exit(1);
}
rmSync(dest, { recursive: true, force: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied ${src} -> ${dest}. Review with: git status st-sectors-dbquery`);
