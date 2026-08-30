# MOBILE (eafc-app) — Game Day sync P0 / GOST parity

Code only. Owner deploys. Do not ship TestFlight / store unless asked.
Repo: `eafc-app` (Expo / React Native). Mirror Stage web (`Lengarose/stage`) contract.

Web already shipped (or is shipping) these gates. Mobile must stay in sync so user A (web) and user B (mobile) share one Game Day story.

---

## Product rule (non-negotiable)

Everything ends on **Game Day** (matches tab / match detail):

- GOST (Supreme / Elite / Challenger) fixtures  
- Regional league fixtures  
- Tournament / cup Matches  
- Arrange / ranked invites  

Flow: **open → propose/accept → `scheduling_status: "confirmed"` → Match → Game Day kickoff/results**.  
Do **not** treat fixture `status: "scheduled"` alone as ready. Web `fixtureBase` sets `status: "scheduled"` while still `scheduling_status: "open"`.

Server `createMatchFromLeagueFixture` now **throws** unless `scheduling_status === "confirmed"`. Align the client before that lands in production.

---

## P0 — do these first

### 1 — Confirmed-only Match materialization

**Files:** `src/lib/gameDayIntegration.js`, callers in competitions / leagues / matches hub.

Today:

- `createMatchFromFixture` has **no** confirmed gate (creates Match for any fixture).  
- `materializeConfirmedFixtures` still allows `status === 'scheduled'` (`~118`).  
- `acceptProposal` updates DB to confirmed, then calls `createMatchFromFixture` **without** passing `scheduling_status: 'confirmed'` (`scheduleEngine.js` ~107).

Required:

```js
// createMatchFromFixture — early return if not confirmed
if (String(fixture.scheduling_status || '').toLowerCase() !== 'confirmed') return null;
```

```js
// acceptProposal — pass confirmed into createMatchFromFixture (mirror web)
await createMatchFromFixture({
  ...fixture,
  scheduling_status: 'confirmed',
  confirmed_date: confirmedDate,
  scheduled_date: confirmedDate,
  status: 'scheduled',
}, fixtureType);
```

```js
// materializeConfirmedFixtures — confirmed only
if (String(fixture.scheduling_status || '').toLowerCase() !== 'confirmed') continue;
```

Also set competition `scheduled_date` on accept for regional if web does (web sets for both). Prefer always setting `scheduled_date: confirmedDate`.

### 2 — Competition / league “open Game Day” CTA

**Files:**

- `src/app/apps/competitions/[slug].jsx` (`openFixture` ~50–62)  
- `src/app/apps/leagues/[slug].jsx` (same pattern)

Today competition opens Match if `confirmed || status === 'scheduled'`. That will open / attempt create for **open** GOST fixtures.

Required:

- Navigate to match detail only when `scheduling_status === 'confirmed'` or existing `match_id` on a confirmed fixture.  
- For `open` / `home_proposed` / `away_proposed`: keep schedule UI (propose/accept), **no** kickoff / Match create.  
- Deep link: `/(tabs)/matches/matchdetailscreen` with `matchId` — keep; do not invent a broken `/gameday` path.

### 3 — Surface pending GOST schedule on Matches / Game Day hub

Web Game Day now lists the club’s competition fixtures with `open` | `home_proposed` | `away_proposed` and embeds schedule controls; kickoff list stays confirmed-only.

Mobile should:

- Load those pending **competition** fixtures for the user’s club(s) (member + president if you already dual-load).  
- Show propose/accept (reuse scheduleEngine + existing competition UI patterns).  
- After accept → refresh → Match appears → open match detail.  
- Regional pending on hub is optional P1; League screen schedule is enough for P0 if competitions hub covers GOST.

### 4 — Dual identity (member club + president club)

Where Game Day / materialize / fixture lists use a single `club`, also include `presidentClub` (same as Stage web Game Day `identityClubs`).  
Otherwise president of club A playing for club B misses fixtures.

---

## P1 — after P0 (same prompt run if cheap)

- Tournament Matches: only show on Game Day when `scheduling_status === 'confirmed'` (or live/completed rules you already have). Admin date-only without confirm stays hidden — OK.  
- Inbox `league_schedule` accept path must call the same `acceptProposal` (already does via `inboxData.js`) — re-test after confirmed gate.  
- Notification / inbox deep links: prefer matches hub / match detail, not a dead `/schedule` or `/game-day` web path.  
- Poll or refetch pending fixtures on focus so user B sees user A’s propose/accept without killing the app (fixture entities have no socket).

---

## Out of scope

- Server/API changes (Stage owns `createMatchFromLeagueFixture` confirmed gate).  
- Admin `forceSchedule` (web-only).  
- Rewriting result negotiation (already shipping / PR’d).  
- Deploy / store release.

---

## Verify

Run the repo’s usual checks (lint / tests for schedule + gameDayIntegration + competitions slug).  
Update your status handshake doc if you have one. Commit; do not push unless asked.

---

## Parity checklist (web ↔ mobile)

| Behaviour | Web (stage) | Mobile (eafc-app) |
|-----------|-------------|-------------------|
| Generate fixtures stay `scheduling_status: open` | yes | n/a (admin web) |
| Accept → confirmed + Match | yes | **fix this prompt** |
| `status: scheduled` alone ≠ Match | yes | **fix** |
| Pending GOST on Game Day hub | yes | **add** |
| Kickoff only confirmed | yes | **fix** |
| Competition CTA wrong route | fixed `/game-day` | use match detail route |
| Regional CTA confirmed-only | yes | **align league screen** |
