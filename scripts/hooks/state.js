'use strict';
// Shared per-session state for the pstack hooks. One JSON file per Claude Code
// session under ~/.claude/pstack/sessions/. The newest file is the session that
// most recently submitted a prompt, which is how skills locate their own
// transcript without knowing their session id.
const fs = require('fs');
const path = require('path');
const os = require('os');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const sessionsDir = path.join(claudeDir, 'pstack', 'sessions');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => { data += chunk; });
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', () => resolve(data));
  });
}

function sessionPath(id) {
  return path.join(sessionsDir, String(id).replace(/[^A-Za-z0-9_.-]/g, '_') + '.json');
}

function loadSession(id) {
  try {
    return JSON.parse(fs.readFileSync(sessionPath(id), 'utf8'));
  } catch {
    return {};
  }
}

function saveSession(id, data) {
  fs.mkdirSync(sessionsDir, { recursive: true });
  fs.writeFileSync(sessionPath(id), JSON.stringify(data, null, 2) + '\n');
}

function pruneSessions() {
  try {
    const now = Date.now();
    for (const name of fs.readdirSync(sessionsDir)) {
      const file = path.join(sessionsDir, name);
      if (now - fs.statSync(file).mtimeMs > WEEK_MS) fs.unlinkSync(file);
    }
  } catch {
    // The directory may not exist yet. Nothing to prune.
  }
}

function newestSession() {
  try {
    let best = null;
    for (const name of fs.readdirSync(sessionsDir)) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(sessionsDir, name);
      const mtime = fs.statSync(file).mtimeMs;
      if (!best || mtime > best.mtime) best = { file, mtime };
    }
    if (!best) return null;
    return JSON.parse(fs.readFileSync(best.file, 'utf8'));
  } catch {
    return null;
  }
}

function emitContext(eventName, text) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: eventName, additionalContext: text },
  }));
}

const REMINDER = [
  'POTETO MODE ACTIVE (pstack). The mode is sticky for this session.',
  'New task or a request that matches a playbook: re-match a playbook per the pstack:poteto-mode skill and open its steps as todos.',
  'Continuation of the current task: keep the current playbook and its todo list.',
  'Casual turn: stay out of the way.',
  'If the poteto-mode SKILL.md is not in context (fresh session, resume, or after compaction), invoke the Skill tool with "pstack:poteto-mode" before doing task work.',
  'Exit with "stop poteto mode".',
].join(' ');

module.exports = {
  sessionsDir,
  readStdin,
  loadSession,
  saveSession,
  pruneSessions,
  newestSession,
  emitContext,
  REMINDER,
};
