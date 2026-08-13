import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import {
  formatArrangeDateLabel,
  formatDateYmd,
  formatTimeHm,
  parseArrangeDateTime,
} from '@/lib/arrangeGame';
import { TIMEZONES, timezoneLabel } from '@/lib/timezones';

export default function DateTimeZoneFields({
  date,
  time,
  timezone,
  onDateChange,
  onTimeChange,
  onTimezoneChange,
  showTimezone = true,
}) {
  const [openPicker, setOpenPicker] = useState(null);
  const pickerValue = parseArrangeDateTime(date, time || '21:00');
  const knownZone = TIMEZONES.some((zone) => zone.value === timezone);

  const closePicker = () => setOpenPicker(null);

  const handleChange = (event, selected) => {
    if (Platform.OS === 'android') {
      closePicker();
      if (event?.type === 'dismissed' || !selected) return;
    }
    if (!selected) return;
    if (openPicker === 'date') onDateChange?.(formatDateYmd(selected));
    if (openPicker === 'time') onTimeChange?.(formatTimeHm(selected));
  };

  const toggle = (mode) => {
    if (mode === 'date' && !date) onDateChange?.(formatDateYmd(pickerValue));
    if (mode === 'time' && !time) onTimeChange?.(formatTimeHm(pickerValue));
    setOpenPicker((current) => (current === mode ? null : mode));
  };

  return (
    <View style={{ gap: 10 }}>
      <PickerField
        icon="calendar-outline"
        label="Date"
        value={date ? formatArrangeDateLabel(date) : 'Pick a date'}
        empty={!date}
        active={openPicker === 'date'}
        onPress={() => toggle('date')}
      />
      {openPicker === 'date' ? (
        <NativePicker
          value={pickerValue}
          mode="date"
          onChange={handleChange}
          onDone={closePicker}
          minimumDate={new Date()}
        />
      ) : null}

      <PickerField
        icon="time-outline"
        label="Time"
        value={time || 'Pick a time'}
        empty={!time}
        active={openPicker === 'time'}
        onPress={() => toggle('time')}
      />
      {openPicker === 'time' ? (
        <NativePicker
          value={pickerValue}
          mode="time"
          onChange={handleChange}
          onDone={closePicker}
        />
      ) : null}

      {showTimezone ? (
        <View style={{ gap: 8 }}>
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '700' }}>
            Timezone · {timezoneLabel(timezone)}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TIMEZONES.map((zone) => {
              const selected = timezone === zone.value;
              return (
                <TouchableOpacity
                  key={zone.value}
                  onPress={() => onTimezoneChange?.(zone.value)}
                  style={{
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: selected ? CYAN : 'rgba(255,255,255,0.14)',
                    backgroundColor: selected ? 'rgba(0,240,255,0.12)' : 'rgba(255,255,255,0.04)',
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                  }}
                >
                  <Text style={{
                    color: selected ? CYAN : 'rgba(255,255,255,0.7)',
                    fontWeight: '800',
                    fontSize: 11,
                  }}
                  >
                    {zone.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {!knownZone && timezone ? (
              <View style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: CYAN,
                backgroundColor: 'rgba(0,240,255,0.12)',
                paddingHorizontal: 10,
                paddingVertical: 7,
              }}
              >
                <Text style={{ color: CYAN, fontWeight: '800', fontSize: 11 }}>{timezone}</Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, lineHeight: 15 }}>
            Kickoff is this wall-clock time in the selected zone. Brussels switches CET/CEST automatically.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PickerField({ icon, label, value, empty, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: active ? 'rgba(0,232,255,0.55)' : 'rgba(255,255,255,0.12)',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Ionicons name={icon} size={18} color={active ? CYAN : 'rgba(255,255,255,0.55)'} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </Text>
        <Text style={{
          color: empty ? 'rgba(255,255,255,0.35)' : '#fff',
          fontWeight: '700',
          marginTop: 2,
        }}
        >
          {value}
        </Text>
      </View>
      <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={16} color="rgba(255,255,255,0.35)" />
    </TouchableOpacity>
  );
}

function NativePicker({ value, mode, onChange, onDone, minimumDate }) {
  const picker = (
    <DateTimePicker
      value={value}
      mode={mode}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={onChange}
      minimumDate={minimumDate}
      is24Hour
      themeVariant="dark"
      accentColor={CYAN}
      textColor="#ffffff"
    />
  );

  if (Platform.OS !== 'ios') return picker;

  return (
    <View style={{
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      overflow: 'hidden',
    }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 10, paddingTop: 8 }}>
        <TouchableOpacity onPress={onDone} hitSlop={10}>
          <Text style={{ color: CYAN, fontWeight: '800', fontSize: 13 }}>Done</Text>
        </TouchableOpacity>
      </View>
      {picker}
    </View>
  );
}
