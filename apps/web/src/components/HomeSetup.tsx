import type { LucideIcon } from "lucide-react";
import {
  Droplets,
  Eye,
  Music,
  Music2,
  Smile,
  Type,
  Volume2,
  VolumeX,
  Warmth,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { IconTooltip } from "@/components/ui/tooltip";
import { SegmentGroup } from "@/components/SegmentGroup";

type Mode = "target" | "timed";
type Topology = "square" | "hex";
type Difficulty = "easy" | "medium" | "hard";
type Grid = 4 | 5 | 6;
type MinLen = 3 | 4 | 5;
type Duration = 30 | 60 | 90 | 120;

export type HomeSetupProps = {
  mode: Mode;
  grid: Grid;
  topology: Topology;
  minWordLength: MinLen;
  difficulty: Difficulty;
  duration: Duration;
  showWordsLeft: boolean;
  onMode: (v: Mode) => void;
  onGrid: (v: Grid) => void;
  onTopology: (v: Topology) => void;
  onMinWordLength: (v: MinLen) => void;
  onDifficulty: (v: Difficulty) => void;
  onDuration: (v: Duration) => void;
  onShowWordsLeft: (v: boolean) => void;
};

function SquareMini({ n }: { n: number }) {
  const cells = Array.from({ length: n * n }, (_, i) => i);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-10 w-10" aria-hidden>
      {cells.map((i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        return (
          <rect
            key={i}
            x={c + 0.12}
            y={r + 0.12}
            width={0.76}
            height={0.76}
            rx={0.14}
            fill="currentColor"
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}

/** Odd-r packing centers — denser as `n` grows (fixed SVG box → size reads). */
function oddRPack(n: number) {
  const w = 1.05;
  const h = 0.92;
  const pts: { cx: number; cy: number; key: string }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const odd = r % 2 === 1;
      pts.push({
        key: `${r}-${c}`,
        cx: c * w + (odd ? w / 2 : 0) + 0.55,
        cy: r * h + 0.5,
      });
    }
  }
  return {
    pts,
    vbW: n * w + w / 2 + 0.2,
    vbH: n * h + 0.35,
  };
}

function hexPoints(cx: number, cy: number) {
  const r = 0.38;
  return [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const a = ((60 * i - 30) * Math.PI) / 180;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    })
    .join(" ");
}

function HexMini({ n }: { n: number }) {
  const { pts, vbW, vbH } = oddRPack(n);
  return (
    <svg viewBox={`0 0 ${vbW} ${vbH}`} className="h-10 w-10" aria-hidden>
      {pts.map((p) => (
        <polygon key={p.key} points={hexPoints(p.cx, p.cy)} fill="currentColor" opacity={0.85} />
      ))}
    </svg>
  );
}

function TargetGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
      <circle
        cx="20"
        cy="20"
        r="15"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.35"
      />
      <circle
        cx="20"
        cy="20"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        opacity="0.55"
      />
      <circle cx="20" cy="20" r="3.5" fill="currentColor" />
    </svg>
  );
}

function TimedGlyph() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
      <circle cx="20" cy="22" r="13" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 7h8M20 7v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M20 22v-7M20 22l6 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const DIFFICULTY: {
  value: Difficulty;
  label: string;
  hint: string;
}[] = [
  { value: "easy", label: "Easy", hint: "Soft couch" },
  { value: "medium", label: "Medium", hint: "Warm seat" },
  { value: "hard", label: "Hard", hint: "Spud sweat" },
];

const DURATIONS: Duration[] = [30, 60, 90, 120];

/** Toy lobby setup — cards + mini boards, not labeled form rows. */
export function HomeSetup({
  mode,
  grid,
  topology,
  minWordLength,
  difficulty,
  duration,
  showWordsLeft,
  onMode,
  onGrid,
  onTopology,
  onMinWordLength,
  onDifficulty,
  onDuration,
  onShowWordsLeft,
}: HomeSetupProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Mode — two big choice cards */}
      <div role="group" aria-label="Game mode" className="grid grid-cols-2 gap-2.5">
        {(
          [
            {
              value: "target" as const,
              title: "Goal",
              blurb: "Clear the couch",
              Glyph: TargetGlyph,
            },
            {
              value: "timed" as const,
              title: "Timed",
              blurb: "Beat the clock",
              Glyph: TimedGlyph,
            },
          ] as const
        ).map(({ value, title, blurb, Glyph }) => {
          const active = mode === value;
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onMode(value)}
              className={cn(
                "cp-lobby-card group flex flex-col items-start gap-2 p-3.5 text-left",
                active && "cp-lobby-card-active cp-select-pop",
              )}
            >
              <span
                className={cn(
                  "text-muted-foreground transition-colors",
                  active && "text-secondary",
                )}
              >
                <Glyph />
              </span>
              <span className="font-display text-lg font-bold leading-none text-foreground">
                {title}
              </span>
              <span className="font-body text-xs leading-snug text-muted-foreground">{blurb}</span>
            </button>
          );
        })}
      </div>

      {/* Board — grid size tiles + shape icons */}
      <section aria-label="Board" className="cp-lobby-panel">
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-display text-base font-bold text-foreground">Your board</h2>
          <p className="font-body text-xs text-muted-foreground">
            {grid}×{grid} · {topology === "square" ? "Square" : "B-comb"}
          </p>
        </div>

        <div role="group" aria-label="Grid size" className="mb-3 grid grid-cols-3 gap-2">
          {([4, 5, 6] as const).map((n) => {
            const active = grid === n;
            return (
              <button
                key={n}
                type="button"
                aria-pressed={active}
                aria-label={`${n} by ${n}`}
                onClick={() => onGrid(n)}
                className={cn(
                  "cp-lobby-tile flex flex-col items-center gap-1.5 py-3",
                  active && "cp-lobby-tile-active cp-select-pop",
                )}
              >
                <span
                  className={cn(
                    "text-muted-foreground transition-colors",
                    active && "text-foreground",
                  )}
                >
                  {topology === "square" ? <SquareMini n={n} /> : <HexMini n={n} />}
                </span>
                <span className="font-display text-sm font-bold tabular-nums">
                  {n}×{n}
                </span>
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Shape" className="grid grid-cols-2 gap-2">
          {(
            [
              {
                value: "square" as const,
                label: "Square",
                Icon: () => <SquareMini n={3} />,
              },
              {
                value: "hex" as const,
                label: "B-comb",
                Icon: () => <HexMini n={3} />,
              },
            ] as const
          ).map(({ value, label, Icon }) => {
            const active = topology === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => onTopology(value)}
                className={cn(
                  "cp-lobby-chip flex items-center justify-center gap-2 py-2.5",
                  active && "cp-lobby-chip-active cp-select-pop",
                )}
              >
                <span className={cn("scale-75 text-muted-foreground", active && "text-foreground")}>
                  <Icon />
                </span>
                <span className="font-display text-sm font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Challenge — difficulty or duration */}
      <section
        key={mode}
        aria-label={mode === "target" ? "Challenge" : "Sprint"}
        className="cp-lobby-panel cp-option-swap"
      >
        <div className="mb-3 flex items-end justify-between gap-2">
          <h2 className="font-display text-base font-bold text-foreground">
            {mode === "target" ? "How hard?" : "How long?"}
          </h2>
          {mode === "timed" ? (
            <p className="font-body text-xs text-muted-foreground">{duration}s sprint</p>
          ) : null}
        </div>

        {mode === "target" ? (
          <div role="group" aria-label="Challenge" className="grid grid-cols-3 gap-2">
            {DIFFICULTY.map(({ value, label, hint }) => {
              const active = difficulty === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${label}: ${hint}`}
                  onClick={() => onDifficulty(value)}
                  className={cn(
                    "cp-lobby-challenge flex flex-col items-center gap-0.5 px-1 py-3",
                    active && "cp-lobby-challenge-active cp-select-pop",
                    active && value === "hard" && "cp-lobby-challenge-hard",
                  )}
                >
                  <span className="font-display text-sm font-bold">{label}</span>
                  <span className="font-body text-[0.65rem] leading-tight text-muted-foreground">
                    {hint}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div role="group" aria-label="Sprint length" className="grid grid-cols-4 gap-2">
            {DURATIONS.map((s) => {
              const active = duration === s;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onDuration(s)}
                  className={cn(
                    "cp-lobby-challenge py-3 font-display text-sm font-bold tabular-nums",
                    active && "cp-lobby-challenge-active cp-select-pop",
                  )}
                >
                  {s}s
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Secondary — word length collapsed */}
      <details className="cp-lobby-more group">
        <summary className="cp-lobby-more-summary">
          <span className="font-display text-sm font-bold text-foreground">Word length</span>
          <span className="font-body text-xs text-muted-foreground">{minWordLength}+ letters</span>
        </summary>
        <div className="pt-3">
          <SegmentGroup
            value={minWordLength}
            onChange={onMinWordLength}
            options={[
              { value: 3, label: "3+" },
              { value: 4, label: "4+" },
              { value: 5, label: "5+" },
            ]}
            className="mb-0"
          />
        </div>
      </details>

      {/* Scout — words-left HUD (discovery default = off) */}
      <details className="cp-lobby-more group">
        <summary className="cp-lobby-more-summary">
          <span className="font-display text-sm font-bold text-foreground">Scout</span>
          <span className="font-body text-xs text-muted-foreground">
            {showWordsLeft ? "Words left on" : "Words left off"}
          </span>
        </summary>
        <div className="pt-3">
          <button
            type="button"
            role="switch"
            aria-checked={showWordsLeft}
            aria-label={
              showWordsLeft ? "Hide words left on the run HUD" : "Show words left on the run HUD"
            }
            onClick={() => onShowWordsLeft(!showWordsLeft)}
            className={cn(
              "cp-lobby-chip flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left",
              showWordsLeft && "cp-lobby-chip-active cp-select-pop",
            )}
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-display text-sm font-bold text-foreground">Words left</span>
              <span className="font-body text-[0.65rem] leading-snug text-muted-foreground">
                How many unfound words are still on the board
              </span>
            </span>
            <span
              className={cn(
                "font-display text-xs font-bold tabular-nums",
                showWordsLeft ? "text-secondary-foreground" : "text-muted-foreground",
              )}
            >
              {showWordsLeft ? "On" : "Off"}
            </span>
          </button>
        </div>
      </details>
    </div>
  );
}

export function HomePlayBar({
  onPlay,
  sound,
  onToggleSound,
  menuMusic,
  onToggleMenuMusic,
}: {
  onPlay: () => void;
  sound: boolean;
  onToggleSound: () => void;
  menuMusic: boolean;
  onToggleMenuMusic: () => void;
}) {
  const soundLabel = sound ? "Mute SFX" : "Unmute SFX";
  const jamLabel = menuMusic ? "Mute lobby jam" : "Lobby jam on";
  return (
    <div
      className="cp-lobby-play shrink-0 -mx-4 border-t border-border/40 bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-4 pt-3 backdrop-blur-sm"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="flex items-center gap-2">
        <Button size="lg" className="flex-1 text-lg" onClick={onPlay}>
          Play
        </Button>
        <IconTooltip label={jamLabel}>
          <Button
            variant="secondary"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-pressed={menuMusic}
            aria-label={jamLabel}
            onClick={onToggleMenuMusic}
          >
            {menuMusic ? <Music2 /> : <Music className="opacity-50" />}
          </Button>
        </IconTooltip>
        <IconTooltip label={soundLabel}>
          <Button
            variant="secondary"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-pressed={sound}
            aria-label={soundLabel}
            onClick={onToggleSound}
          >
            {sound ? <Volume2 /> : <VolumeX />}
          </Button>
        </IconTooltip>
      </div>
    </div>
  );
}
