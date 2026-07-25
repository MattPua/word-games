import { Text, View } from "react-native";
import { EmptyState } from "@couch-potato/ui";
import { formatWhen, listHighScores, type GameHistoryEntry, type Profile } from "../storage";

function reasonLabel(r: GameHistoryEntry["reason"]) {
  if (r === "won") return "won";
  if (r === "timeout") return "time";
  return "quit";
}

function historyLabel(h: GameHistoryEntry) {
  const setup =
    h.mode === "target"
      ? `${h.grid}×${h.grid} ${h.difficulty ?? "?"} · ${h.minWordLength}+`
      : `${h.grid}×${h.grid} ${h.duration ?? "?"}s · ${h.minWordLength}+`;
  return setup;
}

/** Local-only personal scoreboard — “Potato Board”. */
export function PotatoBoard({ profile }: { profile: Profile }) {
  const highs = listHighScores(profile);
  const recent = profile.history ?? [];
  const empty = highs.length === 0 && recent.length === 0;

  return (
    <View className="mb-6">
      <Text className="mb-1 font-display text-xl text-foreground">Potato Board</Text>
      <Text className="mb-3 font-body text-sm text-muted-foreground">
        How you have done on this couch — local only, no cloud bragging.
      </Text>

      <View className="mb-4 flex-row gap-3">
        <View className="flex-1 rounded-ui bg-card px-3 py-3">
          <Text className="font-body text-xs text-muted-foreground">Games</Text>
          <Text className="font-display text-2xl text-foreground">{profile.gamesPlayed}</Text>
        </View>
        <View className="flex-1 rounded-ui bg-card px-3 py-3">
          <Text className="font-body text-xs text-muted-foreground">Words</Text>
          <Text className="font-display text-2xl text-foreground">{profile.wordsFound}</Text>
        </View>
      </View>

      {empty ? (
        <EmptyState
          title="Board still warm and empty"
          body="Play a round — bests and recent runs show up here."
          className="py-2"
        />
      ) : (
        <>
          <Text className="mb-2 font-display text-lg text-foreground">Personal bests</Text>
          {highs.length === 0 ? (
            <EmptyState
              title="No bests carved yet"
              body="Beat a target or clock and we'll keep the high water mark."
              className="mb-4 py-2"
            />
          ) : (
            <View className="mb-4">
              {highs.map((h) => (
                <View
                  key={h.key}
                  className="mb-2 rounded-ui border border-border bg-card px-3 py-2"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="flex-1 font-body text-sm text-foreground">{h.label}</Text>
                    <Text className="font-display text-lg text-primary">{h.score}</Text>
                  </View>
                  <Text className="font-body text-xs text-muted-foreground">
                    Best {formatWhen(h.at)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <Text className="mb-2 font-display text-lg text-foreground">Recent runs</Text>
          {recent.length === 0 ? (
            <EmptyState
              title="No recent crumbs"
              body="Finished games leave a trail here (last 20)."
              className="py-2"
            />
          ) : (
            recent.map((h) => (
              <View key={h.id} className="mb-2 rounded-ui border border-border bg-card px-3 py-2">
                <View className="flex-row items-center justify-between">
                  <Text className="font-body text-sm font-bold text-foreground">
                    {h.score} pts
                    {h.isHighScore ? " ★" : ""}
                  </Text>
                  <Text className="font-body text-xs text-muted-foreground">
                    {reasonLabel(h.reason)} · {formatWhen(h.at)}
                  </Text>
                </View>
                <Text className="font-body text-xs text-muted-foreground">
                  {historyLabel(h)} · {h.wordsFound} words
                </Text>
              </View>
            ))
          )}
        </>
      )}
    </View>
  );
}
