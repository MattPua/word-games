---
name: sync-agent-docs
description: Update AGENTS.md, cursor rules, or skills after the user locks a product/stack/convention decision. Use when design or tooling decisions change.
---

# sync-agent-docs

1. Diff what the user just locked vs current docs.
2. Patch the right home only:
   - Product / game facts → `AGENTS.md` (keep short)
   - Process / repo conventions (commit format, etc.) → `AGENTS.md` Code style
   - How to edit code → `.cursor/rules/*.mdc`
   - Repeatable checklist → `.cursor/skills/*/SKILL.md`
3. Don’t duplicate long prose across files — one authoritative place + pointers.
4. Skip trivial one-off fixes that aren’t lasting knowledge.
