import { stageClient } from '@/api/stageClient';

/**
 * News screen (task 16). Three tabs, one common item shape:
 *   WORLD   GET /news-desks/world_news     (club, player and transfer stories mixed)
 *   MERCATO GET /mercato-transfers/desk    (rumours to official deals)
 *   BEAT    GET /news-desks/{club_news, player_news, tournament, competitions}
 *
 * Item: { id, section, title, body, photoUrl, at (ms) }. Text is the server's; nothing is made up.
 */

export const BEAT_SECTIONS = ['club_news', 'player_news', 'tournament', 'competitions'];

const MINUTE = 60000;
const HOUR = 3600000;

function toMs(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function storyToItem(story) {
  if (!story || typeof story !== 'object') return null;
  const title = String(story.title || '').trim();
  if (!title) return null;
  return {
    id: String(story.id ?? title),
    section: story.beat || story.kind || 'news',
    title,
    body: String(story.body || ''),
    photoUrl: story.photo_url || null,
    at: toMs(story.published_at || story.created_date),
  };
}

export function mercatoToItem(row) {
  if (!row || typeof row !== 'object') return null;
  const title = String(row.headline || [row.player_name, row.to_club_name].filter(Boolean).join(' → ')).trim();
  if (!title) return null;
  return {
    id: `mercato_${row.id ?? title}`,
    section: 'mercato',
    title,
    body: String(row.body || ''),
    photoUrl: row.player_avatar_url || null,
    at: toMs(row.last_updated_at || row.transfer_date || row.published_at || row.created_date),
  };
}

const newestFirst = (a, b) => b.at - a.at;

function itemsFromDesk(desk) {
  if (!Array.isArray(desk?.feed)) throw new Error('News data is incomplete. Please retry.');
  return desk.feed.map(storyToItem).filter(Boolean);
}

export async function loadWorldNews() {
  const desk = await stageClient.http.get('/news-desks/world_news');
  return itemsFromDesk(desk).sort(newestFirst);
}

export async function loadMercatoNews() {
  const desk = await stageClient.http.get('/mercato-transfers/desk');
  if (!Array.isArray(desk?.feed)) throw new Error('Mercato data is incomplete. Please retry.');
  return desk.feed.map(mercatoToItem).filter(Boolean).sort(newestFirst);
}

/** The club, player, tournament and competition desks, merged. One desk failing is not fatal. */
export async function loadBeatNews() {
  const results = await Promise.allSettled(
    BEAT_SECTIONS.map((section) => stageClient.http.get(`/news-desks/${section}`)),
  );
  const fulfilled = results.filter((r) => r.status === 'fulfilled');
  if (!fulfilled.length) throw results[0].reason;
  const items = [];
  fulfilled.forEach((r) => {
    try { items.push(...itemsFromDesk(r.value)); } catch { /* skip a malformed desk */ }
  });
  return items.sort(newestFirst);
}

export const NEWS_LOADERS = {
  world: loadWorldNews,
  mercato: loadMercatoNews,
  beat: loadBeatNews,
};

function dayStart(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** `30 min ago`, `5 h ago`, `yesterday`, `Sun`, `1 Oct`. `t` is the translator. */
export function newsTimeLabel(ms, now = Date.now(), t, language = 'en') {
  if (!ms) return '';
  const age = now - ms;
  if (age < HOUR) return t('stage.news.minutesAgo', { n: Math.max(1, Math.floor(age / MINUTE)) });
  if (age < 24 * HOUR) return t('stage.news.hoursAgo', { n: Math.floor(age / HOUR) });
  const days = Math.round((dayStart(now) - dayStart(ms)) / (24 * HOUR));
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  if (days <= 1) return t('stage.news.yesterday');
  if (days < 7) return new Date(ms).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');
  return new Date(ms).toLocaleDateString(locale, { day: 'numeric', month: 'short' }).replace('.', '');
}
