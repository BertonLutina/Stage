import React, { useEffect, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Alert, Text, RefreshControl,
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
  GlassIconButton,
  GlassTextButton,
  EmptyTabPanel,
  IdentityVerifiedBar,
  RoleChip,
} from '@/components/profile/gamer/GamerProfileUI';
import PageTile, { SilverPill } from '@/components/theme/PageTile';
import { headingStyleLg } from '@/lib/fonts';
import { hexToRgba } from '@/lib/stageTheme';
import useThemeStore from '@/store/themeStore';
import { formatProfilePlatform } from '@/lib/profilePlatform';
import { getPlayerNationality } from '@/lib/countryDisplay';
import FlagMark from '@/components/common/FlagMark';
import PlayerShowcase from '@/components/profile/PlayerShowcase';
import ProfileFeedPanel from '@/components/profile/ProfileFeedPanel';
import ProfileCareerBoard from '@/components/profile/ProfileCareerBoard';
import TrophyCabinetPanel from '@/components/trophy/TrophyCabinetPanel';
import FollowToggleButton from '@/components/profile/FollowToggleButton';
import { uploadLocalMedia } from '@/lib/uploadProfileMedia';
import { getPrimaryClubRole } from '@/lib/clubStaffRoles';
import { clubRoleLabel } from '@/lib/clubSquadDisplay';
import { displayNamedFounder } from '@/lib/founderDisplay';
import { isFounderPlayerContract } from '@/lib/playerContractFields';
import { Card, ListRow, StatGrid } from '@/components/ui';
import useProfile from '@/hooks/useProfile';

const PRIMARY_TABS = [
  { id: 'posts', label: 'Posts' },
  { id: 'showcase', label: 'Showcase' },
  { id: 'career', label: 'Career' },
  { id: 'trophies', label: 'Trophies' },
  { id: 'lifestyle', label: 'Lifestyle' },
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
  const tokens = useThemeStore((s) => s.tokens);
  const params = useLocalSearchParams();
  const router = useRouter();
  const viewingOther = Boolean(
    (params?.playerId && String(params.playerId) !== String(playerProp?.id || ''))
    || (params?.userId && params.userId !== me?.id),
  );

  const [player, setPlayer] = useState(playerProp);
  const [signedClub, setSignedClub] = useState(signedClubProp);
  const [loading, setLoading] = useState(!playerProp);
  const [tab, setTab] = useState('posts');
  const [uploading, setUploading] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [viewerClub, setViewerClub] = useState(presidentClub || null);
  const [playerContracts, setPlayerContracts] = useState([]);
  const [liveLoans, setLiveLoans] = useState([]);
  const [loanOpen, setLoanOpen] = useState(false);
  const [career, setCareer] = useState(null);
  const [careerLoading, setCareerLoading] = useState(false);

  const isOwn = !viewingOther;
  const profileResource = useProfile(!playerProp && isOwn);

  useEffect(() => {
    if (playerProp) {
      setPlayer(playerProp);
      setSignedClub(signedClubProp || null);
      setLoading(false);
      return;
    }
    if (isOwn) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (params?.playerId) {
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
    if (playerProp || !isOwn) return;
    setLoading(profileResource.loading);
    if (profileResource.data) {
      setPlayer(profileResource.data.player);
      setSignedClub(profileResource.data.club);
      setCareer(profileResource.data.career);
    }
  }, [playerProp, isOwn, profileResource.loading, profileResource.data]);

  useEffect(() => {
    if (isOwn && profileResource.data?.career) {
      setCareer(profileResource.data.career);
      setCareerLoading(false);
      return undefined;
    }
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
  }, [player?.id, isOwn, profileResource.data?.career]);

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
        label="Edit Profile"
        icon="settings-outline"
        tone="outline"
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

  const isPresident = getPrimaryClubRole(player) === 'president';
  const isFounder = (playerContracts || []).some((row) => (
    isFounderPlayerContract(row) && String(row.status || '').toLowerCase() === 'active'
  ));
  const displayName = player?.gamertag || me?.gamer_tag || 'Player';
  const verified = Number(player?.is_verified) === 1;

  // Stage list row: card chrome, 56px tall, icon + label (+ chevron).
  const lifestyleRow = (extra = {}) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tokens.border,
    backgroundColor: tokens.glass,
    paddingHorizontal: 16,
    ...extra,
  });

  const renderLifestyle = () => (
    <View style={{ gap: 10 }}>
      {player.bio ? (
        <Text style={{ color: tokens.textSoft, fontSize: 15, lineHeight: 21, marginBottom: 6 }}>
          {player.bio}
        </Text>
      ) : !isOwn ? (
        <EmptyTabPanel
          icon="cafe-outline"
          title="Lifestyle"
          hint="Off-pitch profile details will land here."
        />
      ) : null}
      {isOwn ? (
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/profile/availabilityscreen')}
          accessibilityRole="button"
          accessibilityLabel="Availability"
          activeOpacity={0.85}
          style={lifestyleRow()}
        >
          <Ionicons name="calendar-outline" size={22} color={tokens.cyan} />
          <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '600', fontSize: 15, flex: 1 }}>Availability</Text>
          <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
        </TouchableOpacity>
      ) : null}
      {isOwn && signedClub?.id ? (
        <TouchableOpacity
          onPress={leaveClub}
          disabled={leaving}
          accessibilityRole="button"
          accessibilityLabel="Leave club"
          activeOpacity={0.85}
          style={lifestyleRow({
            borderColor: hexToRgba(tokens.danger, 0.5),
            backgroundColor: tokens.live ? hexToRgba(tokens.danger, 0.14) : tokens.dangerBg,
          })}
        >
          <Ionicons name="exit-outline" size={22} color={tokens.danger} />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: tokens.danger, fontWeight: '600', fontSize: 15 }}>
              {leaving ? 'Leaving…' : 'Leave club'}
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
          style={lifestyleRow()}
        >
          <Ionicons name="log-out-outline" size={22} color={tokens.textSoft} />
          <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: '600', fontSize: 15, flex: 1 }}>Sign out</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const careerStats = career?.club_career || null;
  const summaryStats = careerStats ? [
    { label: 'Games', value: careerStats.games ?? '—' },
    { label: 'Goals', value: careerStats.goals ?? '—' },
    { label: 'Assists', value: careerStats.assists ?? '—' },
    { label: 'Rating', value: careerStats.avg_rating ?? '—' },
  ] : [];

  const ownProfileSummary = isOwn ? (
    <View style={{ gap: 12, marginBottom: 16 }}>
      {summaryStats.length ? <Card><StatGrid items={summaryStats} columns={4} /></Card> : null}
      <Card style={{ paddingVertical: 2 }}>
        <ListRow icon="create-outline" title="Edit profile" onPress={() => router.push('/(tabs)/profile/editprofilescreen')} />
        <View style={{ height: 1, backgroundColor: tokens.border }} />
        <ListRow icon="calendar-outline" title="Availability" onPress={() => router.push('/(tabs)/profile/availabilityscreen')} />
        {signedClub?.id ? (
          <>
            <View style={{ height: 1, backgroundColor: tokens.border }} />
            <ListRow icon="people-outline" title="My team" onPress={() => openClub(signedClub.id)} />
          </>
        ) : null}
        <View style={{ height: 1, backgroundColor: tokens.border }} />
        <ListRow icon="wallet-outline" title="Wallet" onPress={() => router.push('/apps/wallet')} />
      </Card>
    </View>
  ) : null;

  const body = loading ? (
    <View style={{ paddingTop: 80, alignItems: 'center' }}>
      <ActivityIndicator color={tokens.cyan} />
    </View>
  ) : profileResource.error && isOwn ? (
    <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
      <Text style={{ color: tokens.danger, textAlign: 'center' }}>{profileResource.error}</Text>
      <GlassTextButton label="Try again" tone="outline" onPress={profileResource.refetch} />
    </View>
  ) : !player ? (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <Ionicons name="person-outline" size={48} color={tokens.faint} />
      <Text style={{ color: tokens.muted, marginTop: 12, textAlign: 'center' }}>
        No player profile yet.
      </Text>
    </View>
  ) : (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={!playerProp && isOwn ? (
        <RefreshControl refreshing={profileResource.refreshing} onRefresh={profileResource.refetch} tintColor={tokens.cyan} />
      ) : undefined}
      contentContainerStyle={{ paddingBottom: embedded ? 16 : 120 }}
    >
      {tab !== 'career' ? (
        <View>
          <GamerBanner
            bannerUrl={player.banner_url}
            wash="player"
            height={188}
            topLeft={topLeftExtra}
            topRight={bannerActions}
            onPress={isOwn ? pickAndUploadBanner : undefined}
          />
          <View style={{ paddingHorizontal: 20, marginTop: -108, zIndex: 10, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14 }}>
              <FutIdentityCard
                imageUrl={player.avatar_url}
                accent="cyan"
                variant="overlay"
                overall={player.overall_rating ?? 70}
                position={player.position}
                onPress={isOwn ? pickAndUploadAvatar : undefined}
                width={170}
              />
              <View style={{ flex: 1, paddingBottom: 2, gap: 8 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <Text
                    numberOfLines={2}
                    style={[headingStyleLg, { color: tokens.text, fontSize: 30, letterSpacing: 30 * 0.03, lineHeight: 32, flexShrink: 1 }]}
                  >
                    {displayName}
                  </Text>
                  {verified ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={{ color: tokens.cyan, fontSize: 11, fontWeight: '700' }}>EA</Text>
                      <Ionicons name="checkmark-circle" size={16} color={tokens.cyan} />
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {player.position ? (
                    <GamerMetaPill icon="locate" iconColor={tokens.cyan}>{formatPositions(player)}</GamerMetaPill>
                  ) : null}
                  {player.platform ? (
                    <GamerMetaPill icon="game-controller" iconColor={tokens.cyan}>
                      {formatProfilePlatform(player.platform)}
                    </GamerMetaPill>
                  ) : null}
                  {getPlayerNationality(player).code ? (
                    <GamerMetaPill
                      leading={(
                        <FlagMark
                          code={getPlayerNationality(player).code}
                          country={player.country}
                          size={14}
                          accessibilityLabel="National flag"
                        />
                      )}
                    />
                  ) : null}
                  {signedClub ? (
                    <GamerMetaPill icon="shield" iconColor={tokens.cyan} onPress={() => openClub(signedClub.id)}>
                      {signedClub.name}
                    </GamerMetaPill>
                  ) : null}
                  {canRequestLoan ? (
                    <GamerMetaPill icon="swap-horizontal" iconColor={tokens.amber} onPress={() => setLoanOpen(true)}>
                      Request loan
                    </GamerMetaPill>
                  ) : null}
                </View>
                {(isFounder || isPresident) ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {isFounder ? <RoleChip label={displayNamedFounder()} tone="gold" /> : null}
                    {isPresident ? <RoleChip label={clubRoleLabel('president')} tone="cyan" /> : null}
                  </View>
                ) : null}
              </View>
            </View>

            {!isOwn && player?.id ? (
              <FollowToggleButton
                targetType="player"
                targetId={player.id}
                targetName={displayName}
                accent="cyan"
              />
            ) : null}

            {verified ? <IdentityVerifiedBar name={displayName} /> : null}
          </View>
        </View>
      ) : null}

      {tab === 'career' ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 10, alignItems: 'flex-end' }}>
          {bannerActions}
        </View>
      ) : null}

      <View style={{ paddingHorizontal: 20, marginTop: tab === 'career' ? 8 : 16 }}>
        {ownProfileSummary}
        <PageTile
          tileKey="profile"
          tileTitle="PROFILE"
          player={player}
          onPlayerChanged={isOwn ? setPlayer : undefined}
          showMenu={isOwn}
          contentStyle={{ paddingHorizontal: 12, gap: 14 }}
        >
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {PRIMARY_TABS.map((item) => (
            <SilverPill
              key={item.id}
              label={item.label}
              active={tab === item.id}
              onPress={() => setTab(item.id)}
            />
          ))}
        </ScrollView>

        {tab === 'posts' && <ProfileFeedPanel player={player} isOwn={isOwn} />}
        {tab === 'showcase' && <PlayerShowcase player={player} canEdit={isOwn} />}
        {tab === 'career' && (
          <ProfileCareerBoard
            player={player}
            signedClub={signedClub}
            career={career}
            careerLoading={careerLoading}
          />
        )}
        {tab === 'trophies' && player?.id ? (
          <TrophyCabinetPanel ownerId={player.id} ownerType="player" canEdit={isOwn} />
        ) : null}
        {tab === 'lifestyle' && renderLifestyle()}
        </PageTile>
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
