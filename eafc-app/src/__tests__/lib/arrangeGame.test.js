import fs from 'fs';
import path from 'path';
import {
  ARRANGE_MIN_BET,
  ARRANGE_MAX_BET,
  combineDateTimeToMysql,
  formatDateYmd,
  formatKickoffLabel,
  formatTimeHm,
  isReachableEmail,
  pickRecipientEmail,
  validateArrangeWager,
  formatOpponentLabel,
  sendArrangeGameInvite,
} from '../../lib/arrangeGame';

function mockStageClient({
  clubContact,
  playerContact,
  clubPlayers = [],
  presidents = [],
} = {}) {
  return {
    functions: {
      invoke: jest.fn(async (name) => {
        if (name === 'resolveClubContact') return { data: clubContact || {} };
        if (name === 'resolvePlayerContact') return { data: playerContact || {} };
        if (name === 'sendInboxMessage') return { ok: true };
        throw new Error(`unexpected function ${name}`);
      }),
    },
    entities: {
      Player: {
        filter: jest.fn(async () => clubPlayers),
      },
      President: {
        filter: jest.fn(async () => presidents),
      },
    },
  };
}

describe('arrangeGame helpers', () => {
  test('combines date and HH:mm into MySQL datetime', () => {
    expect(combineDateTimeToMysql('2026-08-20', '21:00')).toBe('2026-08-20 21:00:00');
    expect(combineDateTimeToMysql('2026-08-20', '21:00:30')).toBe('2026-08-20 21:00:30');
    expect(combineDateTimeToMysql('', '21:00')).toBeNull();
  });

  test('formats picker values and kickoff with timezone', () => {
    const kickoff = new Date(2026, 7, 20, 21, 0, 0);
    expect(formatDateYmd(kickoff)).toBe('2026-08-20');
    expect(formatTimeHm(kickoff)).toBe('21:00');
    expect(formatKickoffLabel('2026-08-20', '21:00', 'Europe/Brussels')).toMatch(/21:00/);
    expect(formatKickoffLabel('2026-08-20', '21:00', 'Europe/Brussels')).toMatch(/Brussels/);
  });

  test('rejects placeholder emails and picks the first reachable one', () => {
    expect(isReachableEmail('ghost@stage.invalid')).toBeNull();
    expect(isReachableEmail('not-an-email')).toBeNull();
    expect(pickRecipientEmail('ghost@stage.invalid', 'captain@club.com')).toBe('captain@club.com');
  });

  test('validates optional wager against band and balance', () => {
    expect(validateArrangeWager('', 1_000_000)).toBe('');
    expect(validateArrangeWager(5_000, 1_000_000)).toMatch(/Minimum bet/);
    expect(validateArrangeWager(ARRANGE_MAX_BET + 1, 9_000_000)).toMatch(/Maximum bet/);
    expect(validateArrangeWager(50_000, 10_000)).toMatch(/only have/);
    expect(validateArrangeWager(ARRANGE_MIN_BET, 50_000)).toBe('');
  });

  test('formats opponent labels for player and club', () => {
    expect(formatOpponentLabel({ gamertag: 'Neo' }, 'player')).toBe('Neo');
    expect(formatOpponentLabel({ name: 'Ajax', tag: 'AFC' }, 'club')).toBe('Ajax [AFC]');
  });
});

describe('sendArrangeGameInvite', () => {
  test('sends a player vs player match_invite with fixture metadata', async () => {
    const stageClient = mockStageClient({
      playerContact: { recipient_email: 'opp@stage.com' },
    });

    const result = await sendArrangeGameInvite({
      stageClient,
      myPlayer: { id: 'p1', gamertag: 'Me', email: 'me@stage.com', avatar_url: 'me.png', stc: 100000 },
      myClub: null,
      matchType: 'player',
      opponent: { id: 'p2', gamertag: 'Rival', email: 'opp@stage.com' },
      recipientKind: 'player',
      date: '2026-08-20',
      time: '21:00',
      timezone: 'Europe/Brussels',
      wagerStc: '20000',
    });

    expect(result).toEqual({
      invitationType: 'player_vs_player',
      scheduledDate: '2026-08-20 21:00:00',
      opponentName: 'Rival',
      timezone: 'Europe/Brussels',
    });

    expect(stageClient.functions.invoke).toHaveBeenCalledWith('sendInboxMessage', expect.objectContaining({
      recipient_email: 'opp@stage.com',
      message_type: 'match_invite',
      action_type: 'accept_decline_date',
      related_entity_type: 'player',
      related_entity_id: 'p2',
      metadata: expect.objectContaining({
        invitation_type: 'player_vs_player',
        scheduled_date: '2026-08-20 21:00:00',
        timezone: 'Europe/Brussels',
        challenger_player_id: 'p1',
        opponent_player_id: 'p2',
        wager_stc: 20000,
      }),
    }));
  });

  test('resolves club president contact and sends club_vs_club', async () => {
    const stageClient = mockStageClient({
      clubContact: { recipient_email: 'pres@club.com', president_id: 'pres-2' },
      presidents: [{ id: 'pres-1' }],
    });

    await sendArrangeGameInvite({
      stageClient,
      myPlayer: { id: 'p1', gamertag: 'Me', email: 'me@stage.com' },
      myClub: {
        id: 'c1',
        name: 'Home FC',
        tag: 'HFC',
        owner_email: 'owner@home.com',
        logo_url: 'logo.png',
        stc: 500000,
      },
      matchType: 'club',
      opponent: { id: 'c2', name: 'Away FC', tag: 'AFC' },
      recipientKind: 'club',
      date: '2026-09-01',
      time: '19:30',
    });

    expect(stageClient.functions.invoke).toHaveBeenCalledWith(
      'resolveClubContact',
      { club_id: 'c2' },
    );
    expect(stageClient.functions.invoke).toHaveBeenCalledWith('sendInboxMessage', expect.objectContaining({
      recipient_email: 'pres@club.com',
      sender_club_name: 'Home FC',
      related_entity_type: 'club',
      metadata: expect.objectContaining({
        invitation_type: 'club_vs_club',
        challenger_club_id: 'c1',
        opponent_club_id: 'c2',
        opponent_president_id: 'pres-2',
        wager_stc: 0,
      }),
    }));
  });

  test('throws when the opponent has no reachable email', async () => {
    const stageClient = mockStageClient();
    await expect(sendArrangeGameInvite({
      stageClient,
      myPlayer: { id: 'p1', gamertag: 'Me', email: 'me@stage.com' },
      myClub: null,
      matchType: 'player',
      opponent: { id: 'p2', gamertag: 'Ghost' },
      recipientKind: 'player',
      date: '2026-08-20',
      time: '21:00',
    })).rejects.toThrow(/Could not reach this player/);
  });
});

describe('Matches hub arrange fixture wiring', () => {
  test('Matches screen opens ArrangeGameModal', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../app/(tabs)/matches/index.jsx'),
      'utf8',
    );
    expect(source).toMatch(/ArrangeGameModal/);
    expect(source).toMatch(/ARRANGE VS FIXTURE/);
    expect(source).toMatch(/myPlayer/);
    expect(source).toMatch(/onSent/);
  });

  test('Arrange VS details uses date picker, time picker, and timezone', () => {
    const modal = fs.readFileSync(
      path.join(__dirname, '../../components/matches/ArrangeGameModal.jsx'),
      'utf8',
    );
    const fields = fs.readFileSync(
      path.join(__dirname, '../../components/matches/DateTimeZoneFields.jsx'),
      'utf8',
    );
    expect(modal).toMatch(/DateTimeZoneFields/);
    expect(modal).not.toMatch(/Date YYYY-MM-DD/);
    expect(fields).toMatch(/DateTimePicker/);
    expect(fields).toMatch(/mode="date"/);
    expect(fields).toMatch(/mode="time"/);
    expect(fields).toMatch(/TIMEZONES/);
  });

  test('match detail is Stage Game Day ops, not legacy mock fallback', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../app/(tabs)/matches/matchdetailscreen.jsx'),
      'utf8',
    );
    expect(source).toMatch(/kickoffMatch/);
    expect(source).toMatch(/GameDayResultSheet/);
    expect(source).toMatch(/GameDayWagerCard/);
    expect(source).toMatch(/GameDayDressingRoom/);
    expect(source).not.toMatch(/getMockMatchById/);
    expect(source).not.toMatch(/api\.get\(`\/matches\//);
  });
});
