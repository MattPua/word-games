import {
  useCallback,
  useEffect,
  useRef,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
} from "react";
import {
  applyPathCell,
  cellKey,
  cellsEqual,
  isAdjacent,
  isInBacktrackZone,
  type Cell,
  type LetterGridProps,
} from "./pathCells";

export type { Cell, LetterGridProps };
export { applyPathCell } from "./pathCells";

/** Pointy-top hex clip (CSS %). */
const HEX_CLIP = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

/** Approximate cell center % for path stroke (odd-r offset). */
function cellCenter(
  row: number,
  col: number,
  n: number,
  topology: "square" | "hex",
): { x: number; y: number } {
  if (topology !== "hex") {
    return {
      x: ((col + 0.5) / n) * 100,
      y: ((row + 0.5) / n) * 100,
    };
  }
  const xPitch = 100 / (n + 0.5);
  const yPitch = 100 / (0.75 * (n - 1) + 1);
  return {
    x: (col + 0.5 + (row % 2 === 1 ? 0.5 : 0)) * xPitch,
    y: (row * 0.75 + 0.5) * yPitch,
  };
}

/**
 * Web LetterGrid — tactile cream tiles in a thick sage frame.
 * Path stroke + circular select tint; letters stay readable.
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

  /** Tile under point + whether pointer is in backtrack center zone. */
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
        const allowBacktrack =
          rect.width > 0 &&
          rect.height > 0 &&
          isInBacktrackZone((clientX - rect.left) / rect.width, (clientY - rect.top) / rect.height);
        return { cell: { row, col }, allowBacktrack };
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
    if (e.propertyName !== "transform") return;
    if (!boardTurning) return;
    onBoardTurnEnd?.();
  };

  const spinStyle = {
    "--cp-board-turn": `${boardTurnDeg}deg`,
  } as CSSProperties;

  const n = letters.length;
  const connectors =
    selected.length > 1
      ? selected.slice(1).map((cell, i) => {
          const prev = selected[i]!;
          const a = cellCenter(prev.row, prev.col, n, topology);
          const b = cellCenter(cell.row, cell.col, n, topology);
          return (
            <line
              key={`${cellKey(prev)}-${cellKey(cell)}`}
              x1={`${a.x}%`}
              y1={`${a.y}%`}
              x2={`${b.x}%`}
              y2={`${b.y}%`}
              stroke="var(--path)"
              strokeWidth="10"
              strokeLinecap="round"
              opacity="0.72"
            />
          );
        })
      : null;

  const rings =
    selected.length > 0
      ? selected.map((cell) => {
          const c = cellCenter(cell.row, cell.col, n, topology);
          return (
            <circle
              key={`ring-${cellKey(cell)}`}
              cx={`${c.x}%`}
              cy={`${c.y}%`}
              r="7%"
              fill="color-mix(in srgb, var(--path) 28%, transparent)"
              stroke="var(--path)"
              strokeWidth="2.5"
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
        className={`cp-board-well relative w-full select-none ${hex ? "" : "aspect-square"}`}
        style={{
          touchAction: "none",
          WebkitUserSelect: "none",
          pointerEvents: interactive ? undefined : "none",
          ...(hex ? { aspectRatio: `${n + 0.5} / ${0.75 * (n - 1) + 1}` } : null),
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <svg className="pointer-events-none absolute inset-0 z-[5] h-full w-full" aria-hidden>
          {connectors}
          {rings}
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
              style={
                hex
                  ? {
                      top: `${((rowIndex * 0.75) / (0.75 * (n - 1) + 1)) * 100}%`,
                      left: rowIndex % 2 === 1 ? `${(0.5 / (n + 0.5)) * 100}%` : 0,
                      width: `${(n / (n + 0.5)) * 100}%`,
                      height: `${(1 / (0.75 * (n - 1) + 1)) * 100}%`,
                    }
                  : undefined
              }
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
                    className={`cp-tile ${active ? "cp-tile-active cp-tile-selected" : ""} ${
                      dropping ? "cp-tile-drop" : ""
                    }`}
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
                    <span className="cp-tile-letter">{letter}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
