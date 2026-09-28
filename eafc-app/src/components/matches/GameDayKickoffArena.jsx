import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polygon, Text as SvgText } from 'react-native-svg';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { formatBroadcastUnit, gameDayArenaLayout, getKickoffCountdownParts, pad2 } from '@/lib/gameDayPresentation';
import { parseKickoffDate } from '@/lib/momentDate';
import { formatStc } from '@/lib/wagerActions';
import GameDayCrest from './GameDayCrest';
import GameDayTileBackgroundLayers from './GameDayTileBackgroundLayers';
import GameDayTileMenuButton from './GameDayTileMenuButton';
import { hasCustomGameDayTileBackground } from '@/lib/gameDayTileBackgrounds';

const SILVER = '#EEF3FB';
const CYAN = '#00E5FF';

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

  const kickoffDate = date ? parseKickoffDate(date) : null;
  const dateOk = kickoffDate && !Number.isNaN(kickoffDate.getTime());
  const { vsW, vsH } = layout;
  const hasCustomBg = hasCustomGameDayTileBackground(backgroundConfig);

  return (
    <View
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.width);
        if (next && next !== panelWidth) setPanelWidth(next);
      }}
      style={{ overflow: 'hidden', backgroundColor: '#080B10', borderWidth: 1, borderColor: 'rgba(216,222,232,0.22)' }}
    >
      <GameDayTileBackgroundLayers config={backgroundConfig} variant="arena" />
      {!hasCustomBg ? (
        <LinearGradient
          colors={['#151B25', '#0A0D13', '#242B36']}
          start={{ x: 0, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={absFill}
        />
      ) : null}
      <LinearGradient
        colors={hasCustomBg
          ? ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.62)']
          : ['rgba(238,243,251,0.18)', 'rgba(10,13,19,0.12)', 'rgba(0,0,0,0.55)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={absFill}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: layout.compact ? 64 : 96, left: 0, right: 0, alignItems: 'center' }}>
        <View
          style={{
            width: layout.circle,
            height: layout.circle,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
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
          backgroundColor: 'rgba(255,255,255,0.1)',
          marginTop: layout.circle / 2,
        }}
      />

      <View style={{ paddingHorizontal: layout.padH, paddingTop: layout.padTop, paddingBottom: layout.padBottom }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[headingStyleSm, { color: SILVER, fontSize: 10, letterSpacing: 2.8 }]} numberOfLines={1}>
              {String(competitionLabel || 'MATCH DETAILS').toUpperCase()}
            </Text>
            {dateOk ? (
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 4, letterSpacing: 1.4, textTransform: 'uppercase' }} numberOfLines={1}>
                {kickoffDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}
                {kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{
            paddingHorizontal: 10,
            paddingVertical: 5,
            backgroundColor: isLive ? CYAN : isFinished ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.12)',
            borderWidth: 1,
            borderColor: isLive ? CYAN : 'rgba(255,255,255,0.35)',
          }}
          >
            <Text style={[headingStyleSm, {
              color: isLive ? '#041018' : isFinished ? 'rgba(255,255,255,0.8)' : SILVER,
              fontSize: 10,
              letterSpacing: 1.8,
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
              <Text style={[headingStyle, { color: '#fff', fontSize: layout.compact ? 24 : 32 }]}>
                {homeScore ?? 0}
                <Text style={{ color: 'rgba(255,255,255,0.55)' }}> – </Text>
                {awayScore ?? 0}
              </Text>
            ) : (
              <Svg width={vsW} height={vsH}>
                <Polygon
                  points={`${vsW * 0.14},0 ${vsW},0 ${vsW * 0.86},${vsH} 0,${vsH}`}
                  fill="rgba(255,255,255,0.10)"
                  stroke="rgba(248,251,255,0.35)"
                  strokeWidth={1}
                />
                <SvgText
                  x={vsW / 2}
                  y={vsH / 2 + 5}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.85)"
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
            borderColor: 'rgba(255,255,255,0.25)',
            backgroundColor: 'rgba(0,0,0,0.55)',
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
          >
            <Ionicons name="link" size={14} color={SILVER} />
            <Text style={[headingStyleSm, { color: '#fff', fontSize: 11, letterSpacing: 1.6 }]}>
              {formatStc(wagerStc)} STC · POT {formatStc(Number(wagerStc) * 2)} STC
            </Text>
            {wagerLocked ? <Ionicons name="lock-closed" size={12} color="rgba(219,228,239,0.8)" /> : null}
          </View>
        ) : null}

        {children ? <View style={{ marginTop: 14 }}>{children}</View> : null}
      </View>
    </View>
  );
}

function Side({ name, logo, you, label, crest, nameSize }) {
  return (
    <View style={{ flex: 1, minWidth: 0, alignItems: 'center', gap: 8 }}>
      <GameDayCrest name={name} imageUrl={logo} size={crest} glow={you} />
      <Text
        numberOfLines={2}
        style={[headingStyle, { color: '#fff', fontSize: nameSize, textAlign: 'center', width: '100%' }]}
      >
        {name}
      </Text>
      <Text style={{
        color: you ? SILVER : 'rgba(255,255,255,0.5)',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1.6,
        textTransform: 'uppercase',
      }}
      >
        {label}{you ? '  ●' : ''}
      </Text>
    </View>
  );
}

function ClockCell({ value, label, size }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[headingStyle, { color: '#fff', fontSize: size }]}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 9, fontWeight: '800', letterSpacing: 2.4, marginTop: 4, textTransform: 'uppercase' }}>
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
