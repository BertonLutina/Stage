import { getCoreTranslations } from '@/translations';
import { PAGE_GUIDE_STEPS_EN } from './pageWalkthroughCopy';

const ROUTES = [
  { test: /\/apps\/inbox/, key: 'inbox' },
  { test: /\/apps\/schedule/, key: 'schedule' },
  { test: /\/apps\/news/, key: 'news' },
  { test: /\/apps\/wallet/, key: 'wallet' },
  { test: /\/apps\/transfers/, key: 'transfers' },
  { test: /\/apps\/free-agents/, key: 'freeAgents' },
  { test: /\/apps\/scouting/, key: 'scouting' },
  { test: /\/apps\/rankings/, key: 'rankings' },
  { test: /\/apps\/lifestyle/, key: 'lifestyle' },
  { test: /\/apps\/store/, key: 'store' },
  { test: /\/apps\/presidents/, key: 'presidents' },
  { test: /\/apps\/find-players/, key: 'players' },
  { test: /\/apps\/find-clubs/, key: 'club' },
  { test: /\/apps\/club/, key: 'club' },
  { test: /\/apps\/competitions/, key: 'compete' },
  { test: /\/apps\/register/, key: 'register' },
  { test: /\/apps\/international/, key: 'international' },
  { test: /\/apps\/discord/, key: 'discord' },
  { test: /\/apps\/follow-back/, key: 'followBack' },
  { test: /\/apps\/contracts/, key: 'contracts' },
  { test: /\/social/, key: 'feed' },
  { test: /\/tournaments/, key: 'tournaments' },
  { test: /\/matches/, key: 'matches' },
  { test: /\/profile/, key: 'profile' },
  { test: /\/search/, key: 'search' },
  { test: /\/dashboard/, key: 'dashboard' },
];

const HIDDEN = /\/auth|\/settings|\/onboarding/;

export function getPageWalkthrough(pathname, language = 'en') {
  const path = String(pathname || '');
  if (!path || HIDDEN.test(path)) return null;
  const match = ROUTES.find((row) => row.test.test(path));
  if (!match) return null;
  const dict = getCoreTranslations(language) || getCoreTranslations('en') || {};
  const translated = dict.walkthrough?.[match.key];
  const steps = Array.isArray(translated?.steps) && translated.steps.length >= 6
    ? translated.steps
    : (PAGE_GUIDE_STEPS_EN[match.key] || []);
  if (!steps.length) return null;
  return {
    key: match.key,
    label: translated?.label || match.key,
    title: translated?.title || match.key,
    steps,
  };
}
