import { Text, View } from "react-native";
import { Users } from "lucide-react";
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
import { HomePlayBar, HomeSetup } from "@/components/HomeSetup";

export function HomePage() {
  const navigate = useNavigate();
  const profile = getActiveProfile();
  const [mode, setMode] = useState<"target" | "timed">("target");
  const [grid, setGrid] = useState<4 | 5 | 6>(4);
  const [topology, setTopology] = useState<"square" | "hex">("square");
  const [minWordLength, setMinWordLength] = useState<3 | 4 | 5>(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
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
      <View className="mb-6 items-center">
        <View className="cp-logo-float">
          <Logo size={112} />
        </View>
        <Text className="cp-display mt-3">Couch Potato</Text>
        <Text className="mt-1.5 max-w-[18rem] text-center font-body text-sm leading-relaxed text-muted-foreground">
          Swipe letters. Find words. Stay on the couch.
        </Text>
      </View>

      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-body text-sm font-semibold text-foreground">
          Playing as {profile.name}
        </Text>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Profiles"
          title="Profiles"
          onClick={() => navigate({ to: "/profiles" })}
        >
          <Users />
        </Button>
      </View>

      <HomeSetup
        mode={mode}
        grid={grid}
        topology={topology}
        minWordLength={minWordLength}
        difficulty={difficulty}
        duration={duration}
        onMode={setMode}
        onGrid={setGrid}
        onTopology={setTopology}
        onMinWordLength={setMinWordLength}
        onDifficulty={setDifficulty}
        onDuration={setDuration}
      />

      <HomePlayBar onPlay={play} sound={sound} onToggleSound={toggleSound} />
    </Shell>
  );
}
