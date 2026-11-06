# Stage Rebuild — Status & Data Map

> One table per section: screen · elements (from the mockup) · source (endpoint / store / hook) · status (`mapped` = endpoint exists · `gap` = no backing, see `STAGE_DATA_GAPS.md`). Build status column (`todo` / `wip` / `done`) is updated as each screen ships. Canonical data-hook shape: `{ data, loading, error, refreshing, refetch }` (Task 0.4).

Sources keyed as: **stageClient** `/api/stage` · **api** `/api/mobile` · store/hook/lib under `src/`.

## Section 1 · Onboarding & account

| Screen | Elements | Source | Status |
|---|---|---|---|
| Welcome | brand lockup, mark watermark, tagline, Create/Login CTAs | static (BrandLogo) | mapped |
| Login | email, password, forgot-password, sign in, Google/Apple, health check | `authStore` POST `/auth/login`; `useSocialAuth` GET `/auth/{provider}?client=mobile`; GET `/health` | mapped |
| Signup | Player/Club-manager type, display name, email, password, terms, continue | `authStore` POST `/auth/register` (accountIntent in `lib/accountIntent.js`) | mapped |
| Platform | PS5/Xbox/PC options, cross-play toggle, continue | stageClient POST/PATCH `/players` (`services/playerIdentityService.js`, `lib/profilePlatform.js`) | mapped |
| Position | pitch position bubbles, main + up-to-2 alternates | stageClient PATCH `/players` (position fields) | mapped |
| Gamertag | gamertag input, availability check, preview card, "Link Pro Club stats" | stageClient `/players`; **availability check** of gamertag; **Pro Club link import** | gamertag save mapped; availability-check + Pro-Club-import = **gap** |
| ClubSetup | Create/Join toggle, crest upload, club name, short name, colours, region, finish; timezone on finish | stageClient POST `/clubs` + `functions/contractManagement`; PATCH `/auth/timezone`; join-with-code | create/join mapped; **crest upload**, **join-by-code** confirm | 

## Section 2 · Home & Game Day

| Screen | Elements | Source | Status |
|---|---|---|---|
| Home | greeting + gamertag, next match (teams/time/comp), club rank+div, contract games x/y + bar, recent form W/D/L, avg rating, objectives list + progress + CLAIM REWARD, unread inbox dot, Apps grid link | `authStore`/`/auth/me`; next match `api GET /matches/fixtures`; club `api /teams/:id`; `vm.tenure`, `vm.form`, `vm.avgRating`; `ObjectivesWidget`; `/apps` | rebuilt + mapped; Apps launcher is reachable from Stage layout E |
| GameDay | Arrange Game CTA, Fixtures/Calendar/Results segmented, contract-ends-in-N-games banner, dated events (match/contract-end), invite chips | `api GET /matches/fixtures?status=…`; `lib/arrangeGame.js`, `lib/scheduleData.js`, `lib/scheduleCalendar.js`; contract reminder via `CONTEXT.md` Schedule | fixtures + schedule mapped; **contract-games-left count = gap (shared w/ Home)** |
| MatchDetail | score, scorers line, Watch/Upload CTAs, match stats (possession/shots/pass%), man of the match + rating | `api GET /matches/:id` | score/teams mapped; **match stats, scorers, MOTM = gap** |
| WatchMatch | video player, scrub markers, Highlights/Full/My-clips tabs, highlight list (goal, player, time, duration) | `api POST /matches/:id/chat/read`; video source; **highlights list** | player chrome mapped; **highlights list, scrub markers = gap** |
| UploadVideo | dropzone, upload progress, title, type chips (Full/Highlight/Clip), visibility select, publish | `api POST /matches/:id/video` (`lib/uploadProfileMedia.js`, `lib/formDataFile.js`) | mapped |
| Search | search box, Players/Clubs segmented, result count, result rows (name, pos/platform/club, OVR), actions | `useSearchDirectory` → `loadPlayerDirectory` / `loadClubDirectory`; Player/Club entities + real OVR fields | rebuilt + mapped; loading/error/retry/refresh contract |

## Section 3 · Tournaments

| Screen | Elements | Source | Status |
|---|---|---|---|
| Tournaments | Open/My/Finished filter, cards (name, format, clubs, registered/open state, prize, entry fee, slots x/y, starts) | `useTournamentsList` → `stageClient.entities.Tournament.list`; player/club identity for My tournaments | rebuilt + mapped; canonical loading/error/refresh contract |
| TournamentDetail | header (format·state), stats (clubs/entry/prize/start), rules-accepted + entrant chip, nav rows (group/standings/fixtures/bracket), next-match CTA, start/register/admin actions | `fetchTournamentPublic`, `fetchTournamentMatches`, `resolveMyPlayerAndClub`, `api/tournamentActions.js` | rebuilt + mapped; richer registration/admin features retained |
| CreateTournament | name, entrant type, format (League/Groups+KO/Knockout/Swiss), clubs count, platform, start date, region, entry fee STC, rules, prize breakdown, create | `stageClient.entities.Tournament.create`; `lib/communityTournamentCreate.js`, `tournamentRuleTemplates.js` | rebuilt + mapped; richer real fields retained |
| GroupStage | group chips, group table (#,club,P,GD,PTS), qualification note, group matches (played + upcoming) | `useTournament` → real tournament matches; groups + tables derived with `tournamentEngine` / `standingsCore` | rebuilt + mapped; no dedicated `/groups` endpoint required |
| Standings | Overall/Home/Away/Form tabs, league/group tables | `useTournament` → real matches; `tournamentEngine`, `standingsRows.js`, `standingsCore.js`; `apps/leagues/[slug]` retained for regional leagues | Overall rebuilt + mapped; **Home/Away/Form splits = gap** and render explicit empty state |
| Fixtures | All/Scheduled/Completed filters, score-or-time rows, open match detail | `useTournament` → `fetchTournamentMatches` | rebuilt + mapped; client-side filters preserve one fetched source of truth |
| Bracket | rounds columns, match cells (win/lose + score), TBD slots | `useTournament` → real tournament matches; `lib/bracketRounds.js` | rebuilt + mapped; no dedicated `/bracket` endpoint required |

## Section 4 · Profile & teams

| Screen | Elements | Source | Status |
|---|---|---|---|
| Profile | avatar + OVR badge, name, pos/platform, club chip, stat grid (Games/Goals/Assists/Rating), nav rows (Edit/Availability/Team/Wallet), richer Posts/Showcase/Career/Trophies/Lifestyle tabs | `useProfile` → `resolveMyPlayerAndClub` + `GET /player-careers/:id`; real player `overall_rating`; wallet route backed by `playerWallet`; existing profile services | rebuilt + mapped; richer profile retained; **Pro-Club link/unlink = gap** |
| EditProfile | avatar/banner upload, display name, bio, main/alt position, platform, country, save | `stageClient.entities.Player`; `lib/uploadProfileMedia.js`, `countries.js`, `platformDisplay.js` | rebuilt + mapped; **preferred foot = gap** and omitted |
| Availability | weekly 7×4 grid, available/busy states, timezone label, save, error/retry/refresh | `useAvailability` → `api GET/PUT /users/:id/availability`; time ranges mapped losslessly to binary cells | rebuilt + mapped for binary availability; **Maybe tri-state = gap** |
| TeamProfile | crest, name, platform/region/founded, wins/players/trophies, squad and richer club tabs | `useTeam` → `loadClubProfile`; founded year from `created_date`; trophies from real achievements/placements | rebuilt + mapped; richer office/fixtures/stats/chat features retained |
| CreateTeam | crest, team name, tag, country, bio, find players, create | `teamStore` POST `/teams`; player directory route | rebuilt + mapped for confirmed fields; **colours, direct invites, open-to-applications = gaps** |

## Section 5 · Apps

| Screen | Elements | Source | Status |
|---|---|---|---|
| Apps | dedicated `/apps` grouped launcher with searchable tiles → real routes | `lib/miniApps.js`; Home Stage layout E shortcut | rebuilt + mapped; launcher moved out of Search |
| Inbox | All/Needs-action/Unread filters, message rows, unread state, needs-action tag, mark-all-read, realtime refresh | `lib/inboxData.js`, `inboxHelpers.js`; InboxMessage entity subscription | rebuilt + mapped; mark-all-read persists each unread entity |
| InboxMessage | sender, title, body, structured contract/match/loan cards, warning banner, Decline/Accept/Delete | InboxMessage entity loaded from the real inbox; `respondInboxMessage`, `contractManagement`, schedule and loan services | rebuilt + mapped; richer action types retained |
| Wallet | balance, weekly salary, collect salary, activity list and filters | `loadWallet` → `playerWallet` actions `get_balance`, `get_history`, `pay_salary` | rebuilt + mapped for real balance/history/salary; **monthly delta and Send STC = gaps** |
| Store | balances, STAGE Plus monthly/yearly, credit packs, Stripe checkout/return/cancel-renewal | `loadStore`; `StoreConfig`; `lib/stripeCheckout.js` | real store retained and mapped; **cosmetic STC catalogue + item buy = gaps** |
| Transfers | real free-agent/expiring market, list/carousel, filters, window status, profile/contract/loan path | `getTransferMarket`; `transferMarketEntries.js`; `useTransferWindowStatus`; profile contract/loan services | rebuilt + mapped for current market; **Latest/My-offers feed = gap** |
| Settings | Appearance, Live Dark, Home layout, Language, Notifications, native push, biometrics, Account/sign-out | `themeStore`, `dashboardLayoutStore`, translations; Player `notification_settings`; OneSignal; biometric service; `authStore` | rebuilt + mapped; notification preferences persist to Player and OneSignal |
| Club | header, Challenge/Follow, stats, recent form, richer club tabs, loading/error/retry/refresh | `useTeam` → `loadClubProfile`; arrange-game route; Follow entity via `followTarget.js` | rebuilt + mapped; **head-to-head = gap** |

## Phase 7 · Cleanup

| Item | Status |
|---|---|
| Legacy `src/navigation/*`, `src/App.jsx`, root `index.js` | deleted — Expo Router is the entry, and those files imported missing `src/screens/**` |
| Replaced `components/common` primitives, `mockMatches`, unused `tournamentStore`, `scheduleData`, `base44Client` | deleted — nothing in `src/app` imported them |
| No-mockup features (Feed, Chat, Dressing Room, Formation, dashboard layouts, international tournaments) | kept — see inventory decision |
| Notification / deep-link targets | `resolveNotificationHref` maps `/inbox`, `/game-day?match=`, `/clubs/:id`, `/players/:id`, `/tournaments/:id`, `/schedule`, `/wallet` onto the rebuilt routes. OneSignal and the root URL listener both use it. |
| Backend gaps | unchanged, still out of mobile scope |

Match stats/scorers/MOTM · highlights list · standings home/away/form splits · Pro-Club link/unlink · gamertag availability check · Wallet monthly delta/Send STC · Store cosmetic catalogue/buy · Transfers Latest/My-offers feed · head-to-head.
