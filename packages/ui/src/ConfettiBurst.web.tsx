import { useEffect, useRef } from "react";

const COLORS = ["#7c9082", "#e4b574", "#f8f7f4", "#a8c5a8", "#c9924a", "#5f9e6e"];

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
  className?: string;
};

/** Lightweight brand-colored confetti — sage, potato gold, cream. */
export function ConfettiBurst({
  active,
  durationMs = 1400,
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
    const particles: Particle[] = [];
    for (let i = 0; i < 48; i++) {
      particles.push({
        x: w() * 0.5 + (Math.random() - 0.5) * w() * 0.35,
        y: h() * 0.28 + (Math.random() - 0.5) * 40,
        vx: (Math.random() - 0.5) * 9,
        vy: -4 - Math.random() * 7,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.35,
        w: 5 + Math.random() * 6,
        h: 3 + Math.random() * 4,
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
        p.vy += 0.22;
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
  }, [active, durationMs]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-50 h-full w-full ${className}`}
      aria-hidden
    />
  );
}
