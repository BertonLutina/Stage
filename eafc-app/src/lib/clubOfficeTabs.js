export function buildClubTabGroups({
  canOpenClubOffice = false,
  showChat = false,
} = {}) {
  const groups = [
    { label: 'Posts', tabs: ['posts'] },
    { label: 'Squad', tabs: ['squad'] },
    { label: 'Stats', tabs: ['stats'] },
    { label: 'Fixtures', tabs: ['fixtures'] },
    { label: 'Trophies', tabs: ['trophies'] },
  ];

  if (showChat) {
    groups.push({ label: 'Club Chat', tabs: ['chat'] });
  }

  if (canOpenClubOffice) {
    groups.push({ label: 'Club Office', tabs: ['club-office'] });
  }

  return groups;
}

export const CLUB_OFFICE_SECTIONS = [
  { id: 'contracts', label: 'Contracts', icon: 'document-text-outline' },
  { id: 'finance', label: 'Finance', icon: 'cash-outline' },
  { id: 'stadium', label: 'Stadium', icon: 'business-outline' },
  { id: 'shirts', label: 'Shirts', icon: 'shirt-outline' },
  { id: 'audit', label: 'Audit Log', icon: 'reader-outline' },
];

export function clubTabLabels() {
  return {
    posts: 'Posts',
    squad: 'Squad',
    stats: 'Stats',
    fixtures: 'Fixtures',
    chat: 'Club Chat',
    'club-office': 'Club Office',
    trophies: 'Trophies',
    contracts: 'Contracts',
    finance: 'Finance',
    stadium: 'Stadium',
    shirts: 'Shirts',
    audit: 'Audit Log',
  };
}
