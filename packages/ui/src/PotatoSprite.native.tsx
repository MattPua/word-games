import { Logo } from "./Logo";
import { LogoCelebrate } from "./LogoCelebrate";
import type { PotatoSpriteFrame } from "./spriteAtlas";

export type PotatoSpriteProps = {
  size?: number;
  className?: string;
  frame?: PotatoSpriteFrame;
  /** Web-only lobby yawn — ignored on native (static Logo). */
  lobbyYawn?: boolean;
};

/** Native fallback — sprite-atlas CSS is web-only; render the matching static mascot. */
export function PotatoSprite({ size = 112, className, frame }: PotatoSpriteProps) {
  return frame === "cheer" ? (
    <LogoCelebrate size={size} className={className} />
  ) : (
    <Logo size={size} className={className} />
  );
}
