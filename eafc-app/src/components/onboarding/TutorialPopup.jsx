import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import STText from '../common/STText';
import { getTutorialSteps } from '../../lib/tutorialSteps';
import { ONB, onboardingStyles as s } from './onboardingStyles';

export default function TutorialPopup({ open, onClose, intent = 'player' }) {
  const steps = getTutorialSteps(intent);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open, intent]);

  const safeIndex = Math.min(index, Math.max(steps.length - 1, 0));
  const step = steps[safeIndex];
  const isFirst = safeIndex === 0;
  const isLast = safeIndex >= steps.length - 1;
  const points = Array.isArray(step?.points) && step.points.length ? step.points : (step?.tips || []);

  if (!open || !step) return null;

  return (
    <Modal visible={open} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'center', padding: 16 }}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            maxHeight: '88%',
            alignSelf: 'center',
            backgroundColor: '#0B1220',
            borderRadius: 2,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.12)',
            overflow: 'hidden',
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 22, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
              {steps.map((item, i) => (
                <TouchableOpacity
                  key={item.title}
                  onPress={() => setIndex(i)}
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 99,
                    backgroundColor: i === safeIndex ? ONB.cyan : 'rgba(255,255,255,0.16)',
                  }}
                  accessibilityLabel={item.title}
                />
              ))}
            </View>

            <STText style={{ fontSize: 32, marginBottom: 8 }}>{step.icon}</STText>
            <STText style={[s.title, { fontSize: 24, lineHeight: 30 }]}>{step.title}</STText>
            {step.where ? (
              <STText style={{ color: ONB.cyan, fontSize: 13, fontWeight: '700', marginBottom: 10 }}>
                Find it in {step.where}
              </STText>
            ) : null}
            <STText style={[s.subtitle, { marginBottom: 10 }]}>{step.description}</STText>
            {step.detail ? (
              <STText style={{ color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
                {step.detail}
              </STText>
            ) : null}

            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.10)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                padding: 14,
                gap: 10,
                marginBottom: 8,
              }}
            >
              <STText style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>Your path</STText>
              {points.map((point, i) => (
                <View key={point} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: 'rgba(0,240,255,0.16)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <STText style={{ color: ONB.cyan, fontSize: 11, fontWeight: '900' }}>{i + 1}</STText>
                  </View>
                  <STText style={{ flex: 1, color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 }}>
                    {point}
                  </STText>
                </View>
              ))}
            </View>

            <STText style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 8 }}>
              {safeIndex + 1} / {steps.length} · Reopen from Settings anytime
            </STText>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingTop: 8 }}>
            <TouchableOpacity
              onPress={() => {
                if (isFirst) onClose?.();
                else setIndex((i) => Math.max(0, i - 1));
              }}
              style={[s.primaryBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginTop: 0 }]}
            >
              <STText style={[s.primaryBtnText, { color: '#fff' }]}>{isFirst ? 'Skip' : 'Back'}</STText>
            </TouchableOpacity>
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
