import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import useThemeStore from '@/store/themeStore';
import { TextField, Card, SectionLabel, Avatar, SegmentedControl, Chip } from '@/components/ui';
import { FONT_EA_SPORTS, headingStyle } from '@/lib/fonts';
import { COUNTRIES } from '@/lib/countries';
import { StepHeading, ChoiceCard, OnboardingSelect } from './OnboardingParts';
import { STEP_GAP } from './onboardingStyles';

/**
 * Player-branch onboarding steps, matching the mockups (Platform → Position →
 * Gamertag → Club). Presentational and controlled: the parent (onboarding.jsx)
 * owns the values, the step header, the Continue button, and persistence via
 * `savePlayerProfile`. These steps never write to the backend themselves.
 */

/** Platform. Real Stage console values (lib/platformDisplay CONSOLE_OPTIONS). */
const PLATFORMS = [
  { value: 'PS5', initials: 'PS', title: 'PlayStation 5', caption: 'PSN ID required' },
  { value: 'Xbox Series', initials: 'XB', title: 'Xbox Series X|S', caption: 'Xbox gamertag required' },
  { value: 'PC', initials: 'PC', title: 'PC', caption: 'EA app ID required' },
];

export function PlatformStep({ value, onChange, crossPlay, onChangeCrossPlay }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading title="Where do you play?" subtitle="We match you with clubs on the same platform." />
      <View style={{ gap: 12 }} accessibilityRole="radiogroup">
        {PLATFORMS.map((p) => (
          <ChoiceCard
            key={p.value}
            initials={p.initials}
            title={p.title}
            caption={p.caption}
            selected={value === p.value}
            onPress={() => onChange(p.value)}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel="I play with cross-play enabled"
        accessibilityState={{ checked: !!crossPlay }}
        onPress={() => onChangeCrossPlay?.(!crossPlay)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 }}
      >
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: crossPlay ? 0 : 2,
            borderColor: tokens.borderStrong,
            backgroundColor: crossPlay ? tokens.cyan : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {crossPlay ? (
            <View
              style={{
                width: 10,
                height: 6,
                borderLeftWidth: 2,
                borderBottomWidth: 2,
                borderColor: tokens.onCyan,
                transform: [{ rotate: '-45deg' }, { translateY: -1 }],
              }}
            />
          ) : null}
        </View>
        <Text style={{ flex: 1, color: tokens.muted, fontSize: 13 }}>I play with cross-play enabled</Text>
      </Pressable>
    </View>
  );
}

/** Position bubbles on a pitch — the mockup's distinct positions, real values. */
const POSITION_SPOTS = {
  ST: { left: '50%', top: '13%' },
  LW: { left: '18%', top: '22%' },
  RW: { left: '82%', top: '22%' },
  CAM: { left: '50%', top: '34%' },
  CM: { left: '30%', top: '50%' },
  CDM: { left: '50%', top: '63%' },
  LB: { left: '16%', top: '74%' },
  CB: { left: '50%', top: '78%' },
  RB: { left: '84%', top: '74%' },
  GK: { left: '50%', top: '92%' },
};
const PITCH_HEIGHT = 400;
const BUBBLE = 48;

export function PositionStep({ value, secondary, onChange, onChangeSecondary }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [pickingAlt, setPickingAlt] = useState(false);
  const line = { position: 'absolute', borderColor: tokens.border, borderWidth: 2 };
  const hasAlt = Boolean(secondary && secondary !== 'none');

  const selectPosition = (pos) => {
    if (pickingAlt) {
      if (pos === value) return;
      onChangeSecondary?.(pos === secondary ? 'none' : pos);
      setPickingAlt(false);
      return;
    }
    if (pos === secondary) {
      onChangeSecondary?.('none');
      return;
    }
    onChange?.(pos);
    if (pos === secondary) onChangeSecondary?.('none');
  };

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Your position"
        subtitle="Pick a main position and up to one alternate."
      />
      <View
        accessibilityRole="radiogroup"
        style={{
          height: PITCH_HEIGHT,
          borderRadius: 18,
          borderWidth: 2,
          borderColor: tokens.border,
          backgroundColor: tokens.card,
          overflow: 'hidden',
        }}
      >
        <View style={[line, { left: 0, right: 0, top: '50%', height: 0, borderWidth: 0, borderTopWidth: 2 }]} />
        <View style={[line, { left: '50%', top: '50%', width: 90, height: 90, marginLeft: -45, marginTop: -45, borderRadius: 45 }]} />
        <View style={[line, { left: '25%', right: '25%', bottom: 0, height: 64, borderBottomWidth: 0 }]} />
        <View style={[line, { left: '25%', right: '25%', top: 0, height: 64, borderTopWidth: 0 }]} />
        {Object.keys(POSITION_SPOTS).map((pos) => {
          const on = value === pos;
          const alt = hasAlt && secondary === pos;
          return (
            <Pressable
              key={pos}
              accessibilityRole="radio"
              accessibilityLabel={pos}
              accessibilityState={{ selected: on || alt }}
              onPress={() => selectPosition(pos)}
              style={{
                position: 'absolute',
                ...POSITION_SPOTS[pos],
                width: BUBBLE,
                height: BUBBLE,
                marginLeft: -BUBBLE / 2,
                marginTop: -BUBBLE / 2,
                borderRadius: BUBBLE / 2,
                borderWidth: 2,
                borderColor: on || alt || pickingAlt ? tokens.cyanHi : tokens.borderStrong,
                backgroundColor: on ? tokens.cyan : tokens.cardHi,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text numberOfLines={1} style={{ color: on ? tokens.onCyan : tokens.text, fontFamily: FONT_EA_SPORTS, fontSize: 14 }}>
                {pos}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label={`Main · ${value || '—'}`} active />
        {hasAlt ? (
          <Chip
            label={`Alt · ${secondary}`}
            active={false}
            onPress={() => onChangeSecondary?.('none')}
          />
        ) : (
          <Chip
            label="+ Add"
            active={pickingAlt}
            onPress={() => setPickingAlt((v) => !v)}
          />
        )}
      </View>
    </View>
  );
}

const GAMERTAG_LABELS = {
  PS5: 'PSN ID',
  'Xbox Series': 'Xbox gamertag',
  PC: 'EA app ID',
};

/** Gamertag + country + optional "Link Pro Club" (the folded identity claim). */
export function GamertagStep({
  gamertag,
  onChangeGamertag,
  country,
  onChangeCountry,
  linked,
  onToggleLink,
  platform = 'PS5',
  position = 'ST',
}) {
  const tokens = useThemeStore((s) => s.tokens);
  const typed = String(gamertag || '').trim();
  const countryOptions = COUNTRIES.map((c) => ({ id: c.name, label: c.name }));
  const platformTitle =
    PLATFORMS.find((p) => p.value === platform)?.title || platform || 'PlayStation 5';
  const fieldLabel = GAMERTAG_LABELS[platform] || 'Gamertag';

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading title="Your gamertag" subtitle="This is how clubs and opponents will find you." />
      <TextField
        label={fieldLabel}
        value={gamertag}
        onChangeText={onChangeGamertag}
        placeholder="NightOwl_10"
        accessibilityLabel={fieldLabel}
      />
      {typed ? (
        <Card style={{ gap: 14 }}>
          <SectionLabel>Preview</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar initials={typed.slice(0, 2)} size={56} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text numberOfLines={1} style={[headingStyle, { color: tokens.text, fontSize: 22, letterSpacing: 22 * 0.03 }]}>
                {typed}
              </Text>
              <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 13 }}>
                {position} · {platformTitle} · Free agent
              </Text>
            </View>
          </View>
        </Card>
      ) : null}
      <OnboardingSelect
        label="Country"
        value={country}
        placeholder="Select country"
        title="Country"
        options={countryOptions}
        onChange={onChangeCountry}
      />
      <Pressable
        accessibilityRole="switch"
        accessibilityLabel="Link Pro Club stats"
        accessibilityState={{ checked: !!linked }}
        onPress={onToggleLink}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          padding: 16,
          borderRadius: tokens.cardRadius,
          borderWidth: 1,
          borderStyle: 'dashed',
          borderColor: linked ? tokens.cyan : tokens.borderStrong,
          backgroundColor: 'transparent',
          minHeight: 44,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: tokens.text, fontWeight: '600' }}>Link Pro Club stats</Text>
          <Text style={{ color: tokens.muted, fontSize: 13 }}>Import your EA FC Pro Clubs history</Text>
        </View>
        <Text style={{ color: linked ? tokens.success : tokens.muted, fontWeight: '600', fontSize: 13 }}>
          {linked ? 'Linked' : 'Link'}
        </Text>
      </Pressable>
    </View>
  );
}

/** Create a club or stay a free agent (Join-with-code is a data gap). */
const CLUB_CHOICES = [
  { key: 'create', label: 'Create club' },
  { key: 'freeagent', label: 'Free agent' },
];

export function ClubChoiceStep({ value, onChange }) {
  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Set up your club"
        subtitle="Create a club or stay a free agent until a contract offer."
      />
      <SegmentedControl options={CLUB_CHOICES} value={value} onChange={onChange} />
    </View>
  );
}
