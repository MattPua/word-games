export type PotatoSpriteFrame = "idle" | "cheer" | "bored";

/** Couch medals `/achievements` category header poses (`medals-sprite.png`). */
export type MedalsCategoryFrame =
  | "bigPicture"
  | "personalBests"
  | "lengthHauls"
  | "survival";

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Frame map for `logo-sprite.png` — equal 506x512 cells: idle (chill),
 * cheer (arms up + sparkles), bored (slumped / empty-board wait), transparent
 * bg (see AGENTS.md Brand). This is the source of truth consumed by
 * `PotatoSprite`; `logo-sprite.json` mirrors the same rects as a plain-data
 * companion for non-TS/tooling consumers. Keep both in sync if the sheet is
 * ever redone in PixelLab.
 */
export const LOGO_SPRITE_SHEET = {
  url: "/logo-sprite.png",
  cols: 3,
  rows: 1,
  width: 1518,
  height: 512,
} as const;

export const LOGO_SPRITE_CELL = { width: 506, height: 512 } as const;

export const LOGO_SPRITE_FRAMES: Record<PotatoSpriteFrame, SpriteRect> = {
  idle: { x: 0, y: 0, w: 506, h: 512 },
  cheer: { x: 506, y: 0, w: 506, h: 512 },
  bored: { x: 1012, y: 0, w: 506, h: 512 },
};

/**
 * Frame map for `medals-sprite.png` — equal 402×420 cells (4×1):
 * bigPicture (overview sparkles) | personalBests (cheer) | lengthHauls (reach)
 * | survival (sweat / hang on). Separate sheet so logo-sprite idle/cheer/bored
 * interactive offsets stay untouched. Mirror in `medals-sprite.json`.
 */
export const MEDALS_SPRITE_SHEET = {
  url: "/medals-sprite.png",
  cols: 4,
  rows: 1,
  width: 1608,
  height: 420,
} as const;

export const MEDALS_SPRITE_CELL = { width: 402, height: 420 } as const;

export const MEDALS_SPRITE_FRAMES: Record<MedalsCategoryFrame, SpriteRect> = {
  bigPicture: { x: 0, y: 0, w: 402, h: 420 },
  personalBests: { x: 402, y: 0, w: 402, h: 420 },
  lengthHauls: { x: 804, y: 0, w: 402, h: 420 },
  survival: { x: 1206, y: 0, w: 402, h: 420 },
};
