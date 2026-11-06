/**
 * Defaults for the account's saved "custom theme" fields (sent with `auth.updateMe`).
 * They are persisted profile data, not UI colours: the Settings screen has no custom-theme
 * editor any more (the custom theme maps to Dark), so these only round-trip the saved values.
 */
export const CUSTOM_THEME_DEFAULTS = Object.freeze({
  primaryColor: '#00d4ff',
  gradientColor: '#0099ff',
  backgroundColor: '#220e0e',
  backgroundOpacity: 0.95,
  textColor: '#ffffff',
  primaryTextColor: '#ffffff',
  secondaryTextColor: '#e0e0e0',
});
