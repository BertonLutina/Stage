# Stage Rebuild — Data Gaps

> Mockup elements with **no confirmed backing endpoint**. Each row: screen · element · data needed · proposed endpoint for `Lengarose/stage` (`server/src/server/routes/…`). Until an endpoint lands, the screen renders a proper empty state or hides the block — **never fake values**. "Confirm" rows are provisional: a client helper (`src/lib/*`) exists but the live `/api/mobile` or `/api/stage` endpoint must be verified by grep/probe during the screen's task; if present, move the row to `STAGE_REBUILD_STATUS.md` as `mapped`.

Legend: **GAP** = no endpoint found · **CONFIRM** = client helper exists, endpoint unverified.

## Home / Game Day

| Screen | Element | Data needed | Proposed endpoint |
|---|---|---|---|
| Home | Objectives + CLAIM REWARD | list of objectives {id, label, progress, target, done, reward STC, claimable}; claim action | `GET /api/mobile/objectives` → `[{id,label,progress,target,done,rewardStc,claimable}]`; `POST /api/mobile/objectives/:id/claim` → `{balanceStc}` — **GAP** |
| Home / GameDay | Contract games x/y + games-left | active player contract {gamesPlayed, gamesTotal, gamesLeft, clubName} | `GET /api/mobile/players/me/contract` → `{clubId,clubName,gamesPlayed,gamesTotal,gamesLeft,endDate}` — **CONFIRM** (`lib/playerContractFields.js`) |
| Home | Recent form (last 5 W/D/L) | last N results for the user's club/player | derive from `GET /matches/fixtures?status=played&limit=5` — **CONFIRM** |
| Home / Profile | Avg rating | aggregate player rating | `GET /api/mobile/players/me/stats` → `{games,goals,assists,avgRating}` — **CONFIRM** (`lib/clubPlayerStats.js`) |
| MatchDetail | Match stats | {possession, shots, passAccuracy} per side | `GET /api/mobile/matches/:id/stats` → `{home:{...},away:{...}}` — **GAP** |
| MatchDetail | Scorers line + MOTM | goal events + man-of-the-match {player, rating, goals, assists} | include in `GET /matches/:id` → `{events:[...], motm:{...}}` — **GAP** |
| WatchMatch | Highlights list | clips {id, label, player, minute, duration, url} | `GET /api/mobile/matches/:id/highlights` → `[{id,label,player,minute,duration,url}]` — **GAP** |

## Tournaments

| Screen | Element | Data needed | Proposed endpoint |
|---|---|---|---|
| Tournaments | prize / entry fee / slots | per-tournament {prizeStc, entryFeeStc, slotsFilled, slotsTotal} | extend `GET /tournaments/list` items — **CONFIRM** |
| Standings | Home/Away/Form splits | standings filtered by scope | `GET /api/mobile/tournaments/:id/standings?scope=home|away|form` — **CONFIRM/GAP** (overall via `lib/standingsCore.js`) |

## Profile / teams

| Screen | Element | Data needed | Proposed endpoint |
|---|---|---|---|
| Profile / Gamertag | Pro Club link / unlink / import | {linked, clubName, platform}; link, unlink, import stats | `GET/POST/DELETE /api/mobile/players/me/proclub` — **GAP** |
| Gamertag | Gamertag availability check | {available:boolean} for a candidate tag | `GET /api/mobile/players/gamertag-available?tag=` — **GAP** |
| EditProfile | Preferred foot | player `preferred_foot: left|right|both` persisted with the profile | extend the Player schema / `PUT /users/me` — **GAP** |
| Availability | “Maybe” tri-state | availability slot status `available|maybe|busy` | extend `GET/PUT /users/:id/availability`; current endpoint persists only `{day_of_week,start_time,end_time}` available ranges — **GAP** |
| CreateTeam | Colours, direct invite list, open-to-applications | confirmed create fields + invitation action | extend `POST /api/mobile/teams` and add invite action — **GAP** |

## Apps

| Screen | Element | Data needed | Proposed endpoint |
|---|---|---|---|
| Wallet | Monthly delta | `{monthDeltaStc}` | extend `playerWallet {action:'get_balance'}` with a confirmed month delta — **GAP** |
| Wallet | Send STC | transfer STC to a player/club | `POST /api/mobile/wallet/send` — **GAP** (financial — server-side only) |
| Store | Catalogue | items [{id,name,category,priceStc,featured,image}] | `GET /api/mobile/store/items` — **GAP** |
| Store | Buy item | purchase with STC balance | `POST /api/mobile/store/items/:id/buy` — **GAP** (top-up via `lib/stripeCheckout.js`) |
| Transfers | Latest / My offers feed | entries [{player,pos,ovr,from,to,games,status}] scoped to latest activity or the viewer's offers | extend `getTransferMarket` with `latest` and `my_offers` collections — **GAP** |
| Club | Head-to-head | H2H record vs the viewer's club {wins,draws,losses} | `GET /api/mobile/teams/:id/head-to-head?vs=` — **GAP** |

## Resolved during build (were listed as gaps, found fully backed)

- **Home — Objectives + CLAIM REWARD**: real (`ObjectivesWidget` → `claimObjectiveReward` function).
- **Home — contract games x/y**: real (`vm.tenure.contractProgress` — gamesPlayed / maxGames / gamesLeft).
- **Home — avg rating**: real (`vm.avgRating`).
- **GroupStage — group tables + matches**: derived from real `fetchTournamentMatches` records with `calculateGroupStandings`; a dedicated `/groups` endpoint is not required.
- **Bracket — knockout rounds**: derived from real `fetchTournamentMatches` records with `normalizeBracketRounds`; a dedicated `/bracket` endpoint is not required.
- **Profile — OVR and career stats**: real Player `overall_rating` plus `GET /player-careers/:id`.
- **Availability — 7×4 binary grid**: derived losslessly from the real day/start/end availability ranges and saved back through the existing endpoint.
- **TeamProfile — founded year and trophies**: founded year derives from the real club creation date; trophy count comes from `loadClubProfile` achievements/placements.
- **Wallet — balance + activity + salary**: real `playerWallet` function actions (`get_balance`, `get_history`, `pay_salary`).
- **Transfers — free agents + expiring contracts**: real `getTransferMarket` function normalized by `transferMarketEntries.js`; contract and loan offers continue through the player-profile services.
- **Inbox / InboxMessage**: real InboxMessage entities, persistent mark-all-read, contract/match/loan response actions, and realtime subscriptions.
- **Club — Challenge + Follow**: Challenge opens the real arrange-game flow; Follow persists through the Follow entity.
- **Settings — notification preferences**: persisted on Player `notification_settings`, synchronized to OneSignal tags and native push state.

Still open (highest-value first): Store cosmetic catalogue/buy, Wallet Send STC + monthly delta, Transfers Latest/My-offers feed, match stats + MOTM + scorers, highlights list, standings Home/Away/Form splits, head-to-head, UploadVideo file-upload, GameDay contract-ends banner.

## Note for the server team (`Lengarose/stage`)

Highest-value gaps are the **cosmetic Store catalogue**, **Wallet Send STC**, **Transfers Latest/My-offers**, **match stats + MOTM + highlights**, and **head-to-head**. Wallet, Store and Transfers still have real usable surfaces; unsupported mockup-only blocks remain hidden rather than showing fake data.
