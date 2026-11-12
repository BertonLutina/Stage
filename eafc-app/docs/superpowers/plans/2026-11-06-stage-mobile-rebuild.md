# Stage Mobile Rebuild — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the 33 mocked Stage screens fresh from their `.dc.html` mockups, each wired to real Stage data through the existing API seams, and delete the legacy UI they replace.

**Architecture:** Three layers. (1) Foundation — one token source + a gradient `Screen` + `BrandLogo` + the `src/components/ui/` primitives + the floating tab bar, fixed to the 6-Nov spec. (2) Per screen — a domain data hook (`useHome`, `useMatch`, …) that owns fetching/loading/empty/error/refresh, a presentational screen built to match the PNG, and wired actions calling existing services. (3) Governance — living docs (inventory, status, data-gaps) that gate deletion and record missing endpoints. The app never touches MySQL; everything flows through `stageClient` (`/api/stage`) and axios `api` (`/api/mobile`) on the same JWT.

**Tech Stack:** Expo 57 / React Native 0.86, expo-router (`Tabs` + stacks), NativeWind 4, zustand (`useThemeStore`, `authStore`, …), `@expo/vector-icons` Ionicons, `expo-linear-gradient`, jest-expo + `@testing-library/react-native` (`yarn test` / `yarn jest <path>`).

**Spec:** `docs/STAGE_REBUILD_PROMPT.md` (rebuild rules + order of work; supersedes the "restyle only" rule). Design spec: `docs/STAGE_REDESIGN_PROMPT.md` (tokens, gradient, logo, components, screen→file mapping). Data map: `docs/STAGE_API_WALKTHROUGH.md`. Domain language: `CONTEXT.md`. Mockups: `docs/design/stage-mockups/<section>/<Screen>.dc.html` + `<Screen>.png`.

## Global Constraints

- **Do not commit or push** unless Lutina asks. Git root is `~/Documents/eafc` (one level above `eafc-app`). Where the TDD template says "commit", do a **checkpoint**: review `git diff --stat`, nothing committed.
- **Real data only.** No hard-coded demo values in production code — names, scores, STC amounts in the mockups are fake. Every visible element renders data the screen loads, or a proper empty state.
- **No invented endpoints.** An element with no backing endpoint gets an empty state (or is hidden) **and** a row in `docs/STAGE_DATA_GAPS.md`. Never fake it.
- **No new dependency** without justifying it in the section report. `expo-linear-gradient` is already a dependency (used in `src/components/common/GradientBackground.jsx`).
- Visible strings go through `src/translations` (FR first, plus existing languages). Keep existing `t()` keys and `testID`s where screens are reused by tests.
- Accessibility: real buttons, `accessibilityLabel` on icon-only buttons, token-table contrast, touch targets ≥ 44.
- Tokens (verbatim, from `STAGE_REDESIGN_PROMPT.md`): `bg` gradient (fallback `#03153F`) · `bgDeep #07163A` · `card #132B5C` · `cardHi #16346B` · `border #234480` · `borderStrong #4A6AA5` · `text #EAF2FF` · `textSoft #C9D8EE` · `muted #9FB3D1` · `cyan #4A6AA5` · `cyanHi #5B79AF` · `aqua #3C5E99` · `onCyan #EAF2FF` · `success #4ADE80 / bg #14532D` · `danger #F87171 / bg #5B1A1A` · `warning #FBBF24 / bg #2A2418 / border #B45309`.
- Gradient background (6 Nov): bottom-centre radial glow `rgba(0,82,140,0.95)`→transparent, top-centre radial glow `rgba(14,58,124,0.9)`→transparent, horizontal linear `#020C30`→`#06306A`→`#020C30`. Header bands = `rgba(2,12,48,0.35)`. Live Dark wallpaper mode must keep working on top.
- Radii: card 16 · button 14 · input/icon button 12 · chip 999 · tab bar 22 · avatar tile 12. Sizes: button h52 · icon button 44×44 · chip h34 · input h50. Type: headings UPPERCASE `EASports15` (`FONT_EA_SPORTS` in `src/lib/fonts.js`), screen titles 34, hero 38–40; section label 11/600/uppercase/0.12em/`muted`; body 14–15. Icons: Ionicons outline 22px, no emoji.
- Floating tab bar: 16px sides, 24px bottom, h64, radius 22, `bgDeep` + `border`, 5 icon-only tabs (Home · Game Day · Tournaments · Profile · Search), active = cyan icon on a `card` pill.
- **Baseline is not green.** Record the current `yarn test` pass/fail suite count in Task 0.1 and repeat it verbatim in every section report as "failures unchanged vs baseline"; never hide a pre-existing failure and never present it as newly broken.

## Review Focus

Inputs the spec implies but that no single screen's happy-path tests exercise; each line's test is added to the task named.

- **Unauthenticated / 401 mid-session** — every data hook must surface the error state with retry (not a blank screen or crash) when the JWT is missing or rejected. Test in the Foundation data-hook contract task (0.4) and in each `use<Domain>` hook.
- **Empty collections** — a club with no matches, a player with no trophies, an empty inbox/feed/standings must render the designed empty state, not a broken list. Test in each list-bearing screen task.
- **Missing optional fields** — avg rating, man-of-the-match, highlights, wallet balance may be absent on real records; the block hides or shows em-dash, and a gap row is added. Test in Home, MatchDetail, Wallet tasks.
- **Pull-to-refresh re-entrancy** — refreshing while a fetch is in flight must not double-fire or wedge the spinner. Test in the `Screen`/hook refresh-control task (1.2 + 0.4).
- **Deep link / notification into a rebuilt route** — a notification target or deep link that pointed at an old route path still lands on the rebuilt screen with its params. Test in the navigation-parity task (1.4) and Cleanup (Task 7.2).

---

## Phase 0 — Discovery & governance (gates everything else)

The prompt's Order of Work step 1. These tasks produce the artifacts that fill in the per-screen tasks' data-element lists and the deletion decisions. **No screen rebuild or deletion starts until Task 0.5's gate clears.**

### Task 0.1: Baseline + inventory

**Files:**
- Create: `docs/STAGE_REBUILD_INVENTORY.md`

- [ ] **Step 1:** Run `yarn test 2>&1 | tail -30`; record the "X failed, Y passed" suite line and each failing suite name at the top of the inventory doc as the baseline.
- [ ] **Step 2:** List every route/screen in `src/app/**` and every screen in `src/navigation/**` in a table with columns: route · current file · has mockup? (which) · **action** = `rebuild` / `delete` / `keep & restyle`.
- [ ] **Step 3:** Fill the action column per the prompt's default proposal: `rebuild` for the 33 mocked screens (mapping in `STAGE_REDESIGN_PROMPT.md`); `delete` for legacy `src/navigation/*` screens expo-router no longer uses; `keep & restyle` for functional no-mockup flows (`auth/callback`, `apps/competitions`, `apps/competitions/[slug]`, `apps/find-clubs`, `apps/find-players`, `apps/register`, `teams/index`). Flag no-mockup user-reachable features (Feed, Reels, Chat/Messages, DressingRoom, Formation, ManageTeam, TeamDashboard, dashboard layout lab/picker, international tournaments) in a dedicated "needs Lutina's decision before delete" list.
- [ ] **Step 4: Checkpoint** (`git diff --stat`).

### Task 0.2: Section data maps

**Files:**
- Create: `docs/STAGE_REBUILD_STATUS.md`

- [ ] **Step 1:** Create one table per section (1-onboarding … 5-apps) with columns: screen · elements · source (endpoint/store/hook) · status.
- [ ] **Step 2:** For each of the 33 screens, open its `.dc.html` + `.png`, enumerate every data element the mockup shows, and map each to an endpoint/store/hook using `STAGE_API_WALKTHROUGH.md` then `grep src/`. Set status `mapped` or `gap`.
- [ ] **Step 3: Checkpoint.**

### Task 0.3: Data-gaps register

**Files:**
- Create: `docs/STAGE_DATA_GAPS.md`

- [ ] **Step 1:** For every element marked `gap` in Task 0.2, add a row: screen · element · data needed · proposed endpoint (method, path, response shape) for `Lengarose/stage` (`server/src/server/routes/…`).
- [ ] **Step 2:** Seed the likely-gap checklist from the prompt and confirm each present-or-gap: match stats & man-of-the-match, highlights list, head-to-head, objectives/rewards, wallet balance & activity, store catalogue, transfer feed, availability grid format.
- [ ] **Step 3: Checkpoint.**

### Task 0.4: Data-hook contract (shared pattern)

**Files:**
- Create: `src/hooks/useAsyncResource.js` (or confirm an existing equivalent and document it)
- Test: `src/__tests__/hooks/useAsyncResource.test.js`

**Interfaces:**
- Produces: a hook shape every `use<Domain>` follows — returns `{ data, loading, error, refreshing, refetch() }`. `loading` true on first load only; `refreshing` true during pull-to-refresh; `error` carries a retry-able message; a 401 sets `error`, never throws.

- [ ] **Step 1: Write the failing test** — assert: initial state `loading:true,error:null`; on resolve `loading:false,data:<payload>`; on reject `loading:false,error` truthy; `refetch()` sets `refreshing:true` without clearing `data`; a 401 rejection yields `error` and no throw.
- [ ] **Step 2:** Run `yarn jest src/__tests__/hooks/useAsyncResource.test.js` → FAIL.
- [ ] **Step 3:** Implement the hook (or adapt the existing fetch pattern used by `useMatchesHub`/`useTournamentsList` and document the canonical one in `STAGE_REBUILD_STATUS.md`). Every later `use<Domain>` consumes this shape.
- [ ] **Step 4:** Run test → PASS.
- [ ] **Step 5: Checkpoint.**

### Task 0.5: Inventory gate (STOP)

- [ ] **Step 1:** Post the inventory (0.1), the "needs decision before delete" list, and the data-gaps summary (0.3) to Lutina.
- [ ] **Step 2:** Wait for her decision on each user-reachable no-mockup feature before any deletion. Rebuilding the 33 mocked screens does **not** need approval and may begin in parallel with this gate. Record decisions back into the inventory.

---

## Phase 1 — Foundation

The `src/components/ui/` primitives already exist (`Screen, Card, Button, IconButton, Chip, SegmentedControl, SectionLabel, Avatar, TextField, SelectField, ListRow, Toggle, StepProgress, FormBadge, StatGrid, FloatingTabBar`). This phase **fixes them to the current spec** (gradient, logo) rather than recreating them. Several source-reading tests exist (`stageTheme.test.js`, `pageInsets.test.js`) — run the full suite after each task and update assertions only when the token/layout change is the intended one.

### Task 1.1: Tokens are the gradient design

**Files:**
- Modify: `src/lib/stageTheme.js`, `tailwind.config.js`, `src/store/themeStore.js`
- Test: `src/__tests__/lib/stageTheme.test.js`

- [ ] **Step 1:** Update `stageTheme.test.js` to assert the Global-Constraints token values (fallback `bg #03153F`, `bgDeep #07163A`, `card #132B5C`, `cardHi #16346B`, `cyan #4A6AA5`, radii card 16 / button 14 / input 12 / chip 999 / tab 22) — the test is the spec here.
- [ ] **Step 2:** Run → FAIL on old values.
- [ ] **Step 3:** Set the dark-theme tokens in `stageTheme.js` + mirror in `tailwind.config.js`; keep the light theme working.
- [ ] **Step 4:** Run `stageTheme.test.js` then `yarn test` → section tests green or deliberately updated.
- [ ] **Step 5: Checkpoint.**

### Task 1.2: Gradient `Screen` + header band

**Files:**
- Modify: `src/components/ui/Screen.jsx`, `src/components/ui/metrics.js`, reuse `src/components/common/GradientBackground.jsx`
- Test: `src/__tests__/components/Screen.test.jsx`

- [ ] **Step 1: Failing test** — `Screen` renders the three-layer gradient (or the 3× `assets/brand/` bg image) when `tokens.live !== true`, renders `LiveDarkWallpaper` when `tokens.live === true`, keeps 20px gutters + top safe area + floating-tab-bar bottom clearance, and still forwards `refreshControl`/`scrollKey`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Compose `GradientBackground` (linear layer) + two radial glow overlays behind `children`; preserve the current `pageBottomPad`/`guideFabClearance` logic and `testID`s (`screen-scroll`, `screen-content`).
- [ ] **Step 4:** Run test + `pageInsets.test.js` → PASS.
- [ ] **Step 5: Checkpoint.**

### Task 1.3: `BrandLogo` + app icons/splash

**Files:**
- Create: `src/components/ui/BrandLogo.jsx`
- Modify: `app.json`, `src/app/auth/welcome.jsx` (swap old logo usage)
- Test: `src/__tests__/components/BrandLogo.test.jsx`

**Interfaces:**
- Produces: `<BrandLogo variant="lockup"|"mark" width={number} />` — keeps aspect ratio from the asset's native size, `accessibilityLabel="Stage"`.

- [ ] **Step 1: Failing test** — `variant="lockup"` uses `assets/brand/stage-logo.png`, `variant="mark"` uses `stage-icon.png`, height derives from `width` × aspect, `accessibilityLabel="Stage"` present.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement component; replace `logo-lockup/logo-mark/stadium-logo` usage in `welcome.jsx`; point `app.json` `icon`→`stage-app-icon.png`, `android.adaptiveIcon.foregroundImage`→`stage-adaptive-icon.png`, splash→`stage-splash.png`, `backgroundColor`→`#0A1F4A`. Do not delete old asset files.
- [ ] **Step 4:** Run test → PASS.
- [ ] **Step 5: Checkpoint.**

### Task 1.4: Floating tab bar + navigation parity

**Files:**
- Modify: `src/app/(tabs)/_layout.jsx`, `src/components/ui/FloatingTabBar.jsx`
- Test: `src/__tests__/components/FloatingTabBar.test.jsx`, `src/__tests__/lib/pageInsets.test.js`

- [ ] **Step 1: Failing test** — bar is 16px from sides / 24px bottom / h64 / radius 22 / `bgDeep`+`border`; exactly 5 icon-only tabs in order Home · Game Day · Tournaments · Profile · Search, each with `accessibilityLabel`; active tab = cyan icon on `card` pill. Add a navigation-parity assertion: the Home header's Apps-grid icon routes to the app directory and the bell routes to inbox.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Apply the spec to `FloatingTabBar`; wire into `_layout.jsx` (custom bar on both platforms).
- [ ] **Step 4:** Run tests → PASS.
- [ ] **Step 5: Checkpoint.**

---

## Per-screen task recipe (applies to every task in Phases 2–6)

Each rebuilt screen is one task. Do **not** patch old JSX — write the new screen fresh, then delete the old UI in Phase 7. Steps, in order:

1. **Data hook.** In the screen's domain hook (`use<Domain>`), add a selector returning exactly the elements the Task 0.2 data map lists for this screen, built on the Task 0.4 contract (`{data,loading,error,refreshing,refetch}`). Elements marked `gap` return `null`/`undefined` (never fabricated).
2. **Failing hook test.** Mock the endpoint(s) from the table below; assert the hook maps the response to the named elements and that a reject yields `error`. Run → FAIL → implement → PASS.
3. **Screen UI.** Build the screen from the `.dc.html`, matching layout, hierarchy, `ui/` components, copy structure and navigation to the `.png`. Visible strings via `src/translations` (FR + existing). Icon-only buttons get `accessibilityLabel`.
4. **States.** Loading = skeletons in the card shapes; empty = designed empty state; error = retry; pull-to-refresh on any list via the hook's `refetch`.
5. **Actions.** Wire the mockup's actions to existing services/stores (table below). A missing service call → add a `docs/STAGE_DATA_GAPS.md` row, not a stub that pretends to work.
6. **Screen test.** Assert: renders the hook's data (not literals), shows empty state on empty data, shows error+retry on `error`, and each action calls the expected service with the expected args.
7. **Visual check.** Run in the iOS simulator or Expo web; compare against the `.png`; note any intentional deviation for the section report.
8. **Checkpoint**, then update this screen's row in `STAGE_REBUILD_STATUS.md`.

> Because every screen's test assertions are pinned by its Task 0.2 data-element list, the recipe's "named elements" are known only after Phase 0. The tables below give the fixed decisions (mockup, target file(s), domain hook, endpoints, key actions); the data map supplies the per-element assertions.

---

## Phase 2 — Section 1 · Onboarding & account (7 screens)

Hook: `useOnboarding` (wraps `services/onboardingService.js`, `authStore`, `useSocialAuth`). Stack flow follows mockup `href`s Welcome→Login/Signup→Platform→Position→Gamertag→ClubSetup.

| # | Screen | Mockup | Target file(s) | Data / endpoints | Key actions |
|---|---|---|---|---|---|
| 2.1 | Welcome | `1-onboarding/Welcome.dc.html` | `src/app/auth/welcome.jsx` | none (brand) | → Login, → Signup |
| 2.2 | Login | `Login.dc.html` | `src/app/auth/loginscreen.jsx` | `GET /health`; `authStore` `POST /auth/login` | sign in, social auth (`useSocialAuth`) |
| 2.3 | Signup | `Signup.dc.html` | `auth/signupscreen.jsx`, `registerscreen.jsx` | `authStore` `POST /auth/register` | sign up, social auth |
| 2.4 | Platform | `Platform.dc.html` | `auth/platformselection.jsx` | `stageClient POST/PATCH /players` | select platform → Position |
| 2.5 | Position | `Position.dc.html` | `auth/positionselection.jsx` | `/players` (position) | pick position on pitch → Gamertag |
| 2.6 | Gamertag | `Gamertag.dc.html` | `auth/gamertagsetup.jsx` | `/players` (prefer stageClient over legacy `PUT /users/me`) | save gamertag → ClubSetup |
| 2.7 | ClubSetup | `ClubSetup.dc.html` | `auth/clubsetup.jsx` (+ `onboarding.jsx` step style) | `POST /clubs` + `functions/contractManagement`; `PATCH /auth/timezone` | create or join club, finish onboarding |

- [ ] 2.1–2.7: each per the recipe. After the section: `yarn test`, update `STAGE_REBUILD_STATUS.md`, report to Lutina (done / data gaps / mismatches).

## Phase 3 — Section 2 · Home & Game Day (6 screens)

Hooks: `useHome`, `useGameDay` (reuse `useMatchesHub`, `lib/gameDayHub.js`, `useGameDayMatchRealtime`), `useMatch`, `useSearch`.

| # | Screen | Mockup | Target file(s) | Data / endpoints | Key actions |
|---|---|---|---|---|---|
| 3.1 | Home | `2-home-gameday/Home.dc.html` | `(tabs)/dashboard/index.jsx`, `playerdashboardscreen.jsx`, `components/dashboard/*` | next match, club rank, contract games x/y, recent form, avg rating, objectives+claim, unread inbox count — map each in 0.2 (gaps likely: objectives/rewards, avg rating) | Apps grid → directory, bell → inbox, claim reward |
| 3.2 | GameDay | `GameDay.dc.html` | `(tabs)/matches/index.jsx` | `GET /matches/fixtures` (Fixtures/Calendar/Results) | segmented switch, Arrange Game (`lib/arrangeGame.js`) |
| 3.3 | MatchDetail | `MatchDetail.dc.html` | `matches/matchdetailscreen.jsx` | `GET /matches/:id` (stats, MOTM, highlights, H2H — gaps likely) | → Watch, → Upload |
| 3.4 | WatchMatch | `WatchMatch.dc.html` | `matches/watchmatchscreen.jsx` | `POST /matches/:id/chat/read`, `/uploads/chat` | play, chat read |
| 3.5 | UploadVideo | `UploadVideo.dc.html` | `matches/uploadvideoscreen.jsx` | `POST /matches/:id/video` | pick + upload video |
| 3.6 | Search | `Search.dc.html` | `(tabs)/search/index.jsx`, `searchplayer.jsx`, `searchclubs.jsx` | `GET /users/search`, `/teams/with-members` | Players/Clubs segmented, open result |

- [ ] 3.1–3.6 per recipe; then `yarn test` + status + report.

## Phase 4 — Section 3 · Tournaments (7 screens)

Hook: `useTournament` (reuse `useTournamentsList`, `tournamentStore`, `api/tournamentActions.js`, `lib/tournamentEngine.js`, `standingsCore.js`, `bracketRounds.js`).

| # | Screen | Mockup | Target file(s) | Data / endpoints | Key actions |
|---|---|---|---|---|---|
| 4.1 | Tournaments | `3-tournaments/Tournaments.dc.html` | `(tabs)/tournaments/index.jsx`, `tournamentlistscreen.jsx` | `GET /tournaments/list` | open detail, → Create |
| 4.2 | TournamentDetail | `TournamentDetail.dc.html` | `tournamentdetailscreen.jsx` | `GET /tournaments/:id`, start | start, → group/standings/fixtures/bracket |
| 4.3 | CreateTournament | `CreateTournament.dc.html` | `createtournamentscreen.jsx` | teams search, `POST /tournaments`, invite | create, invite teams |
| 4.4 | GroupStage | `GroupStage.dc.html` | `groupstagescreen.jsx` | `GET /tournaments/:id/groups` | open match |
| 4.5 | Standings | `Standings.dc.html` | `leaguestandingsscreen.jsx`, `apps/leagues/[slug].jsx` | `GET /tournaments/:id/standings` | open team |
| 4.6 | Fixtures | `Fixtures.dc.html` | `fixturesscreen.jsx` | `GET /tournaments/:id/...`, `/matches/fixtures` | open match |
| 4.7 | Bracket | `Bracket.dc.html` | `bracketscreen.jsx` | `GET /tournaments/:id/bracket` | open match |

- [ ] 4.1–4.7 per recipe; then `yarn test` + status + report.

## Phase 5 — Section 4 · Profile & teams (5 screens)

Hooks: `useProfile`, `useAvailability`, `useTeam` (reuse `teamStore`, `lib/playerCareer.js`, `clubProfileData.js`, `trophyCollection.js`).

| # | Screen | Mockup | Target file(s) | Data / endpoints | Key actions |
|---|---|---|---|---|---|
| 5.1 | Profile | `4-profile-teams/Profile.dc.html` | `(tabs)/profile/index.jsx`, `profilescreen.jsx`, `clubProfileTabs.jsx` | `GET /users/:id` / `auth/me` + players | → Edit, → Availability, → Team, → Wallet |
| 5.2 | EditProfile | `EditProfile.dc.html` | `editprofilescreen.jsx` | `PUT /users/me` | save profile |
| 5.3 | Availability | `Availability.dc.html` | `availabilityscreen.jsx` | `GET/PUT /users/:id/availability` (grid format — confirm in 0.2) | save availability |
| 5.4 | TeamProfile | `TeamProfile.dc.html` | `src/app/teams/teamprofilescreen.jsx` | `GET /teams/:id` with-members, formation, join-request | join/leave, manage |
| 5.5 | CreateTeam | `CreateTeam.dc.html` | `src/app/teams/createteamscreen.jsx` | `POST /teams` | create team |

- [ ] 5.1–5.5 per recipe; then `yarn test` + status + report.

## Phase 6 — Section 5 · Apps (8 screens)

Hooks: `useInbox` (reuse `lib/inboxData.js`, `useNotificationsSocket`), `useWallet`, `useStore`, `useTransfers` (reuse `lib/transferMarketEntries.js`, `transferWindow.js`), `useSettings`, `useClub`. Wallet/Store/Transfers are high-gap areas — confirm balance, catalogue, feed endpoints in Task 0.3 first.

| # | Screen | Mockup | Target file(s) | Data / endpoints | Key actions |
|---|---|---|---|---|---|
| 6.1 | Apps | `5-apps/Apps.dc.html` | `src/components/apps/AppDirectoryScreen.jsx`, `src/app/apps/[slug].jsx` | `lib/miniApps.js` | open each app |
| 6.2 | Inbox | `Inbox.dc.html` | `apps/inbox/index.jsx`, `components/inbox/*` | inbox list + unread count (real) | open message, accept/decline |
| 6.3 | InboxMessage | `InboxMessage.dc.html` | `apps/inbox/[id].jsx` | message detail | accept contract offer / match invite |
| 6.4 | Wallet | `Wallet.dc.html` | `apps/wallet.jsx` | balance + activity (**likely gap**) | — (gap rows as needed) |
| 6.5 | Store | `Store.dc.html` | `apps/store.jsx` | catalogue (**likely gap**); `lib/stripeCheckout.js` | buy item |
| 6.6 | Transfers | `Transfers.dc.html` | `apps/transfers.jsx` | transfer feed (**confirm**); `lib/transferMarketEntries.js` | make transfer offer |
| 6.7 | Settings | `Settings.dc.html` | `apps/settings.jsx`, `components/settings/*` | theme/prefs stores | toggles, sign out (`authStore POST /auth/logout`) |
| 6.8 | Club | `Club.dc.html` | `apps/club/[id].jsx` | `GET /teams/:id` + club data | follow/join, view squad |

- [ ] 6.1–6.8 per recipe; then `yarn test` + status + report.

---

## Phase 7 — Cleanup

### Task 7.1: Delete replaced UI

- [ ] **Step 1:** For each screen marked `rebuild` in the inventory, find the old component/style/helper files it used and confirm (grep) nothing still imports them.
- [ ] **Step 2:** Delete the orphaned components, styles and dead helpers.
- [ ] **Step 3:** Delete tests that only covered deleted UI; keep and fix tests covering logic (stores, API, auth, realtime).
- [ ] **Step 4:** Delete legacy `src/navigation/*` screens expo-router no longer uses (confirmed in 0.1) — **only** features Lutina cleared in the 0.5 gate.
- [ ] **Step 5:** `yarn test` → failures unchanged vs baseline. **Checkpoint.**

### Task 7.2: Deep-link & notification sweep

- [ ] **Step 1: Failing test** — assert notification/deep-link targets (`lib/notificationTypes.js`, OneSignal link handlers) resolve to the rebuilt routes with params intact.
- [ ] **Step 2:** Run → FAIL on any moved route.
- [ ] **Step 3:** Update targets for any route that moved during the rebuild.
- [ ] **Step 4:** Run test → PASS. **Checkpoint.**

### Task 7.3: Final report

- [ ] Summarize to Lutina: screens done, open data-gap rows (for the `Lengarose/stage` server team), deviations from mockups and why, and the test baseline line (unchanged failures named).
