import React, { useState } from 'react';
import { View, TouchableOpacity, Modal } from 'react-native';
import STText from '../common/STText';
import { getTutorialSteps } from '../../lib/tutorialSteps';
import { onboardingStyles as s } from './onboardingStyles';

export default function TutorialPopup({ open, onClose, intent = 'player' }) {
  const steps = getTutorialSteps(intent);
  const [index, setIndex] = useState(0);
  const step = steps[index] || steps[0];
  const isLast = index >= steps.length - 1;

  if (!open || !step) return null;

  return (
    <Modal visible={open} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 20 }}>
        <View
          style={{
            backgroundColor: 'rgba(255,255,255,0.10)',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.20)',
            borderRadius: 16,
            padding: 24,
          }}
        >
          <STText style={{ fontSize: 28, marginBottom: 8 }}>{step.icon}</STText>
          <STText style={s.title}>{step.title}</STText>
          <STText style={s.subtitle}>{step.description}</STText>

          {Array.isArray(step.tips) ? (
            <View style={{ marginBottom: 16, gap: 6 }}>
              {step.tips.map((tip) => (
                <STText key={tip} style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 18 }}>
                  • {tip}
                </STText>
              ))}
            </View>
          ) : null}

          <STText style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, marginBottom: 12, letterSpacing: 2 }}>
            {index + 1} / {steps.length}
          </STText>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {index > 0 ? (
              <TouchableOpacity
                onPress={() => setIndex((i) => Math.max(0, i - 1))}
                style={[s.primaryBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 0 }]}
              >
                <STText style={[s.primaryBtnText, { color: '#fff' }]}>Back</STText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={onClose} style={[s.primaryBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 0 }]}>
                <STText style={[s.primaryBtnText, { color: '#fff' }]}>Skip</STText>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => {
                if (isLast) onClose?.();
                else setIndex((i) => i + 1);
              }}
              style={[s.primaryBtn, { flex: 1, marginTop: 0 }]}
            >
              <STText style={s.primaryBtnText}>{isLast ? 'Got it' : 'Next'}</STText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
