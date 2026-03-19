import useThemeStore from '../store/themeStore';

/**
 * Hook to get colors based on the current theme (light/dark).
 * Uses useThemeStore so theme is consistent with GradientBackground, ThemeToggle, etc.
 *
 * @returns {{ isDark: boolean; isLight: boolean; iconColor: string; iconColorSecondary: string; darklightImage: boolean }}
 */
export const useColorSchemeColors = () => {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const isDark = resolvedTheme === 'dark';
  const isLight = resolvedTheme === 'light';

  return {
    isDark,
    isLight,
    iconColor: isDark ? '#FFFFFF' : '#421702',
    iconColorSecondary: isDark ? '#E5E7EB' : '#000000',
    darklightImage: isDark,
  };
};

export default useColorSchemeColors;
