# Connect from Another Country / Remote Development

## How it works

```
Phone → ngrok URL → your local backend (localhost:3000)
```

The app on the phone uses `EXPO_PUBLIC_API_URL` (the ngrok URL). ngrok forwards requests to your backend on `localhost:3000`.

---

To let someone (or yourself) in another country connect to your dev server:

## 1. Expose your **Backend API** with ngrok

```bash
# Install ngrok if needed: https://ngrok.com/download
# Sign up for free at ngrok.com to get an auth token

ngrok http --host-header=rewrite 3000
```

ngrok will show a URL like `https://abc123.ngrok-free.app`. **Keep this terminal open.**

## 2. Set the API URL in the app

Create or edit `eafc-app/.env`:

```
EXPO_PUBLIC_API_URL=https://YOUR-NGROK-URL.ngrok-free.app
```

Replace `YOUR-NGROK-URL` with the URL ngrok gave you.

## 3. Start everything (order matters)

**Terminal 1 – Backend:**
```bash
cd eafc-backend
npm run dev
```

**Terminal 2 – ngrok (points to backend):**
```bash
ngrok http --host-header=rewrite 3000
```
Copy the https URL (e.g. `https://abc123.ngrok-free.app`) and update `eafc-app/.env`.

**Terminal 3 – Expo with tunnel (critical for remote devices):**
```bash
cd eafc-app
npx expo start -c --tunnel
```
Use `-c` to clear cache (picks up new .env). Use `--tunnel` so remote users can load the app.

## 4. Connect from another country

- Scan the QR code shown by Expo, or
- Open the tunnel URL in Expo Go on your phone

The app will call your API through the ngrok URL, so it works from anywhere.

## 5. Test connection (e.g. someone 30km away)

1. Share the Expo QR code / tunnel URL with the remote person
2. They open the app in Expo Go
3. Go to **Profile → Connection Test**
4. Tap **Test Connection**
5. Success = latency shown (e.g. 150ms). Failed = error message

---

## Troubleshooting: "The endpoint ... is offline" (ngrok)

This means **ngrok cannot reach your backend**. Fix in this order:

1. **Start the backend first**
   ```bash
   cd eafc-backend
   npm run dev
   ```
   You must see `[Server] Stage Backend running on http://localhost:3000` and `[DB] MySQL connected successfully`. If it crashes (e.g. DB error), fix that first.

2. **Then start ngrok** (same port as backend)
   ```bash
   ngrok http --host-header=rewrite 3000
   ```
   Leave this terminal open. Copy the new `https://xxx.ngrok-free.app` URL.

3. **Check on your Mac:** Open `https://YOUR-NGROK-URL.ngrok-free.app/health` in a browser. You should see `{"status":"ok"}`. If you see "offline" here too, the backend or ngrok is wrong.

4. **Free ngrok URLs expire** — if you closed ngrok and restarted it, you have a new URL. Update `eafc-app/.env` and restart Expo with `-c`.

---

## Troubleshooting: "Connection failed" from remote device (app works but API fails)

| Check | Fix |
|-------|-----|
| .env has ngrok URL? | `EXPO_PUBLIC_API_URL=https://xxx.ngrok-free.app` |
| Restarted Expo with -c? | `npx expo start -c --tunnel` — otherwise old local IP is cached |
| Using --tunnel for Expo? | Remote user needs tunnel URL to load the app |
| ngrok URL matches .env? | Free ngrok URLs change on restart — copy the new one |

**Verify:** Open `https://YOUR-NGROK-URL.ngrok-free.app/health` in a browser. You should see `{"status":"ok"}`.

---

**Notes:**
- ngrok free URLs change each time you restart ngrok — update `.env` when that happens
- Keep all 3 processes running (backend, ngrok, Expo)
- OAuth (Google, Apple) may need the ngrok URL added in each provider’s console
