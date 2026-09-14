---
name: reflect
description: Spawn three parallel review subagents over the active transcript, surface learnings, and route each to a concrete edit on an existing skill. Use when the user says reflect.
disable-model-invocation: true
---

# Reflect

Mine the current conversation for durable learnings, then route them into skill edits.

## When to invoke

Invoke when the user says "reflect" or "/reflect". Skip when the conversation is trivial, off-topic, or already covered by an existing skill the parent followed correctly. One-offs are not learnings.

## Process

### 1. Locate the active transcript

The parent finds its own transcript file before fanning out. The pstack hooks record each session's transcript path, so run:

```bash
node ~/.claude/skills/pstack/scripts/session.js transcript
```

Subagent transcripts for that session live beside it, under `<transcript dir>/<session id>/subagents/`. Do not glob across `~/.claude/projects/*/`. That crosses project boundaries and reads private chats from unrelated work.

Confirm the path by reading its first JSONL lines and checking that the opening user prompt matches this conversation. If no path resolves, write a tight digest of the session and pass that instead.

### 2. Spawn three reviewers in parallel

One message, three `Agent` calls, `subagent_type: Explore` (read-only, keeps MCP tools for context lookups such as tickets, chat threads, and observability traces referenced in the transcript), explicit `model:` on each, `run_in_background: true`.

| Lens | `model` | Prompt template |
|---|---|---|
| Judgment | your configured `reflect judgment, divergent, synthesizer` model (default `opus`) | `references/judgment-reviewer.md` |
| Tooling | your configured `reflect tooling` model (default `opus`) | `references/tooling-reviewer.md` |
| Divergent | your configured `reflect judgment, divergent, synthesizer` model (default `opus`) | `references/divergent-reviewer.md` |

Pass each template verbatim, substituting the transcript path or digest where marked. Reviewers return findings in the `Agent` response body.

### 3. Synthesize

One `Agent` call, `subagent_type: Explore`, using your configured `reflect judgment, divergent, synthesizer` model (default `opus`). Explore keeps MCP tools, which the synthesizer's quality check needs to spot-verify citations. Use `references/synthesizer.md` verbatim, with each reviewer's full output inlined where marked. The synthesizer returns a structured Accepted / Rejected / Backlog list.

### 4. Structural enforcement check

Sanity-check the synthesizer's Accepted list. For any item that would be enforced more reliably by a lint rule, script, metadata flag, or runtime check, move it from Accepted to Backlog. See the **encode-lessons-in-structure** principle skill.

### 5. Apply

Before applying any Accepted edit, present the synthesizer's full Accepted/Rejected/Backlog output to the user and wait for explicit approval. The user picks which subset to apply and may redirect routings. Skill changes affect every future agent in the org. Do not auto-apply.

Backlog items file to whatever devex / backlog tracker your team uses automatically. Only the Accepted list waits for approval.

For each approved Accepted item, follow the Routing field exactly:

- Trivial existing-skill edit (a one-line bullet, a tightened sentence, a stale fact corrected): parent does directly.
- Substantive existing-skill edit (a new section, a new pattern table, more than ~10 lines): hand to the `skill-creator` skill when it is installed and run its draft / test / iterate loop. Otherwise follow the Authoring a skill playbook in `poteto-mode`.
- `tune description: <skill path>` (the skill exists but didn't trigger when it should have): hand to `skill-creator` and run its description-optimization loop.
- `new skill via skill-creator: <kebab-name>`: hand creation to `skill-creator`. Do not invent the shape ad hoc.

Run `claude plugin validate ~/.claude/skills/pstack` after touching any pstack skill, and the project's own validator for project skills when one exists.

### 6. Summarize for the user

Short list, no preamble:

- Edits applied: `<skill path>`. What changed, one line each.
- New skills created: `<skill path>`. One line each (rare).
- Backlog filed to the devex tracker: `<issue title>` (`<tags>`). One line each.
- Dropped: one line per rejected finding + reason from the synthesizer.
