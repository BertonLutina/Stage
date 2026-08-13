import { stageClient } from '@/api/stageClient';
import { createMatchFromFixture } from '@/lib/gameDayIntegration';

function fixtureEntity(fixtureType) {
  return fixtureType === 'regional_league'
    ? stageClient.entities.RegionalLeagueFixture
    : stageClient.entities.CompetitionFixture;
}

export async function getClubManagerEmail(clubId) {
  if (!clubId) return null;
  try {
    const players = await stageClient.entities.Player.filter({ club_id: clubId });
    const manager = players.find((p) =>
      p.club_roles?.includes('president')
      || p.club_roles?.includes('manager')
      || p.club_roles?.includes('captain')
      || p.role === 'captain'
      || p.role === 'admin'
    ) || players[0];
    return manager?.email || null;
  } catch {
    return null;
  }
}

function matchContext(fixture, fixtureType) {
  if (fixtureType === 'regional_league') {
    return `${fixture.league_name || 'Regional League'} · Matchday ${fixture.matchday || ''}`;
  }
  return `${fixture.competition_name || 'Competition'} · ${fixture.phase || 'Match'}`;
}

export async function proposeTime({
  fixture,
  fixtureType,
  role,
  proposedDate,
  myClub,
  myEmail,
  myGamertag,
}) {
  const isHome = role === 'home';
  const recipientClubId = isHome ? fixture.away_club_id : fixture.home_club_id;
  const recipientEmail = await getClubManagerEmail(recipientClubId);
  const updates = {
    scheduling_status: isHome ? 'home_proposed' : 'away_proposed',
    last_proposed_by: role,
    proposal_count: (fixture.proposal_count || 0) + 1,
  };
  if (isHome) updates.home_proposed_date = proposedDate;
  else updates.away_proposed_date = proposedDate;
  await fixtureEntity(fixtureType).update(fixture.id, updates);
  if (!recipientEmail) return;

  const proposerName = myClub?.name || myGamertag || 'Your opponent';
  const fixtureName = `${fixture.home_club_name} vs ${fixture.away_club_name}`;
  await stageClient.functions.invoke('sendInboxMessage', {
    recipient_email: recipientEmail,
    sender_email: myEmail,
    sender_gamertag: proposerName,
    sender_club_name: myClub?.name || null,
    sender_avatar_url: myClub?.logo_url || null,
    subject: `Match Time Proposed: ${fixtureName}`,
    body: `${proposerName} proposed a time for ${fixtureName}.\n\nProposed: ${proposedDate}\n\nAccept or propose another time.`,
    message_type: 'league_schedule',
    action_type: 'schedule_accept_propose',
    related_entity_id: fixture.id,
    related_entity_type: fixtureType === 'regional_league' ? 'league_fixture' : 'competition_fixture',
    status: 'pending',
    is_read: false,
    metadata: {
      fixture_id: fixture.id,
      fixture_type: fixtureType,
      proposed_date: proposedDate,
      proposed_by_role: role,
      proposer_club_id: myClub?.id || null,
      proposer_email: myEmail,
      home_club_id: fixture.home_club_id,
      home_club_name: fixture.home_club_name,
      away_club_id: fixture.away_club_id,
      away_club_name: fixture.away_club_name,
      match_context: matchContext(fixture, fixtureType),
      window_end: fixture.window_end,
    },
    send_notification: true,
  });
}

export async function acceptProposal({ fixture, fixtureType, role, myClub, myEmail }) {
  const isHome = role === 'home';
  const confirmedDate = isHome ? fixture.away_proposed_date : fixture.home_proposed_date;
  if (!confirmedDate) throw new Error('No proposed time to accept');

  const proposerClubId = isHome ? fixture.away_club_id : fixture.home_club_id;
  const proposerEmail = await getClubManagerEmail(proposerClubId);
  const accepterName = myClub?.name || 'Your opponent';
  const fixtureName = `${fixture.home_club_name} vs ${fixture.away_club_name}`;

  await fixtureEntity(fixtureType).update(fixture.id, {
    scheduling_status: 'confirmed',
    confirmed_date: confirmedDate,
    status: 'scheduled',
    ...(fixtureType === 'competition' ? { scheduled_date: confirmedDate } : {}),
  });

  await createMatchFromFixture({ ...fixture, confirmed_date: confirmedDate, status: 'scheduled' }, fixtureType);

  if (proposerEmail) {
    await stageClient.functions.invoke('sendInboxMessage', {
      recipient_email: proposerEmail,
      sender_email: myEmail,
      sender_gamertag: accepterName,
      sender_club_name: myClub?.name || null,
      subject: `Match Confirmed: ${fixtureName}`,
      body: `${accepterName} accepted your time.\n\nMatch: ${fixtureName}\nDate: ${confirmedDate}`,
      message_type: 'league_schedule',
      action_type: 'none',
      status: 'confirmed',
      is_read: false,
      metadata: {
        fixture_id: fixture.id,
        fixture_type: fixtureType,
        confirmed_date: confirmedDate,
      },
      send_notification: true,
    });
  }
}

export async function loadFixtureForInbox(meta = {}) {
  const fixtureId = meta.fixture_id;
  const fixtureType = meta.fixture_type === 'regional_league' ? 'regional_league' : 'competition';
  if (!fixtureId) return { fixture: null, fixtureType };
  const rows = await fixtureEntity(fixtureType).filter({ id: fixtureId }, null, 1).catch(() => []);
  return { fixture: rows?.[0] || null, fixtureType };
}

export function roleForClub(fixture, clubId) {
  if (!fixture || !clubId) return null;
  if (fixture.home_club_id === clubId) return 'home';
  if (fixture.away_club_id === clubId) return 'away';
  return null;
}
