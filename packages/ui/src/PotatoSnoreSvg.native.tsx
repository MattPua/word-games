/**
 * Lobby brand mascot (native): static bored atlas frame — continuous snore
 * motion is web-only (default `PotatoSnoreSvg.tsx`).
 */
import { PotatoSprite } from "./PotatoSprite";

export type PotatoSnoreSvgProps = {
  size?: number;
  className?: string;
};

export function PotatoSnoreSvg({ size = 72, className = "" }: PotatoSnoreSvgProps) {
  return <PotatoSprite frame="bored" size={size} className={className} />;
}
