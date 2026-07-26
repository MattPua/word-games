/**
 * How-to “ready” mascot (native): static cheer — go motion is web-only.
 */
import { LogoCelebrate } from "./LogoCelebrate";

export type PotatoGoSvgProps = {
  size?: number;
  className?: string;
};

export function PotatoGoSvg({ size = 72, className = "" }: PotatoGoSvgProps) {
  return <LogoCelebrate size={size} className={className} />;
}
