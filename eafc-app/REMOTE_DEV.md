# Connect eafc-app → Stage League (Gandi production)

Production host: **https://stageleagues.com**  
(same `stage/server` codebase deployed on Gandi)

| Env | Value |
|---|---|
| `EXPO_PUBLIC_STAGE_API_URL` | `https://stageleagues.com/api/stage` |
| `EXPO_PUBLIC_API_URL` | `https://stageleagues.com/api/mobile` |
| `EXPO_PUBLIC_SOCKET_URL` | `https://stage-7osn.onrender.com` |

Login uses `stageClient` → `/api/stage/auth/login` (live on Gandi).

Note: `/api/mobile/*` is **not** on production yet (404). Deploy the mobile compat routes from local `stage/server` if you need those flat paths.

```bash
cd /Users/creaafde/Documents/eafc/eafc-app
npm start -c
```
