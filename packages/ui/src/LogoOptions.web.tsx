import type { ImgHTMLAttributes } from "react";

export type LogoOptionsProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "width" | "height"
> & {
  size?: number;
};

/**
 * Options header mascot (web) — potato on couch holding a gear.
 * Plain `<img>` + pixelated scale; art in `/logo-options.png`.
 */
export function LogoOptions({ size = 96, style, className = "", ...rest }: LogoOptionsProps) {
  return (
    <img
      src="/logo-options.png"
      alt="Couch Potato adjusting options"
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
