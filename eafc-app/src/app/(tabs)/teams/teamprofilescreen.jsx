import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../../utils/api';
import Avatar from '../../../components/common/Avatar';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import PlayerCard from '../../../components/team/PlayerCard';
import FormationView from '../../../components/team/FormationView';

const TABS = ['Feed', 'Squad', 'Trophies', 'Stats'];

export default function TeamProfileScreen() {
  const { teamId } = useLocalSearchParams();
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [formation, setFormation] = useState(null);
  const [activeTab, setActiveTab] = useState('Feed');

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(r => setTeam(r.data.data));
    api.get(`/teams/${teamId}/formation`).then(r => setFormation(r.data.data));
  }, [teamId]);

  if (!team) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <Text className="text-muted">Loading...</Text>
      </View>
    );
  }

  const totalMatches = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);

  const renderTabContent = () => {
    if (activeTab === 'Feed') {
      return (
        <View className="mt-4">
          <Text className="text-muted text-sm text-center">
            No club posts yet. Share your first update from the social tab.
          </Text>
        </View>
      );
    }

    if (activeTab === 'Squad') {
      return (
        <View className="mt-4">
          <Text className="text-white font-bold text-base mb-3">
            Squad ({team.players?.length || 0})
          </Text>
          {(team.players || []).map(p => (
            <PlayerCard
              key={p.user_id}
              player={p}
              compact
              onPress={() => navigation.navigate('Profile', { userId: p.user_id })}
            />
          ))}
        </View>
      );
    }

    if (activeTab === 'Trophies') {
      return (
        <View className="mt-4 items-center">
          <Text className="text-muted text-sm">
            No trophies recorded yet. Win tournaments to build your legacy.
          </Text>
        </View>
      );
    }

    // Stats tab
    return (
      <View className="mt-4 space-y-3">
        <Card className="mb-2">
          <Text className="text-muted text-xs font-semibold mb-3 tracking-wider">
            OVERALL RECORD
          </Text>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <Text className="text-secondary text-2xl font-black">
                {team.wins || 0}
              </Text>
              <Text className="text-muted text-xs mt-1">Wins</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-muted text-2xl font-black">
                {team.draws || 0}
              </Text>
              <Text className="text-muted text-xs mt-1">Draws</Text>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <Text className="text-danger text-2xl font-black">
                {team.losses || 0}
              </Text>
              <Text className="text-muted text-xs mt-1">Losses</Text>
            </View>
          </View>
          <View className="mt-4 border-t border-border pt-3 flex-row justify-between">
            <View>
              <Text className="text-muted text-xs">Matches Played</Text>
              <Text className="text-white font-bold text-base">
                {totalMatches}
              </Text>
            </View>
            <View>
              <Text className="text-muted text-xs">Followers</Text>
              <Text className="text-primary font-bold text-base">
                {team.followers_count || 0}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#07163A', '#0A1F4A', '#1A3566']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView className="flex-1">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header / Hero */}
          <View className="items-center pt-6 pb-4 px-6">
            <Avatar uri={team.avatar} name={team.club_name} size={80} />
            <Text className="text-white text-2xl font-black mt-3">
              {team.club_name}
            </Text>
            <Text className="text-primary font-semibold text-sm mt-1">
              @{team.handle || team.club_name?.toLowerCase().replace(/\s+/g, '')}
            </Text>
            <Text className="text-lightMuted text-xs mt-1">
              {team.country} • Est. {team.creation_date?.slice(0, 4)}
            </Text>

            {/* Primary actions */}
            <View className="flex-row gap-3 mt-5 w-full">
              <Button
                title="Join Club"
                onPress={() => {}}
                className="flex-1 bg-light text-dark rounded-2xl"
              />
              <Button
                title="Message"
                variant="ghost"
                onPress={() => {}}
                className="flex-1 rounded-2xl border border-lineInner/40 bg-darkCard/80"
              />
            </View>

            {/* Key stats row */}
            <View className="flex-row mt-5 gap-6">
              <View className="items-center">
                <Text className="text-white font-bold text-lg">
                  {team.followers_count || 0}
                </Text>
                <Text className="text-muted text-xs">Members</Text>
              </View>
              <View className="items-center">
                <Text className="text-white font-bold text-lg">
                  {totalMatches}
                </Text>
                <Text className="text-muted text-xs">Matches Played</Text>
              </View>
              <View className="items-center">
                <Text className="text-white font-bold text-lg">
                  {team.trophies_count || 0}
                </Text>
                <Text className="text-muted text-xs">Trophies</Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <View className="px-4">
            <View className="flex-row bg-darkCard/80 border border-darkBorder rounded-full p-1 mb-3">
              {TABS.map(tab => {
                const active = tab === activeTab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className={`flex-1 items-center justify-center px-2 py-1.5 rounded-full ${
                      active ? 'bg-light' : 'bg-transparent'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        active ? 'text-dark' : 'text-lightMuted'
                      }`}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Main content area inside card */}
            <View className="bg-darkCard border border-darkBorder rounded-3xl px-4 py-4 mb-8">
              {renderTabContent()}
              {activeTab === 'Feed' && formation && (
                <View className="mt-6">
                  <Text className="text-white font-bold text-base mb-3">
                    Latest Lineup
                  </Text>
                  <FormationView
                    formation={formation}
                    players={formation.positions || []}
                  />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

