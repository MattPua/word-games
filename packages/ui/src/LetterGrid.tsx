import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from "react-native";

export type Cell = { row: number; col: number };

export type LetterGridProps = {
  letters: string[][];
  selected?: Cell[];
  onPathChange?: (path: Cell[]) => void;
  onPathEnd?: (path: Cell[]) => void;
  className?: string;
};

function cellKey(c: Cell) {
  return `${c.row},${c.col}`;
}

function isAdjacent(a: Cell, b: Cell) {
  return Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
}

/** Square letter board with pointer-driven path selection. */
export function LetterGrid({
  letters,
  selected = [],
  onPathChange,
  onPathEnd,
  className = "",
}: LetterGridProps) {
  const size = letters.length;
  const [layout, setLayout] = useState({ w: 0, h: 0, x: 0, y: 0 });
  const dragging = useRef(false);
  const pathRef = useRef<Cell[]>([]);
  const selectedSet = new Set(selected.map(cellKey));

  const hitTest = useCallback(
    (pageX: number, pageY: number): Cell | null => {
      if (!layout.w || !size) return null;
      const localX = pageX - layout.x;
      const localY = pageY - layout.y;
      if (localX < 0 || localY < 0 || localX > layout.w || localY > layout.h) {
        return null;
      }
      const col = Math.min(size - 1, Math.floor((localX / layout.w) * size));
      const row = Math.min(size - 1, Math.floor((localY / layout.h) * size));
      return { row, col };
    },
    [layout, size],
  );

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

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    // measureInWindow for page coords — RN-web provides it on View
    const target = e.target as unknown as {
      measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
    };
    target.measureInWindow?.((x, y) => {
      setLayout({ w: width, h: height, x, y });
    });
    if (!target.measureInWindow) {
      setLayout({ w: width, h: height, x: 0, y: 0 });
    }
  };

  const onStart = (e: GestureResponderEvent) => {
    dragging.current = true;
    pathRef.current = [];
    const { pageX, pageY } = e.nativeEvent;
    const cell = hitTest(pageX, pageY);
    if (cell) append(cell);
  };

  const onMove = (e: GestureResponderEvent) => {
    if (!dragging.current) return;
    const { pageX, pageY } = e.nativeEvent;
    const cell = hitTest(pageX, pageY);
    if (cell) append(cell);
  };

  const onEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onPathEnd?.(pathRef.current);
    pathRef.current = [];
  };

  return (
    <View
      className={`aspect-square w-full ${className}`}
      style={{ touchAction: "none" } as object}
      onLayout={onLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={onStart}
      onResponderMove={onMove}
      onResponderRelease={onEnd}
      onResponderTerminate={onEnd}
      accessibilityLabel="Letter grid"
    >
      {letters.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-1 flex-row">
          {row.map((letter, colIndex) => {
            const active = selectedSet.has(cellKey({ row: rowIndex, col: colIndex }));
            return (
              <View
                key={`${rowIndex}-${colIndex}`}
                testID={`tile-${rowIndex}-${colIndex}`}
                className={`m-0.5 flex-1 items-center justify-center rounded-ui border border-border ${
                  active ? "bg-path" : "bg-card"
                }`}
              >
                <Text
                  className={`font-body text-2xl font-extrabold ${
                    active ? "text-primary-foreground" : "text-foreground"
                  }`}
                >
                  {letter}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
