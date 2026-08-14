import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { formatBroadcastUnit, getKickoffCountdownParts, pad2 } from '@/lib/gameDayPresentation';
import { formatStc } from '@/lib/wagerActions';
import GameDayCrest from './GameDayCrest';

const GOLD = '#F5C542';
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
  compact = false,
  children,
}) {
  const [now, setNow] = useState(() => new Date());
  const isLive = status === 'in_progress';
  const isFinished = status === 'completed' || status === 'forfeit';
  const showScore = isLive || isFinished;
  const countdown = !isLive && !isFinished ? getKickoffCountdownParts(date, now) : null;
  const crestSize = compact ? 'md' : 'lg';

  useEffect(() => {
    if (isLive || isFinished) return undefined;
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, [isLive, isFinished]);

  const kickoffDate = date ? new Date(date) : null;
  const dateOk = kickoffDate && !Number.isNaN(kickoffDate.getTime());

  return (
    <View style={{ overflow: 'hidden', backgroundColor: '#08150F' }}>
      <View style={{ flexDirection: 'row', ...absFill }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <View
            key={i}
            style={{ flex: 1, backgroundColor: i % 2 === 0 ? '#08150F' : '#0B1C13' }}
          />
        ))}
      </View>
      <LinearGradient
        colors={['rgba(245,197,66,0.28)', 'rgba(0,229,255,0.06)', 'rgba(0,0,0,0.72)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={absFill}
      />
      <View pointerEvents="none" style={{ position: 'absolute', top: compact ? 78 : 110, left: 0, right: 0, alignItems: 'center' }}>
        <View
          style={{
            width: compact ? 140 : 200,
            height: compact ? 140 : 200,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        />
      </View>

      <View style={{ paddingHorizontal: 16, paddingTop: compact ? 16 : 20, paddingBottom: compact ? 16 : 22 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={[headingStyleSm, { color: GOLD, fontSize: 10, letterSpacing: 2.6 }]} numberOfLines={1}>
              {String(competitionLabel || 'FIXTURE').toUpperCase()}
            </Text>
            {dateOk ? (
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 4, letterSpacing: 1.2, textTransform: 'uppercase' }}>
                {kickoffDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
                {' · '}
                {kickoffDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </Text>
            ) : null}
          </View>
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 5,
            backgroundColor: isLive ? CYAN : isFinished ? 'rgba(255,255,255,0.1)' : 'rgba(245,197,66,0.16)',
            borderWidth: 1,
            borderColor: isLive ? CYAN : isFinished ? 'rgba(255,255,255,0.18)' : 'rgba(245,197,66,0.45)',
          }}
          >
            <Text style={[headingStyleSm, {
              color: isLive ? '#041018' : isFinished ? 'rgba(255,255,255,0.8)' : GOLD,
              fontSize: 10,
              letterSpacing: 1.8,
            }]}
            >
              {String(statusLabel || status || '').toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: compact ? 16 : 22 }}>
          <Side name={homeName} logo={homeLogo} you={homeYou} label={homeLabel} size={crestSize} />
          <View style={{ alignItems: 'center', paddingHorizontal: 8, minWidth: 72 }}>
            {showScore ? (
              <Text style={[headingStyle, { color: '#fff', fontSize: compact ? 28 : 34 }]}>
                {homeScore ?? 0}
                <Text style={{ color: GOLD }}> – </Text>
                {awayScore ?? 0}
              </Text>
            ) : (
              <View style={{
                width: compact ? 44 : 52,
                height: compact ? 44 : 52,
                backgroundColor: GOLD,
                transform: [{ rotate: '45deg' }],
                alignItems: 'center',
                justifyContent: 'center',
              }}
              >
                <Text style={[headingStyleSm, {
                  color: '#041018',
                  fontSize: 12,
                  transform: [{ rotate: '-45deg' }],
                  letterSpacing: 1,
                }]}
                >
                  VS
                </Text>
              </View>
            )}
          </View>
          <Side name={awayName} logo={awayLogo} you={awayYou} label={awayLabel} size={crestSize} />
        </View>

        {countdown && !countdown.started ? (
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: compact ? 18 : 28, marginTop: compact ? 16 : 22 }}>
            <ClockCell value={formatBroadcastUnit(countdown.hours)} label="Hours" />
            <ClockCell value={pad2(countdown.minutes)} label="Mins" />
            <ClockCell value={pad2(countdown.seconds)} label="Secs" />
          </View>
        ) : null}

        {Number(wagerStc) > 0 ? (
          <View style={{
            marginTop: 16,
            alignSelf: 'center',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: 'rgba(245,197,66,0.35)',
            backgroundColor: 'rgba(0,0,0,0.4)',
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
          >
            <Ionicons name="diamond" size={14} color={GOLD} />
            <Text style={[headingStyleSm, { color: GOLD, fontSize: 11, letterSpacing: 1.6 }]}>
              {formatStc(wagerStc)} STC · POT {formatStc(Number(wagerStc) * 2)} STC
            </Text>
            {wagerLocked ? <Ionicons name="lock-closed" size={12} color={GOLD} /> : null}
          </View>
        ) : null}

        {children ? <View style={{ marginTop: 16 }}>{children}</View> : null}
      </View>
    </View>
  );
}

function Side({ name, logo, you, label, size }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
      <GameDayCrest name={name} imageUrl={logo} size={size} glow={you} />
      <Text
        numberOfLines={2}
        style={[headingStyle, { color: '#fff', fontSize: size === 'md' ? 14 : 18, textAlign: 'center' }]}
      >
        {name}
      </Text>
      <Text style={{ color: you ? GOLD : 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '800', letterSpacing: 1.6, textTransform: 'uppercase' }}>
        {label}{you ? '  ●' : ''}
      </Text>
    </View>
  );
}

function ClockCell({ value, label }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={[headingStyle, { color: '#fff', fontSize: 36 }]}>{value}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: '800', letterSpacing: 2.4, marginTop: 4, textTransform: 'uppercase' }}>
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
