import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { INPUT_HEIGHT, INPUT_RADIUS } from './metrics';

/**
 * Labelled Stage text input: 50 high, radius 12, bgDeep fill. `right` is an optional
 * trailing element (e.g. a password visibility button) laid over the field's right edge.
 */
export default function TextField({
  label,
  accessibilityLabel,
  value,
  onChangeText,
  error,
  multiline = false,
  right,
  labelColor,
  style,
  onFocus,
  onBlur,
  ...inputProps
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const [focused, setFocused] = useState(false);

  let borderColor = tokens.border;
  if (error) borderColor = tokens.danger;
  else if (focused) borderColor = tokens.cyan;

  return (
    <View>
      {label ? (
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            color: labelColor || tokens.textSoft,
            fontSize: 13,
            fontWeight: '600',
            marginBottom: 6,
          }}
        >
          {label}
        </Text>
      ) : null}
      <View>
        <TextInput
          accessibilityLabel={accessibilityLabel || label}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          placeholderTextColor={tokens.muted}
          selectionColor={tokens.cyan}
          onFocus={(e) => {
            setFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...inputProps}
          style={[
            {
              borderRadius: INPUT_RADIUS,
              borderWidth: 1,
              borderColor,
              backgroundColor: tokens.bgDeep,
              color: tokens.text,
              fontSize: 15,
              paddingHorizontal: 16,
              paddingRight: right ? 52 : 16,
            },
            multiline
              ? { minHeight: 100, paddingTop: 14, paddingBottom: 14, textAlignVertical: 'top' }
              : { height: INPUT_HEIGHT },
            style,
          ]}
        />
        {right ? (
          <View
            style={{
              position: 'absolute',
              right: 4,
              top: 0,
              height: INPUT_HEIGHT,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {right}
          </View>
        ) : null}
      </View>
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{ color: tokens.danger, fontSize: 12, marginTop: 6 }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
