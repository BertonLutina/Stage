import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, ScrollView, Alert, TouchableOpacity, ActivityIndicator, Text, Image, TextInput, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/utils/api';
import { stageClient } from '@/api/stageClient';
import {
  GamerProfileShell,
  GamerTabNav,
  GamerSectionCard,
  EmptyTabPanel,
  GlassIconButton,
  AMBER,
  GAMER_BG,
} from '@/components/profile/gamer/GamerProfileUI';
import ClubFormationCard from '@/components/team/ClubFormationCard';
import {
  FORMATION_OPTIONS,
  autoFillLineup,
  remapLineupToFormation,
  getFormationSlots,
} from '@/lib/clubFormations';
import { headingStyle, headingStyleSm } from '@/lib/fonts';

const TABS = [
  { id: 'requests', label: 'Requests' },
  { id: 'squad', label: 'Squad' },
  { id: 'formation', label: 'Formation' },
];

function displayName(person) {
  return person?.gamertag
    || person?.gamer_tag
    || [person?.first_name, person?.last_name].filter(Boolean).join(' ').trim()
    || 'Player';
}

function roleLabel(role) {
  if (!role) return 'Member';
  if (role === 'owner' || role === 'president') return 'Owner';
  if (role === 'captain') return 'Captain';
  return String(role).replace(/_/g, ' ');
}

function PersonRow({
  name,
  subtitle,
  avatar,
  ovr,
  trailing,
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 64,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          overflow: 'hidden',
          backgroundColor: '#101827',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(255,214,10,0.25)',
        }}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={{ width: 44, height: 44 }} />
        ) : (
          <Ionicons name="person" size={18} color="rgba(255,255,255,0.35)" />
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }} numberOfLines={1}>{name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      {ovr != null && ovr !== '' ? (
        <View style={{ alignItems: 'flex-end', marginRight: 4 }}>
          <Text style={{ color: AMBER, fontWeight: '900', fontSize: 16 }}>{ovr}</Text>
          <Text style={{ color: 'rgba(255,214,10,0.55)', fontSize: 9, fontWeight: '800' }}>OVR</Text>
        </View>
      ) : null}
      {trailing}
    </View>
  );
}

/**
 * Club Office — approve joiners and manage the squad.
 * Premium STAGE gamer shell (gold club accent).
 */
export default function ManageTeamScreen() {
  const { teamId } = useLocalSearchParams();
  const router = useRouter();
  const [club, setClub] = useState(null);
  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState('requests');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [formationName, setFormationName] = useState('4-3-3');
  const [lineup, setLineup] = useState([]);
  const [savingFormation, setSavingFormation] = useState(false);
  const [formationSaved, setFormationSaved] = useState(false);

  const load = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    try {
      const clubRow = await stageClient.entities.Club.get(teamId).catch(() => null);
      setClub(clubRow);
      const nextFormation = clubRow?.formation && FORMATION_OPTIONS.includes(clubRow.formation)
        ? clubRow.formation
        : (clubRow?.formation || '4-3-3');
      setFormationName(FORMATION_OPTIONS.includes(nextFormation) ? nextFormation : '4-3-3');
      setLineup(Array.isArray(clubRow?.lineup) ? clubRow.lineup : []);

      const [legacyPlayers, stagePlayers, legacyRequests] = await Promise.all([
        api.get(`/teams/${teamId}/players`).then((r) => r.data?.data || []).catch(() => []),
        stageClient.entities.Player.filter({ club_id: teamId }, null, 80).catch(() => []),
        api.get(`/teams/${teamId}/join-requests`).then((r) => r.data?.data || []).catch(() => []),
      ]);

      const mappedStage = (Array.isArray(stagePlayers) ? stagePlayers : []).map((p) => ({
        user_id: p.user_id || p.id,
        id: p.id,
        gamertag: p.gamertag,
        gamer_tag: p.gamertag,
        avatar: p.avatar_url,
        avatar_url: p.avatar_url,
        position: p.position,
        role: p.role || p.club_role || 'member',
        overall_rating: p.overall_rating,
      }));

      setPlayers(legacyPlayers?.length ? legacyPlayers : mappedStage);
      setRequests(Array.isArray(legacyRequests) ? legacyRequests : []);
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  const [didSetInitialTab, setDidSetInitialTab] = useState(false);
  useEffect(() => {
    if (loading || didSetInitialTab) return;
    setTab(requests.length > 0 ? 'requests' : 'squad');
    setDidSetInitialTab(true);
  }, [loading, requests.length, didSetInitialTab]);

  const filteredPlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => displayName(p).toLowerCase().includes(q)
      || String(p.position || '').toLowerCase().includes(q)
      || String(p.role || '').toLowerCase().includes(q));
  }, [players, query]);

  const remove = (userId, name) => {
    Alert.alert(
      'Remove from squad',
      `Remove ${name} from this club?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusyId(userId);
            try {
              await api.delete(`/teams/${teamId}/players/${userId}`);
              await load();
            } catch (e) {
              Alert.alert('Could not remove', e.response?.data?.message || e.message || 'Try again.');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const acceptRequest = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.post(`/teams/${teamId}/join-requests/${requestId}/accept`);
      await load();
    } catch (e) {
      Alert.alert('Could not approve', e.response?.data?.message || e.message || 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  const declineRequest = async (requestId) => {
    setBusyId(requestId);
    try {
      await api.post(`/teams/${teamId}/join-requests/${requestId}/decline`);
      await load();
    } catch (e) {
      Alert.alert('Could not decline', e.response?.data?.message || e.message || 'Try again.');
    } finally {
      setBusyId(null);
    }
  };

  const assignSlot = (slot, player) => {
    const slotMeta = getFormationSlots(formationName).find((s) => s.slot === slot);
    setLineup((prev) => {
      const next = (prev || []).filter((l) => l.slot !== slot && (!player || l.player_id !== player.id));
      if (!player) return next;
      return [
        ...next,
        {
          slot,
          player_id: player.id,
          gamertag: player.gamertag || player.gamer_tag,
          position: player.position,
          label: slotMeta?.label,
        },
      ];
    });
    setFormationSaved(false);
  };

  const changeFormation = (name) => {
    setLineup((prev) => remapLineupToFormation(prev, formationName, name));
    setFormationName(name);
    setFormationSaved(false);
  };

  const fillXi = () => {
    setLineup(autoFillLineup(formationName, players));
    setFormationSaved(false);
  };

  const saveFormation = async () => {
    if (!teamId) return;
    setSavingFormation(true);
    try {
      const updated = await stageClient.entities.Club.update(teamId, {
        formation: formationName,
        lineup,
      });
      if (updated) setClub(updated);
      else setClub((c) => (c ? { ...c, formation: formationName, lineup } : c));
      setFormationSaved(true);
      setTimeout(() => setFormationSaved(false), 2000);
    } catch (e) {
      Alert.alert('Could not save formation', e.response?.data?.message || e.message || 'Try again.');
    } finally {
      setSavingFormation(false);
    }
  };

  const tabs = TABS.map((t) => (
    t.id === 'requests' && requests.length > 0
      ? { ...t, badge: String(requests.length) }
      : t
  ));

  const title = club?.name || club?.club_name || 'Club Office';
  const xiCount = lineup?.length || 0;

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <SafeAreaView style={{ flex: 1, backgroundColor: GAMER_BG }} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 16 }}>
            <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
            <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}>
              <Text style={[headingStyleSm, { color: 'rgba(255,214,10,0.7)', fontSize: 10, letterSpacing: 2 }]}>
                CLUB OFFICE
              </Text>
              <Text style={[headingStyle, { color: '#fff' }]} numberOfLines={1}>
                {title}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {/* Crest strip */}
          <LinearGradient
            colors={['rgba(255,214,10,0.14)', 'rgba(255,214,10,0.03)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: 'rgba(255,214,10,0.28)',
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                overflow: 'hidden',
                backgroundColor: '#120E08',
                borderWidth: 1,
                borderColor: 'rgba(255,214,10,0.35)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {club?.logo_url ? (
                <Image source={{ uri: club.logo_url }} style={{ width: 52, height: 52 }} resizeMode="cover" />
              ) : (
                <Ionicons name="shield" size={24} color={AMBER} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }} numberOfLines={1}>
                {title}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 3 }}>
                {[club?.tag ? `[${club.tag}]` : null, club?.platform, `${players.length} in squad`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
          </LinearGradient>

          <GamerTabNav tabs={tabs} active={tab} onChange={setTab} accent="amber" />

          <View style={{ marginTop: 16, gap: 10 }}>
            {loading ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator color={AMBER} />
              </View>
            ) : null}

            {!loading && tab === 'requests' && (
              requests.length === 0 ? (
                <EmptyTabPanel
                  icon="person-add-outline"
                  title="No join requests"
                  hint="When players ask to join, approve or decline them here."
                />
              ) : (
                <>
                  <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                    PENDING · {requests.length}
                  </Text>
                  {requests.map((r) => {
                    const name = displayName(r);
                    const busy = busyId === r.id;
                    return (
                      <PersonRow
                        key={r.id}
                        name={name}
                        subtitle="Wants to join"
                        avatar={r.avatar || r.avatar_url}
                        trailing={(
                          <View style={{ flexDirection: 'row', gap: 6 }}>
                            <TouchableOpacity
                              onPress={() => declineRequest(r.id)}
                              disabled={busy}
                              accessibilityLabel={`Decline ${name}`}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(251,113,133,0.4)',
                                backgroundColor: 'rgba(251,113,133,0.12)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: busy ? 0.5 : 1,
                              }}
                            >
                              <Ionicons name="close" size={20} color="#FB7185" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => acceptRequest(r.id)}
                              disabled={busy}
                              accessibilityLabel={`Approve ${name}`}
                              style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: 'rgba(255,214,10,0.45)',
                                backgroundColor: 'rgba(255,214,10,0.16)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: busy ? 0.5 : 1,
                              }}
                            >
                              {busy ? (
                                <ActivityIndicator size="small" color={AMBER} />
                              ) : (
                                <Ionicons name="checkmark" size={20} color={AMBER} />
                              )}
                            </TouchableOpacity>
                          </View>
                        )}
                      />
                    );
                  })}
                </>
              )
            )}

            {!loading && tab === 'squad' && (
              <>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    paddingHorizontal: 12,
                    minHeight: 48,
                  }}
                >
                  <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Search squad"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={{ flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 }}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {query ? (
                    <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                      <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.4)" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {filteredPlayers.length === 0 ? (
                  <EmptyTabPanel
                    icon="people-outline"
                    title={query ? 'No matches' : 'Squad is empty'}
                    hint={query ? 'Try another gamer tag or position.' : 'Approve join requests to build your roster.'}
                  />
                ) : (
                  <>
                    <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                      ROSTER · {filteredPlayers.length}
                    </Text>
                    {filteredPlayers.map((p) => {
                      const name = displayName(p);
                      const id = p.user_id || p.id;
                      const canRemove = p.role !== 'owner' && p.role !== 'president';
                      const busy = busyId === id;
                      return (
                        <PersonRow
                          key={id}
                          name={name}
                          subtitle={[p.position, roleLabel(p.role)].filter(Boolean).join(' · ')}
                          avatar={p.avatar || p.avatar_url}
                          ovr={p.overall_rating}
                          trailing={canRemove ? (
                            <TouchableOpacity
                              onPress={() => remove(id, name)}
                              disabled={busy}
                              accessibilityLabel={`Remove ${name} from squad`}
                              style={{
                                paddingHorizontal: 12,
                                minHeight: 44,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: 'rgba(251,113,133,0.4)',
                                backgroundColor: 'rgba(251,113,133,0.1)',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: busy ? 0.5 : 1,
                              }}
                            >
                              {busy ? (
                                <ActivityIndicator size="small" color="#FB7185" />
                              ) : (
                                <Text style={{ color: '#FB7185', fontWeight: '800', fontSize: 12 }}>Remove</Text>
                              )}
                            </TouchableOpacity>
                          ) : (
                            <View
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 6,
                                borderRadius: 999,
                                backgroundColor: 'rgba(255,214,10,0.14)',
                                borderWidth: 1,
                                borderColor: 'rgba(255,214,10,0.3)',
                              }}
                            >
                              <Text style={{ color: AMBER, fontSize: 10, fontWeight: '900' }}>OWNER</Text>
                            </View>
                          )}
                        />
                      );
                    })}
                  </>
                )}

                <GamerSectionCard>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19 }}>
                    Tip: captains and owners stay on the squad until you transfer club ownership.
                  </Text>
                </GamerSectionCard>
              </>
            )}

            {!loading && tab === 'formation' && (
              <View style={{ gap: 14 }}>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4 }}>
                  SHAPE · {formationName}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {FORMATION_OPTIONS.map((f) => {
                    const active = formationName === f;
                    return (
                      <TouchableOpacity
                        key={f}
                        onPress={() => changeFormation(f)}
                        activeOpacity={0.85}
                        style={{
                          paddingHorizontal: 14,
                          minHeight: 40,
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? 'rgba(255,214,10,0.55)' : 'rgba(255,255,255,0.12)',
                          backgroundColor: active ? 'rgba(255,214,10,0.16)' : 'rgba(255,255,255,0.03)',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text style={{
                          color: active ? AMBER : 'rgba(255,255,255,0.5)',
                          fontWeight: '800',
                          fontSize: 12,
                          letterSpacing: 0.4,
                        }}
                        >
                          {f}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <ClubFormationCard
                  formationName={formationName}
                  lineup={lineup}
                  players={players}
                  clubName={title}
                  logoUrl={club?.logo_url}
                  editable
                  onAssign={assignSlot}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={fillXi}
                    activeOpacity={0.85}
                    style={{
                      flex: 1,
                      minHeight: 48,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: 'rgba(0,240,255,0.35)',
                      backgroundColor: 'rgba(0,240,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#00F0FF', fontWeight: '800', fontSize: 13 }}>Auto XI</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={saveFormation}
                    disabled={savingFormation}
                    activeOpacity={0.85}
                    style={{
                      flex: 1.4,
                      minHeight: 48,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: 'rgba(255,214,10,0.5)',
                      backgroundColor: 'rgba(255,214,10,0.18)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: savingFormation ? 0.6 : 1,
                    }}
                  >
                    {savingFormation ? (
                      <ActivityIndicator color={AMBER} />
                    ) : (
                      <Text style={{ color: AMBER, fontWeight: '900', fontSize: 13 }}>
                        {formationSaved ? 'Saved' : 'Save Formation'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                <GamerSectionCard>
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19 }}>
                    Tap a slot to assign a squad member. {xiCount}/11 set — Auto XI fills by position when it can.
                  </Text>
                </GamerSectionCard>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </GamerProfileShell>
  );
}
