import type { LucideIcon } from "lucide-react";
import { cn } from "./cn";

export type PrefChoiceOption<T extends string> = {
  value: T;
  label: string;
  hint?: string;
  Icon: LucideIcon;
};

/** 2-option choice cards — same `.cp-lobby-challenge` language as How hard? / Min length. */
export function PrefChoiceGroup<T extends string>({
  label,
  value,
  onChange,
  options,
  className,
  "data-testid": testId,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: readonly PrefChoiceOption<T>[];
  className?: string;
  "data-testid"?: string;
}) {
  const anyHint = options.some((o) => Boolean(o.hint));
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="font-display text-sm font-bold text-foreground">{label}</p>
      <div
        role="group"
        aria-label={label}
        data-testid={testId}
        className="cp-lobby-choice-row cp-lobby-choice-row-2 gap-2"
      >
        {options.map(({ value: opt, label: optLabel, hint, Icon }) => {
          const active = value === opt;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              aria-label={hint ? `${optLabel}: ${hint}` : optLabel}
              data-testid={testId ? `${testId}-${opt}` : undefined}
              onClick={() => {
                if (opt !== value) onChange(opt);
              }}
              className={cn(
                "cp-lobby-challenge flex min-w-0 flex-col items-center gap-1 px-1 py-2.5",
                active && "cp-lobby-challenge-active cp-select-pop",
              )}
            >
              <span
                className={cn("cp-lobby-glyph text-muted-foreground", active && "text-secondary")}
                aria-hidden
              >
                <Icon
                  className="size-5"
                  strokeWidth={2.25}
                  fill={active ? "currentColor" : "none"}
                  fillOpacity={active ? 0.22 : 0}
                />
              </span>
              <span className="font-display text-sm font-bold">{optLabel}</span>
              {anyHint ? (
                <span
                  className={cn(
                    "min-h-[1.7em] font-body text-[0.65rem] leading-tight text-center",
                    hint ? "text-muted-foreground" : "invisible",
                  )}
                  aria-hidden={!hint}
                >
                  {hint || "\u00a0"}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
