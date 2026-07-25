import { useCallback, useRef, useState, type CSSProperties } from "react";
import { LOGO_SPRITE_FRAMES, LOGO_SPRITE_SHEET, type PotatoSpriteFrame } from "./spriteAtlas";

export type PotatoSpriteProps = {
  size?: number;
  className?: string;
  /**
   * Force a specific atlas frame (e.g. results hero cheer on a win/high
   * score). Static — no idle bob or hover/tap reaction; callers own any
   * float/pop wrapper (see `.cp-potato-sprite-interactive` in `theme.css`).
   * Omit for the playful default: idle bob + occasional cheer nudge +
   * hover/tap wiggle (404 / empty-state mascot).
   */
  frame?: PotatoSpriteFrame;
};

/** Percent along the sheet's x-axis for a frame's left edge — drives `background-position-x`. */
function frameOffsetPercent(frame: PotatoSpriteFrame): number {
  const rect = LOGO_SPRITE_FRAMES[frame];
  const maxX = LOGO_SPRITE_SHEET.width - rect.w;
  return maxX > 0 ? (rect.x / maxX) * 100 : 0;
}

export function PotatoSprite({ size = 112, className = "", frame }: PotatoSpriteProps) {
  const [poked, setPoked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const poke = useCallback(() => {
    setPoked(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPoked(false), 550);
  }, []);

  const { url, cols, rows } = LOGO_SPRITE_SHEET;
  const isStatic = frame != null;

  const style: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${url})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    ...(isStatic ? { backgroundPositionX: `${frameOffsetPercent(frame)}%` } : {}),
  };

  return (
    <div
      role="img"
      aria-label="Couch Potato"
      className={`cp-potato-sprite ${isStatic ? "" : "cp-potato-sprite-interactive"} ${poked ? "is-poked" : ""} ${className}`.trim()}
      style={style}
      onPointerDown={isStatic ? undefined : poke}
    />
  );
}
