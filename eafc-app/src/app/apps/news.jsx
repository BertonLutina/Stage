import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import StageTimesNews from '@/components/news/StageTimesNews';

export default function NewsScreen() {
  const params = useLocalSearchParams();
  const section = String(params.section || 'mercato');
  return (
    <StageTimesNews
      initialSection={section}
      initialTransferId={String(params.transfer || '')}
      initialContinent={String(params.continent || '')}
    />
  );
}
