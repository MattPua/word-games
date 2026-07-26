export type ProgressBarProps = {
  value: number;
  max: number;
  className?: string;
};

export function ProgressBar({ value, max, className = "" }: ProgressBarProps) {
  /** `value` = remaining to clear; bar empties toward 0 (or fills cleared fraction). */
  const cleared = max <= 0 ? 100 : Math.min(100, Math.round(((max - value) / max) * 100));
  return (
    <div
      className={`h-3 w-full overflow-hidden rounded-full border border-border bg-[color-mix(in_srgb,var(--primary)_18%,var(--muted))] ${className}`}
    >
      <div
        className="h-full rounded-full bg-path transition-[width] duration-300 ease-out"
        style={{ width: `${cleared}%` }}
      />
    </div>
  );
}
