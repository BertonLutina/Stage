# Stage mobile redesign — handoff for Cursor

> Continue the work that Claude Code started. The mockups are the visual source of truth.
> Read this whole file, then `docs/STAGE_REDESIGN_PROMPT.md`, before touching code.

## 0. What you are doing

The Expo app `eafc-app` (Expo 57, React Native 0.86, expo-router, NativeWind 4, zustand) is being restyled so that **every screen matches the HTML mockups** in:

```
docs/design/stage-mockups/
  1-onboarding/      Welcome, Login, Signup, Platform, Position, Gamertag, ClubSetup
  2-home-gameday/    Home, GameDay, MatchDetail, WatchMatch, UploadVideo, Search
  3-tournaments/     Tournaments, TournamentDetail, CreateTournament, GroupStage, Standings, Fixtures, Bracket
  4-profile-teams/   Profile, EditProfile, Availability, TeamProfile, CreateTeam
  5-apps/            Apps, Inbox, InboxMessage, Wallet, Store, Transfers, Settings, Club
```

Each `*.dc.html` file is one phone screen (390×844): inline styles plus a shared `<style>` block (`.card`, `.btn`, `.chip`, `.ib`, `.tabs`, …). Open it in a browser or read the markup. Ignore `<x-dc>`, `<helmet>`, `support.js` and `DCLogic` (design-tool only). `href="X.dc.html"` shows the intended navigation.

**The mockups win over any existing style in the app.** When a screen and its mockup disagree on layout, colour, spacing, type, radius or component shape, follow the mockup. The names, scores and STC amounts in the mockups are fake demo data: always render the real data the screen already loads.

Full design rules and the mockup → file map are in `docs/STAGE_REDESIGN_PROMPT.md` (token table, radii, sizes, type, tab bar spec). It is still valid. This file only adds the current state and the next steps.

## 1. Hard rules (do not break)

1. **Restyle only.** Keep data fetching, Supabase/API calls, zustand stores, navigation params and routes, deep links, i18n `t()` keys, `testID`s and the Live Dark wallpaper mode.
2. **Never render mockup demo data.** If a mockup shows something the screen has no data for, leave the element out and list it in your report. Do not invent data.
3. **Do not commit or push** unless Lutina asks. The git root is `~/Documents/eafc`, one level above `eafc-app`. `HEAD` is `496d200`; all the redesign work is uncommitted in the working tree (about 190 files modified or new).
4. **Tokens come from the theme store**, not literals: `useThemeStore((s) => s.tokens)`. No 6-digit hex and no emoji in restyled files (a guard test enforces it, see §3). Icons are Ionicons only.
5. **Live Dark** (`theme-video`, `tokens.live === true`) must keep working: surfaces are translucent and `Screen` renders `LiveDarkWallpaper`. Don't hard-code opaque backgrounds on top of it.
6. Touch targets ≥ 44. Icon-only buttons need `accessibilityLabel`. Contrast as in the token table.
7. New visible strings: use the existing translation packs (`src/translations`) where the screen is already localised. A few screens that were never localised carry hard-coded English; don't expand that.

## 2. Current state

All 33 screens are restyled. 17 tasks, each reviewed, plus a final whole-branch review. `yarn test`: all suites pass except `src/__tests__/lib/matchFlowParity.test.js` (case "tournament detail uses Stage registration and Game Day matches"), which **already failed before this work**; leave it unless Lutina asks. Under full-suite load a few suites time out (EditProfileScreen, WatchMatchScreen, MatchDetailScreen, onboardingStepScreens, dashboardHomeRender); they pass when run alone (`yarn jest -i <file>`).

**Nothing has been checked visually**: no simulator, Xcode or web build was available. Fidelity to the mockups is verified by reading code and by tests only. The first job is a real device/simulator pass (§4).

### Shared building blocks (use them, don't re-invent)

- `src/lib/stageTheme.js` — all tokens (new keys; old keys kept for compatibility). Live Dark preset has translucent `card`/`glass`/`cardHi`.
- `src/components/ui/` — `Screen`, `Card` (`highlight`, `solid`), `Button`, `IconButton`, `Chip`, `SectionLabel`, `Avatar`, `ListRow`, `TextField`, `SelectField`, `SegmentedControl`, `Toggle`, `StepProgress`, `FormBadge`, `StatGrid`, `FloatingTabBar`, `metrics.js`, `index.js`.
- `src/components/common/{Button,Card,Input,Avatar}.jsx` delegate to `ui/` and only honour layout classes (`src/lib/layoutClassName.js`).
- `src/components/ui/metrics.js` — sizes, plus Guide-button helpers: `guideFabBottom` / `guideFabClearance` (tab screens) and `guideFabBottomStack` / `guideFabClearanceStack` (`/apps/*` stack screens, no tab bar). `Screen` takes `tabBar` and `guideFab` to pick the right bottom padding.
- `src/components/ui/FloatingTabBar.jsx` + `src/app/(tabs)/_layout.jsx` — custom floating tab bar on both platforms (NativeTabs removed). Titles: Home / Game Day / Tournaments / Profile / Search.
- Helpers: `src/lib/brandColors.js`, `src/lib/clubStatItems.js`, `src/lib/customThemeDefaults.js`, `goBackOr(router, fallback)` in `src/lib/navigationBack.js`, `src/components/apps/RegistrationStatusPill.jsx`, `src/components/settings/SettingsRows.jsx`.

### Known pitfalls found in review (avoid repeating)

- A helper rendered outside a component that needs `tokens` must read them itself via `useThemeStore`; a missing prop crashed the Inbox loan card.
- Never pass an explicit `undefined` style key (`borderRadius: undefined`): it overrides the token default and squares corners.
- `StyleSheet.absoluteFillObject` does not exist in RN 0.86: use `StyleSheet.absoluteFill`.
- The global GUIDE button floats above the tab bar (bottom `guideFabBottom`); scroll content must end above it (`guideFabClearance`, or the `Stack` variants on `/apps/*`).
- Don't show zero-filled or capped numbers as real data; hide the cell instead.

## 3. Guard tests (keep them green, extend them)

- `src/__tests__/lib/stageDesignConformance.test.js` — has a `RESTYLED_FILES` list; every file on it must have no 6-digit hex and no emoji. **Add every file you restyle.**
- `src/__tests__/screens/RestyleSmoke.test.jsx` — renders all screens and components in both themes (dark and Live Dark). Add an entry for any new component.
- `scripts/restyleFingerprint.js` — compares `testID`s, `t()` keys, routes and imports before/after a change. The diff should be empty, except one added `themeStore` import per restyled file.
- Run: `yarn test`, or `yarn jest -i path/to/file` for one suite.

## 4. Next steps, in order

1. **Device pass, Dark and Live Dark** (needs a simulator or phone; run `npx expo start`). Compare each screen with its mockup side by side. Most likely problems:
   - end of scroll on Home and Game Day (content vs floating tab bar vs GUIDE button);
   - the Watch Match chat input with the keyboard (`Screen keyboardAvoiding`; iOS `padding`, Android `height`);
   - Live Dark legibility on every card, chip and input;
   - long names / small phones (360 px wide) overflowing;
   - tab bar on devices with a home indicator.
   Fix what differs from the mockups. Report each fix.
2. **Listed omissions.** Per-task reports list every mockup element left out because no data exists (Share, Inbox filters, match stats, Store catalogue, …). Re-check each against real data; add the element only if the data truly exists. Reports: `/Users/creaafde/Documents/eafc/.superpowers/sdd/2026-10-29-stage-mobile-redesign/task-*-report.md` (ledger: `progress.md`; this folder sits at the git root, outside `eafc-app`, untracked).
3. **Consolidate duplicates.** There are about five tone-pill implementations plus `TabPill`, `SilverPill` and `Chip`. Merge into `ui/Chip` (or one `TonePill`) without changing look.
4. **Out-of-scope files still carrying hex/emoji:** `TrophyCabinetPanel`, `SplashOverlay`, `ThemeBackdrop`, `FlagMark`, `clubSquadDisplay`, `scheduleCalendar`. Restyle them to the tokens and add them to `RESTYLED_FILES`.
5. **Localisation.** Move the hard-coded English strings added in never-localised screens into `src/translations` only if Lutina asks.

## 5. Owner decisions already made (don't reopen)

- The custom floating tab bar replaces iOS NativeTabs on both platforms.
- Search tab title is "Search".
- Live Stream and Chat appear only in the Game Day "Fixtures" segment.
- Extras added beyond the mockups: stat cards on Club/Team screens (zeros hidden), bracket connectors, Inbox Accept/Decline order swapped, delete-account confirm as an outlined button with a trash icon.
- Dead components were deleted (ClubFormationCard, FormationView, TeammateChatModal, team/PlayerCard, PresidentChip, ParallelogramFrame).

## 6. Notes de Lutina (à compléter avant de lancer Cursor)

> Écrivez ici tout ce que Cursor doit savoir en plus : priorités, écrans à reprendre en premier, détails du mock-up à respecter à la lettre, choses à ne pas toucher, etc.
>
> -
> -
> -

## 7. How to report

After each batch of work, post a short report: files changed, what you matched to which mockup, what you could not match and why, any mockup element left out for lack of data, and the test result (`yarn test`, noting the known `matchFlowParity` failure).
