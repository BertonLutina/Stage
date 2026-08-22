import React from 'react';
import { Image, Text, View } from 'react-native';
import {
  GamerBanner,
  GamerMetaPill,
  GlassIconButton,
} from '@/components/profile/gamer/GamerProfileUI';
import ClubIdentityCard from '@/components/club/ClubIdentityCard';
import FlagMark from '@/components/common/FlagMark';
import { headingStyleLg } from '@/lib/fonts';
import { formatPlatformLabel } from '@/lib/platformDisplay';
import { getPlayerNationality } from '@/lib/countryDisplay';

function RecordDots({ record }) {
  const items = [
    { label: 'OW', color: '#34D399' },
    { label: 'OD', color: 'rgba(226,234,244,0.45)' },
    { label: 'OL', color: '#FB7185' },
  ];
  if (!record) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: `${item.color}88`,
            backgroundColor: `${item.color}22`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: item.color, fontSize: 8, fontWeight: '900', letterSpacing: 0.4 }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function ClubHero({
  club,
  president,
  record,
  memberCount,
  onBack,
  onOpenPresident,
  extraActions,
}) {
  const tag = club?.tag || club?.handle;
  const name = club?.name || club?.club_name || 'Club';
  const consoleLabel = formatPlatformLabel(club?.platform);
  const nationality = getPlayerNationality({
    country_code: club?.country_code,
    country: club?.country,
  });
  const portrait = club?.logo_url || club?.avatar_url || club?.avatar;
  const motto = club?.motto || club?.slogan || club?.bio || club?.description;
  const members = memberCount ?? club?.member_count ?? club?.members_count ?? null;

  return (
    <View>
      <GamerBanner
        bannerUrl={club?.banner_url || club?.banner}
        wash="club"
        height={188}
        topLeft={onBack ? <GlassIconButton icon="arrow-back" onPress={onBack} accessibilityLabel="Back" /> : null}
      />
      <View style={{ paddingHorizontal: 16, marginTop: -112, zIndex: 10, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          <ClubIdentityCard
            imageUrl={portrait}
            tag={tag}
            platform={club?.platform}
            winRate={record?.winRate}
            width={170}
          />
          <View style={{ flex: 1, paddingBottom: 2, gap: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Text numberOfLines={2} style={[headingStyleLg, { color: '#fff', lineHeight: 28, flexShrink: 1 }]}>
                {name}
              </Text>
              {tag ? (
                <View style={{ backgroundColor: '#F5C542', paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: '#1A1200', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>
                    {String(tag).toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {consoleLabel ? (
                <GamerMetaPill icon="game-controller" iconColor="#00E5FF">{consoleLabel}</GamerMetaPill>
              ) : null}
              {club?.region ? (
                <GamerMetaPill icon="globe-outline" iconColor="#00E5FF">{club.region}</GamerMetaPill>
              ) : null}
              {nationality.code ? (
                <GamerMetaPill leading={<FlagMark code={nationality.code} country={nationality.label} size={12} />}>
                  {nationality.code}
                </GamerMetaPill>
              ) : null}
              {president ? (
                <GamerMetaPill
                  onPress={onOpenPresident}
                  leading={
                    president.avatar_url ? (
                      <Image
                        source={{ uri: president.avatar_url }}
                        style={{ width: 14, height: 14 }}
                      />
                    ) : undefined
                  }
                  icon={president.avatar_url ? undefined : 'person'}
                  iconColor="#00E5FF"
                >
                  {president.display_name || president.gamertag || 'President'}
                </GamerMetaPill>
              ) : null}
              {members != null ? (
                <GamerMetaPill icon="people" iconColor="#00E5FF">{members}</GamerMetaPill>
              ) : null}
            </View>
            <RecordDots record={record} />
            {motto ? (
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
                {motto}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {extraActions}
        </View>
      </View>
    </View>
  );
}
