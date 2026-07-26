/**
 * Couch medals category mark — cropped cell WebP in the SVG-mark shell.
 */
import { MEDALS_FRAME_URLS, type MedalsCategoryFrame } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark.web";

export type MedalsCategorySpriteProps = {
  frame: MedalsCategoryFrame;
  size?: number;
  className?: string;
};

export function MedalsCategorySprite({
  frame,
  size = 48,
  className = "",
}: MedalsCategorySpriteProps) {
  return (
    <PotatoMark
      src={MEDALS_FRAME_URLS[frame]}
      alt=""
      size={size}
      className={`cp-potato-medals ${className}`.trim()}
      decorative
    />
  );
}
