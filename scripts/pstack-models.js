#!/usr/bin/env node
'use strict';
// Resolve pstack's per-role model choice.
//
//   node pstack-models.js                 print every role with its resolved value
//   node pstack-models.js "arena runners" print one role's value
//   node pstack-models.js --json          machine-readable map
//
// Reads ~/.claude/pstack-models.md when present (one `role: value` line per
// role, written by /setup-pstack) and falls back to the defaults below. Valid
// values are the Agent tool's model names plus the aliases `inherit-parent`
// and `auto`, which both mean "omit `model` and run on the parent's model".
const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude'), 'pstack-models.md');
const MODELS = ['opus', 'sonnet', 'haiku', 'fable'];  // fable accepted when set explicitly, never a default
const ALIASES = ['inherit-parent', 'auto'];

const DEFAULTS = {
  'feature, refactoring': 'sonnet',
  'bug-fix': 'opus',
  'perf-issue': 'opus',
  'hillclimb': 'opus',
  'judgment and prose': 'opus',
  'hardest tasks': 'opus',
  'how explorer': 'sonnet',
  'how explainer': 'opus',
  'why investigators': 'sonnet',
  'why synthesizer': 'opus',
  'reflect tooling': 'opus',
  'reflect judgment, divergent, synthesizer': 'opus',
  'arena runners': 'opus, sonnet',
  'arena cross-judge pool': 'opus, sonnet',
  'swarm workers': 'sonnet',
  'architect runners': 'opus, sonnet',
  'interrogate reviewers': 'opus, sonnet',
};

function parseConfig(text) {
  const out = {};
  let inFrontmatter = false;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (line === '---') { inFrontmatter = !inFrontmatter; continue; }
    if (inFrontmatter || !line || line.startsWith('#')) continue;
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    if (key && value) out[key] = value;
  }
  return out;
}

function resolveAll() {
  let configured = {};
  try {
    configured = parseConfig(fs.readFileSync(CONFIG, 'utf8'));
  } catch {
    // No user config. Defaults apply.
  }
  const resolved = {};
  for (const role of Object.keys(DEFAULTS)) {
    resolved[role] = configured[role] !== undefined ? configured[role] : DEFAULTS[role];
  }
  return resolved;
}

function findRole(resolved, query) {
  const q = query.trim().toLowerCase();
  if (resolved[q] !== undefined) return q;
  // A role line can cover several roles ("feature, refactoring"). Match one item.
  for (const role of Object.keys(resolved)) {
    if (role.split(',').map((s) => s.trim()).includes(q)) return role;
  }
  return null;
}

function warnUnknown(role, value) {
  for (const item of value.split(',').map((s) => s.trim())) {
    if (!MODELS.includes(item) && !ALIASES.includes(item)) {
      process.stderr.write(`pstack-models: "${role}" has unknown value "${item}". Valid: ${MODELS.concat(ALIASES).join(', ')}\n`);
    }
  }
}

const resolved = resolveAll();
const arg = process.argv[2];
if (arg === '--json') {
  process.stdout.write(JSON.stringify(resolved, null, 2) + '\n');
} else if (arg) {
  const role = findRole(resolved, arg);
  if (!role) {
    process.stderr.write(`pstack-models: unknown role "${arg}". Roles: ${Object.keys(resolved).join(' | ')}\n`);
    process.exit(1);
  }
  warnUnknown(role, resolved[role]);
  process.stdout.write(resolved[role] + '\n');
} else {
  for (const [role, value] of Object.entries(resolved)) {
    warnUnknown(role, value);
    process.stdout.write(`${role}: ${value}\n`);
  }
}
