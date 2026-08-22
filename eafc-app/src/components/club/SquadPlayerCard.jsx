import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FlagMark from '@/components/common/FlagMark';
import { getPlayerNationality } from '@/lib/countryDisplay';
import {
  clubRoleLabel,
  formatOvr,
  getPrimaryRole,
  getSquadAvailabilitySummary,
  getSquadContractSummary,
} from '@/lib/clubSquadDisplay';
import { formatClubRating } from '@/lib/clubPlayerStats';
import { formatPlatformLabel } from '@/lib/platformDisplay';

function StatusPill({ label, color }) {
  return (
    <View style={{ borderWidth: 1, borderColor: `${color}55`, backgroundColor: `${color}18`, paddingHorizontal: 6, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function DataRow({ label, children }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 12,
        paddingVertical: 9,
        gap: 10,
      }}
    >
      <Text style={{ color: 'rgba(255,255,255,0.42)', fontSize: 9, fontWeight: '800', letterSpacing: 1.3, textTransform: 'uppercase' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function presentMenu(title, message, actions) {
  const cancel = { label: 'Cancel', style: 'cancel' };
  const all = [...actions, cancel];
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title,
        message,
        options: all.map((item) => item.label),
        cancelButtonIndex: all.length - 1,
        destructiveButtonIndex: all.findIndex((item) => item.style === 'destructive'),
      },
      (index) => all[index]?.onPress?.(),
    );
    return;
  }
  Alert.alert(title, message, all.map((item) => ({
    text: item.label,
    style: item.style || 'default',
    onPress: item.onPress,
  })));
}

export default function SquadPlayerCard({
  player,
  clubStats,
  contractSummary,
  availabilitySummary,
  menuActions = [],
  onOpenProfile,
}) {
  const role = getPrimaryRole(player);
  const roleLabel = clubRoleLabel(role);
  const ovr = formatOvr(player?.overall_rating ?? player?.ovr);
  const primaryPos = player?.position || player?.position_code || '--';
  const secondaryPos = player?.secondary_position || player?.alt_position || '--';
  const nationality = getPlayerNationality(player);
  const consoleLabel = formatPlatformLabel(player?.platform);

  const openMenu = (event) => {
    event?.stopPropagation?.();
    presentMenu(
      player?.gamertag || 'Player',
      [primaryPos, roleLabel].filter(Boolean).join(' · '),
      menuActions,
    );
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onOpenProfile} accessibilityRole="button">
      <View
        style={{
          borderWidth: 1,
          borderColor: 'rgba(245,197,66,0.28)',
          backgroundColor: '#071018',
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 12, paddingVertical: 12 }}>
          <View
            style={{
              width: 52,
              height: 52,
              overflow: 'hidden',
              backgroundColor: '#101827',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: 'rgba(245,197,66,0.35)',
            }}
          >
            {player?.avatar_url ? (
              <Image source={{ uri: player.avatar_url }} style={{ width: 52, height: 52 }} />
            ) : (
              <Text style={{ color: '#F5C542', fontWeight: '900', fontSize: 16 }}>
                {String(player?.gamertag || '?').slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.4 }} numberOfLines={1}>
              {player?.gamertag || player?.display_name || 'Player'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <StatusPill label={roleLabel} color="#00E5FF" />
              {consoleLabel ? <StatusPill label={consoleLabel} color="#F5C542" /> : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ color: '#F5C542', fontWeight: '900', fontSize: 22, lineHeight: 24 }}>{ovr}</Text>
            <Text style={{ color: 'rgba(245,197,66,0.55)', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>OVR</Text>
            {menuActions.length ? (
              <TouchableOpacity
                onPress={openMenu}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Player actions"
                style={{ minWidth: 44, minHeight: 36, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="ellipsis-vertical" size={18} color="rgba(255,255,255,0.55)" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }}>
          <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 9, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.08)' }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Primary</Text>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginTop: 2 }}>{primaryPos}</Text>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 9 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Secondary</Text>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 13, marginTop: 2 }}>{secondaryPos}</Text>
          </View>
        </View>

        <DataRow label="Contract">
          <StatusPill label={contractSummary.label} color={contractSummary.color} />
        </DataRow>
        <DataRow label="Next match">
          <StatusPill label={availabilitySummary.label} color={availabilitySummary.color} />
        </DataRow>
        <DataRow label="Nationality">
          {nationality.code ? (
            <FlagMark code={nationality.code} country={nationality.label} size={22} accessibilityLabel="National flag" />
          ) : (
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>--</Text>
          )}
        </DataRow>

        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.28)' }}>
          {[
            ['AVG', formatClubRating(clubStats?.avgRating)],
            ['G', String(clubStats?.goals ?? 0)],
            ['A', String(clubStats?.assists ?? 0)],
            ['MP', String(clubStats?.matches ?? 0)],
          ].map(([label, value], index) => (
            <View
              key={label}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 10,
                borderRightWidth: index < 3 ? 1 : 0,
                borderRightColor: 'rgba(255,255,255,0.08)',
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }}>{label}</Text>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, marginTop: 2 }}>{value}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export { getSquadAvailabilitySummary, getSquadContractSummary };
