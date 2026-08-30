# STAGE WEB — Game Day prompt (paste into Cursor on Lengarose/stage)

You are working in **https://github.com/Lengarose/stage** (Stage Web + Express API). Do **code only**. The owner deploys Gandi themselves. Do not FTP, restart, probe production, or mix deploy into this task.

## Product

Two clients, one API (`/api/stage`, JWT, MySQL):

- This repo = source of truth for Game Day behaviour.
- Mobile (`eafc-app` / BertonLutina/Stage) is a port. It must stay aligned with **this** result engine, not a second one.

Identity (do not reverse): president is a **role** on the founder player + `clubs.president_player_id`. Public identity is `/players/:id`. No President profile page.

## Spec (already written — do not rewrite it)

Read in this order, then implement. Do not re-open decided points.

1. `AGENTS.md` (binding)
2. `docs/GAMEDAY_REBUILD_PROMPT.md` — the Claude Code spec
3. `docs/CURSOR_STATUS.md` — last Cursor handshake (two server fixes already marked DONE: migration orphan lookup, `processMatchCompletion` career UPDATE must not 500 after official result)
4. `docs/NEXT_TASK.md` — only if Cursor has not already completed it

**Do not redo Phase 1 or Phase 2.** Phase 2 is already true on web:

- Kickoff is **not** gated on dressing-room seats (`dressingBlocked` always false).
- Result player list comes from **club squad** (`Player.filter({ club_id })`), not `dressing_rooms.seated_players`.
- `GameDayDetail` must not mount the dressing-room panel.
- `useGameDayMatchRealtime` must **not** subscribe to DressingRoom, and **must** `if (!resolved) return` so global Match socket events for other fixtures do not refetch the open match.

Leave `GameDayDressingRoom.jsx` on disk. Do not delete it.

## What “Game Day top” means (same engine, every competition)

Home submits first. Away confirms or proposes one correction. Stats are only for **your own** club. Same path for Regional League, Supreme/Elite/Challenger, STAGE cups, community cups, Arrange Game.

| Actor | Does |
|---|---|
| Home | Kickoff (≤15 min before, home only). Submits score + own players who played + proof when required. |
| Away | Waits, then Confirm **or** Result is incorrect (no proof on correction). Fills **away** player stats on confirm. |
| Home review | Accept, one counter, or dispute with proof. |
| Admin | Only after clubs cannot agree. Admin Game Day → Disputes. Not a second admin tool. |

Evidence: required for league/knockout and any STC wager. Optional for Arrange Game.

Penalties: only when the score is a draw **and** the fixture allows a winner from a draw (knockout/playoff / `allow_penalties`). Store the draw; store `decided_on_penalties` + `penalty_winner_side` separately. Three radios: No penalties / Home / Away.

Deadlines are **lazy** (no cron): `settleMatchDeadlines` on read + sweep the user’s clubs on Game Day load.

## Bugs to fix on web now (verified against current main vs mobile)

1. **`getResultSubmissionControls` in `src/lib/gameDayResultFlow.js`**
   - `canShowResultAction` must stay true during negotiation, not only `isLive`. If `status` leaves `in_progress` while `result_state` is `AWAITING_AWAY_CONFIRMATION` / `AWAITING_HOME_REVIEW` / overdue / admin, buttons must not vanish.
   - `showAwaySubmit` must **not** fire in `AWAITING_AWAY_CONFIRMATION`. Away confirms; they do not `submit_result` again. Mobile already has this right — copy that control matrix, including `canCounter`, `showOverdue`, `showAdminReview`, `showFinal`.
   - Port `fixtureScoreFromSubmission` / `own_score`+`opponent_score` so confirm/review labels match what was actually claimed. Away own 2 / opponent 5 is Home 5–Away 2.

2. **`GameDayMatchResult.jsx` `isClubMatch`**
   - Do not use `game.mode === "club"` alone. Use the same `isClubGameDayMatch` helper (`mode === 'club'` OR home/away club ids, never solo). Arranged club games with a missing `mode` currently skip the squad and cannot submit stats.

3. **Dual club identity on `src/pages/GameDay.jsx`**
   - Load signed `club` **and** `presidentClub`. Pick the club that is **actually in the fixture**. Do not fall back to “first club I have” — that marks the wrong side as You and submits the wrong squad.
   - `pickMyClubForMatch` returns `null` if neither identity club is in the match (spectator). Hide kickoff/result.

4. **Match socket is global** (`stageClient` MATCH channel).
   - Game Day list reload must ignore other people’s fixtures (same idea as the `resolved` guard on detail). Filter by: already on the hub, or `home/away_club_id` / `home/away_player_id` belongs to this identity.

5. **Do not invent a second result engine** for solo. Solo uses the same `matchKickoff` actions. If a solo path still writes dummy 0-0-6 stats, fix it in `matchKickoff` / `applySoloPlayerRecord` so goals credit. Spec §19.2 and §19.5.

## Backend (write it; owner deploys)

Stay inside `matchKickoff` in `server/src/server/functions/legacyFunctions.js`. Enforce server-side:

- `requireMatchActorSide` — never trust a hidden button.
- Home-first submit; 409 `AWAITING_HOME_SUBMISSION` if away jumps the queue.
- Reject foreign club player stats (`FOREIGN_PLAYER_STATS`).
- One home counter (`CORRECTION_LIMIT` / `COUNTER_LIMIT`).
- Proof required when the evidence rule says so (`PROOF_REQUIRED`).
- Penalties rejected when not allowed.
- `processMatchCompletion` idempotent (`stats_processed`). Home events → `home_goal_events`, away → `away_goal_events`. Never concat the same submission twice. Club events update **My Club Career**, not general Player Career.
- Do not wrap official-result success in a 500 because a later career UPDATE failed (already patched once — do not regress).

If `docs/NEXT_TASK.md` is still open (migration orphan `.catch` fabricating a row), do that first.

Keep `schema.sql` and `startupMigrations.js` in sync for every persisted column.

## Out of scope

- Gandi / FTP / Render / production curl.
- `src/components/ui/*`, `base44/*`.
- Availability (`club_fixture_availability`) — D5, do not touch.
- Building the public lineup tabs (Phase 3–4) unless the result engine is already green. Result engine first.
- Recreating a President profile page.
- “Fixing” unrelated lint in `GameDayMatchResult.jsx` unused `submitted` state.

## Verify

```bash
npm run lint
npm run typecheck
node --check server/src/server.js
node server/scripts/gameday-result-smoke.js
```

Smoke must cover at least spec scenarios A (home submit → away confirm → completed) and C (away correction → home accept). Report the smoke summary line.

When done: overwrite `docs/CURSOR_STATUS.md` with a short report (diff + verification). Do not edit `docs/GAMEDAY_REBUILD_PROMPT.md`. Commit. Do not push unless the owner asked.

## Mobile already shipped (do not fight it)

eafc-app Game Day now:

- No dressing room on hub or match detail.
- Kickoff + score report + result sheet on the hub featured match and on match detail.
- Squad + “players who played” + own/opponent score mapping + home→away confirm/correct/counter/dispute.
- Socket: `if (!resolved) return`; hub only reloads matches that belong to the identity.
- `pickMyClubForMatch` has no false first-club fallback.

Keep web and mobile on this contract.
