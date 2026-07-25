import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import { cellCenter, HEX_CLIP, HEX_TILE_POINTS, hexAspect, hexRowStyle } from "./hexLayout";
import {
  applyPathCell,
  cellKey,
  cellsEqual,
  isAdjacent,
  isInBacktrackZone,
  isInTileHitZone,
  type Cell,
  type LetterGridProps,
} from "./pathCells";

export type { Cell, LetterGridProps };
export { applyPathCell } from "./pathCells";
export { cellCenter, HEX_CLIP, hexAspect } from "./hexLayout";

/**
 * Web LetterGrid — tactile cream tiles in a thick sage frame.
 * Path stroke + topology-matched select tint (circle / on-tile hex); letters stay readable.
 * Hex select lives on the tile box so `--cp-tile-gap` / well padding cannot offset it.
 */
export function LetterGrid({
  letters,
  selected = [],
  onPathChange,
  onPathEnd,
  dropping = false,
  className = "",
  topology = "square",
  isAdjacent: adjacentFn = isAdjacent,
  boardTurnDeg = 0,
  boardTurning = false,
  interactive = true,
  onBoardTurnEnd,
}: LetterGridProps) {
  const dragging = useRef(false);
  const pathRef = useRef<Cell[]>([]);
  const pointerId = useRef<number | null>(null);
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const selectedSet = new Set(selected.map(cellKey));
  const hex = topology === "hex";

  useEffect(() => {
    if (interactive) return;
    dragging.current = false;
    pointerId.current = null;
    pathRef.current = [];
  }, [interactive]);

  const touch = useCallback(
    (cell: Cell, allowBacktrack: boolean) => {
      if (!interactiveRef.current) return;
      const next = applyPathCell(pathRef.current, cell, adjacentFn, {
        allowBacktrack,
      });
      if (!next) return;
      pathRef.current = next;
      onPathChange?.(next);
    },
    [onPathChange, adjacentFn],
  );

  /** Tile under point + hit/backtrack zones (edge inset = swipe gutter). */
  const hit = useCallback(
    (clientX: number, clientY: number): { cell: Cell; allowBacktrack: boolean } | null => {
      const stack = document.elementsFromPoint(clientX, clientY);
      for (const el of stack) {
        const tile = (el as Element).closest?.("[data-tile]") as HTMLElement | null;
        if (!tile) continue;
        const row = Number(tile.dataset.row);
        const col = Number(tile.dataset.col);
        if (Number.isNaN(row) || Number.isNaN(col)) continue;
        const rect = tile.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) continue;
        const nx = (clientX - rect.left) / rect.width;
        const ny = (clientY - rect.top) / rect.height;
        // Margin gap + edge inset — skip fringe so diagonals don’t clip neighbors.
        if (!isInTileHitZone(nx, ny)) continue;
        return { cell: { row, col }, allowBacktrack: isInBacktrackZone(nx, ny) };
      }
      return null;
    },
    [],
  );

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactiveRef.current) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    dragging.current = true;
    pointerId.current = e.pointerId;
    pathRef.current = [];
    onPathChange?.([]);
    e.currentTarget.setPointerCapture(e.pointerId);
    const found = hit(e.clientX, e.clientY);
    if (found) touch(found.cell, true);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || pointerId.current !== e.pointerId) return;
    e.preventDefault();
    const found = hit(e.clientX, e.clientY);
    if (!found) return;
    // New adjacent cells append on full tile; backtrack needs center zone.
    const onPath = pathRef.current.some((c) => cellsEqual(c, found.cell));
    touch(found.cell, !onPath || found.allowBacktrack);
  };

  const endPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || pointerId.current !== e.pointerId) return;
    dragging.current = false;
    pointerId.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (!interactiveRef.current) {
      pathRef.current = [];
      return;
    }
    onPathEnd?.(pathRef.current);
    pathRef.current = [];
  };

  const onSpinTransitionEnd = (e: ReactTransitionEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    // Only the board transform — ignore letter counter-rotate bubbles (filtered by target).
    if (e.propertyName !== "transform") return;
    if (!boardTurning) return;
    onBoardTurnEnd?.();
  };

  const spinStyle = {
    "--cp-board-turn": `${boardTurnDeg}deg`,
  } as CSSProperties;

  const n = letters.length;
  const aspect = hex ? hexAspect(n) : { w: 1, h: 1 };
  const connectors =
    selected.length > 1
      ? selected.slice(1).map((cell, i) => {
          const prev = selected[i]!;
          const a = cellCenter(prev.row, prev.col, n, topology);
          const b = cellCenter(cell.row, cell.col, n, topology);
          return (
            <line
              key={`${cellKey(prev)}-${cellKey(cell)}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--path)"
              strokeWidth="10"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity="0.72"
            />
          );
        })
      : null;

  /** Square select rings only — hex select is painted on each tile (gap-proof). */
  const squareRings =
    !hex && selected.length > 0
      ? selected.map((cell) => {
          const c = cellCenter(cell.row, cell.col, n, topology);
          return (
            <circle
              key={`ring-${cellKey(cell)}`}
              cx={c.x}
              cy={c.y}
              r={6.5}
              fill="color-mix(in srgb, var(--path) 28%, transparent)"
              stroke="var(--path)"
              strokeWidth="2.5"
              vectorEffect="non-scaling-stroke"
              opacity="0.9"
            />
          );
        })
      : null;

  return (
    <div
      className={`cp-board-frame cp-board-spin w-full ${boardTurning ? "is-turning" : ""} ${className}`}
      style={spinStyle}
      onTransitionEnd={onSpinTransitionEnd}
    >
      <div
        role="grid"
        aria-label="Letter grid"
        aria-busy={boardTurning || undefined}
        className="cp-board-well relative w-full select-none"
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          pointerEvents: interactive ? undefined : "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        {/* Play surface = tile layout box (inside well pad). Path SVG shares this box. */}
        <div
          className="cp-board-play relative w-full"
          style={{
            aspectRatio: hex ? `${aspect.w} / ${aspect.h}` : "1",
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {connectors}
            {squareRings}
          </svg>
          <div
            className={
              hex ? "relative z-10 h-full w-full" : "relative z-10 flex h-full w-full flex-col"
            }
          >
            {letters.map((row, rowIndex) => (
              <div
                key={rowIndex}
                className={hex ? "absolute flex" : "flex flex-1 flex-row"}
                role="row"
                style={hex ? hexRowStyle(rowIndex, n) : undefined}
              >
                {row.map((letter, colIndex) => {
                  const active = selectedSet.has(cellKey({ row: rowIndex, col: colIndex }));
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      role="gridcell"
                      data-tile
                      data-row={rowIndex}
                      data-col={colIndex}
                      data-testid={`tile-${rowIndex}-${colIndex}`}
                      className={`cp-tile ${hex ? "cp-tile-hex" : ""} ${
                        active ? "cp-tile-active cp-tile-selected" : ""
                      } ${dropping ? "cp-tile-drop" : ""}`}
                      style={{
                        ...(hex ? { clipPath: HEX_CLIP, borderRadius: 0 } : null),
                        ...(dropping
                          ? {
                              animationDelay: `${(rowIndex * n + colIndex) * 28}ms`,
                            }
                          : null),
                        zIndex: active ? 6 : 1,
                      }}
                    >
                      {hex && active ? (
                        <svg
                          className="cp-hex-select"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                          aria-hidden
                        >
                          <polygon
                            points={HEX_TILE_POINTS}
                            fill="color-mix(in srgb, var(--path) 28%, transparent)"
                            stroke="var(--path)"
                            strokeWidth="3"
                            vectorEffect="non-scaling-stroke"
                            opacity="0.95"
                          />
                        </svg>
                      ) : null}
                      <span className="cp-tile-letter">{letter}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
