import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import {
  applyPathCell,
  cellKey,
  type Cell,
  type LetterGridProps,
} from "./pathCells";

export type { Cell, LetterGridProps };
export { applyPathCell } from "./pathCells";

/**
 * Web LetterGrid — Pointer Events + elementFromPoint.
 * Path stroke sits behind tiles; selection tint keeps letters readable.
 * Revisiting an earlier path cell truncates (backtrack undo).
 */
export function LetterGrid({
  letters,
  selected = [],
  onPathChange,
  onPathEnd,
  dropping = false,
  className = "",
}: LetterGridProps) {
  const dragging = useRef(false);
  const pathRef = useRef<Cell[]>([]);
  const pointerId = useRef<number | null>(null);
  const selectedSet = new Set(selected.map(cellKey));

  const touch = useCallback(
    (cell: Cell) => {
      const next = applyPathCell(pathRef.current, cell);
      if (!next) return;
      pathRef.current = next;
      onPathChange?.(next);
    },
    [onPathChange],
  );

  const hit = useCallback((clientX: number, clientY: number): Cell | null => {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const el of stack) {
      const tile = (el as Element).closest?.("[data-tile]") as HTMLElement | null;
      if (!tile) continue;
      const row = Number(tile.dataset.row);
      const col = Number(tile.dataset.col);
      if (Number.isNaN(row) || Number.isNaN(col)) continue;
      return { row, col };
    }
    return null;
  }, []);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    e.preventDefault();
    dragging.current = true;
    pointerId.current = e.pointerId;
    pathRef.current = [];
    onPathChange?.([]);
    e.currentTarget.setPointerCapture(e.pointerId);
    const cell = hit(e.clientX, e.clientY);
    if (cell) touch(cell);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || pointerId.current !== e.pointerId) return;
    e.preventDefault();
    const cell = hit(e.clientX, e.clientY);
    if (cell) touch(cell);
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
    onPathEnd?.(pathRef.current);
    pathRef.current = [];
  };

  const n = letters.length;
  const connectors =
    selected.length > 1
      ? selected.slice(1).map((cell, i) => {
          const prev = selected[i]!;
          const x1 = ((prev.col + 0.5) / n) * 100;
          const y1 = ((prev.row + 0.5) / n) * 100;
          const x2 = ((cell.col + 0.5) / n) * 100;
          const y2 = ((cell.row + 0.5) / n) * 100;
          return (
            <line
              key={`${cellKey(prev)}-${cellKey(cell)}`}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="var(--path)"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.55"
            />
          );
        })
      : null;

  return (
    <div
      role="grid"
      aria-label="Letter grid"
      className={`relative aspect-square w-full select-none ${className}`}
      style={{ touchAction: "none", WebkitUserSelect: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      {/* Path behind tiles so glyphs stay readable */}
      <svg
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        aria-hidden
      >
        {connectors}
      </svg>
      <div className="relative z-10 flex h-full w-full flex-col">
        {letters.map((row, rowIndex) => (
          <div key={rowIndex} className="flex flex-1 flex-row" role="row">
            {row.map((letter, colIndex) => {
              const active = selectedSet.has(
                cellKey({ row: rowIndex, col: colIndex }),
              );
              return (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  role="gridcell"
                  data-tile
                  data-row={rowIndex}
                  data-col={colIndex}
                  data-testid={`tile-${rowIndex}-${colIndex}`}
                  className={`m-0.5 flex flex-1 items-center justify-center rounded-ui border-2 ${
                    active
                      ? "border-path bg-secondary"
                      : "border-border bg-card"
                  } ${dropping ? "cp-tile-drop" : ""}`}
                  style={{
                    ...(active
                      ? {
                          backgroundColor:
                            "color-mix(in srgb, var(--path) 22%, var(--card))",
                        }
                      : null),
                    ...(dropping
                      ? {
                          animationDelay: `${(rowIndex * n + colIndex) * 28}ms`,
                        }
                      : null),
                  }}
                >
                  <span className="pointer-events-none font-body text-2xl font-extrabold text-foreground">
                    {letter}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
