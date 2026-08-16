import { readFileSync } from 'fs';
import { resolve } from 'path';
import {
  DESK_FILTERS,
  NEWS_SECTION_FILTERS,
  clubRoute,
  filterCompetitionFields,
  filterDeskFeed,
  filterMercatoFeed,
  formatDeadlineCountdown,
  formatDeskAmount,
  formatNewspaperDate,
  loadMercatoDesk,
  loadNewsDesk,
  matchesDeskFilter,
  newspaperVolume,
  playerRoute,
  stampColor,
  tournamentRoute,
  transferToNewspaperItem,
  unwrapDesk,
} from '../../lib/stageNews';

describe('stage news desks', () => {
  test('masthead has the same seven STAGE TIMES tabs as web', () => {
    expect(NEWS_SECTION_FILTERS.map((item) => item.id)).toEqual([
      'all',
      'mercato',
      'club_news',
      'player_news',
      'tournament',
      'competitions',
      'daily_news',
      'world_news',
    ]);
    expect(Object.keys(DESK_FILTERS)).toEqual([
      'club_news',
      'player_news',
      'tournament',
      'competitions',
      'daily_news',
    ]);
  });

  test('desk filters keep club operations apart from player life', () => {
    const stadium = { kind: 'stadium', title: 'Arena upgrade', club_name: 'Hooded' };
    const signed = { kind: 'signed', title: 'Neo joined Hooded', player_name: 'Neo' };
    expect(matchesDeskFilter(stadium, 'stadium')).toBe(true);
    expect(matchesDeskFilter(stadium, 'contract')).toBe(false);
    expect(matchesDeskFilter(signed, 'signed')).toBe(true);
    expect(filterDeskFeed([stadium, signed], { filter: 'stadium' })).toHaveLength(1);
    expect(formatDeskAmount(12_000)).toBe('12K STC');
  });

  test('daily mix filters by original desk', () => {
    const rows = [
      { beat: 'club_news', kind: 'stadium', title: 'Arena' },
      { beat: 'mercato', kind: 'official', title: 'Neo signs' },
    ];
    expect(filterDeskFeed(rows, { filter: 'mercato' })).toHaveLength(1);
    expect(filterDeskFeed(rows, { filter: 'club_news' })[0].title).toBe('Arena');
  });

  test('competition field filters keep champions and live cups apart', () => {
    const rows = [
      { id: '1', name: 'Cup', status: 'live', phases: [{ key: 'qf' }], winner_name: '' },
      { id: '2', name: 'League', status: 'completed', phases: [], winner_name: 'Ajax' },
    ];
    expect(filterCompetitionFields(rows, { filter: 'champion' }).map((row) => row.id)).toEqual(['2']);
    expect(filterCompetitionFields(rows, { filter: 'field' }).map((row) => row.id)).toEqual(['1']);
    expect(filterCompetitionFields(rows, { filter: 'phase' }).map((row) => row.id)).toEqual(['1']);
  });

  test('mercato tape filters rumours, loans and fee bands', () => {
    const rows = [
      { id: '1', status: 'rumour', deal_type: 'permanent', from_club_id: 'c1', transfer_fee: 500_000, player_name: 'Neo', headline: 'Neo to Ajax' },
      { id: '2', status: 'official', deal_type: 'loan', from_club_id: 'c1', transfer_fee: 12_000_000, player_name: 'Trinity', headline: 'Trinity loan' },
      { id: '3', status: 'failed', deal_type: 'free', from_club_id: null, transfer_fee: 0, player_name: 'Ghost', headline: 'Ghost free' },
    ];
    expect(filterMercatoFeed(rows, { filter: 'rumours' }).map((row) => row.id)).toEqual(['1']);
    expect(filterMercatoFeed(rows, { filter: 'loans' }).map((row) => row.id)).toEqual(['2']);
    expect(filterMercatoFeed(rows, { filter: 'free_agents' }).map((row) => row.id)).toEqual(['3']);
    expect(filterMercatoFeed(rows, { priceBand: '1to10' })).toHaveLength(0);
    expect(filterMercatoFeed(rows, { priceBand: '10to50' }).map((row) => row.id)).toEqual(['2']);
    expect(filterMercatoFeed(rows, { query: 'ajax' }).map((row) => row.id)).toEqual(['1']);
  });

  test('print helpers and stamp colours match the paper desk', () => {
    expect(formatNewspaperDate(new Date('2026-08-15T10:00:00.000Z'))).toBe('Saturday, 15 August 2026');
    expect(newspaperVolume(new Date('2026-08-15T10:00:00.000Z'))).toBe('2026');
    expect(formatDeadlineCountdown(3_661_000)).toBe('01:01:01');
    expect(stampColor('official')).toBe('#0f6b3a');
    expect(stampColor('rumour')).toBe('#8a6a12');
    expect(stampColor('lifestyle')).toBe('#4b1f73');
  });

  test('unwraps nested desk payloads', () => {
    expect(unwrapDesk({ data: { feed: [{ id: '1' }], kicker: 'Club' } }).kicker).toBe('Club');
    expect(unwrapDesk(null).feed).toEqual([]);
  });

  test('loads the same backend desks as the web paper', async () => {
    const http = {
      get: jest.fn(async (path) => {
        if (path === '/news-desks/club_news') return { feed: [{ id: 'n1' }], kicker: 'Club News' };
        if (path === '/mercato-transfers/desk') return { feed: [{ id: 't1' }], deadline: { active: false } };
        throw new Error(path);
      }),
    };
    await expect(loadNewsDesk('club_news', { http })).resolves.toEqual({
      feed: [{ id: 'n1' }],
      kicker: 'Club News',
    });
    await expect(loadMercatoDesk({ http })).resolves.toEqual({
      feed: [{ id: 't1' }],
      deadline: { active: false },
    });
    expect(http.get).toHaveBeenCalledWith('/news-desks/club_news');
    expect(http.get).toHaveBeenCalledWith('/mercato-transfers/desk');
  });

  test('opens club, player and tournament files on mobile routes', () => {
    expect(clubRoute('c1')).toEqual({ pathname: '/apps/club/[id]', params: { id: 'c1' } });
    expect(playerRoute('p1')).toEqual({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: 'p1' },
    });
    expect(tournamentRoute('cup-1')).toEqual({
      pathname: '/(tabs)/tournaments/tournamentdetailscreen',
      params: { tournamentId: 'cup-1' },
    });
    expect(transferToNewspaperItem({
      id: 't1',
      headline: 'Neo to Ajax',
      player_avatar_url: '/neo.jpg',
      transfer_fee: 2_000_000,
      status: 'official',
    }).photo_url).toBe('/neo.jpg');
  });

  test('news screen mounts STAGE TIMES desks instead of the old directory list', () => {
    const page = readFileSync(resolve(__dirname, '../../app/apps/news.jsx'), 'utf8');
    expect(page).toMatch(/StageTimesNews/);
    expect(page).not.toMatch(/AppDirectoryScreen/);
    expect(page).not.toMatch(/Alert\.alert/);
  });
});
