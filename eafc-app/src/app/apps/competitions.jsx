import React, { useState } from 'react';
import { RefreshControl, StatusBar, View } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { Screen, IconButton } from '@/components/ui';
import CompetitionsView from '@/components/competitions/CompetitionsView';
import useT from '@/hooks/useT';

/** Pushed Competitions screen (deep links, Home shortcuts). The same content lives in the Tournaments tab. */
export default function CompetitionsScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((st) => st.tokens);
  const [refresh, setRefresh] = useState({ refreshing: false, refetch: null });

  return (
    <Screen
      tabBar={false}
      guideFab
      refreshControl={(
        <RefreshControl
          refreshing={refresh.refreshing}
          onRefresh={() => refresh.refetch && refresh.refetch()}
          tintColor={tokens.cyan}
        />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
        <IconButton icon="chevron-back" accessibilityLabel={t('stage.state.back')} onPress={() => router.back()} />
      </View>
      <CompetitionsView onRefreshState={setRefresh} />
    </Screen>
  );
}
