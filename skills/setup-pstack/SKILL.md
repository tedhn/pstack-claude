---
name: setup-pstack
description: Configure which models pstack uses per role. Writes ~/.claude/pstack-models.md, which every pstack skill reads at run time. Use for /setup-pstack, "configure pstack models", or changing pstack's model choices.
disable-model-invocation: true
---

# Setup pstack

Write `~/.claude/pstack-models.md`, the per-role model config every pstack skill reads.

## Steps

### 1. Detect available models

The Agent tool's `model` parameter enumerates the models you can give a subagent in this session. That is the dependable source. In Claude Code today the values are `opus`, `sonnet`, and `haiku`. Never write a value you have not confirmed the Agent tool accepts. The aliases `inherit-parent` and `auto` are always valid even though they are not model names.

### 2. Load current state

Run `node ~/.claude/skills/pstack/scripts/pstack-models.js`. It prints every role with its resolved value, which is the config line when `~/.claude/pstack-models.md` has one and the skill default otherwise. Treat that table as the current choices.

### 3. Map and confirm

Show every role with its current model, marking any value the Agent tool does not accept as needing a choice. Ask whether to accept as-is or change specific roles, offering the detected models plus `inherit-parent` and `auto` (both mean the role runs on the parent chat model). Prefer `AskUserQuestion` over free text, one question per group (code roles, judgment roles, panels). For panel roles (`arena runners`, `architect runners`, `interrogate reviewers`) the value is a list, and one subagent runs per entry, alias entries included, so the list length sets the count. `arena cross-judge pool` is also a list, but Arena selects one value from it that differs from the parent's model when possible. `swarm workers` is the default model for every worker unless a race or comparison assigns another model per arm.

### 4. Validate

Every real value written must be one the Agent tool accepts. `inherit-parent` and `auto` always pass. If a chosen value is not available, stop and ask again. `node ~/.claude/skills/pstack/scripts/pstack-models.js` prints a warning to stderr for any unknown value.

### 5. Write the config

Write `~/.claude/pstack-models.md` with one line per role, using the same labels poteto-mode uses. Overwrite the whole file so re-runs stay idempotent. Shape:

```
---
description: pstack per-role model choices (overrides skill defaults)
---
# pstack model configuration. One line per role. Delete a line to fall back to the skill default.
# `inherit-parent` or `auto` as a value: the role runs on the parent chat model (omit Agent `model`). Alias entries in a panel list still count toward its fan-out.
feature, refactoring: sonnet
bug-fix: opus
perf-issue: opus
hillclimb: opus
judgment and prose: opus
hardest tasks: opus
how explorer: sonnet
how explainer: opus
why investigators: sonnet
why synthesizer: opus
reflect tooling: opus
reflect judgment, divergent, synthesizer: opus
arena runners: opus, sonnet
arena cross-judge pool: opus, sonnet
swarm workers: sonnet
architect runners: opus, sonnet
interrogate reviewers: opus, sonnet
```

### 6. Confirm

Tell the user the config was written and applies immediately, since skills read the file when they run. Re-running this skill updates it.

### 7. Offer a verification path (optional)

Check whether the project has a way to drive the real app for proof: a project `verify-*` skill under `.claude/skills/`, or an existing harness. If not, offer once: "want a project-local verification skill, so agents can drive the app the way a user does and prove changes work? I can generate one with /create-verification-skill." On yes, invoke `pstack:create-verification-skill`. On no, move on without pushing.
