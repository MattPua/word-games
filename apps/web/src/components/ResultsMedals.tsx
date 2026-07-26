import { ChevronRight, Medal } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import {
  allTrackProgress,
  type AchievementContext,
  type StageUp,
  type TrackId,
  type TrackProgress,
} from "../achievements";
import { AchievementTrackRow } from "./achievementUi";
import { Button } from "@/components/ui/button";

const MAX_ROWS = 4;

/** Results "Couch medals" peek — stage-ups first, then whatever else moved this run. */
export function ResultsMedals({
  snapshot,
  stageUps,
  touched,
  className = "",
}: {
  snapshot: AchievementContext;
  stageUps: StageUp[];
  touched: TrackId[];
  className?: string;
}) {
  const navigate = useNavigate();
  const leveledIds = new Set(stageUps.map((s) => s.id));
  const unlockById = new Map(stageUps.map((s) => [s.id, s.unlockedAt]));
  const restIds = (touched ?? []).filter((id) => !leveledIds.has(id));
  const rowIds = [...(stageUps ?? []).map((s) => s.id), ...restIds].slice(0, MAX_ROWS);
  if (rowIds.length === 0) return null;

  const progressById = new Map(allTrackProgress(snapshot).map((p) => [p.track.id, p]));

  return (
    <div className={`cp-lobby-card p-4 cp-fade-up cp-stagger-1 ${className}`.trim()}>
      <div className="mb-3 flex flex-row items-center justify-between gap-2">
        <div className="flex flex-row items-center gap-2">
          <Medal className="cp-lobby-glyph size-4 text-secondary" strokeWidth={2.25} aria-hidden />
          <h2 className="text-lg text-foreground">Couch medals</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto gap-1 px-1.5 py-1 text-xs"
          onClick={() => navigate({ to: "/achievements" })}
        >
          See all
          <ChevronRight className="size-3.5" aria-hidden />
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {rowIds.map((id) => {
          const progress = progressById.get(id);
          if (!progress) return null;
          const justLeveled = leveledIds.has(id);
          // Prefer the stage-up stamp when present (fresh unlock this run).
          const rowProgress: TrackProgress =
            justLeveled && unlockById.has(id)
              ? { ...progress, unlockedAt: unlockById.get(id)! }
              : progress;
          return <AchievementTrackRow key={id} progress={rowProgress} justLeveled={justLeveled} />;
        })}
      </div>
    </div>
  );
}
