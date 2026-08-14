import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StatusBar,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadScheduleData } from '@/lib/scheduleData';
import ScheduleCalendar from '@/components/schedule/ScheduleCalendar';
import ScheduleFixturesList from '@/components/schedule/ScheduleFixturesList';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';
import {
  PitchAtmosphere,
  FUT,
} from '@/components/dashboard/CommandCenterUI';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

/**
 * Schedule mini-app — Calendar-first Fixtures + Calendar (web /schedule).
 */
export default function ScheduleScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('calendar'); // calendar | fixtures

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await loadScheduleData();
      setEvents(data.events || []);
    } catch (err) {
      setEvents([]);
      setError(err?.message || 'Failed to load schedule');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await load();
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openMatch = (event) => {
    if (!event?.id || event.type !== 'match') return;
    router.push({
      pathname: '/(tabs)/matches/matchdetailscreen',
      params: { matchId: event.id },
    });
  };

  if (loading && !refreshing) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={CYAN} size="large" />
        </View>
      </GamerProfileShell>
    );
  }

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
          <View style={{ flex: 1 }}>
            <Text style={[headingStyleSm, { color: FUT.cyan, fontSize: 10, letterSpacing: 2.5 }]}>
              STAGE
            </Text>
            <Text style={[headingStyle, { color: '#fff', marginTop: 2 }]}>Schedule</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 120, gap: 14 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={CYAN} />
          }
        >
          <PitchAtmosphere
            style={{
              borderWidth: 1.5,
              borderColor: 'rgba(0,232,255,0.35)',
              shadowColor: FUT.cyan,
              shadowOpacity: 0.3,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 10,
            }}
          >
            <View style={{ padding: 16 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 18 }}>
                All matches, tournaments & contract reminders.
              </Text>
              <View style={{
                marginTop: 14,
                flexDirection: 'row',
                alignSelf: 'flex-start',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: 'rgba(0,232,255,0.28)',
                backgroundColor: 'rgba(0,0,0,0.28)',
                padding: 3,
                gap: 4,
              }}
              >
                <ToggleChip
                  label="Calendar"
                  icon="calendar"
                  active={view === 'calendar'}
                  onPress={() => setView('calendar')}
                />
                <ToggleChip
                  label="Fixtures"
                  icon="list"
                  active={view === 'fixtures'}
                  onPress={() => setView('fixtures')}
                />
              </View>
            </View>
          </PitchAtmosphere>

          {error ? (
            <View style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,77,109,0.4)',
              backgroundColor: 'rgba(255,77,109,0.1)',
              padding: 12,
            }}
            >
              <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>
              <TouchableOpacity onPress={load} style={{ marginTop: 8 }}>
                <Text style={{ color: CYAN, fontWeight: '800', fontSize: 12 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {view === 'calendar' ? (
            <ScheduleCalendar events={events} onOpenMatch={openMatch} />
          ) : (
            <ScheduleFixturesList events={events} onOpenMatch={openMatch} />
          )}
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}

function ToggleChip({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
        backgroundColor: active ? 'rgba(0,232,255,0.2)' : 'transparent',
      }}
    >
      <Ionicons name={icon} size={14} color={active ? CYAN : 'rgba(255,255,255,0.4)'} />
      <Text style={{
        color: active ? CYAN : 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
