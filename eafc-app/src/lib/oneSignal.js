import { NOTIFICATION_SETTINGS, isSettingOn } from './notificationTypes';

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

export async function getNativePushStatus() {
  if (!isOneSignalConfigured()) {
    return { configured: false, permission: false, optedIn: false };
  }
  const sdk = getOneSignalNative();
  const notifications = sdk?.OneSignal?.Notifications;
  const subscription = sdk?.OneSignal?.User?.pushSubscription;
  if (!notifications) {
    return { configured: true, permission: false, optedIn: false };
  }

  let permission = false;
  try {
    if (typeof notifications.getPermissionAsync === 'function') {
      permission = Boolean(await notifications.getPermissionAsync());
    } else if (typeof notifications.hasPermission === 'function') {
      permission = Boolean(notifications.hasPermission());
    }
  } catch {
    permission = false;
  }

  let optedIn = permission;
  try {
    if (typeof subscription?.getOptedInAsync === 'function') {
      optedIn = Boolean(await subscription.getOptedInAsync());
    } else if (typeof subscription?.optedIn === 'boolean') {
      optedIn = subscription.optedIn;
    }
  } catch {
    optedIn = permission;
  }

  return { configured: true, permission, optedIn };
}

export async function setNativePushEnabled(enabled) {
  const sdk = getOneSignalNative();
  if (!isOneSignalConfigured() || !sdk?.OneSignal) {
    return { ok: false, configured: false, permission: false };
  }
  if (enabled) {
    let permission = false;
    try {
      permission = Boolean(await sdk.OneSignal.Notifications.requestPermission(true));
    } catch {
      permission = false;
    }
    try {
      sdk.OneSignal.User?.pushSubscription?.optIn?.();
    } catch {
      /* ignore */
    }
    return { ok: true, configured: true, permission };
  }
  try {
    sdk.OneSignal.User?.pushSubscription?.optOut?.();
  } catch {
    /* ignore */
  }
  return { ok: true, configured: true, permission: false };
}

export function syncOneSignalTags(settings = {}) {
  const sdk = getOneSignalNative();
  if (!sdk?.OneSignal?.User?.addTags) return false;
  const tags = {};
  NOTIFICATION_SETTINGS.forEach((row) => {
    tags[row.key] = isSettingOn(settings, row.key) ? 'true' : 'false';
  });
  sdk.OneSignal.User.addTags(tags);
  return true;
}
