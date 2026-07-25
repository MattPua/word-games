import { Text, View } from "react-native";
import { Users } from "lucide-react";
import { Logo, Shell } from "@couch-potato/ui";
import {
  getActiveProfile,
  loadDevicePrefs,
  saveLaunch,
  setMenuMusicEnabled,
  setShowWordsLeft,
  setSoundEnabled,
  type PlayLaunch,
} from "../storage";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { setEnabled } from "cuelume";
import { applyMenuMusicEnabled } from "../menuMusic";
import { track } from "../analytics";
import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/tooltip";
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
  const prefs = loadDevicePrefs();
  const [sound, setSound] = useState(prefs.soundEnabled);
  const [menuMusic, setMenuMusic] = useState(prefs.menuMusicEnabled);
  const [showWordsLeft, setShowWordsLeftState] = useState(prefs.showWordsLeft);

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

  const toggleMenuMusic = () => {
    const next = !menuMusic;
    setMenuMusic(next);
    setMenuMusicEnabled(next);
    applyMenuMusicEnabled(next);
  };

  const toggleWordsLeft = (next: boolean) => {
    setShowWordsLeftState(next);
    setShowWordsLeft(next);
  };

  return (
    <Shell className="cp-shell-lobby overflow-hidden pb-0 cp-fade-up">
      <div className="cp-shell-scroll cp-lobby min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-gutter-stable">
        <header className="cp-lobby-brand mb-4">
          <View className="cp-logo-float shrink-0">
            <Logo size={72} />
          </View>
          {/* Native h1/p — RN Text is inline on web and can mash title+tagline */}
          <div className="cp-lobby-brand-copy">
            <h1 className="cp-display">Couch Potato</h1>
            <p className="cp-lobby-tagline">
              Swipe letters. Find words. Stay on the couch.
            </p>
          </div>
        </header>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-body text-sm font-semibold text-foreground">
            Spud: {profile.name}
          </Text>
          <IconTooltip label="Couch crew">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Couch crew"
              onClick={() => navigate({ to: "/profiles" })}
            >
              <Users />
            </Button>
          </IconTooltip>
        </View>

        <HomeSetup
          mode={mode}
          grid={grid}
          topology={topology}
          minWordLength={minWordLength}
          difficulty={difficulty}
          duration={duration}
          showWordsLeft={showWordsLeft}
          onMode={setMode}
          onGrid={setGrid}
          onTopology={setTopology}
          onMinWordLength={setMinWordLength}
          onDifficulty={setDifficulty}
          onDuration={setDuration}
          onShowWordsLeft={toggleWordsLeft}
        />
        {/* Spacer so last cards clear the fade above Play */}
        <div className="h-3" aria-hidden />
      </div>

      <HomePlayBar
        onPlay={play}
        sound={sound}
        onToggleSound={toggleSound}
        menuMusic={menuMusic}
        onToggleMenuMusic={toggleMenuMusic}
      />
    </Shell>
  );
}
