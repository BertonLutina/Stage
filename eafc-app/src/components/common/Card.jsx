import React from 'react';
import { layoutClassName } from '@/lib/layoutClassName';
import { View } from 'react-native';
import UiCard from '@/components/ui/Card';

/** Prop-compatible wrapper around ui/Card; `className` positions the card from outside. */
export default function Card({ children, className = '' }) {
  const card = <UiCard>{children}</UiCard>;
  const layout = layoutClassName(className);
  if (!layout) return card;
  return <View className={layout}>{card}</View>;
}
