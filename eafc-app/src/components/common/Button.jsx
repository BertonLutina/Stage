import React from 'react';
import { layoutClassName } from '@/lib/layoutClassName';
import { View } from 'react-native';
import UiButton from '@/components/ui/Button';

/** Legacy variant names -> the closest ui/ variant. */
const VARIANT_MAP = {
  primary: 'primary',
  primary2: 'primary',
  accent: 'primary',
  secondary: 'secondary',
  outline: 'secondary',
  ghost: 'secondary',
  danger: 'danger',
};

/** Legacy label classes. The ui/ Button sets colour and size inline, which wins over these. */
const TEXT_CLASS = {
  primary: 'text-dark font-bold text-base',
  primary2: 'text-dark font-bold text-base',
  secondary: 'text-dark font-bold text-base',
  accent: 'text-white font-bold text-base',
  outline: 'text-primary font-bold text-base',
  danger: 'text-white font-bold text-base',
  ghost: 'text-white font-semibold text-base',
};

/** Prop-compatible wrapper around ui/Button; new code should import from `@/components/ui`. */
export default function Button({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  className = '',
}) {
  const button = (
    <UiButton
      title={title}
      onPress={onPress}
      variant={VARIANT_MAP[variant] || 'primary'}
      loading={loading}
      disabled={disabled}
      textClassName={TEXT_CLASS[variant] || TEXT_CLASS.primary}
    />
  );
  const layout = layoutClassName(className);
  if (!layout) return button;
  return <View className={layout}>{button}</View>;
}
