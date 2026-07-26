# Decisions & taste

Soft prefs and rejected paths. **Not** game rules (those stay in `AGENTS.md` / `engine.mdc`). Keep bullets short; date when useful.

## Locked

- **Web is the product surface.** Default `packages/ui` files = DOM + Tailwind. Expo forks = `*.native.tsx` only. No new `*.web.tsx`.
- **No NativeWind / react-native-web on `apps/web`.** Cold path is DOM. NativeWind only if/when Expo play needs it.
- **Mobile Expo** is a deferred smoke stub — don’t block web work on a green mobile build.
- **Mascot images:** LCP hero = lobby chill `Logo` (`fetchPriority="high"`); chrome site bar = same chill `Logo` (~36) in `ChromeTopBar`. Other `PotatoMark`s default `loading="lazy"`. Interactive poke defers cheer WebP until idle `onLoad` / first poke. **No** continuous soft-float bob on headers (`cp-logo-float` removed). Face-crop `BrandMark` dropped from chrome (read as cropped photo).
- **Background music nudge:** quiet muted strip under Customize (BGM for lobby + play) — never a potato hero banner above mode cards. Player label is **Background music** (not Lobby jam / Couch jam).
- **About:** chrome About icon + ⌘K → credits + feedback modal (free + open source; **Message on X** / **Leave a GitHub issue** / Source on GitHub) — not a full route. Hero = `PotatoWaveSvg` — purpose-built PixelLab `logo-wave` when present; cheer + soft rock/sparkles until then. Never a glued-on SVG hand.
- **Medals section potatoes:** soft corner watermark in each track card (`.cp-medals-section-mascot`), not a tiny header pip.
- **Chrome header:** site bar on lobby + chrome pages (not play/how-to). Lobby = **nav-only** bar + hero `BrandHeader` (no double logo). Other chrome = brand lockup + `PageHeading`. Prefer shared persistent chrome when it removes layout drift (see `ui.mdc` Layout stability).
- **Lobby welcome mark:** chill `Logo`, never bored snore / Zzz (wrong first impression). Snore stays EmptyState / flourishes only.
- **Cold path:** eager `/how-to` (first-visit redirect); lazy lobby/chrome; Lexend 400+700 only; cuelume not on root boot. Keep sync `TooltipProvider` (IconTooltip requires it).
- **Score copy:** spell **points** (HUD `N points left`, Results haul, Potato Board) — never **`pts`**, never shouting **`POINTS`**.
- **SEO OG blurb:** plain swipe loop + **free, no ads, play as much as you want** — not mode jargon or “No hints”. Source: `apps/web/src/seo.ts`.
- **How hard? active state:** Easy / Medium / Hard share one selected recipe (cream + sage border + potato icon). No Hard-only potato-gold card exception.
- **Play short phones:** `.cp-shell-play` reserves bottom safe-area; short `max-height` caps board **width** so Spin clears the fold (see `ui.mdc`).
- **Secondary buttons:** soft pale potato wash (not solid `#d8b05b`) + dark ink — light and dark. Solid gold slabs read too heavy (Spin chips).
- **Page transitions:** View Transitions settle on `.cp-page-body` (`cp-settle` / back) — site bar is outside that group so it stays put between chrome pages.
- **Results word chips:** stagger drop-in (length row → chips L→R via `.cp-chip-drop-in`); remount when a collapse opens so the beat isn’t wasted while clipped.
- **Results outcome title:** same voice as Play curtain (`runEndPill`) — never “Run ended”; quit = **Haul locked!** Score hero lands big + counts up with glow.

## Rejected / don’t redo

- Idle-prefetching `/play` from the lobby (ENABLE dict lands on cold LH network).
- Shipping full sprite atlas sheets in `apps/web/public` when cropped cell WebPs exist.
- NativeWind `jsxImportSource` on web to share RN `className` (cost ~216KB gzip RN-web).
- Parallel design system under `apps/web/src/components` (beyond shadcn + route composition).
- Soft-float / bobbing full-body potato on Results / chrome headers.
- Bored snore as lobby BrandHeader hero.
- Whimsical difficulty blurbs that don’t explain the mechanic (Soft couch / Warm seat / Spud sweat) — use mode-aware literal hints.
- UA blue focus rings on lobby choice cards — brand potato wash `focus-visible` only (`outline: none` on tile/chip/challenge).
- Full ENABLE as v1 play lexicon (obscure scraps). Prefer **popular + curated allowlist** if everyday words like `defer` are missing — don’t flip play to ENABLE without a plan.

## Open / deferred

- Full Expo play + NativeWind on native.
- Play lexicon widen (popular allowlist vs broader frequency cut) — discuss before shipping.
- App-knowledge `references/` grows only when chat would otherwise re-teach the same soft preference.
