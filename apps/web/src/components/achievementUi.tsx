import type { LucideIcon } from "lucide-react";
import {
  ALargeSmall,
  Flame,
  Library,
  Rocket,
  Rows3,
  ScrollText,
  Sofa,
  Sparkles,
  Trophy,
  Type,
  WholeWord,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSurvivalSeconds, type TrackId, type TrackProgress } from "../achievements";

/** One glyph per track — reused by the results peek and the full achievements page. */
export const TRACK_ICONS: Record<TrackId, LucideIcon> = {
  points: Trophy,
  words: Library,
  sessions: Sofa,
  bestRunPoints: Sparkles,
  bestRunWords: Rocket,
  len3: Type,
  len4: WholeWord,
  len5: ALargeSmall,
  len6: Rows3,
  len7plus: ScrollText,
  survivalTime: Flame,
  survivalWords: Zap,
};

function formatTrackNumber(p: TrackProgress, n: number): string {
  return p.track.unit === "sec" ? formatSurvivalSeconds(n) : `${n}`;
}

/** "12 / 25 words", "1m 30s / 2m", or "1000 pts · maxed". */
export function formatTrackStat(p: TrackProgress): string {
  const cur = formatTrackNumber(p, p.value);
  if (p.maxed) {
    return p.track.unit === "sec" ? `${cur} · maxed` : `${cur} ${p.track.unit} · maxed`;
  }
  const next = formatTrackNumber(p, p.nextMilestone ?? 0);
  return p.track.unit === "sec" ? `${cur} / ${next}` : `${cur} / ${next} ${p.track.unit}`;
}

/**
 * One track's icon + label + progress bar. Compact by default (results peek);
 * `withMilestones` adds the full milestone pip row for the achievements page.
 */
export function AchievementTrackRow({
  progress,
  justLeveled = false,
  withMilestones = false,
  className = "",
}: {
  progress: TrackProgress;
  justLeveled?: boolean;
  withMilestones?: boolean;
  className?: string;
}) {
  const Icon = TRACK_ICONS[progress.track.id];
  const lit = progress.maxed || justLeveled;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span
        className={cn(
          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
          lit ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-4" strokeWidth={2.25} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="font-display text-sm font-bold text-foreground">
            {progress.track.label}
          </span>
          <span className="shrink-0 font-body text-xs font-semibold tabular-nums text-muted-foreground">
            {formatTrackStat(progress)}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none",
              progress.maxed ? "bg-secondary" : "bg-path",
            )}
            style={{ width: `${Math.round(progress.progress * 100)}%` }}
          />
        </div>
        {justLeveled ? (
          <span className="cp-results-best-chip mt-1.5 inline-flex items-center">
            <span className="font-display text-[0.65rem] font-bold uppercase tracking-wide text-secondary-foreground">
              Stage {progress.stage} medal!
            </span>
          </span>
        ) : withMilestones ? (
          <div className="mt-2 flex flex-wrap gap-1.5" aria-hidden>
            {progress.track.milestones.map((m, i) => {
              const cleared = i < progress.stage;
              return (
                <span
                  key={m}
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-body text-[0.6rem] font-bold tabular-nums",
                    cleared
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {formatTrackNumber(progress, m)}
                </span>
              );
            })}
          </div>
        ) : null}
        {withMilestones ? (
          <p className="mt-1.5 font-body text-[0.7rem] leading-snug text-muted-foreground">
            {progress.track.hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
