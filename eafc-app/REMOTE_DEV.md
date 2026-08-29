# Connect eafc-app → Stage League (Gandi production)

Two clients, one API:

| Client | Repo | Host |
|---|---|---|
| StageWebapp (desktop SPA + Express + MySQL) | https://github.com/Lengarose/stage | https://stageleagues.com |
| eafc-app (this repo) | https://github.com/BertonLutina/Stage | Expo / EAS |

Production host: **https://stageleagues.com**  
Backend in `Lengarose/stage` (`server/`) is what Gandi runs. Web frontend is `Lengarose/stage` `src/`.

| Env | Value |
|---|---|
| `EXPO_PUBLIC_STAGE_API_URL` | `https://stageleagues.com/api/stage` |
| `EXPO_PUBLIC_API_URL` | `https://stageleagues.com/api/mobile` |
| `EXPO_PUBLIC_SOCKET_URL` | `https://stage-7osn.onrender.com` |

Login uses `stageClient` → `/api/stage/auth/login`.

`/api/mobile/*` **is live** on production (compat layer mounted in `server/src/server.js` via `registerMobileCompatRoutes`). Probe: `GET /api/mobile/health` → `{ "service": "stage-mobile-compat" }`. StageWebapp itself talks only to `/api/stage`.

Realtime sockets default to the Render host in both clients (`src/lib/resolveSocketUrl.js` on web, `utils/api.js` on mobile). HTTP and sockets are not the same origin.

```bash
cd /Users/creaafde/Documents/eafc/eafc-app
npm start -c
```
