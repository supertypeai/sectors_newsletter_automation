#!/usr/bin/env node
// PreToolUse guard for the Supabase MCP connector.
//
// Enforces, at the harness level, what SKILL.md states as policy:
//   1. No writes to Supabase, ever. Any mutating MCP tool, or any SQL that is not a
//      plain read, is denied outright.
//   2. execute_sql only runs SQL that matches a file in scripts/approved-queries/.
//      Anything else is escalated to the user for confirmation ("ask"), which is how a
//      query earns its first run and then its permanent home in that folder.
//
// Wired as a PreToolUse hook on `mcp__supabase__.*`. Reads the hook payload on stdin,
// writes a permission decision on stdout.

import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const APPROVED_DIR = join(dirname(fileURLToPath(import.meta.url)), 'approved-queries');

// Read-only tools that may run untouched. Anything not listed is treated as a write.
const READ_ONLY_TOOLS = new Set([
  'list_tables',
  'list_extensions',
  'list_migrations',
  'list_branches',
  'list_edge_functions',
  'get_edge_function',
  'get_project_url',
  'get_publishable_keys',
  'get_advisors',
  'query_logs',
  'search_docs',
  'generate_typescript_types',
]);

// Statement keywords that make a query something other than a read.
const WRITE_KEYWORDS = [
  'insert', 'update', 'delete', 'drop', 'alter', 'create', 'truncate', 'merge',
  'grant', 'revoke', 'comment', 'copy', 'vacuum', 'analyze', 'call', 'do',
  'set', 'reset', 'begin', 'commit', 'rollback', 'lock', 'refresh', 'reindex',
  'cluster', 'listen', 'notify', 'prepare', 'execute', 'discard', 'security',
];

function decide(decision, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// Strip comments and collapse whitespace, so formatting differences don't matter.
function normalize(sql) {
  return String(sql)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/--[^\n]*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/;+\s*$/, '')
    .toLowerCase();
}

function isPlainRead(sql) {
  if (!/^(select|with)\b/.test(sql)) return false;
  // A CTE body may legally contain `select`; a write keyword at statement position
  // may not. Reject any write keyword appearing as its own word.
  for (const kw of WRITE_KEYWORDS) {
    if (new RegExp(`(^|[\\s(;])${kw}\\b`).test(sql)) return false;
  }
  // Multiple statements: a trailing `;` was already stripped, so any remaining one
  // means a second statement is being smuggled in.
  if (sql.includes(';')) return false;
  return true;
}

// Build a matcher from an approved file: literal text, except {{placeholders}}, which
// accept a plain scalar (date, number, ticker, identifier) and nothing structural.
function approvedMatcher(sql) {
  const parts = sql.split(/\{\{\s*[a-z0-9_]+\s*\}\}/g);
  const escaped = parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${escaped.join('[a-z0-9_\\-. ]{0,64}')}$`);
}

function loadApproved() {
  let files = [];
  try {
    files = readdirSync(APPROVED_DIR).filter((f) => f.endsWith('.sql'));
  } catch {
    return [];
  }
  return files.map((f) => {
    const text = normalize(readFileSync(join(APPROVED_DIR, f), 'utf8'));
    return { slug: f.replace(/\.sql$/, ''), matcher: approvedMatcher(text) };
  });
}

const APPROVAL_STEPS =
  'To approve it: keep the candidate in scripts/fixed-queries.sql, confirm this run so ' +
  'the match count can be checked, then save the exact SQL to ' +
  'scripts/approved-queries/<slug>.sql with the header block from ' +
  'references/query-standards.md. Once saved it runs without prompting, and every later ' +
  'piece on the same topic reuses the identical query.';

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin());
  } catch {
    decide('deny', 'st-sectors-dbquery guard: could not parse the hook payload, so the Supabase call is refused rather than allowed unchecked.');
  }

  const toolName = payload?.tool_name ?? '';
  const short = toolName.replace(/^mcp__supabase__/, '');
  const input = payload?.tool_input ?? {};

  if (short !== 'execute_sql') {
    if (READ_ONLY_TOOLS.has(short)) {
      decide('allow', `st-sectors-dbquery guard: ${short} is read-only.`);
    }
    decide('deny',
      `st-sectors-dbquery guard: ${short} can modify the Supabase project. This project is ` +
      'read-only from Claude Code, with no exceptions. Schema and data changes are made ' +
      'by a human through Supabase directly, never through a skill.');
  }

  const sql = normalize(input.query ?? input.sql ?? '');
  if (!sql) {
    decide('deny', 'st-sectors-dbquery guard: execute_sql was called with no SQL to inspect.');
  }

  if (!isPlainRead(sql)) {
    decide('deny',
      'st-sectors-dbquery guard: this is not a plain single-statement read. Supabase is ' +
      'read-only from Claude Code: no insert, update, delete, DDL, transaction control, ' +
      'or chained statements, whatever the reason.');
  }

  for (const { slug, matcher } of loadApproved()) {
    if (matcher.test(sql)) {
      decide('allow', `st-sectors-dbquery guard: matches approved query "${slug}".`);
    }
  }

  decide('ask',
    'st-sectors-dbquery guard: this SQL matches no file in scripts/approved-queries/, so it ' +
    'has never been approved. Read it before confirming: whatever it returns can end up ' +
    'as a published number.\n\n' + APPROVAL_STEPS);
}

main();
