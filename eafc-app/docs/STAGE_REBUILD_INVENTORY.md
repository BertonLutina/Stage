# Stage Rebuild — Screen Inventory

> Step 0 of `docs/STAGE_REBUILD_PROMPT.md`. Every route/screen in `src/app/**` and `src/navigation/**`, with an action: **rebuild** (from mockup) · **delete** · **keep & restyle** (new components, no mockup). **Nothing is deleted before Lutina clears the "Needs decision before delete" list below.** Rebuilding the 33 mocked screens needs no approval.

## Baseline test state (Task 0.1 step 1)

_See `baseline-test.log` in the plan workspace. Recorded verbatim in every section report as "failures unchanged vs baseline"._

- `yarn test` (6 Nov 2026): **5 suites failed, 107 passed (112 total); 7 tests failed, 1590 passed.** Pre-existing failing suites (report as "unchanged vs baseline"):
  - `src/__tests__/components/moneyAppsRestyle.test.jsx`
  - `src/__tests__/lib/matchFlowParity.test.js`
  - `src/__tests__/screens/SettingsRestyle.test.jsx`
  - `src/__tests__/components/StageTimesNews.test.jsx`
  - `src/__tests__/screens/WatchMatchScreen.test.jsx`
  - Note: WatchMatch, Settings and the money apps (Wallet/Store/Transfers) are in the rebuild set — their restyle tests will be replaced when those screens are rebuilt.

## Routes — `src/app/**`

| Route / file | Has mockup | Action |
|---|---|---|
| `_layout.jsx` (root) | — | keep |
| `index.jsx` (entry redirect) | — | keep |
| `(tabs)/_layout.jsx` | tab bar (design spec) | keep & restyle → Foundation 1.4 |
| `(tabs)/dashboard/_layout.jsx` | — | keep |
| `(tabs)/dashboard/index.jsx` | Home | rebuild |
| `(tabs)/dashboard/playerdashboardscreen.jsx` | Home | rebuild |
| `(tabs)/matches/_layout.jsx` | — | keep |
| `(tabs)/matches/index.jsx` | GameDay | rebuild |
| `(tabs)/matches/matchdetailscreen.jsx` | MatchDetail | rebuild |
| `(tabs)/matches/watchmatchscreen.jsx` | WatchMatch | rebuild |
| `(tabs)/matches/uploadvideoscreen.jsx` | UploadVideo | rebuild |
| `(tabs)/search/_layout.jsx` | — | keep |
| `(tabs)/search/index.jsx` | Search | rebuild |
| `(tabs)/search/searchplayer.jsx` | Search (Players) | rebuild |
| `(tabs)/search/searchclubs.jsx` | Search (Clubs) | rebuild |
| `(tabs)/tournaments/_layout.jsx` | — | keep |
| `(tabs)/tournaments/index.jsx` | Tournaments | rebuild |
| `(tabs)/tournaments/tournamentlistscreen.jsx` | Tournaments | rebuild |
| `(tabs)/tournaments/tournamentdetailscreen.jsx` | TournamentDetail | rebuild |
| `(tabs)/tournaments/createtournamentscreen.jsx` | CreateTournament | rebuild |
| `(tabs)/tournaments/groupstagescreen.jsx` | GroupStage | rebuild |
| `(tabs)/tournaments/leaguestandingsscreen.jsx` | Standings | rebuild |
| `(tabs)/tournaments/fixturesscreen.jsx` | Fixtures | rebuild |
| `(tabs)/tournaments/bracketscreen.jsx` | Bracket | rebuild |
| `(tabs)/profile/_layout.jsx` | — | keep |
| `(tabs)/profile/index.jsx` | Profile | rebuild |
| `(tabs)/profile/profilescreen.jsx` | Profile | rebuild |
| `(tabs)/profile/clubProfileTabs.jsx` | Profile (club variant) | rebuild |
| `(tabs)/profile/editprofilescreen.jsx` | EditProfile | rebuild |
| `(tabs)/profile/availabilityscreen.jsx` | Availability | rebuild |
| `apps/_layout.jsx` | — | keep |
| `apps/[slug].jsx` | Apps | rebuild |
| `apps/inbox/_layout.jsx` | — | keep |
| `apps/inbox/index.jsx` | Inbox | rebuild |
| `apps/inbox/[id].jsx` | InboxMessage | rebuild |
| `apps/wallet.jsx` | Wallet | rebuild |
| `apps/store.jsx` | Store | rebuild |
| `apps/transfers.jsx` | Transfers | rebuild |
| `apps/settings.jsx` | Settings | rebuild |
| `apps/club/[id].jsx` | Club | rebuild |
| `apps/leagues/[slug].jsx` | Standings (league) | rebuild |
| `apps/competitions.jsx` | — | keep & restyle |
| `apps/competitions/[slug].jsx` | — | keep & restyle |
| `apps/find-clubs.jsx` | — (closest: Search/Clubs) | keep & restyle |
| `apps/find-players.jsx` | — (closest: Search/Players) | keep & restyle |
| `apps/register.jsx` | — (Apps grid "Register" → Signup) | keep & restyle |
| `auth/_layout.jsx` | — | keep |
| `auth/welcome.jsx` | Welcome | rebuild |
| `auth/loginscreen.jsx` | Login | rebuild |
| `auth/signupscreen.jsx` | Signup | rebuild |
| `auth/registerscreen.jsx` | Signup (alt entry) | rebuild |
| `auth/platformselection.jsx` | Platform | rebuild |
| `auth/positionselection.jsx` | Position | rebuild |
| `auth/gamertagsetup.jsx` | Gamertag | rebuild |
| `auth/clubsetup.jsx` | ClubSetup | rebuild |
| `auth/onboarding.jsx` | — (same step style) | keep & restyle |
| `auth/callback.jsx` | — (OAuth return) | keep & restyle |
| `teams/_layout.jsx` | — | keep |
| `teams/teamprofilescreen.jsx` | TeamProfile | rebuild |
| `teams/createteamscreen.jsx` | CreateTeam | rebuild |
| `teams/index.jsx` | — | keep & restyle |

## `src/navigation/**`

The app routes through expo-router (`src/app/**`). These three files are a parallel React Navigation setup.

| File | Action |
|---|---|
| `src/navigation/AppNavigator.jsx` | **verify imported**; if expo-router does not use it → delete (needs decision) |
| `src/navigation/AuthNavigator.jsx` | same |
| `src/navigation/MainTabNavigator.jsx` | same |

## Needs Lutina's decision before delete (user-reachable, no mockup)

These features have no mockup but may be reachable today. **Do not delete until Lutina rules keep-&-restyle vs delete on each:**

- Feed (`src/components/news/*`, `src/hooks/useFeed.js`) — social feed
- Reels (`src/components/*`, social reels)
- Chat / Messages / DressingRoom / TeamChat (`src/components/chat/*`)
- Formation / ManageTeam / TeamDashboard (`src/components/team/*`)
- Dashboard layout lab / picker (`src/store/dashboardLayoutStore.js`, `src/lib/dashboardLayouts.js`)
- International tournaments (`src/api/internationalTournaments.js`)
- `src/navigation/*` (above)

Keep-&-restyle (functional, needed, no mockup — no decision needed, restyle only): `apps/competitions`, `apps/competitions/[slug]`, `apps/find-clubs`, `apps/find-players`, `apps/register`, `auth/callback`, `auth/onboarding`, `teams/index`.

## Counts

Rebuild: 33 mocked screens (7 onboarding · 6 home/gameday · 7 tournaments · 5 profile/teams · 8 apps). Keep & restyle: 8. Keep (layouts/entries): 11. Delete: pending Lutina's decision on the list above.
