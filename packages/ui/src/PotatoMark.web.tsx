import type { CSSProperties, ReactNode } from "react";

export type PotatoMarkProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  bodyClassName?: string;
  /** Optional SVG overlay (sparkles, Zzz, gear). */
  children?: ReactNode;
  style?: CSSProperties;
  onPointerDown?: () => void;
  /** Decorative (section icons) — hide from AT. */
  decorative?: boolean;
};

/**
 * Shared web mascot shell: raster PixelLab body + optional SVG motion layer.
 * Do not redraw the potato as paths — keep brand art lossless WebP.
 */
export function PotatoMark({
  src,
  alt,
  size = 96,
  className = "",
  bodyClassName = "",
  children,
  style,
  onPointerDown,
  decorative = false,
}: PotatoMarkProps) {
  return (
    <div
      role="img"
      aria-label={decorative ? undefined : alt}
      aria-hidden={decorative || undefined}
      className={`cp-potato-mark ${className}`.trim()}
      style={{ width: size, height: size, ...style }}
      onPointerDown={onPointerDown}
    >
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable={false}
        className={`cp-potato-mark-body ${bodyClassName}`.trim()}
        style={{ width: size, height: size }}
      />
      {children}
    </div>
  );
}
