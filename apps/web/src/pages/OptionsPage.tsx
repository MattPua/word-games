import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ALargeSmall,
  Eye,
  EyeOff,
  Moon,
  Music2,
  Sofa,
  Sun,
  Type,
  Volume2,
  VolumeX,
} from "lucide-react";
import { LogoOptions } from "@couch-potato/ui";
import { setEnabled } from "cuelume";
import {
  loadDevicePrefs,
  setFontPreference,
  setMenuMusicEnabled,
  setShowWordsLeft,
  setSoundEnabled,
  setThemePreference,
} from "../storage";
import { applyMenuMusicEnabled } from "../menuMusic";
import { applyFontPreference, applyTheme, resolveTheme } from "../theme";
import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { ChromeNav } from "@/components/ChromeNav";
import { PrefChoiceGroup } from "@/components/PrefChoiceGroup";
import { ScrollShell } from "@/components/ScrollShell";
import { MusicOff } from "@/icons/MusicOff";

/** Device prefs — choice cards; widens + multi-col on desktop like other chrome. */
export function OptionsPage() {
  const navigate = useNavigate();
  const prefs = loadDevicePrefs();
  const [showWordsLeft, setShowWordsLeftState] = useState(prefs.showWordsLeft);
  const [sound, setSound] = useState(prefs.soundEnabled);
  const [menuMusic, setMenuMusic] = useState(prefs.menuMusicEnabled);
  const [themePref, setThemePref] = useState(prefs.themePreference);
  const [fontPref, setFontPref] = useState(prefs.fontPreference);
  const appearance = resolveTheme(themePref) === "dark" ? "dark" : "light";
  const wordsLeft = showWordsLeft ? "show" : "hide";
  const sfx = sound ? "on" : "off";
  const jam = menuMusic ? "on" : "off";

  const setWordsLeftChoice = (next: "hide" | "show") => {
    const enabled = next === "show";
    setShowWordsLeftState(enabled);
    setShowWordsLeft(enabled);
  };

  const setSfxChoice = (next: "on" | "off") => {
    const enabled = next === "on";
    setSound(enabled);
    setSoundEnabled(enabled);
    setEnabled(enabled);
  };

  const setJamChoice = (next: "on" | "off") => {
    const enabled = next === "on";
    setMenuMusic(enabled);
    setMenuMusicEnabled(enabled);
    applyMenuMusicEnabled(enabled);
  };

  const setAppearance = (next: "light" | "dark") => {
    setThemePref(next);
    setThemePreference(next);
    applyTheme(next);
  };

  const setTypeFace = (next: "clean" | "pixel") => {
    setFontPref(next);
    setFontPreference(next);
    applyFontPreference(next);
  };

  return (
    <ScrollShell shellClassName="cp-shell-options cp-options cp-fade-up">
      <div className="mb-3 flex justify-end">
        <ChromeNav />
      </div>
      <BrandHeader
        className="mb-4 cp-fade-up"
        mark={<LogoOptions size={72} />}
        title="Options"
      />

      <div
        className="cp-options-prefs mb-5 cp-fade-up cp-stagger-1"
        aria-label="Options"
        data-testid="options-prefs"
      >
        <PrefChoiceGroup
          label="Look"
          value={appearance}
          onChange={setAppearance}
          data-testid="options-look"
          options={[
            {
              value: "light",
              label: "Day",
              hint: "Bright couch light",
              Icon: Sun,
            },
            {
              value: "dark",
              label: "Night",
              hint: "Late-night sessions",
              Icon: Moon,
            },
          ]}
        />

        <PrefChoiceGroup
          label="Titles"
          value={fontPref}
          onChange={setTypeFace}
          data-testid="options-titles"
          options={[
            {
              value: "clean",
              label: "Clean",
              Icon: Type,
            },
            {
              value: "pixel",
              label: "Pixel",
              Icon: ALargeSmall,
            },
          ]}
        />

        <PrefChoiceGroup
          label="Words left"
          value={wordsLeft}
          onChange={setWordsLeftChoice}
          data-testid="options-words-left"
          options={[
            {
              value: "hide",
              label: "Hide",
              hint: "Play blind",
              Icon: EyeOff,
            },
            {
              value: "show",
              label: "Show",
              hint: "Count still to find",
              Icon: Eye,
            },
          ]}
        />

        <PrefChoiceGroup
          label="SFX"
          value={sfx}
          onChange={setSfxChoice}
          data-testid="options-sfx"
          options={[
            {
              value: "off",
              label: "Off",
              hint: "Quiet couch",
              Icon: VolumeX,
            },
            {
              value: "on",
              label: "On",
              hint: "Word pops + taps",
              Icon: Volume2,
            },
          ]}
        />

        <PrefChoiceGroup
          label="Lobby jam"
          value={jam}
          onChange={setJamChoice}
          data-testid="options-music"
          options={[
            {
              value: "off",
              label: "Off",
              hint: "Silent lobby",
              Icon: MusicOff,
            },
            {
              value: "on",
              label: "On",
              hint: "Menu loop bed",
              Icon: Music2,
            },
          ]}
        />
      </div>

      <Button
        variant="outline"
        className="cp-chrome-cta"
        onClick={() => navigate({ to: "/" })}
      >
        <Sofa />
        Back to lobby
      </Button>
    </ScrollShell>
  );
}
