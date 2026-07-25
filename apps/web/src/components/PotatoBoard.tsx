import { Text, View } from "react-native";
import { Gamepad2, Library } from "lucide-react";
import { EmptyState } from "@couch-potato/ui";
import { formatWhen, listHighScores, type GameHistoryEntry, type Profile } from "../storage";

function reasonLabel(r: GameHistoryEntry["reason"]) {
  if (r === "won") return "cleared";
  if (r === "timeout") return "timed out";
  return "ended";
}

function historyLabel(h: GameHistoryEntry) {
  if (h.mode === "target")
    return `${h.grid}×${h.grid} ${h.difficulty ?? "?"} · ${h.minWordLength}+`;
  if (h.mode === "survival") {
    return `${h.grid}×${h.grid} survival ${h.difficulty ?? "?"} · ${h.minWordLength}+`;
  }
  return `${h.grid}×${h.grid} ${h.duration ?? "?"}s · ${h.minWordLength}+`;
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
        Your local scoreboard. No cloud bragging.
      </Text>

      <View className="mb-4 flex-row gap-3">
        <View className="cp-lobby-panel flex-1 flex-row items-center gap-2.5 !p-3">
          <View className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/18 text-primary">
            <Gamepad2 className="size-4" strokeWidth={2.25} aria-hidden />
          </View>
          <View>
            <Text className="font-body text-xs text-muted-foreground">Runs</Text>
            <Text className="font-display text-xl text-foreground">{profile.gamesPlayed}</Text>
          </View>
        </View>
        <View className="cp-lobby-panel flex-1 flex-row items-center gap-2.5 !p-3">
          <View className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/22 text-secondary">
            <Library className="size-4" strokeWidth={2.25} aria-hidden />
          </View>
          <View>
            <Text className="font-body text-xs text-muted-foreground">Words</Text>
            <Text className="font-display text-xl text-foreground">{profile.wordsFound}</Text>
          </View>
        </View>
      </View>

      {empty ? (
        <EmptyState
          showLogo
          title="Board's squeaky clean"
          body="Play a round. Bests and recent runs pile up right here."
          className="py-2"
        />
      ) : (
        <div className="cp-crew-board-columns flex flex-col gap-4">
          <View>
            <Text className="mb-2 font-display text-lg text-foreground">Personal bests</Text>
            {highs.length === 0 ? (
              <EmptyState
                title="No bests carved yet"
                body="Clear a goal or beat the clock and we'll keep the high water mark."
                className="py-2"
              />
            ) : (
              <View>
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
          </View>

          <View>
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
          </View>
        </div>
      )}
    </View>
  );
}
