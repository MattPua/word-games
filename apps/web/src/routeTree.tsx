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
import { loadDevicePrefs } from "./storage";
import { applyMenuMusicEnabled, menuMusicSceneForPath, setMenuMusicScene } from "./menuMusic";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DEFAULT_TITLE, pageHead } from "./seo";

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    bind();
    const prefs = loadDevicePrefs();
    setEnabled(prefs.soundEnabled);
    applyMenuMusicEnabled(prefs.menuMusicEnabled);
  }, []);

  useEffect(() => {
    setMenuMusicScene(menuMusicSceneForPath(pathname));
  }, [pathname]);

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

export const routeTree = rootRoute.addChildren([
  indexRoute,
  playRoute,
  resultsRoute,
  profilesRoute,
]);
