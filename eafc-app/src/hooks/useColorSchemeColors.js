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
    iconColor: isDark ? '#E2EAF4' : '#0B1A3A',
    iconColorSecondary: isDark ? '#C5D0DC' : '#0B1A3A',
    darklightImage: isDark,
  };
};

export default useColorSchemeColors;
