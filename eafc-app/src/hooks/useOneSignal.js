import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  getOneSignalAppId,
  getOneSignalNative,
  isOneSignalConfigured,
  loginOneSignalUser,
  logoutOneSignalUser,
  pathFromNotificationData,
} from '@/lib/oneSignal';

let initialized = false;

export default function useOneSignal(user) {
  const router = useRouter();

  useEffect(() => {
    if (!isOneSignalConfigured()) return undefined;
    const sdk = getOneSignalNative();
    if (!sdk?.OneSignal) return undefined;

    if (!initialized) {
      initialized = true;
      try {
        sdk.OneSignal.initialize(getOneSignalAppId());
        sdk.OneSignal.Notifications.requestPermission(false);
      } catch {
        initialized = false;
      }
    }

    const clickListener = (event) => {
      const data = event?.notification?.additionalData || {};
      const target = pathFromNotificationData(data);
      if (typeof target === 'string') router.push(target);
      else router.push(target);
    };

    sdk.OneSignal.Notifications.addEventListener('click', clickListener);
    return () => {
      sdk.OneSignal.Notifications.removeEventListener('click', clickListener);
    };
  }, [router]);

  useEffect(() => {
    if (!isOneSignalConfigured()) return;
    if (user?.id) loginOneSignalUser(user);
    else logoutOneSignalUser();
  }, [user?.id, user?.email]);
}
