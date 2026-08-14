/**
 * Pop one screen. Never send the user to Home as a fallback.
 * If there is no history, stay on the current tab/page.
 */
export function goBackInPlace(router) {
  if (router && typeof router.canGoBack === 'function' && router.canGoBack()) {
    router.back();
    return 'back';
  }
  return 'stay';
}
