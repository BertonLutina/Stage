import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import STText from '../../../components/common/STText';
import SearchPlayers from './searchplayer';
import SearchClubs from './searchclubs';

export default function SearchIndex() {
  const [activeTab, setActiveTab] = useState('players');

  const toggleTab = () => {
    setActiveTab((prev) => (prev === 'players' ? 'clubs' : 'players'));
  };

  const toggleLabel = activeTab === 'players' ? 'Search Clubs' : 'Search Players';

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header with toggle */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/10">
          <STText className="text-lg font-bold">Search</STText>
          <TouchableOpacity
            onPress={toggleTab}
            className="rounded-xl border border-[#5FE3E8]/50 bg-white/5 px-4 py-2"
          >
            <STText className="text-sm font-semibold" style={{ color: '#5FE3E8' }}>
              {toggleLabel}
            </STText>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1">
          {activeTab === 'players' ? <SearchPlayers /> : <SearchClubs />}
        </View>
    </SafeAreaView>
  );
}
