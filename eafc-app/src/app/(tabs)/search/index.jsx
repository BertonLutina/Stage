import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator, RefreshControl, ScrollView, StatusBar, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import useSearchDirectory from '@/hooks/useSearchDirectory';
import {
  clubDisplayName, clubOverallRating, filterClubDirectory, filterPlayerDirectory,
  playerDisplayName, playerOverallRating,
} from '@/lib/stageDirectories';
import { playerAvatarInitials } from '@/lib/playerAvatar';
import { Button, Card, Screen, SectionLabel, SegmentedControl } from '@/components/ui';
import DirectoryResultRow from '@/components/directory/DirectoryResultRow';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import PageTile, { PageTitle } from '@/components/theme/PageTile';

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
  const { players, clubs, playerClubs, identity } = resource.data;
  const isClubOwner = Boolean(identity?.presidentClub?.id);

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
  const challenge = (kind, target) => router.push({
    pathname: '/(tabs)/matches',
    params: {
      arrange: '1', opponentKind: kind, opponentId: target.id,
      opponentName: kind === 'player' ? playerDisplayName(target) : clubDisplayName(target),
      opponentEmail: target.email || target.owner_email || '',
      ...(kind === 'club' ? { opponentTag: target.tag || '' } : {}),
    },
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
        <PageTitle title="SEARCH" subtitle="Find public players and clubs on Stage." padded={false} style={{ paddingBottom: 0 }} />
        <SegmentedControl
          accessibilityLabel="Search directory"
          options={SEARCH_VIEWS}
          value={view}
          onChange={(next) => { setView(next); setQuery(''); }}
        />
        <DirectorySearchField
          value={query}
          onChangeText={setQuery}
          placeholder={view === 'players' ? 'Search players' : 'Search clubs'}
          clearLabel="Clear search"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
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
          <PageTile
            tileKey="search"
            tileTitle="SEARCH"
            contentStyle={{ paddingHorizontal: 12, gap: 10 }}
          >
            <SectionLabel>{countLabel}</SectionLabel>
            {results.length === 0 ? <EmptyResults view={view} /> : results.map((item) => {
              if (view === 'players') {
                const club = playerClubs?.[item.club_id];
                const meta = [item.position, `OVR ${playerOverallRating(item)}`, item.platform, club?.name]
                  .filter(Boolean).join(' · ');
                return (
                  <DirectoryResultRow
                    key={String(item.id)}
                    imageUrl={item.avatar_url}
                    initials={playerAvatarInitials(item)}
                    name={playerDisplayName(item)}
                    meta={meta}
                    actionLabel={isClubOwner ? 'Invite' : 'Challenge'}
                    onPress={() => openPlayer(item)}
                    onAction={() => challenge('player', item)}
                  />
                );
              }
              const name = clubDisplayName(item);
              const meta = [
                item.tag, item.region,
                clubOverallRating(item) != null ? `OVR ${clubOverallRating(item)}` : null,
                item.platform,
              ].filter(Boolean).join(' · ');
              return (
                <DirectoryResultRow
                  key={String(item.id)}
                  imageUrl={item.logo_url}
                  initials={String(item.tag || name).slice(0, 3).toUpperCase()}
                  name={name}
                  meta={meta}
                  actionLabel={isClubOwner ? 'Challenge' : 'View'}
                  actionPrimary={isClubOwner}
                  onPress={() => openClub(item)}
                  onAction={() => (isClubOwner ? challenge('club', item) : openClub(item))}
                />
              );
            })}
          </PageTile>
        )}
      </ScrollView>
    </Screen>
  );
}
