import {
  createRootRoute,
  createRoute,
  HeadContent,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState, type ComponentType, type ReactNode } from "react";
import { loadDevicePrefs } from "./storage";
import { applyMenuMusicEnabled, menuMusicSceneForPath, setMenuMusicScene } from "./menuMusic";
import { applyFontPreference, applyTheme } from "./theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChromeTopBar } from "@/components/ChromeTopBar";
import { COMMAND_PALETTE_OPEN, markCommandPaletteWantOpen } from "./commandPaletteBus";
import { ABOUT_OPEN, markAboutWantOpen } from "./aboutBus";
import { DEFAULT_TITLE, pageHead } from "./seo";
import { prefetchPlayPage } from "./playPrefetch";
import { validatePlaySearch } from "./playLaunchSearch";
import { HowToPage } from "./pages/HowToPage";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PlayPage = lazy(() => prefetchPlayPage().then((m) => ({ default: m.PlayPage })));
const PlaySkeleton = lazy(() =>
  import("@/components/PlaySkeleton").then((m) => ({ default: m.PlaySkeleton })),
);
const ResultsPage = lazy(() =>
  import("./pages/ResultsPage").then((m) => ({ default: m.ResultsPage })),
);
const ProfilesPage = lazy(() =>
  import("./pages/ProfilesPage").then((m) => ({ default: m.ProfilesPage })),
);
const AchievementsPage = lazy(() =>
  import("./pages/AchievementsPage").then((m) => ({ default: m.AchievementsPage })),
);
const OptionsPage = lazy(() =>
  import("./pages/OptionsPage").then((m) => ({ default: m.OptionsPage })),
);
const CommandPalette = lazy(() =>
  import("@/components/CommandPalette").then((m) => ({ default: m.CommandPalette })),
);
const AboutDialog = lazy(() =>
  import("@/components/AboutDialog").then((m) => ({ default: m.AboutDialog })),
);

/** Minimal cold fallback — keeps LoadingPotato / PlaySkeleton off the root chunk. */
const coldFallback = (label: string) => (
  <div className="flex flex-1" aria-busy="true" aria-label={label} />
);

function LazyPage({ Page, fallback }: { Page: ComponentType; fallback?: ReactNode }) {
  return (
    <Suspense fallback={fallback ?? coldFallback("Loading")}>
      <Page />
    </Suspense>
  );
}

/**
 * Mount ⌘K palette on first open only — keeps cmdk/dialog off lobby LCP.
 */
function DeferredCommandPalette() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      markCommandPaletteWantOpen();
      setMount(true);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== "k" || !(e.metaKey || e.ctrlKey)) return;
      e.preventDefault();
      markCommandPaletteWantOpen();
      setMount(true);
    };
    window.addEventListener(COMMAND_PALETTE_OPEN, onOpen);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(COMMAND_PALETTE_OPEN, onOpen);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!mount) return null;
  return (
    <Suspense fallback={null}>
      <CommandPalette />
    </Suspense>
  );
}

/** Mount About on first open only — keeps dialog off lobby LCP. */
function DeferredAboutDialog() {
  const [mount, setMount] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      markAboutWantOpen();
      setMount(true);
    };
    window.addEventListener(ABOUT_OPEN, onOpen);
    return () => window.removeEventListener(ABOUT_OPEN, onOpen);
  }, []);

  if (!mount) return null;
  return (
    <Suspense fallback={null}>
      <AboutDialog />
    </Suspense>
  );
}

/** Persistent site bar — play / how-to own their chrome; lobby + chrome pages share it. */
function showChromeTopBar(pathname: string) {
  return pathname !== "/play" && pathname !== "/how-to";
}

function RootLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const chromeBar = showChromeTopBar(pathname);

  useEffect(() => {
    const prefs = loadDevicePrefs();
    applyMenuMusicEnabled(prefs.menuMusicEnabled);
    applyTheme(prefs.themePreference);
    applyFontPreference(prefs.fontPreference);
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
        {/* Outside `.cp-page-body` so View Transitions don't settle the site bar. */}
        {chromeBar ? (
          <div className="cp-chrome-top-host">
            <div className="cp-chrome-top-inner">
              <ChromeTopBar hideBrand={pathname === "/"} />
            </div>
          </div>
        ) : null}
        <main className="cp-page-body flex min-h-0 flex-1 flex-col">
          <Outlet />
        </main>
        <DeferredCommandPalette />
        <DeferredAboutDialog />
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
  beforeLoad: () => {
    // Sync redirect — avoid empty Home paint then client navigate (hurts LCP).
    if (!loadDevicePrefs().howToSeen) {
      throw redirect({ to: "/how-to" });
    }
  },
  component: () => <LazyPage Page={HomePage} fallback={coldFallback("Loading lobby")} />,
  head: () => ({
    ...pageHead("Lobby"),
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/logo-snore.webp",
        type: "image/webp",
      },
    ],
  }),
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play",
  validateSearch: (search: Record<string, unknown>) => validatePlaySearch(search),
  component: () => (
    <LazyPage
      Page={PlayPage}
      fallback={
        <Suspense fallback={coldFallback("Spinning up the board")}>
          <PlaySkeleton />
        </Suspense>
      }
    />
  ),
  head: () => pageHead("Play"),
});

const resultsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/results",
  component: () => <LazyPage Page={ResultsPage} />,
  head: () => pageHead("Results"),
});

const profilesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profiles",
  component: () => <LazyPage Page={ProfilesPage} />,
  head: () => pageHead("Couch crew"),
});

const achievementsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/achievements",
  component: () => <LazyPage Page={AchievementsPage} />,
  head: () => pageHead("Couch medals"),
});

const optionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/options",
  component: () => <LazyPage Page={OptionsPage} />,
  head: () => pageHead("Options"),
});

const howToRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/how-to",
  // Eager — cold visits redirect here; lazy how-to added a 3G JS waterfall (hurts FCP/LCP).
  component: HowToPage,
  head: () => ({
    ...pageHead("How to play in 30 seconds"),
    links: [
      {
        rel: "preload",
        as: "image",
        href: "/logo-snore.webp",
        type: "image/webp",
      },
    ],
  }),
});

export const routeTree = rootRoute.addChildren([
  indexRoute,
  playRoute,
  resultsRoute,
  profilesRoute,
  achievementsRoute,
  optionsRoute,
  howToRoute,
]);
