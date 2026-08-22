export function playerFeedAuthorEmail(player, user) {
  return String(player?.email || user?.email || '').trim() || null;
}

export function buildPlayerFeedPostPayload({ player, user, content, mediaUrl }) {
  const authorEmail = playerFeedAuthorEmail(player, user);
  if (!authorEmail) {
    throw new Error('Sign in again to post.');
  }
  return {
    author_email: authorEmail,
    author_name: player?.gamertag || player?.display_name || user?.full_name || user?.gamertag || authorEmail,
    author_avatar: player?.avatar_url || undefined,
    content,
    player_id: player?.id,
    media_url: mediaUrl || undefined,
    media_type: mediaUrl ? 'image' : undefined,
  };
}
