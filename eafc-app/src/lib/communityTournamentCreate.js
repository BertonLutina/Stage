import { isStageAdmin } from '@/lib/adminDisputes';
import { toMysqlDateTime } from '@/lib/momentDate';
import { entityHasStagePlus } from '@/lib/subscriptionUtils';
import {
  TOURNAMENT_CREDIT_COST,
  calculateTournamentPrizeBreakdown,
  normalizeTournamentMaxTeams,
} from '@/lib/tournamentRules';
import { encodeRulesTemplate, isTournamentRuleTemplate } from '@/lib/tournamentRuleTemplates';

export const TOURNAMENT_REGION_OPTIONS = [
  'Global',
  'Europe',
  'North America',
  'South America',
  'Asia',
  'Oceania',
  'Africa',
  'Middle East',
];

export const TOURNAMENT_PLATFORM_OPTIONS = ['PlayStation', 'Xbox', 'PC', 'Cross-Platform'];

export const DEFAULT_TOURNAMENT_FORM = {
  name: '',
  description: '',
  type: 'knockout',
  platform: 'PlayStation',
  region: 'Global',
  country_code: '',
  max_teams: '8',
  start_date: '',
  entry_fee_stc: '1000',
  banner_url: '',
  banner_color: '#0d1830',
  banner_position: '50% 50%',
  participant_type: 'club',
  rules_template_id: 'standard_cup',
  custom_rules: '',
  rules_file_url: '',
  trophy_item_id: '',
};

export function canCreateCommunityTournament({ user, player } = {}) {
  if (isStageAdmin(user)) return true;
  return entityHasStagePlus(player);
}

export function assertCanCreateCommunityTournament({ user, player } = {}) {
  if (canCreateCommunityTournament({ user, player })) return;
  throw new Error('STAGE Plus is required to create a community tournament.');
}

export function buildCommunityTournamentPayload({
  form,
  user,
  player,
  trophyItems = [],
} = {}) {
  const maxTeams = normalizeTournamentMaxTeams(form?.type, form?.max_teams);
  const prizes = calculateTournamentPrizeBreakdown(form?.entry_fee_stc, maxTeams);
  const selectedTrophy = (trophyItems || []).find((item) => String(item.id) === String(form?.trophy_item_id));
  const admin = isStageAdmin(user);
  const rulesTemplateId = isTournamentRuleTemplate(form?.rules_template_id)
    ? form.rules_template_id
    : 'standard_cup';
  // The template id is the only rules content we store. custom_rules keeps a
  // marker so the choice survives until the API has a rules_template_id column.
  // The legal text is rendered later from the live tournament fields.
  return {
    ...(form || {}),
    name: admin ? `By STAGE · ${form?.name || ''}`.trim() : (form?.name || ''),
    rules_template_id: rulesTemplateId,
    custom_rules: encodeRulesTemplate(rulesTemplateId),
    max_teams: maxTeams,
    entry_credits: TOURNAMENT_CREDIT_COST,
    entry_fee_stc: prizes.entryFee,
    prize_pool_stc: prizes.pool,
    prize_winner_stc: prizes.winner,
    prize_runner_up_stc: prizes.runnerUp,
    prize_semi_final_stc: prizes.thirdPlace,
    prize_participation_stc: 0,
    prize_description: '',
    organizer_email: user?.email || null,
    creator_email: user?.email || null,
    creator_id: player?.id || null,
    creator_gamertag: admin ? null : (player?.gamertag || null),
    start_date: toMysqlDateTime(form?.start_date),
    registered_clubs: [],
    status: 'registration',
    trophy_item_id: form?.trophy_item_id || null,
    trophy_url: selectedTrophy?.image_url || '',
  };
}
