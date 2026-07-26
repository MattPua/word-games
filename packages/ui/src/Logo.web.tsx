import type { ImgHTMLAttributes } from "react";

export type LogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt" | "width" | "height"> & {
  size?: number;
};

/**
 * Pixel potato-on-couch mark (web). Plain `<img>` so lobby chrome stays off
 * react-native-web — see AGENTS.md Brand.
 */
export function Logo({ size = 96, style, className = "", ...rest }: LogoProps) {
  return (
    <img
      src="/logo.webp"
      alt="Couch Potato"
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
