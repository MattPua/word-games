/**
 * Options header mascot (web) — gear-in-hand raster + SVG gear twirl.
 */
import type { CSSProperties } from "react";
import { LOGO_MARK_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark.web";

export type LogoOptionsProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function LogoOptions({ size = 96, style, className = "" }: LogoOptionsProps) {
  return (
    <PotatoMark
      src={LOGO_MARK_URLS.options}
      alt="Couch Potato adjusting options"
      size={size}
      className={`cp-potato-options ${className}`.trim()}
      bodyClassName="cp-potato-options-body"
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
        <g className="cp-potato-gear" transform="translate(54 8)">
          <g transform="translate(6 6)">
            <PixelGear />
          </g>
        </g>
      </svg>
    </PotatoMark>
  );
}

/** Tiny block gear — motion only; body art already holds a gear. */
function PixelGear() {
  return (
    <g fill="#859075" transform="translate(-6 -6)">
      <rect x={4} y={0} width={4} height={2} />
      <rect x={4} y={10} width={4} height={2} />
      <rect x={0} y={4} width={2} height={4} />
      <rect x={10} y={4} width={2} height={4} />
      <rect x={2} y={2} width={8} height={8} />
      <rect x={4} y={4} width={4} height={4} fill="#f3efe4" />
    </g>
  );
}
