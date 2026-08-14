import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  GamerProfileShell,
  GlassIconButton,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';

export function DirectoryRow({
  title,
  subtitle,
  imageUrl,
  fallbackIcon = 'person-outline',
  badge,
  badgeColor = CYAN,
  onPress,
  actionLabel,
  onAction,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 72,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.04)',
      }}
    >
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(0,240,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(0,240,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      >
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: 48, height: 48 }} />
        ) : (
          <Ionicons name={fallbackIcon} size={22} color={CYAN} />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {badge ? (
        <View style={{
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 4,
          backgroundColor: 'rgba(0,240,255,0.1)',
        }}
        >
          <Text style={{ color: badgeColor, fontSize: 10, fontWeight: '800' }}>{badge}</Text>
        </View>
      ) : null}
      {actionLabel ? (
        <TouchableOpacity
          onPress={onAction}
          hitSlop={8}
          style={{
            borderRadius: 10,
            borderWidth: 1,
            borderColor: 'rgba(0,240,255,0.35)',
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: CYAN, fontSize: 11, fontWeight: '800' }}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.28)" />
      )}
    </TouchableOpacity>
  );
}

export function FilterChips({ options, value, onChange }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map((option) => {
        const id = option.id ?? option;
        const label = option.label ?? option;
        const active = String(value) === String(id);
        return (
          <TouchableOpacity
            key={String(id)}
            onPress={() => onChange(id)}
            style={{
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: active ? 'rgba(0,240,255,0.55)' : 'rgba(255,255,255,0.1)',
              backgroundColor: active ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.04)',
            }}
          >
            <Text style={{ color: active ? CYAN : 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: '800' }}>
              {label}
            </Text>
          </TouchableOpacity>
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

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top']}>
        <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16, textTransform: 'uppercase' }}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{subtitle}</Text>
              ) : null}
            </View>
            {headerRight}
          </View>

          {onQuery ? (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              minHeight: 48,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(255,255,255,0.05)',
              paddingHorizontal: 14,
            }}
            >
              <Ionicons name="search" size={18} color={CYAN} />
              <TextInput
                value={query}
                onChangeText={onQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor="rgba(255,255,255,0.35)"
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                style={{ flex: 1, color: '#fff', fontSize: 16, paddingVertical: 10 }}
              />
            </View>
          ) : null}

          {chips?.length ? (
            <FilterChips options={chips} value={chipValue} onChange={onChip} />
          ) : null}
          {extraFilters}
        </View>

        {loading ? (
          <ActivityIndicator color={CYAN} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 10 }}
            refreshControl={onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={CYAN} />
            ) : undefined}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={(
              <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                <Ionicons name={emptyIcon} size={36} color="rgba(255,255,255,0.28)" />
                <Text style={{ color: 'rgba(255,255,255,0.45)', marginTop: 12, fontWeight: '700' }}>
                  {emptyText}
                </Text>
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </GamerProfileShell>
  );
}
