import React from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { hexToRgba } from '@/lib/stageTheme';
import LiveGlass from '@/components/theme/LiveGlass';
import LiveDarkWallpaper from '@/components/theme/LiveDarkWallpaper';

export const GAMER_BG = '#05070F';
export const CYAN = '#00F0FF';
export const AMBER = '#FFD60A';
export const PITCH = '#07121F';

export function useGamerTokens() {
  return useThemeStore((s) => s.tokens);
}

function GlassFill({ children, style, intensity = 22 }) {
  const tokens = useGamerTokens();
  return (
    <LiveGlass
      intensity={intensity}
      style={[
        {
          backgroundColor: tokens.live ? 'transparent' : tokens.glass,
          borderColor: tokens.hairline,
          borderWidth: 1,
        },
        style,
      ]}
    >
      {children}
    </LiveGlass>
  );
}

export function GamerProfileShell({ children, style }) {
  const tokens = useGamerTokens();
  const liveDark = useThemeStore((s) => s.liveDark);
  return (
    <View style={[{ flex: 1, backgroundColor: liveDark ? 'transparent' : tokens.bg }, style]}>
      {liveDark ? (
        <LiveDarkWallpaper />
      ) : (
        <LinearGradient
          colors={tokens.wash}
          locations={[0, 0.45, 1]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.95, y: 0.55 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: tokens.isDark ? 0.035 : 0.06 }]}
      >
        {Array.from({ length: 24 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: i * 48,
              height: StyleSheet.hairlineWidth,
              backgroundColor: tokens.text,
            }}
          />
        ))}
      </View>
      <View style={{ flex: 1, zIndex: 1 }}>{children}</View>
    </View>
  );
}

export function GamerBanner({
  bannerUrl,
  wash = 'player',
  height = 240,
  topLeft,
  topRight,
  onPress,
}) {
  const tokens = useGamerTokens();
  const washColors = wash === 'player'
    ? [tokens.wash[0], 'transparent', tokens.wash[2]]
    : [tokens.wash[2], 'transparent', tokens.wash[0]];

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper activeOpacity={0.95} onPress={onPress} style={{ height, width: '100%', overflow: 'hidden' }}>
      {bannerUrl && String(bannerUrl).startsWith('http') ? (
        <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['#0B1B33', '#08101C', tokens.bg]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* stadium floodlights */}
      <LinearGradient
        colors={tokens.isDark ? ['rgba(226,234,244,0.14)', 'transparent'] : ['rgba(226,234,244,0.28)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={washColors}
        start={{ x: 0, y: 0.4 }}
        end={{ x: 1, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <LinearGradient
        colors={tokens.live
          ? [hexToRgba(tokens.bg, 0.05), hexToRgba(tokens.bg, 0.28), 'transparent']
          : [hexToRgba(tokens.bg, 0.15), hexToRgba(tokens.bg, 0.55), tokens.bg]}
        locations={[0.2, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* bottom accent line */}
      <LinearGradient
        colors={wash === 'player' ? [tokens.cyan, 'transparent', tokens.amber] : [tokens.amber, 'transparent', tokens.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, opacity: 0.55 }}
        pointerEvents="none"
      />
      {topLeft ? (
        <View style={{ position: 'absolute', top: 10, left: 12, zIndex: 20, maxWidth: '62%' }}>{topLeft}</View>
      ) : null}
      {topRight ? (
        <View style={{ position: 'absolute', top: 10, right: 12, zIndex: 20, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {topRight}
        </View>
      ) : null}
    </Wrapper>
  );
}

export const BANNER_AVATAR_SIZE = 72;

export function ProfileBannerAvatar({
  imageUrl,
  size = BANNER_AVATAR_SIZE,
  accent = 'amber',
  emptyIcon = 'shield',
}) {
  const uri = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;
  const ring = accent === 'cyan' ? CYAN : AMBER;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: ring,
        backgroundColor: '#0A1222',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: ring,
        shadowOpacity: 0.45,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 10,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Ionicons name={emptyIcon} size={Math.round(size * 0.42)} color={ring} />
      )}
    </View>
  );
}

export function ClubBannerAvatar({ logoUrl, size = BANNER_AVATAR_SIZE }) {
  return <ProfileBannerAvatar imageUrl={logoUrl} size={size} accent="amber" emptyIcon="shield" />;
}

export function GlassIconButton({ icon, onPress, badge, badgeColor, accessibilityLabel }) {
  const tokens = useGamerTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <GlassFill style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={18} color={tokens.text} />
        {badge ? (
          <View
            style={{
              position: 'absolute',
              top: -2,
              right: -2,
              minWidth: 16,
              height: 16,
              borderRadius: 8,
              backgroundColor: badgeColor || tokens.cyan,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 3,
            }}
          >
            <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>{badge}</Text>
          </View>
        ) : null}
      </GlassFill>
    </TouchableOpacity>
  );
}

export function GlassTextButton({ label, icon, onPress }) {
  const tokens = useGamerTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <GlassFill
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 9,
          borderRadius: 999,
        }}
      >
        {icon ? <Ionicons name={icon} size={14} color={tokens.text} /> : null}
        <Text style={{ color: tokens.text, fontSize: 10, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
          {label}
        </Text>
      </GlassFill>
    </TouchableOpacity>
  );
}

/** Classic FUT-style vertical player card */
export function FutIdentityCard({
  imageUrl,
  accent = 'cyan', // cyan | amber | gold
  overall,
  position,
  shirtNumber,
  name,
  subtitle,
  badgeLabel, // PREZ / WR
  badgeValue,
  emptyIcon = 'person',
  onPress,
  width = 148,
}) {
  const height = Math.round(width * 1.45);
  const isAmber = accent === 'amber' || accent === 'gold';
  const frame = isAmber
    ? ['#F6E27A', '#C9A227', '#8A6A12', '#F6E27A']
    : ['#7DF9FF', '#00B7C7', '#0A4A55', '#7DF9FF'];
  const glow = isAmber ? AMBER : CYAN;
  const ovr = overall == null || overall === ''
    ? null
    : (Number.isInteger(Number(overall)) ? String(Math.round(Number(overall))) : (Math.round(Number(overall) * 10) / 10).toFixed(1));

  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper onPress={onPress} activeOpacity={0.92} style={{ width, shadowColor: glow, shadowOpacity: 0.55, shadowRadius: 22, shadowOffset: { width: 0, height: 8 }, elevation: 12 }}>
      <LinearGradient
        colors={frame}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, padding: 2.5 }}
      >
        <LinearGradient
          colors={isAmber ? ['#2A1C05', '#120E08', '#1A1408'] : ['#071A28', '#05070F', '#0A1F2E']}
          style={{ borderRadius: 16, overflow: 'hidden', height: height - 5, width: width - 5 }}
        >
          {/* foil sheen */}
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'transparent', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={{
                position: 'absolute',
                top: 28,
                left: 8,
                right: 8,
                bottom: 52,
                borderRadius: 8,
              }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ position: 'absolute', top: 40, left: 0, right: 0, bottom: 56, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={emptyIcon} size={52} color={isAmber ? 'rgba(255,214,10,0.25)' : 'rgba(0,240,255,0.25)'} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.92)']}
            locations={[0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* FUT left stack: OVR + POS */}
          <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, alignItems: 'center', minWidth: 40 }}>
            {ovr != null ? (
              <Text style={{ color: '#fff', fontSize: 28, fontWeight: '900', lineHeight: 30, letterSpacing: -1 }}>
                {ovr}
              </Text>
            ) : badgeValue != null ? (
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: '900', lineHeight: 28, letterSpacing: -1 }}>
                {badgeValue}
              </Text>
            ) : null}
            <Text
              style={{
                color: isAmber ? AMBER : CYAN,
                fontSize: 13,
                fontWeight: '900',
                letterSpacing: 1,
                textTransform: 'uppercase',
                marginTop: 1,
              }}
            >
              {position || badgeLabel || '—'}
            </Text>
          </View>

          {/* chem corner gem */}
          <LinearGradient
            colors={isAmber ? ['#FFE566', '#C9A227'] : ['#7DF9FF', '#00A8B8']}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 18,
              height: 18,
              borderRadius: 4,
              transform: [{ rotate: '45deg' }],
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.35)',
            }}
          />

          <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10, zIndex: 3 }}>
            <Text
              numberOfLines={1}
              style={{
                color: '#fff',
                fontSize: 13,
                fontWeight: '900',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {name || '—'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
              <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '700', flex: 1 }}>
                {subtitle || (shirtNumber != null && shirtNumber !== '' ? `#${shirtNumber}` : ' ')}
              </Text>
              {shirtNumber != null && shirtNumber !== '' && subtitle ? (
                <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800' }}>#{shirtNumber}</Text>
              ) : null}
            </View>
          </View>
        </LinearGradient>
      </LinearGradient>
    </Wrapper>
  );
}

// Back-compat aliases used by older screens
export function GamerPhotoFrame(props) {
  return (
    <FutIdentityCard
      imageUrl={props.imageUrl}
      accent={props.accent}
      position={props.bottomTitle}
      subtitle={props.bottomSub}
      emptyIcon={props.emptyIcon}
      onPress={props.onPress}
      width={props.width || 148}
      overall={props.overall}
      name={props.name}
      badgeLabel={props.badgeLabel}
      badgeValue={props.badgeValue}
    />
  );
}

export function OvrBadge() { return null; }
export function PrezBadge() { return null; }
export function WrBadge() { return null; }

export function GamerMetaPill({ children, icon, iconColor, onPress, style }) {
  const tokens = useGamerTokens();
  const tint = iconColor || tokens.muted;
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} activeOpacity={0.8}>
      <GlassFill
        style={[{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 6,
        }, style]}
        intensity={18}
      >
        {icon ? <Ionicons name={icon} size={12} color={tint} /> : null}
        <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' }}>
          {children}
        </Text>
      </GlassFill>
    </Wrapper>
  );
}

export function GamerRecordStrip({ wins = 0, draws = 0, losses = 0 }) {
  const tokens = useGamerTokens();
  const items = [
    { label: 'W', value: Number(wins) || 0, color: '#34D399', bg: 'rgba(16,185,129,0.18)', border: 'rgba(52,211,153,0.35)' },
    { label: 'D', value: Number(draws) || 0, color: tokens.muted, bg: tokens.inputFill, border: tokens.hairline },
    { label: 'L', value: Number(losses) || 0, color: '#FB7185', bg: 'rgba(244,63,94,0.18)', border: 'rgba(251,113,133,0.35)' },
  ];
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={{
            minWidth: 58,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: item.border,
            backgroundColor: item.bg,
            paddingVertical: 8,
            paddingHorizontal: 10,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: item.color, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 }}>
            {item.value}
          </Text>
          <Text style={{ color: item.color, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 1 }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function GamerTabNav({ tabs, active, onChange, accent = 'cyan' }) {
  const tokens = useGamerTokens();
  const activeBorder = accent === 'amber' ? tokens.amberBorder : tokens.cyanBorder;
  const activeBg = accent === 'amber' ? 'rgba(255,214,10,0.14)' : (tokens.isDark ? 'rgba(0,240,255,0.16)' : 'rgba(14,116,144,0.12)');
  const activeText = accent === 'amber' ? tokens.amber : tokens.cyan;
  const list = Array.isArray(tabs) ? tabs : [];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {list.map((tab) => {
        const isActive = active === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => onChange?.(tab.id)}
            style={{
              borderRadius: 10,
              paddingHorizontal: 16,
              paddingVertical: 11,
              borderWidth: 1,
              borderColor: isActive ? activeBorder : tokens.hairline,
              backgroundColor: isActive ? activeBg : tokens.inputFill,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Text
              style={{
                color: isActive ? activeText : tokens.muted,
                fontSize: 11,
                fontWeight: '900',
                letterSpacing: 1.8,
                textTransform: 'uppercase',
              }}
            >
              {tab.label}
            </Text>
            {tab.badge != null && tab.badge !== '' ? (
              <View
                style={{
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  paddingHorizontal: 5,
                  backgroundColor: isActive ? activeText : 'rgba(255,255,255,0.2)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>{tab.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

/** Two-level club nav — group pills + sub-tab strip (matches web GamerClubTabNav). */
export function GamerClubTabNav({ groups = [], activeTab, tabLabels = {}, onChange, badgeForTab }) {
  const safeGroups = (groups || []).filter((g) => Array.isArray(g.tabs) && g.tabs.length > 0);
  const activeGroup = safeGroups.find((g) => g.tabs.includes(activeTab)) || safeGroups[0];

  if (!safeGroups.length) return null;

  return (
    <View style={{ gap: 10 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {safeGroups.map((group) => {
          const isActive = group.tabs.includes(activeTab);
          return (
            <TouchableOpacity
              key={group.id || group.label}
              onPress={() => onChange?.(group.tabs[0])}
              style={{
                borderRadius: 999,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderWidth: 1,
                borderColor: isActive ? 'rgba(255,214,10,0.45)' : 'rgba(255,255,255,0.1)',
                backgroundColor: isActive ? 'rgba(255,214,10,0.14)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <Text
                style={{
                  color: isActive ? AMBER : 'rgba(255,255,255,0.4)',
                  fontSize: 10,
                  fontWeight: '900',
                  letterSpacing: 1.8,
                  textTransform: 'uppercase',
                }}
              >
                {group.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeGroup && activeGroup.tabs.length > 1 ? (
        <GamerTabNav
          accent="cyan"
          active={activeTab}
          onChange={onChange}
          tabs={activeGroup.tabs.map((id) => ({
            id,
            label: tabLabels[id] || id,
            badge: badgeForTab?.(id) || undefined,
          }))}
        />
      ) : null}
    </View>
  );
}

export function EmptyTabPanel({
  icon = 'albums-outline',
  title,
  hint,
  actionLabel,
  onAction,
  accent = 'cyan',
}) {
  const actionColor = accent === 'amber' ? AMBER : CYAN;
  return (
    <GamerSectionCard>
      <View style={{ alignItems: 'center', paddingVertical: 22 }}>
        <Ionicons name={icon} size={36} color="rgba(255,255,255,0.2)" />
        {title ? (
          <Text style={{ color: 'rgba(255,255,255,0.85)', marginTop: 10, fontSize: 14, fontWeight: '800' }}>
            {title}
          </Text>
        ) : null}
        <Text style={{ color: 'rgba(255,255,255,0.58)', marginTop: 6, fontSize: 13, lineHeight: 19, textAlign: 'center', paddingHorizontal: 12 }}>
          {hint || 'Nothing here yet.'}
        </Text>
        {actionLabel && onAction ? (
          <TouchableOpacity
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            activeOpacity={0.85}
            style={{
              marginTop: 16,
              minHeight: 44,
              paddingHorizontal: 18,
              borderRadius: 12,
              backgroundColor: actionColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#041018', fontWeight: '900', fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase' }}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </GamerSectionCard>
  );
}

export function GamerSectionCard({ title, children, style }) {
  const tokens = useGamerTokens();
  return (
    <GlassFill style={[{ borderRadius: 18, overflow: 'hidden' }, style]} intensity={22}>
      {title ? (
        <View style={{
          paddingHorizontal: 14,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: tokens.hairline,
          overflow: 'hidden',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
        }}>
          <Text style={{ fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', color: tokens.text }}>
            {title}
          </Text>
        </View>
      ) : null}
      <View style={{ padding: 14 }}>{children}</View>
    </GlassFill>
  );
}

export function GamerStatTile({ label, value, accent = 'cyan' }) {
  const tokens = useGamerTokens();
  const color = accent === 'amber' ? tokens.amber : accent === 'green' ? '#34D399' : accent === 'rose' ? '#FB7185' : tokens.cyan;
  return (
    <GlassFill
      intensity={16}
      style={{
        flex: 1,
        minWidth: '45%',
        borderRadius: 14,
        padding: 14,
        overflow: 'hidden',
      }}
    >
      <Text style={{ fontSize: 9, fontWeight: '800', letterSpacing: 2, color: tokens.muted, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 28, fontWeight: '900', color, letterSpacing: -1 }}>{value}</Text>
    </GlassFill>
  );
}

export function CyanCta({ label, onPress, style }) {
  const tokens = useGamerTokens();
  return (
    <TouchableOpacity onPress={onPress} style={[{ flex: 1 }, style]} activeOpacity={0.88}>
      <LinearGradient
        colors={tokens.isDark ? [tokens.cyan, '#00C2B3'] : [tokens.cyan, '#14532D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 13,
          borderRadius: 12,
          alignItems: 'center',
          shadowColor: tokens.cyan,
          shadowOpacity: tokens.isDark ? 0.45 : 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}
      >
        <Text
          style={{
            color: tokens.primaryText,
            fontSize: 12,
            fontWeight: '900',
            letterSpacing: 1.6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function OutlineCta({ label, icon, onPress, style }) {
  const tokens = useGamerTokens();
  return (
    <TouchableOpacity onPress={onPress} style={[{ flex: 1 }, style]} activeOpacity={0.85}>
      <GlassFill
        intensity={20}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          paddingHorizontal: 12,
          paddingVertical: 13,
          borderRadius: 12,
        }}
      >
        {icon ? <Ionicons name={icon} size={14} color={tokens.text} /> : null}
        <Text
          style={{
            color: tokens.text,
            fontSize: 12,
            fontWeight: '900',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      </GlassFill>
    </TouchableOpacity>
  );
}

/** Identity rail — single control for Player / President / Club */
export function IdentityRail({ items, value, onChange }) {
  const tokens = useGamerTokens();
  if (!items?.length || items.length <= 1) return null;
  return (
    <GlassFill
      intensity={30}
      style={{
        flexDirection: 'row',
        borderRadius: 14,
        padding: 3,
        gap: 2,
      }}
    >
      {items.map((item) => {
        const active = value === item.id;
        const amber = item.id !== 'player';
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onChange(item.id)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 11,
              backgroundColor: active
                ? (amber ? tokens.tileFill : tokens.tileFill)
                : 'transparent',
              borderWidth: active ? 1 : 0,
              borderColor: active ? (amber ? tokens.amberBorder : tokens.cyanBorder) : 'transparent',
            }}
          >
            <Text
              style={{
                color: active ? (amber ? tokens.amber : tokens.cyan) : tokens.muted,
                fontSize: 10,
                fontWeight: '900',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </GlassFill>
  );
}

/**
 * Premium EAFC hero: cinematic banner + FUT card overlapping + identity column.
 * Mobile = card left / info right (tight), then full-width CTAs below.
 */
export function GamerHeroLayout({
  banner,
  photo,
  title,
  titleAccessory,
  pills,
  sideActions,
  record,
  bio,
  children,
  overlap = -110,
}) {
  const tokens = useGamerTokens();
  return (
    <View>
      {banner}
      <View style={{ paddingHorizontal: 16, marginTop: overlap, zIndex: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          {photo}
          <View style={{ flex: 1, minWidth: 0, paddingBottom: 4, gap: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: tokens.text,
                  fontSize: 30,
                  fontWeight: '900',
                  letterSpacing: -0.8,
                  textTransform: 'uppercase',
                  lineHeight: 32,
                  flexShrink: 1,
                }}
              >
                {title}
              </Text>
              {titleAccessory}
            </View>
            {pills ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>{pills}</View>
            ) : null}
          </View>
        </View>

        {sideActions ? (
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>{sideActions}</View>
        ) : null}

        {record ? <View style={{ marginTop: 14 }}>{record}</View> : null}

        {bio ? (
          <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19, marginTop: 12 }}>
            {bio}
          </Text>
        ) : null}
        {children ? <View style={{ marginTop: 10, gap: 8 }}>{children}</View> : null}
      </View>
    </View>
  );
}
