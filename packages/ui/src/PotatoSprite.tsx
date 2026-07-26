/**
 * Atlas poses as cropped WebPs + optional SVG life — no full-sheet fetch.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { PotatoSnoreSvg } from "./PotatoSnoreSvg";
import { LOGO_FRAME_URLS, type PotatoSpriteFrame } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark";

export type PotatoSpriteProps = {
  size?: number;
  className?: string;
  /**
   * Force a specific cropped pose (e.g. EmptyState `bored`). Static — no idle
   * bob or hover/tap reaction. Results uses standalone `LogoCelebrate` / `Logo`.
   * Omit for interactive idle↔cheer poke (404).
   */
  frame?: PotatoSpriteFrame;
  /**
   * Lobby brand snore — delegates to `PotatoSnoreSvg` (bored crop + SVG Zzz).
   * Ignored when `frame` is pinned.
   */
  lobbyYawn?: boolean;
};

export function PotatoSprite({
  size = 112,
  className = "",
  frame,
  lobbyYawn = false,
}: PotatoSpriteProps) {
  const [poked, setPoked] = useState(false);
  const [nudgeCheer, setNudgeCheer] = useState(false);
  /** Cheer WebP — deferred until idle paints or first poke/nudge (not cold path). */
  const [cheerSrc, setCheerSrc] = useState<string | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const nudgeRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const warmCheer = useCallback(() => {
    setCheerSrc((prev) => prev ?? LOGO_FRAME_URLS.cheer);
  }, []);

  const poke = useCallback(() => {
    warmCheer();
    setPoked(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPoked(false), 550);
  }, [warmCheer]);

  useEffect(() => {
    if (frame != null || lobbyYawn) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const loop = () => {
      nudgeRef.current = setTimeout(() => {
        warmCheer();
        setNudgeCheer(true);
        nudgeRef.current = setTimeout(() => {
          setNudgeCheer(false);
          loop();
        }, 700);
      }, 6200);
    };
    loop();
    return () => {
      clearTimeout(nudgeRef.current);
      clearTimeout(timeoutRef.current);
    };
  }, [frame, lobbyYawn, warmCheer]);

  if (frame == null && lobbyYawn) {
    return <PotatoSnoreSvg size={size} className={className} />;
  }

  if (frame != null) {
    return (
      <PotatoMark
        src={LOGO_FRAME_URLS[frame]}
        alt="Couch Potato"
        size={size}
        className={className}
      />
    );
  }

  const showCheer = poked || nudgeCheer;

  return (
    <div
      role="img"
      aria-label="Couch Potato"
      className={`cp-potato-mark cp-potato-sprite-interactive ${poked ? "is-poked" : ""} ${showCheer ? "is-cheer" : ""} ${className}`.trim()}
      style={{ width: size, height: size }}
      onPointerDown={poke}
    >
      <img
        src={LOGO_FRAME_URLS.idle}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        draggable={false}
        className="cp-potato-mark-body cp-potato-poke-idle"
        style={{ width: size, height: size }}
        onLoad={warmCheer}
      />
      {cheerSrc ? (
        <img
          src={cheerSrc}
          alt=""
          width={size}
          height={size}
          decoding="async"
          fetchPriority="low"
          draggable={false}
          className="cp-potato-mark-body cp-potato-poke-cheer"
          style={{ width: size, height: size }}
        />
      ) : null}
    </div>
  );
}
