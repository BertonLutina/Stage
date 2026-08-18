import { readFileSync } from 'fs';
import { join } from 'path';
import {
  findMyFollow,
  isSelfFollow,
  pickExistingFollow,
  toggleFollow,
} from '../../lib/followTarget';

const profileSource = readFileSync(
  join(__dirname, '../../app/(tabs)/profile/profilescreen.jsx'),
  'utf8',
);
const clubSource = readFileSync(
  join(__dirname, '../../app/teams/teamprofilescreen.jsx'),
  'utf8',
);

describe('followTarget', () => {
  it('does not treat a club follow as following yourself', () => {
    expect(isSelfFollow({
      targetType: 'club',
      targetId: 'player-1',
      userId: 'player-1',
      playerId: 'player-1',
    })).toBe(false);
  });

  it('blocks following your own player id or user id', () => {
    expect(isSelfFollow({ targetType: 'player', targetId: 'p1', playerId: 'p1' })).toBe(true);
    expect(isSelfFollow({ targetType: 'player', targetId: 'u1', userId: 'u1' })).toBe(true);
    expect(isSelfFollow({ targetType: 'player', targetId: 'p2', playerId: 'p1', userId: 'u1' })).toBe(false);
  });

  it('picks the first follow row', () => {
    expect(pickExistingFollow([])).toBeNull();
    expect(pickExistingFollow([{ id: 'f1' }, { id: 'f2' }])).toEqual({ id: 'f1' });
  });

  it('finds the current follow for a target', async () => {
    const filter = jest.fn(async () => [{ id: 'f1', target_id: 'p2', target_type: 'player' }]);
    const row = await findMyFollow(
      { entities: { Follow: { filter } } },
      { followerId: 'u1', targetType: 'player', targetId: 'p2' },
    );
    expect(filter).toHaveBeenCalledWith(
      { follower_id: 'u1', target_type: 'player', target_id: 'p2' },
      null,
      5,
    );
    expect(row.id).toBe('f1');
  });

  it('toggles follow then unfollow', async () => {
    const create = jest.fn(async (body) => ({ id: 'f1', ...body }));
    const del = jest.fn(async () => ({ success: true }));
    const client = { entities: { Follow: { create, delete: del } } };

    const created = await toggleFollow(client, {
      followerId: 'u1',
      followerEmail: 'me@test.com',
      followerPlayerId: 'p1',
      targetType: 'club',
      targetId: 'c1',
      targetName: 'Ajax',
    });
    expect(created.id).toBe('f1');
    expect(create).toHaveBeenCalledWith({
      follower_id: 'u1',
      follower_email: 'me@test.com',
      follower_player_id: 'p1',
      target_id: 'c1',
      target_type: 'club',
      target_name: 'Ajax',
    });

    const after = await toggleFollow(client, {
      existing: created,
      targetType: 'club',
      targetId: 'c1',
    });
    expect(after).toBeNull();
    expect(del).toHaveBeenCalledWith('f1');
  });

  it('wires FollowToggleButton onto player and club profiles', () => {
    expect(profileSource).toMatch(/FollowToggleButton/);
    expect(profileSource).toMatch(/targetType="player"/);
    expect(profileSource).not.toMatch(/onPress=\{\(\) => \{\}\}/);
    expect(clubSource).toMatch(/FollowToggleButton/);
    expect(clubSource).toMatch(/targetType="club"/);
    expect(clubSource).toMatch(/hidden=\{isOwner\}/);
  });

  it('uploads player avatar and banner instead of saving local file URIs', () => {
    expect(profileSource).toMatch(/uploadLocalMedia/);
    expect(profileSource).toMatch(/pickAndUploadBanner/);
    expect(profileSource).not.toMatch(/avatar_url: result\.assets\[0\]\.uri/);
  });
});
