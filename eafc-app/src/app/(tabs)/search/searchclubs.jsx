import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Card, Screen } from '@/components/ui';
import DirectoryResultRow from '@/components/directory/DirectoryResultRow';
import DirectorySearchField from '@/components/directory/DirectorySearchField';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import {
  clubDisplayName,
  filterClubDirectory,
  loadClubDirectory,
} from '@/lib/stageDirectories';

function ClubRow({ club, isClubOwner, onChallenge, onPress }) {
  const name = clubDisplayName(club);
  const subtitle = [club.tag ? `[${club.tag}]` : null, club.region, club.platform].filter(Boolean).join(' · ');
  const initials = String(club.tag || name || 'C').slice(0, 3).toUpperCase();

  return (
    <DirectoryResultRow
      imageUrl={club.logo_url}
      initials={initials}
      name={name}
      meta={subtitle || 'Club'}
      actionLabel={isClubOwner ? 'Challenge' : 'View'}
      actionPrimary
      onPress={onPress}
      onAction={() => onChallenge?.(club)}
    />
  );
}

export default function SearchClubs() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isClubOwner, setIsClubOwner] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rows, identity] = await Promise.all([
        loadClubDirectory(),
        resolveMyPlayerAndClub().catch(() => ({})),
      ]);
      if (cancelled) return;
      setClubs(rows);
      setIsClubOwner(Boolean(identity.presidentClub?.id));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(
    () => filterClubDirectory(clubs, { query }),
    [clubs, query],
  );

  const handleSelectClub = (club) => {
    router.push({
      pathname: '/apps/club/[id]',
      params: { id: club.id },
    });
  };

  const handleChallenge = (club) => {
    router.push({
      pathname: '/(tabs)/matches',
      params: {
        arrange: '1',
        opponentKind: 'club',
        opponentId: club.id,
        opponentName: clubDisplayName(club),
        opponentTag: club.tag || '',
        opponentEmail: club.owner_email || '',
      },
    });
  };

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: 14 }}>
        <DirectorySearchField
          placeholder="Search clubs..."
          value={query}
          onChangeText={setQuery}
        />
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48 }}>
            <ActivityIndicator color={tokens.cyan} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ClubRow
                club={item}
                isClubOwner={isClubOwner}
                onChallenge={handleChallenge}
                onPress={() => handleSelectClub(item)}
              />
            )}
            ListEmptyComponent={
              <Card style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
                <Ionicons name="shield-outline" size={36} color={tokens.muted} />
                <Text style={{ color: tokens.muted, fontSize: 14, fontWeight: '600' }}>No clubs found</Text>
              </Card>
            }
          />
        )}
      </View>
    </Screen>
  );
}
