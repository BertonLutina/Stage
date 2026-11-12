/**
 * Group tournament fixtures into matchday / round buckets for the Fixtures
 * mockup navigator (Previous / Next round). Prefers explicit round/matchday
 * fields; otherwise buckets by calendar date of the scheduled kickoff.
 */

function matchTime(item) {
  const value = item?.scheduled_at || item?.scheduled_date || item?.match_date || item?.date;
  const time = value ? new Date(value).getTime() : Number.NaN;
  return Number.isFinite(time) ? time : null;
}

function formatRange(items) {
  const times = items.map(matchTime).filter((t) => t != null).sort((a, b) => a - b);
  if (!times.length) return null;
  const start = new Date(times[0]);
  const end = new Date(times[times.length - 1]);
  const opts = { day: 'numeric', month: 'short' };
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString('en-GB', opts);
  }
  return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`;
}

export function buildFixtureMatchdays(fixtures = []) {
  const rows = Array.isArray(fixtures) ? fixtures.filter(Boolean) : [];
  if (!rows.length) return [];

  const buckets = new Map();
  rows.forEach((item) => {
    let key;
    let title;
    let order;
    if (item.matchday != null && item.matchday !== '') {
      key = `md-${item.matchday}`;
      title = `Matchday ${item.matchday}`;
      order = Number(item.matchday) || 0;
    } else if (item.round != null && item.round !== '') {
      key = `r-${item.round}`;
      const roundLabel = item.round_name || item.round_label;
      title = roundLabel || `Round ${item.round}`;
      order = Number(item.round) || 0;
    } else {
      const time = matchTime(item);
      if (time != null) {
        const day = new Date(time);
        key = `d-${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
        title = day.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
        order = time;
      } else {
        key = 'unscheduled';
        title = 'Unscheduled';
        order = Number.MAX_SAFE_INTEGER;
      }
    }
    if (!buckets.has(key)) buckets.set(key, { id: key, title, order, items: [] });
    buckets.get(key).items.push(item);
  });

  return [...buckets.values()]
    .map((bucket) => ({
      ...bucket,
      rangeLabel: formatRange(bucket.items),
      items: [...bucket.items].sort((a, b) => (matchTime(a) ?? Number.MAX_SAFE_INTEGER) - (matchTime(b) ?? Number.MAX_SAFE_INTEGER)),
    }))
    .sort((a, b) => a.order - b.order);
}
