import React, { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { Button, Card, SectionLabel, TextField } from '@/components/ui';
import {
  FOUNDER_PLAYER_WEEKLY_SALARY_MAX,
  FOUNDER_PLAYER_WEEKLY_SALARY_MIN,
  FOUNDER_TARGET_STATS,
  isFounderPlayerWageAllowed,
  normalizeFounderPlayerTerms,
} from '../../lib/founderPlayerTerms';
import { OnboardingSelect, StepHeading, TextLink } from './OnboardingParts';
import { STEP_GAP, useOnboardingStyles } from './onboardingStyles';

const TARGET_TYPES = [
  { value: 'min', label: 'Minimum (≥)' },
  { value: 'exact', label: 'Exact (=)' },
  { value: 'range', label: 'Range' },
];

export default function FounderPlayerTermsSetup({ initialTerms = null, onComplete }) {
  const s = useOnboardingStyles();
  const seeded = normalizeFounderPlayerTerms(initialTerms || {});
  const [weeklySalary, setWeeklySalary] = useState(seeded.weekly_salary_stc ? String(seeded.weekly_salary_stc) : '');
  const [signingBonus, setSigningBonus] = useState(seeded.signing_bonus_stc ? String(seeded.signing_bonus_stc) : '');
  const [targets, setTargets] = useState(seeded.performance_targets);

  const addTarget = () => {
    setTargets((prev) => [...prev, { stat: 'goals', type: 'min', value: 0, value_max: 0 }]);
  };

  const updateTarget = (idx, field, val) => {
    setTargets((prev) => prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row)));
  };

  const removeTarget = (idx) => {
    setTargets((prev) => prev.filter((_, i) => i !== idx));
  };

  const wageOk = isFounderPlayerWageAllowed(weeklySalary);
  const statOptions = useMemo(
    () => FOUNDER_TARGET_STATS.map((stat) => ({ id: stat.value, label: stat.label })),
    [],
  );
  const typeOptions = useMemo(
    () => TARGET_TYPES.map((type) => ({ id: type.value, label: type.label })),
    [],
  );

  const handleContinue = () => {
    if (!wageOk) return;
    onComplete?.(normalizeFounderPlayerTerms({
      weekly_salary_stc: weeklySalary,
      signing_bonus_stc: signingBonus,
      performance_targets: targets,
    }));
  };

  return (
    <View style={{ gap: STEP_GAP }}>
      <StepHeading
        title="Pay yourself"
        subtitle="This is your founder player wage. You can renegotiate later."
      />

      <View style={{ gap: 6 }}>
        <TextField
          label="Weekly salary (STC)"
          value={weeklySalary}
          onChangeText={setWeeklySalary}
          keyboardType="number-pad"
          placeholder="e.g. 40000"
        />
        <Text style={s.hint}>
          {FOUNDER_PLAYER_WEEKLY_SALARY_MIN.toLocaleString()} – {FOUNDER_PLAYER_WEEKLY_SALARY_MAX.toLocaleString()} STC / week
        </Text>
      </View>

      <TextField
        label="Signing bonus (STC)"
        value={signingBonus}
        onChangeText={setSigningBonus}
        keyboardType="number-pad"
        placeholder="e.g. 5000"
      />

      <SectionLabel>Performance targets</SectionLabel>
      {targets.map((target, idx) => (
        <Card key={`${target.stat}-${idx}`} style={{ gap: 12 }}>
          <OnboardingSelect
            label="Stat"
            value={target.stat}
            placeholder="Select stat"
            title="Performance stat"
            options={statOptions}
            onChange={(id) => updateTarget(idx, 'stat', id)}
          />
          <OnboardingSelect
            label="Type"
            value={target.type}
            placeholder="Select type"
            title="Target type"
            options={typeOptions}
            onChange={(id) => updateTarget(idx, 'type', id)}
          />
          <TextField
            label={target.type === 'range' ? 'Min' : 'Value'}
            value={String(target.value ?? '')}
            onChangeText={(value) => updateTarget(idx, 'value', parseFloat(value) || 0)}
            keyboardType="number-pad"
            placeholder={target.type === 'range' ? 'Min' : 'Value'}
          />
          {target.type === 'range' ? (
            <TextField
              label="Max"
              value={String(target.value_max || '')}
              onChangeText={(value) => updateTarget(idx, 'value_max', parseFloat(value) || 0)}
              keyboardType="number-pad"
              placeholder="Max"
            />
          ) : null}
          <TextLink title="Remove target" onPress={() => removeTarget(idx)} />
        </Card>
      ))}

      <TextLink title="+ Add target" onPress={addTarget} />

      <Button title="Next" onPress={handleContinue} disabled={!wageOk} />
    </View>
  );
}
