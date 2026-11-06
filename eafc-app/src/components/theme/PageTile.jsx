import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import GameDayTileBackgroundDialog from '@/components/matches/GameDayTileBackgroundDialog';
import GameDayTileBackgroundLayers from '@/components/matches/GameDayTileBackgroundLayers';
import GameDayTileMenuButton from '@/components/matches/GameDayTileMenuButton';
import {
  TILE_FILL_LIVE,
  sectionLabelStyle,
  tileChrome,
} from '@/components/dashboard/CommandCenterUI';
import { STAGE_PALETTE, hexToRgba } from '@/lib/stageTheme';
import { headingStyleLg } from '@/lib/fonts';
import {
  canUseTileBackgrounds,
  getGameDayTileBackgroundConfig,
  hasCustomGameDayTileBackground,
} from '@/lib/gameDayTileBackgrounds';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';

/**
 * Stage card chrome for any page (radius 16, token border and fill), with the
 * STAGE Plus photo background via the same tile-key API. Over a photo the fill
 * goes translucent so the picture shows through the scrim.
 */
export default function PageTile({
  tileKey,
  eyebrow,
  subtitle,
  tileTitle,
  children,
  player: playerProp,
  onPlayerChanged,
  showMenu,
  style,
  contentStyle,
  headerRight,
}) {
  const tokens = useGamerTokens();
  const [player, setPlayer] = useState(playerProp || null);
  const [dialog, setDialog] = useState(false);

  useEffect(() => {
    if (playerProp) setPlayer(playerProp);
  }, [playerProp]);

  useEffect(() => {
    if (playerProp) return undefined;
    let cancelled = false;
    resolveMyPlayerAndClub()
      .then((resolved) => {
        if (!cancelled) setPlayer(resolved?.player || null);
      })
      .catch(() => {
        if (!cancelled) setPlayer(null);
      });
    return () => { cancelled = true; };
  }, [playerProp]);

  const patchPlayer = (updated) => {
    setPlayer((prev) => ({ ...(prev || {}), ...updated }));
    onPlayerChanged?.(updated);
  };

  const config = getGameDayTileBackgroundConfig(player, tileKey);
  const plus = canUseTileBackgrounds(player);
  const custom = plus && hasCustomGameDayTileBackground(config);
  const live = tokens.live === true;
  const menuVisible = (showMenu ?? Boolean(player)) && Boolean(player);
  const dialogTitle = tileTitle || eyebrow;
  const showHeader = Boolean(eyebrow || subtitle || headerRight || menuVisible);

  return (
    <>
      <View
        style={[
          tileChrome(tokens, custom
            ? { backgroundColor: live ? TILE_FILL_LIVE : hexToRgba(STAGE_PALETTE.bgDeep, 0.55) }
            : {}),
          style,
        ]}
      >
        <GameDayTileBackgroundLayers config={plus ? config : undefined} variant="panel" />
        <View style={{ paddingVertical: 12, flex: style?.flex ? 1 : undefined }}>
          {showHeader ? (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingHorizontal: 12,
              marginBottom: eyebrow || subtitle ? 10 : 8,
              gap: 10,
            }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                {eyebrow ? (
                  <Text numberOfLines={1} style={sectionLabelStyle(tokens)}>
                    {eyebrow}
                  </Text>
                ) : null}
                {subtitle ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      color: tokens.muted,
                      fontSize: 11,
                      marginTop: eyebrow ? 4 : 0,
                    }}
                  >
                    {subtitle}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {headerRight}
                {menuVisible ? (
                  <GameDayTileMenuButton
                    onPress={() => setDialog(true)}
                    accessibilityLabel={`Change ${dialogTitle || 'tile'} background`}
                  />
                ) : null}
              </View>
            </View>
          ) : null}
          <View style={[{ flex: style?.flex ? 1 : undefined }, contentStyle]}>
            {children}
          </View>
        </View>
      </View>
      <GameDayTileBackgroundDialog
        visible={dialog}
        onClose={() => setDialog(false)}
        player={player}
        tileKey={tileKey}
        tileTitle={dialogTitle}
        canCustomize={plus}
        onPlayerChanged={patchPlayer}
      />
    </>
  );
}

export function PageTitle({ eyebrow, title, subtitle, padded = true, style }) {
  const tokens = useGamerTokens();
  if (!eyebrow && !title && !subtitle) return null;
  return (
    <View style={[{ paddingBottom: 12, gap: 6 }, padded ? { paddingHorizontal: 16 } : null, style]}>
      {eyebrow ? (
        <Text numberOfLines={1} style={sectionLabelStyle(tokens)}>
          {eyebrow}
        </Text>
      ) : null}
      {title ? (
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          style={[headingStyleLg, { color: tokens.text, fontSize: 34, letterSpacing: 34 * 0.03 }]}
        >
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text style={{ color: tokens.muted, fontSize: 13 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/** Filter pill: Stage chip (34 high, radius 999) with an optional trailing count. */
export function SilverPill({ label, active, onPress, badge }) {
  const tokens = useGamerTokens();
  const fg = active ? tokens.onCyan : tokens.textSoft;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      hitSlop={{ top: 5, bottom: 5 }}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(active) }}
      style={{
        height: 34,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? tokens.cyan : tokens.border,
        backgroundColor: active ? tokens.cyan : tokens.card,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text
        numberOfLines={1}
        style={{ color: fg, fontSize: 13, fontWeight: '600', flexShrink: 1 }}
      >
        {label}
      </Text>
      {badge != null && badge !== '' ? (
        <Text style={{ color: fg, fontSize: 12, fontWeight: '600', opacity: 0.8 }}>
          {badge}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
