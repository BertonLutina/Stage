import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';
import useThemeStore from '@/store/themeStore';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { CARD_RADIUS, STAGE_PALETTE, hexToRgba } from '@/lib/stageTheme';
import { sectionLabelStyle } from '@/components/dashboard/CommandCenterUI';
import { formatBroadcastUnit, gameDayArenaLayout, getKickoffCountdownParts, pad2 } from '@/lib/gameDayPresentation';
import { formatStc } from '@/lib/wagerActions';
import GameDayCrest from './GameDayCrest';
import GameDayTileBackgroundLayers from './GameDayTileBackgroundLayers';
import GameDayTileMenuButton from './GameDayTileMenuButton';
import { hasCustomGameDayTileBackground } from '@/lib/gameDayTileBackgrounds';

export default function GameDayKickoffArena({
  homeName,
  awayName,
  homeLogo,
  awayLogo,
  homeYou,
  awayYou,
  homeLabel = 'Home',
  awayLabel = 'Away',
  date,
  status,
  statusLabel,
  competitionLabel,
  homeScore,
  awayScore,
  wagerStc = 0,
  wagerLocked = false,
  compact,
  backgroundConfig = null,
  onChangeBackground,
  onPress,
  children,
}) {
  const tokens = useThemeStore((st) => st.tokens);
  const windowWidth = useWindowDimensions().width;
  const [panelWidth, setPanelWidth] = useState(0);
  const layout = gameDayArenaLayout(panelWidth || windowWidth, { compact });
  const [now, setNow] = useState(() => new Date());
  const isLive = status === 'in_progress';
  const isFinished = status === 'completed' || status === 'forfeit';
  const showScore = isLive || isFinished;
  const countdown = !isLive && !isFinished ? getKickoffCountdownParts(date, now) : null;

  useEffect(() => {
    if (isLive || isFinished) return undefined;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isLive, isFinished]);

  const kickoffDate = date ? new Date(date) : null;
  const dateOk = kickoffDate && !Number.isNaN(kickoffDate.getTime());
  const { vsW, vsH } = layout;
  const hasCustomBg = hasCustomGameDayTileBackground(backgroundConfig);

  return (
    <View
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        if (next && next !== panelWidth) setPanelWidth(next);
      }}
      style={{
        overflow: 'hidden',
        backgroundColor: tokens.live ? 'transparent' : tokens.bgDeep,
        borderWidth: 1,
        borderColor: tokens.border,
        borderRadius: CARD_RADIUS,
      }}
    >
      <GameDayTileBackgroundLayers config={backgroundConfig} variant="arena" />
      {!hasCustomBg ? (
        <LinearGradient
          colors={tokens.live
            ? [
              hexToRgba(STAGE_PALETTE.cardHi, 0.6),
              hexToRgba(STAGE_PALETTE.card, 0.5),
              hexToRgba(STAGE_PALETTE.bgDeep, 0.5),
            ]
            : [tokens.cardHi, tokens.card, tokens.bgDeep]}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={absFill}
        />
      ) : null}
      {hasCustomBg ? (
        <LinearGradient
          colors={[
            hexToRgba(STAGE_PALETTE.bgDeep, 0.35),
            hexToRgba(STAGE_PALETTE.bgDeep, 0.12),
            hexToRgba(STAGE_PALETTE.bgDeep, 0.62),
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={absFill}
        />
      ) : null}
      <View pointerEvents="none" style={{ position: 'absolute', top: layout.compact ? 64 : 96, left: 0, right: 0, alignItems: 'center' }}>
        <View
          style={{
            width: layout.circle,
            height: layout.circle,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: hexToRgba(tokens.text, 0.1),
          }}
        />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: layout.compact ? 64 : 96,
          left: '12%',
          right: '12%',
          height: 1,
          backgroundColor: hexToRgba(tokens.text, 0.1),
          marginTop: layout.circle / 2,
        }}
      />

      <View style={{ paddingHorizontal: layout.padH, paddingTop: layout.padTop, paddingBottom: layout.padBottom }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[sectionLabelStyle(tokens), { color: tokens.textSoft }]} numberOfLines={1}>
              {String(competitionLabel || 'MATCH DETAILS').toUpperCase()}
            </Text>
            {dateOk ? (
              <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 4 }} numberOfLines={1}>
                {kickoffDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}
                {kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            height: 26,
            justifyContent: 'center',
            paddingHorizontal: 10,
            borderRadius: 999,
            backgroundColor: isLive ? tokens.cyan : hexToRgba(tokens.text, 0.08),
            borderWidth: 1,
            borderColor: isLive ? tokens.cyan : tokens.borderStrong,
          }}
          >
            <Text style={[headingStyleSm, {
              color: isLive ? tokens.onCyan : isFinished ? tokens.muted : tokens.textSoft,
              fontSize: 11,
              letterSpacing: 1,
            }]}
            >
              {String(statusLabel || status || '').toUpperCase()}
            </Text>
          </View>
          <GameDayTileMenuButton onPress={onChangeBackground} accessibilityLabel="Change Match Details background" />
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={onPress ? 0.92 : 1}
          disabled={!onPress}
          onPress={onPress}
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: layout.matchupMt }}
        >
          <Side name={homeName} logo={homeLogo} you={homeYou} label={homeLabel} crest={layout.crest} nameSize={layout.nameSize} />
          <View style={{ alignItems: 'center', paddingHorizontal: 4, width: vsW + 8 }}>
            {showScore ? (
              <Text style={[headingStyle, { color: tokens.text, fontSize: layout.compact ? 24 : 32 }]}>
                {homeScore ?? 0}
                <Text style={{ color: tokens.muted }}> – </Text>
                {awayScore ?? 0}
              </Text>
            ) : (
              <Svg width={vsW} height={vsH}>
                <Polygon
                  points={`${vsW * 0.14},0 ${vsW},0 ${vsW * 0.86},${vsH} 0,${vsH}`}
                  fill={hexToRgba(tokens.text, 0.1)}
                  stroke={tokens.borderStrong}
                  strokeWidth={1}
                />
                <SvgText
                  x={vsW / 2}
                  y={vsH / 2 + 5}
                  textAnchor="middle"
                  fill={tokens.textSoft}
                  fontSize={13}
                  fontWeight="bold"
                  letterSpacing={2}
                >
                  VS
                </SvgText>
              </Svg>
            )}
          </View>
          <Side name={awayName} logo={awayLogo} you={awayYou} label={awayLabel} crest={layout.crest} nameSize={layout.nameSize} />
        </TouchableOpacity>

        {countdown && !countdown.started ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: layout.clockGap, marginTop: layout.matchupMt }}>
            <ClockCell value={formatBroadcastUnit(countdown.hours)} label="Hours" size={layout.clockSize} />
            <ClockCell value={pad2(countdown.minutes)} label="Mins" size={layout.clockSize} />
            <ClockCell value={pad2(countdown.seconds)} label="Secs" size={layout.clockSize} />
          </View>
        ) : null}

        {Number(wagerStc) > 0 ? (
          <View style={{
            marginTop: 14,
            alignSelf: 'center',
            maxWidth: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: tokens.borderStrong,
            borderRadius: 12,
            backgroundColor: hexToRgba(STAGE_PALETTE.bgDeep, 0.7),
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
          >
            <Ionicons name="link" size={16} color={tokens.cyan} />
            <Text style={[headingStyleSm, { color: tokens.text, fontSize: 12, letterSpacing: 1, flexShrink: 1 }]} numberOfLines={1}>
              {formatStc(wagerStc)} STC · POT {formatStc(Number(wagerStc) * 2)} STC
            </Text>
            {wagerLocked ? <Ionicons name="lock-closed" size={14} color={tokens.textSoft} /> : null}
          </View>
        ) : null}

        {children ? <View style={{ marginTop: 14 }}>{children}</View> : null}
      </View>
    </View>
  );
}

function Side({ name, logo, you, label, crest, nameSize }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 8 }}>
      <GameDayCrest name={name} imageUrl={logo} size={crest} glow={you} />
      <Text
        numberOfLines={2}
        style={[headingStyle, { color: tokens.text, fontSize: nameSize, textAlign: 'center', width: '100%' }]}
      >
        {name}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={[sectionLabelStyle(tokens), { color: you ? tokens.cyan : tokens.muted }]}>
          {label}
        </Text>
        {you ? (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tokens.cyan }} />
        ) : null}
      </View>
    </View>
  );
}

function ClockCell({ value, label, size }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[headingStyle, { color: tokens.text, fontSize: size }]}>{value}</Text>
      <Text style={[sectionLabelStyle(tokens), { marginTop: 4 }]}>
        {label}
      </Text>
    </View>
  );
}

const absFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};
