# Cursor — implémenter l'audit produit dans eafc-app

> Lutina, 11 nov 2026 : Cursor implémente une partie de la liste de l'audit, **en parallèle de Claude Code**.

## Partage du travail (important)

| Agent | Tâches de `docs/STAGE_APP_BUILD_LIST.md` |
|---|---|
| Claude Code | variante de bouton coupée dans `src/components/ui/Button.jsx`, puis tâches **1 à 6** (prêts, préparation du match, déclarer le score, confirmer/contester, inscription tournoi, report officiel) |
| **Cursor** | tâches **7 à 19**, dans cet ordre |

- Ne pas modifier les fichiers des tâches 1 à 6 (Game Day, `components/matches/*`, inscription tournoi, UI des prêts).
- Bouton coupé : utiliser la variante créée par Claude Code. Si elle n'existe pas encore, commencer par une tâche qui n'en a pas besoin (Classements, Notifications, News) et revenir ensuite. Ne pas créer une deuxième version.
- Composants partagés (`src/components/ui/*`, `stageTheme.js`, `tailwind.config.js`) : n'ajouter que du nouveau. Pour modifier un composant existant, noter d'abord la modification dans `docs/AGENT_BOARD.md`.
- Tenir `docs/AGENT_BOARD.md` à jour : une ligne par tâche (agent, état, fichiers touchés). Rapport court dans `docs/CURSOR_STATUS.md` après chaque tâche.

## Tes tâches (7 à 19)

7. **Onglets d'écran dans Tournaments** : Tournois | Compétitions | Classements (onglets droits, pas de nouvel onglet en bas).
8. **Compétitions** : restyler `apps/competitions` ; ajouter les coupes régionales (`GET /regional-leagues/cups/public`) et les ligues régionales publiques (`GET /regional-public/overview`), plus GOST (`GET /gost/overview`) et mes inscriptions (`season-registrations`).
9. **Inscription de saison** : restyler `apps/register` (`season-registrations` : ligue, division, joueurs confirmés, règles acceptées, statut, place de réserve).
10. **Classements** : `GET /rankings/summary|clubs|players`, filtres région / plateforme, ma ligne toujours visible.
11. **Mercato** : remplacer le contenu de `apps/transfers` : fenêtre (`transferWindowActions {action:'get_current'}`), fil `GET /mercato-transfers/desk`, agents libres (`getTransferMarket`), mes offres (`player-contracts`).
12. **Lifestyle** (nouvel écran dans la grille Apps) : `lifestyle-items`, `lifestyle-purchases`, `buyLifestyleItem`, `rentLifestyleItem`, `investInLifestyleItem`, `collectPassiveIncome`, `sellLifestyleAsset`.
13. **Store crédits** : `apps/store` = packs STC + STAGE Plus seulement (`store-configs`, `stripeCheckout`, `stripeSubscription`, `cancelStagePlus`). Aucun catalogue de maillots ou chaussures.
14. **Wallet** : retirer « Send » (n'existe pas côté serveur) ; ajouter « Encaisser » (→ Lifestyle) et « Recharger » (→ Store).
15. **Notifications** (nouvel écran depuis la cloche de Home) : `GET /notifications`, `POST /notifications/:id/read`, tout marquer lu, ouvrir le `link`.
16. **News** (grille Apps) : brancher `WorldNewsDesk`, `MercatoDesk`, `NewsBeatDesk` (déjà écrits, importés nulle part) sur `GET /news-desks/:section`.
17. **Apparence** : vrai thème Custom (couleurs enregistrées sur l'utilisateur comme sur le web : `customPrimaryColor`, `customGradientColor`, `customBackgroundColor`, `customBackgroundOpacity`, couleurs de texte). Retirer l'alias `theme-custom → theme-dark` dans `stageTheme.js`. Live Dark complet (rotation quotidienne, Trophies, WIS, Stadium, 3 images, flou, overlay). Pas de Day ni de Live White. Plus l'écran Réglages → Notifications (canaux in-app / push / email + sons).
18. **Mot de passe oublié** : `POST /auth/forgot-password`, `GET/POST /auth/reset-password`, lien depuis Login.
19. **Club** : retirer le « head to head » (pas d'endpoint), afficher les derniers résultats réels.

## À lire

- `docs/STAGE_PRODUCT_AUDIT.md` : tableau backend → web → app ; **section 6 = fiche de chaque écran** (ce que le joueur fait, données, boutons, états).
- Maquettes : `docs/design/stage-mockups/6-audit/*.dc.html` + `.png` (Competitions, SeasonRegistration, Rankings, Mercato, Lifestyle, StoreCredits, Notifications, News, Appearance, NotificationSettings, ForgotPassword) et `5-apps/Wallet`, `5-apps/Club`.
- Design : `docs/STAGE_REDESIGN_PROMPT.md` (tokens, dégradé, logo, composants `src/components/ui/`).
- Backend en lecture seule : `/Users/creaafde/Documents/workbench stage/stage/server/src/server/` (`routes/registerStageRoutes.js`, `controllers/*`, `functions/legacyFunctions.js`). Ne pas le modifier.

## Règles

- **Données réelles uniquement** via `stageClient` (`/api/stage`) et `api` (`/api/mobile`). Aucune nouvelle route serveur. Donnée absente → état vide + ligne dans `docs/STAGE_DATA_GAPS.md`. Jamais de valeur inventée.
- Chaque écran : chargement (squelettes), vide, erreur + Réessayer, pull-to-refresh pour les listes. Hooks au format `useAsyncResource` (`{ data, loading, error, refreshing, refetch }`).
- Navigation : 5 onglets inchangés (Home, Game Day, Tournaments, Profile, Search) ; tout le reste en écrans poussés.
- Boutons pleins : format sportif (coins coupés haut-gauche / bas-droite, capitales, gras). Pas pour les onglets, la photo du joueur, le logo du club (ronds, image entière) ni les boutons à bordure.
- Garder ce qui marche déjà ; ne supprimer que ce que la tâche demande.
- Tests : test qui échoue d'abord, puis le code. Lancer les suites touchées isolément (`yarn jest <fichier> --runInBand`). Seul échec connu avant ce travail : `src/__tests__/lib/matchFlowParity.test.js`.
- Textes visibles via `src/translations` ; `accessibilityLabel` sur les boutons-icônes ; cibles ≥ 44 px.
- **Ne jamais commit ni push** sans l'accord explicite de Lutina. Pas de nouvelle dépendance sans justification.
- Une maquette en conflit avec une fonction plus riche déjà en place → s'arrêter et demander à Lutina.
- Ne pas faire la section « Plus tard ».
