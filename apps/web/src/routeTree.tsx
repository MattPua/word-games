import { createRootRoute, createRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";
import { bind, setEnabled } from "cuelume";
import { HomePage } from "./pages/HomePage";
import { loadDevicePrefs } from "./storage";

function RootLayout() {
  useEffect(() => {
    bind();
    setEnabled(loadDevicePrefs().soundEnabled);
  }, []);

  return (
    <div className="min-h-full bg-background text-foreground">
      <Outlet />
    </div>
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

export const routeTree = rootRoute.addChildren([indexRoute]);
