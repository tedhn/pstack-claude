#!/usr/bin/env node
'use strict';
// Print the current Claude Code session's recorded state. The pstack hooks
// write one file per session on every prompt, so the newest file belongs to
// the session that is running right now.
//
//   node session.js transcript   absolute path of this session's transcript
//   node session.js cwd          working directory the session started in
//   node session.js json         the whole record
const { newestSession } = require('./hooks/state');

const session = newestSession();
const field = process.argv[2] || 'json';
if (!session) {
  process.stderr.write('pstack: no session recorded yet. The hooks write ~/.claude/pstack/sessions/ on each prompt.\n');
  process.exit(1);
}
if (field === 'json') {
  process.stdout.write(JSON.stringify(session, null, 2) + '\n');
} else if (field === 'transcript') {
  process.stdout.write((session.transcript_path || '') + '\n');
} else if (field === 'cwd') {
  process.stdout.write((session.cwd || '') + '\n');
} else {
  process.stderr.write('usage: session.js [transcript|cwd|json]\n');
  process.exit(2);
}
