import type { ImgHTMLAttributes } from "react";

export type LogoCelebrateProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height"
> & {
  size?: number;
};

/**
 * Results celebrate mark (web) — arms-up potato + letter-tile confetti.
 * Plain `<img>` + pixelated scale; art in `/logo-celebrate.webp` (from
 * `packages/ui/src/assets/logo-celebrate.png` via `optimize-sprites`). Same DOM contract as `Logo.web`.
 */
export function LogoCelebrate({ size = 96, style, className = "", ...rest }: LogoCelebrateProps) {
  return (
    <img
      src="/logo-celebrate.webp"
      alt="Couch Potato celebrating"
      width={size}
      height={size}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: "contain",
        imageRendering: "pixelated",
        ...style,
      }}
      {...rest}
    />
  );
}
