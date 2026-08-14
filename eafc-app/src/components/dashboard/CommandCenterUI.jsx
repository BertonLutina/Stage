import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, Animated, Easing, StyleSheet,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { CYAN, AMBER } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyle } from '@/lib/fonts';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import LiveGlass from '@/components/theme/LiveGlass';

/** EA FC 27 / FUT night palette */
export const FUT = {
  void: '#03060D',
  panel: '#0A1222',
  cyan: '#00E8FF',
  gold: '#FFD24A',
  lime: '#7CFF6B',
  rose: '#FF4D6D',
  ink: 'rgba(3,6,13,0.92)',
};

const ACCENTS = {
  cyan: {
    border: 'rgba(0,232,255,0.45)',
    colors: ['rgba(0,232,255,0.28)', 'rgba(0,80,120,0.12)', 'rgba(3,6,13,0.4)'],
    tint: FUT.cyan,
    glow: 'rgba(0,232,255,0.35)',
  },
  gold: {
    border: 'rgba(255,210,74,0.5)',
    colors: ['rgba(255,210,74,0.32)', 'rgba(180,100,20,0.14)', 'rgba(3,6,13,0.4)'],
    tint: FUT.gold,
    glow: 'rgba(255,210,74,0.35)',
  },
  green: {
    border: 'rgba(124,255,107,0.4)',
    colors: ['rgba(124,255,107,0.22)', 'rgba(20,120,60,0.12)', 'rgba(3,6,13,0.4)'],
    tint: FUT.lime,
    glow: 'rgba(124,255,107,0.3)',
  },
  violet: {
    border: 'rgba(0,180,255,0.35)',
    colors: ['rgba(40,100,255,0.22)', 'rgba(0,200,255,0.1)', 'rgba(3,6,13,0.4)'],
    tint: '#6EC8FF',
    glow: 'rgba(80,160,255,0.3)',
  },
  rose: {
    border: 'rgba(255,77,109,0.45)',
    colors: ['rgba(255,77,109,0.24)', 'rgba(120,20,40,0.14)', 'rgba(3,6,13,0.4)'],
    tint: FUT.rose,
    glow: 'rgba(255,77,109,0.3)',
  },
};

function useAccent(name = 'cyan') {
  const tokens = useThemeStore((s) => s.tokens);
  const dark = ACCENTS[name] || ACCENTS.cyan;
  if (tokens.live) {
    return {
      ...dark,
      colors: [dark.colors[0], dark.colors[1], 'rgba(10,18,32,0.28)'],
    };
  }
  if (tokens.isDark) return dark;
  const tint = name === 'gold' ? tokens.amber : name === 'rose' ? FUT.rose : name === 'green' ? '#15803D' : tokens.cyan;
  const border = name === 'gold' ? tokens.amberBorder : name === 'rose' ? 'rgba(255,77,109,0.4)' : tokens.cyanBorder;
  return {
    border,
    colors: [hexToRgba(tint, 0.14), tokens.cardSolid],
    tint,
    glow: tint,
  };
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

export function PitchAtmosphere({ children, style }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <LiveGlass style={[{ borderRadius: 22 }, style]} intensity={36}>
      <LinearGradient
        colors={tokens.live
          ? ['rgba(12,20,36,0.55)', 'rgba(10,18,32,0.42)', 'rgba(6,10,20,0.28)']
          : [tokens.cardSolid, '#0A1A30', tokens.bg]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <LinearGradient
        colors={tokens.wash}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {Array.from({ length: 7 }).map((_, i) => (
        <View
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${12 + i * 12}%`,
            height: 1,
            backgroundColor: tokens.isDark ? 'rgba(0,232,255,0.06)' : hexToRgba(tokens.amber, 0.14),
          }}
        />
      ))}
      {children}
    </LiveGlass>
  );
}

export function SectionCard({ children, style, accent = 'cyan' }) {
  const tokens = useThemeStore((s) => s.tokens);
  const a = ACCENTS[accent] || ACCENTS.cyan;
  const border = accent === 'gold' ? tokens.amberBorder : accent === 'rose' ? a.border : tokens.cyanBorder;
  return (
    <LiveGlass
      intensity={36}
      style={[{
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: border,
        shadowColor: tokens.isDark ? a.glow : '#0B1A3A',
        shadowOpacity: tokens.isDark ? 0.35 : 0.18,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 10,
      }, style]}
    >
      <LinearGradient
        colors={tokens.live
          ? ['rgba(12,20,36,0.55)', 'rgba(6,10,20,0.48)']
          : tokens.isDark ? ['rgba(12,20,36,0.98)', 'rgba(6,10,20,0.96)'] : [tokens.cardSolid, tokens.cardSolid]}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ padding: 16 }}>
        {children}
      </View>
    </LiveGlass>
  );
}

export function SectionTitle({ children, right, eyebrow }) {
  const tokens = useThemeStore((s) => s.tokens);
  const accent = tokens.isDark ? tokens.cyan : tokens.amber;
  return (
    <View style={{ marginBottom: 16 }}>
      {eyebrow ? (
        <Text style={{
          color: accent,
          fontSize: 9,
          fontWeight: '900',
          letterSpacing: 3,
          marginBottom: 4,
        }}
        >
          {eyebrow}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <Text style={[headingStyle, { color: tokens.text, flex: 1 }]}>
          {children}
        </Text>
        {right}
      </View>
      <LinearGradient
        colors={tokens.isDark ? [tokens.cyan, tokens.amber, 'transparent'] : [tokens.amber, hexToRgba(tokens.amber, 0.25), 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ height: 2, width: 72, borderRadius: 2, marginTop: 8 }}
      />
    </View>
  );
}

export function LinkText({ label, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity onPress={onPress} hitSlop={8}>
      <Text style={{ color: tokens.cyan, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function DashboardRankRing({ rank, winRate, size = 92 }) {
  const tokens = useThemeStore((s) => s.tokens);
  const pct = Math.min(100, Math.max(0, Number(winRate) || 0));
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cx = size / 2;
  const pulse = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={{ width: size, height: size }}>
      <Animated.View
        style={{
          position: 'absolute',
          top: -6,
          left: -6,
          right: -6,
          bottom: -6,
          borderRadius: size,
          backgroundColor: 'rgba(0,232,255,0.18)',
          opacity: pulse,
        }}
      />
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGrad id="rankGradFut" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#00E8FF" />
            <Stop offset="55%" stopColor="#7CFF6B" />
            <Stop offset="100%" stopColor="#FFD24A" />
          </SvgGrad>
        </Defs>
        <Circle cx={cx} cy={cx} r={r} fill={tokens.live ? 'rgba(10,18,32,0.55)' : 'rgba(3,6,13,0.85)'} stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <Circle
          cx={cx}
          cy={cx}
          r={r}
          fill="none"
          stroke="url(#rankGradFut)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${circ}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View pointerEvents="none" style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center',
      }}
      >
        <Text style={{ color: FUT.gold, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }}>RANK</Text>
        <Text style={{ color: '#fff', fontWeight: '900', fontSize: 22, marginTop: 1 }}>{rank ? `#${rank}` : '—'}</Text>
        <Text style={{ color: FUT.cyan, fontSize: 10, fontWeight: '900', marginTop: 2 }}>{pct}% WR</Text>
      </View>
    </View>
  );
}

export function DashboardGamerStatCard({ label, value, sub, accent = 'cyan', icon }) {
  const tokens = useThemeStore((s) => s.tokens);
  const a = useAccent(accent);
  return (
    <LiveGlass
      intensity={36}
      style={{
        flex: 1,
        minHeight: 118,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: a.border,
        shadowColor: a.glow,
        shadowOpacity: tokens.isDark ? 0.4 : 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={a.colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1, padding: 13, minHeight: 118, justifyContent: 'flex-start' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          {icon ? <Ionicons name={icon} size={15} color={a.tint} /> : <View />}
          <View style={{
            width: 6, height: 6, borderRadius: 3, backgroundColor: a.tint, opacity: 0.9,
          }}
          />
        </View>
        <Text style={{
          color: tokens.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.6,
          textTransform: 'uppercase', marginTop: 8,
        }}
        >
          {label}
        </Text>
        <Text
          style={{
            color: tokens.text, fontWeight: '900', fontSize: 20, marginTop: 6, letterSpacing: -0.5,
          }}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {value}
        </Text>
        {sub ? (
          <Text style={{ color: tokens.muted, fontSize: 10, marginTop: 4, fontWeight: '600' }} numberOfLines={2}>
            {sub}
          </Text>
        ) : null}
      </View>
    </LiveGlass>
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
    { id: 'alerts', label: 'Alerts', value: unreadTotal, icon: 'notifications', href: '/apps/notifications', accent: 'rose', hot: unreadTotal > 0 },
  ];
  return (
    <View style={{ gap: 10 }}>
      {[0, 2].map((start) => (
        <View key={tiles[start].id} style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
          {tiles.slice(start, start + 2).map((t) => {
            const a = packs[t.accent] || cyan;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => onOpen?.(t.href)}
                activeOpacity={0.88}
                style={{ flex: 1 }}
              >
                <LiveGlass
                  intensity={36}
                  style={{
                    flex: 1,
                    minHeight: 72,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: t.hot ? a.border : tokens.hairline,
                    shadowColor: t.hot ? a.glow : tokens.cyan,
                    shadowOpacity: t.hot ? 0.45 : (tokens.live ? 0.28 : 0.12),
                    shadowRadius: 12,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 7,
                  }}
                >
                  <LinearGradient
                    colors={t.hot ? a.colors : (tokens.live
                      ? ['rgba(16,24,40,0.55)', 'rgba(8,12,22,0.48)']
                      : tokens.isDark ? ['rgba(16,24,40,0.95)', 'rgba(8,12,22,0.98)'] : [tokens.cardSolid, tokens.cardSolid])}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, minHeight: 72 }}>
                    <View style={{
                      width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: tokens.inputFill, borderWidth: 1, borderColor: a.border,
                    }}
                    >
                      <Ionicons name={t.icon} size={18} color={a.tint} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ color: tokens.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }}>
                        {t.label}
                      </Text>
                      <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 20, marginTop: 2 }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {t.value}
                      </Text>
                    </View>
                  </View>
                </LiveGlass>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function ratingStyle(value, tokens) {
  if (value >= 8) return { bg: tokens.isDark ? FUT.gold : tokens.amber, color: tokens.isDark ? '#111' : '#F8FAFC', border: tokens.amber };
  if (value >= 7) return { bg: tokens.isDark ? FUT.lime : '#15803D', color: '#F8FAFC', border: tokens.isDark ? FUT.lime : '#15803D' };
  if (value >= 6) return { bg: tokens.cyan, color: tokens.isDark ? '#031018' : '#F8FAFC', border: tokens.cyan };
  return {
    bg: tokens.inputFill,
    color: tokens.muted,
    border: tokens.hairline,
  };
}

function outcomeStyle(item, tokens) {
  const key = String(item || 'draw').toLowerCase();
  if (key === 'win') {
    return tokens.isDark
      ? { bg: 'rgba(124,255,107,0.18)', color: FUT.lime, border: 'rgba(124,255,107,0.45)', letter: 'W' }
      : { bg: 'rgba(21,128,61,0.16)', color: '#15803D', border: 'rgba(21,128,61,0.4)', letter: 'W' };
  }
  if (key === 'loss') {
    return tokens.isDark
      ? { bg: 'rgba(255,77,109,0.16)', color: FUT.rose, border: 'rgba(255,77,109,0.4)', letter: 'L' }
      : { bg: 'rgba(185,28,28,0.12)', color: '#B91C1C', border: 'rgba(185,28,28,0.35)', letter: 'L' };
  }
  return tokens.isDark
    ? { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.18)', letter: 'D' }
    : { bg: tokens.inputFill, color: tokens.muted, border: tokens.hairline, letter: 'D' };
}

export function DashboardFormStrip({ label, mode = 'outcome', items = [], emptyLabel }) {
  const tokens = useThemeStore((s) => s.tokens);
  if (!items?.length) {
    return (
      <View style={{ marginBottom: 10 }}>
        {label ? <Text style={[styles.stripLabel, { color: tokens.muted, marginBottom: 8 }]}>{label}</Text> : null}
        {emptyLabel ? <Text style={{ color: tokens.muted, fontSize: 12 }}>{emptyLabel}</Text> : null}
      </View>
    );
  }
  return (
    <View style={{ marginBottom: 10 }}>
      {label ? <Text style={[styles.stripLabel, { color: tokens.muted }]}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
        {items.map((item, i) => {
          if (mode === 'rating') {
            const s = ratingStyle(item, tokens);
            return (
              <View key={`${item}-${i}`} style={{
                width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: s.border,
                backgroundColor: s.bg, alignItems: 'center', justifyContent: 'center',
                shadowColor: s.border, shadowOpacity: 0.45, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
              }}
              >
                <Text style={{ color: s.color, fontWeight: '900', fontSize: 11 }}>{Number(item).toFixed(1)}</Text>
              </View>
            );
          }
          const o = outcomeStyle(item, tokens);
          return (
            <View key={`${item}-${i}`} style={{
              width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: o.border,
              backgroundColor: o.bg, alignItems: 'center', justifyContent: 'center',
            }}
            >
              <Text style={{ color: o.color, fontWeight: '900', fontSize: 13 }}>{o.letter}</Text>
            </View>
          );
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
    <View style={{
      flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100,
      borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
      backgroundColor: 'rgba(0,0,0,0.28)', paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6,
    }}
    >
      {data.map((d, i) => {
        const v = Number(d[valueKey] || 0);
        const h = Math.max(6, (v / max) * 70);
        return (
          <View key={`${d.label}-${i}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <LinearGradient
              colors={[color, 'rgba(255,255,255,0.08)']}
              style={{
                width: '72%', height: h, borderRadius: 7,
                shadowColor: color, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 },
              }}
            />
            <Text style={{ color: tokens.faint, fontSize: 8, marginTop: 5, fontWeight: '700' }} numberOfLines={1}>
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
  if (loading) return <ActivityIndicator color={FUT.cyan} />;
  if (error) return <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text>;
  if (!items.length) return <Text style={{ color: tokens.muted, fontSize: 12 }}>No open objectives.</Text>;

  return (
    <View style={{ gap: 9 }}>
      {items.slice(0, 6).map((item) => {
        const title = item.title || item.objective_title || item.name || 'Objective';
        const progress = Number(item.progress ?? item.current_value ?? 0);
        const target = Number(item.target ?? item.target_value ?? 1) || 1;
        const done = item.claimed || item.status === 'claimed';
        const claimable = !done && (item.completed || progress >= target);
        const pct = Math.min(100, Math.round((progress / target) * 100));
        return (
          <LinearGradient
            key={item.id}
            colors={['rgba(0,232,255,0.08)', 'rgba(0,0,0,0.35)']}
            style={{
              borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,232,255,0.22)', padding: 12,
            }}
          >
            <Text style={{ color: tokens.text, fontWeight: '800', fontSize: 13 }}>{title}</Text>
            <Text style={{ color: tokens.muted, fontSize: 11, marginTop: 3 }}>
              {progress}/{target} · {String(item.scope || 'daily').toUpperCase()}
            </Text>
            <View style={{
              height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.08)', marginTop: 10, overflow: 'hidden',
            }}
            >
              <LinearGradient
                colors={[FUT.cyan, FUT.gold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: `${pct}%`, height: '100%' }}
              />
            </View>
            {claimable ? (
              <TouchableOpacity
                onPress={() => claim(item.id)}
                disabled={claimingId === item.id}
                style={{
                  marginTop: 11, minHeight: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(255,210,74,0.16)', borderWidth: 1, borderColor: 'rgba(255,210,74,0.45)',
                }}
              >
                {claimingId === item.id
                  ? <ActivityIndicator color={FUT.gold} size="small" />
                  : <Text style={{ color: FUT.gold, fontWeight: '900', fontSize: 12, letterSpacing: 1 }}>CLAIM REWARD</Text>}
              </TouchableOpacity>
            ) : null}
          </LinearGradient>
        );
      })}
    </View>
  );
}

export function FutMatchLogPanel({ playerId, initialMatches = [] }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [matches, setMatches] = useState(initialMatches);
  const [result, setResult] = useState('win');
  const [score, setScore] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { setMatches(initialMatches); }, [initialMatches]);

  const refresh = async () => {
    if (!playerId) return;
    const rows = await stageClient.entities.FutMatch.filter({ player_id: playerId }, '-played_at', 20).catch(() => []);
    setMatches(Array.isArray(rows) ? rows : []);
  };

  const add = async () => {
    if (!playerId) return;
    setBusy(true);
    try {
      await stageClient.entities.FutMatch.create({
        player_id: playerId,
        result,
        score: score || null,
        played_at: new Date().toISOString(),
      });
      setScore('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    setBusy(true);
    try {
      await stageClient.entities.FutMatch.delete(id);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {['win', 'draw', 'loss'].map((r) => {
          const active = result === r;
          const color = r === 'win' ? FUT.lime : r === 'loss' ? FUT.rose : FUT.cyan;
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setResult(r)}
              style={{
                flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5,
                borderColor: active ? color : 'rgba(255,255,255,0.12)',
                backgroundColor: active ? `${color}22` : 'rgba(255,255,255,0.03)',
              }}
            >
              <Text style={{ color: active ? color : 'rgba(255,255,255,0.45)', fontWeight: '900', textTransform: 'uppercase', fontSize: 11 }}>{r}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, borderWidth: 1.5,
        borderColor: 'rgba(0,232,255,0.25)', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, minHeight: 48,
      }}
      >
        <TextInput
          value={score}
          onChangeText={setScore}
          placeholder="Score e.g. 3-1"
          placeholderTextColor={tokens.faint}
          style={{ flex: 1, color: tokens.text, fontSize: 14, paddingVertical: 10, fontWeight: '700' }}
        />
        <TouchableOpacity onPress={add} disabled={busy} style={{
          paddingHorizontal: 14, minHeight: 36, borderRadius: 11, backgroundColor: 'rgba(0,232,255,0.16)',
          borderWidth: 1, borderColor: 'rgba(0,232,255,0.4)', alignItems: 'center', justifyContent: 'center',
        }}
        >
          <Text style={{ color: FUT.cyan, fontWeight: '900', fontSize: 12 }}>{busy ? '…' : 'ADD'}</Text>
        </TouchableOpacity>
      </View>
      {(matches || []).slice(0, 8).map((m) => (
        <View key={m.id} style={{
          flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(0,0,0,0.28)', padding: 12,
        }}
        >
          <Text style={{ color: FUT.gold, fontWeight: '900', width: 42, textTransform: 'uppercase' }}>
            {String(m.result || 'D').slice(0, 1)}
          </Text>
          <View style={{ flex: 1 }}>
            <Text style={{ color: tokens.text, fontSize: 13, fontWeight: '700' }}>{m.score || '—'}</Text>
            <Text style={{ color: tokens.faint, fontSize: 11, marginTop: 2 }}>
              {m.played_at ? String(m.played_at).slice(0, 10) : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => remove(m.id)} hitSlop={8}>
            <Ionicons name="trash-outline" size={16} color="rgba(255,77,109,0.85)" />
          </TouchableOpacity>
        </View>
      ))}
      {!matches?.length ? (
        <Text style={{ color: tokens.muted, fontSize: 12 }}>Log FUT matches to track form.</Text>
      ) : null}
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
    <View style={{ gap: 10 }}>
      {eafcSummary?.clubName ? (
        <LinearGradient
          colors={['rgba(255,210,74,0.2)', 'rgba(0,0,0,0.35)']}
          style={{
            borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,210,74,0.4)', padding: 14,
            overflow: 'hidden',
          }}
        >
          <Text style={{ color: FUT.gold, fontSize: 10, fontWeight: '900', letterSpacing: 2 }}>LINKED PRO CLUB</Text>
          <Text style={{ color: tokens.text, fontWeight: '900', fontSize: 18, marginTop: 6, textTransform: 'uppercase' }}>
            {eafcSummary.clubName}
          </Text>
          <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }}>ID {eafcSummary.clubId}</Text>
        </LinearGradient>
      ) : (
        <Text style={{ color: tokens.muted, fontSize: 12 }}>Link your EA FC Pro Club to show club form here.</Text>
      )}
      <TextInput
        value={clubName}
        onChangeText={setClubName}
        placeholder="Pro Club name"
        placeholderTextColor={tokens.faint}
        style={[styles.input, { color: tokens.text, borderColor: tokens.cyanBorder, backgroundColor: tokens.inputFill }]}
      />
      <TextInput
        value={String(clubId || '')}
        onChangeText={setClubId}
        placeholder="Club ID"
        placeholderTextColor={tokens.faint}
        style={[styles.input, { color: tokens.text, borderColor: tokens.cyanBorder, backgroundColor: tokens.inputFill }]}
      />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={save} disabled={busy} style={[styles.btn, { flex: 1, backgroundColor: 'rgba(0,232,255,0.14)', borderColor: 'rgba(0,232,255,0.4)' }]}>
          <Text style={{ color: FUT.cyan, fontWeight: '900' }}>{busy ? '…' : 'SAVE LINK'}</Text>
        </TouchableOpacity>
        {eafcSummary?.clubId ? (
          <TouchableOpacity onPress={unlink} disabled={busy} style={[styles.btn, { borderColor: 'rgba(255,77,109,0.4)', backgroundColor: 'rgba(255,77,109,0.1)' }]}>
            <Text style={{ color: FUT.rose, fontWeight: '900' }}>UNLINK</Text>
          </TouchableOpacity>
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
      borderWidth: 1.5, borderColor: tokens.amberBorder,
      backgroundColor: tokens.live ? 'transparent' : tokens.cardSolid,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: tokens.amber, shadowOpacity: tokens.isDark ? 0.35 : 0.12, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    }}
    >
      {club?.logo_url
        ? <Image source={{ uri: club.logo_url }} style={{ width: size, height: size }} />
        : <Ionicons name="shield" size={size * 0.4} color={FUT.gold} />}
    </View>
  );
}

export function FutCta({ label, onPress, primary = false, icon }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{ flex: 1, minHeight: 48 }}
    >
      <LiveGlass
        intensity={36}
        style={{
          flex: 1,
          minHeight: 48,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: primary ? tokens.cyanBorder : tokens.hairline,
        }}
      >
        <LinearGradient
          colors={primary
            ? [tokens.tileFill, 'rgba(10,18,32,0.45)']
            : [tokens.inputFill, tokens.card]}
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
        {icon ? <Ionicons name={icon} size={15} color={primary ? tokens.cyan : tokens.text} /> : null}
        <Text style={{
          color: primary ? tokens.cyan : tokens.text,
          fontWeight: '900',
          fontSize: 12,
          letterSpacing: 1.1,
        }}
        >
          {label}
        </Text>
        </LinearGradient>
      </LiveGlass>
    </TouchableOpacity>
  );
}

const styles = {
  stripLabel: {
    color: 'rgba(255,255,255,0.42)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(0,232,255,0.22)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  btn: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
};
