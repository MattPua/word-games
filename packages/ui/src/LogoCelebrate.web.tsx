/**
 * Results celebrate mark (web) — raster body + SVG pixel sparkles.
 */
import type { CSSProperties } from "react";
import { LOGO_MARK_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark.web";

export type LogoCelebrateProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function LogoCelebrate({ size = 96, style, className = "" }: LogoCelebrateProps) {
  return (
    <PotatoMark
      src={LOGO_MARK_URLS.celebrate}
      alt="Couch Potato celebrating"
      size={size}
      className={`cp-potato-celebrate ${className}`.trim()}
      bodyClassName="cp-potato-celebrate-body"
      style={style}
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
        <g className="cp-potato-sparkle cp-potato-sparkle-1" transform="translate(8 10)">
          <PixelSparkle size={6} />
        </g>
        <g className="cp-potato-sparkle cp-potato-sparkle-2" transform="translate(58 14)">
          <PixelSparkle size={5} />
        </g>
        <g className="cp-potato-sparkle cp-potato-sparkle-3" transform="translate(52 48)">
          <PixelSparkle size={4} />
        </g>
      </svg>
    </PotatoMark>
  );
}

function PixelSparkle({ size }: { size: number }) {
  const s = size / 5;
  return (
    <g fill="#c4a574">
      <rect x={2 * s} y={0} width={s} height={5 * s} />
      <rect x={0} y={2 * s} width={5 * s} height={s} />
    </g>
  );
}
