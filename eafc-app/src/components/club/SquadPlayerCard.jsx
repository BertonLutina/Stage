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
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import Card from '@/components/ui/Card';
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
    <View
      style={{
        borderWidth: 1,
        borderColor: hexToRgba(color, 0.4),
        backgroundColor: hexToRgba(color, 0.12),
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 3,
        flexShrink: 1,
      }}
    >
      <Text style={{ color, fontSize: 10, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function DataRow({ label, children }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: tokens.border,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 10,
      }}
    >
      <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

/** Contract / availability summaries come with legacy colours; map their keys onto Stage tokens. */
function toneFor(tokens, key, fallback) {
  switch (key) {
    case 'trial': return tokens.cyan;
    case 'expiring':
    case 'maybe': return tokens.warning;
    case 'pending': return tokens.amber;
    case 'active':
    case 'available': return tokens.success;
    case 'unavailable': return tokens.danger;
    case 'none':
    case 'no_match':
    case 'no_response': return tokens.muted;
    default: return fallback || tokens.muted;
  }
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
  const tokens = useThemeStore((st) => st.tokens);
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
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 14 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: tokens.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {player?.avatar_url ? (
              <Image source={{ uri: player.avatar_url }} style={{ width: 52, height: 52 }} />
            ) : (
              <Text style={{ color: tokens.cyanHi, fontFamily: FONT_EA_SPORTS, fontSize: 19, textTransform: 'uppercase' }}>
                {String(player?.gamertag || '?').slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
            <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
              {player?.gamertag || player?.display_name || 'Player'}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              <StatusPill label={roleLabel} color={tokens.cyan} />
              {consoleLabel ? <StatusPill label={consoleLabel} color={tokens.amber} /> : null}
            </View>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 2 }}>
            <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 22, lineHeight: 24 }}>{ovr}</Text>
            <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12 }}>OVR</Text>
            {menuActions.length ? (
              <TouchableOpacity
                onPress={openMenu}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Player actions"
                style={{ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <Ionicons name="ellipsis-vertical" size={20} color={tokens.muted} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: tokens.border }}>
          <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 10, borderRightWidth: 1, borderRightColor: tokens.border }}>
            <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>Primary</Text>
            <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 14, marginTop: 2 }}>{primaryPos}</Text>
          </View>
          <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 10 }}>
            <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>Secondary</Text>
            <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 14, marginTop: 2 }}>{secondaryPos}</Text>
          </View>
        </View>

        <DataRow label="Contract">
          <StatusPill label={contractSummary.label} color={toneFor(tokens, contractSummary.key, contractSummary.color)} />
        </DataRow>
        <DataRow label="Next match">
          <StatusPill label={availabilitySummary.label} color={toneFor(tokens, availabilitySummary.key, availabilitySummary.color)} />
        </DataRow>
        <DataRow label="Nationality">
          {nationality.code ? (
            <FlagMark code={nationality.code} country={nationality.label} size={22} accessibilityLabel="National flag" />
          ) : (
            <Text style={{ color: tokens.muted, fontSize: 12 }}>--</Text>
          )}
        </DataRow>

        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: tokens.border, backgroundColor: hexToRgba(tokens.bgDeep, 0.5) }}>
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
                borderRightColor: tokens.border,
              }}
            >
              <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12 }}>{label}</Text>
              <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 17, marginTop: 2 }}>{value}</Text>
            </View>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export { getSquadAvailabilitySummary, getSquadContractSummary };
