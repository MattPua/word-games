export type PotatoSpriteFrame = "idle" | "cheer" | "bored";

/** Couch medals `/achievements` category header poses. */
export type MedalsCategoryFrame = "bigPicture" | "personalBests" | "lengthHauls" | "survival";

export interface SpriteRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Master sheet geometry for `logo-sprite` (PixelLab atlas in `assets/`).
 * Runtime web marks use cropped single-cell WebPs (`LOGO_FRAME_URLS`) — never
 * fetch the full sheet on cold routes. Keep rects in sync with
 * `assets/logo-sprite.json` and `sprites:optimize` crops.
 */
export const LOGO_SPRITE_SHEET = {
  /** Master only — not shipped to `public/` for runtime fetch. */
  asset: "logo-sprite.webp",
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

/** Web public paths for each logo-sprite cell (lossless crops). */
export const LOGO_FRAME_URLS: Record<PotatoSpriteFrame, string> = {
  idle: "/logo-idle.webp",
  cheer: "/logo-cheer.webp",
  /** Same bored crop as lobby snore body. */
  bored: "/logo-snore.webp",
};

/**
 * Master sheet geometry for `medals-sprite`. Runtime uses `MEDALS_FRAME_URLS`.
 * Mirror rects in `assets/medals-sprite.json`.
 */
export const MEDALS_SPRITE_SHEET = {
  asset: "medals-sprite.webp",
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

export const MEDALS_FRAME_URLS: Record<MedalsCategoryFrame, string> = {
  bigPicture: "/medals-big-picture.webp",
  personalBests: "/medals-personal-bests.webp",
  lengthHauls: "/medals-length-hauls.webp",
  survival: "/medals-survival.webp",
};

/** Standalone brand marks (PixelLab one-offs, not atlas crops). */
export const LOGO_MARK_URLS = {
  chill: "/logo.webp",
  celebrate: "/logo-celebrate.webp",
  options: "/logo-options.webp",
  /** Empty haul / better luck next time — sheepish shrug. */
  consolation: "/logo-consolation.webp",
  /**
   * About hello wave — purpose-built PixelLab mark (`logo-wave.png`).
   * Until that PNG ships, `PotatoWaveSvg` falls back to cheer crop.
   */
  wave: "/logo-wave.webp",
  /** Optional face+sprout crop — chrome uses full chill `Logo`, not this. */
  mark: "/logo-mark.webp",
} as const;
