export const COMPETITIONS = [
  {
    slug: 'supreme',
    name: 'STAGE Supreme League',
    tier: 1,
    description: 'The pinnacle of STAGE competition. Only the elite qualify.',
  },
  {
    slug: 'elite',
    name: 'STAGE Elite League',
    tier: 2,
    description: 'The proving ground. Earn your place in the Supreme League.',
  },
  {
    slug: 'challenger',
    name: 'STAGE Challenger League',
    tier: 3,
    description: 'Where every STAGE career begins. Rise through the ranks.',
  },
];

export function getCompetitionMeta(slug) {
  return COMPETITIONS.find((c) => c.slug === slug) || COMPETITIONS[2];
}

export function sortStandings(standings = []) {
  return [...standings].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
    if (b.goals_for !== a.goals_for) return b.goals_for - a.goals_for;
    return String(a.club_name || '').localeCompare(String(b.club_name || ''));
  });
}

export function parseForm(form) {
  if (Array.isArray(form)) return form;
  if (typeof form === 'string') {
    try {
      const parsed = JSON.parse(form);
      return Array.isArray(parsed) ? parsed : form.split('').filter((c) => 'WDL'.includes(c));
    } catch {
      return form.split('').filter((c) => 'WDL'.includes(c));
    }
  }
  return [];
}
