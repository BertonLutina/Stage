import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import useSearchDirectory from '@/hooks/useSearchDirectory';
import {
  clubDisplayName, filterClubDirectory, filterPlayerDirectory, playerDisplayName,
} from '@/lib/stageDirectories';
import { playerAvatarInitials } from '@/lib/playerAvatar';
import {
  countryCodeToFlagEmoji, getCountryDisplayName, getPlayerNationality, normalizeCountryCode,
} from '@/lib/countryDisplay';
import { headingStyleLg } from '@/lib/fonts';
import { Button, Card, Screen, SectionLabel, SegmentedControl } from '@/components/ui';
import DirectoryResultRow from '@/components/directory/DirectoryResultRow';
import DirectorySearchField from '@/components/directory/DirectorySearchField';

function playerMetaLine(player, club) {
  const nation = getPlayerNationality(player);
  const flag = countryCodeToFlagEmoji(nation.code, player.country);
  const place = [flag, nation.label !== 'Unknown' ? nation.label : null]
    .filter(Boolean).join(' ')
    || club?.name
    || 'Free agent';
  return [place, player.platform].filter(Boolean).join(' · ');
}

function clubMetaLine(club) {
  const code = normalizeCountryCode(club.country_code, club.country);
  const flag = countryCodeToFlagEmoji(code, club.country);
  const country = code || club.country
    ? getCountryDisplayName(code, club.country)
    : (club.region || null);
  const place = [flag, country].filter(Boolean).join(' ') || null;
  return [place, club.platform].filter(Boolean).join(' · ');
}

const SEARCH_VIEWS = [
  { key: 'players', label: 'Players' },
  { key: 'clubs', label: 'Clubs' },
];

function EmptyResults({ view }) {
  const tokens = useThemeStore((state) => state.tokens);
  return (
    <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
      <Ionicons name={view === 'players' ? 'people-outline' : 'shield-outline'} size={36} color={tokens.muted} />
      <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700' }}>No {view} found</Text>
      <Text style={{ color: tokens.muted, fontSize: 12 }}>Try another search</Text>
    </Card>
  );
}

/** Native Search tab: real public player and club directories. */
export default function SearchIndex() {
  const router = useRouter();
  const tokens = useThemeStore((state) => state.tokens);
  const [view, setView] = useState('players');
  const [query, setQuery] = useState('');
  const resource = useSearchDirectory();
  const { players, clubs, playerClubs } = resource.data;

  const results = useMemo(
    () => (view === 'players'
      ? filterPlayerDirectory(players, { query })
      : filterClubDirectory(clubs, { query })),
    [clubs, players, query, view],
  );

  const openPlayer = (player) => router.push({
    pathname: '/(tabs)/profile/profilescreen', params: { playerId: player.id },
  });
  const openClub = (club) => router.push({
    pathname: '/apps/club/[id]', params: { id: club.id },
  });

  const countLabel = `${results.length} ${view === 'players'
    ? (results.length === 1 ? 'player' : 'players')
    : (results.length === 1 ? 'club' : 'clubs')}`;

  return (
    <Screen scroll={false}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={resource.refreshing} onRefresh={resource.refetch} tintColor={tokens.cyan} />}
        contentContainerStyle={{ gap: 14, paddingBottom: 28 }}
      >
        <Text
          accessibilityRole="header"
          style={[headingStyleLg, { color: tokens.text, fontSize: 34, letterSpacing: 34 * 0.03 }]}
        >
          Search
        </Text>

        <DirectorySearchField
          value={query}
          onChangeText={setQuery}
          accessibilityLabel={view === 'players' ? 'Search players' : 'Search clubs'}
          placeholder="Players, clubs, gamertags"
          clearLabel="Clear search"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />

        <SegmentedControl
          accessibilityLabel="Search directory"
          options={SEARCH_VIEWS}
          value={view}
          onChange={(next) => { setView(next); setQuery(''); }}
        />

        {resource.loading ? (
          <ActivityIndicator color={tokens.cyan} style={{ marginTop: 44 }} />
        ) : resource.error ? (
          <Card style={{ alignItems: 'center', gap: 14, paddingVertical: 28 }}>
            <Ionicons name="cloud-offline-outline" size={34} color={tokens.danger} />
            <Text style={{ color: tokens.text, fontWeight: '700', textAlign: 'center' }}>{resource.error}</Text>
            <View style={{ alignSelf: 'stretch' }}>
              <Button title="Try again" variant="secondary" onPress={resource.refetch} />
            </View>
          </Card>
        ) : (
          <View style={{ gap: 8 }}>
            <SectionLabel>{countLabel}</SectionLabel>
            {results.length === 0 ? <EmptyResults view={view} /> : results.map((item) => {
              if (view === 'players') {
                const club = playerClubs?.[item.club_id];
                const badges = [item.position, item.secondary_position].filter(Boolean);
                return (
                  <DirectoryResultRow
                    key={String(item.id)}
                    imageUrl={item.avatar_url}
                    bannerUrl={item.banner_url}
                    bannerZoom={item.banner_zoom}
                    initials={playerAvatarInitials(item)}
                    name={playerDisplayName(item)}
                    badges={badges}
                    meta={playerMetaLine(item, club)}
                    actionLabel="VIEW PROFILE"
                    onPress={() => openPlayer(item)}
                    onAction={() => openPlayer(item)}
                  />
                );
              }
              const name = clubDisplayName(item);
              return (
                <DirectoryResultRow
                  key={String(item.id)}
                  imageUrl={item.logo_url}
                  bannerUrl={item.banner_url || item.banner}
                  bannerZoom={item.banner_zoom}
                  initials={String(item.tag || name).slice(0, 3).toUpperCase()}
                  name={name}
                  badges={item.tag ? [item.tag] : []}
                  meta={clubMetaLine(item)}
                  actionLabel="VIEW PROFILE"
                  onPress={() => openClub(item)}
                  onAction={() => openClub(item)}
                />
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
