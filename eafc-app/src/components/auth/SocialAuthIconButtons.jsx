import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import STText from '../common/STText';
import { openSocialAuth } from '../../hooks/useSocialAuth';

const ALL_PROVIDERS = [
  { key: 'google', icon: 'logo-google', color: '#EA4335', label: 'Google' },
  { key: 'apple', icon: 'logo-apple', color: '#FFFFFF', label: 'Apple' },
  { key: 'twitch', icon: 'logo-twitch', color: '#9146FF', label: 'Twitch' },
  { key: 'discord', icon: 'logo-discord', color: '#5865F2', label: 'Discord' },
  { key: 'kick', icon: 'game-controller', color: '#53FC18', label: 'Kick' },
];

const getProviders = () =>
  Platform.OS === 'ios'
    ? ALL_PROVIDERS
    : ALL_PROVIDERS.filter((p) => p.key !== 'apple');

export default function SocialAuthIconButtons({ providers, mode = 'signin' }) {
  const list = providers ?? getProviders();
  const action = mode === 'signup' ? 'Sign up' : 'Sign in';

  return (
    <View className="flex-row flex-wrap justify-center items-center gap-4">
      {list.map((p) => (
        <TouchableOpacity
          key={p.key}
          onPress={() => openSocialAuth(p.key)}
          className="items-center"
          activeOpacity={0.7}
          accessibilityLabel={`${action} with ${p.label}`}
        >
          <View className="w-12 h-12 rounded-full bg-white/10 border border-white/20 items-center justify-center">
            <Ionicons name={p.icon} size={24} color={p.color} />
          </View>
          <STText className="text-white/60 text-xs mt-1">{p.label}</STText>
        </TouchableOpacity>
      ))}
    </View>
  );
}
