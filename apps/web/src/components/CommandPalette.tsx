import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  ALargeSmall,
  CircleHelp,
  CirclePlay,
  Eye,
  EyeOff,
  History,
  Medal,
  Moon,
  Music2,
  Settings,
  Sofa,
  Sun,
  Type,
  Users,
  Volume2,
  VolumeX,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { MusicOff } from "@/icons/MusicOff";
import { COMMAND_PALETTE_OPEN, consumeCommandPaletteWantOpen } from "../commandPaletteBus";
import { applyMenuMusicEnabled } from "../menuMusic";
import {
  loadDevicePrefs,
  loadLastRun,
  setFontPreference,
  setMenuMusicEnabled,
  setShowWordsLeft,
  setSoundEnabled,
  setThemePreference,
} from "../storage";
import { applyFontPreference, applyTheme, resolveTheme } from "../theme";
import { track, trackOptionsPrefChanged } from "../analytics";

type Dest = "/" | "/options" | "/profiles" | "/achievements" | "/results" | "/how-to";

type Jump = {
  to: Dest;
  label: string;
  keywords?: string;
  Icon: LucideIcon;
  /** When set, only show if true (e.g. last results). */
  when?: () => boolean;
};

type PrefAction = {
  id: string;
  label: string;
  keywords: string;
  Icon: LucideIcon;
  run: () => void;
};

const JUMPS: Jump[] = [
  { to: "/", label: "Lobby", keywords: "home play start", Icon: Sofa },
  { to: "/", label: "Play", keywords: "lobby home start run", Icon: CirclePlay },
  {
    to: "/how-to",
    label: "How to play",
    keywords: "tutorial tips coach swipe help",
    Icon: CircleHelp,
  },
  { to: "/options", label: "Options", keywords: "settings prefs look dark pixel", Icon: Settings },
  { to: "/profiles", label: "Couch crew", keywords: "profiles potato board", Icon: Users },
  { to: "/achievements", label: "Couch medals", keywords: "achievements trophies", Icon: Medal },
  {
    to: "/results",
    label: "Last haul",
    keywords: "results history score last run",
    Icon: History,
    when: () => loadLastRun() != null,
  },
];

/** One flip per pref: verb label = what selecting does (not current state). */
function prefActions(): PrefAction[] {
  const prefs = loadDevicePrefs();
  const lookDark = resolveTheme(prefs.themePreference) === "dark";
  const pixel = prefs.fontPreference === "pixel";
  const wordsLeft = prefs.showWordsLeft;
  const sfxOn = prefs.soundEnabled;
  const jamOn = prefs.menuMusicEnabled;

  return [
    {
      id: "look",
      label: lookDark ? "Switch Look to Day" : "Switch Look to Night",
      keywords: "look theme dark light day night appearance mode",
      Icon: lookDark ? Sun : Moon,
      run: () => {
        const next = lookDark ? "light" : "dark";
        setThemePreference(next);
        applyTheme(next);
        trackOptionsPrefChanged("look", next);
      },
    },
    {
      id: "titles",
      label: pixel ? "Use Clean type" : "Use Pixel type",
      keywords: "titles font type pixel clean jersey lexend display",
      Icon: pixel ? Type : ALargeSmall,
      run: () => {
        const next = pixel ? "clean" : "pixel";
        setFontPreference(next);
        applyFontPreference(next);
        trackOptionsPrefChanged("type", next);
      },
    },
    {
      id: "words-left",
      label: wordsLeft ? "Hide words left" : "Show words left",
      keywords: "words left remaining count eye hide show hud",
      Icon: wordsLeft ? EyeOff : Eye,
      run: () => {
        const next = !wordsLeft;
        setShowWordsLeft(next);
        trackOptionsPrefChanged("words_left", next ? "show" : "hide");
      },
    },
    {
      id: "sfx",
      label: sfxOn ? "Turn sound effects off" : "Turn sound effects on",
      keywords: "sfx sound mute unmute audio volume quiet",
      Icon: sfxOn ? VolumeX : Volume2,
      run: () => {
        const next = !sfxOn;
        setSoundEnabled(next);
        trackOptionsPrefChanged("sfx", next ? "on" : "off");
        void import("cuelume").then(({ bind, setEnabled }) => {
          bind();
          setEnabled(next);
        });
      },
    },
    {
      id: "lobby-jam",
      label: jamOn ? "Turn Lobby jam off" : "Turn Lobby jam on",
      keywords: "lobby jam music bgm soundtrack menu loop bed mute unmute audio",
      Icon: jamOn ? MusicOff : Music2,
      run: () => {
        const next = !jamOn;
        setMenuMusicEnabled(next);
        applyMenuMusicEnabled(next);
        trackOptionsPrefChanged("lobby_jam", next ? "on" : "off");
      },
    },
  ];
}

/** Global ⌘K / Ctrl+K chrome jump + Options pref toggles (cmdk CommandDialog). */
export function CommandPalette() {
  const [open, setOpen] = useState(() => consumeCommandPaletteWantOpen());
  const [prefs, setPrefs] = useState(prefActions);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      setOpen((v) => !v);
    };
    const onBus = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_OPEN, onBus);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_OPEN, onBus);
    };
  }, []);

  useEffect(() => {
    if (open) setPrefs(prefActions());
  }, [open]);

  const runJump = (to: Dest) => {
    setOpen(false);
    if (to === "/results") track("last_results_opened", { from: "palette" });
    void navigate({ to });
  };

  const runPref = (action: PrefAction) => {
    action.run();
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Jump or tweak Options…" />
      <CommandList>
        <CommandEmpty>Nothing matches that.</CommandEmpty>
        <CommandGroup heading="Chrome">
          {JUMPS.filter((j) => (j.when ? j.when() : true)).map((j) => (
            <CommandItem
              key={`${j.to}-${j.label}`}
              value={`${j.label} ${j.keywords ?? ""}`}
              onSelect={() => runJump(j.to)}
            >
              <j.Icon />
              <span>{j.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Options">
          {prefs.map((p) => (
            <CommandItem key={p.id} value={`${p.label} ${p.keywords}`} onSelect={() => runPref(p)}>
              <p.Icon />
              <span>{p.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
