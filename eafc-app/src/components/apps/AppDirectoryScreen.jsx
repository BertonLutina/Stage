import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Avatar, Card, Chip, IconButton, Screen } from '@/components/ui';
import { FONT_EA_SPORTS } from '@/lib/fonts';

export function DirectoryRow({
  title,
  subtitle,
  imageUrl,
  fallbackIcon = 'person-outline',
  badge,
  badgeColor,
  onPress,
  actionLabel,
  onAction,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const accent = badgeColor || tokens.cyan;

  return (
    <Card onPress={onPress} style={{ minHeight: 72, paddingVertical: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {imageUrl ? (
          <Avatar uri={imageUrl} initials="" size={48} />
        ) : (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: tokens.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={fallbackIcon} size={22} color={tokens.cyanHi} />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 13, marginTop: 3 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {badge ? (
          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: tokens.border,
              maxWidth: 96,
            }}
          >
            <Text numberOfLines={1} style={{ color: accent, fontSize: 11, fontWeight: '700' }}>{badge}</Text>
          </View>
        ) : null}
        {actionLabel ? (
          <Pressable
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.cyan,
              paddingHorizontal: 12,
              maxWidth: 120,
            }}
          >
            <Text numberOfLines={1} style={{ color: tokens.cyan, fontSize: 12, fontWeight: '700' }}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
        )}
      </View>
    </Card>
  );
}

export function FilterChips({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const id = option.id ?? option;
        const label = option.label ?? option;
        return (
          <Chip
            key={String(id)}
            label={String(label)}
            active={String(value) === String(id)}
            onPress={() => onChange(id)}
          />
        );
      })}
    </View>
  );
}

export default function AppDirectoryScreen({
  title,
  subtitle,
  searchPlaceholder = 'Search',
  query,
  onQuery,
  chips,
  chipValue,
  onChip,
  extraFilters,
  loading,
  refreshing,
  onRefresh,
  data,
  keyExtractor,
  renderItem,
  emptyIcon = 'search-outline',
  emptyText = 'Nothing here yet',
  headerRight,
  ListHeaderComponent,
}) {
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);

  return (
    <Screen scroll={false} tabBar={false}>
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ gap: 14, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <IconButton icon="arrow-back" accessibilityLabel="Back" onPress={() => router.back()} />
          <View style={{ flexShrink: 1 }}>{headerRight}</View>
        </View>

        <View style={{ gap: 4 }}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={{
              color: tokens.text,
              fontFamily: FONT_EA_SPORTS,
              fontSize: 34,
              letterSpacing: 34 * 0.03,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 13 }}>{subtitle}</Text>
          ) : null}
        </View>

        {onQuery ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              height: 50,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: tokens.border,
              backgroundColor: tokens.bgDeep,
              paddingHorizontal: 14,
            }}
          >
            <Ionicons name="search" size={18} color={tokens.cyan} />
            <TextInput
              value={query}
              onChangeText={onQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={tokens.muted}
              selectionColor={tokens.cyan}
              accessibilityLabel={searchPlaceholder}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={{ flex: 1, color: tokens.text, fontSize: 15, paddingVertical: 0 }}
            />
          </View>
        ) : null}

        {chips?.length ? (
          <FilterChips options={chips} value={chipValue} onChange={onChip} />
        ) : null}
        {extraFilters}
      </View>

      {loading ? (
        <ActivityIndicator color={tokens.cyan} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={data}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
          refreshControl={onRefresh ? (
            <RefreshControl
              refreshing={Boolean(refreshing)}
              onRefresh={onRefresh}
              tintColor={tokens.cyan}
              colors={[tokens.cyan]}
            />
          ) : undefined}
          ListHeaderComponent={ListHeaderComponent}
          ListEmptyComponent={(
            <View style={{ paddingVertical: 48, alignItems: 'center', gap: 12 }}>
              <Ionicons name={emptyIcon} size={36} color={tokens.muted} />
              <Text style={{ color: tokens.muted, fontWeight: '600' }}>{emptyText}</Text>
            </View>
          )}
        />
      )}
    </Screen>
  );
}
