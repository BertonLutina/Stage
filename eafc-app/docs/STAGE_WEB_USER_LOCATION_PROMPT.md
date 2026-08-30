# STAGE WEB + API — user location / timezone on login

Paste this into Cursor on **https://github.com/Lengarose/stage**. Code only. Owner deploys Gandi. Do not FTP, probe prod, or mix deploy into this task.

Mobile (`BertonLutina/Stage` / `eafc-app`) already captures GPS after login/register/OAuth/session restore and PATCHes `/auth/timezone` with `{ timezone, location }`. Web + API must persist that so match clocks use the country the user is in (Belgium → `Europe/Brussels`).

## Behaviour

1. Add `users.location` (`TEXT NULL`) next to existing `users.timezone`.
2. On sign-in / session restore, the browser asks for geolocation (do not block login if denied).
3. Save GPS JSON on `users.location`. Save IANA zone on `users.timezone`.
4. Belgium GPS / `BE` → `Europe/Brussels`. Device `Intl` timezone is the fallback (and the source on web, which has no reverse-geocode).
5. `GET /auth/me` returns parsed `location`. `PATCH /auth/timezone` accepts optional `location`.
6. Permissions-Policy must allow geolocation on this origin (`geolocation=(self)`). `geolocation=()` blocks the prompt.

Do not convert kickoff DATETIME twice. Location is proof of where they connected; `users.timezone` is what clocks read.

## Server

### `server/src/server/migrations/startupMigrations.js`

After the existing timezone column:

```js
await addCol('users', 'timezone', "VARCHAR(80) NULL DEFAULT 'Europe/Brussels'");
await addCol('users', 'location', 'TEXT NULL');
```

### New `server/src/server/utils/userLocation.js`

Copy from the mobile PR companion (same normalize rules): GPS lat/lng required, optional `country` (ISO-2), `accuracy`, `source`, `captured_at`. Export `normalizeUserLocation` and `parseStoredLocation` (JSON string from MySQL TEXT).

### `authController.js`

- `require('../utils/userLocation')`
- `SELECT u.location` on `/me`
- `/me` JSON: `location: parseStoredLocation(me.location)`
- `PATCH /timezone`: if `normalizeUserLocation(req.body.location)` is set, `UPDATE users SET timezone = ?, location = ?, updated_date = NOW()`. Else timezone-only (settings/onboarding must not wipe GPS).

### `server/src/server/mobile/helpers.js`

`SELECT u.location` in `buildMePayload`. `mapUserFromMe` includes `location: parseStoredLocation(me.location)`.

### `server/src/server/middleware/securityHeaders.js`

```js
'geolocation=(self)',
```

Add `server/src/server/utils/__tests__/userLocation.test.js` (`node:test`) for Belgium GPS + JSON parse.

## Web

### `src/api/stageClient.js`

```js
async updateTimezone(timezone, location = null) {
  if (!localStorage.getItem(ACCESS_KEY)) throw { status: 401, message: 'Not authenticated' };
  const body = { timezone };
  if (location) body.location = location;
  return apiFetch('/auth/timezone', { method: 'PATCH', body: JSON.stringify(body) });
},
```

### New `src/lib/userLocation.js`

Browser `navigator.geolocation.getCurrentPosition` (8s timeout, coarse). `Intl.DateTimeFormat().resolvedOptions().timeZone` for IANA. Map `BE` → `Europe/Brussels` if a country code is ever present. `syncSessionLocation(stageClient.auth)` PATCHes timezone + location. 15-minute cooldown so `checkUserAuth` spam does not re-prompt.

### `src/lib/AuthContext.jsx`

After a successful `me()`, fire-and-forget `syncSessionLocation(stageClient.auth)` then refresh `me()` into `user`. Login, OAuth, and session restore already call `checkUserAuth`.

Onboarding/Settings keep calling `updateTimezone(timezone)` without location — that must not null out `users.location`.

## Out of scope

Admin forceSchedule, TestFlight, FTP, rewriting the result engine.
