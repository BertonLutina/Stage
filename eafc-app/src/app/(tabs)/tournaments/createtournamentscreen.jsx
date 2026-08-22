import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '../../../components/common/Input';
import Button from '../../../components/common/Button';
import useTournamentStore from '../../../store/tournamentStore';
import { useRouter } from 'expo-router';
import GradientBackground from '../../../components/common/GradientBackground';
import BackButton from '../../../components/common/BackButton';
import api from '../../../utils/api';

const FORMATS = [
  { key: 'group_knockout',  label: 'Group + Knockout',    desc: '32 teams · Group stage → Knockout', icon: '🏆' },
  { key: 'single_elim',     label: 'Single Elimination',  desc: 'Max 64 teams · One loss = out',     icon: '⚡' },
  { key: 'double_elim',     label: 'Double Elimination',  desc: 'Max 8 teams · Need 2 losses',       icon: '🔄' },
  { key: 'league_playoffs', label: 'League + Playoffs',   desc: '36 teams · Swiss-style',            icon: '📊' },
  { key: 'classic_league',  label: 'Classic League',      desc: '20 teams · Round-robin',            icon: '⚽' },
];

const MAX_TEAMS = {
  group_knockout: 32, single_elim: 64, double_elim: 8,
  league_playoffs: 36, classic_league: 20,
};

export default function CreateTournamentScreen() {
  const router = useRouter();
  const { create } = useTournamentStore();

  const [name, setName] = useState('');
  const [format, setFormat] = useState('single_elim');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState('open');
  const [loading, setLoading] = useState(false);

  const [teamSearch, setTeamSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState([]);

  const searchTeams = async (q) => {
    setTeamSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await api.get(`/teams?search=${encodeURIComponent(q)}`);
      setSearchResults(r.data.data?.items ?? r.data.data ?? []);
    } catch { setSearchResults([]); }
    finally { setSearching(false); }
  };

  const toggleTeam = (team) => {
    setSelectedTeams(prev =>
      prev.find(t => t.id === team.id)
        ? prev.filter(t => t.id !== team.id)
        : prev.length < MAX_TEAMS[format]
          ? [...prev, team]
          : prev
    );
  };

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      const t = await create({
        name: name.trim(),
        format,
        max_teams: MAX_TEAMS[format],
        description: description.trim() || undefined,
        visibility,
      });

      if (visibility === 'closed' && selectedTeams.length > 0) {
        await api.post(`/tournaments/${t.id}/invite`, {
          team_ids: selectedTeams.map(t => t.id),
        });
      }

      router.replace({
        pathname: '/(tabs)/tournaments/tournamentdetailscreen',
        params: { tournamentId: t.id },
      });
    } finally { setLoading(false); }
  };

  return (
    <View className="flex-1">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <GradientBackground>
          <SafeAreaView className="flex-1">
            <ScrollView className="px-6" keyboardShouldPersistTaps="handled">
              <View className="flex-row items-center gap-4 mt-2 mb-4">
                <BackButton variant="light" />
                <Text className="text-white text-2xl font-bold flex-1">New Tournament</Text>
              </View>

              <Input label="Tournament Name *" value={name} onChangeText={setName} placeholder="My Tournament" />
              <Input label="Description" value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholder="Optional description..." />

              {/* ── Visibility Toggle ── */}
              <Text className="text-white font-bold text-base mb-3 mt-2">Access</Text>
              <View className="flex-row gap-3 mb-5">
                {[
                  { key: 'open',   label: 'Open',   icon: 'globe-outline',  desc: 'Anyone can join' },
                  { key: 'closed', label: 'Closed', icon: 'lock-closed-outline', desc: 'You select the teams' },
                ].map(v => (
                  <TouchableOpacity
                    key={v.key}
                    onPress={() => setVisibility(v.key)}
                    className={`flex-1 border p-4 items-center gap-1 ${visibility === v.key ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}
                    style={{ borderRadius: 2 }}
                  >
                    <Ionicons name={v.icon} size={24} color={visibility === v.key ? '#5FE3E8' : 'rgba(255,255,255,0.4)'} />
                    <Text className={`font-bold text-sm ${visibility === v.key ? 'text-white' : 'text-white/50'}`}>{v.label}</Text>
                    <Text className={`text-xs text-center ${visibility === v.key ? 'text-white/70' : 'text-white/30'}`}>{v.desc}</Text>
                    {visibility === v.key && (
                      <View className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary items-center justify-center">
                        <Text className="text-dark text-[10px] font-bold">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* ── Format ── */}
              <Text className="text-white font-bold text-base mb-3">Format</Text>
              {FORMATS.map(f => (
                <TouchableOpacity key={f.key} onPress={() => setFormat(f.key)}
                  className={`flex-row items-center p-4 border mb-3 ${format === f.key ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/10'}`}
                  style={{ borderRadius: 2 }}
                >
                  <Text className="text-2xl mr-3">{f.icon}</Text>
                  <View className="flex-1">
                    <Text className="text-white font-bold">{f.label}</Text>
                    <Text className="text-white/50 text-xs mt-0.5">{f.desc}</Text>
                  </View>
                  {format === f.key && (
                    <View className="w-5 h-5 rounded-full bg-primary items-center justify-center">
                      <Text className="text-dark text-xs font-bold">✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}

              {/* ── Team picker (closed only) ── */}
              {visibility === 'closed' && (
                <View className="mt-2 mb-4">
                  <Text className="text-white font-bold text-base mb-1">
                    Select Teams
                    <Text className="text-white/40 font-normal text-sm"> ({selectedTeams.length}/{MAX_TEAMS[format]})</Text>
                  </Text>
                  <Text className="text-white/40 text-xs mb-3">Search and add the teams you want to invite.</Text>

                  <Input
                    label=""
                    value={teamSearch}
                    onChangeText={searchTeams}
                    placeholder="Search team name..."
                  />

                  {searching && <ActivityIndicator color="#5FE3E8" className="my-2" />}

                  {searchResults.length > 0 && (
                    <View className="bg-white/5 border border-white/10 overflow-hidden mb-3" style={{ borderRadius: 2 }}>
                      {searchResults.map((team, i) => {
                        const picked = !!selectedTeams.find(t => t.id === team.id);
                        return (
                          <TouchableOpacity
                            key={team.id}
                            onPress={() => toggleTeam(team)}
                            className={`flex-row items-center px-4 py-3 ${i > 0 ? 'border-t border-white/10' : ''}`}
                          >
                            <View className="w-9 h-9 rounded-full bg-white/10 items-center justify-center mr-3">
                              <Ionicons name="shield" size={18} color="#5FE3E8" />
                            </View>
                            <Text className="text-white font-semibold flex-1">{team.club_name}</Text>
                            <View className={`w-5 h-5 rounded-full border items-center justify-center ${picked ? 'bg-primary border-primary' : 'border-white/30'}`}>
                              {picked && <Text className="text-dark text-[10px] font-bold">✓</Text>}
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {selectedTeams.length > 0 && (
                    <View className="gap-2">
                      {selectedTeams.map(team => (
                        <View key={team.id} className="flex-row items-center bg-primary/10 border border-primary/30 rounded-xl px-4 py-2.5">
                          <Ionicons name="shield" size={16} color="#5FE3E8" />
                          <Text className="text-white font-semibold flex-1 ml-2">{team.club_name}</Text>
                          <TouchableOpacity onPress={() => toggleTeam(team)}>
                            <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <Button title="Create Tournament" onPress={submit} loading={loading} className="mt-2 mb-10" />
            </ScrollView>
          </SafeAreaView>
        </GradientBackground>
      </KeyboardAvoidingView>
    </View>
  );
}
