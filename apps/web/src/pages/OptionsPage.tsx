import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ALargeSmall,
  CircleHelp,
  Eye,
  EyeOff,
  Moon,
  Music2,
  Sofa,
  Sun,
  Type,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import { LogoOptions, PrefChoiceGroup, ScrollShell } from "@couch-potato/ui";
import {
  loadDevicePrefs,
  setFontPreference,
  setHowToSeen,
  setMenuMusicEnabled,
  setShowWordsLeft,
  setSoundEnabled,
  setThemePreference,
} from "../storage";
import { applyMenuMusicEnabled } from "../menuMusic";
import { applyFontPreference, applyTheme, resolveTheme } from "../theme";
import { trackOptionsPrefChanged } from "../analytics";
import { Button } from "@/components/ui/button";
import { MusicOff } from "@/icons/MusicOff";

function OptionsPanel({
  title,
  Icon,
  children,
}: {
  title: string;
  Icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="cp-options-panel cp-lobby-card p-3.5">
      <h2 className="mb-3 flex items-center gap-2 font-display text-base font-bold text-foreground">
        <Icon
          className="cp-lobby-glyph size-4 shrink-0 text-icon-muted-foreground"
          strokeWidth={2.25}
          aria-hidden
        />
        {title}
      </h2>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

/** Device prefs — pause-menu panels + choice cards (not a settings form). */
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
    trackOptionsPrefChanged("words_left", next);
  };

  const setSfxChoice = (next: "on" | "off") => {
    const enabled = next === "on";
    setSound(enabled);
    setSoundEnabled(enabled);
    trackOptionsPrefChanged("sfx", next);
    void import("cuelume").then(({ bind, setEnabled }) => {
      bind();
      setEnabled(enabled);
    });
  };

  const setJamChoice = (next: "on" | "off") => {
    const enabled = next === "on";
    setMenuMusic(enabled);
    setMenuMusicEnabled(enabled);
    applyMenuMusicEnabled(enabled);
    trackOptionsPrefChanged("lobby_jam", next);
  };

  const setAppearance = (next: "light" | "dark") => {
    setThemePref(next);
    setThemePreference(next);
    applyTheme(next);
    trackOptionsPrefChanged("look", next);
  };

  const setTypeFace = (next: "clean" | "pixel") => {
    setFontPref(next);
    setFontPreference(next);
    applyFontPreference(next);
    trackOptionsPrefChanged("type", next);
  };

  return (
    <ScrollShell shellClassName="cp-shell-options cp-options cp-fade-up">
      <div className="cp-options-menu">
        <header className="cp-options-hero cp-fade-up">
          <LogoOptions size={72} className="cp-options-hero-mark shrink-0" />
          <div className="cp-options-hero-copy min-w-0">
            <h1 className="cp-page-title">Options</h1>
            <p className="cp-page-lede">Tune how the couch looks, sounds, and plays.</p>
          </div>
        </header>

        <div
          className="cp-options-prefs mb-5 cp-fade-up cp-stagger-1"
          aria-label="Options"
          data-testid="options-prefs"
        >
          <OptionsPanel title="Vibe" Icon={Sun}>
            <PrefChoiceGroup
              label="Look"
              value={appearance}
              onChange={setAppearance}
              data-testid="options-look"
              options={[
                { value: "light", label: "Light", Icon: Sun },
                { value: "dark", label: "Dark", Icon: Moon },
              ]}
            />
            <PrefChoiceGroup
              label="Type"
              value={fontPref}
              onChange={setTypeFace}
              data-testid="options-titles"
              options={[
                { value: "clean", label: "Clean", Icon: Type },
                { value: "pixel", label: "Pixel", Icon: ALargeSmall },
              ]}
            />
            <PrefChoiceGroup
              label="Words left"
              value={wordsLeft}
              onChange={setWordsLeftChoice}
              data-testid="options-words-left"
              options={[
                { value: "hide", label: "Hide", hint: "Play blind", Icon: EyeOff },
                { value: "show", label: "Show", hint: "Count still to find", Icon: Eye },
              ]}
            />
          </OptionsPanel>

          <OptionsPanel title="Noise" Icon={Volume2}>
            <div className="cp-options-panel-split">
              <PrefChoiceGroup
                label="Sound effects"
                value={sfx}
                onChange={setSfxChoice}
                data-testid="options-sfx"
                options={[
                  { value: "off", label: "Off", Icon: VolumeX },
                  { value: "on", label: "On", Icon: Volume2 },
                ]}
              />
              <PrefChoiceGroup
                label="Background music"
                value={jam}
                onChange={setJamChoice}
                data-testid="options-music"
                options={[
                  { value: "off", label: "Off", Icon: MusicOff },
                  { value: "on", label: "On", Icon: Music2 },
                ]}
              />
            </div>
          </OptionsPanel>
        </div>

        <div className="cp-options-actions cp-fade-up cp-stagger-2">
          <Button
            variant="secondary"
            className="cp-chrome-cta gap-2"
            data-testid="options-replay-howto"
            onClick={() => {
              setHowToSeen(false);
              navigate({ to: "/how-to" });
            }}
          >
            <CircleHelp className="size-4 shrink-0" aria-hidden />
            View Tutorial
          </Button>
          <Button variant="outline" className="cp-chrome-cta" onClick={() => navigate({ to: "/" })}>
            <Sofa />
            Back to lobby
          </Button>
        </div>
      </div>
    </ScrollShell>
  );
}
