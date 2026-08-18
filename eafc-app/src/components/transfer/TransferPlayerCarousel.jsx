import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { playerDisplayName } from '@/lib/stageDirectories';
import { stepCarouselIndex, visibleCarouselSlots } from '@/lib/transferCarousel';
import TransferBadge from './TransferBadge';
import TransferPlayerPhotoCard from './TransferPlayerPhotoCard';
import { GOLD } from './transferHubTheme';

function CarouselSlot({ offset, focused, cardWidth, xFar, xNear, name, children, onPress }) {
  const anim = useRef(new Animated.Value(offset)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: offset,
      useNativeDriver: true,
      friction: 9,
      tension: 68,
    }).start();
  }, [offset, anim]);

  const translateX = anim.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: [-xFar, -xNear, 0, xNear, xFar],
  });
  const scale = anim.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: [0.72, 0.86, 1.04, 0.86, 0.72],
  });
  const rotateY = anim.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: ['32deg', '18deg', '0deg', '-18deg', '-32deg'],
  });
  const opacity = anim.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: [0.42, 0.7, 1, 0.7, 0.42],
  });
  const translateY = anim.interpolate({
    inputRange: [-2, -1, 0, 1, 2],
    outputRange: [10, 6, 0, 6, 10],
  });

  const cardHeight = Math.round(cardWidth * (4 / 3));

  return (
    <Animated.View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: '50%',
        top: '46%',
        width: cardWidth,
        marginLeft: -cardWidth / 2,
        marginTop: -Math.round((cardHeight + 40) / 2),
        zIndex: 20 - Math.abs(offset),
        opacity,
        transform: [
          { perspective: 1200 },
          { translateX },
          { translateY },
          { rotateY },
          { scale },
        ],
      }}
    >
      <Pressable onPress={onPress} style={{ alignItems: 'center', width: cardWidth }}>
        {children}
        <Text
          numberOfLines={1}
          style={[
            headingStyle,
            {
              marginTop: 12,
              maxWidth: cardWidth,
              color: focused ? GOLD : 'rgba(255,255,255,0.5)',
              fontSize: focused ? 16 : 11,
              textAlign: 'center',
            },
          ]}
        >
          {name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export default function TransferPlayerCarousel({ entries = [], selectedId, onSelect }) {
  const { width } = useWindowDimensions();
  const entriesRef = useRef(entries);
  const centerRef = useRef(0);
  const center = Math.max(0, entries.findIndex((entry) => entry.player?.id === selectedId));
  entriesRef.current = entries;
  centerRef.current = center;
  const cardWidth = Math.min(200, Math.round(width * 0.48));
  const xNear = Math.round(width * 0.205);
  const xFar = Math.round(width * 0.34);
  const slots = useMemo(
    () => visibleCarouselSlots(entries.length, center, 2),
    [entries.length, center],
  );

  function go(direction) {
    const list = entriesRef.current;
    if (list.length < 2) return;
    const nextIndex = stepCarouselIndex(centerRef.current, list.length, direction);
    onSelect?.(list[nextIndex]);
  }

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => (
        Math.abs(gesture.dx) > 14 && Math.abs(gesture.dx) > Math.abs(gesture.dy)
      ),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 48) go(-1);
        if (gesture.dx < -48) go(1);
      },
    }),
  ).current;

  if (entries.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <Ionicons name="shield-outline" size={40} color="rgba(245,197,66,0.3)" />
        <Text style={[headingStyleSm, { color: 'rgba(255,255,255,0.55)', marginTop: 12, textAlign: 'center' }]}>
          No players found
        </Text>
        <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          Try adjusting filters
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} {...pan.panHandlers}>
      <LinearGradient
        colors={['rgba(245,197,66,0.28)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.55 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 220 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,229,255,0.16)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 0.45, y: 0.5 }}
        style={{ position: 'absolute', left: 0, top: 40, bottom: 40, width: 140 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(0,229,255,0.16)', 'transparent']}
        start={{ x: 1, y: 0.5 }}
        end={{ x: 0.55, y: 0.5 }}
        style={{ position: 'absolute', right: 0, top: 40, bottom: 40, width: 140 }}
        pointerEvents="none"
      />

      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Previous player"
        onPress={() => go(-1)}
        disabled={entries.length < 2}
        style={{
          position: 'absolute',
          left: 8,
          top: '42%',
          zIndex: 40,
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(245,197,66,0.4)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: entries.length < 2 ? 0.3 : 1,
        }}
      >
        <Ionicons name="chevron-back" size={24} color={GOLD} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Next player"
        onPress={() => go(1)}
        disabled={entries.length < 2}
        style={{
          position: 'absolute',
          right: 8,
          top: '42%',
          zIndex: 40,
          width: 42,
          height: 42,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(245,197,66,0.4)',
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: entries.length < 2 ? 0.3 : 1,
        }}
      >
        <Ionicons name="chevron-forward" size={24} color={GOLD} />
      </TouchableOpacity>

      <View style={{ flex: 1, position: 'relative' }}>
        {slots.map(({ index, offset }) => {
          const entry = entries[index];
          const player = entry?.player;
          if (!player) return null;
          const focused = offset === 0;
          return (
            <CarouselSlot
              key={entries.length <= 2 ? `${player.id}-${offset}` : String(player.id)}
              offset={offset}
              focused={focused}
              cardWidth={cardWidth}
              xFar={xFar}
              xNear={xNear}
              name={playerDisplayName(player)}
              onPress={() => onSelect?.(entry, { openDetails: true })}
            >
              <TransferPlayerPhotoCard player={player} focused={focused} width={cardWidth}>
                <View style={{ position: 'absolute', left: 8, top: 8, zIndex: 3 }}>
                  <TransferBadge type={entry.badgeType} daysLeft={entry.days_left} />
                </View>
              </TransferPlayerPhotoCard>
            </CarouselSlot>
          );
        })}
      </View>

      <Text
        style={[
          headingStyleSm,
          {
            color: GOLD,
            textAlign: 'center',
            paddingBottom: 18,
            letterSpacing: 4,
            fontSize: 11,
          },
        ]}
      >
        {center + 1}  /  {entries.length}
      </Text>
    </View>
  );
}
