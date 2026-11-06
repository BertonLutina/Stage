import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import DateTimeZoneFields from '@/components/matches/DateTimeZoneFields';
import useThemeStore from '@/store/themeStore';
import { Button, Card, IconButton, Screen, SectionLabel, TextField } from '@/components/ui';
import PageTile, { PageTitle, SilverPill } from '@/components/theme/PageTile';
import { combineDateTimeToMysql } from '@/lib/arrangeGame';
import {
  DEFAULT_TOURNAMENT_FORM,
  TOURNAMENT_PLATFORM_OPTIONS,
  TOURNAMENT_REGION_OPTIONS,
  assertCanCreateCommunityTournament,
  buildCommunityTournamentPayload,
  canCreateCommunityTournament,
} from '@/lib/communityTournamentCreate';
import { COUNTRIES, COUNTRY_REGIONS } from '@/lib/countries';
import {
  applyTournamentFormat,
  calculateTournamentPrizeBreakdown,
  getTournamentFormatRule,
  getTournamentMaxTeamOptions,
  TOURNAMENT_CREDIT_COST,
} from '@/lib/tournamentRules';
import {
  isTournamentRuleTemplate,
  listTournamentRuleTemplates,
  readAppLanguage,
  renderTournamentRules,
} from '@/lib/tournamentRuleTemplates';
import { isStageAdmin } from '@/lib/adminDisputes';

const FORMAT_ICON = {
  knockout: 'git-network-outline',
  league: 'list-outline',
  group_stage: 'grid-outline',
  swiss_ucl: 'swap-horizontal-outline',
};

function OptionRow({ label, active, onPress, sub }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <Card
      highlight={active}
      onPress={onPress}
      accessibilityLabel={sub ? `${label}, ${sub}` : label}
      style={{ flex: 1, minHeight: 64, padding: 12, justifyContent: 'center' }}
    >
      <Text numberOfLines={1} style={{ color: active ? tokens.text : tokens.textSoft, fontWeight: '700', fontSize: 15 }}>
        {label}
      </Text>
      {sub ? (
        <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>{sub}</Text>
      ) : null}
    </Card>
  );
}

function FormatTile({ label, icon, active, onPress }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <Card
      highlight={active}
      onPress={onPress}
      accessibilityLabel={label}
      style={{ flexBasis: '47%', flexGrow: 1, minHeight: 64, paddingVertical: 14, paddingHorizontal: 8 }}
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Ionicons name={icon} size={22} color={active ? tokens.cyan : tokens.textSoft} />
        <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 13, fontWeight: '700' }}>{label}</Text>
      </View>
    </Card>
  );
}

export default function CreateTournamentScreen() {
  const router = useRouter();
  const tokens = useThemeStore((st) => st.tokens);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [form, setForm] = useState(DEFAULT_TOURNAMENT_FORM);
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('21:00');

  const canCreate = canCreateCommunityTournament({ user, player });
  const formatRule = getTournamentFormatRule(form.type);
  const maxTeamOptions = getTournamentMaxTeamOptions(form.type);
  const prizeBreakdown = calculateTournamentPrizeBreakdown(form.entry_fee_stc, form.max_teams);
  const countryOptions = useMemo(() => {
    const codes = COUNTRY_REGIONS[form.region] || [];
    return COUNTRIES.filter((country) => codes.includes(country.code));
  }, [form.region]);
  const ruleLanguage = readAppLanguage();
  const ruleTemplates = listTournamentRuleTemplates(ruleLanguage);
  const rulesPreview = useMemo(() => {
    const previewName = isStageAdmin(user)
      ? `By STAGE · ${form.name || ''}`.trim()
      : (form.name || '');
    return renderTournamentRules(form.rules_template_id, {
      ...form,
      name: previewName,
      start_date: combineDateTimeToMysql(startDate, startTime) || form.start_date,
      entry_credits: TOURNAMENT_CREDIT_COST,
      entry_fee_stc: prizeBreakdown.entryFee,
      prize_pool_stc: prizeBreakdown.pool,
      prize_winner_stc: prizeBreakdown.winner,
      prize_runner_up_stc: prizeBreakdown.runnerUp,
      prize_semi_final_stc: prizeBreakdown.thirdPlace,
      organizer_email: user?.email,
      creator_gamertag: isStageAdmin(user) ? null : player?.gamertag,
    }, ruleLanguage);
  }, [form, player, prizeBreakdown, ruleLanguage, startDate, startTime, user]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resolved = await resolveMyPlayerAndClub();
        if (cancelled) return;
        setUser(resolved?.user || null);
        setPlayer(resolved?.player || null);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load your profile');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const create = async () => {
    const name = String(form.name || '').trim();
    const start_date = combineDateTimeToMysql(startDate, startTime);
    if (!name) {
      setError('Name is required.');
      return;
    }
    if (!start_date) {
      setError('Pick a start date and time.');
      return;
    }
    if (!isTournamentRuleTemplate(form.rules_template_id)) {
      setError('Choose a rules template.');
      return;
    }
    setCreating(true);
    setError('');
    try {
      assertCanCreateCommunityTournament({ user, player });
      const payload = buildCommunityTournamentPayload({
        form: { ...form, name, start_date },
        user,
        player,
      });
      const created = await stageClient.entities.Tournament.create(payload);
      const tournamentId = created?.id;
      if (tournamentId) {
        router.replace({
          pathname: '/(tabs)/tournaments/tournamentdetailscreen',
          params: { tournamentId },
        });
        return;
      }
      router.replace('/(tabs)/tournaments');
    } catch (err) {
      setError(err?.message || 'Failed to create tournament');
      Alert.alert('Could not create tournament', err?.message || 'Unknown error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={tokens.cyan} size="large" />
        </View>
      </Screen>
    );
  }

  const chipRow = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };

  return (
    <Screen keyboardAvoiding>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <IconButton icon="close" accessibilityLabel="Close" onPress={() => router.back()} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <PageTitle
              title="CREATE CUP"
              subtitle="Community tournament · STAGE Plus"
              padded={false}
              style={{ paddingBottom: 0 }}
            />
          </View>
        </View>

        <PageTile tileKey="tournaments" tileTitle="CREATE CUP" contentStyle={{ paddingHorizontal: 12, gap: 16 }}>
          {!canCreate ? (
            <View style={{ gap: 10 }}>
              <Text style={{ color: tokens.warning, fontSize: 15, fontWeight: '700' }}>STAGE Plus required</Text>
              <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
                Creating a community cup costs {TOURNAMENT_CREDIT_COST} credits and needs an active STAGE Plus membership.
              </Text>
              <View style={{ flexDirection: 'row' }}>
                <SilverPill label="View STAGE Plus" onPress={() => router.push('/apps/store')} />
              </View>
            </View>
          ) : (
            <>
              <View style={{ gap: 10 }}>
                <SectionLabel>Tournament for</SectionLabel>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <OptionRow
                    label="Clubs"
                    sub="Clubs compete"
                    active={form.participant_type === 'club'}
                    onPress={() => setField('participant_type', 'club')}
                  />
                  <OptionRow
                    label="Players"
                    sub="Players register"
                    active={form.participant_type === 'player'}
                    onPress={() => setField('participant_type', 'player')}
                  />
                </View>
              </View>

              <TextField
                label="Name *"
                value={form.name}
                onChangeText={(value) => setField('name', value)}
                placeholder="Cup name"
              />

              <TextField
                label="Description"
                value={form.description}
                onChangeText={(value) => setField('description', value)}
                placeholder="Optional"
                multiline
              />

              <View style={{ gap: 10 }}>
                <SectionLabel>Format</SectionLabel>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {['knockout', 'league', 'group_stage', 'swiss_ucl'].map((type) => (
                    <FormatTile
                      key={type}
                      label={getTournamentFormatRule(type).label}
                      icon={FORMAT_ICON[type]}
                      active={form.type === type}
                      onPress={() => setForm((prev) => applyTournamentFormat(prev, type))}
                    />
                  ))}
                </View>
                <Text style={{ color: tokens.muted, fontSize: 13 }}>{formatRule.hint}</Text>
              </View>

              <View style={{ gap: 10 }}>
                <SectionLabel>Max teams</SectionLabel>
                <View style={chipRow}>
                  {maxTeamOptions.map((n) => (
                    <SilverPill
                      key={n}
                      label={String(n)}
                      active={String(form.max_teams) === String(n)}
                      onPress={() => setField('max_teams', String(n))}
                    />
                  ))}
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <SectionLabel>Platform</SectionLabel>
                <View style={chipRow}>
                  {TOURNAMENT_PLATFORM_OPTIONS.map((platform) => (
                    <SilverPill
                      key={platform}
                      label={platform}
                      active={form.platform === platform}
                      onPress={() => setField('platform', platform)}
                    />
                  ))}
                </View>
              </View>

              <Field label="Kickoff">
                <DateTimeZoneFields
                  date={startDate}
                  time={startTime}
                  timezone="UTC"
                  showTimezone={false}
                  onDateChange={setStartDate}
                  onTimeChange={setStartTime}
                />
              </Field>

              <View style={{ gap: 10 }}>
                <SectionLabel>Region</SectionLabel>
                <View style={chipRow}>
                  {TOURNAMENT_REGION_OPTIONS.map((region) => (
                    <SilverPill
                      key={region}
                      label={region}
                      active={form.region === region}
                      onPress={() => setForm((prev) => ({ ...prev, region, country_code: '' }))}
                    />
                  ))}
                </View>
              </View>

              {form.region !== 'Global' && countryOptions.length > 0 ? (
                <Field label="Country (optional)">
                  <View style={chipRow}>
                    <SilverPill
                      label="All countries"
                      active={!form.country_code}
                      onPress={() => setField('country_code', '')}
                    />
                    {countryOptions.slice(0, 12).map((country) => (
                      <SilverPill
                        key={country.code}
                        label={country.name}
                        active={form.country_code === country.code}
                        onPress={() => setField('country_code', country.code)}
                      />
                    ))}
                  </View>
                </Field>
              ) : null}

              <TextField
                label="Entry fee (STC)"
                value={String(form.entry_fee_stc)}
                onChangeText={(value) => setField('entry_fee_stc', value)}
                keyboardType="number-pad"
                placeholder="1000"
              />

              <Card highlight style={{ gap: 8 }}>
                <Row label="Create cost" value={`${TOURNAMENT_CREDIT_COST} credits`} />
                <Row
                  label="Entry cost"
                  value={`${TOURNAMENT_CREDIT_COST} credits + ${prizeBreakdown.entryFee.toLocaleString()} STC`}
                />
                <Row label="Winner" value={`${prizeBreakdown.winner.toLocaleString()} STC`} />
                <Row label="Runner-up" value={`${prizeBreakdown.runnerUp.toLocaleString()} STC`} />
                <Row label="Third" value={`${prizeBreakdown.thirdPlace.toLocaleString()} STC`} />
                <Row label="Prize pool" value={`${prizeBreakdown.pool.toLocaleString()} STC`} emphasize />
              </Card>

              <Field label="Rules template">
                <View style={chipRow}>
                  {ruleTemplates.map((template) => (
                    <SilverPill
                      key={template.id}
                      label={template.title}
                      active={form.rules_template_id === template.id}
                      onPress={() => setField('rules_template_id', template.id)}
                    />
                  ))}
                </View>
                <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 18 }}>
                  {ruleTemplates.find((template) => template.id === form.rules_template_id)?.summary}
                </Text>
                <View style={{
                  borderWidth: 1,
                  borderColor: tokens.border,
                  borderRadius: 12,
                  backgroundColor: tokens.bgDeep,
                  padding: 14,
                }}
                >
                  <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15, marginBottom: 8 }}>{rulesPreview.title}</Text>
                  <Text style={{ color: tokens.textSoft, fontSize: 13, lineHeight: 19 }}>
                    {rulesPreview.body}
                  </Text>
                </View>
              </Field>

              {error ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text> : null}

              <Button title="Create tournament" onPress={create} loading={creating} />
            </>
          )}
        </PageTile>
      </View>
    </Screen>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ gap: 10 }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </View>
  );
}

function Row({ label, value, emphasize }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{
        color: emphasize ? tokens.cyanHi : tokens.muted,
        fontSize: 13,
        fontWeight: emphasize ? '700' : '600',
      }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{ flexShrink: 1, color: emphasize ? tokens.cyanHi : tokens.text, fontSize: 13, fontWeight: '700' }}
      >
        {value}
      </Text>
    </View>
  );
}
