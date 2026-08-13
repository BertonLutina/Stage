/**
 * Mini Apps catalog — mirrors Stage web MobileMoreSheet, minus native tabs.
 * Home, Matches, Tournaments, and Profile stay in the bottom nav only.
 */

const NATIVE_TAB_HREFS = new Set([
  '/(tabs)/dashboard',
  '/(tabs)/matches',
  '/(tabs)/tournaments',
  '/(tabs)/profile',
]);

function withoutNativeTabs(groups) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.keepOnNativeTab || !NATIVE_TAB_HREFS.has(item.href)),
    }))
    .filter((group) => group.items.length > 0);
}

const MARKET_ITEMS = [
  {
    id: 'find-clubs',
    label: 'Find Clubs',
    icon: 'shield-outline',
    keywords: ['search clubs', 'teams', 'directory'],
    href: '/apps/find-clubs',
    ready: true,
  },
  {
    id: 'find-players',
    label: 'Find Players',
    icon: 'people-outline',
    keywords: ['search players', 'directory', 'market'],
    href: '/apps/find-players',
    ready: true,
  },
  {
    id: 'find-presidents',
    label: 'Find Presidents',
    icon: 'star-outline',
    keywords: ['owners', 'presidents', 'directory'],
    href: '/apps/presidents',
    ready: true,
  },
  {
    id: 'scouting',
    label: 'Scouting',
    icon: 'eye-outline',
    keywords: ['scout', 'report', 'scouting'],
    href: '/apps/scouting',
    ready: true,
  },
  {
    id: 'transfers',
    label: 'Transfers',
    icon: 'swap-horizontal-outline',
    keywords: ['transfer market', 'market', 'buy', 'sell'],
    href: '/apps/transfers',
    ready: true,
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    icon: 'cafe-outline',
    keywords: ['assets', 'off pitch'],
    href: '/apps/lifestyle',
    ready: true,
  },
  {
    id: 'wallet',
    label: 'Wallet',
    icon: 'flash-outline',
    keywords: ['stc', 'money', 'coins'],
    href: '/apps/wallet',
    ready: true,
  },
];

const MATCH_ITEMS = [
  {
    id: 'schedule',
    label: 'Schedule',
    icon: 'calendar-outline',
    keywords: ['calendar', 'fixtures', 'agenda'],
    href: '/apps/schedule',
    ready: true,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    icon: 'mail-outline',
    keywords: ['messages', 'offers', 'contracts'],
    href: '/apps/inbox',
    ready: true,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'notifications-outline',
    keywords: ['alerts', 'bell'],
    href: '/apps/notifications',
    ready: true,
  },
  {
    id: 'disputes',
    label: 'Disputes',
    icon: 'hammer-outline',
    keywords: ['admin', 'litige', 'resolve', 'proof', 'screenshot'],
    href: '/apps/disputes',
    ready: true,
  },
];

const COMPETE_ITEMS = [
  {
    id: 'international',
    label: 'International',
    icon: 'globe-outline',
    keywords: ['nations', 'world'],
    href: '/apps/international',
    ready: true,
  },
  {
    id: 'register',
    label: 'Register',
    icon: 'shield-checkmark-outline',
    keywords: ['league', 'sign up'],
    href: '/apps/register',
    ready: true,
  },
  {
    id: 'competitions',
    label: 'Competitions',
    icon: 'podium-outline',
    keywords: ['league', 'season', 'table', 'supreme', 'elite'],
    href: '/apps/competitions',
    ready: true,
  },
  {
    id: 'rankings',
    label: 'Rankings',
    icon: 'stats-chart-outline',
    keywords: ['leaderboard', 'table'],
    href: '/apps/rankings',
    ready: true,
  },
];

const COMMUNITY_ITEMS = [
  {
    id: 'feed',
    label: 'Feed',
    icon: 'newspaper-outline',
    keywords: ['social', 'posts'],
    href: '/social',
    ready: true,
  },
  {
    id: 'discord',
    label: 'Discord',
    icon: 'logo-discord',
    keywords: ['community', 'chat'],
    href: '/apps/discord',
    ready: true,
  },
  {
    id: 'follow-back',
    label: 'Follow Back',
    icon: 'heart-outline',
    keywords: ['followers'],
    href: '/apps/follow-back',
    ready: true,
  },
  {
    id: 'news',
    label: 'News',
    icon: 'document-text-outline',
    keywords: ['updates'],
    href: '/apps/news',
    ready: true,
  },
];

const ACCOUNT_ITEMS = [
  {
    id: 'store',
    label: 'Store',
    icon: 'bag-outline',
    keywords: ['shop'],
    href: '/apps/store',
    ready: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings-outline',
    keywords: ['preferences', 'account', 'theme'],
    href: '/apps/settings',
    ready: true,
  },
];

export const MINI_APP_GROUPS_PLAYER = [
  { id: 'match', label: 'Match', items: MATCH_ITEMS },
  { id: 'compete', label: 'Compete', items: COMPETE_ITEMS },
  {
    id: 'club',
    label: 'Club',
    items: [
      {
        id: 'club-players',
        label: 'Players',
        icon: 'shirt-outline',
        keywords: ['squad', 'roster', 'club players'],
        href: '/(tabs)/profile',
        params: { tab: 'squad' },
        keepOnNativeTab: true,
        ready: true,
      },
      {
        id: 'free-agents',
        label: 'Free Agents',
        icon: 'person-add-outline',
        keywords: ['unsigned', 'available'],
        href: '/apps/free-agents',
        ready: true,
      },
    ],
  },
  { id: 'market', label: 'Market', items: MARKET_ITEMS },
  { id: 'community', label: 'Community', items: COMMUNITY_ITEMS },
  { id: 'account', label: 'Account', items: ACCOUNT_ITEMS },
];

export const MINI_APP_GROUPS_PRESIDENT = [
  { id: 'match', label: 'Match', items: MATCH_ITEMS },
  {
    id: 'club',
    label: 'Club',
    items: [
      {
        id: 'club-players',
        label: 'Players',
        icon: 'shirt-outline',
        keywords: ['squad', 'roster', 'club players'],
        href: '/(tabs)/profile',
        params: { tab: 'squad' },
        keepOnNativeTab: true,
        ready: true,
      },
      {
        id: 'contracts',
        label: 'Contracts',
        icon: 'document-text-outline',
        keywords: ['offers', 'wage'],
        href: '/apps/contracts',
        ready: true,
      },
      {
        id: 'free-agents',
        label: 'Free Agents',
        icon: 'person-add-outline',
        keywords: ['unsigned', 'available'],
        href: '/apps/free-agents',
        ready: true,
      },
    ],
  },
  { id: 'market', label: 'Market', items: MARKET_ITEMS },
  { id: 'compete', label: 'Compete', items: COMPETE_ITEMS },
  { id: 'community', label: 'Community', items: COMMUNITY_ITEMS },
  { id: 'account', label: 'Account', items: ACCOUNT_ITEMS },
];

export function getMiniAppGroups(accountMode = 'player') {
  const groups = accountMode === 'club' ? MINI_APP_GROUPS_PRESIDENT : MINI_APP_GROUPS_PLAYER;
  return withoutNativeTabs(groups);
}

export function filterMiniAppGroups(groups, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return groups;
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const hay = [
          item.label,
          item.id,
          ...(item.keywords || []),
          group.label,
        ].join(' ').toLowerCase();
        return hay.includes(q);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function findMiniApp(slug) {
  const all = [...MINI_APP_GROUPS_PLAYER, ...MINI_APP_GROUPS_PRESIDENT]
    .flatMap((g) => g.items);
  return all.find((item) => item.id === slug || item.href === `/apps/${slug}`) || null;
}
