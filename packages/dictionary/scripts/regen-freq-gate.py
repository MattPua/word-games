#!/usr/bin/env python3
"""Regenerate data/freq-gate.txt from wordfreq (en, large) at ZIPF_MIN.

Requires: pip install wordfreq
Usage:    bun run --filter @couch-potato/dictionary freq-gate
"""

from __future__ import annotations

from pathlib import Path

from wordfreq import iter_wordlist, zipf_frequency

ZIPF_MIN = 2.8
ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "freq-gate.txt"


def main() -> None:
    gate: set[str] = set()
    for w in iter_wordlist("en", wordlist="large"):
        if len(w) < 3 or not w.isalpha() or not w.isascii():
            continue
        if zipf_frequency(w, "en", wordlist="large") >= ZIPF_MIN:
            gate.add(w.lower())
    words = sorted(gate)
    header = f"""# Frequency gate for the play lexicon (build-time).
# Words with wordfreq (en, large) zipf_frequency >= {ZIPF_MIN}.
# Play = ENABLE ∩ (this set ∪ play-allowlist.txt) − NSFW − names.
# Regenerate: bun run --filter @couch-potato/dictionary freq-gate
# Source: https://github.com/rspeer/wordfreq
"""
    OUT.write_text(header + "\n".join(words) + "\n", encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)} ({len(words)} words, zipf >= {ZIPF_MIN})")


if __name__ == "__main__":
    main()
