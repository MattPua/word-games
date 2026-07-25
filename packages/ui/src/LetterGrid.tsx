import { useCallback, useRef, useState } from "react";
import { View, Text, type LayoutChangeEvent, type GestureResponderEvent } from "react-native";
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
export { applyPathCell, cellKey, cellsEqual, isAdjacent, isInBacktrackZone } from "./pathCells";

/** Square letter board with pointer-driven path selection (RN / Expo). */
export function LetterGrid({
  letters,
  selected = [],
  onPathChange,
  onPathEnd,
  dropping = false,
  className = "",
  isAdjacent: adjacentFn = isAdjacent,
}: LetterGridProps) {
  const size = letters.length;
  const [layout, setLayout] = useState({ w: 0, h: 0, x: 0, y: 0 });
  const dragging = useRef(false);
  const pathRef = useRef<Cell[]>([]);
  const selectedSet = new Set(selected.map(cellKey));

  const hitTest = useCallback(
    (pageX: number, pageY: number): { cell: Cell; allowBacktrack: boolean } | null => {
      if (!layout.w || !size) return null;
      const localX = pageX - layout.x;
      const localY = pageY - layout.y;
      if (localX < 0 || localY < 0 || localX > layout.w || localY > layout.h) {
        return null;
      }
      const colF = (localX / layout.w) * size;
      const rowF = (localY / layout.h) * size;
      const col = Math.min(size - 1, Math.floor(colF));
      const row = Math.min(size - 1, Math.floor(rowF));
      return {
        cell: { row, col },
        allowBacktrack: isInBacktrackZone(colF - col, rowF - row),
      };
    },
    [layout, size],
  );

  const touch = useCallback(
    (cell: Cell, allowBacktrack: boolean) => {
      const next = applyPathCell(pathRef.current, cell, adjacentFn, {
        allowBacktrack,
      });
      if (!next) return;
      pathRef.current = next;
      onPathChange?.(next);
    },
    [onPathChange, adjacentFn],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
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
    onPathChange?.([]);
    const { pageX, pageY } = e.nativeEvent;
    const found = hitTest(pageX, pageY);
    if (found) touch(found.cell, true);
  };

  const onMove = (e: GestureResponderEvent) => {
    if (!dragging.current) return;
    const { pageX, pageY } = e.nativeEvent;
    const found = hitTest(pageX, pageY);
    if (!found) return;
    const onPath = pathRef.current.some((c) => cellsEqual(c, found.cell));
    touch(found.cell, !onPath || found.allowBacktrack);
  };

  const onEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    onPathEnd?.(pathRef.current);
    pathRef.current = [];
  };

  return (
    <View className={`cp-board-frame w-full ${className}`}>
      <View
        className="cp-board-well aspect-square w-full"
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
                  className={`cp-tile ${active ? "cp-tile-active" : ""}`}
                  style={
                    dropping
                      ? {
                          transform: [{ translateY: 800 }],
                          opacity: 0,
                        }
                      : undefined
                  }
                >
                  <Text className="cp-tile-letter">{letter}</Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
