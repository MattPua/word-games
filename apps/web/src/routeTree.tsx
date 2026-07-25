import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { bind, setEnabled } from "cuelume";
import { HomePage } from "./pages/HomePage";
import { PlayPage } from "./pages/PlayPage";
import { ResultsPage } from "./pages/ResultsPage";
import { ProfilesPage } from "./pages/ProfilesPage";
import { loadDevicePrefs } from "./storage";
import { TooltipProvider } from "@/components/ui/tooltip";

function RootLayout() {
  useEffect(() => {
    bind();
    setEnabled(loadDevicePrefs().soundEnabled);
  }, []);

  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={200}>
      <div className="min-h-full bg-background text-foreground">
        <Outlet />
      </div>
    </TooltipProvider>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play",
  component: PlayPage,
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: ResultsPage,
});

const profilesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profiles",
  component: ProfilesPage,
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  playRoute,
  resultsRoute,
  profilesRoute,
]);
