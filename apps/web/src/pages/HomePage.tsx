import { BrandHeader, PotatoSnoreSvg, Shell } from "@couch-potato/ui";
import {
  getActiveProfile,
  loadDevicePrefs,
  loadLastRun,
  loadLaunch,
  saveLaunch,
  setCustomBlockedWords,
  type PlayLaunch,
} from "../storage";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { track } from "../analytics";
import { ChromeNav } from "@/components/ChromeNav";
import { HomePlayBar, HomeSetup } from "@/components/HomeSetup";
import { prefetchPlayPage } from "../playPrefetch";
import { playSearchFromLaunch } from "../playLaunchSearch";

export function HomePage() {
  const navigate = useNavigate();
  const profile = getActiveProfile();
  // Restore last-played lobby prefs (session launch, else durable last-launch).
  const [lobby] = useState(() => loadLaunch());
  const [mode, setMode] = useState(lobby.mode);
  const [grid, setGrid] = useState(lobby.grid);
  const [topology, setTopology] = useState(lobby.topology ?? "square");
  const [minWordLength, setMinWordLength] = useState(lobby.minWordLength ?? 3);
  const [difficulty, setDifficulty] = useState(lobby.difficulty ?? "easy");
  const [duration, setDuration] = useState(lobby.duration ?? 60);
  const [blockedWords, setBlockedWords] = useState(() => loadDevicePrefs().customBlockedWords);
  const hasLastResults = loadLastRun() != null;

  // Belt-and-suspenders with route beforeLoad (sync redirect preferred).
  const howToSeen = loadDevicePrefs().howToSeen;
  useEffect(() => {
    if (!howToSeen) {
      navigate({ to: "/how-to", replace: true });
    }
  }, [navigate, howToSeen]);

  const onBlockedWords = (next: string[]) => {
    setBlockedWords(next);
    setCustomBlockedWords(next);
  };

  if (!howToSeen) {
    return null;
  }

  /** Warm Play shell on intent only — never idle-prefetch (ENABLE rides with Play). */
  const warmPlay = () => {
    void prefetchPlayPage();
  };

  const play = () => {
    warmPlay();
    const launch: PlayLaunch =
      mode === "timed"
        ? { mode, grid, topology, duration, difficulty, minWordLength }
        : { mode, grid, topology, difficulty, minWordLength };
    saveLaunch(launch);
    track("game_started", { mode, grid, topology, minWordLength });
    navigate({ to: "/play", search: playSearchFromLaunch(launch) });
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col cp-fade-up">
      {/* Viewport-edge scroller — Shell is centered inside, not the scrollport. */}
      <div className="cp-shell-scroll min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
        <Shell className="cp-shell-lobby cp-lobby !h-auto min-h-full !flex-none">
          <BrandHeader
            className="mb-4"
            brandHeading
            mark={<PotatoSnoreSvg size={72} />}
            description="Swipe letters. Find words. Stay on the couch."
          />

          <div className="mb-3 flex flex-row items-center justify-between gap-2">
            <p className="min-w-0 flex-shrink truncate font-body text-sm font-semibold text-foreground">
              Spud: {profile.name}
            </p>
            <ChromeNav />
          </div>

          <HomeSetup
            mode={mode}
            grid={grid}
            topology={topology}
            minWordLength={minWordLength}
            difficulty={difficulty}
            duration={duration}
            blockedWords={blockedWords}
            onMode={setMode}
            onGrid={setGrid}
            onTopology={setTopology}
            onMinWordLength={setMinWordLength}
            onDifficulty={setDifficulty}
            onDuration={setDuration}
            onBlockedWords={onBlockedWords}
          />
          <div className="h-4" aria-hidden />
        </Shell>
      </div>

      {/* Sticky Play bar — same shell width, outside the scroller. */}
      <div className="w-full shrink-0">
        <Shell className="cp-shell-lobby !h-auto !flex-none pb-0 pt-0">
          <HomePlayBar
            onPlay={play}
            onWarmPlay={warmPlay}
            onLastResults={hasLastResults ? () => navigate({ to: "/results" }) : undefined}
          />
        </Shell>
      </div>
    </div>
  );
}
