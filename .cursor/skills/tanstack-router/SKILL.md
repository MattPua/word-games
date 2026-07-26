---
name: tanstack-router
description: >-
  Couch Potato TanStack Router conventions (code-based routes, lazy pages,
  head/SEO, search validation, preloading, render selects). Use when adding or
  changing routes, routeTree, navigate/Link, validateSearch, pageHead,
  getRouteApi, or router preloading / code-splitting.
---

# TanStack Router (Couch Potato)

Web app uses **code-based** TanStack Router (`@tanstack/react-router`) — **not** file-based routing / `@tanstack/router-plugin`. Do not enable `autoCodeSplitting` or migrate to `createFileRoute` unless the product explicitly switches.

Authoritative tree: `apps/web/src/routeTree.tsx` · boot: `apps/web/src/main.tsx`.

## Upstream docs (read when needed)

| Topic | Doc |
| --- | --- |
| Manual / code-based split | [Code Splitting](https://tanstack.com/router/v1/docs/guide/code-splitting) |
| File-based auto split (**N/A here**) | [Automatic Code Splitting](https://tanstack.com/router/v1/docs/guide/automatic-code-splitting) |
| Intent / viewport / render preload | [Preloading](https://tanstack.com/router/v1/docs/guide/preloading) |
| `head` / `HeadContent` | [Document Head Management](https://tanstack.com/router/v1/docs/guide/document-head-management) |
| `select` + structural sharing | [Render Optimizations](https://tanstack.com/router/v1/docs/guide/render-optimizations) |
| Sync route metadata | [Static Route Data](https://tanstack.com/router/latest/docs/guide/static-route-data) |

Deeper notes + patterns: [reference.md](reference.md).

## How we split code today

Critical config stays in `routeTree.tsx` (path, `validateSearch`, `head`). Page UI is **non-critical** → `React.lazy` + `LazyPage` (`Suspense`).

| Route | Load | Fallback |
| --- | --- | --- |
| `/how-to` | **Eager** `HowToPage` (cold redirect target — avoid 3G waterfall) | — |
| `/` lobby | Lazy `HomePage` | bare `aria-busy` div |
| `/play` | Lazy via `prefetchPlayPage()` | Lazy `PlaySkeleton` |
| Chrome (`/results`, `/profiles`, `/achievements`, `/options`) | Lazy page import | bare `aria-busy` div |
| 404 / error | Lazy in `main.tsx` defaults | `null` Suspense |

Root keeps sync `TooltipProvider` (IconTooltip requires it). **cuelume** stays in Play/Options/sounds (not root). How-to SFX = dynamic import so cuelume stays off cold how-to.

**Play warm path:** `apps/web/src/playPrefetch.ts` is the single `import("./pages/PlayPage")` — route lazy + lobby Play hover/focus/click share it. **Never idle-prefetch Play** (ENABLE dict is a dynamic import inside Play; idle warm pulled it onto lobby LH). See lighthouse skill.

```tsx
// New chrome page — mirror existing routes
const FooPage = lazy(() =>
  import("./pages/FooPage").then((m) => ({ default: m.FooPage })),
);

const fooRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/foo",
  component: () => <LazyPage Page={FooPage} />,
  head: () => pageHead("Foo label"), // game voice — seo.ts
});
// add to rootRoute.addChildren([...])
```

Optional TanStack-native split (same idea, unused here): `createRoute({...}).lazy(() => import('./foo.lazy').then(d => d.Route))` — only if we drop the `LazyPage` wrapper; keep one pattern per route.

## Head / SEO

- Cold HTML defaults: Vite `transformIndexHtml` + `apps/web/src/seo.ts`
- Per-screen title: route `head: () => pageHead("…")` → `meta: [{ title }]`
- Root renders `<HeadContent />` (SPA style — high in `RootLayout`)
- Player-facing titles: game voice, **no em dashes** (`ui.mdc`)
- **`OG_DESCRIPTION`:** swipe letters + free / no ads / play as much as you want. Meta `DESCRIPTION` can add the mode hooks. Don’t lead with mode slang or “No hints” / “Short sessions”. Social crawlers cache hard — expect delayed preview refresh after copy changes.

## Search params

- `/play` only: `validateSearch: validatePlaySearch` in `playLaunchSearch.ts`
- Pages/skeletons use `getRouteApi("/play")` — don’t import the route object into page chunks just for hooks
- Prefer field deps over whole `search` object identity when effects depend on launch

## Navigation & preload

- Prefer `useNavigate` / existing chrome buttons; `Link` is fine when adding true links
- Intent warm for Play = `onPointerEnter` / `onFocus` → `prefetchPlayPage()` (not router `defaultPreload` yet — `main.tsx` has no `defaultPreload`)
- If adding `defaultPreload: "intent"`, still **exclude** idle Play dict warm; preload must not pull ENABLE onto `/`
- Manual: `router.preloadRoute` / `loadRouteChunk` only when a real next-step route benefits

## Render less

- Subscribe narrowly: `useRouterState({ select: (s) => s.location.pathname })` (already in `RootLayout` / `ChromeNav`)
- `useSearch({ select: … })` when only one field matters
- Object-returning `select` → consider `structuralSharing: true` (or `defaultStructuralSharing` on the router) — JSON-compatible only

## staticData (optional)

Sync metadata on the route (`staticData: { … }`), read via `useMatches`. Good for layout flags (e.g. hide chrome) without loaders. Prefer over inventing parallel “route meta” maps. Type via `StaticDataRouteOption` module augmentation if we enforce shape.

We don’t use route `loader` / Start SSR today — localStorage + engine stay in components. Don’t add loaders “for TanStack fashion” unless data fetching needs the preload pipeline.

## Checklist: new route

1. Page under `apps/web/src/pages/` (or shared UI in `packages/ui`)
2. Lazy (unless lobby-critical) + `LazyPage` / Play skeleton
3. `createRoute` + `head: () => pageHead(…)` + `addChildren`
4. `menuMusicSceneForPath` if music should play on that path
5. Command palette / ChromeNav only if players need a jump
6. Search? → validate + `getRouteApi`
7. Prefetch? → intent only; keep ENABLE off lobby cold path
8. Docs: `AGENTS.md` product surface if lasting

## Anti-patterns

- File-based plugin / `autoCodeSplitting` without an explicit migration
- Static `import` of Play / dict into lobby or chrome
- Idle `prefetchPlayPage` / idle `preloadRoute({ to: "/play" })`
- Hand-editing document title outside `pageHead` / `seo.ts`
- Broad `useRouterState()` without `select`
- Duplicating launch parsing outside `playLaunchSearch.ts`
