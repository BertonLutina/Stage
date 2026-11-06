import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useThemeStore from '@/store/themeStore';
import { ICON_SIZE, MIN_TOUCH } from '@/components/ui/metrics';

/**
 * Stage search field: 50 high, radius 14, bgDeep fill, cyan border, search icon.
 * Extra props go to the TextInput. Pass `clearLabel` to show a clear button
 * (labelled for screen readers) while the field has text.
 */
export default function DirectorySearchField({
  value,
  onChangeText,
  placeholder,
  accessibilityLabel,
  clearLabel,
  ...inputProps
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const showClear = Boolean(clearLabel && value);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        height: 50,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: tokens.cyan,
        backgroundColor: tokens.bgDeep,
        paddingLeft: 14,
        paddingRight: showClear ? 3 : 14,
      }}
    >
      <Ionicons name="search-outline" size={ICON_SIZE} color={tokens.muted} />
      <TextInput
        accessibilityLabel={accessibilityLabel || placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={tokens.muted}
        selectionColor={tokens.cyan}
        {...inputProps}
        style={{
          flex: 1,
          minWidth: 0,
          color: tokens.text,
          fontSize: 15,
          fontWeight: '500',
          paddingVertical: 0,
          height: '100%',
        }}
      />
      {showClear ? (
        <Pressable
          onPress={() => onChangeText && onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          style={{
            width: MIN_TOUCH,
            height: MIN_TOUCH,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="close-circle" size={20} color={tokens.muted} />
        </Pressable>
      ) : null}
    </View>
  );
}
