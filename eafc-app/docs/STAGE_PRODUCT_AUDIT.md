# Audit produit Stage — backend → web → app EA FC

> 11 nov 2026 · Lecture seule, aucun code modifié.
> Sources lues : `stage/server/src/server/routes/registerStageRoutes.js` (+ `controllers/*`, `functions/legacyFunctions.js` : 106 fonctions métier), `stage/server/src/server/mobile/*`, `stage/src/App.jsx` + `src/pages/*`, `eafc-app/src/app/*`.
> Méthode : pour chaque route ou fonction, recherche des appels (`entities.X`, `functions.invoke('x')`, `http.get('/x')`, `api.get('/x')`) dans le web et dans l'app, puis remontée du graphe d'imports jusqu'à la page web ou à l'écran Expo. L'admin web (`/admin/*`) est exclu : il reste sur le web.

**Qui peut appeler :** toutes les routes `/api/stage/*` exigent un jeton, sauf `auth` et `public`. « staff » = membre du club avec la permission demandée (`requireClubPermission`). « admin » = admin STAGE.

**Légende des trous :** 🔴 bloquant pour jouer · 🟠 important · ⚪ plus tard · ✅ couvert · 🎨 la fonction existe dans l'app mais la maquette ne la montre pas (risque de la perdre au rebuild).

---

## 1. Tableau d'audit par domaine

### 1.1 Auth et onboarding

| Capacité (verbe + chemin · qui) | Web | App EA FC | Trou |
|---|---|---|---|
| `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` · public / connecté | Login, Onboarding | `auth/loginscreen`, `signupscreen`, `authStore` | ✅ |
| `GET /auth/{google,microsoft,twitch,kick}` + callbacks, `GET /auth/mobile-handoff` · public | Login | `useSocialAuth` | ✅ |
| `POST /auth/forgot-password`, `GET/POST /auth/reset-password` · public | Login → ResetPassword | absent du mobile | 🟠 |
| `PATCH /auth/timezone` · connecté | Onboarding, Settings | `auth/onboarding`, `apps/settings` | ✅ |
| `POST/PATCH /players` (plateforme, poste, gamertag, pays) · connecté | Onboarding | `auth/onboarding` (étapes 1-4) | ✅ |
| `player-identity-claims` + `submitPlayerIdentityClaim` (lier son compte EA, preuve) · connecté | Onboarding, Profile | `IdentityClaimSetup` (onboarding) | ✅ |
| `POST /clubs/founder`, `POST /clubs` + `contractManagement` (créer son club) · connecté | Onboarding | `auth/onboarding` (branche président), `teams/createteamscreen` | ✅ |
| `presidents` : `GET /`, `GET /:id`, `GET /:id/history` · connecté ; `POST /:id/transfer` (céder la présidence) · président | Presidents, ClubDetail | lecture via `presidentDirectory` ; cession absente | ⚪ |

### 1.2 Profil joueur et club

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `GET/PATCH /players/:id` (photo, bio, postes) · propriétaire | Profile, PlayerProfile | `profile/editprofilescreen` | ✅ |
| `PATCH /players/:id/card-background`, `/career-tile-background`, `/game-day-tile-background` · propriétaire | Profile, GameDay | Game Day seulement (`GameDayTileBackgroundDialog`) | ⚪ |
| `GET /player-careers/:playerId` (carrière) · connecté | Profile, PlayerProfile | `profilescreen` | ✅ |
| `player-contracts` : `GET`, `POST` (offre), `POST /:id/cancel` + `contractActions` (accept, reject, counter, renewal_offer) · joueur / staff | Inbox, CreateContract, TransferMarket, Profile | Inbox (cartes contrat), profil club | ✅ |
| `player-loans` · **route supprimée (410 `LOANS_REMOVED`)** | — | **encore affiché** : `InboxLoanCard`, `RequestLoanDialog`, profils | 🔴 bug : retirer l'UI prêt |
| `clubs` : `GET /:id`, `PATCH /:id` (logo, couleurs), `POST /:id/leave` · membre / staff | ClubDetail | `apps/club/[id]`, `teams/teamprofilescreen` | ✅ |
| `clubs/:id/staff` + `club-staff-roles` (rôles, permissions) · président | ClubDetail | lecture seule | ⚪ |
| `club-applicants` (candidatures : review, decline, offer-trial, offer-contract, withdraw) · staff / candidat | ClubDetail (`ClubOperations`) | absent du mobile | ⚪ |
| `join-requests` + mobile `POST /teams/:id/join-request` · joueur | ClubDetail, Profile | `apps/club/[id]`, recherche | ✅ |
| `club-memberships` · connecté | Profile | absent | ⚪ |
| `player-showcase-videos` (clips du joueur, likes, commentaires) · propriétaire | Profile, PlayerProfile | `PlayerShowcase` (profil) | ✅ |
| `club-achievements`, `player-achievements`, `reward-configs` (lecture) | ClubDetail, PlayerProfile | absent | ⚪ |
| `clubFinance`, `stadiumManagement`, `shirtSales` (finances, stade, ventes de maillots) · staff | ClubDetail | lecture partielle (`clubProfileData`) | ⚪ |
| `follows` · connecté | — | profils, recherche | ✅ (mobile seul) |

### 1.3 Game Day

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `GET /game-day/matches` (mes matchs, toutes compétitions) · connecté | GameDay, Dashboard | `matches/index` (`useMatchesHub`) | ✅ |
| `GET /schedule/calendar` (calendrier perso) · connecté | Schedule | `ScheduleCalendar` | ✅ |
| `matches` `PATCH /:id` : `submit_result`, `confirm_result`, `dispute_result`, `amend_result`, `propose_correction`, preuve `proof_url` · participant | GameDay (`GameDayMatchResult`) | `GameDayScoreReport`, `GameDayResultSheet` | 🎨 aucune maquette |
| `GET /game-day/:id/penalties` (tirs au but autorisés ?) · participant | GameDay | `GameDayScoreReport` | 🎨 |
| `GET/POST /game-day/:id/reschedule` (report d'un match officiel) · staff | GameDay (`OfficialReschedulePanel`) | absent du mobile | 🟠 |
| `matchFixtureActions` : `request_reschedule`, `request_cancel`, `confirm_cancel`, `decline_cancel` (matchs amicaux) · participant | GameDay | `matchdetailscreen` | ✅ |
| `GET /game-day/:id/history` (historique du match) · participant | GameDay | `GameDayInsights` | ✅ |
| `match-highlights` : `GET /`, `POST /publish/:matchId` · participant | GameDay | `GameDayInsights` (liste + publier) | ✅ (la maquette WatchMatch doit lire cette source) |
| `match-player-stats` (stats et note par joueur) · connecté | GameDay, PlayerStats | matchs, profil | ✅ (permet buteurs et homme du match) |
| `club-fixture-availabilities` (dispo des joueurs pour un match) · membre | GameDay, ClubDetail | `GameDayDressingRoom` (partiel) | 🔴 pour les matchs officiels |
| `GET/POST /club-fixture-lineups/preparation/:clubId/:fixtureId`, `POST /clubs/:id/lineups/:fixtureId/publish` (composition + éligibilité) · staff | ClubDetail (`OfficialMatchPreparation`) | absent du mobile | 🔴 pour les matchs officiels |
| `matchKickoff`, `wagerMatchActions` / `accept_wager` / `decline_wager` / `processSoloWager` (paris de match) · participant | GameDay | `matches/index`, `ArrangeGameModal` (création) ; réponse au pari absente | ⚪ |
| Forfait : statut `forfeit` sur le match, revues `GET /matches/forfeit-reviews` · admin | GameDay (affichage) | affichage dans tournois / fixtures | ✅ (revue = admin web) |
| `club-fixture-availability`, `fixture-admin-actions` · admin | admin | — | admin web |

### 1.4 Compétitions (GOST, coupes et ligues régionales, saisons, classements, prix)

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `GET /gost/overview`, `GET /gost/:id/editions/:seasonId/clubs`, `GET /gost/:id/trophy` · connecté | Competitions, CompetitionDetail | `apps/competitions` (sans maquette) | 🟠 maquette |
| `GET /regional-public/overview`, `/:id/clubs`, `/:id/trophy` · connecté | RegionalLeagues, LeagueDetail | absent du mobile | 🟠 |
| `GET /regional-leagues/cups/public` (coupes régionales) · connecté | RegionalCups | absent du mobile | 🟠 |
| `competitions`, `competition-seasons`, `competition-fixtures`, `competition-standings` · connecté | CompetitionDetail, LeagueDetail, Schedule | `apps/competitions/[slug]`, `apps/leagues/[slug]` | ✅ |
| `GET /competition-views/:kind/:id`, `/:kind/:id/statistics` · connecté | CompetitionDetail, LeagueDetail | `competitions/[slug]`, `leagues/[slug]` | ✅ |
| `season-registrations` (inscrire le club à une saison : division, joueurs confirmés, règles acceptées) · président | admin + Competitions | `apps/register` (sans maquette) | 🟠 maquette |
| `qualification-entries` · connecté | Competitions | `apps/competitions` | ✅ |
| `GET /rankings/summary`, `/rankings/clubs`, `/rankings/players` · connecté | Rankings, Home | rang du club sur Home seulement | 🟠 écran Classements |
| `competition-payouts`, `awardClubSeasonPrize`, `distributeTournamentPrizes` (prix en STC) · admin (lecture connecté) | admin | prix affichés sur le détail tournoi | ⚪ |
| `competition-instances`, `-participants`, `-schedule-proposals`, `-result-submissions`, `-phase-states` (moteur unifié) | non utilisé directement | non utilisé directement | — (moteur interne) |

### 1.5 Tournois

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `tournaments` CRUD + `GET /tournaments/:id/presentation` · connecté | Tournaments, TournamentDetail | onglet Tournaments | ✅ |
| mobile `GET /tournaments/:id/standings`, `/groups`, `/brackets` · connecté | TournamentDetail | groupstage, standings, bracket | ✅ |
| `tournamentRegistration`, `tournamentRulesAccept`, `tournamentWithdrawal`, `tournamentClubAvailability` · président / staff | TournamentDetail | `tournamentdetailscreen` | 🎨 maquette Inscription absente |
| `startTournament`, `generateTournamentDraw`, `advanceRound`, `officializeTournament`, `tournamentCancellation` · organisateur | TournamentDetail | écrans tournoi | ✅ |
| Liens d'entrée (`createTournamentEntranceLink`, `resolveTournamentEntranceToken`) · organisateur | TournamentDetail, `/tournaments/entrance/*` | absent | ⚪ (web) |
| `international-tournaments` · connecté | InternationalTournaments | client présent, pas d'écran | ⚪ |

### 1.6 Transferts, mercato, fenêtres, scouting

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `getTransferMarket` (agents libres, fins de contrat) · connecté | TransferMarket | `apps/transfers` | ✅ |
| `mercato-transfers` : `GET /desk` (fil du mercato), `/clubs/:clubId`, `/players/:playerId` · connecté | Profile, PlayerProfile | historique joueur ; `MercatoDesk` existe mais n'est importé par aucun écran | 🟠 |
| `transferWindowActions get_current` / `transfer-windows` (fenêtre ouverte ou fermée) · connecté | TransferMarket, Inbox | `useTransferWindowStatus` (dashboard, transfers) | ✅ |
| `transferPayment` (payer une indemnité de transfert) · staff | PlayerProfile | absent | ⚪ |
| `GET /player-showcase-videos/scouting` (flux de clips pour recruter) · connecté | Scouting | absent | ⚪ |
| `scouting-reports` (rapports privés du club, votes) | absent du web | absent du mobile | backend seul |
| `transfer-room-configs` (présentation) · lecture | TransferMarket | absent | — |

### 1.7 Inbox, messages, notifications, sons

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `inbox-messages` + `sendInboxMessage`, `respondInboxMessage` · destinataire | Inbox | `apps/inbox`, `apps/inbox/[id]` | ✅ |
| `notifications` : `GET /`, `POST /:id/read` · destinataire | Notifications, Layout (cloche) | badge et push seulement, aucune liste | 🟠 |
| Préférences de canal (`notification_settings` sur Player : email / in-app / push) | Settings | `apps/settings` (`NotificationChannelSwitches`) | ✅ |
| Sons de notification | Settings | `notificationSound`, `NotificationPushSection` | ✅ |
| `chat-messages`, `chat-reads` (chat de match, vestiaire) · participant | GameDay, ClubDetail | `watchmatchscreen`, club | ✅ |
| `direct-messages`, mobile `GET/POST /social/messages` | absent du web | client présent, pas d'écran | backend seul |

### 1.8 STC, wallet, store, maillots, lifestyle

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `playerWallet` : `get_balance`, `get_history`, `pay_salary` · joueur | Wallet, Lifestyle | `apps/wallet` | ✅ |
| `stripeCheckout`, `stripeSubscription`, `cancelStagePlus`, `store-configs` (packs de crédits STC + STAGE Plus) · connecté | Store | `apps/store` | ✅ (la maquette Store montre des maillots et des chaussures qui n'existent pas) |
| `lifestyle-items`, `lifestyle-purchases` + `buyLifestyleItem`, `rentLifestyleItem`, `investInLifestyleItem`, `sellLifestyleAsset`, `collectPassiveIncome`, `collectInvestmentReturn` · joueur | Lifestyle, Wallet | affichage sur le profil seulement | 🟠 |
| `shirt-sales` / `shirtSales` (revenus maillots du club) · staff | ClubDetail, GameDay | partiel | ⚪ |
| `stc-transactions` (grand livre du club) · staff | — | — | backend seul |
| Envoi de STC à un autre joueur | — | — | **n'existe pas** (bouton Send inventé dans la maquette Wallet) |

### 1.9 Trophées, objectifs, news

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `trophy-items`, `trophy-placements` (`GET /entitlements`, `POST /review`, `/confirm`, `/correct`) — vitrine de trophées · propriétaire | Profile, ClubDetail, TrophyPage | `TrophyCabinetPanel` | ✅ |
| `objective-progresses` + `claimObjectiveReward` · joueur | Dashboard | Home | ✅ |
| `news-items`, `GET /news-desks/:section` (Stage Times : monde, mercato, rubriques) · connecté | News, Home | `WorldNewsDesk`, `MercatoDesk`, `NewsBeatDesk` existent, **aucun écran ne les importe** | 🟠 |
| `predictions` (pronostics + classement) · connecté | PredictionLeaderboard | absent | ⚪ |

### 1.10 Recherche, réglages

| Capacité | Web | App EA FC | Trou |
|---|---|---|---|
| `players`, `clubs` (recherche, filtres) · connecté | Search, Players, Clubs, FreeAgents | onglet Search | ✅ |
| `live-matches` · connecté | Search | absent | ⚪ |
| Langue (`language` sur l'utilisateur), fuseau (`PATCH /auth/timezone`) | Settings | `apps/settings` | ✅ |
| Thèmes Dark, Live Dark (fond : rotation quotidienne, Trophies, WIS, Stadium, 3 images perso, flou, overlay), **Custom** (couleurs primaire, dégradé, fond, opacité, textes enregistrées sur l'utilisateur) | Settings, Layout | Dark et Live Dark ; **Custom est un alias de Dark** (`stageTheme.js`) | 🟠 |
| `changePassword`, `deleteAccount` · connecté | Settings | `apps/settings` | ✅ |

---

## 2. Trous classés

### 🔴 Bloquant pour jouer
1. **Préparation du match officiel** : disponibilités, composition et éligibilité, publication par le staff (`club-fixture-availabilities`, `club-fixture-lineups/preparation`, `clubs/:id/lineups/:fixtureId/publish`). Sans compo publiée, la déclaration du score ne peut pas sélectionner les joueurs (`noPlayersSelected` côté web).
2. **Déclarer et confirmer le score** (`submit_result`, preuve, tirs au but, `confirm_result` / `dispute_result`). L'app le fait déjà, mais aucune maquette ne le montre : le rebuild doit le garder. Maquettes ajoutées.
3. **Inscription à un tournoi** : règles, club, disponibilités, statut, retrait. Même situation : la fonction existe, la maquette manque.
4. **Prêts supprimés côté serveur (410) mais encore affichés dans l'app** : actions cassées pour le joueur.

### 🟠 Important
5. Report officiel d'un match (`/game-day/:id/reschedule`).
6. Hub Compétitions : GOST, coupes régionales, ligues régionales, mes inscriptions. Plus l'inscription de saison (écrans présents sans maquette ; coupes et ligues régionales publiques absentes).
7. Classements clubs et joueurs (`/rankings/*`).
8. Mercato : fil du mercato (`/mercato-transfers/desk`) dans Transfers.
9. Lifestyle : acheter, louer, investir, vendre, encaisser les revenus passifs.
10. Liste des notifications (le web a une page, l'app seulement un badge).
11. News, Stage Times (composants mobiles déjà écrits mais branchés nulle part).
12. Thème Custom réel, plus le réglage complet du fond Live Dark.
13. Mot de passe oublié et réinitialisation.

### ⚪ Plus tard
Cession de présidence · gestion staff, permissions et candidatures du club · finances, stade et maillots du club · fonds de carte et de tuiles carrière · réponse aux paris de match · flux scouting · indemnité de transfert · tournois internationaux · pronostics · matchs en direct · achievements et récompenses · liens d'entrée de tournoi.

---

## 3. Dans le backend mais affiché par personne (hors maquette)

`scouting-reports` (rapports privés + votes) · `direct-messages` / `social/messages` · `objective-definitions` (catalogue) · `archetypes`, `chemistry-links`, `sbcs`, `sbc-submissions`, `fut-matches` (modules inspirés EA FC) · `challenges`, `live-match-events` · `stc-transactions` (grand livre club) · `user-purchases` · `trophy-awards` · moteur `competition-*` (participants, propositions, soumissions, phases, payouts) · `setPlayerResidence`, `spendCredits`, `upgradeLifestyleAsset`, `playerMarketValue`.
Aucun n'est un besoin quotidien du joueur aujourd'hui. Les messages privés seraient le premier candidat, mais le web ne les a pas : à décider avant de maquetter.

---

## 4. Corrections des maquettes existantes (contenu sans backend)

| Maquette | Problème | Correction |
|---|---|---|
| Store | Maillots, chaussures et célébrations inventés | Remplacée par **Store crédits** : packs STC + STAGE Plus (Stripe). Les objets à acheter sont dans **Lifestyle**. |
| Wallet | Bouton « Send » (pas d'envoi de STC entre joueurs) | Retiré. Remplacé par « Encaisser » (revenus passifs Lifestyle) et « Recharger » (Store). |
| Club | Bloc « Head to head » (pas d'endpoint) | Retiré. Remplacé par les derniers résultats réels. |
| Transfers | Fil « Latest » sans source | Branché sur `/mercato-transfers/desk` (voir la maquette **Mercato**). |
| Boutons pleins | Coins arrondis | Format sportif du web : coins coupés en haut à gauche et en bas à droite, capitales, gras. Appliqué à toutes les maquettes. |

---

## 5. Navigation (inchangée)

5 onglets : Home · Game Day · Tournaments · Profile · Search. Tout le reste est en écran poussé :

- **Game Day** → Match → *Préparer le match* (staff) · *Déclarer le score* · *Confirmer le score* · *Reporter le match*
- **Tournaments** → onglets d'écran droits **Tournois | Compétitions | Classements** → *Compétitions* (GOST, coupes, ligues, mes inscriptions) → *Inscription saison* ; Tournoi → *Inscription*
- **Home** → grille Apps → Mercato · Wallet · Store crédits · Lifestyle · News · Notifications · Inbox · Réglages
- **Réglages** → *Notifications* (canaux + sons) · *Apparence* (Dark / Live Dark / Custom)
- **Login** → *Mot de passe oublié*

Aucun flux joueur n'impose un nouvel onglet.

---

## 6. Fiches des écrans maquettés (canvas, section 6, dans l'ordre du parcours)

Chaque écran gère quatre états. **Chargement** : squelettes à la forme des cartes. **Vide** : message + action. **Erreur** : message + « Réessayer ». **Hors ligne** : bandeau.

### 6.1 Mot de passe oublié (`ForgotPassword`)
- **Le joueur** saisit son email, reçoit un lien, puis choisit un nouveau mot de passe (le lien `stageleagues.com/reset-password?token=` ouvre l'app ou le web).
- **Données** : `POST /auth/forgot-password {email}` ; `GET /auth/reset-password?token=` (validité) ; `POST /auth/reset-password {token, password}`.
- **Boutons** : ENVOYER LE LIEN · Renvoyer (après 60 s) · Retour à la connexion.
- **États** : envoyé (même message que le compte existe ou non) · lien expiré · mot de passe trop court.

### 6.2 Inscription à un tournoi (`TournamentRegister`)
- **Le président ou staff** choisit son club, coche les règles (révision affichée), indique ses créneaux, envoie l'inscription, et peut se retirer.
- **Données** : tournoi (`GET /tournaments/:id`, `/presentation`), règles et révision, `tournamentClubAvailability`, `tournamentRegistration`, `tournamentRulesAccept`, `tournamentWithdrawal`, statut (pending / approved / rejected), places (inscrits / max).
- **Boutons** : S'INSCRIRE · Se retirer (bordure) · Voir le règlement.
- **États** : complet · inscriptions fermées · en attente de validation · refusé (motif) · non président (lecture seule + « Demander à ton président »).

### 6.3 Préparer le match officiel (`MatchPrep`, staff)
- **Le staff** voit qui est dispo, compose l'équipe (titulaires et remplaçants), lit l'éligibilité de chaque joueur (contrat actif, inscrit à la saison), puis publie la compo.
- **Données** : `club-fixture-availabilities?fixture_id=`, `GET /club-fixture-lineups/preparation/:clubId/:fixtureId` (joueurs, `eligibility_message`), `POST …/preparation` (brouillon), `POST /clubs/:id/lineups/:fixtureId/publish`.
- **Boutons** : PUBLIER LA COMPO · Enregistrer le brouillon (bordure) · Relancer les absents (message inbox).
- **États** : compo publiée (verrouillée, heure) · joueurs inéligibles en rouge avec la raison · pas assez de joueurs · pas staff (vue lecture + ma dispo).

### 6.4 Déclarer le score (`ReportResult`)
- **Le joueur ou staff** saisit le score, choisit les buteurs dans la compo, ajoute la preuve (capture), indique les tirs au but si autorisés, puis envoie.
- **Données** : match (`GET /game-day/matches`), compo publiée, `GET /game-day/:id/penalties` (applicable ?), upload `POST /upload`, `PATCH /matches/:id {action:'submit_result', home_score, away_score, proof_url, goals, penalty_winner_side}`.
- **Boutons** : ENVOYER LE SCORE · Ajouter une preuve (bordure) · Annuler.
- **États** : preuve obligatoire manquante · buteurs incomplets · conflit (« l'adversaire a déjà déclaré ») → bascule vers Confirmer · backend pas à jour.

### 6.5 Confirmer ou contester (`ConfirmResult`)
- **L'adversaire** voit le score déclaré et la preuve, puis confirme, ou conteste avec sa propre preuve.
- **Données** : déclaration (`result_state`, score, preuve, auteur, délai de confirmation automatique), `PATCH /matches/:id {action:'confirm_result' | 'dispute_result', proof_url}`.
- **Boutons** : CONFIRMER LE SCORE (vert) · Contester (bordure rouge, preuve requise).
- **États** : confirmé · auto-confirmé à l'échéance · en litige (en attente de l'admin) · déjà traité.

### 6.6 Reporter un match officiel (`Reschedule`)
- **Le staff** propose un nouveau créneau dans la fenêtre autorisée, voit l'historique des propositions, accepte ou refuse celle de l'adversaire.
- **Données** : `GET /game-day/:id/reschedule` (fenêtre, créneaux, `meetings`), `POST /game-day/:id/reschedule {action, club_id, engine_fixture_id, …}`.
- **Boutons** : PROPOSER CE CRÉNEAU · Accepter (vert) · Refuser (bordure).
- **États** : hors fenêtre (date limite, risque de forfait) · proposition en attente · limite de reports atteinte.

### 6.7 Compétitions (`Competitions`)
- **Le joueur** voit les compétitions officielles : GOST (édition en cours, clubs), coupes régionales, ligues régionales de sa région, et ses inscriptions.
- **Données** : `GET /gost/overview`, `GET /regional-leagues/cups/public`, `GET /regional-public/overview`, `season-registrations?club_id=`, `qualification-entries`.
- **Boutons** : Voir (vers le détail `competitions/[slug]` ou `leagues/[slug]`) · INSCRIRE MON CLUB (si fenêtre ouverte).
- **États** : aucune compétition dans ma région · fenêtre fermée (date d'ouverture) · club non inscrit.

### 6.8 Inscription de saison (`SeasonRegistration`)
- **Le président** choisit la ligue et la division, coche les joueurs confirmés, accepte les règles, puis envoie.
- **Données** : `regional-leagues` (région, plateforme, tier), `competition-seasons` (saison ouverte, fenêtre), `POST /season-registrations {season_id, league_id, club_id, division, confirmed_player_ids, accepted_rules_revision}`, statut (pending / confirmed / reserve_invitation).
- **Boutons** : ENVOYER L'INSCRIPTION · Accepter la place de réserve (si invitation).
- **États** : effectif insuffisant · déjà inscrit · liste d'attente / réserve · refusé.

### 6.9 Classements (`Rankings`)
- **Le joueur** compare les clubs et les joueurs (points, V/N/D, note moyenne), filtre par région et plateforme, et retrouve sa ligne.
- **Données** : `GET /rankings/summary`, `/rankings/clubs`, `/rankings/players` (`ranking_points`, `wins`, `draws`, `losses`, `ranking_avg_rating`, `country_code`, `region`, `is_verified`).
- **Boutons** : onglets droits Clubs / Joueurs · filtres (puces) · ligne → profil.
- **États** : pas encore classé (« X matchs classés requis ») · aucun résultat pour ce filtre.

### 6.10 Mercato (`Mercato`, remplace la maquette Transfers)
- **Le joueur** voit si la fenêtre est ouverte, le fil des transferts, les agents libres et ses offres en cours.
- **Données** : `transferWindowActions {action:'get_current'}`, `GET /mercato-transfers/desk`, `getTransferMarket`, `player-contracts?player_id=` (offres reçues et envoyées), `contractActions`.
- **Boutons** : onglets droits Fil / Agents libres / Mes offres · Voir l'offre → Inbox.
- **États** : fenêtre fermée (prochaine ouverture) · aucune offre · aucun agent libre.

### 6.11 Lifestyle (`Lifestyle`)
- **Le joueur** parcourt les biens (catégorie, palier), achète, loue ou investit en STC, voit ses biens, encaisse ses revenus passifs, vend.
- **Données** : `lifestyle-items` (`name`, `category`, `tier`, `price_stc`, `purchase_type`, `weekly_maintenance_stc`, `passive_income_stc`, `passive_income_interval_days`, `can_sell`, `sell_value_percent`), `lifestyle-purchases`, `playerWallet get_balance`, fonctions `buyLifestyleItem`, `rentLifestyleItem`, `investInLifestyleItem`, `collectPassiveIncome`, `sellLifestyleAsset`.
- **Boutons** : ACHETER · LOUER · ENCAISSER · Vendre (bordure).
- **États** : solde insuffisant (→ Store crédits) · revenu pas encore disponible (compte à rebours) · maintenance due.

### 6.12 Store crédits (`StoreCredits`, remplace la maquette Store)
- **Le joueur** achète un pack de STC ou s'abonne à STAGE Plus, et gère son abonnement.
- **Données** : `store-configs` (packs, prix, mise en avant), `stripeCheckout`, `stripeSubscription`, `cancelStagePlus`, retour `/store/mobile-return`, solde.
- **Boutons** : ACHETER · S'ABONNER · Gérer / résilier (bordure).
- **États** : paiement annulé · paiement en attente · abonné (date de renouvellement).

### 6.13 Notifications (`Notifications`)
- **Le joueur** lit ses notifications (match, contrat, tournoi), les ouvre (lien vers l'écran concerné), et marque tout comme lu.
- **Données** : `GET /notifications` (`title`, `body`, `type`, `link`, `read`, `created_date`), `POST /notifications/:id/read`.
- **Boutons** : Tout marquer lu · ligne → `link`.
- **États** : vide · erreur.
- Les canaux (email, in-app, push) et les sons restent dans *Réglages → Notifications* (écran existant, maquette ajoutée).

### 6.14 News (`News`)
- **Le joueur** lit Stage Times : à la une, mercato, rubriques.
- **Données** : `GET /news-desks/:section`, `news-items`.
- **Boutons** : onglets droits Monde / Mercato / Rubriques · article.
- **États** : vide · erreur.

### 6.15 Apparence (`Appearance`)
- **Le joueur** choisit Dark, Live Dark ou Custom. Live Dark : fond (rotation quotidienne, Trophies, WIS, Stadium, jusqu'à 3 images perso), flou, overlay bleu. Custom : couleur primaire, dégradé, fond et opacité, couleurs de texte.
- **Données** : préférences locales (`stage-live-dark-bg`, `-uploads`, `-fx`) ; couleurs Custom enregistrées sur l'utilisateur (`customPrimaryColor`, `customGradientColor`, `customBackgroundColor`, `customBackgroundOpacity`, `customTextColor`, …) comme sur le web.
- **Boutons** : cartes de thème · ENREGISTRER · Réinitialiser (bordure).
- **États** : image trop lourde · 3 images max.
- Pas de Day ni de Live White.

### 6.16 Réglages → Notifications (`NotificationSettings`)
- **Le joueur** active ou coupe chaque type par canal (email / in-app / push) et choisit le son.
- **Données** : `notification_settings` sur Player, tags OneSignal, `notificationSound`.
- **Boutons** : interrupteurs · ENREGISTRER.
- **États** : push refusé par le téléphone (→ ouvrir les réglages iOS / Android).
