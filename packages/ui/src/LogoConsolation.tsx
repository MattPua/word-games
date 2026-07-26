/**
 * Results empty-haul mark (web) — sheepish “better luck next time” shrug.
 */
import type { CSSProperties } from "react";
import { LOGO_MARK_URLS } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark";

export type LogoConsolationProps = {
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function LogoConsolation({ size = 96, style, className = "" }: LogoConsolationProps) {
  return (
    <PotatoMark
      src={LOGO_MARK_URLS.consolation}
      alt="Couch Potato shrugging"
      size={size}
      className={className}
      style={style}
    />
  );
}
