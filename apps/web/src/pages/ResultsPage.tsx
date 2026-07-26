import { Text, View } from "react-native";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, CirclePlay, Sofa, Sparkles } from "lucide-react";
import {
  ConfettiBurst,
  EmptyState,
  LetterGrid,
  Logo,
  LogoCelebrate,
  type Cell,
} from "@couch-potato/ui";
import {
  findPathForWord,
  isAdjacentCells,
  type GridTopology,
} from "@couch-potato/game-engine";
import { loadLastRun, saveLaunch, type PlayLaunch } from "../storage";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { WordGroups } from "../components/WordGroups";
import { ResultsMedals } from "../components/ResultsMedals";
import { ScrollShell } from "../components/ScrollShell";
import { formatRunMeta } from "../runMeta";
import { playSearchFromLaunch } from "../playLaunchSearch";

const MISSED_COLLAPSE_THRESHOLD = 8;
const CONFETTI_DELAY_MS = 150;
const CONFETTI_DURATION_MS = 1400;

/** Counts 0 -> target on mount; instant under `prefers-reduced-motion`. */
function useCountUp(target: number, durationMs = 650) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target <= 0) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

function titleCase(w: string) {
  return w.length ? w[0]!.toUpperCase() + w.slice(1).toLowerCase() : w;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const run = loadLastRun();
  const displayScore = useCountUp(run?.score ?? 0);
  const [celebrate, setCelebrate] = useState(false);
  const [missedOpen, setMissedOpen] = useState(
    (run?.missed.length ?? 0) <= MISSED_COLLAPSE_THRESHOLD,
  );
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Win / high score / timeout get the full results curtain call; quit still
  // gets hero pop-in + haul count-up (softer, no confetti spam on intentional End run).
  const celebratory =
    run != null && (run.reason === "won" || run.isHighScore || run.reason === "timeout");
  const showCelebrateMark = celebratory || (run != null && run.score > 0);
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
        <BrandHeader className="mb-4" title="Results" />
        <EmptyState
          title="No crumbs on the couch yet"
          body="Play a round first, then we'll show off your haul."
        />
        <Button className="mt-4 cp-chrome-cta" onClick={() => navigate({ to: "/" })}>
          Back to lobby
        </Button>
      </ScrollShell>
    );
  }

  const reasonLabel =
    run.reason === "won"
      ? "Couch clear!"
      : run.reason === "timeout"
        ? run.mode === "survival"
          ? "Clock ran dry"
          : "Time's up!"
        : "Run ended";

  const runMeta = formatRunMeta({
    mode: run.mode,
    difficulty: run.difficulty,
    duration: run.duration,
    minWordLength: run.minWordLength,
  });

  return (
    <ScrollShell shellClassName="relative cp-shell-results cp-results">
      <ConfettiBurst active={celebrate} durationMs={CONFETTI_DURATION_MS} />

      <View className="mb-4 items-center cp-fade-up">
        {/* Results hero — dedicated marks (celebrate / chill), not the atlas sheet. */}
        <BrandHeader
          className="mb-1"
          mark={
            <View className="cp-pop-in">
              <View className="cp-logo-float">
                {showCelebrateMark ? <LogoCelebrate size={96} /> : <Logo size={96} />}
              </View>
            </View>
          }
          title={reasonLabel}
        />
        <View className="mb-2 items-center">
          <View className="cp-run-badge cp-run-badge-quiet" accessibilityLabel={runMeta}>
            <Text style={{ color: "inherit" }}>{runMeta}</Text>
          </View>
        </View>
        <View className="cp-results-haul cp-pop-in">
          <View
            className={`cp-results-haul-tag ${
              run.isHighScore || run.reason === "won" ? "cp-results-haul-tag-gold" : ""
            }`}
          >
            <Text
              className={`font-display text-5xl font-bold tabular-nums text-foreground ${
                run.isHighScore ? "cp-results-score-sparkle" : ""
              }`}
            >
              {displayScore}
            </Text>
            <Text className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
              pts
            </Text>
          </View>
          {run.isHighScore && (
            <Text className="cp-results-best-label cp-fade-up cp-stagger-2">New couch best</Text>
          )}
        </View>
      </View>

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
          <View className="cp-lobby-card p-4 cp-fade-up cp-stagger-1">
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
                body="It happens. The cushions will forgive you."
                className="py-1"
              />
            )}
          </View>

          <View className="cp-lobby-card p-4 cp-fade-up cp-stagger-2">
            {run.missed.length ? (
              <>
                <Button
                  variant="ghost"
                  className="h-auto min-h-0 w-full justify-between px-0 py-0 hover:bg-transparent"
                  aria-expanded={missedOpen}
                  aria-controls="results-missed-panel"
                  onClick={() => setMissedOpen((o) => !o)}
                >
                  <View className="min-w-0 flex-1 flex-row items-center gap-2">
                    <Sofa
                      className="cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground"
                      strokeWidth={2.25}
                      aria-hidden
                    />
                    <Text className="font-display text-lg text-foreground">Long ones left</Text>
                    <Text className="font-body text-sm text-muted-foreground">
                      ({run.missed.length})
                    </Text>
                  </View>
                  <ChevronDown
                    className={`shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                      missedOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden
                  />
                </Button>
                <Text className="mt-1 font-body text-sm text-muted-foreground">
                  Biggest catches still on the couch. Short crumbs stay off this list.
                </Text>
                <View
                  id="results-missed-panel"
                  className={`cp-results-collapse-panel ${missedOpen ? "cp-results-collapse-panel-open" : ""}`}
                >
                  <View className="cp-results-collapse-panel-inner pt-3">
                    <WordGroups
                      words={run.missed}
                      variant="missed"
                      selectedWord={hasBoard ? selectedWord : undefined}
                      onWordSelect={hasBoard ? selectWord : undefined}
                    />
                  </View>
                </View>
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
                  body="The long catches are gone. Short crumbs may still be on the board."
                  className="py-1"
                />
              </>
            )}
          </View>
        </div>

        <div className="cp-results-board-card cp-lobby-card p-4 cp-fade-up">
          <h2 className="mb-1 text-center font-display text-lg text-foreground">Your board</h2>
          {hasBoard && letters ? (
            <>
              <p className="mb-3 text-center font-body text-sm text-muted-foreground">
                Tap a haul word to trace its path.
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
