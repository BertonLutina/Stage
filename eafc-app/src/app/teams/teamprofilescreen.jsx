import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../utils/api';
import useAuthStore from '../../store/authStore';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import PlayerCard from '../../components/team/PlayerCard';
import FormationView from '../../components/team/FormationView';
import STText from '../../components/common/STText';

const TABS = ['Feed', 'Squad', 'Trophies', 'Stats'];

export default function TeamProfileScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const teamId = params?.teamId;
  const router = useRouter();
  const [team, setTeam] = useState(null);
  const [formation, setFormation] = useState(null);
  const [activeTab, setActiveTab] = useState('Feed');
  const [allTeams, setAllTeams] = useState([]);
  const [requestStatus, setRequestStatus] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  useEffect(() => {
    api.get(`/teams/${teamId}`).then(r => setTeam(r.data.data));
    api.get(`/teams/${teamId}/formation`).then(r => setFormation(r.data.data));
  }, [teamId]);

  useEffect(() => {
    api.get('/teams/with-members')
      .then(r => setAllTeams(r.data.data || []))
      .catch(() => setAllTeams([]));
  }, []);

  useEffect(() => {
    if (!teamId) return;
    api.get(`/teams/${teamId}/join-request-status`).then(r => setRequestStatus(r.data?.data?.status ?? null)).catch(() => setRequestStatus(null));
  }, [teamId]);

  const isMember = !!(team?.players ?? []).some((p) => p.user_id === user?.id);
  const handleJoinRequest = async () => {
    if (!teamId || joinLoading) return;
    setJoinLoading(true);
    try {
      await api.post(`/teams/${teamId}/join-request`);
      setRequestStatus('pending');
      alert('Request sent! The club owner will review your request.');
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to send request';
      if (e.response?.status === 409) setRequestStatus('pending');
      alert(msg);
    } finally {
      setJoinLoading(false);
    }
  };

  if (!team) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <STText className="text-muted">Loading...</STText>
      </View>
    );
  }

  const totalMatches = (team.wins || 0) + (team.draws || 0) + (team.losses || 0);

  const renderTabContent = () => {
    if (activeTab === 'Feed') {
      return (
        <View className="mt-4">
          <STText className="text-muted text-sm text-center">
            No club posts yet. Share your first update from the social tab.
          </STText>
        </View>
      );
    }

    if (activeTab === 'Squad') {
      return (
        <View className="mt-4">
          <STText className="text-white font-bold text-base mb-3">
            Squad ({team.players?.length || 0})
          </STText>
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
          <STText className="text-muted text-sm">
            No trophies recorded yet. Win tournaments to build your legacy.
          </STText>
        </View>
      );
    }

    // Stats tab
    return (
      <View className="mt-4 space-y-3">
        <Card className="mb-2">
          <STText className="text-muted text-xs font-semibold mb-3 tracking-wider">
            OVERALL RECORD
          </STText>
          <View className="flex-row justify-between">
            <View className="items-center flex-1">
              <STText className="text-secondary text-2xl font-black">
                {team.wins || 0}
              </STText>
              <STText className="text-muted text-xs mt-1">Wins</STText>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <STText className="text-muted text-2xl font-black">
                {team.draws || 0}
              </STText>
              <STText className="text-muted text-xs mt-1">Draws</STText>
            </View>
            <View className="w-px bg-border" />
            <View className="items-center flex-1">
              <STText className="text-danger text-2xl font-black">
                {team.losses || 0}
              </STText>
              <STText className="text-muted text-xs mt-1">Losses</STText>
            </View>
          </View>
          <View className="mt-4 border-t border-border pt-3 flex-row justify-between">
            <View>
              <STText className="text-muted text-xs">Matches Played</STText>
              <STText className="text-white font-bold text-base">
                {totalMatches}
              </STText>
            </View>
            <View>
              <STText className="text-muted text-xs">Followers</STText>
              <STText className="text-primary font-bold text-base">
                {team.followers_count || 0}
              </STText>
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
            <STText className="text-white text-2xl font-black mt-3">
              {team.club_name}
            </STText>
            <STText className="text-primary font-semibold text-sm mt-1">
              @{team.handle || team.club_name?.toLowerCase().replace(/\s+/g, '')}
            </STText>
            <STText className="text-lightMuted text-xs mt-1">
              {team.country} • Est. {team.creation_date?.slice(0, 4)}
            </STText>

            {/* Primary actions */}
            <View className="flex-row gap-3 mt-5 w-full">
              {!isMember ? (
                requestStatus === 'pending' ? (
                  <Button title="Request Pending" disabled className="flex-1 bg-muted/30 rounded-2xl" />
                ) : (
                  <Button
                    title="Join Club"
                    onPress={handleJoinRequest}
                    loading={joinLoading}
                    className="flex-1 bg-light text-dark rounded-2xl"
                  />
                )
              ) : null}
              <Button
                title="Team Chat"
                variant="ghost"
                onPress={() =>
                  router.push({
                    pathname: '/teams/teamchatscreen',
                    params: { teamId, teamName: team.club_name },
                  })
                }
                className="flex-1 rounded-2xl border border-lineInner/40 bg-darkCard/80"
              />
            </View>

            {/* Key stats row */}
            <View className="flex-row mt-5 gap-6">
              <View className="items-center">
                <STText className="text-white font-bold text-lg">
                  {team.followers_count || 0}
                </STText>
                <STText className="text-muted text-xs">Members</STText>
              </View>
              <View className="items-center">
                <STText className="text-white font-bold text-lg">
                  {totalMatches}
                </STText>
                <STText className="text-muted text-xs">Matches Played</STText>
              </View>
              <View className="items-center">
                <STText className="text-white font-bold text-lg">
                  {team.trophies_count || 0}
                </STText>
                <STText className="text-muted text-xs">Trophies</STText>
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
                    <STText
                      className={`text-xs font-semibold ${
                        active ? 'text-dark' : 'text-lightMuted'
                      }`}
                    >
                      {tab}
                    </STText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Main content area inside card */}
            <View className="bg-darkCard border border-darkBorder rounded-3xl px-4 py-4 mb-8">
              {renderTabContent()}
              {activeTab === 'Feed' && formation && (
                <View className="mt-6">
                  <STText className="text-white font-bold text-base mb-3">
                    Latest Lineup
                  </STText>
                  <FormationView
                    formation={formation}
                    players={formation.positions || []}
                  />
                </View>
              )}
            </View>

            {allTeams.length > 0 && (
              <View className="mb-8">
                <STText className="text-white font-bold text-base mb-3">
                  All Teams &amp; Members
                </STText>
                {allTeams.map(t => (
                  <View
                    key={t.id}
                    className="bg-card border border-border rounded-2xl px-4 py-3 mb-3"
                  >
                    <View className="flex-row items-center mb-2">
                      <Avatar uri={t.avatar} name={t.club_name} size={32} />
                      <View className="ml-3 flex-1">
                        <STText className="text-white font-semibold">
                          {t.club_name}
                        </STText>
                        <STText className="text-muted text-xs">
                          {t.country} • {t.players?.length || 0} members
                        </STText>
                      </View>
                      <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: '/teams/teamchatscreen',
                              params: { teamId: t.id, teamName: t.club_name },
                            })
                          }
                          className="p-2"
                        >
                          <Ionicons name="chatbubbles" size={20} color="#5FE3E8" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            router.push({
                              pathname: '/teams/teamprofilescreen',
                              params: { teamId: t.id },
                            })
                          }
                        >
                          <STText className="text-primary text-sm font-semibold">
                            View
                          </STText>
                        </TouchableOpacity>
                      </View>
                    </View>
                    {t.players?.length > 0 && (
                      <View className="mt-1">
                        {t.players.slice(0, 3).map(p => (
                          <View
                            key={p.id}
                            className="flex-row items-center mb-1"
                          >
                            <Avatar
                              uri={p.avatar}
                              name={`${p.first_name} ${p.last_name}`}
                              size={24}
                            />
                            <View className="ml-2">
                              <STText className="text-white text-xs">
                                {p.gamer_tag || `${p.first_name} ${p.last_name}`}
                              </STText>
                              <STText className="text-muted text-[10px]">
                                {p.role}
                              </STText>
                            </View>
                          </View>
                        ))}
                        {t.players.length > 3 && (
                          <STText className="text-muted text-[10px] mt-1">
                            +{t.players.length - 3} more members
                          </STText>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

