import { PotatoSprite, Shell } from "@couch-potato/ui";
import {
  getActiveProfile,
  loadLastRun,
  saveLaunch,
  type PlayLaunch,
} from "../storage";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { track } from "../analytics";
import { BrandHeader } from "@/components/BrandHeader";
import { ChromeNav } from "@/components/ChromeNav";
import { HomePlayBar, HomeSetup } from "@/components/HomeSetup";

export function HomePage() {
  const navigate = useNavigate();
  const profile = getActiveProfile();
  const [mode, setMode] = useState<"target" | "timed" | "survival">("target");
  const [grid, setGrid] = useState<4 | 5 | 6>(4);
  const [topology, setTopology] = useState<"square" | "hex">("square");
  const [minWordLength, setMinWordLength] = useState<3 | 4 | 5>(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [duration, setDuration] = useState<30 | 60 | 90 | 120>(60);
  const hasLastResults = loadLastRun() != null;

  const play = () => {
    const launch: PlayLaunch =
      mode === "timed"
        ? { mode, grid, topology, duration, minWordLength }
        : { mode, grid, topology, difficulty, minWordLength };
    saveLaunch(launch);
    track("game_started", { mode, grid, topology, minWordLength });
    navigate({ to: "/play" });
  };

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col cp-fade-up">
      {/* Viewport-edge scroller — Shell is centered inside, not the scrollport. */}
      <div className="cp-shell-scroll min-h-0 w-full flex-1 overflow-y-auto overscroll-contain">
        <Shell className="cp-shell-lobby cp-lobby !h-auto min-h-full !flex-none">
          <BrandHeader
            className="mb-4"
            brandHeading
            mark={<PotatoSprite lobbyYawn size={72} />}
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
            onMode={setMode}
            onGrid={setGrid}
            onTopology={setTopology}
            onMinWordLength={setMinWordLength}
            onDifficulty={setDifficulty}
            onDuration={setDuration}
          />
          <div className="h-4" aria-hidden />
        </Shell>
      </div>

      {/* Sticky Play bar — same shell width, outside the scroller. */}
      <div className="w-full shrink-0">
        <Shell className="cp-shell-lobby !h-auto !flex-none pb-0 pt-0">
          <HomePlayBar
            onPlay={play}
            onLastResults={hasLastResults ? () => navigate({ to: "/results" }) : undefined}
          />
        </Shell>
      </div>
    </div>
  );
}
