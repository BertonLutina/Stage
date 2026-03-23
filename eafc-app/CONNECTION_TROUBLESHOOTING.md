# Can't Connect to Backend – Quick Fix

## 1. Is the backend running?

```bash
cd eafc-backend
npm run dev
```

You should see: `[Server] Stage Backend running on http://localhost:3000`

Test in browser: open `http://localhost:3000/health` → should show `{"status":"ok"}`

---

## 2. Use the right URL for your setup

**localhost only works in iOS Simulator.** Physical device and Android emulator need different URLs.

| You're using           | Set in `eafc-app/.env`          |
|------------------------|----------------------------------|
| **iOS Simulator**      | `EXPO_PUBLIC_API_URL=http://localhost:3000` |
| **Android Emulator**   | `EXPO_PUBLIC_API_URL=http://10.0.2.2:3000` |
| **Physical device** (same WiFi) | `EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:3000` |

### Finding your Mac IP (for physical device)

When you start the backend, it prints:
```
[Server] On same WiFi, use: http://192.168.1.XX:3000
```

Copy that URL into `.env` as `EXPO_PUBLIC_API_URL=...`

Or find it manually: **System Settings → Network → Wi‑Fi → Details** (or run `ifconfig | grep "inet "` in terminal).

---

## 3. Restart the app after changing .env

After editing `.env`, restart Expo:

```bash
cd eafc-app
npx expo start -c
```

The `-c` clears cache so the new env is picked up.

---

## 4. Same WiFi required

Your Mac and phone must be on the **same Wi‑Fi network** when using the Mac IP.

---

## 5. Remote / different country

Use ngrok – see `REMOTE_DEV.md`.
