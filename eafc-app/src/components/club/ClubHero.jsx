import React from 'react';
import { Image, Text, View } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
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
  const tokens = useThemeStore((s) => s.tokens);
  if (!record) return null;
  const items = [
    { label: 'OW', color: tokens.success },
    { label: 'OD', color: tokens.muted },
    { label: 'OL', color: tokens.danger },
  ];
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
            borderColor: hexToRgba(item.color, 0.53),
            backgroundColor: hexToRgba(item.color, 0.13),
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
  const tokens = useThemeStore((s) => s.tokens);
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
      <View style={{ paddingHorizontal: 20, marginTop: -112, zIndex: 10, gap: 12 }}>
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
              <Text numberOfLines={2} style={[headingStyleLg, { color: tokens.text, lineHeight: 28, flexShrink: 1 }]}>
                {name}
              </Text>
              {tag ? (
                <View style={{ backgroundColor: tokens.amber, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ color: tokens.bgDeep, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 }}>
                    {String(tag).toUpperCase()}
                  </Text>
                </View>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {consoleLabel ? (
                <GamerMetaPill icon="game-controller" iconColor={tokens.cyan}>{consoleLabel}</GamerMetaPill>
              ) : null}
              {club?.region ? (
                <GamerMetaPill icon="globe-outline" iconColor={tokens.cyan}>{club.region}</GamerMetaPill>
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
                  iconColor={tokens.cyan}
                >
                  {president.display_name || president.gamertag || 'President'}
                </GamerMetaPill>
              ) : null}
              {members != null ? (
                <GamerMetaPill icon="people" iconColor={tokens.cyan}>{members}</GamerMetaPill>
              ) : null}
            </View>
            <RecordDots record={record} />
            {motto ? (
              <Text style={{ color: tokens.textSoft, fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
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
