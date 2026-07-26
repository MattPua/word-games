import { HEX_CLIP, hexAspect, hexRowStyle, Shell } from "@couch-potato/ui";
import { getRouteApi } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { playLaunchFromSearch } from "@/playLaunchSearch";

const playRouteApi = getRouteApi("/play");

/**
 * Instant play chrome while the lazy `/play` chunk loads and the board gens.
 * Board must mirror `LetterGrid` geometry (frame → well → play aspect → tiles)
 * for the launch grid size + topology — not a capped square that jumps on paint.
 */
export function PlaySkeleton() {
  const search = playRouteApi.useSearch();
  const launch = playLaunchFromSearch(search);
  const grid = launch.grid ?? 4;
  const hex = (launch.topology ?? "square") === "hex";
  const mode = launch.mode ?? "target";
  const aspect = hex ? hexAspect(grid) : { w: 1, h: 1 };
  const showProgress = mode === "target";

  return (
    <Shell
      className="relative overflow-hidden cp-shell-play"
      aria-busy="true"
      aria-label="Spinning up the board"
    >
      <div className="cp-play-hud mb-2 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          {mode === "target" ? (
            <Skeleton className="h-9 w-32 shrink-0 rounded-full" />
          ) : (
            <Skeleton className="size-11 shrink-0 rounded-full" />
          )}
          <Skeleton className="size-9 shrink-0 rounded-ui" />
        </div>
        <div className="flex justify-center">
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>

      {showProgress ? <Skeleton className="mb-3 h-2 w-full rounded-sm" /> : null}

      <div className="mb-3 flex flex-col items-center gap-2">
        <Skeleton className="h-10 w-44 rounded-full" />
        <Skeleton className="h-3 w-28 rounded-sm" />
      </div>

      {/* Same stack as LetterGrid — width from play shell / short-viewport caps, not a 22rem guess. */}
      <div className="cp-board-frame w-full">
        <div className="cp-board-well relative w-full select-none">
          <div
            className="cp-board-play relative w-full"
            data-size={grid}
            style={{ aspectRatio: hex ? `${aspect.w} / ${aspect.h}` : "1" }}
          >
            <div
              className={
                hex ? "relative z-10 h-full w-full" : "relative z-10 grid h-full min-h-0 w-full"
              }
              style={
                hex
                  ? undefined
                  : {
                      gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${grid}, minmax(0, 1fr))`,
                    }
              }
            >
              {Array.from({ length: grid }, (_, row) =>
                hex ? (
                  <div key={row} className="absolute flex" style={hexRowStyle(row, grid)}>
                    {Array.from({ length: grid }, (_, col) => (
                      <TileBone key={`${row}-${col}`} hex />
                    ))}
                  </div>
                ) : (
                  <div key={row} style={{ display: "contents" }}>
                    {Array.from({ length: grid }, (_, col) => (
                      <TileBone key={`${row}-${col}`} hex={false} />
                    ))}
                  </div>
                ),
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-0 w-full shrink-0" aria-hidden />

      <div className="cp-play-board-actions mt-1.5 flex w-full shrink-0 items-center justify-center gap-2 sm:mt-2">
        <Skeleton className="h-11 w-[4.75rem] rounded-ui" />
        <Skeleton className="h-11 w-[4.75rem] rounded-ui" />
      </div>
    </Shell>
  );
}

/** Real `.cp-tile` margins/clip so gutters match the live board. */
function TileBone({ hex }: { hex: boolean }) {
  return (
    <div
      className={cn(
        "cp-tile pointer-events-none",
        hex ? "cp-tile-hex" : "cp-tile-square",
      )}
      style={hex ? { clipPath: HEX_CLIP, borderRadius: 0 } : undefined}
      aria-hidden
    >
      <Skeleton className="absolute inset-0 size-full rounded-[inherit] border-0 shadow-none" />
    </div>
  );
}
