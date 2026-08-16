import React, { useCallback, useMemo, useState } from 'react';
import {
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  NEWS_SECTION_FILTERS,
  clubRoute,
  formatNewspaperDate,
  newspaperVolume,
  playerRoute,
  tournamentRoute,
} from '@/lib/stageNews';
import NewsBeatDesk from './NewsBeatDesk';
import WorldNewsDesk from './WorldNewsDesk';
import MercatoDesk from './MercatoDesk';
import AllNewsPaper from './AllNewsPaper';
import { PAPER, paperStyles as s } from './newsPaperStyles';

export default function StageTimesNews({ initialSection = 'mercato', initialTransferId = '', initialContinent = '' }) {
  const router = useRouter();
  const [section, setSection] = useState(initialSection);
  const [transferId, setTransferId] = useState(initialTransferId);
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const editionDate = useMemo(() => formatNewspaperDate(new Date()), []);
  const volume = useMemo(() => newspaperVolume(new Date()), []);

  const openClub = useCallback((id) => {
    const route = clubRoute(id);
    if (route) router.push(route);
  }, [router]);

  const openPlayer = useCallback((id) => {
    const route = playerRoute(id);
    if (route) router.push(route);
  }, [router]);

  const openTournament = useCallback((id) => {
    const route = tournamentRoute(id);
    if (route) router.push(route);
  }, [router]);

  const openMercato = useCallback((id) => {
    setTransferId(id || '');
    setSection('mercato');
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((value) => value + 1);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  return (
    <View style={s.page}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={s.headerBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: 'rgba(243,226,168,0.35)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={18} color={PAPER.paper} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>News</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 48 }}
          refreshControl={(
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={PAPER.paper}
            />
          )}
        >
          <View style={s.sheet}>
            <View style={s.masthead}>
              <View style={s.kickerRow}>
                <Text style={s.kickerSlug}>Stage League</Text>
                <Text style={s.kickerMuted}>Late edition</Text>
              </View>
              <Text style={s.title}>THE STAGE TIMES</Text>
            </View>
            <View style={s.dateline}>
              <Text style={s.datelineText}>Vol. {volume} · No. {new Date().getUTCDate()}</Text>
              <Text style={[s.datelineText, { textAlign: 'center' }]}>{editionDate}</Text>
              <Text style={[s.datelineText, { textAlign: 'right' }]}>Matchday</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {NEWS_SECTION_FILTERS.map((item) => {
                const active = section === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      setSection(item.id);
                      if (item.id !== 'mercato') setTransferId('');
                    }}
                    style={[s.sectionTab, active ? s.sectionTabActive : null]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[s.sectionTabText, active ? s.sectionTabTextActive : null]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View key={`${section}-${refreshKey}`}>
              {section === 'mercato' ? (
                <MercatoDesk
                  initialTransferId={transferId}
                  onOpenClub={openClub}
                  onOpenPlayer={openPlayer}
                />
              ) : section === 'all' ? (
                <AllNewsPaper onOpenClub={openClub} onOpenPlayer={openPlayer} />
              ) : section === 'world_news' ? (
                <WorldNewsDesk
                  initialContinent={initialContinent}
                  onOpenClub={openClub}
                  onOpenPlayer={openPlayer}
                  onOpenTournament={openTournament}
                  onOpenMercato={openMercato}
                />
              ) : (
                <NewsBeatDesk
                  section={section}
                  onOpenClub={openClub}
                  onOpenPlayer={openPlayer}
                  onOpenTournament={openTournament}
                  onOpenMercato={openMercato}
                />
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
