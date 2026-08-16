import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { formatDeskAmount } from '@/lib/stageNews';
import { paperStyles as s } from './newsPaperStyles';

function kickerFor(item) {
  if (item?._category === 'press_conference') return 'Press Room';
  if (item?._category === 'market') return 'Market';
  if (item?._category === 'transfers') return 'Transfers';
  return String(item?._category || 'News').replace(/_/g, ' ');
}

export function SplashStory({ item, onPress }) {
  if (!item) return null;
  const image = item.photo_url || item.player_avatar_url || item.club_logo_url;
  const fee = formatDeskAmount(item.transfer_fee_stc);
  const inner = (
    <View style={s.splash}>
      {image ? (
        <View style={s.splashMedia}>
          <Image source={{ uri: image }} style={s.splashImage} resizeMode="cover" />
          <View style={s.inkStamp}>
            <Text style={s.inkStampText}>{kickerFor(item)}</Text>
          </View>
          {fee ? (
            <View style={s.feeStamp}>
              <Text style={s.feeStampText}>{fee}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={s.inkStamp}>
          <Text style={s.inkStampText}>{kickerFor(item)}</Text>
        </View>
      )}
      <View style={s.splashCopy}>
        <Text style={s.splashHeadline}>{item.title}</Text>
        {item.body ? <Text style={s.splashDek}>{item.body}</Text> : null}
        <Text style={s.splashMeta}>
          {[item.player_name, item.club_name, fee].filter(Boolean).join('  ·  ')}
        </Text>
      </View>
    </View>
  );
  if (!onPress) return inner;
  return (
    <TouchableOpacity activeOpacity={0.92} onPress={() => onPress(item)}>
      {inner}
    </TouchableOpacity>
  );
}

export function RailStory({ item, onPress }) {
  const image = item.photo_url || item.player_avatar_url || item.club_logo_url;
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={() => onPress?.(item)} style={s.brief}>
      {image ? <Image source={{ uri: image }} style={s.briefThumb} /> : null}
      <View style={{ flex: 1 }}>
        <Text style={s.briefKicker}>{kickerFor(item)}</Text>
        <Text style={s.briefTitle}>{item.title}</Text>
        <Text style={s.splashMeta} numberOfLines={1}>
          {[item.player_name, item.club_name].filter(Boolean).join('  ·  ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NewspaperFront({ featured, rest = [], empty = 'Nothing here yet.', onSelect }) {
  if (!featured) {
    return <Text style={s.empty}>{empty}</Text>;
  }
  return (
    <View style={s.front}>
      <SplashStory item={featured} onPress={onSelect} />
      {rest.length > 0 ? (
        <View style={s.rail}>
          {rest.map((item) => (
            <RailStory key={item.id} item={item} onPress={onSelect} />
          ))}
        </View>
      ) : null}
    </View>
  );
}
