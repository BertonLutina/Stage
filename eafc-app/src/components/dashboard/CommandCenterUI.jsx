import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ActivityIndicator,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { headingStyle, FONT_EA_SPORTS } from '@/lib/fonts';
import useThemeStore from '@/store/themeStore';
import { CARD_RADIUS, STAGE_PALETTE, hexToRgba } from '@/lib/stageTheme';
import LiveGlass from '@/components/theme/LiveGlass';
import { FormBadge, TextField, Button } from '@/components/ui';

/** Stage palette (names kept for existing call sites) */
export const FUT = {
  void: STAGE_PALETTE.bgDeep,
  panel: STAGE_PALETTE.card,
  cyan: STAGE_PALETTE.cyan,
  gold: STAGE_PALETTE.warning,
  lime: STAGE_PALETTE.success,
  rose: STAGE_PALETTE.danger,
  ink: hexToRgba(STAGE_PALETTE.bgDeep, 0.92),
};

/** Accent names keep their old meaning; each maps onto a Stage token. */
const ACCENT_TOKEN = {
  cyan: 'cyan',
  gold: 'warning',
  green: 'success',
  violet: 'aqua',
  rose: 'danger',
};

function useAccent(name = 'cyan') {
  const tokens = useThemeStore((s) => s.tokens);
  const tint = tokens[ACCENT_TOKEN[name] || 'cyan'];
  return { tint, border: hexToRgba(tint, 0.45) };
}

export function formatNumber(value, digits = 0) {
  return Intl.NumberFormat('en', { maximumFractionDigits: digits }).format(Number(value) || 0);
}

export function formatDays(days) {
  if (days == null) return '—';
  if (days < 1) return '<1d';
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  const years = Math.floor(days / 365);
  const remMonths = Math.floor((days % 365) / 30);
  return remMonths > 0 ? `${years}y ${remMonths}mo` : `${years}y`;
}

export function formatWhen(dateStr) {
  if (!dateStr) return 'TBD';
  const dt = new Date(dateStr);
  return (
    `${dt.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })} · ${
      dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  );
}

/** Flat Stage panel (the old pitch gradient and hairlines are gone). Live Dark keeps the glass. */
export function PitchAtmosphere({ children, style }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <LiveGlass
      style={[{
        borderRadius: CARD_RADIUS,
        borderWidth: 1,
        borderColor: tokens.border,
        backgroundColor: tokens.live ? 'transparent' : tokens.card,
      }, style]}
      intensity={36}
    >
      {children}
    </LiveGlass>
  );
}

/** Card radius for Home widgets under the player identity plate. */
export const DASHBOARD_CARD_RADIUS = CARD_RADIUS;

/** Game Day MATCH SCREENS tile chrome — dashboard widgets reuse this. */
export const GAME_DAY_SILVER = STAGE_PALETTE.textSoft;
export const TILE_BORDER = STAGE_PALETTE.border;
export const TILE_BORDER_HOT = STAGE_PALETTE.borderStrong;
export const TILE_FILL = STAGE_PALETTE.card;
export const TILE_FILL_INNER = STAGE_PALETTE.bgDeep;
/** Over a Live Dark photo — same as Game Day MATCH SCREENS with a tile background. */
export const TILE_FILL_LIVE = 'rgba(19,43,92,0.62)';
export const TILE_FILL_LIVE_INNER = 'rgba(7,22,58,0.55)';

export function tileChrome(tokens, extra = {}) {
  const live = tokens?.live === true;
  return {
    overflow: 'hidden',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: tokens?.border || TILE_BORDER,
    backgroundColor: live ? TILE_FILL_LIVE : (tokens?.card || TILE_FILL),
    ...extra,
  };
}

export function innerTileChrome(tokens, extra = {}) {
  const live = tokens?.live === true;
  return tileChrome(tokens, {
    backgroundColor: live ? TILE_FILL_LIVE_INNER : (tokens?.inputFill || TILE_FILL_INNER),
    ...extra,
  });
}

export function SectionCard({ children, style, accent = 'cyan', radius = CARD_RADIUS }) {
  const tokens = useThemeStore((s) => s.tokens);
  const borderColor = accent === 'rose' ? hexToRgba(tokens.danger, 0.5) : undefined;
  return (
    <View style={[tileChrome(tokens, { borderRadius: radius, ...(borderColor ? { borderColor } : {}) }), style]}>
      <View style={{ padding: 16 }}>
        {children}
      </View>
    </View>
  );
}

/** Section label style shared by the dashboard: 11px / 600 / uppercase / 0.12em / muted. */
export function sectionLabelStyle(tokens) {
  return {
    color: tokens.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 11 * 0.12,
    textTransform: 'uppercase',
  };
}

export function SectionTitle({ children, right, eyebrow }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{ marginBottom: 14 }}>
      {eyebrow ? (
        <Text numberOfLines={1} style={[sectionLabelStyle(tokens), { marginBottom: 4 }]}>
          {eyebrow}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={[headingStyle, { color: tokens.text, flex: 1, letterSpacing: headingStyle.fontSize * 0.03 }]}>
          {children}
        </Text>
        {right}
      </View>
    </View>
  );
}

export function LinkText({ label, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={{ color: tokens.cyan, fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function DashboardRankRing({ rank, winRate, size = 92 }) {
  const tokens = useThemeStore((s) => s.tokens);
  const pct = Math.min(100, Math.max(0, Number(winRate) || 0));
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={cx} cy={cx} r={r} fill="none" stroke={tokens.border} strokeWidth={stroke} />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke={tokens.cyan}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View pointerEvents="none" style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center',
      }}
      >
        <Text style={[sectionLabelStyle(tokens), { fontSize: 9, letterSpacing: 9 * 0.12 }]}>RANK</Text>
        <Text style={{
          color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 22, marginTop: 1, textTransform: 'uppercase',
        }}
        >
          {rank ? `#${rank}` : '—'}
        </Text>
        <Text style={{ color: tokens.cyan, fontSize: 10, fontWeight: '600', marginTop: 2 }}>{pct}% WR</Text>
      </View>
    </View>
  );
}

export function DashboardGamerStatCard({ label, value, sub, accent = 'cyan', icon }) {
  const tokens = useThemeStore((s) => s.tokens);
  const a = useAccent(accent);
  return (
    <View style={tileChrome(tokens, { flex: 1 })}>
      <View style={{ flex: 1, padding: 16, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text numberOfLines={1} style={[sectionLabelStyle(tokens), { flexShrink: 1 }]}>
            {label}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {icon ? <Ionicons name={icon} size={16} color={a.tint} /> : null}
            <View style={{
              width: 6, height: 6, borderRadius: 3, backgroundColor: a.tint,
            }}
            />
          </View>
        </View>
        <Text
          style={{ color: tokens.text, fontWeight: '700', fontSize: 16 }}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {value}
        </Text>
        {sub ? (
          <Text style={{ color: tokens.muted, fontSize: 12 }} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function DashboardQuickGlance({ glance, onOpen }) {
  const tokens = useThemeStore((s) => s.tokens);
  const gold = useAccent('gold');
  const cyan = useAccent('cyan');
  const rose = useAccent('rose');
  const packs = { gold, cyan, rose };
  if (!glance) return null;
  const unreadTotal = (glance.unreadInbox || 0) + (glance.unreadNotifications || 0);
  const tiles = [
    { id: 'stc', label: 'STC', value: formatNumber(glance.stc), icon: 'flash', href: '/apps/store', accent: 'gold' },
    { id: 'credits', label: 'Credits', value: formatNumber(glance.credits), icon: 'sparkles', href: '/apps/store', accent: 'cyan' },
    { id: 'inbox', label: 'Inbox', value: glance.unreadInbox || 0, icon: 'mail', href: '/apps/inbox', accent: 'cyan', hot: (glance.unreadInbox || 0) > 0 },
    { id: 'alerts', label: 'Alerts', value: unreadTotal, icon: 'notifications', href: '/apps/inbox', accent: 'rose', hot: unreadTotal > 0 },
  ];
  return (
    <View style={{ gap: 12 }}>
      {[0, 2].map((start) => (
        <View key={tiles[start].id} style={{ flexDirection: 'row', alignItems: 'stretch', gap: 12 }}>
          {tiles.slice(start, start + 2).map((t) => {
            const a = packs[t.accent] || cyan;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => onOpen?.(t.href)}
                activeOpacity={0.88}
                accessibilityRole="button"
                accessibilityLabel={`${t.label} ${t.value}`}
                style={{ flex: 1 }}
              >
                <View
                  style={tileChrome(tokens, {
                    flex: 1,
                    minHeight: 72,
                    ...(t.hot ? { borderColor: tokens.borderStrong } : {}),
                  })}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 72 }}>
                    <View style={{
                      width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: tokens.live ? TILE_FILL_LIVE_INNER : tokens.inputFill,
                      borderWidth: 1, borderColor: t.hot ? tokens.borderStrong : tokens.border,
                    }}
                    >
                      <Ionicons name={`${t.icon}-outline`} size={22} color={t.hot ? a.tint : tokens.textSoft} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={sectionLabelStyle(tokens)}>
                        {t.label}
                      </Text>
                      <Text
                        style={{ color: tokens.text, fontWeight: '700', fontSize: 20, marginTop: 2 }}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {t.value}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** Rating tile: tokens only, banded like the old gold / lime / cyan / neutral scale. */
function ratingStyle(value, tokens) {
  if (value >= 8) return { bg: tokens.warning, color: tokens.onCyan };
  if (value >= 7) return { bg: tokens.successBg, color: tokens.success };
  if (value >= 6) return { bg: tokens.cyan, color: tokens.onCyan };
  return { bg: tokens.border, color: tokens.muted };
}

/** Outcome strings from the dashboard loader become FormBadge results. */
function outcomeResult(item) {
  const key = String(item || 'draw').toLowerCase();
  if (key === 'win') return 'W';
  if (key === 'loss') return 'L';
  return 'D';
}

export function DashboardFormStrip({ label, mode = 'outcome', items = [], emptyLabel }) {
  const tokens = useThemeStore((s) => s.tokens);
  if (!items?.length) {
    return (
      <View style={{ marginBottom: 10 }}>
        {label ? <Text style={[styles.stripLabel, sectionLabelStyle(tokens)]}>{label}</Text> : null}
        {emptyLabel ? <Text style={{ color: tokens.muted, fontSize: 12 }}>{emptyLabel}</Text> : null}
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? <Text style={[styles.stripLabel, sectionLabelStyle(tokens)]}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {items.map((item, i) => {
          if (mode === 'rating') {
            const s = ratingStyle(item, tokens);
            return (
              <View key={`${item}-${i}`} style={{
                width: 38, height: 38, borderRadius: 12, backgroundColor: s.bg,
                alignItems: 'center', justifyContent: 'center',
              }}
              >
                <Text style={{ color: s.color, fontWeight: '700', fontSize: 12 }}>{Number(item).toFixed(1)}</Text>
              </View>
            );
          }
          return <FormBadge key={`${item}-${i}`} result={outcomeResult(item)} />;
        })}
      </View>
    </View>
  );
}

export function MiniBarChart({ data = [], valueKey = 'matches', color = FUT.cyan, emptyLabel }) {
  const tokens = useThemeStore((s) => s.tokens);
  if (!data?.length) {
    return <Text style={{ color: tokens.muted, fontSize: 12 }}>{emptyLabel || 'No data yet'}</Text>;
  }
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey] || 0)));
  return (
    <View style={innerTileChrome(tokens, {
      flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100,
      paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6,
    })}
    >
      {data.map((d, i) => {
        const v = Number(d[valueKey] || 0);
        const h = Math.max(6, (v / max) * 70);
        return (
          <View key={`${d.label}-${i}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <View style={{
              width: '72%', height: h, borderRadius: 6, backgroundColor: color,
            }}
            />
            <Text style={{ color: tokens.muted, fontSize: 9, marginTop: 5, fontWeight: '600' }} numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export function ObjectivesWidget({ playerId }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!playerId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await stageClient.entities.ObjectiveProgress.filter(
        { player_id: playerId },
        '-created_date',
        50,
      );
      setItems(Array.isArray(rows) ? rows : []);
    } catch (e) {
      setError(e?.message || 'Could not load objectives');
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => { load(); }, [load]);

  const claim = async (progressId) => {
    setClaimingId(progressId);
    try {
      await stageClient.functions.invoke('claimObjectiveReward', { progress_id: progressId });
      await load();
    } catch (e) {
      setError(e?.message || 'Claim failed');
    } finally {
      setClaimingId(null);
    }
  };

  if (!playerId) return null;
  if (loading) return <ActivityIndicator color={tokens.cyan} />;
  if (error) return <Text style={{ color: tokens.danger, fontSize: 12 }}>{error}</Text>;
  if (!items.length) return <Text style={{ color: tokens.muted, fontSize: 12 }}>No open objectives.</Text>;

  return (
    <View style={{ gap: 16 }}>
      {items.slice(0, 6).map((item) => {
        const title = item.title || item.objective_title || item.name || 'Objective';
        const progress = Number(item.progress ?? item.current_value ?? 0);
        const target = Number(item.target ?? item.target_value ?? 1) || 1;
        const done = item.claimed || item.status === 'claimed';
        const claimable = !done && (item.completed || progress >= target);
        const pct = Math.min(100, Math.round((progress / target) * 100));
        const finished = done || claimable;
        return (
          <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {finished ? (
              <Ionicons name="checkmark-outline" size={22} color={tokens.success} />
            ) : (
              <View style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: tokens.borderStrong,
              }}
              />
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                style={{ color: finished && done ? tokens.muted : tokens.text, fontWeight: '600', fontSize: 14 }}
                numberOfLines={2}
              >
                {title}
              </Text>
              <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {progress}/{target} · {String(item.scope || 'daily').toUpperCase()}
              </Text>
              <View style={{
                height: 6, borderRadius: 3, backgroundColor: tokens.border, marginTop: 8, overflow: 'hidden',
              }}
              >
                <View style={{ width: `${pct}%`, height: 6, borderRadius: 3, backgroundColor: tokens.cyan }} />
              </View>
            </View>
            {claimable ? (
              <TouchableOpacity
                onPress={() => claim(item.id)}
                disabled={claimingId === item.id}
                accessibilityRole="button"
                accessibilityLabel={`Claim reward for ${title}`}
                hitSlop={{ top: 5, bottom: 5 }}
                style={{
                  height: 34, minWidth: 44, borderRadius: 999, paddingHorizontal: 14,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: tokens.cyan, borderWidth: 1, borderColor: tokens.cyan,
                }}
              >
                {claimingId === item.id
                  ? <ActivityIndicator color={tokens.onCyan} size="small" />
                  : <Text style={{ color: tokens.onCyan, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>CLAIM REWARD</Text>}
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}

export function EafcClubPanel({ player, eafcSummary, onRefresh }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [clubId, setClubId] = useState(player?.eafc_club_id || '');
  const [clubName, setClubName] = useState(player?.eafc_club_name || '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!player?.id) return;
    setBusy(true);
    try {
      await stageClient.entities.Player.update(player.id, {
        eafc_club_id: clubId.trim() || null,
        eafc_club_name: clubName.trim() || null,
      });
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const unlink = async () => {
    if (!player?.id) return;
    setBusy(true);
    try {
      await stageClient.entities.Player.update(player.id, { eafc_club_id: null, eafc_club_name: null });
      setClubId('');
      setClubName('');
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {eafcSummary?.clubName ? (
        <View
          style={innerTileChrome(tokens, { padding: 14 })}
        >
          <Text style={sectionLabelStyle(tokens)}>LINKED PRO CLUB</Text>
          <Text
            style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 18, marginTop: 6, textTransform: 'uppercase' }}
            numberOfLines={1}
          >
            {eafcSummary.clubName}
          </Text>
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>ID {eafcSummary.clubId}</Text>
        </View>
      ) : (
        <Text style={{ color: tokens.muted, fontSize: 12 }}>Link your EA FC Pro Club to show club form here.</Text>
      )}
      <TextField
        value={clubName}
        onChangeText={setClubName}
        placeholder="Pro Club name"
      />
      <TextField
        value={String(clubId || '')}
        onChangeText={setClubId}
        placeholder="Club ID"
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button
            title={busy ? '…' : 'SAVE LINK'}
            variant="secondary"
            onPress={save}
            disabled={busy}
            accessibilityLabel="Save link"
          />
        </View>
        {eafcSummary?.clubId ? (
          <View style={{ flex: 1 }}>
            <Button
              title="UNLINK"
              variant="danger"
              onPress={unlink}
              disabled={busy}
              accessibilityLabel="Unlink"
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ClubCrest({ club, size = 52 }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{
      width: size, height: size, borderRadius: 16, overflow: 'hidden',
      borderWidth: 1, borderColor: tokens.border,
      backgroundColor: tokens.live ? 'transparent' : tokens.card,
      alignItems: 'center', justifyContent: 'center',
    }}
    >
      {club?.logo_url
        ? <Image source={{ uri: club.logo_url }} style={{ width: size, height: size }} />
        : <Ionicons name="shield-outline" size={size * 0.44} color={tokens.warning} />}
    </View>
  );
}

const styles = {
  stripLabel: {
    marginBottom: 8,
  },
};
