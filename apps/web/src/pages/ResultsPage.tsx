import { Text } from "react-native";
import { useNavigate } from "@tanstack/react-router";
import { Share2 } from "lucide-react";
import { EmptyState, Shell } from "@couch-potato/ui";
import { play } from "cuelume";
import { toast } from "sonner";
import { track } from "../analytics";
import { PRODUCT_NAME } from "../seo";
import { loadLastRun, saveLaunch, type PlayLaunch } from "../storage";
import { Button } from "@/components/ui/button";
import { WordGroups } from "../components/WordGroups";

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

export function ResultsPage() {
  const navigate = useNavigate();
  const run = loadLastRun();

  if (!run) {
    return (
      <Shell className="cp-shell-scroll overflow-y-auto">
        <EmptyState
          showLogo
          title="No crumbs on the couch yet"
          body="Play a round first, then we'll show off your haul."
        />
        <Button className="mt-4 w-full" onClick={() => navigate({ to: "/" })}>
          Back to lobby
        </Button>
      </Shell>
    );
  }

  const blurb = `Couch Potato: ${run.score} pts on ${run.grid}×${run.grid} ${run.detail}${
    run.isHighScore ? " ★ high score" : ""
  }`;

  const reasonLabel =
    run.reason === "won" ? "Couch clear!" : run.reason === "timeout" ? "Time's up" : "Run ended";

  return (
    <Shell className="cp-shell-scroll overflow-y-auto">
      <Text className="mb-1 font-display text-3xl text-foreground">{reasonLabel}</Text>
      <Text className="mb-4 font-display text-4xl text-primary">{run.score}</Text>
      {run.isHighScore && <Text className="mb-4 font-body text-path">New personal best!</Text>}

      <Text className="mb-2 font-display text-lg text-foreground">Your haul</Text>
      {run.found.length ? (
        <WordGroups words={run.found} className="mb-4" />
      ) : (
        <EmptyState
          title="Nada. Not even 'the'."
          body="It happens. The cushions will forgive you."
          className="mb-4 py-2"
        />
      )}

      <Text className="mb-2 font-display text-lg text-foreground">Left on the couch</Text>
      {run.missed.length ? (
        <WordGroups words={run.missed} className="mb-6" />
      ) : (
        <EmptyState
          title="You cleaned the couch"
          body="No juicy leftovers to tease you with."
          className="mb-6 py-2"
        />
      )}

      <Button
        className="mb-2 w-full"
        onClick={() => {
          track("share_clicked", { score: run.score });
          void shareScore(blurb);
        }}
      >
        <Share2 />
        Share haul
      </Button>
      <Button
        variant="secondary"
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
      <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/" })}>
        Lobby
      </Button>
    </Shell>
  );
}
