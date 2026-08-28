/**
 * Mobile Apps catalog — only destinations that belong on the phone.
 * Game Day, Tournaments, Home, and Profile stay in the bottom tabs.
 * GOST / regional leagues / register live on the Tournaments tab.
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

const DISCOVER_ITEMS = [
  {
    id: 'find-players',
    label: 'Find Players',
    icon: 'people-outline',
    keywords: ['search players', 'directory', 'market'],
    href: '/apps/find-players',
    ready: true,
  },
  {
    id: 'find-clubs',
    label: 'Find Clubs',
    icon: 'shield-outline',
    keywords: ['search clubs', 'directory', 'club'],
    href: '/apps/find-clubs',
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
];

const ACCOUNT_ITEMS = [
  {
    id: 'inbox',
    label: 'Inbox',
    icon: 'mail-outline',
    keywords: ['messages', 'offers', 'contracts', 'notifications'],
    href: '/apps/inbox',
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
    id: 'wallet',
    label: 'Wallet',
    icon: 'flash-outline',
    keywords: ['stc', 'money', 'coins'],
    href: '/apps/wallet',
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
  { id: 'discover', label: 'Discover', items: DISCOVER_ITEMS },
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
