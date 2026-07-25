import type { LucideIcon } from "lucide-react";
import {
  ALargeSmall,
  CirclePlay,
  Droplets,
  Eye,
  Gauge,
  LayoutGrid,
  Music2,
  Ruler,
  Sofa,
  Sun,
  Timer,
  Type,
  Volume2,
  VolumeX,
  WholeWord,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { IconTooltip } from "@/components/ui/tooltip";
import { MusicOff } from "@/icons/MusicOff";

type Mode = "target" | "timed";
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
  showWordsLeft: boolean;
  onMode: (v: Mode) => void;
  onGrid: (v: Grid) => void;
  onTopology: (v: Topology) => void;
  onMinWordLength: (v: MinLen) => void;
  onDifficulty: (v: Difficulty) => void;
  onDuration: (v: Duration) => void;
  onShowWordsLeft: (v: boolean) => void;
};

/** Growth rings vs 4×4 base: mid = potato gold, outer = soft sage accent. */
const SIZE_BASE = 4;

function sizeCellFill(r: number, c: number): { fill: string; opacity: number } {
  const ring = Math.max(r, c);
  if (ring < SIZE_BASE) return { fill: "currentColor", opacity: 0.85 };
  if (ring === SIZE_BASE) return { fill: "var(--secondary)", opacity: 1 };
  return { fill: "var(--accent)", opacity: 1 };
}

function SquareMini({ n }: { n: number }) {
  const cells = Array.from({ length: n * n }, (_, i) => i);
  return (
    <svg viewBox={`0 0 ${n} ${n}`} className="h-10 w-10" aria-hidden>
      {cells.map((i) => {
        const r = Math.floor(i / n);
        const c = i % n;
        const { fill, opacity } = sizeCellFill(r, c);
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
        const { fill, opacity } = sizeCellFill(p.r, p.c);
        return <polygon key={p.key} points={hexPoints(p.cx, p.cy)} fill={fill} opacity={opacity} />;
      })}
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
  Icon: LucideIcon;
}[] = [
  { value: "easy", label: "Easy", hint: "Soft couch", Icon: Sofa },
  { value: "medium", label: "Medium", hint: "Warm seat", Icon: Sun },
  { value: "hard", label: "Hard", hint: "Spud sweat", Icon: Droplets },
];

const DURATIONS: Duration[] = [30, 60, 90, 120];

const LOBBY_SECTION_ICON = "cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground";

function LobbySectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-center gap-2 font-display text-base font-bold text-foreground">
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
    <div className="cp-lobby-setup">
      <div className="cp-lobby-columns flex flex-col gap-5">
        {/* Primary: what am I playing (left / first on wide) */}
        <div className="cp-lobby-primary flex flex-col gap-5">
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
                      "cp-lobby-glyph text-muted-foreground",
                      active && "text-secondary",
                    )}
                  >
                    <Glyph />
                  </span>
                  <span className="font-display text-lg font-bold leading-none text-foreground">
                    {title}
                  </span>
                  <span className="font-body text-xs leading-snug text-muted-foreground">
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
                      "cp-lobby-chip flex items-center justify-center gap-2 py-2.5",
                      active && "cp-lobby-chip-active cp-select-pop",
                    )}
                  >
                    <span
                      className={cn(
                        "cp-lobby-glyph scale-75 text-muted-foreground",
                        active && "text-secondary",
                      )}
                    >
                      <Icon />
                    </span>
                    <span className="font-display text-sm font-bold">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Challenge: difficulty or duration */}
          <section
            key={mode}
            aria-label={mode === "target" ? "Challenge" : "Sprint"}
            className="cp-lobby-panel cp-option-swap"
          >
            <div className="mb-3 flex items-end justify-between gap-2">
              <LobbySectionTitle icon={mode === "target" ? Gauge : Timer}>
                {mode === "target" ? "How hard?" : "How long?"}
              </LobbySectionTitle>
              {mode === "timed" ? (
                <p className="font-body text-xs text-muted-foreground">{duration}s sprint</p>
              ) : null}
            </div>

            {mode === "target" ? (
              <div role="group" aria-label="Challenge" className="grid grid-cols-3 gap-2">
                {DIFFICULTY.map(({ value, label, hint, Icon }) => {
                  const active = difficulty === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      aria-label={`${label}: ${hint}`}
                      onClick={() => onDifficulty(value)}
                      className={cn(
                        "cp-lobby-challenge flex flex-col items-center gap-1 px-1 py-2.5",
                        active && "cp-lobby-challenge-active cp-select-pop",
                        active && value === "hard" && "cp-lobby-challenge-hard",
                      )}
                    >
                      <span
                        className={cn(
                          "cp-lobby-glyph text-muted-foreground",
                          active &&
                            (value === "hard" ? "text-secondary-foreground" : "text-secondary"),
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
                        "cp-lobby-challenge flex items-center justify-center py-3 font-display text-sm font-bold tabular-nums leading-none",
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
        </div>

        {/* Advanced: fine-tune prefs (right / after primary on wide; quieter) */}
        <aside className="cp-lobby-advanced flex flex-col gap-5" aria-label="Fine-tune">
          <p className="cp-lobby-advanced-label">Fine-tune</p>

          <section aria-label="Min length" className="cp-lobby-panel">
            <div className="mb-3 flex flex-col gap-0.5">
              <LobbySectionTitle icon={Ruler}>Min length</LobbySectionTitle>
              <p className="font-body text-xs text-muted-foreground">
                Only count words this long or longer
              </p>
            </div>
            <div role="group" aria-label="Min length" className="grid grid-cols-3 gap-2">
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
                      "cp-lobby-challenge flex flex-col items-center gap-1 px-1 py-2.5",
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

          {/* Words left HUD (default off) */}
          <label
            htmlFor="lobby-words-left"
            className={cn(
              "cp-pref-row flex cursor-pointer items-center justify-between gap-3",
              showWordsLeft && "cp-pref-row-on cp-select-pop",
            )}
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <Eye
                className={cn(LOBBY_SECTION_ICON, "mt-0.5", showWordsLeft && "text-secondary")}
                strokeWidth={2.25}
                aria-hidden
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-display text-sm font-bold text-foreground">
                  Show words left
                </span>
                <span className="font-body text-[0.65rem] leading-snug text-muted-foreground">
                  During play, show a running count of words still to find
                </span>
              </span>
            </span>
            <Switch
              id="lobby-words-left"
              checked={showWordsLeft}
              onCheckedChange={onShowWordsLeft}
              aria-label={`Show words left ${showWordsLeft ? "on" : "off"}`}
            />
          </label>
        </aside>
      </div>
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
  const soundLabel = sound ? "SFX on" : "SFX off";
  const musicLabel = menuMusic ? "Music on" : "Music off";
  return (
    <div className="cp-lobby-play shrink-0 -mx-4 border-t border-border/40 bg-[color-mix(in_srgb,var(--background)_92%,transparent)] px-4 backdrop-blur-sm">
      <div className="cp-lobby-play-inner flex items-center gap-4">
        <Button size="lg" className="flex-1 gap-2.5 text-lg" onClick={onPlay}>
          <CirclePlay className="cp-lobby-glyph size-4 shrink-0" aria-hidden />
          Play
        </Button>
        <IconTooltip label={musicLabel}>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-pressed={menuMusic}
            aria-label={musicLabel}
            onClick={onToggleMenuMusic}
          >
            {menuMusic ? <Music2 className="cp-icon-anim-note" /> : <MusicOff />}
          </Button>
        </IconTooltip>
        <IconTooltip label={soundLabel}>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0"
            aria-pressed={sound}
            aria-label={soundLabel}
            onClick={onToggleSound}
          >
            {sound ? <Volume2 className="cp-icon-anim-wave" /> : <VolumeX />}
          </Button>
        </IconTooltip>
      </div>
    </div>
  );
}
