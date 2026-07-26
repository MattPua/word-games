import { Text, View } from "react-native";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, CirclePlay, Sofa, Sparkles } from "lucide-react";
import { ConfettiBurst, EmptyState, PotatoSprite } from "@couch-potato/ui";
import { loadLastRun, saveLaunch, type PlayLaunch } from "../storage";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { WordGroups } from "../components/WordGroups";
import { ResultsMedals } from "../components/ResultsMedals";
import { ScrollShell } from "../components/ScrollShell";

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

export function ResultsPage() {
  const navigate = useNavigate();
  const run = loadLastRun();
  const displayScore = useCountUp(run?.score ?? 0);
  const [celebrate, setCelebrate] = useState(false);
  const [missedOpen, setMissedOpen] = useState(
    (run?.missed.length ?? 0) <= MISSED_COLLAPSE_THRESHOLD,
  );

  const celebratory = run != null && (run.reason === "won" || run.isHighScore);

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

  const hasMedals = Boolean(run.achievements);

  return (
    <ScrollShell shellClassName="relative cp-shell-results cp-results">
      <ConfettiBurst active={celebrate} durationMs={CONFETTI_DURATION_MS} />

      <View className="mb-6 items-center cp-fade-up">
        {/* Results hero — potato sprite is the brand mark; wordmark + outcome title under it. */}
        <BrandHeader
          className="mb-2"
          mark={
            <View className="cp-pop-in">
              <View className="cp-logo-float">
                <PotatoSprite frame={celebratory ? "cheer" : "idle"} size={148} />
              </View>
            </View>
          }
          title={reasonLabel}
        />
        <View className="cp-results-haul cp-pop-in">
          <View
            className={`cp-results-haul-tag ${run.isHighScore ? "cp-results-haul-tag-gold" : celebratory ? "cp-results-haul-tag-gold" : ""}`}
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

      <div
        className={`cp-results-columns mb-6 ${hasMedals ? "" : "cp-results-columns-solo"}`.trim()}
      >
        {run.achievements ? (
          <ResultsMedals
            snapshot={run.achievements.snapshot}
            stageUps={run.achievements.stageUps}
            touched={run.achievements.touched}
          />
        ) : null}

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
              <WordGroups words={run.found} variant="found" />
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
                  className="h-auto w-full justify-between px-0 py-0 hover:bg-transparent"
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
                    <WordGroups words={run.missed} variant="missed" />
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
            navigate({ to: "/play" });
          }}
        >
          <CirclePlay aria-hidden />
          Play again
        </Button>
        <Button
          variant="outline"
          className="cp-chrome-cta"
          onClick={() => navigate({ to: "/" })}
        >
          <Sofa />
          Back to lobby
        </Button>
      </div>
    </ScrollShell>
  );
}
