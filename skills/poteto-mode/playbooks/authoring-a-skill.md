### Authoring or modifying a skill

**You own the skill's voice.**

1. Use the `skill-creator` skill when it is installed. Otherwise write the SKILL.md by hand: frontmatter `name` (kebab-case, matching the directory) and `description` (trigger phrases for a model-invoked skill; a human-facing summary plus `disable-model-invocation: true` for a user-only one), a body under about 150 lines, bulk material in `references/`.
2. Validate the skill: frontmatter has `name` and `description`, referenced files exist, cross-skill links resolve. For a skill inside a plugin, run `claude plugin validate <plugin root>`.
3. Test cases if structural. Skip if subjective.
4. Run **Opening a PR**.

When in doubt, delete. Keep only prose that changes a decision. Tell it to do the thing and skip the reason. Explain only when the rule is confusing without one. Match tone to scope. Point at structural sources (types, READMEs, config) per the **encode-lessons-in-structure** principle skill. Delegate to other skills by path. Don't restate. A workflow you keep hitting but isn't captured → propose a new skill.

**Reply:** summary of the skill, key design decisions, validation notes.
