import { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  type LayoutChangeEvent,
  type GestureResponderEvent,
} from "react-native";
import {
  applyPathCell,
  cellKey,
  type Cell,
} from "./pathCells";

export type { Cell };
export { applyPathCell, cellKey, cellsEqual, isAdjacent } from "./pathCells";

export type LetterGridProps = {
  letters: string[][];
  selected?: Cell[];
  onPathChange?: (path: Cell[]) => void;
  onPathEnd?: (path: Cell[]) => void;
  /** Staggered tile drop when round is won. */
  dropping?: boolean;
  className?: string;
};

/** Square letter board with pointer-driven path selection (RN / Expo). */
export function LetterGrid({
  letters,
  selected = [],
  onPathChange,
  onPathEnd,
  dropping = false,
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

  const touch = useCallback(
    (cell: Cell) => {
      const next = applyPathCell(pathRef.current, cell);
      if (!next) return;
      pathRef.current = next;
      onPathChange?.(next);
    },
    [onPathChange],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const target = e.target as unknown as {
      measureInWindow?: (
        cb: (x: number, y: number, w: number, h: number) => void,
      ) => void;
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
    onPathChange?.([]);
    const { pageX, pageY } = e.nativeEvent;
    const cell = hitTest(pageX, pageY);
    if (cell) touch(cell);
  };

  const onMove = (e: GestureResponderEvent) => {
    if (!dragging.current) return;
    const { pageX, pageY } = e.nativeEvent;
    const cell = hitTest(pageX, pageY);
    if (cell) touch(cell);
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
            const active = selectedSet.has(
              cellKey({ row: rowIndex, col: colIndex }),
            );
            return (
              <View
                key={`${rowIndex}-${colIndex}`}
                testID={`tile-${rowIndex}-${colIndex}`}
                className={`m-0.5 flex-1 items-center justify-center rounded-ui border-2 ${
                  active ? "border-path bg-secondary" : "border-border bg-card"
                }`}
                style={
                  dropping
                    ? {
                        transform: [{ translateY: 800 }],
                        opacity: 0,
                      }
                    : undefined
                }
              >
                <Text className="font-body text-2xl font-extrabold text-foreground">
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
