import { Platform } from 'react-native';

/**
 * Android system navigation bar (3 buttons / gesture pill).
 * iOS has no equivalent; calls are no-ops there.
 */
async function withNavBar(run) {
  if (Platform.OS !== 'android') return null;
  try {
    const NavigationBar = await import('expo-navigation-bar');
    return run(NavigationBar);
  } catch {
    return null;
  }
}

/** Hide the Android system nav bar. Swipe from the edge briefly reveals it (sticky immersive). */
export function hideAndroidNavigationBar() {
  return withNavBar(async (NavigationBar) => {
    await NavigationBar.setVisibilityAsync('hidden');
    if (typeof NavigationBar.setBehaviorAsync === 'function') {
      await NavigationBar.setBehaviorAsync('overlay-swipe');
    }
    return true;
  });
}

/** Show the Android system nav bar again. */
export function showAndroidNavigationBar() {
  return withNavBar(async (NavigationBar) => {
    await NavigationBar.setVisibilityAsync('visible');
    return true;
  });
}
