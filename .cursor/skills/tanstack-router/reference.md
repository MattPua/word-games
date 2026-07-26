# TanStack Router — reference

Upstream guides (canonical API detail). Couch Potato **decisions** live in [SKILL.md](SKILL.md).

## Official guides

- [Code Splitting](https://tanstack.com/router/v1/docs/guide/code-splitting) — critical vs non-critical config; code-based `.lazy()`; `getRouteApi`
- [Automatic Code Splitting](https://tanstack.com/router/v1/docs/guide/automatic-code-splitting) — file-based + bundler plugin only (`autoCodeSplitting`). **Not used** in this repo
- [Preloading](https://tanstack.com/router/v1/docs/guide/preloading) — `intent` / `viewport` / `render`; `defaultPreloadDelay`; `preloadRoute` / `loadRouteChunk`
- [Document Head Management](https://tanstack.com/router/v1/docs/guide/document-head-management) — `head`, `HeadContent`, dedupe, SPA vs Start
- [Render Optimizations](https://tanstack.com/router/v1/docs/guide/render-optimizations) — structural sharing; fine-grained `select`
- [Static Route Data](https://tanstack.com/router/latest/docs/guide/static-route-data) — sync `staticData` vs async context

## Related repo files

| File | Role |
| --- | --- |
| `apps/web/src/routeTree.tsx` | Route tree, `LazyPage`, root layout, `HeadContent` |
| `apps/web/src/main.tsx` | `createRouter`, Register, default 404/error |
| `apps/web/src/seo.ts` | `pageHead` / titles / cold SEO strings |
| `apps/web/src/playPrefetch.ts` | Shared Play chunk import |
| `apps/web/src/playLaunchSearch.ts` | `/play` `validateSearch` + launch ↔ search |
| `apps/web/src/menuMusic.ts` | Path → music scene |
| `apps/web/src/pages/*` | Screen components |
| `apps/web/src/components/PlaySkeleton.tsx` | Play pending UI (`getRouteApi`) |
| `.cursor/skills/lighthouse/SKILL.md` | Lobby cold path / no idle Play prefetch |
| `.cursor/skills/loading-empty/SKILL.md` | Suspense fallbacks / skeletons |

## Critical vs lazy (from upstream)

**Stay eager (critical):** path parsing, search validation, loaders/`beforeLoad`, context, staticData, links/scripts/styles config.

**Safe to lazy:** `component`, `errorComponent`, `pendingComponent`, `notFoundComponent`.

Loaders are async boundaries already — splitting them adds a second hop; we don’t use loaders today.

## Code-based lazy (upstream pattern)

```tsx
// posts.lazy.tsx
export const Route = createLazyRoute("/posts")({
  component: PostsPage,
});

// routeTree
const postsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/posts",
}).lazy(() => import("./posts.lazy").then((d) => d.Route));
```

Our equivalent: keep config on `createRoute` and lazy only the page module via `React.lazy` + `LazyPage`.

## Preload strategies (upstream)

| Strategy | When |
| --- | --- |
| `intent` | Hover / touchstart on `Link` |
| `viewport` | `Link` enters viewport |
| `render` | `Link` mounts |

Default unused preload GC ~30s (`defaultPreloadMaxAge`). For external caches (React Query), set `defaultPreloadStaleTime: 0` — we don’t use Query for routes.

## Head (SPA)

Root must render `HeadContent`. Nested `head()` merges; later `title` / same `name`|`property` meta wins. We mostly set per-route title via `pageHead`.

## staticData vs context

| | staticData | context / beforeLoad |
| --- | --- | --- |
| Timing | Sync at route create | Can be async / per-nav |
| Use | Layout flags, crumb labels | Auth, fetched deps |

## Render select example

```tsx
// Good — only pathname
const pathname = useRouterState({ select: (s) => s.location.pathname });

// Object select — enable structural sharing if needed
const bit = playRouteApi.useSearch({
  select: (s) => ({ mode: s.mode, grid: s.grid }),
  structuralSharing: true,
});
```
