import type { CSSProperties } from "react";
import {
  MEDALS_SPRITE_FRAMES,
  MEDALS_SPRITE_SHEET,
  type MedalsCategoryFrame,
} from "./spriteAtlas";

export type MedalsCategorySpriteProps = {
  frame: MedalsCategoryFrame;
  size?: number;
  className?: string;
};

/** Percent along the sheet x-axis for a frame's left edge. */
function frameOffsetPercent(frame: MedalsCategoryFrame): number {
  const rect = MEDALS_SPRITE_FRAMES[frame];
  const maxX = MEDALS_SPRITE_SHEET.width - rect.w;
  return maxX > 0 ? (rect.x / maxX) * 100 : 0;
}

/** Static category mascot for Couch medals section headers (web CSS sprite). */
export function MedalsCategorySprite({
  frame,
  size = 48,
  className = "",
}: MedalsCategorySpriteProps) {
  const { url, cols, rows } = MEDALS_SPRITE_SHEET;
  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${url})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPositionX: `${frameOffsetPercent(frame)}%`,
  };

  return (
    <div
      role="img"
      aria-hidden
      className={`cp-potato-sprite shrink-0 ${className}`.trim()}
      style={style}
    />
  );
}
