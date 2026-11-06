# Stage backend — real endpoints (use these, don't re-request)

> Source of truth read from the Stage web repo at `Lengarose/stage` (`server/src/server/`). The mobile app has two seams on the same JWT: **`/api/mobile`** (axios `api`, compat routes in `server/src/server/mobile/*Routes.js`) and **`/api/stage`** (`stageClient` — entity CRUD + `functions.invoke(name, params)`). Before marking anything a gap or requesting a new endpoint, check here.

## `/api/mobile` routes (mounted in `routes/registerMobileCompatRoutes.js`)

**Auth** (`/api/mobile/auth`, no token): `POST /register` · `POST /login` · `POST /refresh` · `POST /logout` · `GET /:provider` · `GET /me`

**Users** (`/api/mobile/users`): `GET /me` · `PUT /me` · `GET /:id` · `GET /:id/availability` · `PUT /:id/availability`

**Teams** (`/api/mobile/teams`): `GET /` · `GET /with-members` · `GET /:id` · `POST /` · `GET /:id/players` · `DELETE /:id/players/:userId` · `GET|POST /:id/formation` · `GET /:id/join-request-status` · `POST /:id/join-request` · `GET /:id/join-requests` · `POST /:id/join-requests/:requestId/accept|decline` · `POST /:id/leave` · `GET /:id/dressing-room` · `GET|POST /:id/chat` · `POST /:id/chat/read`

**Tournaments** (`/api/mobile/tournaments`): `GET /list` · `GET /` · `GET /:id` · `POST /` · `POST /:id/start` · `POST /:id/join` · `POST /:id/invite` · **`GET /:id/standings`** · **`GET /:id/groups`** · **`GET /:id/brackets`**

**Matches** (`/api/mobile/matches`): `GET /fixtures` · `GET /:id` · `POST /:id/video` · `POST /:id/chat/read` · `GET|POST /:id/chat`

**Social** (`/api/mobile/social`): `GET /feed` · `GET /reels` · `GET /posts/:id` · `GET|POST /comments` · `GET /messages` · `GET /messages/:otherUserId` · `POST /messages`

**Uploads** (`/api/mobile/uploads` and `/upload`): `POST /chat` · `POST /` · `POST /avatar`

## `/api/stage` functions (`stageClient.functions.invoke(name, params)`)

Dispatched by `functions/functionsRouter.js` → `POST /:name`; 337 handlers in `functions/legacyFunctions.js` (`HANDLERS`). Gap-relevant ones that **already exist**:

| Need | Function |
|---|---|
| Wallet balance / history / salary | `playerWallet` (`get_balance`, `get_history`, `pay_salary`) |
| Transfer market / feed | `getTransferMarket`, `transferWindowActions` |
| Transfer payment | `transferPayment` |
| STC / credits spend & move | `stcEngine`, `spendCredits`, `fixCredits`, `backfillPlayerStc` |
| Store purchase | `buyLifestyleItem` |
| Objectives claim | `claimObjectiveReward` |
| Match stats | `updateMatchStats` |
| Player value | `playerMarketValue` |
| Contracts | `contractActions`, `contractManagement`, `checkExpiredContracts` |
| Pro-Club / identity link | `submitPlayerIdentityClaim`, `listPlayerIdentityClaims`, `reviewPlayerIdentityClaim` |
| Inbox send / respond | `sendInboxMessage`, `respondInboxMessage` |
| Notifications | `sendNotification` |
| Tournament entrance / invite links | `createTournamentEntranceLink`, `getTournamentInviteLink`, `resolveTournamentEntranceToken` |
| Club availability (tournament/league) | `tournamentClubAvailability`, `regionalLeagueClubAvailability`, `officialStageClubAvailability` |

Plus entity CRUD via `stageClient.entities.<Entity>.{list,get,filter,create,update}` (e.g. `Tournament`, `Player`, `Club`, `InboxMessage`, `ObjectiveProgress`, `StoreConfig`).

## Gap reconciliation (vs `STAGE_DATA_GAPS.md`)

**Now covered by an existing endpoint/function — wire these, do not request:**
- Tournament **group tables** → `GET /tournaments/:id/groups`.
- Tournament **bracket** → `GET /tournaments/:id/brackets` (returns `[{name, matches}]`).
- Tournament **standings** → `GET /tournaments/:id/standings` (ranked rows: `team_id, rank, played, won, drawn, lost, gf, ga, pts`).
- **Wallet** balance/history/salary → `playerWallet` (Cursor already wired).
- **Transfers** market/offer → `getTransferMarket` / `transferWindowActions` / `transferPayment`.
- **Store** buy → `buyLifestyleItem`; **Send STC** → `transferPayment` / `stcEngine`.
- **Objectives** → `claimObjectiveReward` (wired).
- **Pro-Club link** → identity-claim functions.
- **Match stats** → `updateMatchStats` (and the `GET /matches/:id` payload).

**Important nuance (standings/groups/brackets):** the `/standings` and `/groups` handlers read `competition_standings` / `competition_phase_states` keyed by `legacy_source_id` — populated for **official/regional competitions**, likely empty for **community tournaments**. The client derivation in `useTournament` (from `matches` via `tournamentEngine`) covers community tournaments. **Correct wiring: use the endpoint when it returns data, fall back to the client derivation otherwise** (lossless for both tournament kinds).

**Still genuinely missing (candidates to request from the server team):**
- Match **man-of-the-match** + per-match **scorers/events** on `GET /matches/:id` (stats exist via `updateMatchStats`; confirm the detail payload exposes events + MOTM).
- **Highlights list** for a match (WatchMatch).
- **Head-to-head** record between two clubs (Club screen).
- **Gamertag availability** check (onboarding Gamertag step).
- Standings **Home/Away/Form** splits (only overall is returned).
- Wallet **monthly delta** (balance+history exist; the "+N this month" figure is derived or absent).
- Store **cosmetic catalogue listing** (buy exists via `buyLifestyleItem`; a browsable cosmetic catalogue endpoint may not).
