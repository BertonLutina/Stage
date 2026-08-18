import React from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import ParallelogramFrame from '@/components/club/ParallelogramFrame';
import { getCountryFlagColors, getPlayerNationality } from '@/lib/countryDisplay';
import {
  clubRoleLabel,
  formatOvr,
  getPrimaryRole,
  getSquadAvailabilitySummary,
  getSquadContractSummary,
} from '@/lib/clubSquadDisplay';
import { formatClubRating } from '@/lib/clubPlayerStats';

function StatusPill({ label, color }) {
  return (
    <View style={{ borderWidth: 1, borderColor: `${color}55`, backgroundColor: `${color}18`, paddingHorizontal: 6, paddingVertical: 3 }}>
      <Text style={{ color, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function NationalityRow({ player }) {
  const nationality = getPlayerNationality(player);
  const colors = getCountryFlagColors(nationality.code);
  return (
    <LinearGradient
      colors={[colors[0], colors[1], colors[2] || colors[0]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}
    >
      <View style={{ backgroundColor: 'rgba(0,0,0,0.58)', paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          Nationality
        </Text>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 0.6, textTransform: 'uppercase', flexShrink: 1 }} numberOfLines={1}>
          {nationality.label}
        </Text>
      </View>
    </LinearGradient>
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
      <ParallelogramFrame skew={-6}>
        <View
          style={{
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            backgroundColor: '#071018',
            paddingHorizontal: 14,
            paddingVertical: 12,
            minHeight: 248,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
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
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.4 }} numberOfLines={1}>
                {player?.gamertag || player?.display_name || 'Player'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                <StatusPill label={roleLabel} color="#00E5FF" />
                <StatusPill label={contractSummary.label} color={contractSummary.color} />
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: '#F5C542', fontWeight: '900', fontSize: 20, lineHeight: 22 }}>{ovr}</Text>
                <Text style={{ color: 'rgba(245,197,66,0.55)', fontSize: 9, fontWeight: '900', letterSpacing: 1 }}>OVR</Text>
              </View>
              {menuActions.length ? (
                <TouchableOpacity
                  onPress={openMenu}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Player actions"
                  style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="rgba(255,255,255,0.55)" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.2)', padding: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Primary</Text>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12, marginTop: 2 }}>{primaryPos}</Text>
            </View>
            <View style={{ flex: 1, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.2)', padding: 8 }}>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Secondary</Text>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12, marginTop: 2 }}>{secondaryPos}</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 10, paddingVertical: 8 }}>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' }}>Next match</Text>
            <StatusPill label={availabilitySummary.label} color={availabilitySummary.color} />
          </View>

          <NationalityRow player={player} />

          <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}>
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
                  paddingVertical: 8,
                  borderRightWidth: index < 3 ? 1 : 0,
                  borderRightColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{value}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 }}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ParallelogramFrame>
    </TouchableOpacity>
  );
}

export { getSquadAvailabilitySummary, getSquadContractSummary };
