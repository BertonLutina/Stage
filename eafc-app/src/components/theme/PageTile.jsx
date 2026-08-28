import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import GameDayTileBackgroundDialog from '@/components/matches/GameDayTileBackgroundDialog';
import GameDayTileBackgroundLayers from '@/components/matches/GameDayTileBackgroundLayers';
import GameDayTileMenuButton from '@/components/matches/GameDayTileMenuButton';
import {
  GAME_DAY_SILVER,
  TILE_FILL_LIVE,
  tileChrome,
} from '@/components/dashboard/CommandCenterUI';
import { headingStyleSm } from '@/lib/fonts';
import {
  getGameDayTileBackgroundConfig,
  hasCustomGameDayTileBackground,
} from '@/lib/gameDayTileBackgrounds';
import { hasStagePlus } from '@/lib/subscriptionUtils';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';

/**
 * Game Day MATCH SCREENS chrome for any page: silver hairline, sharp corners,
 * STAGE Plus photo background via the same tile-key API.
 */
export default function PageTile({
  tileKey,
  eyebrow,
  subtitle,
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
  const custom = hasCustomGameDayTileBackground(config);
  const live = tokens.live === true;
  const menuVisible = (showMenu ?? Boolean(player)) && Boolean(player);

  return (
    <>
      <View
        style={[
          tileChrome(tokens, {
            backgroundColor: custom
              ? (live ? TILE_FILL_LIVE : 'rgba(0,0,0,0.4)')
              : undefined,
          }),
          style,
        ]}
      >
        <GameDayTileBackgroundLayers config={config} variant="panel" />
        <View style={{ paddingVertical: 12, flex: style?.flex ? 1 : undefined }}>
          {eyebrow ? (
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingHorizontal: 12,
              marginBottom: 10,
              gap: 10,
            }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[headingStyleSm, { color: GAME_DAY_SILVER, fontSize: 11, letterSpacing: 2 }]}>
                  {eyebrow}
                </Text>
                {subtitle ? (
                  <Text
                    numberOfLines={1}
                    style={{
                      color: 'rgba(255,255,255,0.35)',
                      fontSize: 10,
                      marginTop: 4,
                      letterSpacing: 1.4,
                      textTransform: 'uppercase',
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
                    accessibilityLabel={`Change ${eyebrow || 'tile'} background`}
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
        tileTitle={eyebrow}
        canCustomize={hasStagePlus(player?.subscription)}
        onPlayerChanged={patchPlayer}
      />
    </>
  );
}

export function SilverPill({ label, active, onPress, badge }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        borderWidth: 1,
        borderColor: active ? 'rgba(248,251,255,0.55)' : 'rgba(255,255,255,0.12)',
        backgroundColor: active ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          color: active ? GAME_DAY_SILVER : 'rgba(255,255,255,0.5)',
          fontSize: 11,
          fontWeight: '800',
        }}
      >
        {label}
      </Text>
      {badge != null && badge !== '' ? (
        <Text style={{
          color: active ? GAME_DAY_SILVER : 'rgba(255,255,255,0.4)',
          fontSize: 10,
          fontWeight: '800',
        }}
        >
          {badge}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}
