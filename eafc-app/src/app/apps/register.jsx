import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { Button, Card, IconButton, Screen, TextField } from '@/components/ui';
import RegistrationStatusPill from '@/components/apps/RegistrationStatusPill';
import PageTile, { PageTitle } from '@/components/theme/PageTile';
import { REGIONS } from '@/lib/qualificationConfig';
import { applyForLeague, ACTIVE_STATUSES } from '@/lib/registrationEngine';
import { loadSeasonRegistrations } from '@/lib/competitionSeason';
import { entityHasStagePlus } from '@/lib/subscriptionUtils';

export default function SeasonRegisterScreen() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const [myClub, setMyClub] = useState(null);
  const [presidentClub, setPresidentClub] = useState(null);
  const [user, setUser] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { user: u, club, presidentClub: ownedClub } = await resolveMyPlayerAndClub();
      setUser(u);
      setMyClub(club || null);
      setPresidentClub(ownedClub || null);
      const data = await loadSeasonRegistrations(u);
      setLeagues(data.leagues);
      setApps(data.myApps);
    } catch (err) {
      setError(err?.message || 'Failed to load registrations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const appByRegion = {};
  apps.forEach((app) => {
    if (ACTIVE_STATUSES.has(String(app.status || '').toLowerCase())) {
      appByRegion[app.region_slug] = app;
    }
  });

  const registrationClub = presidentClub || null;
  const plusOk = entityHasStagePlus(user);
  const isAdmin = user?.role === 'admin' || [0, 2].includes(Number(user?.role_id));
  const canApply = !!registrationClub && (plusOk || isAdmin);

  const submit = async () => {
    if (!registrationClub || !selected) return;
    setBusy(true);
    setError('');
    try {
      const regionLeagues = leagues.filter((l) => l.region_slug === selected.slug);
      await applyForLeague(
        registrationClub,
        selected.slug,
        selected.name,
        registrationClub.platform || 'Cross-Platform',
        {
          preferredDivision: 1,
          note: note.trim(),
          seasonLabel: regionLeagues[0] ? `Season ${regionLeagues[0].season_number}` : 'Season 1',
        },
      );
      setSelected(null);
      setNote('');
      await load();
    } catch (err) {
      setError(err?.message || 'Application failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      tabBar={false}
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) }}
      keyboardAvoiding
      refreshControl={loading ? undefined : (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor={tokens.cyan}
          colors={[tokens.cyan]}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
      </View>
      {loading ? (
        <ActivityIndicator color={tokens.cyan} style={{ marginTop: 40 }} />
      ) : (
        <>
          <PageTitle
            title="REGISTER"
            subtitle="Regional leagues"
            padded={false}
          />
          <PageTile
            tileKey="competitions"
            tileTitle="REGISTER"
            contentStyle={{ paddingHorizontal: 12, gap: 14 }}
          >
            {!registrationClub ? (
              <Card>
                <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
                  {myClub
                    ? 'Only the club president can apply for a regional league.'
                    : 'You need a club to apply for a regional league.'}
                </Text>
              </Card>
            ) : null}
            {registrationClub && !plusOk && !isAdmin ? (
              <Card style={{ gap: 12 }}>
                <Text style={{ color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>
                  STAGE Plus is required to enter STAGE regional leagues and official competitions.
                </Text>
                <Button
                  title="Open Store"
                  variant="secondary"
                  icon="storefront-outline"
                  onPress={() => router.push('/apps/store')}
                />
              </Card>
            ) : null}
            {error ? (
              <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text>
            ) : null}
            {REGIONS.map((region) => {
              const app = appByRegion[region.slug];
              return (
                <Card key={region.slug} style={{ gap: 12 }}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ color: tokens.text, fontSize: 16, fontWeight: '700' }}
                  >
                    {region.name}
                  </Text>
                  {app ? (
                    <RegistrationStatusPill status={app.status} />
                  ) : canApply ? (
                    <Button
                      title="Apply"
                      variant="secondary"
                      accessibilityLabel={`Apply for ${region.name}`}
                      onPress={() => setSelected(region)}
                    />
                  ) : (
                    <Text style={{ color: tokens.muted, fontSize: 13 }}>
                      Registration locked
                    </Text>
                  )}
                </Card>
              );
            })}
            {selected ? (
              <Card highlight style={{ gap: 12 }}>
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={{ color: tokens.text, fontSize: 16, fontWeight: '700' }}
                >
                  {`Apply · ${selected.name}`}
                </Text>
                <TextField
                  accessibilityLabel="Note to admin"
                  value={note}
                  onChangeText={setNote}
                  placeholder="Note to admin (optional)"
                />
                <Button
                  title="Send application"
                  onPress={submit}
                  loading={busy}
                />
              </Card>
            ) : null}
          </PageTile>
        </>
      )}
    </Screen>
  );
}
