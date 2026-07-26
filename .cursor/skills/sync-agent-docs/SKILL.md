---
name: sync-agent-docs
description: Self-update AGENTS.md, cursor rules, or skills when the user locks a product/stack/convention decision — same turn as the change; don't wait to be asked. Use after design or tooling decisions land.
---

# sync-agent-docs

Agents **self-update** living docs. If a lasting decision just landed, patch docs in this turn — don’t leave it only in chat or wait for “document this.”

1. Diff what the user just locked vs current docs.
2. Patch the right home only:
   - Product / game facts → `AGENTS.md` (keep short)
   - Process / repo conventions (commit format, etc.) → `AGENTS.md` Code style
   - How to edit code → `.cursor/rules/*.mdc`
   - Repeatable checklist → `.cursor/skills/*/SKILL.md`
   - Soft prefs / rejected approaches (not code law) → `.cursor/skills/couch-potato/references/` — see skill `couch-potato` for the topic map
3. Don’t duplicate long prose across files — one authoritative place + pointers.
4. Skip trivial one-off fixes that aren’t lasting knowledge.

Always-on rule: `.cursor/rules/agent-docs.mdc`.
Knowledge map: `.cursor/skills/couch-potato/SKILL.md`.
