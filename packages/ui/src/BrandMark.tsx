/**
 * Compact face+sprout crop from chill `logo` — kept as an asset/export but
 * **not** used for chrome. Chrome uses full `Logo` in `ChromeTopBar`.
 * Prefer regenerating a purpose-built mark over shipping this crop if needed later.
 */
import type { CSSProperties } from "react";
import { LOGO_MARK_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark";

export type BrandMarkProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function BrandMark({ size = 40, style, className = "" }: BrandMarkProps) {
  return (
    <PotatoMark
      src={LOGO_MARK_URLS.mark}
      alt="Couch Potato"
      size={size}
      className={className}
      style={style}
      fetchPriority="high"
    />
  );
}
