import React from 'react';
import { View } from 'react-native';
import DirectoryCarousel from '@/components/directory/DirectoryCarousel';
import { playerDisplayName } from '@/lib/stageDirectories';
import TransferBadge from './TransferBadge';
import TransferPlayerPhotoCard from './TransferPlayerPhotoCard';

/**
 * Transfer market carousel: the directory carousel (same slot animation, arrows and
 * counter) with player photo cards and the transfer status badge on each card.
 */
export default function TransferPlayerCarousel({ entries = [], selectedId, onSelect }) {
  return (
    <DirectoryCarousel
      items={entries}
      selectedId={selectedId}
      getId={(entry) => entry.player?.id}
      getName={(entry) => playerDisplayName(entry.player)}
      emptyIcon="shield-outline"
      emptyText="No players found"
      prevLabel="Previous player"
      nextLabel="Next player"
      onSelect={onSelect}
      renderCard={(entry, focused, width) => (
        <TransferPlayerPhotoCard player={entry.player} focused={focused} width={width}>
          <View style={{ position: 'absolute', left: 8, top: 8, zIndex: 3 }}>
            <TransferBadge type={entry.badgeType} daysLeft={entry.days_left} />
          </View>
        </TransferPlayerPhotoCard>
      )}
    />
  );
}
