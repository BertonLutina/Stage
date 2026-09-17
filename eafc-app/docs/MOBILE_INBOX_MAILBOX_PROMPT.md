# MOBILE (eafc-app) — Inbox mailbox

Code only. Owner deploys. Do not ship TestFlight / store unless asked.

**Repo:** `/Users/creaafde/Documents/eafc/eafc-app` (Expo / React Native).

**Do not edit** Stage web or `stage/server`. The backend mailbox API is owned by Stage. This prompt assumes Stage has landed (or is landing) `event_id` on `sendInboxMessage` and `respondInboxMessage` for Accept / Decline.

**Spec (read-only, Stage repo):** `workbench stage/stage/docs/superpowers/specs/2026-09-13-player-inbox-mailbox-design.md`

Mirror Stage so user A (web) and user B (mobile) share one mailbox.

---

## Product rule (non-negotiable)

The inbox is a **notification-style mailbox**:

1. Each event is a **new mail**. It appears **at the top** of the list.
2. The player **reads** the mail.
3. If it needs a response, **Accept / Decline / Propose time / Open Game Day** run on that mail.
4. Those buttons exist **only in inbox**, never on Alerts / OneSignal toasts.
5. A second Arrange Game vs the same opponent is a **second mail**, not a rewrite of the first.
6. Old pending mails stay visible and stay tappable. If the server says the action is stale, show the error. Do not silently mark accepted.

This is not Gmail. No sent folder, no labels, no threads.

---

## Backend contract (do not reimplement)

`sendInboxMessage` uniqueness is:

```
{message_type}:{event_id}:{recipient_email}
```

- Same `event_id` → retry, one row.
- New `event_id` → INSERT, new row, `created_date = NOW()`, list prepends.

`related_entity_id` is metadata (opponent, fixture, contract). **Never** use it as the mail identity.

`respondInboxMessage({ message_id, action, new_date, new_time })` is the only Accept / Decline seam. Do not `InboxMessage.update({ status })` alone for actionable types.

Notification `link` is `/inbox?id={messageId}` → mobile `/apps/inbox/[id]`.

---

## P0 — do these first

### 1 — Per-click `event_id` on every send

**Files:**

- Create: `src/lib/inboxEventId.js`
- Modify: `src/lib/arrangeGame.js` (`sendInboxMessage` ~175)
- Modify: `src/lib/scheduleEngine.js` (`proposeTime` ~58, accept-notify ~110)
- Test: `src/__tests__/lib/arrangeGame.test.js`
- Test: add `src/__tests__/lib/scheduleEngine.inbox.test.js` if none exists

Today Arrange Game sends `related_entity_id: opponent.id`. Stage used to turn that into the idempotency key, so a second invite to the same club **rewrote** the mail. Mobile must send a new `event_id` every tap.

Required helper:

```js
export function createInboxEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
```

In `sendArrangeGameInvite`, generate **once** per call (not inside a retry loop with a new id):

```js
import { createInboxEventId } from '@/lib/inboxEventId';

const event_id = createInboxEventId();
await stageClient.functions.invoke('sendInboxMessage', {
  // existing fields stay
  event_id,
  related_entity_id: opponent.id,
  related_entity_type: recipientIsClub ? 'club' : 'player',
});
```

Same for `proposeTime` and the “match confirmed” notify in `acceptProposal`: new `event_id` per send.

Tests (extend arrangeGame.test.js):

```js
expect(stageClient.functions.invoke).toHaveBeenCalledWith(
  'sendInboxMessage',
  expect.objectContaining({
    message_type: 'match_invite',
    event_id: expect.any(String),
    related_entity_id: 'p2',
  }),
);

const firstId = stageClient.functions.invoke.mock.calls.find((c) => c[0] === 'sendInboxMessage')[1].event_id;
await sendArrangeGameInvite({ /* same opponent, second call */ });
const secondId = stageClient.functions.invoke.mock.calls
  .filter((c) => c[0] === 'sendInboxMessage')
  .at(-1)[1].event_id;
expect(secondId).not.toBe(firstId);
```

### 2 — All Accept / Decline go through `respondInboxMessage`

**Files:**

- Modify: `src/lib/inboxData.js` (`respondToInboxMessage`)
- Modify: `src/components/inbox/InboxMessageDetail.jsx`
- Test: `src/__tests__/lib/inboxData.test.js` (create)

Today `respondToInboxMessage`:

- `match_invite` → `respondInboxMessage` (keep)
- `league_schedule` accept → client `acceptProposal` (domain, OK for now) then local status update
- `league_schedule` decline → **only** `InboxMessage.update` — **broken**
- `contract_offer` → `contractManagement` with a `.catch` that still marks the mail accepted if the API fails — **broken**
- everything else → local status update — **broken** for `tournament_schedule`

Required `respondToInboxMessage`:

```js
export async function respondToInboxMessage(message, action, { newDate = null, newTime = null } = {}) {
  await stageClient.functions.invoke('respondInboxMessage', {
    message_id: message.id,
    action,
    new_date: newDate,
    new_time: newTime,
  });
  return action;
}
```

If Stage has not yet folded `league_schedule` into `respondInboxMessage`, keep **one** exception:

- `league_schedule` + `accepted`/`confirmed` → existing `acceptProposal` (must pass `scheduling_status: 'confirmed'` into `createMatchFromFixture`)
- `league_schedule` + `declined` → must call a real `declineProposal` (add it, mirroring web `scheduleEngine.declineProposal`). **Never** decline by status patch alone.

Remove the contract `.catch` that marks the mail accepted after a failed `contractManagement`. Throw to the UI instead.

`InboxMessageDetail` already calls `respondToInboxMessage`. After the helper change, tournament Accept/Decline will hit the server. Keep showing Accept/Decline for `tournament_schedule` (`action_type` `accept_decline`).

Tests:

```js
test('tournament_schedule accepted calls respondInboxMessage', async () => {
  await respondToInboxMessage(
    { id: 'm1', message_type: 'tournament_schedule' },
    'accepted',
  );
  expect(stageClient.functions.invoke).toHaveBeenCalledWith(
    'respondInboxMessage',
    expect.objectContaining({ message_id: 'm1', action: 'accepted' }),
  );
});

test('failed contract action does not mark the mail accepted', async () => {
  stageClient.functions.invoke.mockRejectedValue(new Error('window closed'));
  await expect(
    respondToInboxMessage({ id: 'm2', message_type: 'contract_offer' }, 'accepted'),
  ).rejects.toThrow(/window closed/);
  expect(stageClient.entities.InboxMessage.update).not.toHaveBeenCalled();
});
```

### 3 — Open Game Day on result mails

**Files:**

- Modify: `src/lib/inboxHelpers.js` (`getEffectiveInboxActionType`, `resolveNotificationHref`)
- Modify: `src/components/inbox/InboxMessageDetail.jsx`
- Test: `src/__tests__/lib/inboxHelpers.test.js`

Result mails have `message_type: 'match_result' | 'match_dispute'` and `action_type: 'open_match'`. Metadata has `link: '/game-day?match={id}'`.

Today the detail shows “A response is required” with **no** Open Game Day button (`open_match` is not accept/decline).

Required:

- Treat `open_match` as needs-action while pending.
- Action bar: one button **Open Game Day** (not Accept/Decline).
- Navigate to `/(tabs)/matches/matchdetailscreen` with `matchId` from `metadata.match_id` or `related_entity_id` or query `match` on `metadata.link`.

`resolveNotificationHref('/game-day?match=abc')` must become:

```js
{ pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId: 'abc' } }
```

not a bare `/(tabs)/matches`.

`pathFromNotificationData` in `src/lib/oneSignal.js` already extracts `matchId` for game-day links. Keep that. Inbox push with `/inbox?id=` already opens detail — keep.

Tests in `inboxHelpers.test.js`:

```js
expect(getEffectiveInboxActionType({
  message_type: 'match_result',
  action_type: 'open_match',
})).toBe('open_match');
expect(inboxMessageNeedsAction({
  message_type: 'match_result',
  action_type: 'open_match',
  status: 'pending',
})).toBe(true);

expect(resolveNotificationHref('/game-day?match=match-9')).toEqual({
  pathname: '/(tabs)/matches/matchdetailscreen',
  params: { matchId: 'match-9' },
});
```

### 4 — List: new id on top, update in place only for same id

**Files:**

- `src/lib/inboxHelpers.js` (`upsertInboxMessage`, `groupInboxMessages`)
- `src/app/apps/inbox/index.jsx` (sort `-created_date`, socket upsert)
- `src/lib/inboxData.js` (`loadInboxMessages`)

Already:

- Load `filter(..., '-created_date', 200)`
- `upsertInboxMessage` prepends unknown ids, replaces known ids

Keep that. Do **not** sort by `updated_date`. Do **not** move an updated row to the top (retries are same id; new events are new ids and prepend).

Filter empty subject **and** empty body like web (`hasInboxContent`) so zombie stubs do not sit above real mail.

Add a test:

```js
test('upsert prepends a new id and does not reorder on update', () => {
  const newer = { id: 'new', created_date: '2026-09-13' };
  const older = { id: 'old', created_date: '2026-01-01', subject: 'A' };
  expect(upsertInboxMessage([older], { type: 'create', id: 'new', data: newer })[0].id).toBe('new');
  const updated = { ...older, subject: 'A2' };
  const next = upsertInboxMessage([newer, older], { type: 'update', id: 'old', data: updated });
  expect(next.map((m) => m.id)).toEqual(['new', 'old']);
  expect(next[1].subject).toBe('A2');
});
```

### 5 — Alerts are not the mailbox

**Files:**

- `src/components/dashboard/CommandCenterUI.jsx` — Alerts glance may keep `href: '/apps/inbox'` (list). Do **not** add Accept/Decline on the dashboard.
- `src/hooks/useNotificationsSocket.js` — toast on new InboxMessage is OK; toast must not include Accept/Decline.
- Notification screens: row click → `resolveNotificationHref(notif.link)` → inbox detail. No action buttons.

OneSignal: inbox links with `related_id` already open `/apps/inbox/[id]`. Keep. Do not invent Accept from the push payload.

---

## P1 — after P0 is green

- `getEffectiveInboxActionType`: add `tournament_schedule` → `accept_decline` if `action_type` missing.
- TYPE_LABELS: add `match_result`, `match_dispute`, `tournament_schedule`.
- Dashboard / Command Center Inbox tile can stay `/apps/inbox` (list). Opening a **specific** mail from a toast/push must use `[id]`.
- If you add a Home-style preview of last mails, each row opens `/apps/inbox/[id]`, not the list.

---

## Out of scope

- Stage server / Stage web files
- Admin IMAP mailbox
- Gmail folders / sent / archive
- Auto-closing old pending mails
- Kickoff / lineup as inbox mails (stay on notification toasts)
- Contract **counter** UI (Accept / Decline is enough on mobile)
- TestFlight / store submit

---

## Done when

Run: `npm test -- --watchAll=false`

Must pass, and these behaviours must be true:

1. Two `sendArrangeGameInvite` to the same opponent send two different `event_id`s.
2. `tournament_schedule` Accept calls `respondInboxMessage`, not `InboxMessage.update`.
3. Failed contract accept does not patch inbox status.
4. `match_result` + `open_match` shows Open Game Day and routes to match detail.
5. `/inbox?id=` and `/game-day?match=` resolve to the right Expo routes.
6. Socket create prepends; socket update does not jump an old id above newer mails.

If Stage `respondInboxMessage` rejects `league_schedule` until the web plan lands, keep the P0 exception in section 2 and note it in the PR. Do not fake success with a local status write.
