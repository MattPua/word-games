/**
 * Atlas poses as cropped WebPs + optional SVG life — no full-sheet fetch.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { PotatoSnoreSvg } from "./PotatoSnoreSvg";
import { LOGO_FRAME_URLS, type PotatoSpriteFrame } from "./spriteAtlas";
import { PotatoMark } from "./PotatoMark.web";

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const nudgeRef = useRef<ReturnType<typeof setTimeout>>();

  const poke = useCallback(() => {
    setPoked(true);
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setPoked(false), 550);
  }, []);

  useEffect(() => {
    if (frame != null || lobbyYawn) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const loop = () => {
      nudgeRef.current = setTimeout(() => {
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
  }, [frame, lobbyYawn]);

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
        decoding="async"
        draggable={false}
        className="cp-potato-mark-body cp-potato-poke-idle"
        style={{ width: size, height: size }}
      />
      <img
        src={LOGO_FRAME_URLS.cheer}
        alt=""
        width={size}
        height={size}
        decoding="async"
        draggable={false}
        className="cp-potato-mark-body cp-potato-poke-cheer"
        style={{ width: size, height: size }}
      />
    </div>
  );
}
