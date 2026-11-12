# Tableau de bord des agents — audit produit (nov 2026)

> Claude Code et Cursor travaillent en parallèle dans `eafc-app`. Une ligne par tâche de `docs/STAGE_APP_BUILD_LIST.md`. Mettre à jour en commençant et en finissant une tâche. Ne jamais prendre une tâche de l'autre agent.

| # | Tâche | Agent | État | Fichiers touchés |
|---|---|---|---|---|
| 0 | Variante de bouton coupée (`ui/Button.jsx`) | Cursor (demande Lutina / dossier 1) | fait | `Button.jsx` primary = clip 12px + uppercase 800 ; secondary = `.btn2` arrondi ; `metrics.BUTTON_CUT` ; test `Button.test.jsx` |
| 1 | Retirer l'UI des prêts | Claude Code | à faire | |
| 2 | Préparer le match officiel | Claude Code | en cours (Cursor: coque UI maquette) | Cursor: `apps/match-prep.jsx`, `lib/matchPrep.js`, `hooks/useMatchPrep.js`, entrée depuis match detail, test `MatchPrepScreen` — wired to documented prep/publish HTTP; Claude encore propriétaire du polish métier |
| 3 | Déclarer le score | Claude Code | en cours (Cursor: coque UI maquette) | Cursor: `apps/report-result.jsx` + nav depuis `GameDayScoreReport` (submit → écran dédié); sheet existante conservée pour amend/review. Test `ReportResultScreen` |
| 4 | Confirmer / contester | Claude Code | en cours (Cursor: coque UI maquette) | Cursor: `apps/confirm-result.jsx` + nav confirm depuis match detail; confirm/dispute via `matchKickoff`. Test `ConfirmResultScreen` |
| 5 | Inscription à un tournoi | Claude Code | en cours (Cursor: coque UI maquette) | Cursor: `apps/tournament-register.jsx`, `lib/tournamentRegister.js`, lien « Open registration » depuis tournament detail. Slots via `tournamentClubAvailability` si dispo. Test `TournamentRegisterScreen` |
| 6 | Report officiel | Claude Code | en cours (Cursor: coque UI maquette) | Cursor: `apps/reschedule.jsx`, `lib/officialReschedule.js` (`GET/POST /game-day/:id/reschedule`), entrée staff depuis match detail. Test `RescheduleScreen` |
| 7 | Onglets Tournois / Compétitions / Classements | Cursor | fait | `(tabs)/tournaments/tournamentlistscreen.jsx`, `components/competitions/CompetitionsView.jsx` (corps de `apps/competitions.jsx` déplacé), `components/rankings/RankingsView.jsx`, `apps/competitions.jsx` (enveloppe), tests de conformité (chemins) |
| 8 | Compétitions | Cursor | fait | `components/competitions/CompetitionsView.jsx`, `StatusTag.jsx`, `lib/competitionsHub.js`, `hooks/useCompetitionsHub.js`, `apps/competitions.jsx` |
| 9 | Inscription de saison | Cursor | fait | app/apps/register.jsx, components/register/RegistrationWindowCard.jsx, hooks/useSeasonRegistration.js, lib/seasonRegistration.js, translations/stageScreens.js (section register), tests: SeasonRegister, seasonRegistration (+ Task16bRestyle, matchFlowParity, stageDesignConformance mis à jour) |
| 10 | Classements | Cursor | fait | components/rankings/RankingsView.jsx, hooks/useRankings.js, lib/rankings.js, translations/stageScreens.js (section rankings), tests: rankings, rankingsView |
| 11 | Mercato | Cursor | fait | app/apps/transfers.jsx (réécrit en Mercato), components/mercato/{MercatoWindowBanner,MercatoFeed,MyOffersView,FreeAgentsView}.jsx, hooks/useMercato.js, lib/mercato.js, translations/stageScreens.js (section mercato), tests: mercato, MercatoScreen (+ moneyAppsRestyle, transferHub, matchFlowParity, stageDesignConformance mis à jour) |
| 12 | Lifestyle | Cursor | fait | src/app/apps/lifestyle.jsx, src/components/lifestyle/*, src/lib/lifestyle.js, src/hooks/useLifestyle.js, src/lib/miniApps.js (+Lifestyle, Transfers→Mercato), stageScreens.js (lifestyle) |
| 13 | Store crédits | Cursor | fait | src/app/apps/store.jsx (réécrit), src/lib/store.js, src/hooks/useStoreScreen.js, stageScreens.js (store), tests StoreScreen/storeScreen |
| 14 | Wallet | Cursor | fait | src/app/apps/wallet.jsx, stageScreens.js (wallet), moneyAppsRestyle.test.jsx |
| 15 | Notifications | Cursor | fait | src/app/apps/notifications.jsx, src/lib/notificationsFeed.js, src/hooks/useNotificationsFeed.js, src/components/dashboard/DashboardLayoutLab.jsx (cloche Home), stageScreens.js (notifications), tests NotificationsScreen/notificationsFeed/dashboardHomeRender |
| 16 | News | Cursor | fait | src/app/apps/news.jsx, src/components/news/NewsStageParts.jsx, src/lib/newsFeed.js, src/hooks/useNewsFeed.js, src/lib/miniApps.js (entrée News), stageScreens.js (news), tests: NewsScreen, newsFeed, miniApps, stageDesignConformance |
| 17 | Apparence + réglages notifications | Cursor | fait | src/app/apps/appearance.jsx, src/app/apps/notification-settings.jsx, src/lib/customTheme.js, src/lib/notificationPrefs.js, src/hooks/useNotificationSettings.js, src/components/ui/Slider.jsx (nouveau), stageTheme.js + StageBackground.jsx (modifs annoncées), settings.jsx (liens), notifications.jsx (bouton réglages), stageScreens.js (appearance, notifSettings, settingsLinks), tests: AppearanceScreen, NotificationSettingsScreen, Slider, customTheme, notificationPrefs, stageTheme, themeStore, SettingsRestyle |
| 18 | Mot de passe oublié | Cursor | fait | src/app/auth/forgotpassword.jsx, src/app/auth/resetpassword.jsx, src/app/auth/loginscreen.jsx (lien), stageScreens.js (forgot), tests: ForgotPasswordScreen (15), Task17bMinor (+1 lien), stageDesignConformance |
| 19 | Club (retirer head to head) | Cursor | fait | src/app/apps/club/[id].jsx (insertion), src/components/club/ClubRecentResults.jsx, src/lib/clubForm.js, stageScreens.js (club), tests: ClubScreen, clubForm, stageDesignConformance |
| — | Alignement layouts maquettes `6-audit` (écrans 7–19) | Cursor | fait | Headers / onglets soulignés / bannières (Lifestyle, Mercato, Store, Notifications, NotificationSettings, Appearance, SeasonRegistration, News, ForgotPassword) alignés sur `6-audit/*.png` ; tests Store/Lifestyle/Mercato/Notifs/Appearance/SeasonRegister/Forgot OK |
| — | Alignement layouts maquettes `5-apps` | Cursor | fait | Apps (Club/Compete/Account), Inbox, Wallet, Club, InboxMessage ; Store/Transfers restent StoreCredits/Mercato (6-audit) |
| — | Alignement layouts maquettes `4-profile-teams` | Cursor | fait | Availability tri-état Maybe ; EditProfile Display name + Preferred foot ; CreateTeam colours + open applications ; TeamProfile Recruit ; Profile Settings gear |
| — | Alignement layouts maquettes `3-tournaments` | Cursor | fait | List cards + hub ; Detail sans PageTile (hero Share, Clubs/Prize/Final) ; Fixtures matchday nav ; CreateTournament header ; Standings/Group/Bracket déjà OK |
| — | Alignement layouts maquettes `2-home-gameday` | Cursor | fait | Game Day header ; MatchDetail competition·Share ; Search flat ; Upload « Add match footage / Publish » ; Watch scoreline ; Home déjà OK |
| — | Alignement layouts maquettes `1-onboarding` | Cursor | fait | Welcome OK ; Signup rôles Player/Club manager ; Login logo + copy ; Platform cross-play ; Position alt ; Gamertag PSN/preview/Skip ; Club « Set up your club » / Free agent |
| 2–6 | MatchPrep / Report / Confirm / Reschedule / TournamentRegister (UI maquette) | Cursor (en parallèle Claude) | fait (coques) | Routes `/apps/match-prep|report-result|confirm-result|reschedule|tournament-register` + libs/hooks + smoke tests 387 verts ; Claude reste propriétaire du polish métier |

## Ajouts aux composants partagés (Cursor — nouveau seulement, rien d'existant modifié)

- `src/components/ui/ResourceState.jsx`, `src/components/ui/Skeleton.jsx` (états chargement / vide / erreur) + 2 lignes d'export en fin de `src/components/ui/index.js`.
- `src/translations/stageScreens.js` (clés `stage.*`) + 1 ligne dans `getCoreTranslations` (`coreTranslations.js`) ; hook `src/hooks/useT.js`.

## Modifications annoncées de composants partagés EXISTANTS (Cursor, avant édition)

- `src/components/ui/Screen.jsx` : prop `authBackdrop` pour Welcome/Login/Signup — wallpaper auth dédié (`AuthWallpaper`), indépendant de Live Dark.
- `src/components/ui/Button.jsx` (dossier 1 / tâche 0) : primary reprend le `.btn` maquette (coins coupés 12px via SVG Polygon, uppercase, weight 800, letter-spacing 0.06em) ; secondary inchangé en contour arrondi. `metrics.js` : `BUTTON_CUT = 12`.
- `src/lib/stageTheme.js` (tâche 17, demandée par le prompt) : retrait de l'alias `theme-custom → theme-dark` (`REMOVED_THEMES`), ajout de `theme-custom` à `STAGE_THEME_IDS` et d'un preset `theme-custom` construit depuis `lib/customTheme.js`. Seules ces lignes sont touchées.
  - Attention : le fichier a déjà des modifications NON commitées d'une autre main (palette : `cyan #4A6AA5`, `cyanHi`, `aqua`, `onCyan`, fallback de `hexToRgba`). Je ne les modifie pas et ne les commite pas ; `tailwind.config.js` est dans le même cas et reste intact.
- `src/components/ui/StageBackground.jsx` (tâche 17) : si `tokens.customBackdrop` existe (thème Custom seulement), dégradé fond → couleur de dégradé de l'utilisateur ; sinon rendu inchangé (3 couches Stage).
- Ajout (nouveau) : `src/components/ui/Slider.jsx` + 1 ligne d'export dans `src/components/ui/index.js` (réglages flou / voile Live Dark, opacité du fond Custom).

États : à faire · en cours · fait · bloqué (raison).
