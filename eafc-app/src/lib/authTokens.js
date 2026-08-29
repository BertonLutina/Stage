/**
 * Stage auth refresh payloads have shipped as both
 * `{ accessToken, refreshToken }` and `{ data: { accessToken, refreshToken } }`.
 */
export function unwrapAuthTokens(payload) {
  const nested = payload?.data && typeof payload.data === 'object' ? payload.data : null;
  const accessToken = nested?.accessToken || payload?.accessToken || null;
  const refreshToken = nested?.refreshToken || payload?.refreshToken || null;
  return { accessToken, refreshToken };
}
