/**
 * Mini Apps catalog — mirrors Stage web MobileMoreSheet destinations.
 * ready:true → native route exists; otherwise opens a Stage-style placeholder.
 */

export const MINI_APP_GROUPS_PLAYER = [
  {
    id: 'match',
    label: 'Match',
    items: [
      {
        id: 'schedule',
        label: 'Schedule',
        icon: 'calendar-outline',
        keywords: ['calendar', 'fixtures', 'agenda'],
        href: '/apps/schedule',
      },
      {
        id: 'inbox',
        label: 'Inbox',
        icon: 'mail-outline',
        keywords: ['messages', 'offers', 'contracts'],
        href: '/apps/inbox',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: 'notifications-outline',
        keywords: ['alerts', 'bell'],
        href: '/apps/notifications',
      },
      {
        id: 'matches',
        label: 'Matches',
        icon: 'football-outline',
        keywords: ['game day', 'gameday'],
        href: '/(tabs)/matches',
        ready: true,
      },
    ],
  },
  {
    id: 'compete',
    label: 'Compete',
    items: [
      {
        id: 'tournaments',
        label: 'Tournaments',
        icon: 'trophy-outline',
        keywords: ['cup', 'competition'],
        href: '/(tabs)/tournaments',
        ready: true,
      },
      {
        id: 'international',
        label: 'International',
        icon: 'globe-outline',
        keywords: ['nations', 'world'],
        href: '/apps/international',
      },
      {
        id: 'register',
        label: 'Register',
        icon: 'shield-outline',
        keywords: ['league', 'sign up'],
        href: '/apps/register',
      },
      {
        id: 'rankings',
        label: 'Rankings',
        icon: 'stats-chart-outline',
        keywords: ['leaderboard', 'table'],
        href: '/apps/rankings',
      },
    ],
  },
  {
    id: 'market',
    label: 'Market',
    items: [
      {
        id: 'find-players',
        label: 'Find Players',
        icon: 'people-outline',
        keywords: ['search players', 'directory'],
        href: '/(tabs)/search/searchplayer',
        ready: true,
      },
      {
        id: 'find-clubs',
        label: 'Find Clubs',
        icon: 'shield-outline',
        keywords: ['search clubs', 'teams'],
        href: '/(tabs)/search/searchclubs',
        ready: true,
      },
      {
        id: 'presidents',
        label: 'Presidents',
        icon: 'star-outline',
        keywords: ['owners'],
        href: '/apps/presidents',
      },
      {
        id: 'free-agents',
        label: 'Free Agents',
        icon: 'person-add-outline',
        keywords: ['unsigned', 'available'],
        href: '/apps/free-agents',
      },
      {
        id: 'scouting',
        label: 'Scouting',
        icon: 'eye-outline',
        keywords: ['scout', 'report', 'scouting'],
        href: '/apps/scouting',
      },
      {
        id: 'transfers',
        label: 'Transfers',
        icon: 'swap-horizontal-outline',
        keywords: ['transfer market', 'market', 'buy', 'sell'],
        href: '/apps/transfers',
      },
      {
        id: 'wallet',
        label: 'Wallet',
        icon: 'flash-outline',
        keywords: ['stc', 'money', 'coins'],
        href: '/apps/wallet',
      },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    items: [
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
      },
      {
        id: 'follow-back',
        label: 'Follow Back',
        icon: 'heart-outline',
        keywords: ['followers'],
        href: '/apps/follow-back',
      },
      {
        id: 'news',
        label: 'News',
        icon: 'document-text-outline',
        keywords: ['updates'],
        href: '/apps/news',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        id: 'home',
        label: 'Home',
        icon: 'home-outline',
        keywords: ['dashboard'],
        href: '/(tabs)/dashboard',
        ready: true,
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: 'person-outline',
        keywords: ['me', 'identity'],
        href: '/(tabs)/profile',
        ready: true,
      },
      {
        id: 'lifestyle',
        label: 'Lifestyle',
        icon: 'cafe-outline',
        keywords: ['assets', 'off pitch'],
        href: '/apps/lifestyle',
      },
      {
        id: 'store',
        label: 'Store',
        icon: 'bag-outline',
        keywords: ['shop'],
        href: '/apps/store',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings-outline',
        keywords: ['preferences', 'account'],
        href: '/apps/settings',
      },
    ],
  },
];

export const MINI_APP_GROUPS_PRESIDENT = [
  {
    id: 'match',
    label: 'Match',
    items: [
      {
        id: 'schedule',
        label: 'Schedule',
        icon: 'calendar-outline',
        keywords: ['calendar', 'fixtures'],
        href: '/apps/schedule',
      },
      {
        id: 'inbox',
        label: 'Inbox',
        icon: 'mail-outline',
        keywords: ['messages', 'offers'],
        href: '/apps/inbox',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: 'notifications-outline',
        keywords: ['alerts'],
        href: '/apps/notifications',
      },
      {
        id: 'matches',
        label: 'Matches',
        icon: 'football-outline',
        keywords: ['game day'],
        href: '/(tabs)/matches',
        ready: true,
      },
    ],
  },
  {
    id: 'club',
    label: 'Club',
    items: [
      {
        id: 'my-club',
        label: 'My Club',
        icon: 'shield-outline',
        keywords: ['office', 'manage'],
        href: '/(tabs)/profile',
        ready: true,
      },
      {
        id: 'find-players',
        label: 'Players',
        icon: 'people-outline',
        keywords: ['squad', 'directory'],
        href: '/(tabs)/search/searchplayer',
        ready: true,
      },
      {
        id: 'presidents',
        label: 'Presidents',
        icon: 'star-outline',
        keywords: ['owners'],
        href: '/apps/presidents',
      },
      {
        id: 'scouting',
        label: 'Scouting',
        icon: 'eye-outline',
        keywords: ['scout', 'scouting'],
        href: '/apps/scouting',
      },
      {
        id: 'transfers',
        label: 'Transfers',
        icon: 'swap-horizontal-outline',
        keywords: ['transfer market', 'market'],
        href: '/apps/transfers',
      },
      {
        id: 'contracts',
        label: 'Contracts',
        icon: 'document-text-outline',
        keywords: ['offers', 'wage'],
        href: '/apps/contracts',
      },
      {
        id: 'lifestyle',
        label: 'Lifestyle',
        icon: 'cafe-outline',
        keywords: ['assets'],
        href: '/apps/lifestyle',
      },
      {
        id: 'wallet',
        label: 'Wallet',
        icon: 'flash-outline',
        keywords: ['stc', 'money'],
        href: '/apps/wallet',
      },
    ],
  },
  {
    id: 'compete',
    label: 'Compete',
    items: [
      {
        id: 'tournaments',
        label: 'Tournaments',
        icon: 'trophy-outline',
        keywords: ['cup'],
        href: '/(tabs)/tournaments',
        ready: true,
      },
      {
        id: 'international',
        label: 'International',
        icon: 'globe-outline',
        keywords: ['nations'],
        href: '/apps/international',
      },
      {
        id: 'register',
        label: 'Register',
        icon: 'shield-checkmark-outline',
        keywords: ['league'],
        href: '/apps/register',
      },
      {
        id: 'rankings',
        label: 'Rankings',
        icon: 'stats-chart-outline',
        keywords: ['leaderboard'],
        href: '/apps/rankings',
      },
    ],
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        icon: 'person-outline',
        keywords: ['me'],
        href: '/(tabs)/profile',
        ready: true,
      },
      {
        id: 'feed',
        label: 'Feed',
        icon: 'newspaper-outline',
        keywords: ['social'],
        href: '/social',
        ready: true,
      },
      {
        id: 'find-clubs',
        label: 'Find Clubs',
        icon: 'search-outline',
        keywords: ['clubs', 'teams'],
        href: '/(tabs)/search/searchclubs',
        ready: true,
      },
      {
        id: 'news',
        label: 'News',
        icon: 'document-text-outline',
        keywords: ['updates'],
        href: '/apps/news',
      },
      {
        id: 'store',
        label: 'Store',
        icon: 'bag-outline',
        keywords: ['shop'],
        href: '/apps/store',
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings-outline',
        keywords: ['preferences'],
        href: '/apps/settings',
      },
    ],
  },
];

export function getMiniAppGroups(accountMode = 'player') {
  return accountMode === 'club' ? MINI_APP_GROUPS_PRESIDENT : MINI_APP_GROUPS_PLAYER;
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
  return all.find((item) => item.id === slug) || null;
}
