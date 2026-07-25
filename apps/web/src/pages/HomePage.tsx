import { Text, View } from "react-native";
import { Logo, Shell } from "@couch-potato/ui";
import {
  getActiveProfile,
  loadDevicePrefs,
  saveLaunch,
  setSoundEnabled,
  type PlayLaunch,
} from "../storage";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setEnabled } from "cuelume";
import { track } from "../analytics";
import { Button } from "@/components/ui/button";
import { SegmentGroup } from "@/components/SegmentGroup";

export function HomePage() {
  const navigate = useNavigate();
  const profile = getActiveProfile();
  const [mode, setMode] = useState<"target" | "timed">("target");
  const [grid, setGrid] = useState<4 | 5 | 6>(4);
  const [minWordLength, setMinWordLength] = useState<3 | 4 | 5>(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy",
  );
  const [duration, setDuration] = useState<30 | 60 | 90 | 120>(60);
  const [sound, setSound] = useState(loadDevicePrefs().soundEnabled);

  const play = () => {
    const launch: PlayLaunch =
      mode === "target"
        ? { mode, grid, difficulty, minWordLength }
        : { mode, grid, duration, minWordLength };
    saveLaunch(launch);
    track("game_started", { mode, grid, minWordLength });
    navigate({ to: "/play" });
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

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-body text-base text-foreground">
          Playing as {profile.name}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/profiles" })}
        >
          Profiles
        </Button>
      </View>

      <Text className="mb-2 font-display text-lg text-foreground">Mode</Text>
      <SegmentGroup
        value={mode}
        onChange={setMode}
        options={[
          { value: "target", label: "Target" },
          { value: "timed", label: "Timed" },
        ]}
      />

      <Text className="mb-2 font-display text-lg text-foreground">Grid</Text>
      <SegmentGroup
        value={grid}
        onChange={setGrid}
        options={[
          { value: 4, label: "4×4" },
          { value: 5, label: "5×5" },
          { value: 6, label: "6×6" },
        ]}
      />

      <Text className="mb-2 font-display text-lg text-foreground">
        Min length
      </Text>
      <SegmentGroup
        value={minWordLength}
        onChange={setMinWordLength}
        options={[
          { value: 3, label: "3+" },
          { value: 4, label: "4+" },
          { value: 5, label: "5+" },
        ]}
      />

      {mode === "target" ? (
        <>
          <Text className="mb-2 font-display text-lg text-foreground">
            Difficulty
          </Text>
          <SegmentGroup
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
            ]}
          />
        </>
      ) : (
        <>
          <Text className="mb-2 font-display text-lg text-foreground">
            Duration
          </Text>
          <SegmentGroup
            value={duration}
            onChange={setDuration}
            options={[
              { value: 30, label: "30s" },
              { value: 60, label: "60s" },
              { value: 90, label: "90s" },
              { value: 120, label: "120s" },
            ]}
          />
        </>
      )}

      <Button size="lg" className="mb-3 w-full" onClick={play}>
        Play
      </Button>
      <Button variant="secondary" className="w-full" onClick={toggleSound}>
        {sound ? "Sound on" : "Sound off"}
      </Button>
    </Shell>
  );
}
