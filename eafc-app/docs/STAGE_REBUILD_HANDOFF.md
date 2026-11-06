# Stage mobile rebuild — handoff / continuation prompt

> Paste this to the next agent (Cursor, Codex, Claude Code…). It is a working brief: what the project is, what is already done, the rules to keep, and exactly what to do next. Work from the repo — all paths are relative to `eafc-app/`.

## Your task

Continue the **full rebuild of the Stage mobile app** (`eafc-app`, Expo / React Native, expo-router): every one of the 33 mocked screens must render the new design from its mockup **and** be wired to **real Stage data**. You are picking up mid-way. Sections 1 and 2 are done; do Section 3 next (see "What to do next").

**Read these first (they are the source of truth):**
- `docs/STAGE_REBUILD_PROMPT.md` — the rebuild spec (goal, order of work, rules).
- `docs/STAGE_REDESIGN_PROMPT.md` — design spec: tokens, gradient, logo, components, mockup→file mapping.
- `docs/STAGE_API_WALKTHROUGH.md` — screen → endpoint map (two seams: `stageClient` `/api/stage`, axios `api` `/api/mobile`, same JWT).
- `docs/STAGE_REBUILD_INVENTORY.md` — every route: rebuild / delete / keep.
- `docs/STAGE_REBUILD_STATUS.md` — per-screen data map (element → source → status).
- `docs/STAGE_DATA_GAPS.md` — elements with no backend; **do not fake these**, render empty states and leave the row.
- `docs/superpowers/plans/2026-11-06-stage-mobile-rebuild.md` — the phased plan.
- Mockups: `docs/design/stage-mockups/<section>/<Screen>.dc.html` (+ `.png`). The `.dc.html` body (the `<div class="scr">…`) is the layout; ignore `<x-dc>`, `support.js`, `DCLogic`. `href="X.dc.html"` shows intended navigation.

## Rules (do not break these)

1. **Do not commit or push unless the user (Lutina) asks.** Git root is `~/Documents/eafc` (one level above `eafc-app`); the app commits directly to `main`. When asked, commit only the relevant scoped changes with a clear message.
2. **Lossless approach** (chosen by Lutina). The app was already heavily built by a prior restyle, and the mockups are *idealized* — they often show less than what exists. Keep the richer real features; make screens look like the mockups **where the data exists**; record anything unbacked in `STAGE_DATA_GAPS.md`. Do **not** remove a working feature to match a mockup. When a mockup conflicts structurally with the real architecture, **stop and ask Lutina** (that is how onboarding, Home and Search were resolved).
3. **Real data only.** No hard-coded demo values (the names/scores/STC in mockups are fake). Element with no endpoint → proper empty state + a `STAGE_DATA_GAPS.md` row.
4. **TDD.** Write the failing test first, watch it fail, implement, watch it pass. Jest + `@testing-library/react-native`. `yarn jest <path>` for one file; `yarn test` for all.
5. **Tests go through `src/translations`** for new visible strings where the screen already uses `t()`; keep existing `testID`s and i18n keys. Accessibility: `accessibilityLabel` on icon-only buttons, touch targets ≥ 44.
6. **No new dependency** without justifying it.

## Test baseline (important)

- `yarn test` ≈ 110–285 s for ~116 suites. Several restyle suites (`moneyAppsRestyle`, `SettingsRestyle`, `StageTimesNews`, `WatchMatchScreen`, `RestyleSmoke`) **time out under full parallel load and report as failures, but pass in isolation** (`yarn jest <file> --runInBand`). Treat a failure as real only if it fails in isolation.
- The **only genuine pre-existing failure** is `src/__tests__/lib/matchFlowParity.test.js` (baseline "finding 1", unrelated to the rebuild). Report it as "unchanged", never as newly broken.
- After each section: run the touched suites in isolation (green), then report.

## Key conventions already in place (reuse them)

- **Design tokens**: `src/lib/stageTheme.js` + `tailwind.config.js`. `bg` fallback `#03153F`; cyan `#5FE3E8`; navy surfaces. Dark is the target; Live Dark wallpaper mode must keep working.
- **Gradient background**: `src/components/ui/StageBackground.jsx`, rendered by `src/components/ui/Screen.jsx` (non-live) / `LiveDarkWallpaper` (live). Radial glows are approximated with linear gradients (no RN radial; no bg image asset) — swap for a 3× image later if desired.
- **UI primitives**: `src/components/ui/` (Screen, Card, Button, IconButton, Chip, SegmentedControl, SectionLabel, Avatar, TextField, SelectField, ListRow, Toggle, StepProgress, FormBadge, StatGrid, FloatingTabBar, **BrandLogo**, **StageBackground**). Use these, not raw hex.
- **Floating tab bar**: `src/components/ui/FloatingTabBar.jsx` + `src/app/(tabs)/_layout.jsx` — already spec-correct (5 tabs: Home · Game Day · Tournaments · Profile · Search).
- **Data-hook contract**: `src/hooks/useAsyncResource.js` → `{ data, loading, error, refreshing, refetch }`. New per-domain hooks follow this (loading = first load; refreshing = pull-to-refresh; a 401 sets `error`, never throws). Existing hooks keep their `{loading, error, reload}` shape (not force-migrated).
- **Player persistence**: `src/lib/savePlayerProfile.js` (`buildPlayerPayload` + `savePlayerProfile` → `stageClient.entities.Player`). Note: `services/playerIdentityService.updateIdentity` writes **local AsyncStorage only**, NOT the backend — persist real profile data via `savePlayerProfile` / `stageClient`.

## What is already done

**Phase 0 — discovery** (committed): inventory, per-screen data map, data-gaps register, and the `useAsyncResource` contract.

**Phase 1 — foundation** (committed `69fcdff`): tokens → gradient design; `StageBackground` in `Screen`; `BrandLogo` + `app.json` icon/adaptive/splash → `assets/brand/*`; floating tab bar (already conformant). Full suite had zero new failures.

**Section 1 — Onboarding & account** (committed `69fcdff`):
- **Welcome** rebuilt to mockup (eyebrow, faded mark watermark, lockup, CTAs).
- **Login / Signup** verified — already target design + real `authStore` wiring. Minor mockup gaps noted: Login "Forgot password?" link, Signup terms checkbox.
- **Combined onboarding** (Lutina's decision): `/auth/onboarding` stays the engine; the **player branch** now runs the mockup steps **Platform(1) → Position(2) → Gamertag(3, with country + "Link Pro Club") → Club(4) → Discord → tutorial**, persisting via `savePlayerProfile`. **Player+President branch unchanged.** New `src/components/onboarding/PlayerOnboardingSteps.jsx`. The 4 legacy route screens (`platformselection`/`positionselection`/`gamertagsetup`/`clubsetup`) now redirect into `/auth/onboarding` via `src/components/auth/OnboardingRedirect.jsx`.

**Section 2 — Home & Game Day** (committed `8f4928b`):
- **Home** — added dashboard layout **"E" (Stage)** matching the mockup (next match → club rank → form → objectives), reusing existing blocks in `src/components/dashboard/DashboardLayoutLab.jsx`; registered in `src/lib/dashboardLayouts.js`; made the **default** in `src/store/dashboardLayoutStore.js` (A/B/C/D and saved choices preserved = lossless). Home objectives+claim, contract games x/y, avg rating are all **backed** (not gaps).
- **GameDay / MatchDetail / UploadVideo / WatchMatch** — verified as-is (richer than mockup, real data, states). Unbacked bits are gaps: MatchDetail stats/possession/shots/pass% + MOTM + scorers; WatchMatch highlights list; UploadVideo file-upload (backend only takes a video **URL**: `POST /matches/:id/video {video_url, video_source}`); GameDay "contract ends in N games" banner.
- **Search tab** — **deferred to Section 5** (see below).

## What to do next

Work section by section, each screen via this recipe: **data hook (per domain, `useAsyncResource` shape) → screen UI from the mockup → wire actions to existing services → loading/empty/error/refresh states → tests → compare to the `.png`**. After each section: run touched suites isolated, update `STAGE_REBUILD_STATUS.md`, report to Lutina (done / data gaps / anything that doesn't match and why).

### Section 3 — Tournaments (7 screens) ← start here
`Tournaments`, `TournamentDetail`, `CreateTournament`, `GroupStage`, `Standings`, `Fixtures`, `Bracket`. Files under `src/app/(tabs)/tournaments/*` (+ `src/app/apps/leagues/[slug].jsx` for Standings). Data via `useTournamentsList`, `tournamentStore`, `src/api/tournamentActions.js`, `src/lib/{tournamentEngine,standingsCore,bracketRounds,standingsRows}.js`. **Expect these to be already built/rich** (verify first, like Section 2). **Likely real gaps to confirm by grep/probe** before building: group tables (`/tournaments/:id/groups`), bracket (`/tournaments/:id/bracket`), standings Home/Away/Form splits, prize/entry-fee/slots fields. Confirm each endpoint exists; if not, empty state + keep the `STAGE_DATA_GAPS.md` row.

### Section 4 — Profile & teams (5 screens)
`Profile`, `EditProfile`, `Availability`, `TeamProfile`, `CreateTeam`. Files `src/app/(tabs)/profile/*`, `src/app/teams/*`. Confirm: availability grid is a real 7×4 tri-state (vs free text); Pro-Club link/unlink; trophies/founded date.

### Section 5 — Apps (8 screens) + the deferred Search tab
`Apps` (directory), `Inbox`, `InboxMessage`, `Wallet`, `Store`, `Transfers`, `Settings`, `Club`. **Highest-value backend gaps live here: Wallet (balance+activity+send), Store (catalogue+buy), Transfers feed, head-to-head** — these likely need new endpoints in the web repo `Lengarose/stage` (`server/src/server/routes/…`); render empty states until they exist.
- **Build the Apps directory to host the mini-apps grid first** (it currently lives only in `src/app/(tabs)/search/index.jsx` via `getMiniAppGroups`). Then **repurpose the Search tab** (`search/index.jsx`) into **player/club search** with a Players/Clubs `SegmentedControl`, folding in the near-identical `searchplayer.jsx` / `searchclubs.jsx` (real directory loaders `loadPlayerDirectory` / `loadClubDirectory`). This is the mockup's Search tab; it was deferred from Section 2 because the grid had to relocate first.

### Phase 7 — Cleanup (last)
Delete replaced components / dead helpers once nothing imports them; remove tests that only covered deleted UI (keep logic tests); re-point deep links / notification targets to rebuilt routes. **Before deleting any user-reachable no-mockup feature (Feed, Reels, Chat/Messages, DressingRoom, Formation, ManageTeam, TeamDashboard, dashboard layout lab/picker, international tournaments, `src/navigation/*`), stop and get Lutina's approval** — see the inventory's "needs decision" list.

## Open decisions to raise with Lutina as you hit them
- Server-side gaps (Wallet/Store/Transfers/stats/MOTM/highlights/groups/bracket/head-to-head) need endpoints in `Lengarose/stage`.
- Any mockup that structurally conflicts with an existing richer feature → ask, don't guess (precedent: onboarding combine, Home layout, Search tab).
