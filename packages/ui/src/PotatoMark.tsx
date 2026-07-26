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
  /**
   * LCP hero marks (lobby chill `Logo`) → `"high"` (eager).
   * Everything else defaults to lazy + low priority.
   */
  fetchPriority?: "high" | "low" | "auto";
};

/**
 * Shared web mascot shell: raster PixelLab body + optional SVG motion layer.
 * Do not redraw the potato as paths — keep brand art lossless WebP.
 * Non-hero marks use `loading="lazy"` so cold path doesn’t race LCP.
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
  fetchPriority,
}: PotatoMarkProps) {
  const hero = fetchPriority === "high";
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
        loading={hero ? "eager" : "lazy"}
        decoding={hero ? "sync" : "async"}
        fetchPriority={fetchPriority ?? (hero ? "high" : "low")}
        draggable={false}
        className={`cp-potato-mark-body ${bodyClassName}`.trim()}
        style={{ width: size, height: size }}
      />
      {children}
    </div>
  );
}
