import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from "react";
import type { Cell, LetterGridProps } from "./LetterGrid";

export type { Cell, LetterGridProps };

function cellKey(c: Cell) {
  return `${c.row},${c.col}`;
}

function isAdjacent(a: Cell, b: Cell) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

function readCell(el: Element | null): Cell | null {
  const tile = el?.closest?.("[data-tile]") as HTMLElement | null;
  if (!tile) return null;
  const row = Number(tile.dataset.row);
  const col = Number(tile.dataset.col);
  if (Number.isNaN(row) || Number.isNaN(col)) return null;
  return { row, col };
}

/**
 * Web LetterGrid — native Pointer Events + elementFromPoint hit-testing.
 * Path updates live on pointermove; touch-action: none prevents scroll steal.
 */
export function LetterGrid({
  letters,
  selected = [],
  onPathChange,
  onPathEnd,
  className = "",
}: LetterGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const pathRef = useRef<Cell[]>([]);
  const pointerId = useRef<number | null>(null);
  const selectedSet = new Set(selected.map(cellKey));

  const append = useCallback(
    (cell: Cell) => {
      const path = pathRef.current;
      const last = path[path.length - 1];
      if (last && last.row === cell.row && last.col === cell.col) return;
      if (path.some((c) => c.row === cell.row && c.col === cell.col)) return;
      if (last && !isAdjacent(last, cell)) return;
      const next = [...path, cell];
      pathRef.current = next;
      onPathChange?.(next);
    },
    [onPathChange],
  );

  const hit = useCallback((clientX: number, clientY: number): Cell | null => {
    const stack = document.elementsFromPoint(clientX, clientY);
    for (const el of stack) {
      const cell = readCell(el);
      if (cell) return cell;
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
    if (cell) append(cell);
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging.current || pointerId.current !== e.pointerId) return;
    e.preventDefault();
    const cell = hit(e.clientX, e.clientY);
    if (cell) append(cell);
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

  // SVG connectors between selected cell centers (cheap visual)
  const connectors =
    selected.length > 1
      ? selected.slice(1).map((cell, i) => {
          const prev = selected[i]!;
          const n = letters.length;
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
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.85"
            />
          );
        })
      : null;

  return (
    <div
      ref={rootRef}
      role="grid"
      aria-label="Letter grid"
      className={`relative aspect-square w-full select-none ${className}`}
      style={{ touchAction: "none", WebkitUserSelect: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
    >
      <svg
        className="pointer-events-none absolute inset-0 z-10 h-full w-full"
        aria-hidden
      >
        {connectors}
      </svg>
      <div className="relative z-0 flex h-full w-full flex-col">
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
                  className={`m-0.5 flex flex-1 items-center justify-center rounded-ui border border-border ${
                    active ? "bg-path" : "bg-card"
                  }`}
                >
                  <span
                    className={`pointer-events-none font-body text-2xl font-extrabold ${
                      active ? "text-primary-foreground" : "text-foreground"
                    }`}
                  >
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
