import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import useThemeStore from '@/store/themeStore';
import { Screen, Card, Button, IconButton, SectionLabel, Toggle } from '@/components/ui';
import { headingStyle } from '@/lib/fonts';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AvailabilityScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/users/${user.id}/availability`).then(r => setSlots(r.data.data || []));
  }, []);

  const toggleDay = (day) => {
    const exists = slots.find(s => s.day_of_week === day);
    if (exists) setSlots(slots.filter(s => s.day_of_week !== day));
    else setSlots([...slots, { day_of_week: day, start_time: '18:00', end_time: '22:00' }]);
  };

  const save = async () => {
    setSaving(true);
    try { await api.put(`/users/${user.id}/availability`, { slots }); }
    finally { setSaving(false); }
  };

  const goBack = () => {
    if (typeof router.canGoBack === 'function' && router.canGoBack()) router.back();
    else router.replace('/(tabs)/profile');
  };

  return (
    <Screen style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={goBack} />
        <SectionLabel>Availability</SectionLabel>
        <View style={{ width: 44, height: 44 }} />
      </View>
      <View style={{ gap: 8 }}>
        <Text
          accessibilityRole="header"
          numberOfLines={2}
          style={[headingStyle, { color: tokens.text, fontSize: 34, lineHeight: 38, letterSpacing: 1 }]}
        >
          When can you play?
        </Text>
        <Text style={{ color: tokens.muted, fontSize: 14 }}>
          Set the days you are available to play
        </Text>
      </View>
      <View style={{ gap: 10 }}>
        {DAYS.map((day, idx) => {
          const slot = slots.find(s => s.day_of_week === idx);
          return (
            <Card key={day} highlight={!!slot}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 }}>
                <Pressable
                  accessible={false}
                  onPress={() => toggleDay(idx)}
                  style={{ flex: 1, gap: 2 }}
                >
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{
                      color: slot ? tokens.cyan : tokens.text,
                      fontSize: 15,
                      fontWeight: '600',
                    }}
                  >
                    {day}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={{ color: tokens.muted, fontSize: 13 }}
                  >
                    {slot ? `${slot.start_time} – ${slot.end_time}` : 'Unavailable'}
                  </Text>
                </Pressable>
                <Toggle
                  value={!!slot}
                  onValueChange={() => toggleDay(idx)}
                  accessibilityLabel={`${day} availability`}
                />
              </View>
            </Card>
          );
        })}
      </View>
      <View style={{ marginTop: 6 }}>
        <Button title="Save Availability" onPress={save} loading={saving} />
      </View>
    </Screen>
  );
}
