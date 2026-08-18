import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Alert, Text,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { stageClient, resolveMyPlayerAndClub } from '@/api/stageClient';
import api from '@/utils/api';
import useAuthStore from '@/store/authStore';
import { leaveStageClub } from '@/lib/leaveClub';
import { canShowLoanRequestButton } from '@/lib/contractOfferVisibility';
import RequestLoanDialog from '@/components/transfer/RequestLoanDialog';
import {
  GamerProfileShell,
  GamerBanner,
  FutIdentityCard,
  GamerMetaPill,
  GamerRecordStrip,
  GamerTabNav,
  GlassIconButton,
  GlassTextButton,
  EmptyTabPanel,
  CYAN,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';
import PlayerShowcase from '@/components/profile/PlayerShowcase';
import PlayerCareerSummary from '@/components/profile/PlayerCareerSummary';
import PlayerTransferHistory from '@/components/profile/PlayerTransferHistory';
import FollowToggleButton from '@/components/profile/FollowToggleButton';
import { uploadLocalMedia } from '@/lib/uploadProfileMedia';

/** One primary rail — extras live under More. */
const PRIMARY_TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'more', label: 'More' },
];

const MORE_TOOLS = [
  { id: 'career', label: 'Career', icon: 'trail-sign-outline', hint: 'Club and player record, recent matches, transfers' },
  { id: 'trophies', label: 'Trophies', icon: 'trophy-outline', hint: 'Cabinet and achievements' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'cafe-outline', hint: 'Off-pitch profile' },
  { id: 'availability', label: 'Availability', icon: 'calendar-outline', hint: 'When you can play', ownOnly: true },
];

function formatPositions(player) {
  return [player?.position, player?.secondary_position].filter(Boolean).join(' / ');
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
  const [tab, setTab] = useState('feed');
  const [moreTool, setMoreTool] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [viewerClub, setViewerClub] = useState(presidentClub || null);
  const [playerContracts, setPlayerContracts] = useState([]);
  const [liveLoans, setLiveLoans] = useState([]);
  const [loanOpen, setLoanOpen] = useState(false);
  const [career, setCareer] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);

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
    let cancelled = false;
    (async () => {
      const resolved = await resolveMyPlayerAndClub().catch(() => ({}));
      if (cancelled) return;
      setViewerClub(resolved.presidentClub || resolved.club || presidentClub || null);
      if (!player?.id) return;
      const [contracts, loans] = await Promise.all([
        stageClient.entities.PlayerContract.filter({ target_player_id: player.id }).catch(() => []),
        stageClient.entities.PlayerLoan.filter({ player_id: player.id }).catch(() => []),
      ]);
      if (!cancelled) {
        setPlayerContracts(Array.isArray(contracts) ? contracts : []);
        setLiveLoans(Array.isArray(loans) ? loans : []);
      }
    })();
    return () => { cancelled = true; };
  }, [player?.id, presidentClub]);

  useEffect(() => {
    if (!player?.id) {
      setCareer(null);
      setCareerLoading(false);
      return undefined;
    }
    let cancelled = false;
    setCareerLoading(true);
    stageClient.http.get(`/player-careers/${player.id}`)
      .then((data) => { if (!cancelled) setCareer(data && typeof data === 'object' ? data : null); })
      .catch(() => { if (!cancelled) setCareer(null); })
      .finally(() => { if (!cancelled) setCareerLoading(false); });
    return () => { cancelled = true; };
  }, [player?.id]);

  const canRequestLoan = canShowLoanRequestButton({
    player,
    viewerClub,
    playerContracts,
    loans: liveLoans,
  });

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
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    try {
      const url = await uploadLocalMedia(result.assets[0], { fallbackName: 'avatar.jpg' });
      await stageClient.entities.Player.update(player.id, { avatar_url: url });
      setPlayer((p) => (p ? { ...p, avatar_url: url } : p));
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not update avatar.');
    } finally {
      setUploading(false);
    }
  };

  const pickAndUploadBanner = async () => {
    if (!isOwn || uploading || !player?.id) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to change your banner.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploading(true);
    try {
      const url = await uploadLocalMedia(result.assets[0], { fallbackName: 'banner.jpg' });
      await stageClient.entities.Player.update(player.id, { banner_url: url });
      setPlayer((p) => (p ? { ...p, banner_url: url } : p));
    } catch (e) {
      Alert.alert('Upload failed', e?.message || 'Could not update banner.');
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

  const bannerActions = hideChrome ? null : (
    isOwn ? (
      <GlassTextButton
        label="Edit"
        icon="settings-outline"
        onPress={() => router.push('/(tabs)/profile/editprofilescreen')}
      />
    ) : (
      <GlassIconButton
        icon="arrow-back"
        onPress={() => router.back()}
        accessibilityLabel="Back"
      />
    )
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
            <View style={{ gap: 12 }}>
              <PlayerCareerSummary career={career} loading={careerLoading} />
              <PlayerTransferHistory playerId={player?.id} />
            </View>
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
        {isOwn && signedClub?.id ? (
          <TouchableOpacity
            onPress={leaveClub}
            disabled={leaving}
            accessibilityRole="button"
            accessibilityLabel="Leave club"
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(251,113,133,0.35)',
              backgroundColor: 'rgba(251,113,133,0.08)',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(251,113,133,0.12)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="exit-outline" size={18} color="#FB7185" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#FB7185', fontWeight: '800', fontSize: 14 }}>
                {leaving ? 'Leaving…' : 'Leave club'}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>
                End your contracts and return as a free agent
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}
        {isOwn ? (
          <TouchableOpacity
            onPress={async () => {
              await logout();
              router.replace('/auth/loginscreen');
            }}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            activeOpacity={0.85}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              minHeight: 56,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              paddingHorizontal: 14,
              paddingVertical: 12,
            }}
          >
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="log-out-outline" size={18} color="rgba(255,255,255,0.7)" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Sign out</Text>
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 2 }}>End this session</Text>
            </View>
          </TouchableOpacity>
        ) : null}
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
          onPress={isOwn ? pickAndUploadBanner : undefined}
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
                {canRequestLoan ? (
                  <GamerMetaPill icon="swap-horizontal" iconColor={AMBER} onPress={() => setLoanOpen(true)}>
                    Request loan
                  </GamerMetaPill>
                ) : null}
              </View>
            </View>
          </View>

          {!isOwn && player?.id ? (
            <FollowToggleButton
              targetType="player"
              targetId={player.id}
              targetName={player.gamertag || player.display_name || player.gamer_tag}
              accent="cyan"
            />
          ) : null}

          {hasRecord ? (
            <GamerRecordStrip wins={wins} draws={draws} losses={losses} />
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/matches')}
              accessibilityRole="button"
              accessibilityLabel="Open Game Day"
              style={{ minHeight: 44, justifyContent: 'center' }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '700' }}>
                No match record yet — open Game Day
              </Text>
            </TouchableOpacity>
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

        {tab === 'feed' && (
          <EmptyTabPanel
            icon="newspaper-outline"
            title="No posts yet"
            hint="Share updates from your player feed."
            actionLabel={isOwn ? 'Create post' : undefined}
            onAction={isOwn ? () => router.push('/social') : undefined}
          />
        )}

        {tab === 'showcase' && (
          <PlayerShowcase player={player} canEdit={isOwn} />
        )}

        {tab === 'more' && renderMore()}
      </View>
    </ScrollView>
  );

  const loanDialog = (
    <RequestLoanDialog
      open={loanOpen}
      onClose={() => setLoanOpen(false)}
      player={player}
      club={viewerClub}
      onSubmitted={() => {
        if (player?.id) {
          stageClient.entities.PlayerLoan.filter({ player_id: player.id })
            .then((rows) => setLiveLoans(Array.isArray(rows) ? rows : []))
            .catch(() => {});
        }
      }}
    />
  );

  if (embedded) return <View style={{ flex: 1 }}>{body}{loanDialog}</View>;

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {body}
      {loanDialog}
    </GamerProfileShell>
  );
}
