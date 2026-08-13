import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import { FUT, SectionCard } from '@/components/dashboard/CommandCenterUI';
import { REGIONS } from '@/lib/qualificationConfig';
import { applyForLeague, ACTIVE_STATUSES } from '@/lib/registrationEngine';
import { loadSeasonRegistrations } from '@/lib/competitionSeason';

export default function SeasonRegisterScreen() {
  const router = useRouter();
  const [myClub, setMyClub] = useState(null);
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
    const { user: u, club } = await resolveMyPlayerAndClub();
    setUser(u);
    setMyClub(club || null);
    const data = await loadSeasonRegistrations(u);
    setLeagues(data.leagues);
    setApps(data.myApps);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const appByRegion = {};
  apps.forEach((app) => {
    if (ACTIVE_STATUSES.has(String(app.status || '').toLowerCase())) {
      appByRegion[app.region_slug] = app;
    }
  });

  const submit = async () => {
    if (!myClub || !selected) return;
    setBusy(true);
    setError('');
    try {
      const regionLeagues = leagues.filter((l) => l.region_slug === selected.slug);
      await applyForLeague(
        myClub,
        selected.slug,
        selected.name,
        myClub.platform || 'Cross-Platform',
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
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '900', marginLeft: 12 }}>SEASON REGISTER</Text>
        </View>
        {loading ? (
          <ActivityIndicator color={CYAN} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={CYAN} />}
          >
            {!myClub ? (
              <SectionCard>
                <Text style={{ color: 'rgba(255,255,255,0.55)' }}>You need a club to apply for a regional league.</Text>
              </SectionCard>
            ) : null}
            {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}
            {REGIONS.map((region) => {
              const app = appByRegion[region.slug];
              return (
                <SectionCard key={region.slug}>
                  <Text style={{ color: '#fff', fontWeight: '900' }}>{region.name}</Text>
                  {app ? (
                    <Text style={{ color: FUT.gold, marginTop: 6, fontSize: 12, fontWeight: '800' }}>
                      {String(app.status).toUpperCase()}
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={() => setSelected(region)} style={{ marginTop: 8 }}>
                      <Text style={{ color: CYAN, fontWeight: '800' }}>Apply</Text>
                    </TouchableOpacity>
                  )}
                </SectionCard>
              );
            })}
            {selected ? (
              <SectionCard>
                <Text style={{ color: '#fff', fontWeight: '800' }}>Apply · {selected.name}</Text>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="Note to admin (optional)"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={{
                    marginTop: 10,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    color: '#fff',
                    padding: 10,
                  }}
                />
                <TouchableOpacity
                  onPress={submit}
                  disabled={busy}
                  style={{ backgroundColor: CYAN, borderRadius: 12, paddingVertical: 12, marginTop: 10, alignItems: 'center' }}
                >
                  {busy ? <ActivityIndicator color="#041018" /> : <Text style={{ color: '#041018', fontWeight: '900' }}>Send application</Text>}
                </TouchableOpacity>
              </SectionCard>
            ) : null}
          </ScrollView>
        )}
      </SafeAreaView>
    </GamerProfileShell>
  );
}
