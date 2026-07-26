import { Logo } from "./Logo";
import type { MedalsCategoryFrame } from "./spriteAtlas";

export type MedalsCategorySpriteProps = {
  frame: MedalsCategoryFrame;
  size?: number;
  className?: string;
};

/** Native fallback — medals atlas is web CSS-sprite only. */
export function MedalsCategorySprite({
  size = 48,
  className,
}: MedalsCategorySpriteProps) {
  return <Logo size={size} className={className} />;
}
