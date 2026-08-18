export function isSelfFollow({ targetType, targetId, userId, playerId } = {}) {
  if (String(targetType || '') !== 'player') return false;
  const id = String(targetId || '');
  if (!id) return false;
  return id === String(userId || '') || id === String(playerId || '');
}

export function pickExistingFollow(rows) {
  if (!Array.isArray(rows) || !rows.length) return null;
  return rows[0] || null;
}

export async function findMyFollow(client, {
  followerId,
  followerEmail,
  followerPlayerId,
  targetType,
  targetId,
} = {}) {
  if (!client?.entities?.Follow || !targetType || !targetId) return null;
  const filters = { target_type: targetType, target_id: targetId };
  if (followerId) filters.follower_id = followerId;
  else if (followerEmail) filters.follower_email = followerEmail;
  else if (followerPlayerId) filters.follower_player_id = followerPlayerId;
  else return null;
  const rows = await client.entities.Follow.filter(filters, null, 5).catch(() => []);
  return pickExistingFollow(rows);
}

export async function toggleFollow(client, {
  existing,
  followerId,
  followerEmail,
  followerPlayerId,
  targetType,
  targetId,
  targetName,
} = {}) {
  if (!client?.entities?.Follow) return null;
  if (existing?.id) {
    await client.entities.Follow.delete(existing.id);
    return null;
  }
  return client.entities.Follow.create({
    follower_id: followerId,
    follower_email: followerEmail || null,
    follower_player_id: followerPlayerId || null,
    target_id: targetId,
    target_type: targetType,
    target_name: targetName || null,
  });
}
