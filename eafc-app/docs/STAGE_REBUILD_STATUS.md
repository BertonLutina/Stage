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
| Home | greeting + gamertag, next match (teams/time/comp), club rank+div, contract games x/y + bar, recent form W/D/L, avg rating, objectives list + progress + CLAIM REWARD, unread inbox dot, Apps grid link | `authStore`/`/auth/me`; next match `api GET /matches/fixtures`; club `api /teams/:id`; **contract games x/y**, **recent form**, **avg rating**, **objectives+rewards** ; unread count via `lib/inboxData.js` / `useNotificationsSocket` | next match + club mapped; **contract games, recent form, avg rating, objectives/claim-reward = gap** |
| GameDay | Arrange Game CTA, Fixtures/Calendar/Results segmented, contract-ends-in-N-games banner, dated events (match/contract-end), invite chips | `api GET /matches/fixtures?status=…`; `lib/arrangeGame.js`, `lib/scheduleData.js`, `lib/scheduleCalendar.js`; contract reminder via `CONTEXT.md` Schedule | fixtures + schedule mapped; **contract-games-left count = gap (shared w/ Home)** |
| MatchDetail | score, scorers line, Watch/Upload CTAs, match stats (possession/shots/pass%), man of the match + rating | `api GET /matches/:id` | score/teams mapped; **match stats, scorers, MOTM = gap** |
| WatchMatch | video player, scrub markers, Highlights/Full/My-clips tabs, highlight list (goal, player, time, duration) | `api POST /matches/:id/chat/read`; video source; **highlights list** | player chrome mapped; **highlights list, scrub markers = gap** |
| UploadVideo | dropzone, upload progress, title, type chips (Full/Highlight/Clip), visibility select, publish | `api POST /matches/:id/video` (`lib/uploadProfileMedia.js`, `lib/formDataFile.js`) | mapped |
| Search | search box, Players/Clubs segmented, filter chips, result count, result rows (name, pos/platform/club, OVR) | `api GET /users/search`, `/teams/with-members` (`lib/playerDirectory.js`, `stageDirectories.js`) | mapped; **OVR rating source** confirm |

## Section 3 · Tournaments

| Screen | Elements | Source | Status |
|---|---|---|---|
| Tournaments | Open/My/Finished filter, cards (name, format, clubs, registered/open state, stage, prize, next, entry fee, slots x/y, starts) | `useTournamentsList` GET `/tournaments/list` | list mapped; **prize/entry-fee/slots fields** confirm in payload |
| TournamentDetail | header (format·state), stats (clubs/prize/final-date), rules-accepted + group chips, nav rows (group/standings/fixtures/bracket), next-match CTA, start | `tournamentStore` GET `/tournaments/:id`, start; `api/tournamentActions.js` | detail/start mapped; **prize, final date, rules-accepted** confirm |
| CreateTournament | name, format (League/Groups+KO/Knockout), clubs count, platform, start date, entry fee STC, rules, create | `tournamentStore` POST `/tournaments`; `lib/communityTournamentCreate.js`, `tournamentRuleTemplates.js` | mapped |
| GroupStage | group chips A–D, group table (#,club,P,GD,PTS, qualify marker), "top N qualify", group matches (played + upcoming) | `api GET /tournaments/:id/groups`; `lib/standingsCore.js` | **group tables endpoint** confirm → likely gap |
| Standings | Overall/Home/Away/Form tabs, league table (#,club,P,W,D,L,PTS), promotion/relegation legend | `api GET /tournaments/:id/standings`; `lib/standingsRows.js`, `standingsCore.js`, `apps/leagues/[slug]` | table mapped; **Home/Away/Form splits = gap** |
| Fixtures | prev/next round, round header + dates, grouped by day, rows (home/score-or-time/away), last round results | `api GET /tournaments/:id/…` + `/matches/fixtures`; `lib/clubFixtures.js`, `scheduleEngine.js` | mapped |
| Bracket | rounds columns (QF/SF/Final), match cells (win/lose + score), trophy, final date | `api GET /tournaments/:id/bracket`; `lib/bracketRounds.js` | **bracket endpoint** confirm → likely gap |

## Section 4 · Profile & teams

| Screen | Elements | Source | Status |
|---|---|---|---|
| Profile | avatar + OVR badge, name, pos/platform, club chip, stat grid (Games/Goals/Assists/Rating), Linked Pro Club + UNLINK, nav rows (Edit/Availability/Team/Wallet + STC) | `api GET /users/:id` / `auth/me` + players; `lib/playerCareer.js`, `clubProfileData.js`; wallet STC (gap) | profile + stats mapped; **OVR, Pro-Club link/unlink, wallet STC = gap** |
| EditProfile | avatar + change photo, display name, bio, main/alt position, platform, country, preferred foot, save | `api PUT /users/me`; `lib/uploadProfileMedia.js`, `countries.js`, `userIdentityFields.js` | mapped; **bio, preferred foot fields** confirm |
| Availability | weekly grid (7 days × 4 slots), available/maybe/busy states, timezone label, save | `api GET/PUT /users/:id/availability` | **grid format (day×slot, tri-state)** confirm vs current payload → likely gap |
| TeamProfile | crest, name, meta (platform/region/founded), stat grid (Rank/Wins/Players/Trophies), Squad/Matches/Trophies/About tabs, squad rows (pos, avatar, name, captain), Recruit CTA | `api GET /teams/:id` with-members, formation; `teamStore`; `lib/clubSquadDisplay.js`, `trophyCollection.js` | squad/stats mapped; **founded date, trophies count** confirm |
| CreateTeam | crest, team name, tag, colours, invite players (chips + add), open-to-applications toggle, create | `teamStore` POST `/teams`; invite via players search | mapped; **crest upload, invite list** confirm |

## Section 5 · Apps

| Screen | Elements | Source | Status |
|---|---|---|---|
| Apps | grouped grid (Club/Compete/Account) of app tiles → routes | `lib/miniApps.js` | mapped |
| Inbox | All/Needs-action/Unread filter, message rows (sender avatar, title, preview, time, unread dot, Needs-action tag), mark-all-read | `lib/inboxData.js`, `inboxHelpers.js`; `useNotificationsSocket`; unread count | list mapped; **mark-all-read, needs-action classification** confirm |
| InboxMessage | sender, title, body, structured offer card (club/pos/length/bonus/expires), warning banner, Decline/Accept | message detail; contract-offer accept/decline (`lib/contractOfferVisibility.js`, `contractTypes.js`) | **message detail endpoint + accept/decline actions** confirm → partial gap |
| Wallet | balance + STC, +N this month, Top-up/Send/Store quick actions, activity list (label, context, date, +/− amount) | **wallet balance + activity + top-up/send** | **gap (whole screen)** |
| Store | STC balance chip, All/Kits/Boots/Celebrations filter, featured pack, item grid (name, price STC), buy | **store catalogue + purchase**; `lib/stripeCheckout.js` for top-up | **gap (catalogue + buy)** |
| Transfers | Latest/My-offers/Free-agents segmented, transfer rows (player, pos/OVR, from→to, games, status), Make-offer | `lib/transferMarketEntries.js`, `transferCarousel.js`, `transferWindow.js`; `useTransferWindowStatus` | **transfer feed endpoint + make-offer** confirm → likely gap |
| Settings | Appearance (Live Dark toggle, Home layout, Language), Notifications toggles, Account (edit, linked accounts, sign out) | `themeStore`, `dashboardLayoutStore`, `translations/index`; notif prefs; `authStore` POST `/auth/logout` | theme/layout/language/sign-out mapped; **notification preference persistence = gap** |
| Club | header (crest/name/meta), Challenge/Follow, stats (Rank/Record/Squad), recent form, head-to-head, league link | `api GET /teams/:id`; follow via `lib/followTarget.js`; **head-to-head** | club + form mapped; **head-to-head, challenge, follow persistence = gap** |

## Gap summary (→ `STAGE_DATA_GAPS.md`)

Home objectives/rewards · contract-games-left count · avg rating · match stats/scorers/MOTM · highlights list · group tables · bracket · standings home/away/form splits · availability grid format · Pro-Club link/unlink · gamertag availability check · Wallet (balance+activity+send) · Store (catalogue+buy) · Transfers (feed+offer) · head-to-head · notification preferences · mark-all-read.
