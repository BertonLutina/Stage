export function getOneSignalAppId() {
  return String(process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '').trim();
}

export function isOneSignalConfigured() {
  return Boolean(getOneSignalAppId());
}

export function pathFromNotificationData(data = {}) {
  const link = String(data.link || data.url || '').trim();
  if (!link) return '/apps/notifications';
  if (/inbox/i.test(link)) {
    const id = String(data.related_id || data.relatedId || '').trim();
    return id ? { pathname: '/apps/inbox/[id]', params: { id } } : '/apps/inbox';
  }
  if (/notification/i.test(link)) return '/apps/notifications';
  if (/game-?day|match/i.test(link)) {
    const matchId = String(data.match_id || data.matchId || data.related_id || '').trim();
    return matchId
      ? { pathname: '/(tabs)/matches/matchdetailscreen', params: { matchId } }
      : '/(tabs)/matches';
  }
  if (link.startsWith('/apps/')) return link;
  return '/apps/notifications';
}

export function getOneSignalNative() {
  try {
    return require('react-native-onesignal');
  } catch {
    return null;
  }
}

export function loginOneSignalUser(user) {
  const sdk = getOneSignalNative();
  const externalId = user?.id;
  if (!sdk?.OneSignal || !externalId) return false;
  sdk.OneSignal.login(String(externalId));
  if (user.email && sdk.OneSignal.User?.addEmail) {
    sdk.OneSignal.User.addEmail(String(user.email));
  }
  return true;
}

export function logoutOneSignalUser() {
  const sdk = getOneSignalNative();
  if (!sdk?.OneSignal) return false;
  sdk.OneSignal.logout();
  return true;
}
