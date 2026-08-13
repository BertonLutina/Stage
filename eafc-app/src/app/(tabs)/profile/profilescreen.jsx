import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Alert, Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import api from '@/utils/api';
import useAuthStore from '@/store/authStore';
import { leaveStageClub } from '@/lib/leaveClub';
import {
  GamerProfileShell,
  GamerBanner,
  FutIdentityCard,
  GamerMetaPill,
  GamerRecordStrip,
  GamerTabNav,
  GamerSectionCard,
  GamerStatTile,
  GlassIconButton,
  GlassTextButton,
  EmptyTabPanel,
  CYAN,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import PlayerShowcase from '@/components/profile/PlayerShowcase';

/** One primary rail — extras live under More. */
const PRIMARY_TABS = [
  { id: 'matches', label: 'Matches' },
  { id: 'feed', label: 'Feed' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'stats', label: 'Stats' },
  { id: 'more', label: 'More' },
];

const MORE_TOOLS = [
  { id: 'career', label: 'Career', icon: 'trail-sign-outline', hint: 'EA FC link and FUT log' },
  { id: 'trophies', label: 'Trophies', icon: 'trophy-outline', hint: 'Cabinet and achievements' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'cafe-outline', hint: 'Off-pitch profile' },
  { id: 'availability', label: 'Availability', icon: 'calendar-outline', hint: 'When you can play', ownOnly: true },
];

function formatPositions(player) {
  return [player?.position, player?.secondary_position].filter(Boolean).join(' / ');
}

function MatchRow({ match, playerId }) {
  const isHome = match.home_player_id === playerId;
  const opponent = isHome ? match.away_player_name : match.home_player_name;
  const myScore = isHome ? match.home_score : match.away_score;
  const theirScore = isHome ? match.away_score : match.home_score;
  const outcome = myScore > theirScore ? 'W' : myScore < theirScore ? 'L' : 'D';
  const chip = outcome === 'W'
    ? { bg: 'rgba(16,185,129,0.15)', color: '#34D399' }
    : outcome === 'L'
      ? { bg: 'rgba(244,63,94,0.15)', color: '#FB7185' }
      : { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)' };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        backgroundColor: 'rgba(255,255,255,0.03)',
        paddingHorizontal: 12,
        paddingVertical: 12,
      }}
    >
      <View style={{ backgroundColor: chip.bg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, minWidth: 32, alignItems: 'center' }}>
        <Text style={{ color: chip.color, fontWeight: '900', fontSize: 11 }}>{outcome}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }} numberOfLines={1}>
          vs {opponent || 'Unknown'}
        </Text>
      </View>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>
        {myScore ?? 0}–{theirScore ?? 0}
      </Text>
    </View>
  );
}

/**
 * Player profile — compact hero, cyan accent, flat IA.
 */
export default function ProfileScreen({
  embedded = false,
  hideChrome = false,
  player: playerProp = null,
  signedClub: signedClubProp = null,
  presidentClub = null,
  topLeftExtra = null,
  onOpenClub,
  onClubLeft,
}) {
  const { user: me, logout } = useAuthStore();
  const params = useLocalSearchParams();
  const router = useRouter();
  const viewingOther = Boolean(
    (params?.playerId && String(params.playerId) !== String(playerProp?.id || ''))
    || (params?.userId && params.userId !== me?.id),
  );

  const [player, setPlayer] = useState(playerProp);
  const [signedClub, setSignedClub] = useState(signedClubProp);
  const [loading, setLoading] = useState(!playerProp);
  const [tab, setTab] = useState('matches');
  const [moreTool, setMoreTool] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pvpMatches, setPvpMatches] = useState([]);
  const [leaving, setLeaving] = useState(false);

  const isOwn = !viewingOther;

  useEffect(() => {
    if (playerProp) {
      setPlayer(playerProp);
      setSignedClub(signedClubProp || null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (isOwn) {
          const { player: p, club } = await resolveMyPlayerAndClub();
          if (cancelled) return;
          setPlayer(p);
          if (p?.club_id) {
            const signed = await stageClient.entities.Club.get(p.club_id).catch(() => null);
            if (!cancelled) setSignedClub(signed || (club && String(club.id) === String(p.club_id) ? club : null));
          } else {
            setSignedClub(null);
          }
        } else if (params?.playerId) {
          const p = await stageClient.entities.Player.get(params.playerId).catch(() => null);
          if (cancelled) return;
          setPlayer(p);
          if (p?.club_id) {
            const signed = await stageClient.entities.Club.get(p.club_id).catch(() => null);
            if (!cancelled) setSignedClub(signed);
          } else if (!cancelled) {
            setSignedClub(null);
          }
        } else {
          const { data } = await api.get(`/users/${params.userId}`).catch(() => ({ data: {} }));
          const u = data?.data;
          if (cancelled) return;
          setPlayer(u ? {
            gamertag: u.gamer_tag || u.gamertag,
            avatar_url: u.avatar,
            bio: u.bio,
            wins: u.stats?.wins,
            draws: u.stats?.draws,
            losses: u.stats?.losses,
            position: u.position,
            platform: u.platform,
            overall_rating: u.overall_rating,
          } : null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [playerProp, signedClubProp, isOwn, params?.userId, params?.playerId]);

  useEffect(() => {
    if (!player?.id) return;
    let cancelled = false;
    Promise.all([
      stageClient.entities.Match.filter({ home_player_id: player.id, status: 'completed' }, '-updated_date', 20).catch(() => []),
      stageClient.entities.Match.filter({ away_player_id: player.id, status: 'completed' }, '-updated_date', 20).catch(() => []),
    ]).then(([home, away]) => {
      if (cancelled) return;
      const map = new Map();
      [...(home || []), ...(away || [])].forEach((m) => { if (m?.id) map.set(m.id, m); });
      setPvpMatches([...map.values()]);
    });
    return () => { cancelled = true; };
  }, [player?.id]);

  const pickAndUploadAvatar = async () => {
    if (!isOwn || uploading || !player?.id) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    try {
      await stageClient.entities.Player.update(player.id, { avatar_url: result.assets[0].uri }).catch(() => null);
      setPlayer((p) => (p ? { ...p, avatar_url: result.assets[0].uri } : p));
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not update avatar.');
    } finally {
      setUploading(false);
    }
  };

  const wins = player?.wins_count ?? player?.wins ?? 0;
  const draws = player?.draws_count ?? player?.draws ?? 0;
  const losses = player?.losses_count ?? player?.losses ?? 0;
  const hasRecord = (Number(wins) + Number(draws) + Number(losses)) > 0;

  const openClub = (id) => {
    if (!id) return;
    if (onOpenClub) onOpenClub(id);
    else router.push({ pathname: '/teams/teamprofilescreen', params: { teamId: String(id) } });
  };

  const leaveClub = () => {
    const clubToLeave = signedClub?.id || player?.club_id;
    if (!isOwn || !player?.id || !clubToLeave || leaving) return;
    Alert.alert(
      'Leave Club',
      'Leave this club? Your player and president contracts with this club will end, and you will return to the transfer market as a free agent.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Club',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              const result = await leaveStageClub({
                clubId: clubToLeave,
                playerId: player.id,
                userId: me?.id,
              });
              const released = result?.player && typeof result.player === 'object' ? result.player : {};
              setPlayer((prev) => ({
                ...(prev || {}),
                ...released,
                club_id: null,
                role: 'member',
                club_roles: ['member'],
                status: 'free_agent',
              }));
              setSignedClub(null);
              await onClubLeft?.();
            } catch (err) {
              Alert.alert('Could not leave the club', err?.message || 'Try again.');
            } finally {
              setLeaving(false);
            }
          },
        },
      ],
    );
  };

  const clubId = presidentClub?.id || signedClub?.id;
  const clubName = presidentClub?.name || signedClub?.name;

  const bannerActions = hideChrome ? null : (
    <>
      {isOwn ? (
        <GlassTextButton
          label="Edit"
          icon="settings-outline"
          onPress={() => router.push('/(tabs)/profile/editprofilescreen')}
        />
      ) : null}
      {isOwn ? (
        <GlassIconButton
          icon="log-out-outline"
          onPress={async () => {
            await logout();
            router.replace('/auth/loginscreen');
          }}
        />
      ) : (
        <GlassIconButton icon="arrow-back" onPress={() => router.back()} />
      )}
    </>
  );

  const moreItems = MORE_TOOLS.filter((t) => !t.ownOnly || isOwn);

  const renderMore = () => {
    if (moreTool === 'availability') {
      router.push('/(tabs)/profile/availabilityscreen');
      setMoreTool(null);
      return null;
    }
    if (moreTool) {
      const tool = MORE_TOOLS.find((t) => t.id === moreTool);
      return (
        <View style={{ gap: 12 }}>
          <TouchableOpacity onPress={() => setMoreTool(null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chevron-back" size={16} color={CYAN} />
            <Text style={{ color: CYAN, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>MORE</Text>
          </TouchableOpacity>
          {moreTool === 'career' ? (
            <GamerSectionCard title="Career">
              <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 19 }}>
                Link your EA FC club and FUT match log to fill this tab.
              </Text>
              {isOwn ? (
                <TouchableOpacity onPress={() => router.push('/(tabs)/profile/availabilityscreen')} style={{ marginTop: 12 }}>
                  <Text style={{ color: CYAN, fontWeight: '700', fontSize: 13 }}>Set availability →</Text>
                </TouchableOpacity>
              ) : null}
            </GamerSectionCard>
          ) : (
            <EmptyTabPanel
              icon={tool?.icon || 'albums-outline'}
              title={tool?.label}
              hint={tool?.hint || 'Coming soon.'}
            />
          )}
        </View>
      );
    }

    return (
      <View style={{ gap: 8 }}>
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 1.4, marginBottom: 4 }}>
          MORE
        </Text>
        {moreItems.map((tool) => (
          <TouchableOpacity
            key={tool.id}
            onPress={() => {
              if (tool.id === 'availability') {
                router.push('/(tabs)/profile/availabilityscreen');
                return;
              }
              setMoreTool(tool.id);
            }}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(0,240,255,0.18)',
              backgroundColor: 'rgba(0,240,255,0.05)',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,240,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={tool.icon} size={18} color={CYAN} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{tool.label}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>{tool.hint}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const body = loading ? (
    <View style={{ paddingTop: 80, alignItems: 'center' }}>
      <ActivityIndicator color={CYAN} />
    </View>
  ) : !player ? (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <Ionicons name="person-outline" size={48} color="rgba(255,255,255,0.3)" />
      <Text style={{ color: 'rgba(255,255,255,0.45)', marginTop: 12, textAlign: 'center' }}>
        No player profile yet.
      </Text>
    </View>
  ) : (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: embedded ? 40 : 120 }}>
      <View>
        <GamerBanner
          bannerUrl={player.banner_url}
          wash="player"
          height={132}
          topLeft={topLeftExtra}
          topRight={bannerActions}
        />
        <View style={{ paddingHorizontal: 16, marginTop: -72, zIndex: 10, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <FutIdentityCard
              imageUrl={player.avatar_url}
              accent="cyan"
              overall={player.overall_rating ?? 70}
              position={player.position || '—'}
              shirtNumber={player.shirt_number}
              name={player.gamertag || me?.gamer_tag || 'Player'}
              subtitle={uploading ? 'Uploading…' : (player.platform || null)}
              onPress={isOwn ? pickAndUploadAvatar : undefined}
              width={112}
            />
            <View style={{ flex: 1, paddingBottom: 2, gap: 8 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                <Text
                  numberOfLines={2}
                  style={[
                    headingStyleLg,
                    {
                      color: '#fff',
                      lineHeight: 28,
                      flexShrink: 1,
                    },
                  ]}
                >
                  {player.gamertag || me?.gamer_tag || 'Player'}
                </Text>
                {Number(player.is_verified) === 1 ? (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: 'rgba(0,240,255,0.45)',
                      backgroundColor: 'rgba(0,240,255,0.14)',
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={12} color={CYAN} />
                    <Text style={{ color: CYAN, fontSize: 10, fontWeight: '900' }}>EA</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {player.position ? (
                  <GamerMetaPill icon="locate" iconColor={CYAN}>{formatPositions(player)}</GamerMetaPill>
                ) : null}
                {player.platform ? (
                  <GamerMetaPill icon="game-controller" iconColor={CYAN}>{player.platform}</GamerMetaPill>
                ) : null}
                {player.country ? <GamerMetaPill>{player.country}</GamerMetaPill> : null}
                {signedClub ? (
                  <GamerMetaPill icon="shield" iconColor={CYAN} onPress={() => openClub(signedClub.id)}>
                    {signedClub.name}
                  </GamerMetaPill>
                ) : null}
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {clubId ? (
              <TouchableOpacity
                onPress={() => openClub(clubId)}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.12)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  maxWidth: '42%',
                }}
              >
                <Ionicons name="shield" size={14} color={CYAN} />
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 11, flexShrink: 1 }}>
                  {clubName || 'Club'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {isOwn && signedClub?.id ? (
              <TouchableOpacity
                onPress={leaveClub}
                disabled={leaving}
                activeOpacity={0.85}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: 'rgba(251,113,133,0.35)',
                  backgroundColor: 'rgba(251,113,133,0.08)',
                  paddingHorizontal: 12,
                  paddingVertical: 13,
                }}
              >
                <Text style={{ color: '#FB7185', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>
                  {leaving ? 'LEAVING…' : 'LEAVE'}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => (isOwn ? router.push('/(tabs)/dashboard') : null)}
              activeOpacity={0.88}
              style={{ flex: 1 }}
              disabled={!isOwn}
            >
              <LinearGradient
                colors={['#00F0FF', '#00C2B3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 13, borderRadius: 12, alignItems: 'center', opacity: isOwn ? 1 : 0.5 }}
              >
                <Text style={{ color: '#041018', fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  {isOwn ? 'Dashboard' : 'Follow'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {hasRecord ? (
            <GamerRecordStrip wins={wins} draws={draws} losses={losses} />
          ) : (
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' }}>
              No match record yet
            </Text>
          )}

          {player.bio ? (
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
              {player.bio}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 14 }}>
        <GamerTabNav
          tabs={PRIMARY_TABS}
          active={tab}
          onChange={(id) => { setTab(id); setMoreTool(null); }}
          accent="cyan"
        />

        {tab === 'matches' && (
          pvpMatches.length === 0 ? (
            <EmptyTabPanel icon="flash-outline" title="No matches yet" hint="Completed PvP games will show here." />
          ) : (
            <View style={{ gap: 8 }}>
              {pvpMatches.slice(0, 30).map((m) => (
                <MatchRow key={m.id} match={m} playerId={player.id} />
              ))}
            </View>
          )
        )}

        {tab === 'feed' && (
          <EmptyTabPanel icon="newspaper-outline" title="No posts yet" hint="Share updates from your player feed." />
        )}

        {tab === 'showcase' && (
          <PlayerShowcase player={player} canEdit={isOwn} />
        )}

        {tab === 'stats' && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <GamerStatTile label="Wins" value={wins} accent="green" />
            <GamerStatTile label="Draws" value={draws} />
            <GamerStatTile label="Losses" value={losses} accent="rose" />
            <GamerStatTile label="OVR" value={player.overall_rating ?? 70} accent="amber" />
          </View>
        )}

        {tab === 'more' && renderMore()}
      </View>
    </ScrollView>
  );

  if (embedded) return <View style={{ flex: 1 }}>{body}</View>;

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {body}
    </GamerProfileShell>
  );
}
