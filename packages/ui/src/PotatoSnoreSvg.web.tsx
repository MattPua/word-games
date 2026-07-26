/**
 * Experimental lobby mascot: continuous snore over the real PixelLab bored
 * frame. Same CSS atlas crop as `PotatoSprite` (pixel-identical), plus SVG
 * breath + pixel Zzz — not a hand redraw, assets untouched.
 */
import type { CSSProperties } from "react";
import { LOGO_SPRITE_FRAMES, LOGO_SPRITE_SHEET } from "./spriteAtlas";
import type { PotatoSnoreSvgProps } from "./PotatoSnoreSvg";

export type { PotatoSnoreSvgProps };

const BORED = LOGO_SPRITE_FRAMES.bored;
const SHEET = LOGO_SPRITE_SHEET;

function boredOffsetPercent(): number {
  const maxX = SHEET.width - BORED.w;
  return maxX > 0 ? (BORED.x / maxX) * 100 : 0;
}

export function PotatoSnoreSvg({ size = 72, className = "" }: PotatoSnoreSvgProps) {
  const sheetStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundImage: `url(${SHEET.url})`,
    backgroundSize: `${SHEET.cols * 100}% ${SHEET.rows * 100}%`,
    backgroundPositionX: `${boredOffsetPercent()}%`,
  };

  return (
    <div
      role="img"
      aria-label="Couch Potato snoring"
      className={`cp-potato-snore ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      <div className="cp-potato-snore-body cp-potato-snore-sheet" style={sheetStyle} />

      <svg
        className="cp-potato-snore-zzz-layer"
        viewBox="0 0 72 72"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        overflow="visible"
      >
        <g className="cp-potato-snore-zzz" transform="translate(48 6)">
          <g transform="translate(0 14)">
            <g className="cp-potato-snore-z cp-potato-snore-z1">
              <PixelZ size={7} />
            </g>
          </g>
          <g transform="translate(8 7)">
            <g className="cp-potato-snore-z cp-potato-snore-z2">
              <PixelZ size={9} />
            </g>
          </g>
          <g transform="translate(17 0)">
            <g className="cp-potato-snore-z cp-potato-snore-z3">
              <PixelZ size={11} />
            </g>
          </g>
        </g>
      </svg>
    </div>
  );
}

/** Tiny block-letter Z so motion stays on-brand with pixel art. */
function PixelZ({ size }: { size: number }) {
  const s = size / 10;
  return (
    <g fill="#859075">
      <rect x={0} y={0} width={10 * s} height={2 * s} />
      <rect x={7 * s} y={2 * s} width={3 * s} height={2 * s} />
      <rect x={4 * s} y={4 * s} width={3 * s} height={2 * s} />
      <rect x={0} y={6 * s} width={3 * s} height={2 * s} />
      <rect x={0} y={8 * s} width={10 * s} height={2 * s} />
    </g>
  );
}
