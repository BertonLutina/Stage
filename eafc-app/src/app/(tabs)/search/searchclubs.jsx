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
import {
  clubDisplayName,
  filterClubDirectory,
  loadClubDirectory,
} from '@/lib/stageDirectories';
import {
  countryCodeToFlagEmoji, getCountryDisplayName, normalizeCountryCode,
} from '@/lib/countryDisplay';

function clubMetaLine(club) {
  const code = normalizeCountryCode(club.country_code, club.country);
  const flag = countryCodeToFlagEmoji(code, club.country);
  const country = code || club.country
    ? getCountryDisplayName(code, club.country)
    : (club.region || null);
  const place = [flag, country].filter(Boolean).join(' ') || null;
  return [place, club.platform].filter(Boolean).join(' · ') || 'Club';
}

function ClubRow({ club, onPress }) {
  const name = clubDisplayName(club);
  const initials = String(club.tag || name || 'C').slice(0, 3).toUpperCase();

  return (
    <DirectoryResultRow
      imageUrl={club.logo_url}
      bannerUrl={club.banner_url || club.banner}
      bannerZoom={club.banner_zoom}
      initials={initials}
      name={name}
      badges={club.tag ? [club.tag] : []}
      meta={clubMetaLine(club)}
      actionLabel="VIEW PROFILE"
      onPress={onPress}
      onAction={onPress}
    />
  );
}

export default function SearchClubs() {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await loadClubDirectory();
      if (cancelled) return;
      setClubs(rows);
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
