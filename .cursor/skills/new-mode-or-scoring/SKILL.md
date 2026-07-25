---
name: new-mode-or-scoring
description: Change score formula, difficulties, board thresholds, or game modes. Use when altering engine scoring or generation config.
---

# new-mode-or-scoring

1. Change the **single** config / scoring map in `packages/game-engine` — not ad-hoc in UI.
2. Update Vitest: path/score, target ratios, gen-within-retry-cap on seeded RNG.
3. If gen flake rate rises, loosen thresholds in that same config object.
4. Sync product facts in `AGENTS.md` if ratios/modes/scoring formula changed.
5. UI only displays new numbers — no parallel rule copies.
