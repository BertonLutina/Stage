# Cursor — rapport d'avancement (audit produit, tâches 7 à 19)

Un court rapport par tâche, dans l'ordre. Détail des fichiers dans `docs/AGENT_BOARD.md`.

## Tâche 7 — Onglets Tournois | Compétitions | Classements — fait
- `tournamentlistscreen.jsx` : 3 onglets droits (SegmentedControl) en haut de l'écran ; la barre du bas garde ses 5 entrées. Pull-to-refresh branché sur l'onglet actif.
- Le corps de `apps/competitions.jsx` est devenu `components/competitions/CompetitionsView.jsx` (réutilisé par l'onglet et par l'écran poussé). Onglet Classements = `RankingsView` (contenu réel à la tâche 10).
- Tests : `TournamentsHubTabs.test.jsx` (nouveau) ; 3 tests de lecture de source repointés vers `CompetitionsView.jsx` (`pageTiles`, `matchFlowParity`, `stageDesignConformance`).
- Bouton coupé : variante absente de `Button.jsx` à ce stade ; pas de nouveau bouton créé dans cette tâche.

## Tâche 8 — Compétitions — fait
- `CompetitionsView` : mes inscriptions (`season-registrations?club_id=`, saison / division / joueurs confirmés / statut), fenêtre d'inscription (`GET /regional-leagues/registration-windows` : ouverte → bouton « Inscrire mon club », à venir → date réelle, fermée), GOST (`GET /gost/overview`, repli sur l'ancien chargement si 404), coupes régionales (`GET /regional-leagues/cups/public` : tour en cours, clubs, prochain match de mon club), ligues régionales publiques (`GET /regional-public/overview`, ma région d'abord), parcours du club conservé.
- Chaque section charge et échoue seule (erreur + Réessayer par section). Squelettes au premier chargement, états vides, pull-to-refresh (hub + écran poussé).
- Tests : `lib/competitionsHub.test.js` (13), `components/competitionsView.test.jsx` (10). Smoke test : `ResourceState` autorisé à rendre `null`, dossiers `competitions` / `rankings` ajoutés.
- Aucune donnée inventée, aucun nouveau manque à noter dans `STAGE_DATA_GAPS.md`.

## Tâche 9 — Inscription de saison — fait

**Ce qui a changé** : `apps/register` suit maintenant le vrai flux serveur, comme le web (`RegionalRegistrationPanel`) : fenêtres publiées `GET /regional-leagues/registration-windows`, éligibilité du club `GET …/registration-readiness/:clubId`, puis `POST …/registration-windows/:id/apply`, `POST …/registrations/:id/confirm` (avec `player_ids`, 3 minimum) et `POST …/registrations/:id/reserve` (accepter avec joueurs / refuser).

**États couverts** : chargement (skeletons), erreur + Réessayer, pull-to-refresh, pas de club, pas président (lecture seule), Plus manquant (carte + lien Store), 403 (message du serveur), aucune fenêtre publiée, effectif insuffisant, déjà inscrit, confirmation avec liste de joueurs (raison d'inéligibilité affichée), place de réserve, confirmé avec division/groupe, refusé, liste d'attente, retiré.

**Écart avec la maquette (à valider)** : la maquette montre des sélecteurs Ligue/Division. Le serveur attribue la division et le groupe selon le placement sportif (le web le dit aussi) : aucun sélecteur de division, l'écran affiche la division/groupe attribués une fois confirmés. Aucune valeur inventée.

**Retiré** : l'ancien flux « Apply par région » (`applyForLeague` + note + Plus côté client). Il créait une candidature que les étapes confirm/reserve du serveur ne connaissent pas. `registrationEngine.js` et `RegistrationStatusPill` restent dans le code (non touchés).

**Limites** : le lien « Ouvrir les compétitions » ouvre la liste, car la candidature ne renvoie que `assigned_league_id` (pas le slug utilisé par `/apps/leagues/[slug]`).

**Tests** : SeasonRegister (20), seasonRegistration (18), Task16bRestyle, pageTiles, matchFlowParity, stageDesignConformance, RestyleSmoke : verts.

## Tâche 10 — Classements — fait

**Ce qui a changé** : l'onglet *Classements* de Tournois affiche les vrais classements via `GET /rankings/summary` : puces Clubs / Joueurs, puces région et plateforme, tableau (# · logo · nom · V-N-D · PTS), "Voir plus", et **ma ligne toujours visible** (en place si elle est dans la liste, épinglée sous « … » avec son vrai rang sinon). Appui sur une ligne → profil club ou joueur. Pull-to-refresh via le parent, skeletons, erreur + Réessayer, états vides (aucun classé / aucun résultat pour ces filtres + Effacer les filtres).

**Règles serveur respectées** : un compte gratuit reçoit le top 10 sans points ; il ne voit donc ni colonne PTS ni filtres, mais un encart STAGE Plus avec lien vers le Store. Plus : jusqu'à 100 lignes avec points et filtres.

**Données** : le serveur n'a pas de filtre plateforme, donc région et plateforme filtrent côté client les lignes reçues (noté dans `STAGE_DATA_GAPS.md`). Si mon club est hors des lignes reçues, son rang vient de son propre enregistrement (`global_rank`) ; sans rang, aucune ligne "moi" n'est inventée. Le rang affiché suit l'ordre de la liste filtrée.

**Tests** : rankings (13), rankingsView (14), TournamentsHubTabs, RestyleSmoke, stageDesignConformance : verts.

## Tâche 11 — Mercato — fait

**Ce qui a changé** : `apps/transfers` devient le Mercato : bandeau de fenêtre (vert si ouverte, date de fermeture réelle, via `transferWindowActions get_current` / hook existant, mises à jour temps réel conservées), puis trois onglets droits **Fil | Agents libres | Mes offres · N**.
- **Fil** : `GET /mercato-transfers/desk` (statut du serveur, route club → club, "Agent libre" si pas de club d'origine, frais STC si > 0). Appui → profil du joueur.
- **Agents libres** : l'ancien hub Transfers est conservé tel quel dans cet onglet (carrousel / liste, filtres, détail joueur, `getTransferMarket`) — déplacé dans `components/mercato/FreeAgentsView.jsx`, rien de perdu.
- **Mes offres** : `PlayerContract` (offres reçues comme joueur + offres envoyées par mon club si je suis président), sans les contrats de cycle de vie (ownership/founder), plus récentes d'abord. Le bandeau « Tu as N offres de contrat en attente » ouvre l'Inbox ; une offre reçue en cours ouvre l'Inbox, une offre envoyée ouvre le profil du joueur.

**États** : skeletons, erreur + Réessayer, vides, pull-to-refresh sur Fil et Mes offres.

**Écarts maquette (données absentes, rien d'inventé)** : pas de « 30 games » par ligne (le fil ne donne pas ce chiffre, voir `STAGE_DATA_GAPS.md`). Les textes de l'onglet Agents libres restent ceux de l'ancien écran (anglais en dur, déplacés sans changement).

**À savoir** : les tests de structure (`transferHub`, `matchFlowParity`) et `moneyAppsRestyle` ont été mis à jour pour viser l'onglet Agents libres. Le libellé « Transfers » de la grille Apps sera traité avec la tâche 12.

**Tests** : mercato (15), MercatoScreen (10), moneyAppsRestyle, transferHub, matchFlowParity, stageDesignConformance, pageTiles, RestyleSmoke : verts.

## Tâche 12 — Lifestyle — fait
- Écran `/apps/lifestyle` : solde STC, bandeau revenu passif (Collecter / compte à rebours), onglets Boutique | Mes actifs · N, filtres Tout/Acheter/Louer/Investir.
- Achat/location/investissement avec confirmation inline ; solde insuffisant → « Obtenir des STC » → Store ; vente au pourcentage serveur ; investissement encaissable à maturité.
- Ajouté au catalogue Apps (Lifestyle) ; entrée « Transfers » renommée « Mercato ».
- Tests : lifestyle.test.js (19), LifestyleScreen.test.jsx (14), miniApps, conformance — verts.
- Manque données : « maintenance due » (STAGE_DATA_GAPS.md). Bouton coin coupé de Claude toujours absent : `Button` existant utilisé.

## Tâche 13 — Store crédits — fait
- `/apps/store` : packs de crédits + STAGE Plus uniquement (aucun catalogue maillots/chaussures). Prix, perks et mensualité depuis `store-configs` ; packs = ceux du serveur.
- États : annulé (neutre), en attente (+ « Vérifier »), abonné avec date de renouvellement, renouvellement désactivé, annulation avec confirmation, retour Stripe (une seule fois).
- Loading / erreur + Réessayer / pull-to-refresh ; i18n EN+FR.
- Tests : StoreScreen.test.jsx (15), storeScreen.test.js (14). Ancien describe Store de moneyAppsRestyle déplacé dans StoreScreen.test.jsx (même couverture).
- Écart mockup : le serveur vend des CRÉDITS, pas des STC (voir STAGE_DATA_GAPS.md) ; pas de badge POPULAR (aucune donnée).

## Tâche 14 — Wallet — fait
- Actions rapides : « Recharger » → `/apps/store`, « Encaisser » → `/apps/lifestyle` (EN/FR). Aucun « Send » n'existait dans l'écran (confirmé par test : absent).
- « Collect salary » (existant) conservé. Erreur de chargement + Réessayer ajoutés.
- Tests : 2 nouveaux dans moneyAppsRestyle (actions, erreur+retry), suite verte.
- Non fait : « +520 STC ce mois » du mockup (pas de total mensuel fiable côté données, historique limité à 20 lignes) ; chargement = spinner de `AppDirectoryScreen` (composant partagé non modifié).

## Tâche 15 — Notifications — fait
- Nouvel écran `/apps/notifications` : groupes Aujourd'hui / Cette semaine / Plus tôt, point non-lu, heure/jour/date, icône par type, texte = celui du serveur.
- Toucher une notif : `POST /notifications/:id/read` puis ouverture du `link` (routes existantes via `resolveNotificationHref`) ; sans lien → seulement marquée lue.
- « Tout marquer comme lu » : pas d'endpoint → un appel par notif non lue côté client puis rechargement (noté dans STAGE_DATA_GAPS.md).
- Cloche de Home → Notifications (badge = notifs non lues seulement ; l'Inbox reste dans Apps et la tuile Alertes).
- Bouton réglages → `/apps/settings` (sera pointé vers Réglages → Notifications à la tâche 17).
- Tests : NotificationsScreen (10), notificationsFeed (8), dashboardHomeRender (cloche).

## Tâche 16 — News — fait (après décision de Lutina : nouvel écran simple, flux mercato réel)
- `/apps/news` (maquette News) : titre NEWS, onglets WORLD / MERCATO / BEAT, une carte « À la une » (photo ou icône) puis liste (vignette, titre, « Rubrique · il y a 5 h »).
- WORLD = `/news-desks/world_news` ; MERCATO = `/mercato-transfers/desk` ; BEAT = club_news + player_news + tournament + competitions fusionnés, du plus récent au plus ancien (un desk en échec n'empêche pas l'affichage).
- Squelettes au premier chargement ET au changement d'onglet (jamais les histoires de l'onglet précédent), vide « Pas encore d'actus », erreur + Réessayer, pull-to-refresh. EN + FR.
- Entrée « News » dans la grille Apps. Anciens desks papier-journal non touchés et non branchés (pas de détail Stage : lignes non cliquables, voir STAGE_DATA_GAPS.md).
- Tests : NewsScreen (10), newsFeed (10).

## Tâche 17 — Apparence + Réglages → Notifications — fait
- `/apps/appearance` : Dark / Live Dark / Custom. Custom est un vrai thème (primaire, dégradé, fond + opacité, 3 couleurs de texte), enregistré localement et envoyé sur l'utilisateur (`updateMe`, champs `custom*`). Alias `theme-custom → theme-dark` retiré. Pas de Day ni Live White. Live Dark : fond (Daily / Trophies / WIS / Stadium), 3 images (ajout, choix, suppression), flou et overlay en sliders.
- `/apps/notification-settings` : tableau Type × In-app / Push / E-mail (les 8 catégories réelles, pas les 5 lignes de la maquette), bouton Enregistrer (`Player.notification_settings`, tags OneSignal), alerte push désactivé + « Ouvrir les réglages du téléphone », ligne Son (système) , tests de toasts conservés.
- Réglages : le thème et les 3 sections de canaux sont remplacés par 2 lignes (Apparence, Notifications) ; l'interrupteur push du téléphone reste dans Réglages. L'enregistrement de Réglages n'envoie plus les champs `custom*` (sinon il écraserait le thème). Bouton réglages de Notifications → `/apps/notification-settings`.
- Nouveau composant partagé : `Slider` (ajout seulement). Modifs de partagés existants annoncées dans AGENT_BOARD.md.
- Écarts (STAGE_DATA_GAPS.md) : pas de son propre à l'app donc pas d'interrupteur « Play sound in the app » ; thème stocké côté serveur à confirmer ; fond Live Dark seulement sur l'appareil.
- Tests : suites lib/components/screens vertes (1856), sauf GamerProfileUIStage (1 échec : `onCyan` passé à PAPER par les modifs de palette de l'autre partie dans `stageTheme.js`, pas liées à la tâche).

## Tâche 18 — Mot de passe oublié — fait
- `/auth/forgotpassword` (maquette ForgotPassword) : e-mail validé, `POST /auth/forgot-password` (`identifier`), carte « Vérifie ta boîte mail » (le texte ne dit jamais si le compte existe, comme le serveur), « Renvoyer dans 1:00 » (compte à rebours 60 s) puis « Renvoyer », erreur réseau + nouvel essai, « Se connecter » en bas.
- `/auth/resetpassword?token=` : `GET /auth/reset-password` (squelette pendant la vérification, erreur + Réessayer), lien expiré/utilisé ou absent → carte + « Demander un nouveau lien », formulaire nouveau mot de passe + confirmation (8 caractères min.), `POST /auth/reset-password`, succès → « Se connecter ».
- Login : lien « Mot de passe oublié ? » sous le champ mot de passe (zone ≥ 44 px).
- Écart : l'e-mail du serveur contient un lien WEB (pas de lien profond vers l'app) — voir STAGE_DATA_GAPS.md.

## Tâche 19 — Club — fait
- Constat : aucun « head to head » sur l'écran Club (le seul est dans `GameDayInsights`, tâches 1–6, non touché). Un test vérifie qu'aucun bloc head-to-head / h2h n'apparaît.
- Ajout : « Forme récente » (V/N/D du plus ancien au plus récent) et « Derniers résultats » (vs/à adversaire, score, pastille) construits depuis les vrais matchs terminés du club (`bundle.matches`, 5 max, matchs sans score ignorés). État vide « Aucun résultat pour le moment ». EN + FR.
- Conservé : hero, stats, onglets, Challenge, Follow, chargement/erreur/réessayer, pull-to-refresh.
- Non repris de la maquette (voir STAGE_DATA_GAPS.md) : Rank/Record/Squad et la ligne compétition → Standings (données absentes du bundle) ; le hero riche existant n'est pas remplacé.
- Tests : ClubScreen (6), clubForm (6).

## Fin de passe (tâches 7 à 19)
- Fait : 7 à 19 (la 16 a été débloquée par la décision de Lutina : nouvel écran News simple, flux mercato réel).
- `Button.jsx` re-vérifié en fin de passe : toujours seulement `primary / secondary / danger` (pas de variante « coins coupés »). Je n'en ai pas créé ; les boutons pleins des nouveaux écrans (Apparence, Notifications, Mot de passe oublié, Club) utilisent donc `Button` primary tel quel et prendront le format sport quand Claude Code livrera la variante.
- Suite complète : 1994 tests verts sur 1995. Le seul échec (`GamerProfileUIStage` : `onCyan` = `PAPER`) vient des modifications de palette de l'autre partie dans `stageTheme.js`, pas de ces tâches.
- Aucun commit, aucun push.

## Alignement maquettes `6-audit` (en cours)
Lutina a demandé d'aligner toutes les pages app ↔ `docs/design/stage-mockups/6-audit`.

**Layouts restylés (Cursor)** :
- Lifestyle : header back | LIFESTYLE | STC, bannière passive en ligne + COLLECT, onglets soulignés (NewsTabs).
- Mercato (`transfers`) : header back | MERCATO, onglets soulignés, sans cadre PageTile.
- Store crédits : header back | STORE | STC, titre GET STC, Plus (prix + Subscribe côte à côte), packs STC + badge Popular.
- Notifications : eyebrow NOTIFICATIONS centré entre back et réglages.
- Notification settings : grille canaux + son Default + toggle « Play sound in the app » (maquette) ; toasts de test retirés de l'UI.
- Appearance : aperçu 3 pastilles Custom quand le thème n'est pas Custom ; champs hex seulement en Custom.
- Season registration : header SEASON REGISTRATION + badge President, sans PageTile.

**Encore en cours (écrans Claude 2–6 / maquettes absentes comme pages dédiées)** :
- MatchPrep, ReportResult, ConfirmResult, Reschedule, TournamentRegister — libs + écrans en construction (`matchPrep.js`, `officialReschedule.js`, …).

## Alignement maquettes `5-apps`
- **Apps** : APP DIRECTORY, groupes Club / Compete / Account, tuiles 72px (maquette). News + Lifestyle restent sous Account.
- **Inbox** : eyebrow INBOX + mark-all, filtre `Needs action · N`, liste plate (sans PageTile).
- **InboxMessage** : CTA contrat → ACCEPT OFFER.
- **Wallet** : header WALLET, solde + delta du mois, Top up / Collect / Store, Activity « This month » (pas de Send).
- **Club** : Challenge primaire + Follow, stats Record / Squad (pas de Rank inventé).
- **Settings** : déjà aligné. **Store / Transfers** du dossier 5 : on garde StoreCredits + Mercato (dossier 6), pas le catalogue kits.

## Alignement maquettes `4-profile-teams`
- **Availability** : grille 7×4 tri-état busy → available → maybe ; légende 3 états ; PUT envoie `status:'maybe'` (serveur echo seulement — GAP).
- **EditProfile** : Display name + Bio + grille Main/Alt/Platform/Country + Preferred foot chips ; banner/account conservés (richesse).
- **CreateTeam** : Crest, Colours, Open to applications, `+ Add player` ; country/bio conservés.
- **TeamProfile** : CTA Recruit players → Mercato (staff) ; stats Record/Squad/Trophies inchangées (pas de Rank inventé).
- **Profile** : engrenage Settings → `/apps/settings` ; liste Edit / Availability / My team / Wallet.
