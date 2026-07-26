/**
 * How-to done / “let’s go” mark — cheer crop + SVG play nudge.
 * Encourages the lobby → Play loop (not snore / chill).
 */
import type { PotatoGoSvgProps } from "./PotatoGoSvg";
import { LOGO_FRAME_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark.web";

export type { PotatoGoSvgProps };

export function PotatoGoSvg({ size = 72, className = "" }: PotatoGoSvgProps) {
  return (
    <PotatoMark
      src={LOGO_FRAME_URLS.cheer}
      alt="Couch Potato ready to play"
      size={size}
      className={`cp-potato-go ${className}`.trim()}
      bodyClassName="cp-potato-go-body"
    >
      <svg
        className="cp-potato-mark-overlay"
        viewBox="0 0 72 72"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        overflow="visible"
      >
        {/* Pixel play chevron — “hit Play” cue */}
        <g className="cp-potato-go-play" transform="translate(52 28)">
          <PixelPlay />
        </g>
        <g className="cp-potato-go-spark cp-potato-go-spark-1" transform="translate(6 12)">
          <PixelSpark size={5} />
        </g>
        <g className="cp-potato-go-spark cp-potato-go-spark-2" transform="translate(58 8)">
          <PixelSpark size={4} />
        </g>
      </svg>
    </PotatoMark>
  );
}

function PixelPlay() {
  return (
    <g fill="#c4a574">
      <rect x={0} y={0} width={3} height={14} />
      <rect x={3} y={2} width={3} height={10} />
      <rect x={6} y={4} width={3} height={6} />
      <rect x={9} y={5} width={3} height={4} />
    </g>
  );
}

function PixelSpark({ size }: { size: number }) {
  const s = size / 5;
  return (
    <g fill="#859075">
      <rect x={2 * s} y={0} width={s} height={5 * s} />
      <rect x={0} y={2 * s} width={5 * s} height={s} />
    </g>
  );
}
