/**
 * Experimental continuous snore — layered SVG (not the PixelLab atlas).
 * Does not replace `PotatoSprite` / logo assets. Web-only animation; native
 * falls back to a static sleepy pose via `PotatoSprite frame="bored"`.
 */
import { PotatoSprite } from "./PotatoSprite";

export type PotatoSnoreSvgProps = {
  size?: number;
  className?: string;
};

export function PotatoSnoreSvg({ size = 72, className = "" }: PotatoSnoreSvgProps) {
  return <PotatoSprite frame="bored" size={size} className={className} />;
}
