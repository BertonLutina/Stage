import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import { Button } from '@/components/ui';
import { hexToRgba } from '@/lib/stageTheme';
import { getTutorialSteps } from '../../lib/tutorialSteps';
import { useOnboardingStyles } from './onboardingStyles';

export default function TutorialPopup({ open, onClose, intent = 'player' }) {
  const tokens = useThemeStore((st) => st.tokens);
  const s = useOnboardingStyles();
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
      <View style={{ flex: 1, backgroundColor: hexToRgba(tokens.bgDeep, 0.82), justifyContent: 'center', padding: 16 }}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={{
            width: '100%',
            maxWidth: 440,
            maxHeight: '88%',
            alignSelf: 'center',
            backgroundColor: tokens.live ? tokens.bgDeep : tokens.card,
            borderRadius: tokens.cardRadius,
            borderWidth: 1,
            borderColor: tokens.border,
            overflow: 'hidden',
          }}
        >
          <ScrollView
            contentContainerStyle={{ padding: 20, paddingBottom: 12 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16 }}>
              {steps.map((item, i) => (
                <Pressable
                  key={item.title}
                  onPress={() => setIndex(i)}
                  hitSlop={{ top: 20, bottom: 20 }}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: i === safeIndex ? tokens.cyan : tokens.border,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={item.title}
                />
              ))}
            </View>

            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tokens.border,
                marginBottom: 12,
              }}
            >
              <Ionicons name="compass-outline" size={22} color={tokens.cyanHi} />
            </View>
            <Text accessibilityRole="header" style={[s.title, { fontSize: 28, lineHeight: 32, marginBottom: 8 }]}>
              {step.title}
            </Text>
            {step.where ? (
              <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '600', marginBottom: 10 }}>
                Find it in {step.where}
              </Text>
            ) : null}
            <Text style={[s.subtitle, { marginBottom: 10 }]}>{step.description}</Text>
            {step.detail ? (
              <Text style={{ color: tokens.textSoft, fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
                {step.detail}
              </Text>
            ) : null}

            <View
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                backgroundColor: tokens.bgDeep,
                padding: 14,
                gap: 10,
                marginBottom: 8,
              }}
            >
              <Text
                style={{
                  color: tokens.muted,
                  fontSize: 11,
                  fontWeight: '600',
                  letterSpacing: 11 * 0.12,
                  textTransform: 'uppercase',
                }}
              >
                Your path
              </Text>
              {points.map((point, i) => (
                <View key={point} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: hexToRgba(tokens.cyan, 0.16),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '700' }}>{i + 1}</Text>
                  </View>
                  <Text style={{ flex: 1, color: tokens.textSoft, fontSize: 14, lineHeight: 20 }}>
                    {point}
                  </Text>
                </View>
              ))}
            </View>

            <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 8 }}>
              {safeIndex + 1} / {steps.length} · Reopen from Settings anytime
            </Text>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                title={isFirst ? 'Skip' : 'Back'}
                onPress={() => {
                  if (isFirst) onClose?.();
                  else setIndex((i) => Math.max(0, i - 1));
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title={isLast ? 'Got it' : 'Next'}
                onPress={() => {
                  if (isLast) onClose?.();
                  else setIndex((i) => i + 1);
                }}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
