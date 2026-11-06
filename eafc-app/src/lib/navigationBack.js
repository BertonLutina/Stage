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

/** Pop one screen; with no history (deep link, restored session) replace with `fallbackHref` instead. */
export function goBackOr(router, fallbackHref) {
  if (router && typeof router.canGoBack === 'function' && router.canGoBack()) {
    router.back();
    return 'back';
  }
  router?.replace?.(fallbackHref);
  return 'replaced';
}
