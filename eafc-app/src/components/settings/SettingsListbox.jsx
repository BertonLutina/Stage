import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { SelectField, TextField } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';
import { headingStyleLg } from '@/lib/fonts';
import LiveGlass from '@/components/theme/LiveGlass';

/**
 * Select field + searchable bottom sheet. The trigger is the shared Stage SelectField
 * (50 high, radius 12, bgDeep) so it sits in family next to TextField.
 * `flush` drops the trailing 12px gap for callers that lay fields out with `gap`.
 */
export function SettingsListbox({
  label,
  value,
  placeholder = 'Select',
  options = [],
  onChange,
  title,
  searchPlaceholder = 'Search…',
  accent = 'cyan',
  flush = false,
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => String(opt.id) === String(value));
  const display = selected?.label || value || placeholder;
  const tint = accent === 'amber' ? tokens.amber : tokens.cyan;

  return (
    <View style={flush ? null : { marginBottom: 12 }}>
      <SelectField
        label={label}
        value={selected?.label || (value != null ? String(value) : '')}
        placeholder={placeholder}
        accessibilityLabel={label ? `${label}, ${display}` : display}
        onPress={() => setOpen(true)}
      />
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
  const storeTokens = useThemeStore((s) => s.tokens);
  const t = tokens || storeTokens;
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
          style={[styles.scrim, { backgroundColor: t.overlay }]}
        />
        <LiveGlass
          intensity={26}
          style={[
            styles.sheet,
            {
              backgroundColor: t.live ? 'transparent' : t.bgDeep,
              borderColor: t.border,
            },
          ]}
        >
          <View style={styles.handleWrap}>
            <View style={[styles.handle, { backgroundColor: t.border }]} />
          </View>
          <Text numberOfLines={1} style={[headingStyleLg, styles.sheetTitle, { color: t.text }]}>{title}</Text>
          {showSearch ? (
            <View style={{ marginBottom: 10 }}>
              <TextField
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                accessibilityLabel={searchPlaceholder}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
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
                  <Pressable
                    onPress={() => {
                      if (item.disabled) return;
                      setQuery('');
                      onSelect?.(item.id, item);
                    }}
                    disabled={item.disabled}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: !!item.disabled }}
                    accessibilityLabel={item.label}
                    style={({ pressed }) => [
                      styles.option,
                      {
                        borderColor: active ? color : t.border,
                        backgroundColor: active ? t.card : 'transparent',
                        opacity: item.disabled ? 0.4 : (pressed ? 0.85 : 1),
                      },
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
                      <Ionicons name="checkmark-circle" size={22} color={color} />
                    ) : (
                      <View style={[styles.emptyCheck, { borderColor: t.border }]} />
                    )}
                  </Pressable>
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
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
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
  section: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 11 * 0.12,
    textTransform: 'uppercase',
    marginTop: 10,
    marginBottom: 6,
  },
  option: {
    minHeight: MIN_TOUCH + 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionDesc: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  emptyCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 28,
  },
});
