export type PotatoSpriteFrame = "idle" | "cheer";

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Frame map for `logo-sprite.png` — equal 506x512 cells, idle (chill) then
 * cheer (arms up + sparkles), transparent bg (see AGENTS.md Brand). This is
 * the source of truth consumed by `PotatoSprite`; `logo-sprite.json` mirrors
 * the same rects as a plain-data companion for non-TS/tooling consumers.
 * Keep both in sync if the sheet is ever redone in PixelLab.
 */
export const LOGO_SPRITE_SHEET = {
  url: "/logo-sprite.png",
  cols: 2,
  rows: 1,
  width: 1012,
  height: 512,
} as const;

export const LOGO_SPRITE_CELL = { width: 506, height: 512 } as const;

export const LOGO_SPRITE_FRAMES: Record<PotatoSpriteFrame, SpriteRect> = {
  idle: { x: 0, y: 0, w: 506, h: 512 },
  cheer: { x: 506, y: 0, w: 506, h: 512 },
};
