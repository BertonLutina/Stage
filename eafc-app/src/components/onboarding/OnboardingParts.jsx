import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { IconButton, SelectField, StepProgress, Avatar } from '@/components/ui';
import { OptionsBottomSheet } from '../settings/SettingsListbox';
import { MIN_TOUCH } from '../ui/metrics';
import { STEP_GAP, useOnboardingStyles } from './onboardingStyles';

/** Display title + muted subtitle that open every onboarding step. */
export function StepHeading({ title, subtitle }) {
  const s = useOnboardingStyles();
  return (
    <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" numberOfLines={3} style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function FormError({ children }) {
  const s = useOnboardingStyles();
  if (!children) return null;
  return <Text accessibilityRole="alert" style={s.error}>{children}</Text>;
}

/** Text-only action ("Skip for now", "Back"): cyan, centred, 44 high. */
export function TextLink({ title, onPress, disabled = false }) {
  const s = useOnboardingStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: MIN_TOUCH,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 12,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <Text numberOfLines={1} style={s.linkText}>{title}</Text>
    </Pressable>
  );
}

/**
 * Select field backed by the shared searchable bottom sheet. Same contract as
 * SettingsListbox (label / value / options / onChange), Stage field look.
 */
export function OnboardingSelect({
  label,
  value,
  placeholder = 'Select',
  options = [],
  onChange,
  title,
  searchPlaceholder = 'Search…',
}) {
  const [open, setOpen] = useState(false);
  const tokens = useThemeStore((st) => st.tokens);
  const selected = options.find((opt) => String(opt.id) === String(value));
  const display = selected?.label || value || '';

  return (
    <>
      <SelectField
        label={label}
        value={display}
        placeholder={placeholder}
        onPress={() => setOpen(true)}
      />
      <OptionsBottomSheet
        visible={open}
        title={title || label || 'Select'}
        options={options}
        selectedId={value}
        searchPlaceholder={searchPlaceholder}
        tint={tokens.cyan}
        tokens={tokens}
        onClose={() => setOpen(false)}
        onSelect={(id) => {
          const next = options.find((opt) => String(opt.id) === String(id));
          if (next?.disabled) return;
          onChange?.(id, next);
          setOpen(false);
        }}
      />
    </>
  );
}

/**
 * Top block of an onboarding step: optional back button, "Step n of N" label and the
 * progress bars (omitted without `total`). `current` is the 1-based step; bars up to it are filled.
 */
export function StepHeader({ onBack, label, current, total }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <View style={{ gap: STEP_GAP }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        {onBack ? (
          <IconButton icon="chevron-back" accessibilityLabel="Back" onPress={onBack} />
        ) : (
          <View style={{ width: MIN_TOUCH, height: MIN_TOUCH }} />
        )}
        <Text
          numberOfLines={1}
          style={{
            flexShrink: 1,
            color: tokens.muted,
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: 11 * 0.12,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
        <View style={{ width: MIN_TOUCH, height: MIN_TOUCH }} />
      </View>
      {total ? <StepProgress total={total} current={current} /> : null}
    </View>
  );
}

/**
 * Selectable card: initials tile, title + caption, radio. The selected card takes the
 * highlighted surface and a cyan radio ring.
 */
export function ChoiceCard({ initials, title, caption, selected, onPress, testID }) {
  const tokens = useThemeStore((st) => st.tokens);
  const s = useOnboardingStyles();
  const live = tokens.live === true;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 76,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: tokens.cardRadius,
        borderWidth: 1,
        borderColor: selected ? tokens.cyan : tokens.border,
        backgroundColor: selected && !live ? tokens.cardHi : tokens.card,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Avatar initials={initials} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text numberOfLines={1} style={s.cardTitle}>{title}</Text>
        {caption ? <Text numberOfLines={2} style={s.cardBody}>{caption}</Text> : null}
      </View>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          borderWidth: selected ? 7 : 2,
          borderColor: selected ? tokens.cyan : tokens.borderStrong,
        }}
      />
    </Pressable>
  );
}
