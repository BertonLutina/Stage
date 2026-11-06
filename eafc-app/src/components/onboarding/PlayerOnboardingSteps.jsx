import React from 'react';
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

export function PlatformStep({ value, onChange }) {
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

export function PositionStep({ value, onChange }) {
  const tokens = useThemeStore((s) => s.tokens);
  const line = { position: 'absolute', borderColor: tokens.border, borderWidth: 2 };
  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading title="Your position" subtitle="Pick your main in-game position." />
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
          return (
            <Pressable
              key={pos}
              accessibilityRole="radio"
              accessibilityLabel={pos}
              accessibilityState={{ selected: on }}
              onPress={() => onChange(pos)}
              style={{
                position: 'absolute',
                ...POSITION_SPOTS[pos],
                width: BUBBLE,
                height: BUBBLE,
                marginLeft: -BUBBLE / 2,
                marginTop: -BUBBLE / 2,
                borderRadius: BUBBLE / 2,
                borderWidth: 2,
                borderColor: on ? tokens.cyanHi : tokens.borderStrong,
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
      <View style={{ flexDirection: 'row' }}>
        <Chip label={`Main · ${value}`} active />
      </View>
    </View>
  );
}

/** Gamertag + country + optional "Link Pro Club" (the folded identity claim). */
export function GamertagStep({ gamertag, onChangeGamertag, country, onChangeCountry, linked, onToggleLink }) {
  const tokens = useThemeStore((s) => s.tokens);
  const typed = String(gamertag || '').trim();
  const countryOptions = COUNTRIES.map((c) => ({ id: c.name, label: c.name }));
  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading title="Your gamertag" subtitle="This is how clubs and opponents will find you." />
      <TextField label="Gamertag" value={gamertag} onChangeText={onChangeGamertag} placeholder="NightOwl_10" />
      {typed ? (
        <Card style={{ gap: 14 }}>
          <SectionLabel>Preview</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Avatar initials={typed.slice(0, 2)} size={56} />
            <Text numberOfLines={1} style={[headingStyle, { flex: 1, color: tokens.text, fontSize: 22, letterSpacing: 22 * 0.03 }]}>
              {typed}
            </Text>
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

/** Create a club or stay a free agent. */
const CLUB_CHOICES = [
  { key: 'create', label: 'Create Club' },
  { key: 'freeagent', label: 'Free Agent' },
];

export function ClubChoiceStep({ value, onChange }) {
  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Club or free agent"
        subtitle="Found a club, or wait for a contract offer. Clubs sign players — you don’t browse to join."
      />
      <SegmentedControl options={CLUB_CHOICES} value={value} onChange={onChange} />
    </View>
  );
}
