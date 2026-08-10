/**
 * Connection map: eafc-app ↔ Stage League
 *
 * Two HTTP surfaces (same JWT):
 *   stageClient  → EXPO_PUBLIC_STAGE_API_URL → /api/stage   (auth, onboarding, entities)
 *   api (axios)  → EXPO_PUBLIC_API_URL       → /api/mobile  (feature screens)
 *
 * /api/mobile is the Stage-backed compat layer that keeps eafc path shapes
 * (/teams, /social/feed, /matches/fixtures) while reading/writing Stage tables.
 */

export const STAGE_ENTITY_MAP = {
  users: 'auth.me / players  ←  /api/mobile/users',
  teams: 'Club               ←  /api/mobile/teams',
  tournaments: 'Tournament   ←  /api/mobile/tournaments',
  matches: 'Match            ←  /api/mobile/matches',
  social_feed: 'Post         ←  /api/mobile/social/feed',
  social_messages: 'DirectMessage ← /api/mobile/social/messages',
  comments: 'Comment         ←  /api/mobile/social/comments',
  join_requests: 'JoinRequest ← /api/mobile/teams/:id/join-request*',
  dressing_room: 'DressingRoom ← /api/mobile/teams/:id/dressing-room',
  chat: 'ChatMessage         ←  /api/mobile/teams|matches/:id/chat',
  upload: 'POST /upload      ←  /api/mobile/uploads',
};

/** Native Stage resources to migrate screens onto (phase 2 — drop /api/mobile). */
export const NATIVE_STAGE_MIGRATION = {
  '/teams': '/clubs',
  '/teams/:id': '/clubs/:id',
  '/users/me': '/auth/me (+ PATCH /players/:id)',
  '/social/feed': '/posts',
  '/social/messages': '/direct-messages',
  '/matches/fixtures': '/matches',
  '/tournaments/list': '/tournaments',
};
