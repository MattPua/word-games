---
name: couch-potato
description: >-
  Index and knowledge router for the Couch Potato monorepo. Use at the start of
  any Couch Potato task, before asking the human for product/stack/convention
  context, or when unsure which AGENTS/rule/skill file owns a topic. Maps topics
  to living docs; holds soft prefs and rejected paths in references/.
---

# Couch Potato knowledge

**Not a second AGENTS.** Product facts, edit rules, and how-tos stay where they already live. This skill is the **map** + a home for soft prefs that don’t belong in always-on rules.

## Before asking the human

1. Skim the **Topic → read** table below; open the linked file(s).
2. If the answer is a soft preference / “we tried X” / taste call → check [references/decisions.md](references/decisions.md).
3. Only ask the human when docs are silent or conflict.

## Where knowledge lives (authoritative)

| Kind | Path |
| --- | --- |
| Product / game / brand | [`AGENTS.md`](../../../AGENTS.md) |
| How to edit code | [`.cursor/rules/`](../../rules/) (`coding`, `ui`, `engine`, `agent-docs`, `tanstack-router`) |
| Repeatable how-to | [`.cursor/skills/*/SKILL.md`](../) |
| Soft prefs / rejected paths | [references/](references/) (this skill only) |

Write-back: [sync-agent-docs](../sync-agent-docs/SKILL.md) + always-on [agent-docs.mdc](../../rules/agent-docs.mdc). **Don’t** copy the same paragraph into AGENTS + a rule + a reference.

## Topic → read

| Topic | Open |
| --- | --- |
| Game rules, modes, scoring, dict | `AGENTS.md` · `.cursor/rules/engine.mdc` · skill `new-mode-or-scoring` |
| Brand, copy voice, chrome layout, motion | `AGENTS.md` · `.cursor/rules/ui.mdc` |
| Loading / empty / skeletons | skill `loading-empty` · `ui.mdc` |
| Monorepo, Bun catalog, commits, images | `.cursor/rules/coding.mdc` · `AGENTS.md` Code style |
| Platform files (web default vs Expo) | `AGENTS.md` Stack · `coding.mdc` · [references/decisions.md](references/decisions.md) |
| Routes, lazy pages, head/SEO, preload | skill `tanstack-router` (+ `reference.md`) · rule `tanstack-router.mdc` |
| Mascot / sprites / WebP crops | skill `potato-sprites` · `AGENTS.md` Brand |
| SFX / Lobby jam | skill `cuelume` · `AGENTS.md` Sounds |
| Lighthouse / CWV / cold path | skill `lighthouse` (+ `history.json`) |
| Verify play UI (swipe) | skill `verify-ui` |
| Expo smoke | skill `verify-mobile` (play QA stays on web) |
| Living docs / self-update | skill `sync-agent-docs` · rule `agent-docs.mdc` |

## References (lazy)

Read only when needed — don’t dump into always-on context:

- [references/decisions.md](references/decisions.md) — locked tastes, rejected approaches, “don’t redo X”

Add a short bullet there when the human locks a **soft** decision that isn’t product law. Promote to `AGENTS.md` / a rule / a how-to skill when it becomes lasting convention for everyone.

## Anti-patterns

- Re-asking for something already in the table
- Growing `references/` into a parallel AGENTS (promote or delete)
- Putting code law only in references (use rules)
- Skipping `sync-agent-docs` after a locked decision
