import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import LiveGlass from '@/components/theme/LiveGlass';

export function SettingsListbox({
  label,
  value,
  placeholder = 'Select',
  options = [],
  onChange,
  title,
  searchPlaceholder = 'Search…',
  accent = 'cyan',
}) {
  const tokens = useGamerTokens();
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => String(opt.id) === String(value));
  const display = selected?.label || value || placeholder;
  const tint = accent === 'amber' ? tokens.amber : tokens.cyan;

  return (
    <View style={{ marginBottom: 12 }}>
      {label ? (
        <Text style={[styles.fieldLabel, { color: tokens.muted }]}>{label}</Text>
      ) : null}
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}, ${display}` : display}
        style={[styles.trigger, { borderColor: tokens.inputBorder, backgroundColor: tokens.inputFill }]}
      >
        <Text
          numberOfLines={1}
          style={[
            styles.triggerValue,
            { color: tokens.text },
            !selected && !value && { color: tokens.faint, fontWeight: '600' },
          ]}
        >
          {display}
        </Text>
        <Ionicons name="chevron-down" size={18} color={tokens.muted} />
      </TouchableOpacity>
      <OptionsBottomSheet
        visible={open}
        title={title || label || 'Select'}
        options={options}
        selectedId={value}
        searchPlaceholder={searchPlaceholder}
        accent={accent}
        tint={tint}
        tokens={tokens}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          const next = options.find((opt) => String(opt.id) === String(id));
          if (next?.disabled) return;
          onChange?.(id, next);
          setOpen(false);
        }}
      />
    </View>
  );
}

export function OptionsBottomSheet({
  visible,
  title,
  options = [],
  selectedId,
  onSelect,
  onClose,
  searchPlaceholder = 'Search…',
  accent = 'cyan',
  tint,
  tokens,
}) {
  const fallbackTokens = useGamerTokens();
  const t = tokens || fallbackTokens;
  const color = tint || (accent === 'amber' ? t.amber : t.cyan);
  const [query, setQuery] = useState('');
  const showSearch = options.length > 8;

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => (
      String(opt.label || '').toLowerCase().includes(q)
      || String(opt.description || '').toLowerCase().includes(q)
      || String(opt.section || '').toLowerCase().includes(q)
    ));
  }, [options, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.sheetRoot}
      >
        <Pressable
          onPress={() => { setQuery(''); onClose?.(); }}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={styles.scrim}
        />
        <LiveGlass
          intensity={26}
          style={[
            styles.sheet,
            {
              backgroundColor: t.live ? 'transparent' : t.cardSolid,
              borderColor: t.cyanBorder,
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: t.hairline }]} />
          </View>
          <Text style={[headingStyleLg, styles.sheetTitle, { color: t.text }]}>{title}</Text>
          {showSearch ? (
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={searchPlaceholder}
              placeholderTextColor={t.faint}
              style={[styles.search, {
                borderColor: t.inputBorder,
                backgroundColor: t.inputFill,
                color: t.text,
              }]}
              autoCorrect={false}
              autoCapitalize="none"
            />
          ) : null}
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 420 }}
            renderItem={({ item, index }) => {
              const active = String(item.id) === String(selectedId);
              const showSection = item.section && item.section !== filtered[index - 1]?.section;
              return (
                <View>
                  {showSection ? (
                    <Text style={[styles.section, { color: t.muted }]}>{item.section}</Text>
                  ) : null}
                  <TouchableOpacity
                    onPress={() => {
                      if (item.disabled) return;
                      setQuery('');
                      onSelect?.(item.id, item);
                    }}
                    disabled={item.disabled}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: !!item.disabled }}
                    accessibilityLabel={item.label}
                    style={[
                      styles.option,
                      {
                        borderColor: active ? t.tileBorder : t.hairline,
                        backgroundColor: active ? t.tileFill : t.inputFill,
                      },
                      item.disabled && { opacity: 0.4 },
                    ]}
                  >
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.optionLabel, { color: active ? color : t.text }]} numberOfLines={1}>
                        {item.label}
                      </Text>
                      {item.description ? (
                        <Text style={[styles.optionDesc, { color: t.muted }]} numberOfLines={2}>{item.description}</Text>
                      ) : null}
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color={color} />
                    ) : (
                      <View style={[styles.emptyCheck, { borderColor: t.hairline }]} />
                    )}
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={(
              <Text style={[styles.empty, { color: t.muted }]}>No matches</Text>
            )}
          />
        </LiveGlass>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  trigger: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 28,
    maxHeight: '78%',
  },
  handleWrap: { alignItems: 'center', marginBottom: 10 },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetTitle: {
    fontSize: 22,
    marginBottom: 12,
  },
  search: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 10,
    fontSize: 15,
  },
  section: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  option: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  emptyCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 28,
  },
});
