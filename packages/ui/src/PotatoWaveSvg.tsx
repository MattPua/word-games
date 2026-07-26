/**
 * About / hello mark — cheer crop + soft rock/sparkles until PixelLab
 * `logo-wave.png` ships (then point `src` at `LOGO_MARK_URLS.wave`).
 * Never glue an SVG hand on the body.
 */
import { LOGO_FRAME_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark";

export type PotatoWaveSvgProps = {
  size?: number;
  className?: string;
};

export function PotatoWaveSvg({ size = 72, className = "" }: PotatoWaveSvgProps) {
  return (
    <PotatoMark
      src={LOGO_FRAME_URLS.cheer}
      alt="Couch Potato waving hello"
      size={size}
      className={`cp-potato-wave ${className}`.trim()}
      bodyClassName="cp-potato-wave-body"
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
        <g className="cp-potato-wave-spark cp-potato-wave-spark-1" transform="translate(8 14)">
          <PixelSpark size={5} />
        </g>
        <g className="cp-potato-wave-spark cp-potato-wave-spark-2" transform="translate(58 8)">
          <PixelSpark size={4} />
        </g>
        <g className="cp-potato-wave-spark cp-potato-wave-spark-3" transform="translate(14 48)">
          <PixelSpark size={3} />
        </g>
      </svg>
    </PotatoMark>
  );
}

function PixelSpark({ size }: { size: number }) {
  const s = size / 5;
  return (
    <g fill="#c4a574">
      <rect x={2 * s} y={0} width={s} height={5 * s} />
      <rect x={0} y={2 * s} width={5 * s} height={s} />
    </g>
  );
}
