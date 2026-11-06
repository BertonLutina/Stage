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
import useThemeStore from '@/store/themeStore';
import { headingStyle, headingStyleSm } from '@/lib/fonts';
import { stepCarouselIndex, visibleCarouselSlots } from '@/lib/transferCarousel';
import { ICON_SIZE, ICON_BUTTON_RADIUS, MIN_TOUCH } from '@/components/ui/metrics';

function CarouselSlot({ offset, focused, cardWidth, xFar, xNear, name, children, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
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
              color: focused ? tokens.text : tokens.muted,
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

export default function DirectoryCarousel({
  items = [],
  selectedId,
  getId,
  getName,
  renderCard,
  onSelect,
  emptyIcon = 'people-outline',
  emptyText = 'No results',
  prevLabel = 'Previous',
  nextLabel = 'Next',
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const { width } = useWindowDimensions();
  const itemsRef = useRef(items);
  const centerRef = useRef(0);
  const center = Math.max(0, items.findIndex((item) => String(getId(item)) === String(selectedId)));
  itemsRef.current = items;
  centerRef.current = center;
  const cardWidth = Math.min(200, Math.round(width * 0.48));
  const xNear = Math.round(width * 0.205);
  const xFar = Math.round(width * 0.34);
  const slots = useMemo(
    () => visibleCarouselSlots(items.length, center, 2),
    [items.length, center],
  );

  function go(direction) {
    const list = itemsRef.current;
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

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
        <Ionicons name={emptyIcon} size={40} color={tokens.muted} />
        <Text style={[headingStyleSm, { color: tokens.textSoft, marginTop: 12, textAlign: 'center' }]}>
          {emptyText}
        </Text>
        <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
          Try adjusting filters
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, overflow: 'hidden' }} {...pan.panHandlers}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={prevLabel}
        accessibilityState={{ disabled: items.length < 2 }}
        onPress={() => go(-1)}
        disabled={items.length < 2}
        style={{
          position: 'absolute',
          left: 8,
          top: '42%',
          zIndex: 40,
          width: MIN_TOUCH,
          height: MIN_TOUCH,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: ICON_BUTTON_RADIUS,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.card,
          opacity: items.length < 2 ? 0.3 : 1,
        }}
      >
        <Ionicons name="chevron-back" size={ICON_SIZE} color={tokens.text} />
      </TouchableOpacity>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={nextLabel}
        accessibilityState={{ disabled: items.length < 2 }}
        onPress={() => go(1)}
        disabled={items.length < 2}
        style={{
          position: 'absolute',
          right: 8,
          top: '42%',
          zIndex: 40,
          width: MIN_TOUCH,
          height: MIN_TOUCH,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: ICON_BUTTON_RADIUS,
          borderWidth: 1,
          borderColor: tokens.border,
          backgroundColor: tokens.card,
          opacity: items.length < 2 ? 0.3 : 1,
        }}
      >
        <Ionicons name="chevron-forward" size={ICON_SIZE} color={tokens.text} />
      </TouchableOpacity>

      <View style={{ flex: 1, position: 'relative' }}>
        {slots.map(({ index, offset }) => {
          const item = items[index];
          if (!item) return null;
          const focused = offset === 0;
          const id = getId(item);
          return (
            <CarouselSlot
              key={items.length <= 2 ? `${id}-${offset}` : String(id)}
              offset={offset}
              focused={focused}
              cardWidth={cardWidth}
              xFar={xFar}
              xNear={xNear}
              name={getName(item)}
              onPress={() => onSelect?.(item, { openDetails: true })}
            >
              {renderCard(item, focused, cardWidth)}
            </CarouselSlot>
          );
        })}
      </View>

      <Text
        style={[
          headingStyleSm,
          {
            color: tokens.muted,
            textAlign: 'center',
            paddingBottom: 18,
            letterSpacing: 4,
            fontSize: 11,
          },
        ]}
      >
        {center + 1}  /  {items.length}
      </Text>
    </View>
  );
}
