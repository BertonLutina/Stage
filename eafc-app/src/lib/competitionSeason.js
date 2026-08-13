import { stageClient } from '@/api/stageClient';
import { COMPETITIONS, getCompetitionMeta, sortStandings } from '@/lib/competitionUtils';
import { REGIONS } from '@/lib/qualificationConfig';

export async function loadCompetitionsHub() {
  const [seasons, standings] = await Promise.all([
    stageClient.entities.CompetitionSeason.list('-season_number', 40).catch(() => []),
    stageClient.entities.CompetitionStanding.list(null, 400).catch(() => []),
  ]);
  const active = (seasons || []).filter((s) => !['archived'].includes(String(s.status || '').toLowerCase()));
  return COMPETITIONS.map((meta) => {
    const season = active.find((s) =>
      String(s.competition_slug || s.slug || '').toLowerCase() === meta.slug
      || String(s.competition_name || '').toLowerCase().includes(meta.name.toLowerCase().replace('STAGE ', ''))
    ) || active.find((s) => String(s.competition_id || s.slug || '') === meta.slug);
    const table = sortStandings((standings || []).filter((row) => row.season_id && season && row.season_id === season.id));
    return { meta, season, standings: table };
  });
}

export async function loadCompetitionDetail(slug) {
  const meta = getCompetitionMeta(slug);
  const seasons = await stageClient.entities.CompetitionSeason.filter(
    { competition_slug: slug },
    '-season_number',
    20,
  ).catch(async () => {
    const all = await stageClient.entities.CompetitionSeason.list('-season_number', 40).catch(() => []);
    return (all || []).filter((s) =>
      String(s.competition_slug || s.slug || '').toLowerCase() === String(slug).toLowerCase()
    );
  });
  const season = (seasons || []).find((s) => s.status !== 'archived') || seasons?.[0] || null;
  if (!season) return { meta, season: null, standings: [], fixtures: [], qualifications: [] };

  const [standings, fixtures, qualifications] = await Promise.all([
    stageClient.entities.CompetitionStanding.filter({ season_id: season.id }, null, 80).catch(() => []),
    stageClient.entities.CompetitionFixture.filter({ season_id: season.id }, 'matchday', 200).catch(() => []),
    stageClient.entities.QualificationEntry.filter({ season_id: season.id }, null, 80).catch(() => []),
  ]);
  return {
    meta,
    season,
    standings: sortStandings(standings),
    fixtures: fixtures || [],
    qualifications: qualifications || [],
  };
}

export async function loadLeaguesHub() {
  const leagues = await stageClient.entities.RegionalLeague.list('-season_number', 80).catch(() => []);
  return REGIONS.map((region) => ({
    region,
    leagues: (leagues || []).filter((l) => l.region_slug === region.slug),
  })).filter((row) => row.leagues.length);
}

export async function loadLeagueDetail(slug) {
  const rows = await stageClient.entities.RegionalLeague.filter({ slug }, null, 5).catch(() => []);
  const league = rows?.[0] || null;
  if (!league) return { league: null, standings: [], fixtures: [] };
  const [standings, fixtures] = await Promise.all([
    stageClient.entities.RegionalLeagueStanding.filter({ league_id: league.id }, null, 80).catch(() => []),
    stageClient.entities.RegionalLeagueFixture.filter({ league_id: league.id }, 'matchday', 200).catch(() => []),
  ]);
  return {
    league,
    standings: sortStandings(standings),
    fixtures: fixtures || [],
  };
}

export async function loadSeasonRegistrations(user) {
  const [leagues, apps] = await Promise.all([
    stageClient.entities.RegionalLeague.filter({ status: 'registration' }, null, 100).catch(() => []),
    user?.email
      ? stageClient.entities.SeasonRegistration.filter({ owner_email: user.email }, '-applied_at', 50).catch(() => [])
      : Promise.resolve([]),
  ]);
  const myEmail = String(user?.email || '').toLowerCase();
  const myApps = (apps || []).filter((a) => String(a.owner_email || '').toLowerCase() === myEmail);
  return { leagues: leagues || [], myApps };
}

export function groupFixturesByMatchday(fixtures = []) {
  const map = new Map();
  fixtures.forEach((f) => {
    const key = String(f.matchday || f.round || 'Other');
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(f);
  });
  return Array.from(map.entries())
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([matchday, rows]) => ({ matchday, rows }));
}
