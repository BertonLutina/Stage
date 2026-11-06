import React, { useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { Chip } from '@/components/ui';
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
  const tokens = useThemeStore((s) => s.tokens);
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
          <Text numberOfLines={1} style={{ color: tokens.textSoft, fontSize: 13, fontWeight: '600' }}>
            Timezone · {timezoneLabel(timezone)}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {TIMEZONES.map((zone) => (
              <Chip
                key={zone.value}
                label={zone.label}
                active={timezone === zone.value}
                onPress={() => onTimezoneChange?.(zone.value)}
              />
            ))}
            {!knownZone && timezone ? <Chip label={timezone} active /> : null}
          </View>
          <Text style={{ color: tokens.muted, fontSize: 12, lineHeight: 17 }}>
            Kickoff is this wall-clock time in the selected zone. Brussels switches CET/CEST automatically.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function PickerField({ icon, label, value, empty, active, onPress }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      style={{
        backgroundColor: tokens.bgDeep,
        borderWidth: 1,
        borderColor: active ? tokens.cyan : tokens.border,
        borderRadius: 12,
        minHeight: 56,
        paddingHorizontal: 16,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <Ionicons name={icon} size={22} color={active ? tokens.cyan : tokens.muted} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.6 }}>
          {label.toUpperCase()}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            color: empty ? tokens.muted : tokens.text,
            fontSize: 15,
            fontWeight: '600',
            marginTop: 2,
          }}
        >
          {value}
        </Text>
      </View>
      <Ionicons name={active ? 'chevron-up' : 'chevron-down'} size={18} color={tokens.muted} />
    </TouchableOpacity>
  );
}

function NativePicker({ value, mode, onChange, onDone, minimumDate }) {
  const tokens = useThemeStore((s) => s.tokens);
  const picker = (
    <DateTimePicker
      value={value}
      mode={mode}
      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
      onChange={onChange}
      minimumDate={minimumDate}
      is24Hour
      themeVariant="dark"
      accentColor={tokens.cyan}
      textColor={tokens.text}
    />
  );

  if (Platform.OS !== 'ios') return picker;

  return (
    <View style={{
      backgroundColor: tokens.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: tokens.border,
      overflow: 'hidden',
    }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 10, paddingTop: 4 }}>
        <TouchableOpacity
          onPress={onDone}
          hitSlop={10}
          accessibilityRole="button"
          style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }}
        >
          <Text style={{ color: tokens.cyan, fontWeight: '700', fontSize: 15 }}>Done</Text>
        </TouchableOpacity>
      </View>
      {picker}
    </View>
  );
}
