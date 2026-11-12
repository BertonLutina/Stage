import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import useAuthStore from '../../../store/authStore';
import useThemeStore from '@/store/themeStore';
import useAvailability, { AVAILABILITY_WINDOWS, nextAvailabilityState } from '@/hooks/useAvailability';
import { Button, IconButton, Screen, SectionLabel } from '@/components/ui';
import { headingStyle } from '@/lib/fonts';

const DAYS = [
  { value: 1, short: 'Mon', long: 'Monday' }, { value: 2, short: 'Tue', long: 'Tuesday' },
  { value: 3, short: 'Wed', long: 'Wednesday' }, { value: 4, short: 'Thu', long: 'Thursday' },
  { value: 5, short: 'Fri', long: 'Friday' }, { value: 6, short: 'Sat', long: 'Saturday' },
  { value: 0, short: 'Sun', long: 'Sunday' },
];
const LABELS = ['18–20', '20–22', '22–24', '00–02'];

function cellColors(state, tokens) {
  if (state === 'available') {
    return { backgroundColor: tokens.cyan, borderColor: tokens.cyan };
  }
  if (state === 'maybe') {
    return { backgroundColor: '#1E4F7A', borderColor: '#2CCFD6' };
  }
  return { backgroundColor: tokens.bgDeep, borderColor: tokens.border };
}

export default function AvailabilityScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const { data, loading, error, refreshing, refetch, save } = useAvailability(user?.id);
  const [grid, setGrid] = useState(data.grid);
  const dirtyRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { if (!dirtyRef.current) setGrid(data.grid); }, [data.grid]);
  const toggle = (day, column) => {
    dirtyRef.current = true;
    setGrid((current) => current.map((row, index) => (
      index === day ? row.map((value, slot) => (
        slot === column ? nextAvailabilityState(value) : value
      )) : row
    )));
  };
  const submit = async () => {
    setSaving(true); setSaveError(null);
    try {
      await save(grid);
      await refetch();
      dirtyRef.current = false;
    } catch (err) { setSaveError(err?.message || 'Could not save availability'); }
    finally { setSaving(false); }
  };
  const goBack = () => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return (
    <Screen
      tabBar={false}
      style={{ gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} />}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={goBack} />
        <SectionLabel>Availability</SectionLabel>
        <View style={{ width: 44 }} />
      </View>
      <Text accessibilityRole="header" style={[headingStyle, { color: tokens.text, fontSize: 34, lineHeight: 39 }]}>When can you play?</Text>
      <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>
        Tap slots to tell your club when you are free. Times in {user?.timezone || 'your timezone'}.
      </Text>

      {loading ? <ActivityIndicator color={tokens.cyan} style={{ marginTop: 48 }} /> : error ? (
        <View accessibilityRole="alert" style={{ gap: 12, paddingVertical: 28, alignItems: 'center' }}>
          <Text style={{ color: tokens.danger, textAlign: 'center' }}>{error}</Text>
          <Button title="Try again" variant="secondary" onPress={refetch} />
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: 6, paddingLeft: 48 }}>
            {LABELS.map((label) => <Text key={label} style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', textAlign: 'center', flex: 1 }}>{label}</Text>)}
          </View>
          {DAYS.map((day) => (
            <View key={day.value} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ color: tokens.text, fontSize: 13, fontWeight: '700', width: 42 }}>{day.short}</Text>
              {AVAILABILITY_WINDOWS.map((_, column) => {
                const state = grid?.[day.value]?.[column] || 'busy';
                const colors = cellColors(state, tokens);
                return (
                  <Pressable
                    key={LABELS[column]}
                    accessibilityRole="button"
                    accessibilityLabel={`${day.long} ${LABELS[column]}, ${state}`}
                    onPress={() => toggle(day.value, column)}
                    style={{
                      flex: 1, minHeight: 48, borderRadius: 10, borderWidth: 1,
                      borderColor: colors.borderColor,
                      backgroundColor: colors.backgroundColor,
                    }}
                  />
                );
              })}
            </View>
          ))}
          <View style={{ flexDirection: 'row', gap: 18, marginTop: 4, flexWrap: 'wrap' }}>
            {[
              ['Available', tokens.cyan, tokens.cyan],
              ['Maybe', '#1E4F7A', '#2CCFD6'],
              ['Busy', tokens.bgDeep, tokens.border],
            ].map(([label, fill, border]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: fill, borderWidth: 1, borderColor: border }} />
                <Text style={{ color: tokens.muted, fontSize: 12 }}>{label}</Text>
              </View>
            ))}
          </View>
          {saveError ? <Text accessibilityRole="alert" style={{ color: tokens.danger }}>{saveError}</Text> : null}
          <View style={{ marginTop: 14 }}><Button title="Save availability" onPress={submit} loading={saving} /></View>
        </View>
      )}
    </Screen>
  );
}
