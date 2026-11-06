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
| GroupStage | Group tables + matches | groups [{name, rows:[{rank,club,played,gd,pts,qualifies}], matches:[...]}] | `GET /api/mobile/tournaments/:id/groups` — **GAP** |
| Standings | Home/Away/Form splits | standings filtered by scope | `GET /api/mobile/tournaments/:id/standings?scope=home|away|form` — **CONFIRM/GAP** (overall via `lib/standingsCore.js`) |
| Bracket | Knockout bracket | rounds [{name, matches:[{home,away,homeScore,awayScore,date,winner}]}] | `GET /api/mobile/tournaments/:id/bracket` — **GAP** (`lib/bracketRounds.js` is client-only) |

## Profile / teams

| Screen | Element | Data needed | Proposed endpoint |
|---|---|---|---|
| Profile | OVR rating badge | computed overall rating | part of `players/me/stats` or `players/:id` → `{ovr}` — **CONFIRM** |
| Profile / Gamertag | Pro Club link / unlink / import | {linked, clubName, platform}; link, unlink, import stats | `GET/POST/DELETE /api/mobile/players/me/proclub` — **GAP** |
| Gamertag | Gamertag availability check | {available:boolean} for a candidate tag | `GET /api/mobile/players/gamertag-available?tag=` — **GAP** |
| Availability | Weekly grid tri-state | {day, slot} → available|maybe|busy; timezone | confirm `GET/PUT /users/:id/availability` returns a 7×4 tri-state grid, not free-text — **CONFIRM** |
| TeamProfile | Founded date, trophies count | club {foundedYear, trophies} | extend `GET /teams/:id` — **CONFIRM** (`lib/trophyCollection.js`) |

## Apps

| Screen | Element | Data needed | Proposed endpoint |
|---|---|---|---|
| Wallet | Balance + monthly delta | `{balanceStc, monthDeltaStc}` | `GET /api/mobile/wallet` → `{balanceStc,monthDeltaStc}` — **GAP** |
| Wallet | Activity list | transactions [{id,label,context,date,amountStc,sign}] | `GET /api/mobile/wallet/activity` — **GAP** |
| Wallet | Send STC | transfer STC to a player/club | `POST /api/mobile/wallet/send` — **GAP** (financial — server-side only) |
| Store | Catalogue | items [{id,name,category,priceStc,featured,image}] | `GET /api/mobile/store/items` — **GAP** |
| Store | Buy item | purchase with STC balance | `POST /api/mobile/store/items/:id/buy` — **GAP** (top-up via `lib/stripeCheckout.js`) |
| Transfers | Transfer feed | entries [{player,pos,ovr,from,to,games,status}] filtered by Latest/MyOffers/FreeAgents | `GET /api/mobile/transfers?scope=` — **CONFIRM** (`lib/transferMarketEntries.js`) |
| Transfers | Make offer | create a transfer offer to a player | `POST /api/mobile/transfers/offers` — **CONFIRM** (`lib/wagerActions.js`?) |
| InboxMessage | Message detail + accept/decline | message {id,type,sender,body,offer{...}}; act on contract offer / match invite | `GET /api/mobile/inbox/:id`; `POST /api/mobile/inbox/:id/accept|decline` — **CONFIRM** (`lib/inboxData.js`) |
| Inbox | Mark all read | mark all inbox items read | `POST /api/mobile/inbox/read-all` — **CONFIRM** |
| Club | Head-to-head | H2H record vs the viewer's club {wins,draws,losses} | `GET /api/mobile/teams/:id/head-to-head?vs=` — **GAP** |
| Club | Challenge / Follow | create a challenge; follow a club | challenge via arrange-game flow; follow `POST /api/mobile/teams/:id/follow` — **CONFIRM** (`lib/followTarget.js`) |
| Settings | Notification preferences | persist match-reminder / contract-offer / club-mail toggles | `GET/PUT /api/mobile/settings/notifications` — **GAP** |

## Note for the server team (`Lengarose/stage`)

Highest-value gaps (block whole screens): **Wallet**, **Store**, **objectives/rewards**, **match stats + MOTM + highlights**, **group tables + bracket**, **head-to-head**. The rest degrade gracefully to empty states or hidden blocks. Each screen task that hits a **GAP** ships the empty state and leaves its row here; each **CONFIRM** row is resolved (promoted to `mapped` or demoted to `GAP`) during that screen's task.
