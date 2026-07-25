import {
  createRootRoute,
  createRoute,
  HeadContent,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { bind, setEnabled } from "cuelume";
import { HomePage } from "./pages/HomePage";
import { PlayPage } from "./pages/PlayPage";
import { ResultsPage } from "./pages/ResultsPage";
import { ProfilesPage } from "./pages/ProfilesPage";
import { AchievementsPage } from "./pages/AchievementsPage";
import { loadDevicePrefs } from "./storage";
import { applyMenuMusicEnabled, menuMusicSceneForPath, setMenuMusicScene } from "./menuMusic";
import { applyTheme } from "./theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_TITLE, pageHead } from "./seo";

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    bind();
    const prefs = loadDevicePrefs();
    setEnabled(prefs.soundEnabled);
    applyMenuMusicEnabled(prefs.menuMusicEnabled);
    applyTheme(prefs.themePreference);
  }, []);

  useEffect(() => {
    setMenuMusicScene(menuMusicSceneForPath(pathname));
  }, [pathname]);

  // Only relevant while the pref is "system" — explicit light/dark overrides ignore OS changes.
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const prefs = loadDevicePrefs();
      if (prefs.themePreference === "system") applyTheme("system");
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={200}>
      <HeadContent />
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <Outlet />
      </div>
    </TooltipProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
  head: () => ({
    meta: [{ title: DEFAULT_TITLE }],
  }),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
  head: () => pageHead("Lobby"),
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play",
  component: PlayPage,
  head: () => pageHead("Play"),
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: ResultsPage,
  head: () => pageHead("Results"),
});

const profilesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profiles",
  component: ProfilesPage,
  head: () => pageHead("Couch crew"),
});

const achievementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/achievements",
  component: AchievementsPage,
  head: () => pageHead("Couch medals"),
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  playRoute,
  resultsRoute,
  profilesRoute,
  achievementsRoute,
]);
