import React from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import useThemeStore from '@/store/themeStore';
import { CARD_RADIUS, STAGE_PALETTE, hexToRgba } from '@/lib/stageTheme';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { pageBottomPad } from '@/lib/pageInsets';
import SegmentedControl from '@/components/ui/SegmentedControl';
import LiveGlass from '@/components/theme/LiveGlass';
import LiveDarkWallpaper from '@/components/theme/LiveDarkWallpaper';
import TrapeziumPhotoCard from '@/components/profile/TrapeziumPhotoCard';

/** Legacy export names kept for importers; the values are Stage palette colours. */
export const GAMER_BG = STAGE_PALETTE.bg;
export const CYAN = STAGE_PALETTE.cyan;
export const AMBER = STAGE_PALETTE.warning;
export const PITCH = STAGE_PALETTE.bgDeep;

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
          borderColor: tokens.border,
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
  const insets = useSafeAreaInsets();
  return (
    <View style={[{ flex: 1, backgroundColor: liveDark ? 'transparent' : tokens.bg }, style]}>
      {liveDark ? <LiveDarkWallpaper /> : null}
      <View style={{ flex: 1, zIndex: 1, paddingBottom: pageBottomPad(insets.bottom) }}>
        {children}
      </View>
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
          colors={[tokens.card, tokens.bgDeep, tokens.bg]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* stadium floodlights */}
      <LinearGradient
        colors={[hexToRgba(tokens.text, tokens.isDark ? 0.14 : 0.28), 'transparent']}
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
  const tokens = useGamerTokens();
  const uri = typeof imageUrl === 'string' && imageUrl.trim() ? imageUrl.trim() : null;
  const ring = accent === 'cyan' ? tokens.cyan : tokens.amber;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: ring,
        backgroundColor: tokens.bgDeep,
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

/** Default spoken labels for icon-only buttons whose caller passed none. */
const ICON_LABELS = {
  'arrow-back': 'Back',
  'chevron-back': 'Back',
  'arrow-forward': 'Next',
  'chevron-forward': 'Next',
  close: 'Close',
  'close-outline': 'Close',
  'trash-outline': 'Delete',
  'search': 'Search',
  'search-outline': 'Search',
  'settings-outline': 'Settings',
  'add': 'Add',
  'add-outline': 'Add',
  'ellipsis-horizontal': 'More',
  'ellipsis-vertical': 'More',
  'share-outline': 'Share',
  'checkmark-done': 'Mark all as read',
  'notifications-outline': 'Notifications',
  'mail-outline': 'Inbox',
  'create-outline': 'Edit',
  'pencil-outline': 'Edit',
};

/** Accessible name for an icon-only button: explicit label, else derived from the icon. */
export function iconButtonLabel(icon, explicit) {
  if (explicit) return explicit;
  if (ICON_LABELS[icon]) return ICON_LABELS[icon];
  const words = String(icon || '')
    .replace(/-(outline|sharp)$/, '')
    .split('-')
    .filter(Boolean)
    .join(' ');
  return words ? `${words.charAt(0).toUpperCase()}${words.slice(1)}` : undefined;
}

export function GlassIconButton({ icon, onPress, badge, badgeColor, accessibilityLabel }) {
  const tokens = useGamerTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={iconButtonLabel(icon, accessibilityLabel)}
    >
      <GlassFill style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon} size={22} color={tokens.text} />
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
            <Text style={{ color: tokens.onCyan, fontSize: 9, fontWeight: '900' }}>{badge}</Text>
          </View>
        ) : null}
      </GlassFill>
    </TouchableOpacity>
  );
}

export function GlassTextButton({ label, icon, onPress, tone = 'glass' }) {
  const tokens = useGamerTokens();
  const outline = tone === 'outline';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: outline ? 14 : 999,
          borderWidth: 1,
          borderColor: outline ? tokens.borderStrong : tokens.border,
          backgroundColor: outline ? hexToRgba(tokens.bgDeep, 0.6) : tokens.glass,
          minHeight: 44,
        }}
      >
        {icon ? <Ionicons name={icon} size={16} color={tokens.text} /> : null}
        <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 13, fontWeight: '600' }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function OverlayIdentityCard({
  imageUrl,
  overall,
  position,
  emptyIcon = 'person',
  onPress,
  width = 170,
}) {
  const tokens = useGamerTokens();
  const height = Math.round(width * 1.12);
  const ovr = overall == null || overall === ''
    ? null
    : (Number.isInteger(Number(overall)) ? String(Math.round(Number(overall))) : (Math.round(Number(overall) * 10) / 10).toFixed(1));

  return (
    <TrapeziumPhotoCard
      width={width}
      height={height}
      imageUrl={imageUrl}
      onPress={onPress}
      edgeColor={hexToRgba(tokens.cyan, 0.7)}
    >
      {!imageUrl ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={emptyIcon} size={42} color={hexToRgba(tokens.cyan, 0.35)} />
        </View>
      ) : null}
      {ovr != null ? (
        <View
          style={{
            position: 'absolute',
            top: 10,
            right: 4,
            transform: [{ skewX: '-12deg' }],
          }}
        >
          <View style={{ backgroundColor: tokens.cyan, minWidth: 38, paddingHorizontal: 7, paddingTop: 3, paddingBottom: 4, alignItems: 'center' }}>
            <View style={{ transform: [{ skewX: '12deg' }], alignItems: 'center' }}>
              <Text style={{ color: tokens.onCyan, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 }}>OVR</Text>
              <Text style={{ color: tokens.onCyan, fontFamily: FONT_EA_SPORTS, fontSize: 17, lineHeight: 19 }}>{ovr}</Text>
            </View>
          </View>
        </View>
      ) : null}
      {position ? (
        <Text
          numberOfLines={1}
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 10,
            color: tokens.text,
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
          }}
        >
          POS {position}
        </Text>
      ) : null}
    </TrapeziumPhotoCard>
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
  variant = 'fut',
}) {
  const tokens = useGamerTokens();
  if (variant === 'overlay') {
    return (
      <OverlayIdentityCard
        imageUrl={imageUrl}
        overall={overall}
        position={position}
        emptyIcon={emptyIcon}
        onPress={onPress}
        width={width}
      />
    );
  }
  const height = Math.round(width * 1.45);
  const isAmber = accent === 'amber' || accent === 'gold';
  const frame = isAmber
    ? [tokens.warning, tokens.warningBorder, tokens.warningBg, tokens.warning]
    : [tokens.cyanHi, tokens.aqua, tokens.card, tokens.cyanHi];
  const glow = isAmber ? tokens.amber : tokens.cyan;
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
          colors={isAmber
            ? [tokens.warningBg, tokens.bgDeep, tokens.warningBg]
            : [tokens.cardHi, tokens.bgDeep, tokens.card]}
          style={{ borderRadius: 16, overflow: 'hidden', height: height - 5, width: width - 5 }}
        >
          {/* foil sheen */}
          <LinearGradient
            colors={[hexToRgba(tokens.text, 0.18), 'transparent', hexToRgba(tokens.text, 0.05)]}
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
              <Ionicons name={emptyIcon} size={52} color={hexToRgba(glow, 0.25)} />
            </View>
          )}

          <LinearGradient
            colors={['transparent', hexToRgba(tokens.bgDeep, 0.15), hexToRgba(tokens.bgDeep, 0.92)]}
            locations={[0.35, 0.65, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          {/* FUT left stack: OVR + POS */}
          <View style={{ position: 'absolute', top: 10, left: 10, zIndex: 3, alignItems: 'center', minWidth: 40 }}>
            {ovr != null ? (
              <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 28, lineHeight: 30 }}>
                {ovr}
              </Text>
            ) : badgeValue != null ? (
              <Text style={{ color: tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 26, lineHeight: 28 }}>
                {badgeValue}
              </Text>
            ) : null}
            <Text
              style={{
                color: glow,
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
            colors={isAmber ? [tokens.warning, tokens.warningBorder] : [tokens.cyanHi, tokens.aqua]}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              width: 18,
              height: 18,
              borderRadius: 4,
              transform: [{ rotate: '45deg' }],
              borderWidth: 1,
              borderColor: hexToRgba(tokens.text, 0.35),
            }}
          />

          <View style={{ position: 'absolute', left: 10, right: 10, bottom: 10, zIndex: 3 }}>
            <Text
              numberOfLines={1}
              style={{
                color: tokens.text,
                fontSize: 13,
                fontWeight: '800',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
              }}
            >
              {name || '—'}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 3 }}>
              <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 10, fontWeight: '700', flex: 1 }}>
                {subtitle || (shirtNumber != null && shirtNumber !== '' ? `#${shirtNumber}` : ' ')}
              </Text>
              {shirtNumber != null && shirtNumber !== '' && subtitle ? (
                <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '800' }}>#{shirtNumber}</Text>
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

export function GamerMetaPill({ children, icon, iconColor, leading, onPress, style }) {
  const tokens = useGamerTokens();
  const tint = iconColor || tokens.muted;
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.8}
      {...(onPress ? { hitSlop: { top: 8, bottom: 8 }, accessibilityRole: 'button' } : {})}
      style={{ flexShrink: 1, maxWidth: '100%' }}
    >
      <View
        style={[{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          borderRadius: 999,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.glass,
        }, style]}
      >
        {leading || (icon ? <Ionicons name={icon} size={14} color={tint} /> : null)}
        {typeof children === 'string' || typeof children === 'number' ? (
          <Text numberOfLines={1} style={{ color: tokens.textSoft, fontSize: 12, fontWeight: '600', flexShrink: 1 }}>
            {children}
          </Text>
        ) : children}
      </View>
    </Wrapper>
  );
}

export function RoleChip({ label, tone = 'cyan' }) {
  const tokens = useGamerTokens();
  const gold = tone === 'gold' || tone === 'amber';
  const color = gold ? tokens.amber : tokens.cyan;
  return (
    <View
      style={{
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: hexToRgba(color, 0.16),
        borderWidth: 1,
        borderColor: gold ? tokens.amberBorder : tokens.cyanBorder,
      }}
    >
      <Text numberOfLines={1} style={{ color, fontSize: 11, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' }}>
        {label}
      </Text>
    </View>
  );
}

export function IdentityVerifiedBar({ name }) {
  const tokens = useGamerTokens();
  return (
    <GlassFill
      intensity={22}
      style={{
        borderRadius: CARD_RADIUS,
        overflow: 'hidden',
        padding: 16,
      }}
    >
      <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '700' }}>
        Identity Verified
      </Text>
      <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19, marginTop: 4 }}>
        This profile has been reviewed by STAGE staff and linked to {name}.
      </Text>
    </GlassFill>
  );
}

export function GamerRecordStrip({ wins = 0, draws = 0, losses = 0 }) {
  const tokens = useGamerTokens();
  const items = [
    { label: 'W', value: Number(wins) || 0, color: tokens.success, bg: hexToRgba(tokens.success, 0.16), border: hexToRgba(tokens.success, 0.4) },
    { label: 'D', value: Number(draws) || 0, color: tokens.muted, bg: tokens.inputFill, border: tokens.border },
    { label: 'L', value: Number(losses) || 0, color: tokens.danger, bg: hexToRgba(tokens.danger, 0.16), border: hexToRgba(tokens.danger, 0.4) },
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
          <Text style={{ color: item.color, fontFamily: FONT_EA_SPORTS, fontSize: 22, lineHeight: 24 }}>
            {item.value}
          </Text>
          <Text style={{ color: item.color, fontSize: 11, fontWeight: '600', letterSpacing: 1.3, marginTop: 1 }}>
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** Stage pill tab: 34px chip, cyan when active, optional count badge. */
function TabPill({ label, badge, active, onPress }) {
  const tokens = useGamerTokens();
  const fg = active ? tokens.onCyan : tokens.textSoft;
  const hasBadge = badge != null && badge !== '';
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      hitSlop={{ top: 5, bottom: 5 }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={{
        height: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? tokens.cyan : tokens.border,
        backgroundColor: active ? tokens.cyan : tokens.card,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Text numberOfLines={1} style={{ color: fg, fontSize: 13, fontWeight: '600', flexShrink: 1 }}>
        {label}
      </Text>
      {hasBadge ? (
        <View
          style={{
            minWidth: 18,
            height: 18,
            borderRadius: 9,
            paddingHorizontal: 5,
            backgroundColor: active ? tokens.onCyan : hexToRgba(tokens.text, 0.2),
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: active ? tokens.cyan : tokens.text, fontSize: 10, fontWeight: '700' }}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

// `accent` and `shape` are kept so existing call sites still compile; Stage tabs are one pill style.
export function GamerTabNav({ tabs, active, onChange }) {
  const list = Array.isArray(tabs) ? tabs : [];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
      {list.map((tab) => (
        <TabPill
          key={tab.id}
          label={tab.label}
          badge={tab.badge}
          active={active === tab.id}
          onPress={() => onChange?.(tab.id)}
        />
      ))}
    </ScrollView>
  );
}

/** Two-level club nav: group pills, then the tabs of the active group. */
export function GamerClubTabNav({ groups = [], activeTab, tabLabels = {}, onChange, badgeForTab }) {
  const safeGroups = (groups || []).filter((g) => Array.isArray(g.tabs) && g.tabs.length > 0);
  const activeGroup = safeGroups.find((g) => g.tabs.includes(activeTab)) || safeGroups[0];

  if (!safeGroups.length) return null;

  return (
    <View style={{ gap: 10 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
        {safeGroups.map((group) => {
          const isActive = group.tabs.includes(activeTab);
          const badge = group.tabs.map((id) => badgeForTab?.(id)).find(Boolean);
          return (
            <TabPill
              key={group.label}
              label={group.label}
              badge={badge}
              active={isActive}
              onPress={() => onChange?.(group.tabs[0])}
            />
          );
        })}
      </ScrollView>

      {activeGroup && activeGroup.tabs.length > 1 ? (
        <GamerTabNav
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
  const tokens = useGamerTokens();
  const actionColor = accent === 'amber' ? tokens.amber : tokens.cyan;
  return (
    <GamerSectionCard>
      <View style={{ alignItems: 'center', paddingVertical: 22 }}>
        <Ionicons name={icon} size={36} color={tokens.faint} />
        {title ? (
          <Text style={{ color: tokens.text, marginTop: 10, fontSize: 15, fontWeight: '700' }}>
            {title}
          </Text>
        ) : null}
        <Text style={{ color: tokens.muted, marginTop: 6, fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 12 }}>
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
              borderRadius: 14,
              backgroundColor: actionColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text numberOfLines={1} style={{ color: tokens.onCyan, fontWeight: '700', fontSize: 14 }}>
              {actionLabel}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </GamerSectionCard>
  );
}

/** Card chrome (radius 16, token border + fill, padding 16). Optional title is a Stage section label. */
export function GamerSectionCard({ title, children, style }) {
  const tokens = useGamerTokens();
  return (
    <GlassFill style={[{ borderRadius: CARD_RADIUS, overflow: 'hidden' }, style]} intensity={22}>
      <View style={{ padding: 16 }}>
        {title ? (
          <Text
            numberOfLines={1}
            style={{
              color: tokens.muted,
              fontSize: 11,
              fontWeight: '600',
              letterSpacing: 11 * 0.12,
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            {title}
          </Text>
        ) : null}
        {children}
      </View>
    </GlassFill>
  );
}

/** Stat accent -> token colour (shared by profile stat tiles). */
export function statAccentColor(accent, tokens) {
  if (accent === 'amber' || accent === 'gold') return tokens.amber;
  if (accent === 'green') return tokens.success;
  if (accent === 'rose') return tokens.danger;
  if (accent === 'violet') return tokens.cyanHi;
  return tokens.cyan;
}

export function GamerStatTile({ label, value, accent = 'cyan', compact = false }) {
  const tokens = useGamerTokens();
  const color = statAccentColor(accent, tokens);
  return (
    <GlassFill
      intensity={16}
      style={{
        flex: 1,
        minWidth: compact ? '46%' : '45%',
        borderRadius: CARD_RADIUS,
        padding: compact ? 12 : 14,
        overflow: 'hidden',
      }}
    >
      <Text
        numberOfLines={1}
        style={{ fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, color: tokens.muted, textTransform: 'uppercase', marginBottom: 6 }}
      >
        {label}
      </Text>
      <Text
        numberOfLines={1}
        style={{ fontFamily: FONT_EA_SPORTS, fontSize: compact ? 22 : 28, color }}
      >
        {value}
      </Text>
    </GlassFill>
  );
}

/** Primary Stage button: 52px, radius 14, solid cyan. */
export function CyanCta({ label, onPress, style }) {
  const tokens = useGamerTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ flex: 1 }, style]}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={typeof label === 'string' ? label : undefined}
    >
      <View
        style={{
          height: 52,
          paddingHorizontal: 14,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: tokens.cyan,
        }}
      >
        <Text numberOfLines={1} style={{ color: tokens.onCyan, fontSize: 15, fontWeight: '700' }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/** Secondary Stage button: 52px, radius 14, cyan outline. */
export function OutlineCta({ label, icon, onPress, style }) {
  const tokens = useGamerTokens();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[{ flex: 1 }, style]}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={typeof label === 'string' ? label : undefined}
    >
      <View
        style={{
          height: 52,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingHorizontal: 12,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: tokens.cyan,
        }}
      >
        {icon ? <Ionicons name={icon} size={18} color={tokens.cyan} /> : null}
        <Text numberOfLines={1} style={{ color: tokens.cyan, fontSize: 15, fontWeight: '600', flexShrink: 1 }}>
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/** Identity rail: one segmented control for Player / President / Club. */
export function IdentityRail({ items, value, onChange }) {
  if (!items?.length || items.length <= 1) return null;
  return (
    <SegmentedControl
      options={items.map((item) => ({ key: item.id, label: item.label }))}
      value={value}
      onChange={onChange}
    />
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
      <View style={{ paddingHorizontal: 20, marginTop: overlap, zIndex: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
          {photo}
          <View style={{ flex: 1, minWidth: 0, paddingBottom: 4, gap: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <Text
                numberOfLines={2}
                style={{
                  color: tokens.text,
                  fontFamily: FONT_EA_SPORTS,
                  fontSize: 30,
                  fontWeight: '400',
                  letterSpacing: 30 * 0.03,
                  textTransform: 'uppercase',
                  lineHeight: 34,
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
