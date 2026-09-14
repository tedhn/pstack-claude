# pstack for Claude Code

A port of [poteto's pstack](https://github.com/cursor/plugins/tree/main/pstack) (Lauren Tan, MIT) from Cursor to Claude Code. Same playbooks, principles, and multi-agent workflows. Cursor-specific mechanics are replaced with their Claude Code equivalents.

## Install

Clone into the Claude Code skills directory. Claude Code loads it automatically as `pstack@skills-dir` on the next session, or run `/reload-plugins` now.

```bash
git clone https://github.com/tedhn/pstack-claude.git ~/.claude/skills/pstack
```

```bash
claude plugin validate ~/.claude/skills/pstack
```

Disable with `claude plugin disable pstack@skills-dir`. Remove by deleting the directory.

## Use

1. `/setup-pstack` once. It writes `~/.claude/pstack-models.md`, one model per role.
2. `/poteto-mode <task>` for anything that needs rigor. It matches a playbook, copies the steps into the todo list, and runs the other skills as needed. The mode stays on for the session. Say "stop poteto mode" to leave.
3. `/pstack` prints the reference card.

## What the port changed

| Upstream (Cursor) | This port (Claude Code) |
|---|---|
| `Task` tool, `subagent_type: generalPurpose`, `readonly: true` | `Agent` tool, `general-purpose`, `Explore` for read-only work (Explore keeps MCP tools) |
| `environment: "cloud"` workers | `isolation: "worktree"`, or `isolation: "remote"` when the account offers it |
| Model slugs (`claude-opus-5-1-thinking-max`, `gpt-5.6-sol-max`, `grok-4.6-fast-xhigh`, ...) | The Agent tool's `opus`, `sonnet`, `haiku`. Panels are `opus`, `sonnet` by default |
| `~/.cursor/rules/pstack-models.mdc` (always-applied rule) | `~/.claude/pstack-models.md`, read at run time by skills and by `scripts/pstack-models.js` |
| `mode: true` + `reminder:` frontmatter (sticky mode) | `hooks/hooks.json`: a `UserPromptSubmit` hook re-injects the mode each turn while it is on, a `SessionStart` hook restores it on resume or compaction. Zero-dependency Node |
| `AskQuestion`, Cursor todo list, Cursor `/loop` | `AskUserQuestion`, `TodoWrite`, the Claude Code `/loop` skill |
| `create-skill` (Cursor built-in) | `skill-creator` when installed, else the Authoring a skill playbook |
| `/deslop` from `cursor-team-kit` | the **slop strip** defined in `playbooks/opening-a-pr.md` |
| `control-ui` / `control-cli` from `cursor-team-kit` | the **control surface** in poteto-mode's Non-negotiables: Claude Browser tools or Playwright, Bash for CLIs, the iOS Simulator tool |
| Origin and Graphite forge paths | `gh` only |
| `watch-pr` (bun) for babysit and shipping | `gh pr view --json ...`, `gh pr checks --watch`, `/loop`, and a spelled-out verdict vocabulary |
| `orch` (bun) store CLI for orchestrate | the same TSV and JSON store under `~/.claude/pstack/orchestrate/<slug>/`, edited directly |
| `.cursor/skills/verify-<app>/` (generated verification skills) | `.claude/skills/verify-<app>/` |
| Cursor `agent-transcripts/` paths | `scripts/session.js transcript`, backed by the per-session records the hooks write |
| `disable-model-invocation: true` on routed skills | removed on skills poteto-mode routes to, so the Skill tool can reach them. Kept on `bro`, `setup-pstack`, `reflect` |

## Not ported

`automate-me` and `recall` (mine Cursor transcripts), `make-bot-ui` (Cursor webhooks), the `benny` automation pack, and the bun scripts `orch`, `watch-pr`, and `bootstrap`. `check-plan.mjs` and `worktree-audit.sh` are kept and repointed.

## Layout

```
.claude-plugin/plugin.json     manifest
hooks/hooks.json               SessionStart + UserPromptSubmit hooks
scripts/hooks/*.js             hook handlers and shared state (Node, no deps)
scripts/pstack-models.js       role -> model resolver
scripts/session.js             current session's transcript path
agents/                        poteto-agent, comment-sicko
skills/pstack/                 /pstack reference card
skills/poteto-mode/            router, 23 playbooks, references, scripts
skills/principle-*/            23 one-rule principles
skills/<workflow>/             how, why, architect, arena, swarm, interrogate, ...
```

## Verify the hooks

```bash
printf '%s' '{"session_id":"t1","transcript_path":"/tmp/t1.jsonl","cwd":"/tmp","prompt":"continue"}' | node ~/.claude/skills/pstack/scripts/hooks/poteto-mode-tracker.js
```

Prints nothing while the mode is off for that session. After a prompt containing `/poteto-mode`, the same command prints the reminder JSON.

## License

MIT, as upstream. See `LICENSE`.
