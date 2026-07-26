/**
 * About / hello mascot (native): static cheer — wave motion is web-only.
 */
import { LogoCelebrate } from "./LogoCelebrate";

export type PotatoWaveSvgProps = {
  size?: number;
  className?: string;
};

export function PotatoWaveSvg({ size = 72, className = "" }: PotatoWaveSvgProps) {
  return <LogoCelebrate size={size} className={className} />;
}
