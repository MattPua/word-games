import { Text, View } from "react-native";
import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Check, ChevronRight, Medal, Moon, Pencil, Sofa, UserPlus, UserRound } from "lucide-react";
import { EmptyState, Logo } from "@couch-potato/ui";
import { PotatoBoard } from "../components/PotatoBoard";
import { ScrollShell } from "../components/ScrollShell";
import { allTrackProgress, withGamesPlayed } from "../achievements";
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
  const medalsEarned = allTrackProgress(
    withGamesPlayed(active.achievements, active.gamesPlayed),
  ).reduce((sum, p) => sum + p.stage, 0);

  const setDarkModeOn = (next: boolean) => {
    const pref = next ? "dark" : "light";
    setThemePref(pref);
    setThemePreference(pref);
    applyTheme(pref);
  };

  return (
    <ScrollShell shellClassName="cp-shell-crew cp-crew cp-fade-up">
      <View className="cp-lobby-brand mb-5">
        <View className="cp-logo-float shrink-0">
          <Logo size={64} />
        </View>
        <div className="cp-lobby-brand-copy">
          <h1 className="cp-display text-2xl">Couch crew</h1>
          <p className="cp-lobby-tagline">Every spud, their scores, one shared couch.</p>
        </div>
      </View>

      <div className="cp-crew-columns mb-5 flex flex-col gap-5">
        <View className="cp-fade-up cp-stagger-1">
          {store.profiles.length === 0 ? (
            <EmptyState
              showLogo
              title="Nobody on the couch"
              body="Add a spud so high scores have a home."
            />
          ) : (
            store.profiles.map((p) => {
              const isActive = p.id === active.id;
              return (
                <View
                  key={p.id}
                  className={cn(
                    "cp-lobby-card mb-2.5 flex-row items-center justify-between gap-3 p-3.5",
                    isActive && "cp-lobby-card-active cp-select-pop",
                  )}
                >
                  <View className="min-w-0 flex-1 flex-row items-center gap-3">
                    <View
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-full",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <UserRound className="size-5" strokeWidth={2.25} aria-hidden />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text
                        className="font-display text-base font-bold text-foreground"
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                      <Text className="font-body text-xs text-muted-foreground">
                        {p.gamesPlayed} runs · {p.wordsFound} words
                      </Text>
                    </View>
                  </View>
                  <Button
                    variant={isActive ? "secondary" : "outline"}
                    size="sm"
                    disabled={isActive}
                    onClick={() => {
                      setActiveProfile(p.id);
                      refresh();
                    }}
                  >
                    {isActive ? (
                      <>
                        <Check className="size-3.5" aria-hidden />
                        Seated
                      </>
                    ) : (
                      "Sit here"
                    )}
                  </Button>
                </View>
              );
            })
          )}
        </View>

        <View className="flex flex-col gap-4 cp-fade-up cp-stagger-1">
          <button
            type="button"
            onClick={() => navigate({ to: "/achievements" })}
            className="cp-lobby-card flex w-full items-center justify-between gap-3 p-3.5 text-left"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary/25 text-secondary">
                <Medal className="cp-lobby-glyph size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-sm font-bold text-foreground">Couch medals</span>
                <span className="font-body text-xs text-muted-foreground">
                  {medalsEarned > 0
                    ? `${medalsEarned} medal${medalsEarned === 1 ? "" : "s"} earned. See the full haul`
                    : "No medals yet. Play a round to start the pile"}
                </span>
              </span>
            </span>
            <ChevronRight
              className="cp-lobby-glyph size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
          </button>

          <label
            htmlFor="crew-dark-mode"
            className={cn(
              "cp-pref-row flex cursor-pointer items-center justify-between gap-3",
              darkMode && "cp-pref-row-on cp-select-pop",
            )}
          >
            <span className="flex min-w-0 items-start gap-2.5">
              <Moon
                className={cn(
                  "cp-lobby-glyph mt-0.5 size-4 shrink-0",
                  darkMode ? "text-secondary" : "text-icon-muted-foreground",
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
        </View>
      </div>

      <View className="cp-fade-up cp-stagger-2">
        <PotatoBoard profile={active} />
      </View>

      <View className="mb-2 cp-fade-up cp-stagger-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name your spud"
          className="mb-2"
        />
        <View className="flex-row gap-2">
          <Button
            className="flex-1 gap-1.5"
            onClick={() => {
              createProfile(name);
              setName("");
              refresh();
            }}
          >
            <UserPlus className="size-4" aria-hidden />
            Add to crew
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={() => {
              if (!name.trim()) return;
              renameProfile(active.id, name);
              setName("");
              refresh();
            }}
          >
            <Pencil className="size-4" aria-hidden />
            Rename seated
          </Button>
        </View>
      </View>

      <Button
        variant="ghost"
        className="w-full cp-fade-up cp-stagger-3"
        onClick={() => navigate({ to: "/" })}
      >
        <Sofa />
        Back to lobby
      </Button>
    </ScrollShell>
  );
}
