/**
 * Lobby brand mascot: continuous snore over a cropped bored frame
 * (`/logo-snore.webp` — single cell from logo-sprite, not the full sheet).
 */
import { LOGO_FRAME_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark";

export type PotatoSnoreSvgProps = {
  size?: number;
  className?: string;
};

export function PotatoSnoreSvg({ size = 72, className = "" }: PotatoSnoreSvgProps) {
  return (
    <PotatoMark
      src={LOGO_FRAME_URLS.bored}
      alt="Couch Potato snoring"
      size={size}
      className={`cp-potato-snore ${className}`.trim()}
      bodyClassName="cp-potato-snore-body"
      fetchPriority="high"
    >
      <svg
        className="cp-potato-snore-zzz-layer cp-potato-mark-overlay"
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
    </PotatoMark>
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
