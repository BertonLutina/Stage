# Stage Mobile Redesign — Rebuild Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle all 33 mockup screens of the Expo app (`eafc-app`) to the navy/cyan design in `docs/design/stage-mockups/`, with zero change to behaviour, data, stores, navigation, i18n keys or testIDs.

**Architecture:** Change the single token source first (`src/lib/stageTheme.js` + `tailwind.config.js`) so every existing screen inherits palette, radius and muted colour immediately. Then add the shared primitives in `src/components/ui/` and the floating tab bar. Then restyle screens group by group, each group guarded by a conformance test (no hex literals, no emoji) and a behaviour fingerprint diff (testIDs, `t()` keys, router targets, store/API imports).

**Tech Stack:** Expo 57 / React Native 0.86, expo-router (`Tabs`), NativeWind 4 (`className`), zustand `useThemeStore`, `@expo/vector-icons` Ionicons, jest-expo + `@testing-library/react-native`.

**Spec:** `docs/STAGE_REDESIGN_PROMPT.md` (mockups: `docs/design/stage-mockups/<section>/*.dc.html`, 390×844).

## Global Constraints

- Restyle only. No change to API calls, zustand stores, navigation params/structure, deep links, `t()` keys, `testID`s.
- Mockup names, scores, STC amounts are fake: always render the data the screen already loads. If a mockup element has no data, leave it out and list it in the section report. Never invent data.
- Tokens (verbatim): `bg #0A1F4A` · `bgDeep #07163A` · `card #132B5C` · `cardHi #16346B` · `border #234480` · `borderStrong #4A6AA5` · `text #EAF2FF` · `textSoft #C9D8EE` · `muted #9FB3D1` · `cyan #5FE3E8` · `cyanHi #8CF5F8` · `aqua #2CCFD6` · `onCyan #07163A` · `success #4ADE80 / bg #14532D` · `danger #F87171 / bg #5B1A1A` · `warning #FBBF24 / bg #2A2418 / border #B45309`.
- Radii: card 16 · button 14 · input & icon button 12 · chip 999 · tab bar 22 · avatar tile 12. Spacing: screen gutter 20, content gap 14–16, card padding 16.
- Sizes: button height 52 · icon button 44×44 · chip height 34 · input height 50 · every touch target ≥ 44.
- Type: headings uppercase in `EASports15` (`FONT_EA_SPORTS` in `src/lib/fonts.js`), letter-spacing ≈ 0.03em, screen titles 34, hero titles 38–40. Section label: 11px / 600 / uppercase / 0.12em / `muted`. Body: system font 14–15.
- Icons: Ionicons outline, 22px. No emoji.
- Floating tab bar: 16px from sides, 24px from bottom, height 64, radius 22, `bgDeep` + `border`, 5 icon-only tabs (Home, Game Day, Tournaments, Profile, Search); active = cyan icon on `card` pill.
- Icon-only buttons carry `accessibilityLabel`. New visible strings go through the existing translation packs (`src/translations`).
- Live Dark (`tokens.live === true`, `LiveDarkWallpaper`, `LiveGlass`) must keep working on every new surface.
- **Do not commit or push** unless Lutina asks. Git root is `~/Documents/eafc` (one level above `eafc-app`). Where the usual TDD template says "commit", this plan says "checkpoint" (review `git diff --stat`, nothing committed).
- Paths below are relative to `eafc-app/`. Run tests with `yarn jest <path>`; full suite with `yarn test`.

## Findings that shape the plan

1. **Baseline is not green.** `yarn test` today: 2 failing / 83 passing suites — `src/__tests__/lib/matchFlowParity.test.js` (tournament detail source must match `/matchdetailscreen/`) and `src/__tests__/screens/EditProfileScreen.test.jsx` (5 s timeout). Both pre-date this work; each section report states "failures unchanged vs baseline", not "all green".
2. **Route files are mostly thin wrappers.** Real UI lives in `src/components/{dashboard 1713 lines, matches 3361, profile 2365, onboarding 1237, tournament 1244, transfer 985, settings 665, inbox 783, team 818, directory 780}` and `src/app/**` screens. The prompt's mapping lists routes; tasks below add the component files that actually hold the markup.
3. **Existing look is a different system.** `stageTheme.js` is sharp HUD: `bg #05070F`, `cyan #00F0FF`, `amber #FFD60A`, `CARD_RADIUS = 2` (used in 16 files), muted = text at 58 % alpha. `CommandCenterUI.jsx` has its own `FUT`/`TILE_*` constants and `GamerProfileUI.jsx` has `PITCH`. ~115 non-test files hold hex literals (top: `#041018`, `#FFFFFF`, `#5FE3E8`, `#00E5FF`, `#FB7185`). Only 29 files use `className`; 3 files use `testID`.
4. **Tests that will notice.** `stageTheme.test.js` asserts the old values (`#05070F`, `#00F0FF`, radius 2) → updated deliberately in Task 1. `pageInsets.test.js` greps `(tabs)/_layout.jsx` for `bottom: tabBottom` and `GamerProfileUI.jsx` for `pageBottomPad(insets.bottom)`. 19 test files `readFileSync` source and regex it — run them after every task.
5. **"Keep the light theme working" is moot.** `STAGE_THEME_IDS` is `['theme-dark','theme-video']`; light/white/custom already map to dark. Plan keeps Tailwind `light*` colours untouched and does not build a light variant.
6. **Features the mockups don't show but must survive:** Live Dark wallpaper, Game Day tile photo backgrounds (`PageTile`, `GameDayTileBackground*`), dashboard layout picker/lab, theme toggle. They are restyled at chrome level only, not removed.
7. **Decisions made here (override in review if wrong):**
   - Tab bar becomes a custom `tabBar` on **both** platforms. `NativeTabs` cannot be given a 16/24/64/22 floating pill; iOS loses the native tab bar look. Search stays the 5th tab.
   - `ui/` primitives are canonical. `common/{Button,Card,Input,Avatar}` keep their prop APIs and delegate to `ui/`, so existing call sites and tests keep working and migrate opportunistically.
   - Dark mode drops the hairline-grid + floodlight wash of `GamerProfileShell` (not in the mockups): flat `bg`. Welcome keeps its pitch-line decoration from the mockup.

## Review Focus

Failure modes the spec implies but no screen test exercises, most likely first:

1. **Live Dark:** every new surface must go translucent over the wallpaper, not paint opaque navy. Pinned in Task 2 (Card/Chip/Screen) and Task 4 (tab bar).
2. **Real data is longer than mock data:** 20-char gamertags, club names, 6-digit STC amounts, French/German strings inside fixed-height chips (34) and buttons (52). Must truncate (`numberOfLines`, ellipsis), never overflow or grow. Pinned in Task 2/3.
3. **Empty / loading / error states:** mockups show only the happy path. Every restyled screen keeps its skeleton, empty and error branches using the same Card/Chip patterns — no blank screens. Checked per task with an empty account in the simulator.
4. **Keyboard, safe-area and tab bar overlap:** forms (login, signup, create tournament, edit profile, create team) must scroll above keyboard and above the 24 + 64 px tab bar; Android gesture-nav inset must not be undercut. Pinned in Task 2 (`Screen`) and Task 4 (`tabBarHideOnKeyboard`).
5. **Accessibility:** icon-only buttons without `accessibilityLabel`, touch targets under 44, `muted` on card contrast. Pinned in Task 2 (IconButton throws without a label in dev).

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/stageTheme.js` (modify) | Single token source; new keys added, old keys kept so consumers don't break |
| `tailwind.config.js` (modify) | Same tokens for `className` users |
| `src/components/ui/*.jsx` (create) + `index.js` | Primitives from the prompt, one file per component |
| `src/components/common/{Button,Card,Input,Avatar}.jsx` (modify) | Thin delegates to `ui/` |
| `src/app/(tabs)/_layout.jsx` + `src/components/ui/FloatingTabBar.jsx` | Floating tab bar |
| `scripts/restyleFingerprint.js` (create) | Prints sorted testIDs, `t()` keys, router targets, api/store imports of given files, for before/after diffs |
| `src/__tests__/lib/stageDesignConformance.test.js` (create) | Growing list of restyled files; asserts no 6-digit hex literals (outside token files) and no emoji |

---

### Task 1: Tokens, conformance guard, fingerprint script

**Files:**
- Modify: `src/lib/stageTheme.js`, `tailwind.config.js`, `src/components/dashboard/CommandCenterUI.jsx` (`FUT`, `TILE_*`, `GAME_DAY_SILVER`), `src/components/profile/gamer/GamerProfileUI.jsx` (`PITCH`, shell background)
- Create: `scripts/restyleFingerprint.js`, `src/__tests__/lib/stageDesignConformance.test.js`
- Test: `src/__tests__/lib/stageTheme.test.js` (update)

**Interfaces:**
- Produces: `readStageTheme()` tokens gain `bgDeep, cardHi, border, borderStrong, textSoft, cyanHi, aqua, onCyan, success, successBg, danger, dangerBg, warning, warningBg, warningBorder` and change `bg → '#0A1F4A'`, `primary/cyan → '#5FE3E8'`, `muted → '#9FB3D1'` (solid), `cardRadius → 16`, `CARD_RADIUS → 16`. Live preset (`theme-video`) returns translucent `card`/`glass`/`cardHi` built with `hexToRgba('#132B5C', 0.62)`.
- Produces: `node scripts/restyleFingerprint.js <file...>` → stdout lines `testID:<v>`, `t:<key>`, `route:<target>`, `import:<module>` sorted, de-duplicated.
- Produces: `RESTYLED_FILES: string[]` in the conformance test — later tasks append their files.

- [ ] **Step 1: Record baseline.** Run `yarn test`; confirm exactly the 2 failures listed in Findings #1; save the summary line in the first section report.
- [ ] **Step 2: Update `stageTheme.test.js` to the new values** (`bg '#0A1F4A'`, `primary '#5FE3E8'`, `muted '#9FB3D1'`, `cardRadius 16`, plus one assertion per new token key with the Global Constraints values; live preset: `card` matches `/^rgba\(19,43,92,/`). Run `yarn jest src/__tests__/lib/stageTheme.test.js` → FAIL.
- [ ] **Step 3: Implement the token change in `stageTheme.js`.** Keep every existing key (`hairline`, `glass`, `cardSolid`, `inputFill`, `inputBorder`, `wash`, `amber`, `tileBorder`, …) but re-derive them from the new palette (`hairline → border`, `inputFill → bgDeep`, `inputBorder → border`, `amber → warning`). Replace `wash` with transparent stops (flat background). Keep `contrastRatio`/`isDarkHex` untouched.
- [ ] **Step 4: Add contrast assertions to `stageTheme.test.js`:** `contrastRatio(muted, card) >= 4.5`, `contrastRatio(text, bg) >= 7`, `contrastRatio(onCyan, cyan) >= 7`. Run → PASS. (If `muted` on `card` fails, report it; do not change the spec colour.)
- [ ] **Step 5: Update `tailwind.config.js`:** `darkSurface #0A1F4A`, `dark #07163A`, `darkCard #132B5C`, `darkBorder #234480`, `darkMuted #9FB3D1`; add `bgDeep, card, cardHi, border, borderStrong, textSoft, cyanHi, success, warning, danger #F87171`; `primary` and `lineMain` stay `#5FE3E8`. Leave `light*` colours.
- [ ] **Step 6: Re-point `FUT`, `TILE_FILL*`, `PITCH`, `GAME_DAY_SILVER` to the new tokens** (values only; names and exports unchanged). Remove the grid/wash layers from `GamerProfileShell` in non-live mode.
- [ ] **Step 7: Write `scripts/restyleFingerprint.js`** (regex over source: `testID=["'{]…`, `\bt\(['"]key['"]`, `router\.(push|replace)\(…`, import specifiers matching `@/api|@/store|store/`). Verify: `node scripts/restyleFingerprint.js src/app/auth/welcome.jsx` prints at least the `import:expo-router` line and exits 0.
- [ ] **Step 8: Write `stageDesignConformance.test.js`** with `RESTYLED_FILES = []` and two tests per file (`/#[0-9A-Fa-f]{6}\b/` absent; emoji regex `/\p{Extended_Pictographic}/u` absent). Run → PASS (empty list).
- [ ] **Step 9: Run `yarn test`.** Expected: only the 2 baseline failures. Checkpoint (`git diff --stat`, no commit).

### Task 2: Primitives A — Screen, Card, Button, IconButton, Chip, SectionLabel, Avatar, ListRow

**Files:**
- Create: `src/components/ui/{Screen,Card,Button,IconButton,Chip,SectionLabel,Avatar,ListRow}.jsx`, `src/components/ui/index.js`
- Test: `src/__tests__/components/ui/primitivesA.test.jsx`

**Interfaces:**
- Consumes: `useThemeStore((s) => s.tokens)`, `LiveGlass` (`src/components/theme/LiveGlass.jsx`), `LiveDarkWallpaper`, `pageBottomPad`, `FONT_EA_SPORTS`.
- Produces (props are the contract for all later tasks):
  - `Screen({ children, scroll = true, keyboardAvoiding = false, tabBar = true, style })` — `bg`, top safe-area, 20 gutters, bottom padding = `24 + 64 + 16` (+ inset above 24) when `tabBar`; transparent + `LiveDarkWallpaper` when `tokens.live`.
  - `Card({ children, highlight = false, style, onPress })` — radius 16, padding 16, `card`/`border`; `highlight` → `cardHi` + `aqua` border; live → `LiveGlass`.
  - `Button({ title, onPress, variant = 'primary'|'secondary'|'danger', loading, disabled, icon, accessibilityLabel, testID })` — height 52, radius 14, `numberOfLines={1}`.
  - `IconButton({ icon, onPress, accessibilityLabel /* required */, testID })` — 44×44, radius 12; missing label → `console.error` in `__DEV__`.
  - `Chip({ label, active = false, onPress, icon })` — height 34, pill, `numberOfLines={1}`.
  - `SectionLabel({ children, right })`, `Avatar({ initials, uri, size = 44, round = false })`, `ListRow({ icon, title, value, onPress, chevron = true, danger = false })`.

- [ ] **Step 1: Write failing tests** `primitivesA.test.jsx`: Button primary has `backgroundColor '#5FE3E8'`, height 52, borderRadius 14; Button `loading` hides title and ignores press; Chip `active` background `#5FE3E8`, inactive `#132B5C`, height 34, `numberOfLines` 1 with a 60-char label; Card `highlight` border `#2CCFD6`; Card with live tokens renders through `LiveGlass` (no opaque `#132B5C` background); IconButton is 44×44 and logs an error without `accessibilityLabel`; Avatar `round` radius = size/2, default radius 12; ListRow `danger` text colour `#F87171`; Screen with `tokens.live` renders `LiveDarkWallpaper` and no solid `bg`.
- [ ] **Step 2: Run** `yarn jest src/__tests__/components/ui/primitivesA.test.jsx` → FAIL (modules missing).
- [ ] **Step 3: Implement the eight components** reading every colour/size from tokens (no literals). Heading/label typography from `fonts.js`. `index.js` re-exports all.
- [ ] **Step 4: Run the test** → PASS. Then `yarn jest src/__tests__/components` → no new failures (existing Button/Card/Avatar tests untouched at this point).
- [ ] **Step 5: Add `src/components/ui/*.jsx` to `RESTYLED_FILES`; run the conformance test** → PASS. Checkpoint.

### Task 3: Primitives B + common/ delegates

**Files:**
- Create: `src/components/ui/{TextField,SelectField,SegmentedControl,Toggle,StepProgress,FormBadge,StatGrid}.jsx`
- Modify: `src/components/ui/index.js`, `src/components/common/{Button,Card,Input,Avatar}.jsx`
- Test: `src/__tests__/components/ui/primitivesB.test.jsx`; existing `Button.test.jsx`, `Input.test.jsx`, `Avatar.test.jsx` must keep passing unchanged.

**Interfaces:**
- Produces: `TextField({ label, value, onChangeText, error, multiline, ...TextInputProps })` (height 50, radius 12, `bgDeep` fill, `border`; error → `danger` border + message); `SelectField({ label, value, placeholder, onPress })`; `SegmentedControl({ options: {key,label}[], value, onChange })` (track `bgDeep`, active segment `cyan`/`onCyan`); `Toggle({ value, onValueChange, accessibilityLabel })`; `StepProgress({ total = 4, current })` (bars filled `cyan` up to `current`); `FormBadge({ result: 'W'|'D'|'L' })` (success / muted / danger with `*Bg`); `StatGrid({ items: {label,value}[], columns = 3 })`.

- [ ] **Step 1: Write failing tests:** SegmentedControl calls `onChange` with the option key and highlights the active one; StepProgress `total=4,current=2` renders 2 filled + 2 empty bars; FormBadge `W/D/L` colours `#4ADE80/#9FB3D1/#F87171`; TextField shows error message and `danger` border and has `accessibilityLabel` = label; Toggle press calls `onValueChange(!value)`; StatGrid with 5 items and `columns=3` yields 2 rows; a 40-char SegmentedControl label is `numberOfLines={1}`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement the seven components.**
- [ ] **Step 4: Make `common/Button|Card|Input|Avatar` delegate to `ui/`** keeping their exact prop names (`title, variant, loading, disabled, className`; `Card className`) — map legacy variants (`primary2/secondary/accent/ghost` → closest ui variant). Run `yarn jest src/__tests__/components` → PASS with the three existing tests unmodified.
- [ ] **Step 5: Append new files to `RESTYLED_FILES`; run conformance + the 19 source-reading tests** (`yarn jest src/__tests__/lib src/__tests__/onboarding`) → only baseline failures. Checkpoint.

### Task 4: Floating tab bar

**Files:**
- Create: `src/components/ui/FloatingTabBar.jsx`
- Modify: `src/app/(tabs)/_layout.jsx`, `src/__tests__/lib/pageInsets.test.js` (only if the `bottom: tabBottom` regex no longer matches — keep the literal `bottom: tabBottom` in the new bar to avoid editing it)
- Test: `src/__tests__/components/ui/FloatingTabBar.test.jsx`

**Interfaces:**
- Consumes: expo-router `Tabs` `tabBar` prop (`BottomTabBarProps`: `state`, `descriptors`, `navigation`).
- Produces: `FloatingTabBar(props: BottomTabBarProps)` — absolute, `left/right 16`, `bottom: tabBottom` (`Math.max(insets.bottom, 24)`), height 64, radius 22, `bgDeep` + `border`; 5 items of 48×48, active = `cyan` Ionicon on `card` pill radius 14; each item has `accessibilityRole="tab"`, `accessibilityLabel = options.title`, `accessibilityState.selected`; live → `BlurView` + translucent fill.

- [ ] **Step 1: Write failing tests:** renders 5 tabs in order Home, Game Day, Tournaments, Profile, Search; focused tab icon colour `#5FE3E8` inside a `#132B5C` pill; pressing a tab calls `navigation.navigate`; each tab has an `accessibilityLabel`; live tokens → `BlurView` present; container style has `left 16, right 16, height 64, borderRadius 22`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement `FloatingTabBar`** (Ionicons outline when idle, filled name when focused, as in the existing `SCREENS` table).
- [ ] **Step 4: Rewrite `_layout.jsx`:** one `<Tabs tabBar={(p) => <FloatingTabBar {...p} />} screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true, sceneStyle transparent }}>` for both platforms; delete the `NativeTabs` branch; keep `backBehavior="history"` and the five `Tabs.Screen` names (`dashboard, matches, tournaments, profile, search`) so routes and deep links are unchanged.
- [ ] **Step 5: Run** the new test + `pageInsets.test.js` + `yarn test` → only baseline failures.
- [ ] **Step 6: Simulator check** (iOS simulator + Android): bar visible on all five tabs, hides when the keyboard opens, Live Dark shows wallpaper through the bar. Note any gap in the report. Checkpoint.

---

## Screen tasks (5–16): common recipe

Every screen task follows these steps; the table gives its scope. "Mockup" = `docs/design/stage-mockups/<folder>/<Name>.dc.html` (read the markup; ignore `<x-dc>`, `<helmet>`, `support.js`, `DCLogic`).

- [ ] **S1 — Fingerprint before:** `node scripts/restyleFingerprint.js <files…> > $TMPDIR/<task>.before`.
- [ ] **S2 — Red:** append the task's files to `RESTYLED_FILES`; run `yarn jest src/__tests__/lib/stageDesignConformance.test.js` → FAIL naming each file with literals/emoji.
- [ ] **S3 — Restyle** each file to its mockup using `ui/` primitives and tokens only: layout, order, copy structure, icons (Ionicons, no emoji). Keep every data branch (loading, empty, error), handler, `testID`, `t()` key. Replace hard-coded hex with tokens; `#6B7280` → `tokens.muted`. Where a mockup element has no data source, omit it and note it.
- [ ] **S4 — Green:** conformance test PASS; fingerprint after must equal before except added `import:@/components/ui…` lines: `diff $TMPDIR/<task>.before <(node scripts/restyleFingerprint.js <files…>)` shows only those.
- [ ] **S5 — Regression:** `yarn test` → only the 2 baseline failures; existing suites touching these files (listed per task) pass unmodified. A snapshot/assertion changes only when it encodes the old look, and the report says which.
- [ ] **S6 — Visual check** in the simulator against the mockup, in Dark and Live Dark, with real data and with an empty account; check the keyboard on forms.
- [ ] **S7 — Report:** files changed · elements left out (no data) · anything not matched and why · baseline-failures-unchanged statement. Checkpoint, no commit.

| Task | Section | Mockups | Files (route → component) | Suites to watch |
|---|---|---|---|---|
| 5 | 1 Auth entry | Welcome, Login, Signup | `app/auth/{welcome,loginscreen,signupscreen,registerscreen,callback}.jsx`, `components/auth/SocialAuthIconButtons.jsx` | `biometricAuth`, `onboardingIntentParity` |
| 6 | 1 Onboarding steps | Platform, Position, Gamertag, ClubSetup | `app/auth/{platformselection,positionselection,gamertagsetup,clubsetup,onboarding}.jsx`, `components/onboarding/*` (use `StepProgress` 4 bars; Position = pitch with position bubbles) | `clubSetupFounderParity`, `onboardingIntentParity`, `onboardingGate` |
| 7 | 2 Home | Home | `app/(tabs)/dashboard/*`, `components/dashboard/*` (incl. `PitchAtmosphere`, `DashboardRankRing`, form strip → `FormBadge`) | `DashboardIdentityHero`, `TransferWindowHomeIcon` |
| 8 | 2 Game Day | GameDay, MatchDetail, WatchMatch, UploadVideo | `app/(tabs)/matches/*`, `components/matches/*`, `components/theme/PageTile.jsx` (tile photo backgrounds keep working under new chrome) | `gameDayTileBackgrounds`, `matchFixtureLifecycle`, `gameDayHub`, `VideoPlayer` |
| 9 | 2 Search | Search | `app/(tabs)/search/*`, `app/apps/{find-clubs,find-players}.jsx` (Players/Clubs `SegmentedControl`), `components/directory/*` | `directoryHub`, `playerDirectory`, `stageDirectories` |
| 10 | 3 Tournaments | Tournaments, TournamentDetail, CreateTournament | `app/(tabs)/tournaments/{index,tournamentlistscreen,tournamentdetailscreen,createtournamentscreen}.jsx`, `components/tournament/*` | `communityTournamentCreate`, `tournamentRegistration`, `matchFlowParity` (baseline-failing; must not get worse) |
| 11 | 3 Competition views | GroupStage, Standings, Fixtures, Bracket | `app/(tabs)/tournaments/{groupstagescreen,leaguestandingsscreen,fixturesscreen,bracketscreen}.jsx`, `app/apps/leagues/[slug].jsx`, `app/apps/competitions*` | `standingsRows`, `bracketView`, `tournamentStages` |
| 12 | 4 Profile | Profile, EditProfile, Availability | `app/(tabs)/profile/*`, `components/profile/**` | `ProfileScreen`, `EditProfileScreen` (baseline-failing), `clubProfileTabs`, `Avatar` |
| 13 | 4 Teams | TeamProfile, CreateTeam | `app/teams/*`, `components/team/*`, `components/club/*` | `clubProfileData`, `ClubBannerAvatar` |
| 14 | 5 Apps hub & Inbox | Apps, Inbox, InboxMessage | `components/apps/AppDirectoryScreen.jsx`, `app/apps/[slug].jsx`, `app/apps/inbox/*`, `components/inbox/*` | `miniApps`, `inboxHelpers`, `pageWalkthroughs` |
| 15 | 5 Money | Wallet, Store, Transfers | `app/apps/{wallet,store,transfers}.jsx`, `components/transfer/*` | `transferHub`, `transferWindow`, `stripeCheckout`, `transferCarousel` |
| 16 | 5 Settings & Club + unmapped | Settings, Club | `app/apps/settings.jsx`, `components/settings/*`, `app/apps/club/[id].jsx`; no-mockup screens `app/apps/register.jsx`, `app/teams/index.jsx` use closest-mockup patterns | `SettingsListbox`, `leaveClub`, `Toast` |

Per-task specifics that the recipe cannot infer:

- **Task 5 (Review Focus 4):** login/signup use `Screen keyboardAvoiding`, `tabBar={false}`; Welcome keeps the mockup's pitch-line decoration and `logo-lockup.png` replaced only if the mockup's "Stage" wordmark is a type treatment — keep the asset, report the difference.
- **Task 6:** 4-step bar maps to the existing step order in `onboarding.jsx`; do not change the gate logic (`onboardingGate.js`).
- **Task 8:** `MatchDetail`/`WatchMatch` score blocks render real scores via existing selectors; `UploadVideo` dashed zone uses `borderStrong`.
- **Task 12:** Profile hub keeps `GamerProfileShell` as the wrapper (Live Dark depends on it); only the inner surfaces change.
- **Task 16:** Settings theme toggle (Dark / Live Dark) stays; remove nothing.

### Task 17: Final sweep

**Files:** read-only, plus fixes found.

- [ ] **Step 1: Hex audit:** `grep -rEn '#[0-9A-Fa-f]{6}' src --include='*.jsx' | grep -v __tests__ | grep -v stageTheme` → every remaining hit is either in a file outside the 33 mapped screens (list them) or justified (brand logos, social-auth icons).
- [ ] **Step 2: Conformance + full suite:** `yarn test` → exactly the 2 baseline failures (or fewer).
- [ ] **Step 3: Accessibility pass:** every `IconButton`/icon-only `TouchableOpacity` in restyled files has `accessibilityLabel` (`grep -rn "Ionicons" src/app src/components | ` cross-checked by reading the hits).
- [ ] **Step 4: Walk all 33 screens** in simulator, Dark then Live Dark, French locale once (long strings), one empty account; fix overflows.
- [ ] **Step 5: Final report:** per-section list of omitted mockup elements, unmatched details, tab-bar decision (Findings #7), and the untouched baseline failures. Checkpoint; ask Lutina before any commit.

---

## Self-review

- **Spec coverage:** tokens ✓ (T1) · `tailwind.config.js` + `stageTheme`/`themeStore` ✓ (T1; `themeStore` needs no code change, it spreads `tokens`) · 14 shared components ✓ (T2–T3: Screen, Card, Button, IconButton, Chip, SegmentedControl, SectionLabel, Avatar, TextField/SelectField, ListRow, Toggle, StepProgress, FormBadge, StatGrid) · floating tab bar ✓ (T4) · sections 1–5 incl. unmapped screens ✓ (T5–T16) · per-section `yarn test` + report ✓ (recipe S5/S7) · no commit ✓ · a11y ✓ · Live Dark ✓.
- **Type consistency:** primitive prop names defined once in T2/T3 and used by that name in the recipe/tasks (`highlight`, `variant`, `active`, `accessibilityLabel`, `SegmentedControl options/value/onChange`).
- **Proportion:** screen tasks use one shared recipe instead of 12 copies; the plan carries decisions (props, tokens, files, tests), not component bodies.
- **Open points for review:** (a) tab bar custom on both platforms; (b) `common/*` delegating to `ui/`; (c) flat background replacing the hairline-grid wash; (d) Task order assumes sequential execution per the prompt — T5–T16 only share `ui/`, so after T4 they can run in parallel worktrees if you prefer speed.
