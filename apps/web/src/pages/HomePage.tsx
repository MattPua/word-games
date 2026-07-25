import { Text, View } from "react-native";
import { Button, Logo, Shell } from "@couch-potato/ui";
import {
  getActiveProfile,
  loadDevicePrefs,
  saveLaunch,
  setSoundEnabled,
  type PlayLaunch,
} from "../storage";
import { useState } from "react";
import { setEnabled } from "cuelume";
import { track } from "../analytics";

export function HomePage() {
  const profile = getActiveProfile();
  const [mode, setMode] = useState<"target" | "timed">("target");
  const [grid, setGrid] = useState<4 | 5 | 6>(4);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy",
  );
  const [duration, setDuration] = useState<30 | 60 | 90 | 120>(60);
  const [sound, setSound] = useState(loadDevicePrefs().soundEnabled);
  const [readyHint, setReadyHint] = useState("");

  const play = () => {
    const launch: PlayLaunch =
      mode === "target"
        ? { mode, grid, difficulty }
        : { mode, grid, duration };
    saveLaunch(launch);
    track("game_started", { mode, grid });
    setReadyHint("Play route ships next — settings saved.");
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    setEnabled(next);
  };

  return (
    <Shell>
      <View className="mb-6 items-center">
        <Logo size={120} />
        <Text className="mt-3 font-display text-3xl font-semibold text-foreground">
          Couch Potato
        </Text>
        <Text className="mt-1 text-center font-body text-muted-foreground">
          Swipe letters. Find words. Stay on the couch.
        </Text>
      </View>

      <Text className="mb-4 font-body text-base text-foreground">
        Playing as {profile.name}
      </Text>

      <Text className="mb-2 font-display text-lg text-foreground">Mode</Text>
      <View className="mb-4 flex-row gap-2">
        <Button
          label="Target"
          variant={mode === "target" ? "primary" : "secondary"}
          className="flex-1"
          onPress={() => setMode("target")}
        />
        <Button
          label="Timed"
          variant={mode === "timed" ? "primary" : "secondary"}
          className="flex-1"
          onPress={() => setMode("timed")}
        />
      </View>

      <Text className="mb-2 font-display text-lg text-foreground">Grid</Text>
      <View className="mb-4 flex-row gap-2">
        {([4, 5, 6] as const).map((n) => (
          <Button
            key={n}
            label={`${n}×${n}`}
            variant={grid === n ? "primary" : "secondary"}
            className="flex-1"
            onPress={() => setGrid(n)}
          />
        ))}
      </View>

      {mode === "target" ? (
        <>
          <Text className="mb-2 font-display text-lg text-foreground">
            Difficulty
          </Text>
          <View className="mb-6 flex-row gap-2">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <Button
                key={d}
                label={d[0]!.toUpperCase() + d.slice(1)}
                variant={difficulty === d ? "primary" : "secondary"}
                className="flex-1"
                onPress={() => setDifficulty(d)}
              />
            ))}
          </View>
        </>
      ) : (
        <>
          <Text className="mb-2 font-display text-lg text-foreground">
            Duration
          </Text>
          <View className="mb-6 flex-row gap-2">
            {([30, 60, 90, 120] as const).map((d) => (
              <Button
                key={d}
                label={`${d}s`}
                variant={duration === d ? "primary" : "secondary"}
                className="flex-1"
                onPress={() => setDuration(d)}
              />
            ))}
          </View>
        </>
      )}

      <Button label="Play" onPress={play} className="mb-3" />
      <Button
        label={sound ? "Sound on" : "Sound off"}
        variant="secondary"
        onPress={toggleSound}
      />
      {readyHint ? (
        <Text className="mt-3 text-center font-body text-muted-foreground">
          {readyHint}
        </Text>
      ) : null}
    </Shell>
  );
}
