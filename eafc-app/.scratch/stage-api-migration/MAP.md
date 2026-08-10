## Destination

All eafc-app screens that perform HTTP CRUD talk to Stage League — feature screens via `/api/mobile` (compat), auth/onboarding via `/api/stage` — with a clear path to native `stageClient` migration.

## Notes

- Skills: `/research` inventory done → walkthrough at `docs/STAGE_API_WALKTHROUGH.md`
- Prefer deepening the `api` ↔ Stage seam before rewriting every screen
- Same JWT across both bases

## Decisions so far

- [Point feature client at /api/mobile](./issues/001-point-api-at-mobile.md) — `utils/api.js` defaults/rewrites to mobile compat; refresh stays on `/api/stage`
- [Document page→API walkthrough](./issues/002-walkthrough-doc.md) — `docs/STAGE_API_WALKTHROUGH.md`

## Not yet specified

- Per-screen native migration order (dashboard vs social vs teams)
- Whether formation / dressing-room need richer Stage entities
- Socket chat parity with Stage chat-reads

## Out of scope

- Redesigning web onboarding (already ported)
- Replacing Stage production deploy pipeline
