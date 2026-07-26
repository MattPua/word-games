import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  ALargeSmall,
  CirclePlay,
  Droplets,
  Gauge,
  History,
  LayoutGrid,
  Ruler,
  ShieldBan,
  Sofa,
  Sun,
  Timer,
  Type,
  WholeWord,
} from "lucide-react";
import { SURVIVAL_START_SECONDS } from "@couch-potato/game-engine";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/tooltip";
import { WordBanInput } from "@/components/WordBanInput";
import { ModeGlyph } from "../modeGlyph";

type Mode = "target" | "timed" | "survival";
type Topology = "square" | "hex";
type Difficulty = "easy" | "medium" | "hard";
type Grid = 4 | 5 | 6;
type MinLen = 3 | 4 | 5;
type Duration = 30 | 60 | 90 | 120;

const MIN_LENGTH: { value: MinLen; label: string; hint: string; Icon: LucideIcon }[] = [
  { value: 3, label: "3+", hint: "Short words count", Icon: Type },
  { value: 4, label: "4+", hint: "Medium words only", Icon: WholeWord },
  { value: 5, label: "5+", hint: "Longer words only", Icon: ALargeSmall },
];

export type HomeSetupProps = {
  mode: Mode;
  grid: Grid;
  topology: Topology;
  minWordLength: MinLen;
  difficulty: Difficulty;
  duration: Duration;
  blockedWords: string[];
  onMode: (v: Mode) => void;
  onGrid: (v: Grid) => void;
  onTopology: (v: Topology) => void;
  onMinWordLength: (v: MinLen) => void;
  onDifficulty: (v: Difficulty) => void;
  onDuration: (v: Duration) => void;
  onBlockedWords: (v: string[]) => void;
  /** Quiet background-music nudge — lives under Customize, never above primary setup. */
  jamInvite?: ReactNode;
};

/** Growth rings vs 4×4 base: outer (newest) = potato gold, mid = soft sage accent. */
const SIZE_BASE = 4;

function sizeCellFill(
  r: number,
  c: number,
  n: number,
): { fill: string; opacity: number } {
  const ring = Math.max(r, c);
  if (ring < SIZE_BASE) return { fill: "currentColor", opacity: 0.85 };
  // Outermost ring of this size is the “extra” highlight (5×5 and 6×6).
  if (ring === n - 1) return { fill: "var(--secondary)", opacity: 1 };
  return { fill: "var(--accent)", opacity: 1 };
}

function SquareMini({ n }: { n: number }) {
  const cells = Array.from({ length: n * n }, (_, i) => i);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-10 w-10" aria-hidden>
      {cells.map((i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const { fill, opacity } = sizeCellFill(r, c, n);
        return (
          <rect
            key={i}
            x={c + 0.12}
            y={r + 0.12}
            width={0.76}
            height={0.76}
            rx={0.14}
            fill={fill}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

/** Odd-r packing centers: denser as `n` grows (fixed SVG box → size reads). */
function oddRPack(n: number) {
  const w = 1.05;
  const h = 0.92;
  const pts: { cx: number; cy: number; r: number; c: number; key: string }[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const odd = r % 2 === 1;
      pts.push({
        key: `${r}-${c}`,
        r,
        c,
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
      {pts.map((p) => {
        const { fill, opacity } = sizeCellFill(p.r, p.c, n);
        return <polygon key={p.key} points={hexPoints(p.cx, p.cy)} fill={fill} opacity={opacity} />;
      })}
    </svg>
  );
}

const DIFFICULTY: {
  value: Difficulty;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "easy", label: "Easy", Icon: Sofa },
  { value: "medium", label: "Medium", Icon: Sun },
  { value: "hard", label: "Hard", Icon: Droplets },
];

/** Mode-aware: Goal = target size, Timed = letter mix, Survival = clock stinginess. */
function difficultyHint(mode: Mode, value: Difficulty): string {
  if (mode === "target") {
    return (
      {
        easy: "Smaller clear",
        medium: "Bigger clear",
        hard: "Biggest clear",
      } as const
    )[value];
  }
  if (mode === "timed") {
    return (
      {
        easy: "Common letters",
        medium: "Mixed letters",
        hard: "Rarer letters",
      } as const
    )[value];
  }
  return (
    {
      easy: "Longer clock",
      medium: "Steady clock",
      hard: "Shorter clock",
    } as const
  )[value];
}

const DURATIONS: Duration[] = [30, 60, 90, 120];

const LOBBY_SECTION_ICON = "cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground";

function LobbySectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  // Real <h2> — `--font-display` cascades from the global heading rule in index.css.
  return (
    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
      <Icon className={LOBBY_SECTION_ICON} strokeWidth={2.25} aria-hidden />
      {children}
    </h2>
  );
}

/** Toy lobby setup: cards + mini boards, not labeled form rows. */
export function HomeSetup({
  mode,
  grid,
  topology,
  minWordLength,
  difficulty,
  duration,
  blockedWords,
  onMode,
  onGrid,
  onTopology,
  onMinWordLength,
  onDifficulty,
  onDuration,
  onBlockedWords,
  jamInvite,
}: HomeSetupProps) {
  return (
    <div className="cp-lobby-setup flex flex-col gap-5">
      <div className="cp-lobby-columns flex flex-col gap-5">
        {/* Primary: what am I playing (left / first on wide) */}
        <div className="cp-lobby-primary flex flex-col gap-5">
          <div role="group" aria-label="Game mode" className="cp-lobby-choice-row cp-lobby-choice-row-3 gap-2.5">
            {(
              [
                {
                  value: "target" as const,
                  title: "Goal",
                  blurb: "Bring points to zero",
                },
                {
                  value: "timed" as const,
                  title: "Timed",
                  blurb: "Find as many words in the time limit",
                },
                {
                  value: "survival" as const,
                  title: "Survival",
                  blurb: "Every word adds more time",
                },
              ] as const
            ).map(({ value, title, blurb }) => {
              const active = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onMode(value)}
                  className={cn(
                    "cp-lobby-card group flex min-w-0 flex-col items-start gap-2 p-3.5 text-left",
                    active && "cp-lobby-card-active cp-select-pop",
                  )}
                >
                  <span
                    className={cn(
                      "cp-lobby-glyph text-muted-foreground",
                      active && "text-secondary",
                    )}
                  >
                    <ModeGlyph mode={value} />
                  </span>
                  <span className="font-display text-lg font-bold leading-none text-foreground">
                    {title}
                  </span>
                  <span
                    className={cn(
                      "font-body text-xs leading-snug [overflow-wrap:anywhere]",
                      active ? "text-foreground/80" : "text-muted-foreground",
                    )}
                  >
                    {blurb}
                  </span>
                </button>
              );
            })}
          </div>

          <section aria-label="Board" className="cp-lobby-panel">
            <div className="mb-3 flex items-end justify-between gap-2">
              <LobbySectionTitle icon={LayoutGrid}>Your board</LobbySectionTitle>
              <p className="font-body text-xs text-muted-foreground">
                {grid}×{grid} · {topology === "square" ? "Square" : "Honeycomb"}
              </p>
            </div>

            <div
              role="group"
              aria-label="Grid size"
              className="cp-lobby-choice-row cp-lobby-choice-row-3 mb-3 gap-2"
            >
              {([4, 5, 6] as const).map((n) => {
                const active = grid === n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${n}×${n}`}
                    onClick={() => onGrid(n)}
                    className={cn(
                      "cp-lobby-tile flex min-w-0 flex-col items-center gap-1.5 py-3",
                      active && "cp-lobby-tile-active cp-select-pop",
                    )}
                  >
                    <span
                      className={cn(
                        "cp-lobby-glyph text-muted-foreground",
                        active && "text-secondary",
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

            <div role="group" aria-label="Shape" className="cp-lobby-choice-row cp-lobby-choice-row-2 gap-2">
              {(
                [
                  {
                    value: "square" as const,
                    label: "Square",
                    Icon: () => <SquareMini n={3} />,
                  },
                  {
                    value: "hex" as const,
                    label: "Honeycomb",
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
                      "cp-lobby-chip flex min-w-0 items-center justify-center gap-2 py-2.5",
                      active && "cp-lobby-chip-active cp-select-pop",
                    )}
                  >
                    <span
                      className={cn(
                        "cp-lobby-glyph scale-75 shrink-0 text-muted-foreground",
                        active && "text-secondary",
                      )}
                    >
                      <Icon />
                    </span>
                    <span className="min-w-0 truncate font-display text-sm font-bold">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Challenge: How hard? always; Timed also picks How long? */}
          <section
            key={mode}
            aria-label={mode === "timed" ? "Sprint" : "Challenge"}
            className="cp-lobby-panel cp-option-swap"
          >
            <div className="mb-3 flex items-end justify-between gap-2">
              <LobbySectionTitle icon={Gauge}>How hard?</LobbySectionTitle>
              {mode === "survival" ? (
                <p className="font-body text-xs text-muted-foreground">
                  {SURVIVAL_START_SECONDS[difficulty]}s start clock
                </p>
              ) : null}
            </div>

            <div
              role="group"
              aria-label="Challenge"
              className="cp-lobby-choice-row cp-lobby-choice-row-3 gap-2"
            >
              {DIFFICULTY.map(({ value, label, Icon }) => {
                const active = difficulty === value;
                const hint = difficultyHint(mode, value);
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${label}: ${hint}`}
                    onClick={() => onDifficulty(value)}
                    className={cn(
                      "cp-lobby-challenge flex min-w-0 flex-col items-center gap-1 px-1 py-2.5",
                      active && "cp-lobby-challenge-active cp-select-pop",
                    )}
                  >
                    <span
                      className={cn(
                        "cp-lobby-glyph text-muted-foreground",
                        active && "text-secondary",
                      )}
                      aria-hidden
                    >
                      <Icon
                        className="size-5"
                        strokeWidth={2.25}
                        fill={active ? "currentColor" : "none"}
                        fillOpacity={active ? 0.22 : 0}
                      />
                    </span>
                    <span className="font-display text-sm font-bold">{label}</span>
                    <span className="font-body text-center text-[0.65rem] leading-tight text-muted-foreground [overflow-wrap:anywhere]">
                      {hint}
                    </span>
                  </button>
                );
              })}
            </div>

            {mode === "timed" ? (
              <div className="mt-4">
                <div className="mb-3 flex items-end justify-between gap-2">
                  <LobbySectionTitle icon={Timer}>How long?</LobbySectionTitle>
                  <p className="font-body text-xs text-muted-foreground">{duration}s sprint</p>
                </div>
                <div
                  role="group"
                  aria-label="Sprint length"
                  className="cp-lobby-choice-row cp-lobby-choice-row-4 gap-2"
                >
                  {DURATIONS.map((s) => {
                    const active = duration === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => onDuration(s)}
                        className={cn(
                          "cp-lobby-challenge flex min-w-0 items-center justify-center py-3 font-display text-sm font-bold tabular-nums leading-none",
                          active && "cp-lobby-challenge-active cp-select-pop",
                        )}
                      >
                        {s}s
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>
        </div>

        {/* Customize your game (right / after primary on wide; quieter) */}
        <aside className="cp-lobby-advanced flex flex-col gap-5" aria-label="Customize your game">
          <p className="cp-lobby-advanced-label">Customize your game</p>

          <section aria-label="Min length" className="cp-lobby-panel">
            <div className="mb-3 flex flex-col gap-0.5">
              <LobbySectionTitle icon={Ruler}>Min length</LobbySectionTitle>
              <p className="font-body text-xs text-muted-foreground">
                Only count words this long or longer
              </p>
            </div>
            <div
              role="group"
              aria-label="Min length"
              className="cp-lobby-choice-row cp-lobby-choice-row-3 gap-2"
            >
              {MIN_LENGTH.map(({ value, label, hint, Icon }) => {
                const active = minWordLength === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    aria-label={`${label}: ${hint}`}
                    onClick={() => onMinWordLength(value)}
                    className={cn(
                      "cp-lobby-challenge flex min-w-0 flex-col items-center gap-1 px-1 py-2.5",
                      active && "cp-lobby-challenge-active cp-select-pop",
                    )}
                  >
                    <span
                      className={cn(
                        "cp-lobby-glyph text-muted-foreground",
                        active && "text-secondary",
                      )}
                      aria-hidden
                    >
                      <Icon
                        className="size-5"
                        strokeWidth={2.25}
                        fill={active ? "currentColor" : "none"}
                        fillOpacity={active ? 0.22 : 0}
                      />
                    </span>
                    <span className="font-display text-sm font-bold tabular-nums">{label}</span>
                    <span className="font-body text-[0.65rem] leading-tight text-muted-foreground text-center">
                      {hint}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section aria-label="Ban list" className="cp-lobby-panel">
            <div className="mb-3 flex flex-col gap-0.5">
              <LobbySectionTitle icon={ShieldBan}>Ban list</LobbySectionTitle>
              <p className="font-body text-xs text-muted-foreground">
                Keep these off new boards and swipes
              </p>
            </div>
            <WordBanInput words={blockedWords} onChange={onBlockedWords} />
          </section>

          {jamInvite}
        </aside>
      </div>
    </div>
  );
}

export function HomePlayBar({
  onPlay,
  onWarmPlay,
  onLastResults,
}: {
  onPlay: () => void;
  /** Prefetch Play shell on hover/focus — not on lobby idle (keeps ENABLE off cold path). */
  onWarmPlay?: () => void;
  /** Open last finished run on results — omit when none for this profile. */
  onLastResults?: () => void;
}) {
  return (
    <div className="cp-lobby-play shrink-0 bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-sm">
      <div className="cp-lobby-play-inner flex min-w-0 items-center gap-3 sm:gap-4">
        <Button
          size="lg"
          className="cp-play-cta min-w-0 flex-1 gap-2.5 text-lg focus-visible:ring-0 focus-visible:ring-offset-0"
          onClick={onPlay}
          onPointerEnter={onWarmPlay}
          onFocus={onWarmPlay}
        >
          <CirclePlay className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
          Play
        </Button>
        {onLastResults ? (
          <IconTooltip label="See your last haul">
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 shrink-0"
              aria-label="See your last haul"
              onClick={onLastResults}
            >
              <History />
            </Button>
          </IconTooltip>
        ) : null}
      </div>
    </div>
  );
}
