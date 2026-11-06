# Stage mobile — full rebuild from the 33 mockups (Claude Code)

> Décision de Lutina (6 nov 2026) : refonte complète. Les 33 écrans des maquettes deviennent l'application. Les anciens écrans peuvent partir. Chaque écran est branché sur les vraies données (base Stage). Claude Code code.

This prompt **supersedes** the "restyle only" rule in `docs/STAGE_REDESIGN_PROMPT.md` and in `docs/superpowers/plans/2026-10-29-stage-mobile-redesign.md`. Keep using `STAGE_REDESIGN_PROMPT.md` as the **design spec** (tokens, gradient background, logo, components, screen → file mapping). Where the old plan says "flat bg" or "do not change structure", this prompt wins.

## Sources

| What | Where |
|---|---|
| Mockups (source of truth for UI) | `docs/design/stage-mockups/<section>/<Screen>.dc.html` |
| Rendered reference images (390×844 @2x) | same folder, `<Screen>.png` — compare your build against these |
| Logo files | `assets/brand/` (see "Logo" in `STAGE_REDESIGN_PROMPT.md`) |
| Design tokens, gradient, components | `docs/STAGE_REDESIGN_PROMPT.md` |
| API map (screens → endpoints) | `docs/STAGE_API_WALKTHROUGH.md`, `src/api/*`, `src/utils/api.js`, `src/hooks/*`, `src/store/*` |
| Domain language | `CONTEXT.md` |

Sections: `1-onboarding` (7) · `2-home-gameday` (6) · `3-tournaments` (7) · `4-profile-teams` (5) · `5-apps` (8).

## Goal

1. Every route listed in the mapping of `STAGE_REDESIGN_PROMPT.md` renders the **new** screen, built from its mockup: same layout, hierarchy, components, copy structure and navigation as the PNG. Write the new screen fresh; do not patch the old JSX into shape.
2. **Every element on every screen shows real data** from the Stage backend. No hard-coded demo values in production code (the names, scores, STC amounts in the mockups are fake).
3. Old screen UI that is replaced is deleted (components, styles, dead helpers) once nothing imports it.

## Data: "branch the whole database"

The app never talks to MySQL directly. All data goes through the existing API seams (same JWT):

- `stageClient` → `EXPO_PUBLIC_STAGE_API_URL` (`/api/stage`): auth, players, clubs, identity, tournaments helpers
- `api` (axios) → `EXPO_PUBLIC_API_URL` (`/api/mobile`): dashboard, matches, teams, tournaments, social, profile, search
- realtime: `useGameDayMatchRealtime`, `useNotificationsSocket`, OneSignal

For **each screen**, before building it:

1. List every data element the mockup shows (e.g. Home: next match, club rank, contract games x/y, recent form, avg rating, objectives + claim reward, unread inbox dot).
2. Map each element to an existing endpoint / store / hook (use `STAGE_API_WALKTHROUGH.md`, then grep `src/`). Move fetching into a hook or store per domain (`useHome`, `useMatch`, `useTournament`, `useWallet`, …) so screens stay presentational.
3. If an element has **no endpoint**: do not fake it. Render a proper empty state (or hide that block) and add a row to `docs/STAGE_DATA_GAPS.md`: screen · element · what data is needed · proposed endpoint (method, path, response shape) for the server in the web repo (`Lengarose/stage`, `server/src/server/routes/…`). Likely gaps to check: match stats & man of the match, highlights list, head-to-head, objectives/rewards, wallet balance & activity, store catalogue, transfer feed, availability grid format.
4. Every screen handles loading (skeletons in the card shapes), empty, error (retry), and pull-to-refresh where it lists data.
5. Actions in the mockups must work end to end: sign in / sign up / social auth, onboarding steps (platform, position, gamertag, club create or join), arrange game, upload video, create tournament, accept/decline inbox actions (contract offer, match invite), save profile, save availability, create team, buy in store, make transfer offer, settings toggles, sign out. Reuse the existing service calls; if one is missing, add it to the data-gaps file.

## Navigation

- Tabs (floating bar): Home · Game Day · Tournaments · Profile · Search.
- Home header: Apps grid → App directory; bell → Inbox (unread dot from real count).
- Follow the `href` links between mockups for the stack flows (onboarding 1→4, tournament detail → group stage / standings / fixtures / bracket, match detail → watch / upload, profile → edit / availability / team / wallet, apps → inbox / wallet / store / transfers / settings / club).
- Keep deep links and notification links working (update targets if a route moves).

## Old screens and features without a mockup

Step 0, before deleting anything: write `docs/STAGE_REBUILD_INVENTORY.md` listing every route/screen in `src/app/**` and `src/navigation/**` with: has mockup? (which) · action: **rebuild** (from mockup) / **delete** / **keep & restyle with the new components**. Known items without a mockup: Feed, Reels, Chat/Messages, DressingRoom, Formation, ManageTeam, TeamDashboard, dashboard layout lab/picker, competitions, find-clubs, find-players, apps/register, international tournaments, auth callback, onboarding, teams index.

Default proposal: delete legacy `src/navigation/*` screens that expo-router no longer uses; restyle (not delete) functional flows that have no mockup but are needed (auth callback, competitions, find-clubs/players). **Stop and show Lutina the inventory before deleting any feature that users can reach today.** Rebuilding the 33 mocked screens does not need her approval.

## Order of work

1. Inventory (above) + data map per section (`docs/STAGE_REBUILD_STATUS.md`, one table per section: screen · elements · source · status).
2. Foundation: tokens, gradient `Screen`, `BrandLogo`, `ui/` components, floating tab bar (reuse what already exists in `src/components/ui/` and fix it to the current spec: gradient background, logo).
3. Section 1 → 5. For each screen: data hook → screen UI → actions → states → tests → visual check against the PNG (run in the iOS simulator or Expo web and compare).
4. After each section: `yarn test`, update `STAGE_REBUILD_STATUS.md`, short report to Lutina (done / data gaps / anything that does not match the mockup and why).
5. Cleanup: delete replaced components and dead code; remove tests that only covered deleted UI; keep and fix tests that cover logic (stores, API, auth, realtime).

## Rules

- Do **not** commit or push unless Lutina asks. Git root: `~/Documents/eafc`.
- No new dependency without saying why in the report.
- Visible strings go through `src/translations` (FR + existing languages).
- Accessibility: real buttons, `accessibilityLabel` on icon-only buttons, contrast per token table, touch targets ≥ 44.
- Baseline test failures that already existed (see the old plan, finding 1) are reported as "unchanged", not hidden.
