# Decisions & taste

Soft prefs and rejected paths. **Not** game rules (those stay in `AGENTS.md` / `engine.mdc`). Keep bullets short; date when useful.

## Locked

- **Web is the product surface.** Default `packages/ui` files = DOM + Tailwind. Expo forks = `*.native.tsx` only. No new `*.web.tsx`.
- **No NativeWind / react-native-web on `apps/web`.** Cold path is DOM. NativeWind only if/when Expo play needs it.
- **Mobile Expo** is a deferred smoke stub — don’t block web work on a green mobile build.
- **Mascot images:** LCP heroes (`fetchPriority="high"`, snore) stay eager + preload; other `PotatoMark`s default `loading="lazy"`. Interactive poke defers cheer WebP until idle `onLoad` / first poke.
- **Cold path:** eager `/how-to` (first-visit redirect); lazy lobby/chrome; Lexend 400+700 only; cuelume not on root boot. Keep sync `TooltipProvider` (IconTooltip requires it).

## Rejected / don’t redo

- Idle-prefetching `/play` from the lobby (ENABLE dict lands on cold LH network).
- Shipping full sprite atlas sheets in `apps/web/public` when cropped cell WebPs exist.
- NativeWind `jsxImportSource` on web to share RN `className` (cost ~216KB gzip RN-web).
- Parallel design system under `apps/web/src/components` (beyond shadcn + route composition).

## Open / deferred

- Full Expo play + NativeWind on native.
- App-knowledge `references/` grows only when chat would otherwise re-teach the same soft preference.
