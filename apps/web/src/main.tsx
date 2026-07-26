import "./index.css";
import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree";
import { initAnalytics } from "./analytics";
import {
  clearStaleChunkReloadGuard,
  recoverFromStaleChunk,
} from "./chunkRecovery";
import { ErrorPage } from "./pages/ErrorPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { registerOfflineShell } from "./registerOffline";

initAnalytics();
registerOfflineShell();
clearStaleChunkReloadGuard();

/** Toaster stays lazy — never on the error / crash path. */
const Toaster = lazy(() =>
  import("@/components/ui/sonner").then((m) => ({ default: m.Toaster })),
);

function DeferredToaster() {
  const [mount, setMount] = useState(false);
  useEffect(() => {
    const boot = () => setMount(true);
    const ric = window.requestIdleCallback?.bind(window);
    if (ric) {
      const id = ric(boot, { timeout: 3000 });
      return () => window.cancelIdleCallback?.(id);
    }
    const id = globalThis.setTimeout(boot, 1);
    return () => globalThis.clearTimeout(id);
  }, []);
  if (!mount) return null;
  return (
    <Suspense fallback={null}>
      <Toaster position="top-center" />
    </Suspense>
  );
}

const router = createRouter({
  routeTree,
  /**
   * Soft page in/out via View Transitions API (see `.cp-page-body` + `cp-settle*` in index.css).
   * Site bar lives outside the VT group so chrome↔chrome nav keeps the header still.
   */
  defaultViewTransition: {
    types: ({ fromLocation, toLocation, pathChanged }) => {
      if (!pathChanged) return false;
      if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return false;
      }
      if (!fromLocation) return ["cp-settle"];
      const fromIndex = fromLocation.state.__TSR_index;
      const toIndex = toLocation.state.__TSR_index;
      if (typeof fromIndex === "number" && typeof toIndex === "number" && fromIndex > toIndex) {
        return ["cp-settle-back"];
      }
      return ["cp-settle"];
    },
  },
  // Eager — never depend on a second hashed chunk to show 404 / report a crash.
  defaultNotFoundComponent: () => <NotFoundPage />,
  defaultErrorComponent: (props) => {
    if (recoverFromStaleChunk(props.error, { surface: "router_error" })) {
      return null;
    }
    return <ErrorPage {...props} />;
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
    <DeferredToaster />
  </StrictMode>,
);
