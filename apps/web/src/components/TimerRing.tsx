import { cn } from "@/lib/utils";

const SIZE = 44;
const STROKE = 3.5;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

type TimerRingProps = {
  /** Milliseconds left on the clock. */
  remainingMs: number;
  /** Full-ring baseline (timed sprint length, or survival budget so far). */
  totalMs: number;
  /** 0 calm · 1 warn · 2 critical (destructive). */
  urgency: 0 | 1 | 2;
  pulsing?: boolean;
  className?: string;
};

/**
 * Circular countdown — full at max time, arc drains as seconds fall.
 * Turns terracotta when the clock runs low (same urgency tiers as before).
 */
export function TimerRing({
  remainingMs,
  totalMs,
  urgency,
  pulsing,
  className,
}: TimerRingProps) {
  const secs = Math.max(0, Math.ceil(remainingMs / 1000));
  const progress =
    totalMs > 0 ? Math.max(0, Math.min(1, remainingMs / totalMs)) : 0;
  const offset = C * (1 - progress);

  return (
    <div
      className={cn(
        "cp-timer-ring",
        urgency === 1 && "cp-timer-ring-warn",
        urgency === 2 && "cp-timer-ring-critical",
        pulsing && "is-pulsing",
        className,
      )}
      role="timer"
      aria-label={`${secs} seconds left`}
      aria-valuenow={secs}
      aria-valuemin={0}
      aria-valuemax={Math.ceil(totalMs / 1000)}
    >
      <svg
        className="cp-timer-ring-svg"
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden
      >
        <circle
          className="cp-timer-ring-track"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
        />
        <circle
          className="cp-timer-ring-arc"
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
      </svg>
      <span className="cp-timer-ring-label tabular-nums">{secs}s</span>
    </div>
  );
}
