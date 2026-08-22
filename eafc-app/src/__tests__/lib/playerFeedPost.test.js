import { buildPlayerFeedPostPayload, playerFeedAuthorEmail } from '../../lib/playerFeedPost';

describe('player feed posts', () => {
  test('create payload includes author_email like web', () => {
    const payload = buildPlayerFeedPostPayload({
      player: { id: 'p1', gamertag: 'Lengarose', avatar_url: 'https://cdn/a.png', email: 'player@stage.test' },
      user: { email: 'player@stage.test', full_name: 'Len' },
      content: 'Ready for the new season',
      mediaUrl: 'https://cdn/post.jpg',
    });
    expect(payload).toMatchObject({
      author_email: 'player@stage.test',
      author_name: 'Lengarose',
      author_avatar: 'https://cdn/a.png',
      content: 'Ready for the new season',
      player_id: 'p1',
      media_url: 'https://cdn/post.jpg',
      media_type: 'image',
    });
  });

  test('falls back to the signed-in user email', () => {
    expect(playerFeedAuthorEmail({ id: 'p1' }, { email: 'me@stage.test' })).toBe('me@stage.test');
    expect(() => buildPlayerFeedPostPayload({ player: { id: 'p1' }, user: {}, content: 'hi' }))
      .toThrow(/Sign in again/);
  });
});
