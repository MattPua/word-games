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
  const [topology, setTopology] = useState<"square" | "hex">("square");
  const [minWordLength, setMinWordLength] = useState<3 | 4 | 5>(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy",
  );
  const [duration, setDuration] = useState<30 | 60 | 90 | 120>(60);
  const [sound, setSound] = useState(loadDevicePrefs().soundEnabled);

  const play = () => {
    const launch: PlayLaunch =
      mode === "target"
        ? { mode, grid, topology, difficulty, minWordLength }
        : { mode, grid, topology, duration, minWordLength };
    saveLaunch(launch);
    track("game_started", { mode, grid, topology, minWordLength });
    navigate({ to: "/play" });
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    setEnabled(next);
  };

  return (
    <Shell className="cp-fade-up">
      <View className="mb-8 items-center">
        <View className="cp-logo-float">
          <Logo size={128} />
        </View>
        <Text className="cp-display mt-4">Couch Potato</Text>
        <Text className="mt-2 max-w-[18rem] text-center font-body text-base leading-relaxed text-muted-foreground">
          Swipe letters. Find words. Stay on the couch.
        </Text>
      </View>

      <View className="mb-5 flex-row items-center justify-between">
        <Text className="font-body text-base font-semibold text-foreground">
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

      <Text className="cp-section-label">Mode</Text>
      <SegmentGroup
        value={mode}
        onChange={setMode}
        options={[
          { value: "target", label: "Target" },
          { value: "timed", label: "Timed" },
        ]}
      />

      <Text className="cp-section-label">Grid</Text>
      <SegmentGroup
        value={grid}
        onChange={setGrid}
        options={[
          { value: 4, label: "4×4" },
          { value: 5, label: "5×5" },
          { value: 6, label: "6×6" },
        ]}
      />

      <Text className="cp-section-label">Shape</Text>
      <SegmentGroup
        value={topology}
        onChange={setTopology}
        options={[
          { value: "square", label: "Square" },
          { value: "hex", label: "B-comb" },
        ]}
      />

      <Text className="cp-section-label">Min length</Text>
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
        <div key="target" className="cp-option-swap">
          <Text className="cp-section-label">Difficulty</Text>
          <SegmentGroup
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
            ]}
          />
        </div>
      ) : (
        <div key="timed" className="cp-option-swap">
          <Text className="cp-section-label">Duration</Text>
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
        </div>
      )}

      <Button size="lg" className="mb-3 mt-2 w-full" onClick={play}>
        Play
      </Button>
      <Button variant="secondary" className="w-full" onClick={toggleSound}>
        {sound ? "Sound on" : "Sound off"}
      </Button>
    </Shell>
  );
}
