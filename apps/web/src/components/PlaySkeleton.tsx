import { HEX_CLIP, hexAspect, hexRowStyle, Shell } from "@couch-potato/ui";
import { getRouteApi } from "@tanstack/react-router";
import { Skeleton } from "@/components/ui/skeleton";
import { playLaunchFromSearch } from "@/playLaunchSearch";

const playRouteApi = getRouteApi("/play");

/**
 * Instant play chrome while the lazy `/play` chunk loads and the board gens.
 * Mirrors HUD + word pill + board frame (square grid or honeycomb) from launch
 * search params (same source as PlayPage).
 */
export function PlaySkeleton() {
  const search = playRouteApi.useSearch();
  const launch = playLaunchFromSearch(search);
  const grid = launch.grid ?? 4;
  const hex = (launch.topology ?? "square") === "hex";
  const cells = grid * grid;
  const aspect = hex ? hexAspect(grid) : { w: 1, h: 1 };

  return (
    <Shell
      className="relative overflow-hidden"
      aria-busy="true"
      aria-label="Fluffing the letter cushions"
    >
      <div className="mb-3 flex flex-row items-center justify-between gap-3">
        <Skeleton className="h-9 w-28 shrink-0 rounded-sm" />
        <Skeleton className="size-9 shrink-0 rounded-sm" />
      </div>
      <Skeleton className="mb-4 h-2 w-full rounded-sm" />
      <div className="mb-4 flex flex-col items-center gap-2">
        <Skeleton className="h-10 w-40 rounded-sm" />
        <Skeleton className="h-3 w-28 rounded-sm" />
      </div>
      <div className="cp-board-frame mx-auto w-full max-w-[min(100%,22rem)]">
        <div className="cp-board-well p-[var(--cp-board-pad,0.45rem)]">
          {hex ? (
            <div
              className="relative w-full"
              style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
            >
              {Array.from({ length: grid }, (_, row) => (
                <div key={row} className="absolute flex" style={hexRowStyle(row, grid)}>
                  {Array.from({ length: grid }, (_, col) => (
                    <Skeleton
                      key={`${row}-${col}`}
                      className="m-[var(--cp-tile-gap,0.32rem)] min-h-0 min-w-0 flex-1 rounded-none"
                      style={{ clipPath: HEX_CLIP }}
                    />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div
              className="grid w-full"
              style={{
                aspectRatio: "1",
                gridTemplateColumns: `repeat(${grid}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${grid}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: cells }, (_, i) => (
                <Skeleton
                  key={i}
                  className="m-[var(--cp-tile-gap,0.32rem)] min-h-0 min-w-0 rounded-sm"
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-row items-center justify-center gap-2">
        <Skeleton className="size-9 rounded-sm" />
        <Skeleton className="size-9 rounded-sm" />
      </div>
    </Shell>
  );
}
