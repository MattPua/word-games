import { useId } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type SegmentOption<T extends string | number> = {
  value: T;
  label: string;
};

/** Soft living-room segment control — sliding pill + select pop. */
export function SegmentGroup<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const n = options.length;
  const idx = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const pillId = useId();

  return (
    <div
      role="group"
      className={cn("relative mb-4 grid gap-0 rounded-ui bg-muted/80 p-1", className)}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      <div
        id={pillId}
        aria-hidden
        className="pointer-events-none absolute bottom-1 top-1 z-0 rounded-ui bg-card shadow-sm transition-[left,width] duration-300 ease-[cubic-bezier(0.34,1.45,0.64,1)]"
        style={{
          left: `calc(${(100 / n) * idx}% + 0.2rem)`,
          width: `calc(${100 / n}% - 0.4rem)`,
        }}
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Button
            key={String(opt.value)}
            type="button"
            variant="segment"
            size="sm"
            aria-pressed={active}
            className={cn(
              "relative z-10 h-9 w-full rounded-ui shadow-none",
              active
                ? "font-extrabold text-foreground"
                : "font-bold text-muted-foreground hover:text-foreground",
              active && "cp-select-pop",
            )}
            onClick={() => {
              if (opt.value !== value) onChange(opt.value);
            }}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}
