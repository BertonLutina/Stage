import { useMemo } from 'react';
import useThemeStore from '@/store/themeStore';
import { headingStyle } from '@/lib/fonts';

/** Page gutter between stacked fields / blocks in an onboarding step. */
export const STEP_GAP = 16;

/**
 * Token-driven text styles shared by the onboarding steps. Colours come from the
 * Stage theme tokens (so Live Dark keeps working), never from literals.
 */
export function useOnboardingStyles() {
  const tokens = useThemeStore((s) => s.tokens);

  return useMemo(() => ({
    title: {
      ...headingStyle,
      color: tokens.text,
      fontSize: 38,
      lineHeight: 42,
      letterSpacing: 38 * 0.03,
    },
    subtitle: {
      color: tokens.muted,
      fontSize: 15,
      lineHeight: 22,
    },
    hint: {
      color: tokens.muted,
      fontSize: 13,
      lineHeight: 18,
    },
    error: {
      color: tokens.danger,
      fontSize: 13,
      lineHeight: 18,
    },
    linkText: {
      color: tokens.cyan,
      fontSize: 15,
      fontWeight: '600',
    },
    cardTitle: {
      color: tokens.text,
      fontSize: 16,
      fontWeight: '700',
    },
    cardBody: {
      color: tokens.muted,
      fontSize: 13,
      lineHeight: 18,
    },
  }), [tokens]);
}
