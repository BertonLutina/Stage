# À construire dans l'app EA FC — liste pour Cursor

> Source : `docs/STAGE_PRODUCT_AUDIT.md` (11 nov 2026). Maquettes : canvas « Stage – Mockups des pages », section 6, et `docs/design/stage-mockups/6-audit/*.dc.html` + `.png`.
> Règles : une tâche = un écran. Données réelles uniquement, via les routes citées (aucune nouvelle route serveur n'est nécessaire pour cette liste). États chargement / vide / erreur sur chaque écran. Pas de nouvel onglet : 5 onglets inchangés. Boutons pleins au format sportif (coins coupés haut-gauche / bas-droite, capitales, gras) ; onglets, photo joueur et logo club non coupés. Ne pas commit ni push sans l'accord de Lutina.

## Bloquant

1. **Retirer l'UI des prêts.** Le serveur répond 410 `LOANS_REMOVED` sur `/player-loans`. Supprimer `InboxLoanCard`, `RequestLoanDialog` et les sections prêt des profils. Remplacer par un lien « Proposer un transfert ».
2. **Préparer le match officiel** (`MatchPrep`, staff) : `club-fixture-availabilities`, `GET/POST /club-fixture-lineups/preparation/:clubId/:fixtureId`, `POST /clubs/:id/lineups/:fixtureId/publish`. Accès depuis le match dans Game Day.
3. **Déclarer le score** (`ReportResult`) : garder `GameDayScoreReport`, le restyler sur la maquette. `PATCH /matches/:id {action:'submit_result', …}`, `GET /game-day/:id/penalties`, upload preuve.
4. **Confirmer ou contester** (`ConfirmResult`) : `confirm_result` / `dispute_result`, affichage du délai d'auto-confirmation.
5. **Inscription à un tournoi** (`TournamentRegister`) : `tournamentRegistration`, `tournamentRulesAccept`, `tournamentClubAvailability`, `tournamentWithdrawal`.

## Important

6. **Reporter un match officiel** (`Reschedule`) : `GET/POST /game-day/:id/reschedule`.
7. **Onglets d'écran dans Tournaments** : Tournois | Compétitions | Classements (onglets droits, pas de nouvel onglet en bas).
8. **Compétitions** (`Competitions`) : restyler `apps/competitions` ; ajouter les coupes régionales (`GET /regional-leagues/cups/public`) et les ligues régionales publiques (`GET /regional-public/overview`).
9. **Inscription de saison** (`SeasonRegistration`) : restyler `apps/register` sur la maquette (`season-registrations`).
10. **Classements** (`Rankings`) : `GET /rankings/summary|clubs|players`.
11. **Mercato** (`Mercato`) : remplacer le contenu de `apps/transfers` : fenêtre (`transferWindowActions get_current`), fil `GET /mercato-transfers/desk`, agents libres `getTransferMarket`, mes offres `player-contracts`.
12. **Lifestyle** (`Lifestyle`, nouvel écran dans la grille Apps) : `lifestyle-items`, `lifestyle-purchases`, `buyLifestyleItem`, `rentLifestyleItem`, `investInLifestyleItem`, `collectPassiveIncome`, `sellLifestyleAsset`.
13. **Store crédits** (`StoreCredits`) : `apps/store` = packs STC + STAGE Plus seulement (`store-configs`, `stripeCheckout`, `stripeSubscription`, `cancelStagePlus`). Pas de catalogue de maillots ou chaussures.
14. **Wallet** : retirer « Send » ; ajouter « Encaisser » (→ Lifestyle) et « Recharger » (→ Store crédits).
15. **Notifications** (`Notifications`, nouvel écran depuis la cloche de Home) : `GET /notifications`, `POST /notifications/:id/read`.
16. **News** (`News`, grille Apps) : brancher les composants déjà écrits `WorldNewsDesk`, `MercatoDesk`, `NewsBeatDesk` sur `GET /news-desks/:section`.
17. **Apparence** (`Appearance`) : vrai thème Custom (couleurs enregistrées sur l'utilisateur comme sur le web ; retirer l'alias `theme-custom → theme-dark` dans `stageTheme.js`) ; Live Dark complet (rotation, Trophies, WIS, Stadium, 3 images, flou, overlay). Supprimer Day et Live White s'il en reste.
18. **Mot de passe oublié** (`ForgotPassword`) : `POST /auth/forgot-password`, `GET/POST /auth/reset-password`, lien depuis Login.
19. **Club** : retirer le bloc « head to head » de la maquette (pas d'endpoint) ; afficher les derniers résultats réels.

## Plus tard (ne pas faire maintenant)

Cession de présidence · staff, permissions, candidatures du club · finances, stade, maillots du club · réponse aux paris de match · flux scouting · indemnité de transfert · tournois internationaux · pronostics · matchs en direct · messages privés (le web ne les a pas : décision de Lutina d'abord).
