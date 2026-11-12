/**
 * Mobile Apps catalog — destinations that do not belong in the native tabs.
 * Layout groups match `docs/design/stage-mockups/5-apps/Apps` (Club / Compete / Account).
 * Game Day, Tournaments, Home, Profile stay in the bottom tabs; Compete tiles deep-link in.
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

const CLUB_ITEMS = [
  {
    id: 'my-club',
    label: 'My club',
    icon: 'shield-outline',
    keywords: ['club', 'my club', 'squad'],
    href: 'my-club',
    ready: true,
  },
  {
    id: 'inbox',
    label: 'Inbox',
    icon: 'file-tray-outline',
    keywords: ['messages', 'offers', 'contracts', 'notifications'],
    href: '/apps/inbox',
    ready: true,
  },
  {
    id: 'transfers',
    label: 'Transfers',
    icon: 'swap-horizontal-outline',
    keywords: ['transfers', 'mercato', 'transfer market', 'market', 'buy', 'sell'],
    href: '/apps/transfers',
    ready: true,
  },
  {
    id: 'find-players',
    label: 'Find players',
    icon: 'person-add-outline',
    keywords: ['search players', 'directory', 'market'],
    href: '/apps/find-players',
    ready: true,
  },
];

const COMPETE_ITEMS = [
  {
    id: 'competitions',
    label: 'Competitions',
    icon: 'trophy-outline',
    keywords: ['competitions', 'gost', 'cups'],
    href: '/apps/competitions',
    ready: true,
  },
  {
    id: 'leagues',
    label: 'Leagues',
    icon: 'list-outline',
    keywords: ['leagues', 'standings', 'rankings'],
    href: '/(tabs)/tournaments',
    keepOnNativeTab: true,
    ready: true,
  },
  {
    id: 'find-clubs',
    label: 'Find clubs',
    icon: 'search-outline',
    keywords: ['search clubs', 'directory', 'club'],
    href: '/apps/find-clubs',
    ready: true,
  },
  {
    id: 'register',
    label: 'Register',
    icon: 'clipboard-outline',
    keywords: ['season', 'registration', 'register'],
    href: '/apps/register',
    ready: true,
  },
];

const ACCOUNT_ITEMS = [
  {
    id: 'wallet',
    label: 'Wallet',
    icon: 'card-outline',
    keywords: ['stc', 'money', 'coins'],
    href: '/apps/wallet',
    ready: true,
  },
  {
    id: 'store',
    label: 'Store',
    icon: 'bag-outline',
    keywords: ['shop', 'stage plus', 'credits'],
    href: '/apps/store',
    ready: true,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'options-outline',
    keywords: ['preferences', 'account', 'theme'],
    href: '/apps/settings',
    ready: true,
  },
  {
    id: 'news',
    label: 'News',
    icon: 'newspaper-outline',
    keywords: ['stage times', 'headlines', 'mercato', 'press', 'world'],
    href: '/apps/news',
    ready: true,
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    icon: 'diamond-outline',
    keywords: ['assets', 'rent', 'invest', 'passive income', 'stc'],
    href: '/apps/lifestyle',
    ready: true,
  },
];

export const MINI_APP_GROUPS_PLAYER = [
  { id: 'club', label: 'Club', items: CLUB_ITEMS },
  { id: 'compete', label: 'Compete', items: COMPETE_ITEMS },
  { id: 'account', label: 'Account', items: ACCOUNT_ITEMS },
];

export const MINI_APP_GROUPS_PRESIDENT = MINI_APP_GROUPS_PLAYER;

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
        ].join(' ').toLowerCase();
        return hay.includes(q);
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export function findMiniApp(slug) {
  const id = String(slug || '').trim().toLowerCase();
  if (!id) return null;
  for (const group of getMiniAppGroups('player')) {
    const hit = group.items.find((item) => item.id === id || item.href?.endsWith(`/${id}`));
    if (hit) return hit;
  }
  return null;
}
