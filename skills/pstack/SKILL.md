---
name: pstack
description: Reference card for the pstack plugin (poteto's rigorous engineering workflow, ported to Claude Code). Use for /pstack, "pstack help", "what does pstack do", "which pstack skill should I use", or when unsure how poteto-mode, its playbooks, and its skills fit together.
---

# pstack

pstack turns Claude Code into a structured engineering workflow. One entry point, `/poteto-mode`, routes a task to one of 23 playbooks, copies that playbook's steps into the todo list, and calls the other skills as the steps need them. The goal is less code of higher quality, verified on the real artifact.

## Start here

- `/poteto-mode <task>` for anything that needs rigor. It picks the playbook. The mode stays on for the session. Say "stop poteto mode" to leave. Say "new task" to force a fresh playbook match.
- `/setup-pstack` once, to pick which model runs each role. Config lives in `~/.claude/pstack-models.md`. `node ~/.claude/skills/pstack/scripts/pstack-models.js` prints the resolved table.
- Everything else is situational. poteto-mode invokes it for you.

## Skills

Invoke through the Skill tool as `pstack:<name>`, or type `/<name>`.

| Skill | Use it when |
|---|---|
| `poteto-mode` | default entry point for any non-trivial task. |
| `how` | you want a walkthrough of how a subsystem works. |
| `why` | you want to know why something was built this way. Queries every MCP evidence source in parallel. |
| `blast-radius` | a small-looking change might break something elsewhere. Proves the one fact it is safe because of. |
| `architect` | code will cross a function boundary. Parallel design sketches before implementation. |
| `arena` | N parallel attempts at one artifact, then pick a base and graft. |
| `swarm` | N parallel workers over slices or a race, then one report. |
| `interrogate` | several models try to break a diff, with a code-quality lens. |
| `figure-it-out` | no playbook fits. Designs a rigorous, auditable one. |
| `show-me-your-work` | a reviewable decision trail (TSV) for long or unattended runs. |
| `reflect` | a long task landed and the lesson should become a skill edit. |
| `teach` | you want to understand a change or subsystem, not just have it summarized. |
| `tdd` | a bug has a cheap local test path. Failing test first. |
| `create-verification-skill` | the project has no scripted way to prove app behavior. Generates `.claude/skills/verify-<app>/` with a feature map. |
| `maintain-verification-skill` | the verify skill's feature map drifted from the app. Source wave plus one live pass, at most one PR. |
| `no-comments` | strip comments before review via the Comment Sicko agent. |
| `typescript-best-practices` | reading or editing TypeScript. |
| `technical-writing` | docs, RFCs, readmes, PR descriptions, commit messages. |
| `unslop` | remove AI tells from any prose. poteto-mode applies it to every reply. |
| `bro` | restate the last message in plain language. |
| `setup-pstack` | choose models per role. |
| `principle-*` | 23 one-rule skills poteto-mode indexes inline and reads before citing. |

## Playbooks

In `skills/poteto-mode/playbooks/`: investigation, bug-fix, perf-issue, hillclimb, runtime-forensics, trace-forensics, feature, refactoring, prototype, visual-parity, authoring-a-skill, eval, babysit, shipping, autonomous-run, orchestrate, autopilot-full, autopilot-stack, session-pickup, pause-safely, multi-phase-plan, worktree-cleanup, opening-a-pr.

## Agents

- `pstack:poteto-agent`. Every delegate poteto-mode spawns. Reads poteto-mode in full first.
- `pstack:comment-sicko`. Read-mostly comment deleter, spawned by `no-comments`.

## Claude Code specifics

- Subagents run through the Agent tool. `Explore` for read-only research (keeps MCP tools), `general-purpose` or `pstack:poteto-agent` when the worker writes, `isolation: "worktree"` for parallel writers.
- Models are the Agent tool's `opus`, `sonnet`, `haiku`. Defaults: `sonnet` for mechanical code, `opus` for judgment and prose, panels of `opus`, `sonnet`.
- Hooks in `hooks/hooks.json` keep poteto-mode sticky per session and record each session's transcript path. `node ~/.claude/skills/pstack/scripts/session.js transcript` prints it.
- The upstream Cursor plugin is at https://github.com/cursor/plugins/tree/main/pstack. `README.md` in this plugin lists what the port changed and what it left out.
