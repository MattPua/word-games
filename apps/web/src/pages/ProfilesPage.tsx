import { Text, View } from "react-native";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Moon } from "lucide-react";
import { EmptyState, Shell } from "@couch-potato/ui";
import { PotatoBoard } from "../components/PotatoBoard";
import {
  createProfile,
  getActiveProfile,
  loadDevicePrefs,
  loadStore,
  renameProfile,
  setActiveProfile,
  setThemePreference,
} from "../storage";
import { applyTheme, resolveTheme } from "../theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export function ProfilesPage() {
  const navigate = useNavigate();
  const [, bump] = useState(0);
  const refresh = () => bump((n) => n + 1);
  const store = loadStore();
  const active = getActiveProfile();
  const [name, setName] = useState("");
  const prefs = loadDevicePrefs();
  const [themePref, setThemePref] = useState(prefs.themePreference);
  const darkMode = resolveTheme(themePref) === "dark";

  const setDarkModeOn = (next: boolean) => {
    const pref = next ? "dark" : "light";
    setThemePref(pref);
    setThemePreference(pref);
    applyTheme(pref);
  };

  return (
    <Shell className="cp-shell-scroll overflow-y-auto">
      <Text className="mb-4 font-display text-2xl text-foreground">Couch crew</Text>

      {store.profiles.length === 0 ? (
        <EmptyState
          showLogo
          title="Nobody on the couch"
          body="Add a spud so high scores have a home."
          className="mb-4"
        />
      ) : (
        store.profiles.map((p) => (
          <View
            key={p.id}
            className="mb-3 flex-row items-center justify-between rounded-ui bg-card px-3 py-2"
          >
            <View>
              <Text className="font-body text-base font-bold text-foreground">
                {p.name}
                {p.id === active.id ? " · on couch" : ""}
              </Text>
              <Text className="font-body text-sm text-muted-foreground">
                {p.gamesPlayed} runs · {p.wordsFound} words
              </Text>
            </View>
            <Button
              variant={p.id === active.id ? "secondary" : "default"}
              size="sm"
              disabled={p.id === active.id}
              onClick={() => {
                setActiveProfile(p.id);
                refresh();
              }}
            >
              {p.id === active.id ? "Seated" : "Sit here"}
            </Button>
          </View>
        ))
      )}

      <PotatoBoard profile={active} />

      <label
        htmlFor="crew-dark-mode"
        className={cn(
          "cp-pref-row mb-4 flex cursor-pointer items-center justify-between gap-3",
          darkMode && "cp-pref-row-on cp-select-pop",
        )}
      >
        <span className="flex min-w-0 items-start gap-2.5">
          <Moon
            className={cn(
              "cp-lobby-glyph mt-0.5 size-4 shrink-0",
              darkMode ? "text-secondary-foreground" : "text-muted-foreground",
            )}
            strokeWidth={2.25}
            aria-hidden
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="font-display text-sm font-bold text-foreground">Dark mode</span>
            <span className="font-body text-[0.65rem] leading-snug text-muted-foreground">
              Easier on the eyes for late-night sessions
            </span>
          </span>
        </span>
        <Switch
          id="crew-dark-mode"
          checked={darkMode}
          onCheckedChange={setDarkModeOn}
          aria-label={`Dark mode ${darkMode ? "on" : "off"}`}
        />
      </label>

      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name your spud"
        className="mb-2"
      />
      <Button
        className="mb-2 w-full"
        onClick={() => {
          createProfile(name);
          setName("");
          refresh();
        }}
      >
        Add to crew
      </Button>
      <Button
        variant="secondary"
        className="mb-2 w-full"
        onClick={() => {
          if (!name.trim()) return;
          renameProfile(active.id, name);
          setName("");
          refresh();
        }}
      >
        Rename seated
      </Button>
      <Button variant="ghost" className="w-full" onClick={() => navigate({ to: "/" })}>
        <ArrowLeft />
        Lobby
      </Button>
    </Shell>
  );
}
