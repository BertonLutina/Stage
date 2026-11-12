# Claude Code — implémenter l'audit produit dans eafc-app

> Lutina, 11 nov 2026 : Claude Code implémente la liste de l'audit dans l'app mobile.

## À lire d'abord

1. `docs/STAGE_APP_BUILD_LIST.md` : **la liste à suivre**, dans l'ordre (bloquant → important). Une tâche = un écran.
2. `docs/STAGE_PRODUCT_AUDIT.md` : tableau backend → web → app, et la fiche de chaque écran (ce que le joueur fait, données, boutons, états). Section 6 = fiches.
3. Maquettes : `docs/design/stage-mockups/6-audit/*.dc.html` + `.png` (nouveaux écrans) et sections 1 à 5 (écrans existants, boutons mis à jour).
4. Contexte du rebuild déjà fait : `docs/STAGE_REBUILD_HANDOFF.md`, `docs/STAGE_REDESIGN_PROMPT.md` (tokens, dégradé, logo, composants `src/components/ui/`).
5. Backend (lecture seule, ne pas modifier) : `/Users/creaafde/Documents/workbench stage/stage/server/src/server/` — `routes/registerStageRoutes.js`, `controllers/*`, `functions/legacyFunctions.js`.

## Règles

- **Données réelles uniquement**, via les routes citées dans la liste (`stageClient` `/api/stage`, `api` `/api/mobile`). Aucune nouvelle route serveur. Si une donnée manque : état vide + ligne dans `docs/STAGE_DATA_GAPS.md`, jamais de valeur inventée.
- Chaque écran : chargement (squelettes), vide, erreur + Réessayer, pull-to-refresh pour les listes.
- **Navigation** : 5 onglets inchangés (Home, Game Day, Tournaments, Profile, Search). Tout le reste en écrans poussés. Dans Tournaments, des onglets d'écran droits : Tournois | Compétitions | Classements.
- **Boutons pleins** : format sportif (coins coupés en haut à gauche et en bas à droite, capitales, gras) ; à ajouter comme variante du `Button` de `src/components/ui/`. Pas pour les onglets, la photo du joueur, le logo du club (ronds, image entière) ni les boutons à bordure.
- **Thèmes** : uniquement Dark, Live Dark, Custom. Custom = vrai thème (couleurs enregistrées sur l'utilisateur comme sur le web).
- Garder les fonctions qui marchent déjà (approche sans perte) ; ne supprimer que ce que la liste demande (UI des prêts).
- TDD comme pour le rebuild : test qui échoue → code → test vert. Suites touchées lancées isolément (`yarn jest <fichier> --runInBand`).
- Textes visibles via `src/translations`. `accessibilityLabel` sur les boutons-icônes, cibles ≥ 44 px.
- **Ne pas commit ni push** sans l'accord de Lutina. Pas de nouvelle dépendance sans le justifier.

## Déroulé

1. **Partage avec Cursor** (qui travaille en parallèle, voir `docs/CURSOR_BUILD_PROMPT.md`) : Claude Code fait **d'abord la variante de bouton coupée** dans `src/components/ui/Button.jsx` (Cursor l'attend), puis les tâches **1 à 6** de `STAGE_APP_BUILD_LIST.md` (prêts, préparation du match, déclarer le score, confirmer/contester, inscription tournoi, report officiel). Les tâches 7 à 19 sont à Cursor : ne pas y toucher. Noter l'avancement dans `docs/AGENT_BOARD.md` (une ligne par tâche : agent, état, fichiers touchés).
2. Après chaque tâche : mettre à jour `docs/STAGE_REBUILD_STATUS.md` (écran, données, état) et donner un rapport court à Lutina : fait / données manquantes / écart avec la maquette et pourquoi.
3. Si une maquette entre en conflit avec une fonction plus riche déjà en place, s'arrêter et demander à Lutina.
4. Ne pas faire la section « Plus tard ».
