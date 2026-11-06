import { hexToRgba } from '@/lib/stageTheme';

/**
 * Transfer hub chrome derived from the Stage tokens. The hub used to carry its own
 * silver palette; it now shares the cyan frames of the directory photo cards.
 */
export function transferHubTheme(tokens) {
  return {
    accent: tokens.cyan,
    hairline: tokens.border,
    frameFocused: [tokens.cyanHi, tokens.cyan, tokens.aqua],
    frameIdle: [
      hexToRgba(tokens.cyan, 0.45),
      hexToRgba(tokens.cyan, 0.16),
      hexToRgba(tokens.cyan, 0.08),
    ],
    ovrBadge: [tokens.cyanHi, tokens.cyan],
    photoShade: ['transparent', hexToRgba(tokens.bgDeep, 0.18), hexToRgba(tokens.bgDeep, 0.88)],
  };
}
