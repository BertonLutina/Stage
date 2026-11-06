import React from 'react';
import { layoutClassName } from '@/lib/layoutClassName';
import { View } from 'react-native';
import UiAvatar from '@/components/ui/Avatar';

/** Prop-compatible wrapper around ui/Avatar: derives up to two initials from `name`. */
export default function Avatar({ uri, name = '', size = 48, className = '' }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const avatar = <UiAvatar uri={uri} initials={initials || '?'} size={size} />;
  const layout = layoutClassName(className);
  if (!layout) return avatar;
  return <View className={layout}>{avatar}</View>;
}
