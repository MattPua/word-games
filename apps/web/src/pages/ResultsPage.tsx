import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, CirclePlay, Layers, Sofa, Sparkles } from "lucide-react";
import {
  ConfettiBurst,
  EmptyState,
  LetterGrid,
  LogoConsolation,
  ScrollShell,
  WordGroups,
  type Cell,
} from "@couch-potato/ui";
import { findPathForWord, isAdjacentCells, type GridTopology } from "@couch-potato/game-engine";
import { loadLastRun, saveLaunch, type PlayLaunch } from "../storage";
import { setPlayVia, track } from "../analytics";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/ChromeTopBar";
import { ResultsMedals } from "../components/ResultsMedals";
import { formatDifficulty, formatModeLabel, formatRunMeta } from "../runMeta";
import { ModeGlyph } from "../modeGlyph";
import { playSearchFromLaunch } from "../playLaunchSearch";
import { runEndPill } from "../runEndFlourish";

const MISSED_COLLAPSE_THRESHOLD = 8;
const CONFETTI_DELAY_MS = 150;
const CONFETTI_DURATION_MS = 1400;

/** Counts 0 -> target on mount; instant under `prefers-reduced-motion`. */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(0);
  const [ticking, setTicking] = useState(false);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target <= 0) {
      setValue(target);
      setTicking(false);
      return;
    }
    setTicking(true);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(eased * target));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setTicking(false);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return { value, ticking };
}

function titleCase(w: string) {
  return w.length ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const run = loadLastRun();
  const { value: displayScore, ticking: scoreTicking } = useCountUp(run?.score ?? 0);
  const [celebrate, setCelebrate] = useState(false);
  const [missedOpen, setMissedOpen] = useState(
    (run?.missed.length ?? 0) <= MISSED_COLLAPSE_THRESHOLD,
  );
  /** More crumbs — always closed until the player asks. */
  const [moreOpen, setMoreOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Win / high score / timeout get the full results curtain call; quit still
  // gets hero pop-in + haul count-up (softer, no confetti spam on intentional End run).
  const celebratory =
    run != null && (run.reason === "won" || run.isHighScore || run.reason === "timeout");
  const topology = (run?.topology ?? "square") as GridTopology;
  const letters = run?.letters;
  const hasBoard = Boolean(letters && letters.length > 0);

  const highlightPath: Cell[] = useMemo(() => {
    if (!letters || !selectedWord) return [];
    return findPathForWord(letters, selectedWord, topology) ?? [];
  }, [letters, selectedWord, topology]);

  const adjacent = (a: Cell, b: Cell) => isAdjacentCells(a, b, topology);

  const selectWord = (word: string) => {
    setSelectedWord((prev) => (prev?.toLowerCase() === word.toLowerCase() ? null : word));
  };

  useEffect(() => {
    if (!celebratory) return;
    const t = window.setTimeout(() => setCelebrate(true), CONFETTI_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [celebratory]);

  if (!run) {
    return (
      <ScrollShell shellClassName="cp-shell-results cp-results">
        <PageHeading title="Results" />
        <EmptyState
          title="No haul yet"
          body="Play a round first, then we'll show off your finds."
        />
        <Button className="mt-4 cp-chrome-cta" onClick={() => navigate({ to: "/" })}>
          Back to lobby
        </Button>
      </ScrollShell>
    );
  }

  // Same outcome voice as the Play end curtain — never a flat "Run ended".
  const reasonLabel = runEndPill(run.reason, run.mode);
  const scoreHot = run.isHighScore || run.reason === "won";
  const missedMore = (run.missedMore ?? []).filter(
    (w) => w.length >= Math.max(4, run.minWordLength ?? 3),
  );

  const runMeta = formatRunMeta({
    mode: run.mode,
    difficulty: run.difficulty,
    duration: run.duration,
    minWordLength: run.minWordLength,
  });
  const modeLabel = formatModeLabel(run.mode);
  const challengeLabel = formatDifficulty(run.difficulty ?? "easy");
  const minLabel = `${run.minWordLength ?? 3}+`;

  return (
    <ScrollShell shellClassName="relative cp-shell-results cp-results">
      <ConfettiBurst active={celebrate} durationMs={CONFETTI_DURATION_MS} />

      <div className="mb-4 cp-fade-up">
        <PageHeading className="!mb-2" title={reasonLabel} />
        <div className="cp-results-hero-score">
          <div className="cp-results-meta" role="group" aria-label={runMeta}>
            <div
              className={
                run.mode === "timed"
                  ? "cp-results-meta-chip cp-results-meta-mode cp-results-meta-mode-timed"
                  : run.mode === "survival"
                    ? "cp-results-meta-chip cp-results-meta-mode cp-results-meta-mode-survival"
                    : "cp-results-meta-chip cp-results-meta-mode cp-results-meta-mode-target"
              }
            >
              <span
                className={
                  run.mode === "survival"
                    ? "text-secondary"
                    : run.mode === "timed"
                      ? "text-[var(--path)]"
                      : "text-primary"
                }
                aria-hidden
              >
                <ModeGlyph mode={run.mode} className="size-4 shrink-0" />
              </span>
              <span>{modeLabel}</span>
            </div>
            <div className="cp-results-meta-chip">{challengeLabel}</div>
            {run.mode === "timed" ? (
              <div className="cp-results-meta-chip">{run.duration ?? 60}s</div>
            ) : null}
            <div className="cp-results-meta-chip">{minLabel}</div>
          </div>
          <div className="cp-results-haul cp-results-haul-reveal">
            <div
              className={`cp-results-haul-tag ${scoreHot ? "cp-results-haul-tag-gold" : ""}`}
            >
              <span
                className={[
                  "cp-results-score-num font-display font-bold tabular-nums",
                  scoreTicking ? "cp-results-score-ticking" : "",
                  scoreHot ? "cp-results-score-sparkle" : "cp-results-score-glow",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {displayScore}
              </span>
              <span className="cp-results-points-label font-display text-sm font-bold tracking-wide text-muted-foreground">
                points
              </span>
            </div>
            {run.isHighScore && (
              <span className="cp-results-best-label cp-fade-up cp-stagger-2">New couch best</span>
            )}
          </div>
        </div>
      </div>

      {run.achievements ? (
        <div className="mb-6 cp-fade-up">
          <ResultsMedals
            snapshot={run.achievements.snapshot}
            stageUps={run.achievements.stageUps}
            touched={run.achievements.touched}
          />
        </div>
      ) : null}

      <div className="cp-results-replay mb-6">
        <div className="cp-results-words">
          <div className="cp-lobby-card p-4 cp-fade-up cp-stagger-1">
            <h2 className="mb-2 flex items-center gap-2 text-lg text-foreground">
              <Sparkles
                className="cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground"
                strokeWidth={2.25}
                aria-hidden
              />
              Your haul
            </h2>
            {run.found.length ? (
              <WordGroups
                words={run.found}
                variant="found"
                selectedWord={hasBoard ? selectedWord : undefined}
                onWordSelect={hasBoard ? selectWord : undefined}
              />
            ) : (
              <EmptyState
                title="Nada. Not even 'the'."
                body="It happens. Next run."
                mark={<LogoConsolation size={96} />}
                className="py-2"
              />
            )}
          </div>

          <div className="cp-lobby-card p-4 cp-fade-up cp-stagger-2">
            {run.missed.length ? (
              <>
                <Button
                  variant="ghost"
                  className="h-auto min-h-0 w-full justify-between px-0 py-0 hover:bg-transparent"
                  aria-expanded={missedOpen}
                  aria-controls="results-missed-panel"
                  onClick={() => setMissedOpen((o) => !o)}
                >
                  <div className="min-w-0 flex-1 flex flex-row items-center gap-2">
                    <Sofa
                      className="cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <span className="font-display text-lg text-foreground">Long ones left</span>
                    <span className="font-body text-sm text-muted-foreground">
                      ({run.missed.length})
                    </span>
                  </div>
                  <ChevronDown
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                      missedOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </Button>
                <span className="mt-1 font-body text-sm text-muted-foreground">
                  Biggest leftovers still on the board. Short finds stay off this list.
                </span>
                <div
                  id="results-missed-panel"
                  className={`cp-results-collapse-panel ${missedOpen ? "cp-results-collapse-panel-open" : ""}`}
                >
                  <div className="cp-results-collapse-panel-inner pt-3">
                    {/* Remount on open so chip drop-in runs when revealed (not while collapsed). */}
                    <WordGroups
                      key={missedOpen ? "missed-open" : "missed-shut"}
                      words={run.missed}
                      variant="missed"
                      selectedWord={hasBoard ? selectedWord : undefined}
                      onWordSelect={hasBoard ? selectWord : undefined}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <h2 className="mb-2 flex items-center gap-2 text-lg text-foreground">
                  <Sofa
                    className="cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  Long ones left
                </h2>
                <EmptyState
                  title="No juicy leftovers"
                  body="You got the long ones. Shorter finds may still be on the board."
                  className="py-1"
                />
              </>
            )}
          </div>

          {missedMore.length > 0 ? (
            <div className="cp-lobby-card p-4 cp-fade-up cp-stagger-2">
              <Button
                variant="ghost"
                className="h-auto min-h-0 w-full justify-between px-0 py-0 hover:bg-transparent"
                aria-expanded={moreOpen}
                aria-controls="results-more-panel"
                onClick={() => setMoreOpen((o) => !o)}
              >
                <div className="min-w-0 flex-1 flex flex-row items-center gap-2">
                  <Layers
                    className="cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="font-display text-lg text-foreground">More on the board</span>
                  <span className="font-body text-sm text-muted-foreground">
                    ({missedMore.length})
                  </span>
                </div>
                <ChevronDown
                  className={`shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                    moreOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden
                />
              </Button>
              <span className="mt-1 font-body text-sm text-muted-foreground">
                Shorter mid-length finds still hiding (3-letter crumbs stay off). Tap to peek.
              </span>
              <div
                id="results-more-panel"
                className={`cp-results-collapse-panel ${moreOpen ? "cp-results-collapse-panel-open" : ""}`}
              >
                <div className="cp-results-collapse-panel-inner pt-3">
                  <WordGroups
                    key={moreOpen ? "more-open" : "more-shut"}
                    words={missedMore}
                    variant="missed"
                    selectedWord={hasBoard ? selectedWord : undefined}
                    onWordSelect={hasBoard ? selectWord : undefined}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="cp-results-board-card cp-lobby-card p-4 cp-fade-up">
          <h2 className="mb-1 text-center font-display text-lg text-foreground">Your board</h2>
          {hasBoard && letters ? (
            <>
              <p className="mb-3 text-center font-body text-sm text-muted-foreground">
                Tap a word chip to trace its path.
              </p>
              <div className="cp-results-board mx-auto">
                <LetterGrid
                  letters={letters}
                  topology={topology}
                  isAdjacent={adjacent}
                  selected={highlightPath}
                  interactive={false}
                />
              </div>
              {selectedWord ? (
                <p
                  className="mt-3 text-center font-display text-base font-bold text-primary"
                  aria-live="polite"
                >
                  {titleCase(selectedWord)}
                  {highlightPath.length === 0 ? ". Path went missing." : ""}
                </p>
              ) : (
                <p className="mt-3 text-center font-body text-sm text-muted-foreground">
                  No word picked yet
                </p>
              )}
            </>
          ) : (
            <EmptyState
              title="Board went walkabout"
              body="This haul predates board replay. Play again and it'll stick around."
              className="py-2"
            />
          )}
        </div>
      </div>

      <div className="cp-results-actions cp-fade-up cp-stagger-3">
        <Button
          className="cp-chrome-cta"
          onClick={() => {
            const launch: PlayLaunch = {
              mode: run.mode,
              grid: run.grid as 4 | 5 | 6,
              topology: run.topology,
              minWordLength: run.minWordLength ?? 3,
              difficulty: run.difficulty,
              duration: run.duration,
            };
            saveLaunch(launch);
            track("play_again", {
              mode: launch.mode,
              grid: launch.grid,
              topology: launch.topology ?? "square",
            });
            setPlayVia("results");
            navigate({ to: "/play", search: playSearchFromLaunch(launch) });
          }}
        >
          <CirclePlay aria-hidden />
          Play again
        </Button>
        <Button
          variant="outline"
          className="cp-chrome-cta"
          onClick={() => {
            saveLaunch({
              mode: run.mode,
              grid: run.grid as 4 | 5 | 6,
              topology: run.topology,
              minWordLength: run.minWordLength ?? 3,
              difficulty: run.difficulty,
              duration: run.duration,
            });
            navigate({ to: "/" });
          }}
        >
          <Sofa />
          Back to lobby
        </Button>
      </div>
    </ScrollShell>
  );
}
