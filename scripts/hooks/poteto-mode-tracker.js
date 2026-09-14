#!/usr/bin/env node
'use strict';
// UserPromptSubmit hook. Turns poteto-mode on or off for this session based on
// the prompt, records the session's transcript path, and re-injects the mode
// reminder on every turn while the mode is active. Always exits 0.
const state = require('./state');

const SLASH_RE = /(^|\s)\/(pstack:)?poteto-mode(\s|$)/;
const ENVELOPE_RE = /<command-name>\s*\/?(pstack:)?poteto-mode\s*<\/command-name>/;
const ARGS_OFF_RE = /<command-args>\s*(off|stop|exit)\s*<\/command-args>|\/(pstack:)?poteto-mode\s+(off|stop|exit)\b/;
const ENTER_RE = /\b(enter|start|enable|turn on|resume)\s+poteto[- ]mode\b|\bpoteto[- ]mode\s+on\b/;
const OFF_RE = /\b(stop|exit|leave|end|disable|turn off|quit)\s+poteto[- ]mode\b|\bpoteto[- ]mode\s+(off|stop)\b/;

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

  // Collapse whitespace so multi-line prompts and command envelopes match the
  // same regexes.
  const prompt = String(input.prompt || '').replace(/\s+/g, ' ').trim();
  const lower = prompt.toLowerCase();

  // Unattended scheduled-task runs never get the mode reminder.
  if (/<scheduled-task\b/.test(lower)) return;

  const session = state.loadSession(sessionId);
  session.session_id = sessionId;
  if (input.transcript_path) session.transcript_path = input.transcript_path;
  if (input.cwd) session.cwd = input.cwd;
  session.updated = new Date().toISOString();

  const isCommand = SLASH_RE.test(lower) || ENVELOPE_RE.test(lower);
  let event = null;
  if (isCommand && ARGS_OFF_RE.test(lower)) {
    session.active = false;
    event = 'off';
  } else if (isCommand || ENTER_RE.test(lower)) {
    session.active = true;
    event = isCommand ? 'command' : 'on';
  } else if (OFF_RE.test(lower)) {
    session.active = false;
    event = 'off';
  }

  state.saveSession(sessionId, session);
  if (Math.random() < 0.05) state.pruneSessions();

  if (event === 'off') {
    state.emitContext('UserPromptSubmit', 'POTETO MODE OFF for this session. Drop the playbook todo discipline and reply normally. Re-enter with /poteto-mode.');
    return;
  }
  if (event === 'command') {
    // The skill itself is loading this turn. No reminder needed.
    return;
  }
  if (session.active) {
    state.emitContext('UserPromptSubmit', state.REMINDER);
  }
}

main().catch(() => {}).finally(() => process.exit(0));
