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
| UploadVideo | Local MP4/MOV pick + progress | multipart upload + progress events | extend `POST /matches/:id/video` for binary upload (client keeps URL sources today) — **GAP** |

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
| Platform (onboarding) | Cross-play enabled flag | player `cross_play:boolean` persisted with profile | Client stores local preference only; Stage Player schema must accept `cross_play` — **GAP** |
| ClubSetup (onboarding) | Join with invite code | redeem invite → membership | `POST /api/mobile/clubs/join` `{code}` → `{clubId}` — **GAP** (UI keeps Free agent) |
| EditProfile | Preferred foot | player `preferred_foot: left|right|both` persisted with the profile | Client sends `preferred_foot` on Player.update; Stage Player schema must accept it — **GAP** |
| Availability | “Maybe” tri-state | availability slot status `available|maybe|busy` | Client cycles and PUTs `{…, status:'maybe'}`; mobile `PUT /users/:id/availability` still only echoes slots (fixture availability is separate) — **GAP** |
| CreateTeam | Colours, direct invite list, open-to-applications | confirmed create fields + invitation action | Client sends `primary_color` + `open_to_applications`; invite remains search deep-link until invite action exists — **GAP** |

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

## Reconciled against the real backend → see `STAGE_BACKEND_ENDPOINTS.md`

Read from the Stage web repo (`/Users/creaafde/Documents/workbench stage/stage`, `server/src/server/`). Many items below are **already backed** by an existing endpoint/function and should be **wired, not requested**: tournament `GET /:id/{standings,groups,brackets}`; `playerWallet`, `getTransferMarket`/`transferPayment`, `buyLifestyleItem`, `claimObjectiveReward`, `updateMatchStats`, identity-claim functions for Pro-Club. Nuance: `/standings` and `/groups` read `competition_*` tables (official/regional competitions); **community tournaments need the client derivation** — so wire endpoint-first with the derivation as fallback. Genuinely missing: match MOTM/events + highlights, head-to-head, gamertag availability, standings home/away/form splits, wallet monthly delta, store cosmetic catalogue.

## Note for the server team (`Lengarose/stage`)

Highest-value gaps are the **cosmetic Store catalogue**, **Wallet Send STC**, **Transfers Latest/My-offers**, **match stats + MOTM + highlights**, and **head-to-head**. Wallet, Store and Transfers still have real usable surfaces; unsupported mockup-only blocks remain hidden rather than showing fake data.

## Cursor — écarts relevés pendant les tâches 7 à 19
- **Classements (tâche 10)** : `GET /rankings/summary` n'accepte pas de filtre plateforme ; région et plateforme sont filtrées côté client sur les lignes reçues (top 10 pour un compte gratuit, 100 pour STAGE Plus). Les comptes gratuits ne reçoivent ni points ni filtres (règle serveur). Si mon club est hors des lignes reçues, son rang vient de son propre enregistrement (`global_rank`), sinon aucune ligne "moi" n'est affichée.
- **Inscription de saison (tâche 9)** : la candidature renvoie `assigned_league_id` mais pas le slug de la ligue, donc pas de lien direct vers l'écran de ligue.
- **Mercato (tâche 11)** : le fil `/mercato-transfers/desk` n'a pas de nombre de matchs joués par joueur (la maquette affiche "30 games") ; la ligne montre à la place les données réelles (poste, type de deal, frais en STC si > 0). Les contrats (`player-contracts`) ne portent que des ids : le nom du club ou du joueur est lu sur sa fiche, vide si introuvable.
- **Lifestyle — "maintenance due"** : no endpoint or field says when upkeep (`weekly_maintenance_stc`) is due, so the screen shows the weekly cost as a fact line only. Needs a server field (next maintenance date / amount owed).
- **Store — STC packs** : the server only sells **credits** packs (`stripeCheckout`: 50/100/250/600 credits). No endpoint sells STC for the wallet, so the screen sells credits and shows the STC wallet as a line; the mockup's STC amounts were placeholders. Lifestyle's "Get STC" lands here, which cannot add STC. Needs a server STC pack (or STC top-up) to close the loop.
- **Store — pack list & 'popular' badge** : the pack list is mirrored on the client (`CREDIT_PACKS`); there is no endpoint that lists packs, and no field marks one as popular, so no POPULAR badge is shown.
- **Wallet — monthly total** : the mockup's "+520 STC this month" has no source (`playerWallet get_history` is paged, no monthly sum), so it is not shown.
- **Notifications — mark all read** : no `POST /notifications/read-all` route exists. "Mark all read" calls `POST /notifications/:id/read` once per unread notification (client-side) and then reloads the list; a route would be one call.
- **Apparence — thème Custom (tâche 17)** : l'app envoie les champs `custom*` via `PATCH /players/:id` (`updateMe`), comme sur le web, mais le serveur ne les renvoie pas toujours ; la copie locale (`stage-theme-custom`) reste la source sur l'appareil. À confirmer côté serveur que ces champs sont bien persistés et relus (`auth.me`).
- **Apparence — Live Dark** : le fond, les 3 images et le réglage flou/overlay sont stockés uniquement sur l'appareil (pas de champ serveur) ; ils ne suivent donc pas l'utilisateur d'un téléphone à l'autre.
- **Réglages → Notifications — sons (tâche 17)** : l'app ne joue aucun son propre (`notificationSound.js` renvoie toujours le son système). La ligne "Son de notification" ouvre donc les réglages du téléphone et l'interrupteur "Play sound in the app" de la maquette n'est pas affiché (aucune fonctionnalité derrière).
- **Réglages → Notifications — catégories (tâche 17)** : la maquette groupe 5 lignes ; le serveur gère 8 catégories (`notification_settings`). On garde les 8 lignes réelles (plus fines). "Dans l'app" écrit les canaux `web` et `mobile` ensemble.
- **Mot de passe oublié (tâche 18)** : le serveur envoie par e-mail un lien WEB `FRONTEND_URL/reset-password?token=…` (stageleagues.com). L'app a bien l'écran `/auth/resetpassword?token=` (GET puis POST `/auth/reset-password`), mais rien n'ouvre l'app depuis ce lien : il faudrait un universal link / app link (ou un lien `stage://auth/resetpassword?token=` côté serveur). Un utilisateur déjà connecté qui ouvre ce lien est renvoyé vers Home par le garde d'auth.
- **Mot de passe oublié — saisie** : le serveur accepte aussi un pseudo ou un nom de club (`identifier`), mais la maquette demande un e-mail ; l'écran n'accepte qu'une adresse e-mail valide.
- **Club public (tâche 19)** : aucun « head to head » n'existait sur l'écran Club (celui de Game Day, `GameDayInsights`, appartient aux tâches 1–6 et n'a pas été touché) ; pas d'endpoint, donc rien n'est ajouté. « Derniers résultats » et « Forme récente » viennent des matchs terminés réels du club (`loadClubProfile`, 30 domicile + 30 extérieur) ; un match sans les deux scores est ignoré. Le nom de compétition n'apparaît que si le match le porte. Non repris de la maquette : bloc Rank / Record / Squad (rang du club absent du bundle) et ligne « compétition → Standings » (pas de compétition courante dans le bundle) ; le hero riche existant est conservé.
- **News (tâche 16)** : écran `/apps/news` (World / Mercato / Beat) sur les vrais flux : `GET /news-desks/world_news`, `GET /mercato-transfers/desk`, et BEAT = fusion de `club_news`, `player_news`, `tournament`, `competitions` (4 appels, un desk en échec n'est pas bloquant). Les lignes ne sont pas cliquables : il n'y a pas d'écran de détail Stage (les anciens desks « papier journal » avec détail, filtres et atlas restent dans le code mais ne sont plus branchés). Une histoire sans photo affiche une icône ; un sujet sans titre est ignoré. L'accès se fait par la grille Apps (« News »).
