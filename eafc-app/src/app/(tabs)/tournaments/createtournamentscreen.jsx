import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { resolveMyPlayerAndClub, stageClient } from '@/api/stageClient';
import DateTimeZoneFields from '@/components/matches/DateTimeZoneFields';
import { GAME_DAY_SILVER, FUT } from '@/components/dashboard/CommandCenterUI';
import {
  GamerProfileShell,
  GlassIconButton,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';
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

function OptionRow({ label, active, onPress, sub }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 64,
        padding: 12,
        borderWidth: 1,
        borderColor: active ? 'rgba(0,232,255,0.45)' : 'rgba(255,255,255,0.12)',
        backgroundColor: active ? 'rgba(0,232,255,0.1)' : 'rgba(255,255,255,0.04)',
      }}
    >
      <Text style={{ color: active ? '#fff' : 'rgba(255,255,255,0.8)', fontWeight: '900', fontSize: 13 }}>{label}</Text>
      {sub ? <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>{sub}</Text> : null}
    </TouchableOpacity>
  );
}

export default function CreateTournamentScreen() {
  const router = useRouter();
  const tokens = useGamerTokens();
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
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={GAME_DAY_SILVER} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <GlassIconButton icon="chevron-back" onPress={() => router.back()} />
              <View style={{ flex: 1 }}>
                <PageTitle title="CREATE CUP" subtitle="Community tournament · STAGE Plus" padded={false} />
              </View>
            </View>

            <PageTile tileKey="tournaments" tileTitle="CREATE CUP" contentStyle={{ paddingHorizontal: 12, gap: 16 }}>
              {!canCreate ? (
                <View style={{ gap: 10 }}>
                  <Text style={{ color: FUT.gold, fontSize: 13, fontWeight: '800' }}>STAGE Plus required</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 }}>
                    Creating a community cup costs {TOURNAMENT_CREDIT_COST} credits and needs an active STAGE Plus membership.
                  </Text>
                  <SilverPill label="View STAGE Plus" onPress={() => router.push('/apps/store')} />
                </View>
              ) : (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                    TOURNAMENT FOR
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
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

                  <Field label="Name *">
                    <TextInput
                      value={form.name}
                      onChangeText={(value) => setField('name', value)}
                      placeholder="Cup name"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Description">
                    <TextInput
                      value={form.description}
                      onChangeText={(value) => setField('description', value)}
                      placeholder="Optional"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      multiline
                      style={[inputStyle, { minHeight: 80, textAlignVertical: 'top' }]}
                    />
                  </Field>

                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                    FORMAT
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {['knockout', 'league', 'group_stage', 'swiss_ucl'].map((type) => (
                      <SilverPill
                        key={type}
                        label={getTournamentFormatRule(type).label}
                        active={form.type === type}
                        onPress={() => setForm((prev) => applyTournamentFormat(prev, type))}
                      />
                    ))}
                  </View>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>{formatRule.hint}</Text>

                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                    MAX TEAMS
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {maxTeamOptions.map((n) => (
                      <SilverPill
                        key={n}
                        label={String(n)}
                        active={String(form.max_teams) === String(n)}
                        onPress={() => setField('max_teams', String(n))}
                      />
                    ))}
                  </View>

                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                    PLATFORM
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {TOURNAMENT_PLATFORM_OPTIONS.map((platform) => (
                      <SilverPill
                        key={platform}
                        label={platform}
                        active={form.platform === platform}
                        onPress={() => setField('platform', platform)}
                      />
                    ))}
                  </View>

                  <Field label="Kickoff">
                    <DateTimeZoneFields
                      date={startDate}
                      time={startTime}
                      showTimezone={false}
                      onDateChange={setStartDate}
                      onTimeChange={setStartTime}
                    />
                  </Field>

                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
                    REGION
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {TOURNAMENT_REGION_OPTIONS.map((region) => (
                      <SilverPill
                        key={region}
                        label={region}
                        active={form.region === region}
                        onPress={() => setForm((prev) => ({ ...prev, region, country_code: '' }))}
                      />
                    ))}
                  </View>

                  {form.region !== 'Global' && countryOptions.length > 0 ? (
                    <Field label="Country (optional)">
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
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

                  <Field label="Entry fee (STC)">
                    <TextInput
                      value={String(form.entry_fee_stc)}
                      onChangeText={(value) => setField('entry_fee_stc', value)}
                      keyboardType="number-pad"
                      placeholder="1000"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      style={inputStyle}
                    />
                  </Field>

                  <View style={{
                    borderWidth: 1,
                    borderColor: 'rgba(0,232,255,0.2)',
                    backgroundColor: 'rgba(0,232,255,0.07)',
                    padding: 14,
                    gap: 8,
                  }}
                  >
                    <Row label="Create cost" value={`${TOURNAMENT_CREDIT_COST} credits`} />
                    <Row
                      label="Entry cost"
                      value={`${TOURNAMENT_CREDIT_COST} credits + ${prizeBreakdown.entryFee.toLocaleString()} STC`}
                    />
                    <Row label="Winner" value={`${prizeBreakdown.winner.toLocaleString()} STC`} />
                    <Row label="Runner-up" value={`${prizeBreakdown.runnerUp.toLocaleString()} STC`} />
                    <Row label="Third" value={`${prizeBreakdown.thirdPlace.toLocaleString()} STC`} />
                    <Row label="Prize pool" value={`${prizeBreakdown.pool.toLocaleString()} STC`} emphasize />
                  </View>

                  <Field label="Custom rules">
                    <TextInput
                      value={form.custom_rules}
                      onChangeText={(value) => setField('custom_rules', value)}
                      placeholder="Optional house rules"
                      placeholderTextColor="rgba(255,255,255,0.35)"
                      multiline
                      style={[inputStyle, { minHeight: 72, textAlignVertical: 'top' }]}
                    />
                  </Field>

                  {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}

                  <TouchableOpacity
                    onPress={create}
                    disabled={creating}
                    style={{
                      backgroundColor: GAME_DAY_SILVER,
                      paddingVertical: 14,
                      alignItems: 'center',
                      opacity: creating ? 0.6 : 1,
                    }}
                  >
                    {creating
                      ? <ActivityIndicator color="#041018" />
                      : <Text style={{ color: '#041018', fontWeight: '900' }}>Create tournament</Text>}
                  </TouchableOpacity>
                </>
              )}
            </PageTile>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}

function Field({ label, children }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
        {label.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Row({ label, value, emphasize }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{
        color: emphasize ? '#9ef7ff' : 'rgba(255,255,255,0.45)',
        fontSize: 12,
        fontWeight: emphasize ? '800' : '600',
      }}
      >
        {label}
      </Text>
      <Text style={{ color: emphasize ? '#9ef7ff' : '#fff', fontSize: 12, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}

const inputStyle = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 2,
  color: '#fff',
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 14,
};
