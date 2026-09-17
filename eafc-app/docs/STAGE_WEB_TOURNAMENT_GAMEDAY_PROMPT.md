# STAGE WEB — one result engine: cups finish on Game Day

Paste this into Cursor on **https://github.com/Lengarose/stage**. Code only. Owner deploys Gandi. Do not FTP, probe prod, or mix deploy into this task.

Mobile (`BertonLutina/Stage` / `eafc-app`) already has no tournament score form. Fixture rows open Game Day (`matchdetailscreen`). Keep that. This prompt is the **web leftover**.

## Why

`TournamentDetail.jsx` still ships a second result engine:

- `TournamentResultDialog` (“Submit Match Result”)
- `submitResult` → string-compare both clubs’ scores → `Match.update` to `completed` / `disputed` / `awaiting_confirmation`
- client `MatchPlayerStat.create`

That path **never** calls `matchKickoff` / `processMatchCompletion`. Career, standings, wager, proof, and the Game Day dispute matrix are skipped.

`setResultDialogOpen(true)` is currently unwired (`KnockoutBracket` is not passed `onSubmit`), but the dialog and handlers are still in the page. Delete them. Do not leave a second door.

## Product rule (do not invent a second engine)

Tournament page: bracket, register, draw, schedule propose. **No score form.**

Finish the cup the same way as GOST / Regional League / Arrange Game:

Home kickoff → home submits on **Game Day** → away confirms or corrects → `matchKickoff` → `processMatchCompletion`.

CTA from a scheduled / live / negotiating cup row: `/game-day?match=<id>`. `GameDay.jsx` already reads `searchParams.get("match")` and selects that fixture.

### Do not touch

- `competitionEngineService.submitResult` (GOST/league server API)
- `server/scripts/gameday-result-smoke.js`
- `Admin.jsx` `resultForm` (admin score tool — out of scope)
- Forfeit claim / admin forfeit approve on the tournament page (leave)
- `simulateScore` admin control (leave)

## 1. New `src/lib/tournamentGameDay.js`

```js
const CLOSED_STATUSES = new Set(["completed", "forfeit", "cancelled", "canceled", "deleted"]);
const DRAW_ONLY_STATUSES = new Set(["unscheduled"]);

/** Cup fixtures finish on Game Day (`matchKickoff`), not a tournament-page score form. */
export function canOpenTournamentGameDay(match) {
  if (!match?.id) return false;
  const status = String(match.status || "").toLowerCase();
  if (CLOSED_STATUSES.has(status)) return false;
  if (DRAW_ONLY_STATUSES.has(status)) return false;
  return true;
}

export function tournamentGameDayWebPath(matchId) {
  return `/game-day?match=${encodeURIComponent(String(matchId))}`;
}
```

## 2. `src/components/KnockoutBracket.jsx`

Import the helper. The `onSubmit` prop now means **open Game Day**, not open `TournamentResultDialog`. Relabel Result / Confirm to **Game Day**. Show it for scheduled / in_progress / awaiting_confirmation / disputed.

In `MatchCard`:

- Import `canOpenTournamentGameDay` from `@/lib/tournamentGameDay`.
- `const openGameDay = onSubmit && canOpenTournamentGameDay(match);`
- `pending` must include `"disputed"` so a negotiating match still shows the CTA.
- `showPendingActions` uses `openGameDay` instead of `onSubmit`.
- Grid: `canSchedule && openGameDay ? "grid-cols-2" : "grid-cols-1"`
- Replace the Result / Confirm branch with one button:

```jsx
{openGameDay && (
  <button type="button" onClick={() => onSubmit(match)}
    className="text-xs uppercase tracking-wider font-semibold text-primary bg-primary/5 hover:bg-primary/10 py-2.5 transition-colors">
    Game Day
  </button>
)}
```

Do not keep “Result” / “Confirm” labels. Those were the old two-score form.

## 3. `src/pages/TournamentDetail.jsx`

### Remove

- `import TournamentResultDialog from "../components/TournamentResultDialog";`
- State: `resultDialogOpen`, `activeMatch`, `resultForm`, `playerStats`, `uploadingProof`, `uploadingVideo`, `myClubPlayers`
- The `Player.filter({ club_id })` loads that only existed to feed the result dialog
- Functions: `submitResult`, `validatePlayerGoals`, `buildSubmissionContext`, `handleAgreement`, `handleDispute`, `handleFirstSubmission`, `savePlayerStats`, `notifyClubs`, `resetUI`
- `refreshMatches` if nothing else calls it (forfeit / schedule already call `fetchTournamentMatches`)
- The `<TournamentResultDialog ... onSubmit={submitResult} />` block at the bottom of the page

Keep `parseSubmission` / `proofLinksForMatch` / `renderProofLinks` — admin dispute cards still show proofs.

### Add

```js
import { canOpenTournamentGameDay, tournamentGameDayWebPath } from "@/lib/tournamentGameDay";
```

```js
function openGameDay(match) {
  if (!match?.id) return;
  navigate(tournamentGameDayWebPath(match.id));
}
```

Pass it into the bracket (this is what used to be missing, and it must **not** reopen a score dialog):

```jsx
<KnockoutBracket
  matches={bracketMatches}
  myClubId={myClubId}
  onSubmit={openGameDay}
  onSchedule={(match) => { setScheduleMatch(match); setScheduleDate(toDatetimeLocalValue(match.scheduled_date)); setScheduleDialogOpen(true); }}
  onViewStats={(match) => { setStatsMatch(match); setStatsModalOpen(true); }}
/>
```

On **list fixture rows** (the non-tree branch around the status / action strip), after the schedule button, add a Game Day button for any playable match:

```jsx
{canOpenTournamentGameDay(match) && (
  <Button size="sm" type="button" onClick={() => openGameDay(match)}
    className="bg-primary/10 text-primary border border-primary/30 text-xs h-7">
    Game Day
  </Button>
)}
```

Put it in the existing action strip next to Schedule (the `isMyMatch && home && (unscheduled|scheduled|in_progress|awaiting_confirmation)` block). Also show Game Day when the match is playable even if the current user is away (away confirms on Game Day). Expand that strip:

- Show Schedule only for home + current schedule rules (unchanged).
- Show Game Day whenever `canOpenTournamentGameDay(match)`.

Replace the leftover copy `Awaiting opponent confirmation (24h timeout)` with a Game Day pointer, and make the row clickable:

```jsx
{match.status === "awaiting_confirmation" && (
  <button type="button" onClick={() => openGameDay(match)}
    className="mt-2 text-xs text-warning flex items-center gap-1">
    <AlertTriangle className="w-3 h-3" /> Awaiting confirmation on Game Day
  </button>
)}
```

Same for disputed non-admin viewers: add a Game Day button next to the disputed label (admin can keep “Resolve” for forfeit/admin; clubs go to Game Day).

```jsx
{match.status === "disputed" && (
  <div className="mt-2 flex items-center gap-2">
    <span className="text-xs text-destructive font-bold">⚠️ Score disputed</span>
    <Button size="sm" type="button" onClick={() => openGameDay(match)}
      className="bg-primary/10 text-primary text-xs border border-primary/30 h-6 px-2">Game Day</Button>
    {isAdmin && (
      <Button size="sm" type="button" onClick={() => { setActiveDispute(match); setDisputeDialogOpen(true); }}
        className="bg-destructive/10 text-destructive text-xs border border-destructive/30 h-6 px-2">{t("commonPages.tdResolve")}</Button>
    )}
  </div>
)}
```

## 4. Delete `src/components/TournamentResultDialog.jsx`

Nothing else imports it. If a grep still finds `TournamentResultDialog` after the page edit, you missed a usage.

## 5. Test — `src/lib/__tests__/tournamentGameDayResult.test.mjs`

```js
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { canOpenTournamentGameDay, tournamentGameDayWebPath } from "../tournamentGameDay.js";

const root = resolve(import.meta.dirname, "../../..");
const read = (path) => readFileSync(resolve(root, path), "utf8");

test("cup fixtures open Game Day after they are scheduled", () => {
  assert.equal(canOpenTournamentGameDay({ id: "m1", status: "scheduled" }), true);
  assert.equal(canOpenTournamentGameDay({ id: "m1", status: "in_progress" }), true);
  assert.equal(canOpenTournamentGameDay({ id: "m1", status: "awaiting_confirmation" }), true);
  assert.equal(canOpenTournamentGameDay({ id: "m1", status: "disputed" }), true);
  assert.equal(canOpenTournamentGameDay({ id: "m1", status: "unscheduled" }), false);
  assert.equal(canOpenTournamentGameDay({ id: "m1", status: "completed" }), false);
  assert.equal(tournamentGameDayWebPath("cup-9"), "/game-day?match=cup-9");
});

test("tournament page does not ship a second result engine", () => {
  const page = read("src/pages/TournamentDetail.jsx");
  const bracket = read("src/components/KnockoutBracket.jsx");
  const gameDay = read("src/pages/GameDay.jsx");

  assert.doesNotMatch(page, /TournamentResultDialog/);
  assert.doesNotMatch(page, /async function submitResult/);
  assert.doesNotMatch(page, /handleAgreement/);
  assert.doesNotMatch(page, /handleFirstSubmission/);
  assert.doesNotMatch(page, /savePlayerStats/);
  assert.doesNotMatch(page, /MatchPlayerStat\.create/);
  assert.match(page, /openGameDay/);
  assert.match(page, /tournamentGameDayWebPath/);
  assert.match(page, /onSubmit=\{openGameDay\}/);
  assert.match(page, /Game Day/);

  assert.match(bracket, /canOpenTournamentGameDay/);
  assert.match(bracket, />Game Day</);
  assert.doesNotMatch(bracket, />Result</);
  assert.doesNotMatch(bracket, />Confirm</);

  assert.match(gameDay, /searchParams\.get\("match"\)/);
});
```

Run:

```bash
node --test src/lib/__tests__/tournamentGameDayResult.test.mjs src/lib/__tests__/tournamentRegistrationReview.test.mjs src/lib/__tests__/tournamentClubRegistration.test.mjs src/lib/__tests__/pressRoomRemoval.test.mjs
```

Existing registration / press-room greps must still pass. They only assert registration copy, not the result dialog.

## Done when

- Tournament page has no “Submit Match Result” dialog.
- Knockout “Game Day” and list-row “Game Day” go to `/game-day?match=…`.
- Scoring still happens only in `GameDayMatchResult` / `matchKickoff`.
- `src/components/TournamentResultDialog.jsx` is gone.
