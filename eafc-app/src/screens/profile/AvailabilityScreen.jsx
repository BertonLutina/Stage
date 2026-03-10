import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import Button from '../../components/common/Button';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function AvailabilityScreen() {
  const { user } = useAuthStore();
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

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView className="px-4">
        <Text className="text-white text-xl font-bold mt-4 mb-2">Availability</Text>
        <Text className="text-muted text-sm mb-6">Set the days you are available to play</Text>
        {DAYS.map((day, idx) => {
          const slot = slots.find(s => s.day_of_week === idx);
          return (
            <TouchableOpacity key={day} onPress={() => toggleDay(idx)}
              className={`flex-row items-center justify-between px-4 py-4 rounded-xl border mb-2 ${slot ? 'bg-primary/10 border-primary' : 'bg-card border-border'}`}>
              <Text className={`font-semibold ${slot ? 'text-primary' : 'text-white'}`}>{day}</Text>
              {slot ? <Text className="text-muted text-sm">{slot.start_time} – {slot.end_time}</Text> : <Text className="text-muted text-sm">Unavailable</Text>}
            </TouchableOpacity>
          );
        })}
        <Button title="Save Availability" onPress={save} loading={saving} className="mt-4 mb-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
