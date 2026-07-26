/**
 * Chill brand mark (web) — raster `/logo.webp` in the shared SVG-mark shell.
 */
import type { CSSProperties } from "react";
import { LOGO_MARK_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark";

export type LogoProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function Logo({ size = 96, style, className = "" }: LogoProps) {
  return (
    <PotatoMark
      src={LOGO_MARK_URLS.chill}
      alt="Couch Potato"
      size={size}
      className={className}
      style={style}
    />
  );
}
