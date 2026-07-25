import { Text, View } from "react-native";
import { type ReactNode, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ChevronDown, Share2, Sofa } from "lucide-react";
import { ConfettiBurst, EmptyState, LogoCelebrate, Shell } from "@couch-potato/ui";
import { play } from "cuelume";
import { toast } from "sonner";
import { track } from "../analytics";
import { PRODUCT_NAME } from "../seo";
import { loadLastRun, saveLaunch, type PlayLaunch } from "../storage";
import { Button } from "@/components/ui/button";
import { WordGroups } from "../components/WordGroups";

const MISSED_COLLAPSE_THRESHOLD = 8;
const CONFETTI_DELAY_MS = 150;
const CONFETTI_DURATION_MS = 1400;

async function shareScore(text: string) {
  try {
    if (navigator.share) {
      await navigator.share({ text, title: PRODUCT_NAME });
      return;
    }
  } catch {
    /* fall through */
  }
  await navigator.clipboard.writeText(text);
  play("success");
  toast.success("Haul copied. Go brag");
}

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

/** Full-width viewport scroll; narrow content stays in centered `Shell`. */
function ResultsScrollShell({
  children,
  shellClassName = "",
}: {
  children: ReactNode;
  shellClassName?: string;
}) {
  return (
    <View className="flex min-h-0 w-full flex-1 flex-col">
      <div className="cp-shell-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <Shell className={`h-auto min-h-full flex-none ${shellClassName}`.trim()}>{children}</Shell>
      </div>
    </View>
  );
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
      <ResultsScrollShell>
        <EmptyState
          showLogo
          title="No crumbs on the couch yet"
          body="Play a round first, then we'll show off your haul."
        />
        <Button className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>
          Back to lobby
        </Button>
      </ResultsScrollShell>
    );
  }

  const blurb = `Couch Potato: ${run.score} pts on ${run.grid}×${run.grid} ${run.detail}${
    run.isHighScore ? " ★ high score" : ""
  }`;

  const reasonLabel =
    run.reason === "won" ? "Couch clear!" : run.reason === "timeout" ? "Time's up!" : "Run ended";

  return (
    <ResultsScrollShell shellClassName="relative">
      <ConfettiBurst active={celebrate} durationMs={CONFETTI_DURATION_MS} />

      <View className="mb-5 items-center cp-fade-up">
        {/* Results hero — celebratory potato, not the chill lobby `Logo` (see AGENTS.md Brand).
            Split wrappers: outer plays the one-shot pop-in, inner keeps the idle float looping
            (both set the `animation` shorthand, so they can't share a single element). */}
        <View className="cp-pop-in mb-1">
          <View className="cp-logo-float">
            <LogoCelebrate size={88} />
          </View>
        </View>
        <Text className="mb-3 text-center font-display text-2xl text-foreground">
          {reasonLabel}
        </Text>
        <View
          className={`cp-results-plaque cp-pop-in ${celebratory ? "cp-results-plaque-gold" : ""}`}
        >
          <Text className="font-display text-5xl font-bold tabular-nums text-foreground">
            {displayScore}
          </Text>
          <Text className="font-display text-sm font-bold uppercase tracking-wide text-muted-foreground">
            pts
          </Text>
        </View>
        {run.isHighScore && (
          <View className="cp-results-best-chip mt-3 cp-fade-up cp-stagger-2">
            <Text className="font-display text-xs font-bold uppercase tracking-wide text-secondary-foreground">
              New personal best!
            </Text>
          </View>
        )}
      </View>

      <View className="cp-lobby-card mb-4 p-4 cp-fade-up cp-stagger-1">
        <Text className="mb-2 font-display text-lg text-foreground">Your haul</Text>
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

      <View className="cp-lobby-card mb-6 p-4 cp-fade-up cp-stagger-2">
        {run.missed.length ? (
          <>
            <Button
              variant="ghost"
              className="h-auto w-full justify-between px-0 py-0 hover:bg-transparent"
              aria-expanded={missedOpen}
              aria-controls="results-missed-panel"
              onClick={() => setMissedOpen((o) => !o)}
            >
              <View className="flex-row items-baseline gap-1.5">
                <Text className="font-display text-lg text-foreground">Left on the couch</Text>
                <Text className="font-body text-sm text-muted-foreground">
                  ({run.missed.length})
                </Text>
              </View>
              <ChevronDown
                className={`text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
                  missedOpen ? "rotate-180" : ""
                }`}
                aria-hidden
              />
            </Button>
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
            <Text className="mb-2 font-display text-lg text-foreground">Left on the couch</Text>
            <EmptyState
              title="You cleaned the couch"
              body="No juicy leftovers to tease you with."
              className="py-1"
            />
          </>
        )}
      </View>

      <View className="cp-fade-up cp-stagger-3">
        <Button
          className="mb-2 w-full"
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
          Play again
        </Button>
        <Button
          variant="secondary"
          className="mb-2 w-full"
          onClick={() => {
            track("share_clicked", { score: run.score });
            void shareScore(blurb);
          }}
        >
          <Share2 />
          Share haul
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/" })}>
          <Sofa />
          Back to lobby
        </Button>
      </View>
    </ResultsScrollShell>
  );
}
