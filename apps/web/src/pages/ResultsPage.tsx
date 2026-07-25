import { Text } from "react-native";
import { useNavigate } from "@tanstack/react-router";
import { Button, EmptyState, Shell } from "@couch-potato/ui";
import { play } from "cuelume";
import { track } from "../analytics";
import { loadLastRun, saveLaunch, type PlayLaunch } from "../storage";

async function shareScore(text: string) {
  try {
    if (navigator.share) {
      await navigator.share({ text, title: "Couch Potato" });
      return;
    }
  } catch {
    /* fall through */
  }
  await navigator.clipboard.writeText(text);
  play("success");
}

export function ResultsPage() {
  const navigate = useNavigate();
  const run = loadLastRun();

  if (!run) {
    return (
      <Shell>
        <EmptyState
          showLogo
          title="No crumbs on the couch yet"
          body="Play a round first — then we'll show off your haul."
          actionLabel="Back to the couch"
          onAction={() => navigate({ to: "/" })}
        />
      </Shell>
    );
  }

  const blurb = `Couch Potato — ${run.score} pts on ${run.grid}×${run.grid} ${run.detail}${
    run.isHighScore ? " ★ high score" : ""
  }`;

  const reasonLabel =
    run.reason === "won"
      ? "Target reached!"
      : run.reason === "timeout"
        ? "Time's up"
        : "Paused on the couch";

  return (
    <Shell>
      <Text className="mb-1 font-display text-3xl text-foreground">
        {reasonLabel}
      </Text>
      <Text className="mb-4 font-display text-4xl text-primary">{run.score}</Text>
      {run.isHighScore && (
        <Text className="mb-4 font-body text-path">New high score!</Text>
      )}

      <Text className="mb-2 font-display text-lg text-foreground">Found</Text>
      {run.found.length ? (
        <Text className="mb-4 font-body text-muted-foreground">
          {run.found.join(", ")}
        </Text>
      ) : (
        <EmptyState
          title="Nada. Not even 'the'."
          body="It happens. The cushions will forgive you."
          className="mb-4 py-2"
        />
      )}

      <Text className="mb-2 font-display text-lg text-foreground">
        Missed longs
      </Text>
      {run.missed.length ? (
        <Text className="mb-6 font-body text-muted-foreground">
          {run.missed.join(", ")}
        </Text>
      ) : (
        <EmptyState
          title="You cleaned the couch"
          body="No juicy leftovers to tease you with."
          className="mb-6 py-2"
        />
      )}

      <Button
        label="Share"
        className="mb-2"
        onPress={() => {
          track("share_clicked", { score: run.score });
          void shareScore(blurb);
        }}
      />
      <Button
        label="Play again"
        variant="secondary"
        className="mb-2"
        onPress={() => {
          const launch: PlayLaunch = {
            mode: run.mode,
            grid: run.grid as 4 | 5 | 6,
            minWordLength: run.minWordLength ?? 3,
            difficulty: run.difficulty,
            duration: run.duration,
          };
          saveLaunch(launch);
          navigate({ to: "/play" });
        }}
      />
      <Button label="Home" variant="ghost" onPress={() => navigate({ to: "/" })} />
    </Shell>
  );
}
