import React, { useEffect, useMemo, useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Image, Text, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '@/store/authStore';
import useMyStageIdentities from '@/hooks/useMyStageIdentities';
import { stageClient } from '@/api/stageClient';
import ProfileScreen from './profilescreen';
import PresidentProfileScreen from './presidentprofilescreen';
import {
  GamerProfileShell,
  GamerBanner,
  GamerMetaPill,
  GamerRecordStrip,
  GlassIconButton,
  GlassTextButton,
  IdentityRail,
} from '@/components/profile/gamer/GamerProfileUI';
import ClubProfileTabs from './clubProfileTabs';
import PresidentChip from '@/components/club/PresidentChip';
import { headingStyleLg } from '@/lib/fonts';
import { loadClubProfile } from '@/lib/clubProfileData';
import { leaveStageClub } from '@/lib/leaveClub';

const SURFACES = [
  { id: 'player', label: 'Player' },
  { id: 'president', label: 'President' },
  { id: 'club', label: 'Club' },
];

function ClubCrest({ logoUrl, tag, platform, width = 108 }) {
  const height = Math.round(width * 1.2);
  return (
    <View
      style={{
        width,
        shadowColor: '#FFD60A',
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={['#F6E27A', '#C9A227', '#8A6A12', '#F6E27A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 16, padding: 2 }}
      >
        <View
          style={{
            borderRadius: 14,
            overflow: 'hidden',
            height: height - 4,
            width: width - 4,
            backgroundColor: '#120E08',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {logoUrl ? (
            <Image source={{ uri: logoUrl }} style={{ width: '78%', height: '58%' }} resizeMode="contain" />
          ) : (
            <Ionicons name="shield" size={42} color="rgba(255,214,10,0.35)" />
          )}
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 10, alignItems: 'center', paddingHorizontal: 8 }}>
            <Text style={{ color: '#FFD60A', fontWeight: '900', fontSize: 13, letterSpacing: 1 }} numberOfLines={1}>
              {tag ? `[${tag}]` : 'CLUB'}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
              {platform || ' '}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function ClubProfileSurface({ club: seedClub, president: seedPresident, isOwner, onOpenFull, onOpenPresident, topLeft, playerId, userId, onClubLeft }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(Boolean(seedClub?.id));
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!seedClub?.id) {
      setBundle(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    loadClubProfile(seedClub.id, stageClient)
      .then((next) => {
        if (!cancelled) setBundle(next);
      })
      .catch(() => {
        if (!cancelled) setBundle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [seedClub?.id]);

  const club = bundle?.club || seedClub;
  const president = bundle?.president || seedPresident;
  const record = bundle?.record;
  const wins = record?.wins ?? club?.wins ?? club?.wins_count ?? 0;
  const draws = record?.draws ?? club?.draws ?? club?.draws_count ?? 0;
  const losses = record?.losses ?? club?.losses ?? club?.losses_count ?? 0;
  const total = wins + draws + losses;
  const hasRecord = total > 0;
  const memberLabel = bundle?.players?.length
    ?? club?.member_count
    ?? club?.members_count
    ?? null;
  const myPlayer = bundle?.players?.find((player) => String(player.id) === String(playerId)) || null;
  const clubRoles = Array.isArray(myPlayer?.club_roles) ? myPlayer.club_roles : [];
  const primaryRole = String(myPlayer?.role || '').toLowerCase();
  const isPresidentRole = isOwner || primaryRole === 'president' || clubRoles.includes('president');
  const isCaptainRole = primaryRole === 'captain' || clubRoles.includes('captain');
  const isViceCaptainRole = primaryRole === 'vice_captain' || clubRoles.includes('vice_captain');
  const isClubMember = Boolean(myPlayer);

  if (!club) {
    return (
      <View style={{ padding: 32, alignItems: 'center' }}>
        <Ionicons name="shield-outline" size={48} color="rgba(255,255,255,0.3)" />
        <Text style={{ color: 'rgba(255,255,255,0.45)', marginTop: 12 }}>No club linked yet.</Text>
      </View>
    );
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Compact stadium header — content starts early */}
      <View>
        <GamerBanner
          bannerUrl={club.banner_url}
          wash="club"
          height={132}
          topLeft={topLeft}
        />
        <View style={{ paddingHorizontal: 16, marginTop: -72, zIndex: 10, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <ClubCrest
              logoUrl={club.logo_url}
              tag={club.tag}
              platform={club.platform}
              width={108}
            />
            <View style={{ flex: 1, paddingBottom: 4, gap: 8 }}>
              <Text
                numberOfLines={2}
                style={[
                  headingStyleLg,
                  {
                    color: '#fff',
                    lineHeight: 28,
                  },
                ]}
              >
                {club.name || club.club_name || 'Club'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {club.tag ? (
                  <GamerMetaPill style={{ borderColor: 'rgba(255,214,10,0.35)' }}>[{club.tag}]</GamerMetaPill>
                ) : null}
                {club.platform ? (
                  <GamerMetaPill icon="game-controller" iconColor="#FFD60A">{club.platform}</GamerMetaPill>
                ) : null}
                {club.region ? (
                  <GamerMetaPill icon="globe-outline" iconColor="#FFD60A">{club.region}</GamerMetaPill>
                ) : null}
                {memberLabel != null ? (
                  <GamerMetaPill icon="people" iconColor="#FFD60A">{memberLabel} players</GamerMetaPill>
                ) : null}
              </View>
            </View>
          </View>

          {/* President = secondary chip; one primary CTA */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {president ? (
              <PresidentChip president={president} onPress={onOpenPresident} />
            ) : null}
            {isOwner && playerId ? (
              <TouchableOpacity
                onPress={() => {
                  if (leaving) return;
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
                            await leaveStageClub({ clubId: club.id, playerId, userId });
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
                }}
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
              onPress={() => onOpenFull(club.id)}
              activeOpacity={0.88}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={['#FFD60A', '#C9A227']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 13,
                  borderRadius: 12,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#1A1200', fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  {isOwner ? 'Manage Club' : 'Open Club'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {hasRecord ? (
            <GamerRecordStrip wins={wins} draws={draws} losses={losses} />
          ) : (
            <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: '600' }}>
              No competitive record yet
            </Text>
          )}

          {club.description ? (
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
              {club.description}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 18 }}>
        {loading && !bundle ? (
          <View style={{ paddingVertical: 28, alignItems: 'center' }}>
            <ActivityIndicator color="#FFD60A" />
          </View>
        ) : (
          <ClubProfileTabs
            club={club}
            isOwner={isOwner}
            isPresident={isPresidentRole}
            isCaptain={isCaptainRole}
            isViceCaptain={isViceCaptainRole}
            isMember={isClubMember}
            currentPlayerId={playerId}
            players={bundle?.players}
            matches={bundle?.matches}
            upcomingMatches={bundle?.upcomingMatches}
            posts={bundle?.posts}
            trophies={bundle?.trophies}
            chatMessages={bundle?.chatMessages}
            contracts={bundle?.contracts}
            auditLogs={bundle?.auditLogs}
            availability={bundle?.availability}
            stadium={bundle?.stadium}
            finance={bundle?.finance}
            shirts={bundle?.shirts}
          />
        )}
      </View>
    </ScrollView>
  );
}

/**
 * Profile hub — one identity rail, premium EAFC surfaces.
 */
export default function ProfileIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tab } = useLocalSearchParams();
  const { logout } = useAuthStore();
  const identities = useMyStageIdentities();
  const [surface, setSurface] = useState(null);

  const availableSurfaces = useMemo(() => {
    return SURFACES.filter((s) => {
      if (s.id === 'player') return identities.canPlayer || identities.intent === 'player';
      if (s.id === 'president') return identities.canPresident;
      if (s.id === 'club') return identities.canClub;
      return false;
    });
  }, [identities.canPlayer, identities.canPresident, identities.canClub, identities.intent]);

  useEffect(() => {
    if (identities.loading) return;
    const preferred = identities.defaultSurface;
    const allowed = availableSurfaces.some((s) => s.id === preferred)
      ? preferred
      : availableSurfaces[0]?.id || 'player';
    setSurface((prev) => {
      if (String(tab || '') === 'squad' && availableSurfaces.some((s) => s.id === 'club')) {
        return 'club';
      }
      if (prev && availableSurfaces.some((s) => s.id === prev)) return prev;
      return allowed;
    });
  }, [identities.loading, identities.defaultSurface, availableSurfaces, tab]);

  // Sync dual-role mode when switching identity surfaces
  const selectSurface = (next) => {
    setSurface(next);
    if (identities.isDual) {
      if (next === 'player') identities.switchMode('player');
      else identities.switchMode('club');
    }
  };

  const openClub = (teamId) => {
    if (!teamId) return;
    router.push({
      pathname: '/teams/teamprofilescreen',
      params: { teamId: String(teamId) },
    });
  };

  if (identities.loading || !surface) {
    return (
      <GamerProfileShell>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color="#00F0FF" />
        </View>
      </GamerProfileShell>
    );
  }

  const rail = (
    <IdentityRail
      items={availableSurfaces}
      value={surface}
      onChange={selectSurface}
    />
  );

  const topRight = (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {surface === 'player' ? (
        <GlassTextButton
          label="Edit"
          icon="settings-outline"
          onPress={() => router.push('/(tabs)/profile/editprofilescreen')}
        />
      ) : null}
      <GlassIconButton
        icon="log-out-outline"
        onPress={async () => {
          await logout();
          router.replace('/auth/loginscreen');
        }}
      />
    </View>
  );

  const signedClub = identities.club
    && identities.player?.club_id
    && String(identities.club.id) === String(identities.player.club_id)
    ? identities.club
    : null;

  return (
    <GamerProfileShell>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: 88, backgroundColor: 'transparent' }}>
        <View style={{ flex: 1 }}>
          {surface === 'player' && (
            <ProfileScreen
              embedded
              hideChrome
              player={identities.player}
              signedClub={signedClub}
              presidentClub={identities.presidentClub}
              onOpenClub={openClub}
              onClubLeft={identities.refresh}
              topLeftExtra={rail}
            />
          )}

          {surface === 'president' && (
            <PresidentProfileScreen
              embedded
              hideChrome
              president={identities.president}
              club={identities.presidentClub}
              presidentId={identities.presidentId}
              onOpenClub={openClub}
              topLeftExtra={rail}
            />
          )}

          {surface === 'club' && (
            <ClubProfileSurface
              club={identities.presidentClub || identities.club}
              president={identities.president}
              isOwner={Boolean(identities.presidentClub?.id)}
              onOpenFull={openClub}
              onOpenPresident={() => selectSurface('president')}
              topLeft={rail}
              playerId={identities.player?.id}
              userId={identities.user?.id}
              onClubLeft={identities.refresh}
            />
          )}

          {/* Shared floating actions — single row, no duplicate rails */}
          <View style={{ position: 'absolute', top: 10, right: 12, zIndex: 40 }}>
            {topRight}
          </View>
        </View>
      </View>
    </GamerProfileShell>
  );
}
