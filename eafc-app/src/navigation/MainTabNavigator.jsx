import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text } from 'react-native';
import useThemeStore from '../store/themeStore';

import FeedScreen from '../screens/social/FeedScreen';
import FixturesScreen from '../screens/tournaments/FixturesScreen';
import ReelsScreen from '../screens/social/ReelsScreen';
import TournamentListScreen from '../screens/tournaments/TournamentListScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import AvailabilityScreen from '../screens/profile/AvailabilityScreen';
import TeamProfileScreen from '../screens/teams/TeamProfileScreen';
import FormationScreen from '../screens/teams/FormationScreen';
import DressingRoomScreen from '../screens/teams/DressingRoomScreen';
import CreateTeamScreen from '../screens/teams/CreateTeamScreen';
import ManageTeamScreen from '../screens/teams/ManageTeamScreen';
import TournamentDetailScreen from '../screens/tournaments/TournamentDetailScreen';
import CreateTournamentScreen from '../screens/tournaments/CreateTournamentScreen';
import BracketScreen from '../screens/tournaments/BracketScreen';
import GroupStageScreen from '../screens/tournaments/GroupStageScreen';
import LeagueStandingsScreen from '../screens/tournaments/LeagueStandingsScreen';
import MatchDetailScreen from '../screens/matches/MatchDetailScreen';
import UploadVideoScreen from '../screens/matches/UploadVideoScreen';
import MessagesScreen from '../screens/social/MessagesScreen';
import ChatScreen from '../screens/social/ChatScreen';
import PostDetailScreen from '../screens/social/PostDetailScreen';
import PlayerDashboardScreen from '../screens/dashboard/PlayerDashboardScreen';
import TeamDashboardScreen from '../screens/dashboard/TeamDashboardScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const DARK = {
  primary: '#5FE3E8',
  bg: '#07163A',
  surface: '#0A1F4A',
  card: '#1A3566',
  border: '#1A3566',
  text: '#FFFFFF',
  muted: '#6B7280',
};

const LIGHT = {
  primary: '#0891B2',
  bg: '#F9FAFB',
  surface: '#FFFFFF',
  card: '#F3F4F6',
  border: '#E5E7EB',
  text: '#111827',
  muted: '#6B7280',
};

function TabIcon({ label, focused }) {
  const { theme } = useThemeStore();
  const C = theme === 'dark' ? DARK : LIGHT;
  const icons = { Feed: '🏠', Fixtures: '📅', Reels: '🎬', Tournaments: '🏆', Profile: '👤' };
  return (
    <View style={{ alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>{icons[label]}</Text>
      <Text style={{ color: focused ? C.primary : C.muted, fontSize: 10 }}>{label}</Text>
    </View>
  );
}

function MainStack() {
  const { theme } = useThemeStore();
  const C = theme === 'dark' ? DARK : LIGHT;

  const screenOptions = {
    headerStyle: { backgroundColor: C.surface },
    headerTintColor: C.text,
    headerTitleStyle: { fontWeight: 'bold' },
  };

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Feed" component={FeedScreen} options={{ title: 'Stage' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="Availability" component={AvailabilityScreen} />
      <Stack.Screen name="TeamProfile" component={TeamProfileScreen} options={{ title: 'Team' }} />
      <Stack.Screen name="Formation" component={FormationScreen} />
      <Stack.Screen name="DressingRoom" component={DressingRoomScreen} options={{ title: 'Dressing Room' }} />
      <Stack.Screen name="CreateTeam" component={CreateTeamScreen} options={{ title: 'Create Team' }} />
      <Stack.Screen name="ManageTeam" component={ManageTeamScreen} options={{ title: 'Manage Team' }} />
      <Stack.Screen name="TournamentDetail" component={TournamentDetailScreen} options={{ title: 'Tournament' }} />
      <Stack.Screen name="CreateTournament" component={CreateTournamentScreen} options={{ title: 'New Tournament' }} />
      <Stack.Screen name="Bracket" component={BracketScreen} options={{ title: 'Bracket' }} />
      <Stack.Screen name="GroupStage" component={GroupStageScreen} options={{ title: 'Group Stage' }} />
      <Stack.Screen name="LeagueStandings" component={LeagueStandingsScreen} options={{ title: 'Standings' }} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} options={{ title: 'Match' }} />
      <Stack.Screen name="UploadVideo" component={UploadVideoScreen} options={{ title: 'Add Video' }} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: 'Post' }} />
      <Stack.Screen name="PlayerDashboard" component={PlayerDashboardScreen} options={{ title: 'Dashboard' }} />
      <Stack.Screen name="TeamDashboard" component={TeamDashboardScreen} options={{ title: 'Team Dashboard' }} />
    </Stack.Navigator>
  );
}

export default function MainTabNavigator() {
  const { theme } = useThemeStore();
  const C = theme === 'dark' ? DARK : LIGHT;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          height: 60,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen name="FeedTab" component={MainStack} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Feed" focused={focused} /> }} />
      <Tab.Screen name="FixturesTab" component={FixturesScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Fixtures" focused={focused} /> }} />
      <Tab.Screen name="ReelsTab" component={ReelsScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Reels" focused={focused} /> }} />
      <Tab.Screen name="TournamentsTab" component={TournamentListScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Tournaments" focused={focused} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarIcon: ({ focused }) => <TabIcon label="Profile" focused={focused} /> }} />
    </Tab.Navigator>
  );
}

