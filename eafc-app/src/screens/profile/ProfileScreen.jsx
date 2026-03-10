import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../utils/api';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import useAuthStore from '../../store/authStore';

export default function ProfileScreen({ route, navigation }) {
  const { user: me } = useAuthStore();
  const userId = route?.params?.userId || me?.id;
  const [profile, setProfile] = useState(null);
  const isOwn = userId === me?.id;

  useEffect(() => {
    api.get(`/users/${userId}`).then(r => setProfile(r.data.data));
  }, [userId]);

  if (!profile) return <View className="flex-1 bg-dark items-center justify-center"><Text className="text-muted">Loading...</Text></View>;

  return (
    <SafeAreaView className="flex-1 bg-dark">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="items-center pt-6 px-6">
          <Avatar uri={profile.avatar} name={`${profile.first_name} ${profile.last_name}`} size={88} />
          <Text className="text-white text-2xl font-black mt-3">{profile.first_name} {profile.last_name}</Text>
          <Text className="text-primary font-semibold text-base mt-0.5">@{profile.gamer_tag || 'no tag'}</Text>
          <Text className="text-muted text-sm mt-1">{profile.country}</Text>

          <View className="flex-row mt-4 gap-8">
            <View className="items-center"><Text className="text-white font-bold text-lg">{profile.followers_count || 0}</Text><Text className="text-muted text-xs">Followers</Text></View>
            <View className="items-center"><Text className="text-secondary font-bold text-lg">{profile.stats?.wins || 0}</Text><Text className="text-muted text-xs">Wins</Text></View>
            <View className="items-center"><Text className="text-muted font-bold text-lg">{profile.stats?.draws || 0}</Text><Text className="text-muted text-xs">Draws</Text></View>
            <View className="items-center"><Text className="text-danger font-bold text-lg">{profile.stats?.losses || 0}</Text><Text className="text-muted text-xs">Losses</Text></View>
          </View>

          <View className="flex-row gap-3 mt-4 w-full">
            {isOwn ? (
              <>
                <Button title="Edit Profile" variant="outline" onPress={() => navigation.navigate('EditProfile')} className="flex-1" />
                <Button title="Dashboard" variant="ghost" onPress={() => navigation.navigate('PlayerDashboard')} className="flex-1" />
              </>
            ) : (
              <>
                <Button title="Follow" onPress={() => {}} className="flex-1" />
                <Button title="Message" variant="ghost" onPress={() => navigation.navigate('Chat', { userId })} className="flex-1" />
              </>
            )}
          </View>
        </View>

        {profile.teams?.length > 0 && (
          <View className="px-4 mt-6">
            <Text className="text-white font-bold text-base mb-3">Teams</Text>
            {profile.teams.map(t => (
              <TouchableOpacity key={t.id} onPress={() => navigation.navigate('TeamProfile', { teamId: t.id })}
                className="flex-row items-center bg-card border border-border rounded-xl px-4 py-3 mb-2">
                <Avatar uri={t.avatar} name={t.club_name} size={36} />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-semibold">{t.club_name}</Text>
                  <Text className="text-muted text-xs capitalize">{t.role}</Text>
                </View>
                <Text className="text-muted text-xl">›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {isOwn && (
          <View className="px-4 mt-4 mb-8">
            <Button title="+ Create Team" variant="ghost" onPress={() => navigation.navigate('CreateTeam')} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
