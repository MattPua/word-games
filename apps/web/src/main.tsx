import "./index.css";
import { StrictMode, Suspense, lazy, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree";
import { initAnalytics } from "./analytics";
import { registerOfflineShell } from "./registerOffline";

initAnalytics();
registerOfflineShell();

const NotFoundPage = lazy(() =>
  import("./pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);
const ErrorPage = lazy(() =>
  import("./pages/ErrorPage").then((m) => ({ default: m.ErrorPage })),
);
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
  defaultNotFoundComponent: () => (
    <Suspense fallback={null}>
      <NotFoundPage />
    </Suspense>
  ),
  defaultErrorComponent: (props) => (
    <Suspense fallback={null}>
      <ErrorPage {...props} />
    </Suspense>
  ),
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
