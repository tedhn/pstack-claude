#!/usr/bin/env node
'use strict';
// SessionStart hook. Records the session's transcript path and, on resume or
// compaction, re-injects the poteto-mode reminder when the mode was active.
// A fresh session or /clear starts with the mode off. Always exits 0.
const state = require('./state');

async function main() {
  const raw = await state.readStdin();
  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }
  const sessionId = input.session_id;
  if (!sessionId) return;

  const source = String(input.source || 'startup');
  const session = state.loadSession(sessionId);
  session.session_id = sessionId;
  if (input.transcript_path) session.transcript_path = input.transcript_path;
  if (input.cwd) session.cwd = input.cwd;
  session.updated = new Date().toISOString();
  if (source === 'startup' || source === 'clear') session.active = false;
  state.saveSession(sessionId, session);
  state.pruneSessions();

  if (session.active && (source === 'resume' || source === 'compact')) {
    state.emitContext('SessionStart', state.REMINDER + ' (Restored after ' + source + '.)');
  }
}

main().catch(() => {}).finally(() => process.exit(0));
