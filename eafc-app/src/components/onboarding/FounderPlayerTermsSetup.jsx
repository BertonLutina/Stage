import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import STText from '../common/STText';
import { FOUNDER_TARGET_STATS, normalizeFounderPlayerTerms } from '../../lib/founderPlayerTerms';
import { onboardingStyles as s } from './onboardingStyles';

const TARGET_TYPES = [
  { value: 'min', label: 'Minimum (≥)' },
  { value: 'exact', label: 'Exact (=)' },
  { value: 'range', label: 'Range' },
];

export default function FounderPlayerTermsSetup({ initialTerms = null, onComplete }) {
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

  const handleContinue = () => {
    onComplete?.(normalizeFounderPlayerTerms({
      weekly_salary_stc: weeklySalary,
      signing_bonus_stc: signingBonus,
      performance_targets: targets,
    }));
  };

  return (
    <View>
      <STText style={s.title}>Give yourself wages</STText>
      <STText style={s.subtitle}>
        Set the founder player salary and optional performance targets before you create the club.
      </STText>

      <STText style={s.label}>Weekly salary (STC)</STText>
      <TextInput
        value={weeklySalary}
        onChangeText={setWeeklySalary}
        keyboardType="number-pad"
        placeholder="e.g. 25000"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
      />

      <STText style={s.label}>Signing bonus (STC)</STText>
      <TextInput
        value={signingBonus}
        onChangeText={setSigningBonus}
        keyboardType="number-pad"
        placeholder="e.g. 5000"
        placeholderTextColor="rgba(255,255,255,0.35)"
        style={s.input}
      />

      <STText style={s.label}>Performance targets</STText>
      {targets.map((target, idx) => (
        <View
          key={`${target.stat}-${idx}`}
          style={{
            borderRadius: 12,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.15)',
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: 12,
            marginBottom: 10,
          }}
        >
          <View style={s.chipRow}>
            {FOUNDER_TARGET_STATS.map((stat) => (
              <TouchableOpacity
                key={stat.value}
                onPress={() => updateTarget(idx, 'stat', stat.value)}
                style={[s.chip, target.stat === stat.value && s.chipActive]}
              >
                <STText style={[s.chipText, target.stat === stat.value && s.chipTextActive]}>{stat.label}</STText>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.chipRow}>
            {TARGET_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                onPress={() => updateTarget(idx, 'type', type.value)}
                style={[s.chip, target.type === type.value && s.chipActive]}
              >
                <STText style={[s.chipText, target.type === type.value && s.chipTextActive]}>{type.label}</STText>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={String(target.value ?? '')}
            onChangeText={(value) => updateTarget(idx, 'value', parseFloat(value) || 0)}
            keyboardType="number-pad"
            placeholder={target.type === 'range' ? 'Min' : 'Value'}
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={s.input}
          />
          {target.type === 'range' ? (
            <TextInput
              value={String(target.value_max || '')}
              onChangeText={(value) => updateTarget(idx, 'value_max', parseFloat(value) || 0)}
              keyboardType="number-pad"
              placeholder="Max"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={s.input}
            />
          ) : null}
          <TouchableOpacity onPress={() => removeTarget(idx)} style={s.ghostBtn}>
            <STText style={s.ghostBtnText}>Remove target</STText>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={addTarget} style={s.ghostBtn}>
        <STText style={s.ghostBtnText}>+ Add target</STText>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleContinue} style={s.primaryBtn}>
        <STText style={s.primaryBtnText}>Continue to club</STText>
      </TouchableOpacity>
    </View>
  );
}
