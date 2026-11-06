import React from 'react';
import { IconButton } from '@/components/ui';

/** Ellipsis button that opens the tile background dialog. Renders nothing without a handler. */
export default function GameDayTileMenuButton({ onPress, accessibilityLabel = 'Change background' }) {
  if (!onPress) return null;
  return (
    <IconButton
      icon="ellipsis-horizontal"
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
