import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Ban, X } from "lucide-react";
/** Light path — do not import `@couch-potato/dictionary` (pulls ENABLE JSON into lobby). */
import { normalizeWord } from "@couch-potato/dictionary/filter";
import { cn } from "@/lib/utils";
import { CUSTOM_BLOCK_CAP } from "../storage";

export type WordBanInputProps = {
  words: string[];
  onChange: (words: string[]) => void;
  className?: string;
};

type BanHint = "short" | "junk" | "missing" | "dupe" | "full" | null;

function hintCopy(hint: BanHint): string | null {
  if (hint === "short") return "Need 3+ letters";
  if (hint === "junk") return "Letters only, couch style";
  if (hint === "missing") return "Not in the couch lexicon";
  if (hint === "dupe") return "Already on the ban list";
  if (hint === "full") return `Cap is ${CUSTOM_BLOCK_CAP} bans`;
  return null;
}

/**
 * Tag / pillbox for device house bans. Enter commits a playable lexicon word;
 * Backspace on empty draft pops the last tag. Click × to remove any tag.
 * Lexicon loads on first commit only (keeps ENABLE off the lobby cold chunk).
 */
export function WordBanInput({ words, onChange, className }: WordBanInputProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<BanHint>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    if (!hint) return;
    const t = window.setTimeout(() => setHint(null), 2200);
    return () => window.clearTimeout(t);
  }, [hint]);

  const tryAdd = async (raw: string) => {
    const w = normalizeWord(raw);
    if (!w) return;
    if (w.length < 3) {
      setHint("short");
      return;
    }
    if (!/^[a-z]+$/.test(w)) {
      setHint("junk");
      return;
    }
    if (words.includes(w)) {
      setHint("dupe");
      setDraft("");
      return;
    }
    if (words.length >= CUSTOM_BLOCK_CAP) {
      setHint("full");
      return;
    }
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const { getDictionary } = await import("@couch-potato/dictionary");
      if (!getDictionary().has(w)) {
        setHint("missing");
        return;
      }
      onChange([...words, w]);
      setDraft("");
      setHint(null);
    } finally {
      busyRef.current = false;
    }
  };

  const removeAt = (index: number) => {
    onChange(words.filter((_, i) => i !== index));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      void tryAdd(draft);
      return;
    }
    if (e.key === "Backspace" && draft.length === 0 && words.length > 0) {
      e.preventDefault();
      onChange(words.slice(0, -1));
    }
  };

  const hintText = hintCopy(hint);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        role="group"
        aria-labelledby={inputId}
        className={cn(
          "cp-word-ban flex min-h-11 w-full cursor-text flex-wrap items-center gap-1.5 rounded-ui border-2 border-input bg-card px-2 py-1.5 shadow-sm",
          "focus-within:ring-2 focus-within:ring-ring",
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {words.map((w, i) => (
          <span key={w} className="cp-word-ban-tag">
            <Ban className="size-3 shrink-0 opacity-70" aria-hidden strokeWidth={2.25} />
            <span className="font-display text-xs font-bold uppercase tracking-wide">{w}</span>
            <button
              type="button"
              className="cp-word-ban-tag-x"
              aria-label={`Unban ${w}`}
              onClick={(e) => {
                e.stopPropagation();
                removeAt(i);
              }}
            >
              <X className="size-3" strokeWidth={2.5} aria-hidden />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="done"
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^a-zA-Z]/g, ""))}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (draft.trim()) void tryAdd(draft);
          }}
          placeholder={words.length === 0 ? "Type a word, hit Enter" : "Add another…"}
          aria-label="Ban a word from new runs"
          className="min-w-[7rem] flex-1 border-0 bg-transparent px-1 py-1 font-body text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>
      <p
        className={cn(
          "font-body text-xs",
          hintText ? "text-destructive" : "text-muted-foreground",
        )}
        role={hintText ? "status" : undefined}
      >
        {hintText ?? "House bans for new runs only. Must be a real playable word."}
      </p>
    </div>
  );
}
