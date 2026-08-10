# Stage API walkthrough — eafc-app screens → Stage

Primary sources: `eafc-app/src/**`, `stage/server/src/server/routes/registerMobileCompatRoutes.js`, `stage/server/src/server/mobile/*`, `stage/server/src/server/routes/registerStageRoutes.js`.

## Destination

Every screen that performs GET/POST/PUT/PATCH/DELETE talks to Stage League production — either via **`/api/stage`** (`stageClient`) or **`/api/mobile`** (legacy axios `api` → Stage-backed compat).

## Two seams (same JWT)

| Client | Env | Base | Used by |
|--------|-----|------|---------|
| `stageClient` | `EXPO_PUBLIC_STAGE_API_URL` | `/api/stage` | Auth, onboarding, identity, ranking/tournament helpers |
| `api` (axios) | `EXPO_PUBLIC_API_URL` | `/api/mobile` | Dashboard, matches, teams, tournaments, social, profile, search |

`utils/api.js` rewrites a mistaken `/api/stage` API_URL to `/api/mobile` so feature screens never hit entity routes with flat `/teams` paths.

---

## Auth

| Screen / module | Method | Path | Client | Stage backing |
|-----------------|--------|------|--------|---------------|
| `authStore` | POST | `/auth/login` | stageClient | Stage auth |
| `authStore` | POST | `/auth/register` | stageClient | Stage auth |
| `authStore` | GET | `/auth/me` | stageClient | Stage auth |
| `authStore` | POST | `/auth/logout` | stageClient | Stage auth |
| `authStore` | POST/PATCH | `/players` | stageClient | Stage players |
| `loginscreen` | GET | `/health` | fetch | Stage + origin health |
| `useSocialAuth` | GET | `/auth/{provider}?client=mobile` | WebBrowser | Stage OAuth |
| `onboarding` | PATCH | `/auth/timezone` | stageClient | Stage auth |
| `PlayerSetup` | GET/POST/PATCH | `/players` | stageClient | Stage players |
| `ClubSetup` | POST | `/clubs` + `functions/contractManagement` | stageClient | Stage clubs |
| `IdentityClaimSetup` | identityClaims | stageClient | Stage claims |
| `gamertagsetup` (legacy) | PUT | `/users/me` | api | mobile → players/auth |
| refresh interceptor | POST | `/auth/refresh` | axios → **stage** | Stage auth |

---

## Dashboard

| Screen | Method | Path | Stage backing (via /api/mobile) |
|--------|--------|------|----------------------------------|
| `playerdashboardscreen` | GET | `/matches/fixtures?status=…` | matches |
| `teamdashboardscreen` | GET | `/teams/:id` | clubs |
| `teamdashboardscreen` | GET/POST | `/teams/:id/join-request*` / leave | join-requests / clubs |

---

## Matches

| Screen | Method | Path | Stage backing |
|--------|--------|------|---------------|
| `matches/index` | GET | `/matches/fixtures` | matches |
| `matchdetailscreen` | GET | `/matches/:id` | matches |
| `watchmatchscreen` | POST | `/matches/:id/chat/read`, `/uploads/chat` | chat-reads + upload |
| `uploadvideoscreen` | POST | `/matches/:id/video` | matches |

---

## Teams / clubs

| Screen / store | Method | Path | Stage backing |
|----------------|--------|------|---------------|
| `teamStore` | GET/POST | `/teams`, `/teams/:id/formation` | clubs |
| `teamprofilescreen` | GET/POST | `/teams/:id`, formation, join-request, with-members | clubs + join-requests |
| `manageteamscreen` | GET/POST/DELETE | players, join-requests accept/decline | players + join-requests |
| `formationscreen` | GET/POST | players, formation | clubs |
| `dressingroomscreen` | GET | `/teams/:id/dressing-room` | dressing-rooms |
| `teamchatscreen` | POST | chat/read, uploads | chat-reads + upload |
| `searchclubs` | GET/POST | with-members, join-request | clubs |
| `searchplayer` | GET | `/users/search`, `/users/:id` | players |

---

## Tournaments

| Screen / store | Method | Path | Stage backing |
|----------------|--------|------|---------------|
| `useTournamentsList` | GET | `/tournaments/list` | tournaments |
| `tournamentStore` | GET/POST | `/tournaments`, start, join | tournaments |
| `createtournamentscreen` | GET/POST | teams search, create, invite | clubs + tournaments |
| `tournamentdetailscreen` | GET/POST | detail, start | tournaments |
| standings / groups / brackets / fixtures | GET | `/tournaments/:id/…`, `/matches/fixtures` | tournaments + matches |

Native Stage helpers exist but unused by screens yet: `api/tournamentActions.js`, `api/internationalTournaments.js`.

---

## Social

| Screen | Method | Path | Stage backing |
|--------|--------|------|---------------|
| `useFeed` | GET | `/social/feed` | posts |
| `reelsscreen` | GET | `/social/reels` | posts (reels) |
| `postdetailscreen` | GET/POST | posts, comments | posts + comments |
| `messagesscreen` | GET | `/social/messages` | direct-messages |
| `chatscreen` | GET/POST | messages, uploads | direct-messages + upload |

---

## Profile

| Screen | Method | Path | Stage backing |
|--------|--------|------|---------------|
| `profilescreen` | GET/PUT | `/users/:id`, `/users/me` | auth/me + players |
| `editprofilescreen` | PUT | `/users/me` | players |
| `availabilityscreen` | GET/PUT | `/users/:id/availability` | players (availability) |
| `connectiontestscreen` | GET | `/health` | mobile health |

---

## Phase 2 (native Stage — drop /api/mobile)

Migrate screens from `api` → `stageClient.entities.*` using `NATIVE_STAGE_MIGRATION` in `src/api/connectionMap.js`:

- `/teams` → `/clubs`
- `/social/feed` → `/posts`
- `/users/me` → `/auth/me` + `/players/:id`
- `/matches/fixtures` → `/matches`
- `/tournaments/list` → `/tournaments`

---

## Verification checklist

- [ ] Login (stageClient) succeeds against `/api/stage/auth/login`
- [ ] Dashboard fixtures load via `/api/mobile/matches/fixtures` (401 without token, 200 with)
- [ ] Clubs search via `/api/mobile/teams/with-members`
- [ ] Feed via `/api/mobile/social/feed`
- [ ] Onboarding still uses stageClient only
- [ ] Token refresh hits `/api/stage/auth/refresh`
