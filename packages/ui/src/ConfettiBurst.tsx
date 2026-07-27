import { useEffect, useRef } from "react";

const COLORS = ["#859075", "#d8b05b", "#f8f7f4", "#b5c5a0", "#ad804b", "#5f9e6e"];

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  life: number;
};

export type ConfettiBurstProps = {
  active: boolean;
  durationMs?: number;
  /** Particle count (default 48; use ~16–20 for micro nab sparks). */
  count?: number;
  className?: string;
};

/** Lightweight brand-colored confetti — sage, potato gold, cream. */
export function ConfettiBurst({
  active,
  durationMs = 1400,
  count = 48,
  className = "",
}: ConfettiBurstProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const w = () => canvas.clientWidth;
    const h = () => canvas.clientHeight;
    const n = Math.max(1, Math.floor(count));
    const micro = n <= 24;
    const particles: Particle[] = [];
    for (let i = 0; i < n; i++) {
      particles.push({
        x: w() * 0.5 + (Math.random() - 0.5) * w() * (micro ? 0.22 : 0.35),
        y: h() * (micro ? 0.42 : 0.28) + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * (micro ? 5.5 : 9),
        vy: -(micro ? 2.5 : 4) - Math.random() * (micro ? 4 : 7),
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * (micro ? 0.28 : 0.35),
        w: (micro ? 3 : 5) + Math.random() * (micro ? 4 : 6),
        h: (micro ? 2 : 3) + Math.random() * (micro ? 3 : 4),
        color: COLORS[i % COLORS.length]!,
        life: 1,
      });
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / durationMs;
      ctx.clearRect(0, 0, w(), h());
      for (const p of particles) {
        p.vy += micro ? 0.18 : 0.22;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - t);
        ctx.save();
        ctx.globalAlpha = p.life * 0.9;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, durationMs, count]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-50 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
