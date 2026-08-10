import React, { useEffect, useMemo, useState } from 'react';
import {
  View, ScrollView, ActivityIndicator, StatusBar, TouchableOpacity, Image, Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { stageClient } from '@/api/stageClient';
import useAuthStore from '@/store/authStore';
import {
  getContractTargetPlayerId,
  getContractTypeLabel,
  normalizePlayerContracts,
  OFFER_STATUS_TABS,
  SIGNED_STATUSES,
  statusLabel,
  weeklyWage,
} from '@/lib/playerContractFields';
import {
  GamerProfileShell,
  GamerBanner,
  FutIdentityCard,
  GamerMetaPill,
  GamerTabNav,
  GamerSectionCard,
  GlassIconButton,
  GlassTextButton,
  EmptyTabPanel,
  AMBER,
} from '@/components/profile/gamer/GamerProfileUI';
import { headingStyleLg } from '@/lib/fonts';

const PRIMARY_TABS_OWNER = [
  { id: 'history', label: 'History' },
  { id: 'contracts', label: 'Contracts' },
];

const PRIMARY_TABS_PUBLIC = [
  { id: 'history', label: 'History' },
  { id: 'contracts', label: 'Signed' },
];

const SUCCESS_LABELS = {
  less_successful: 'Less successful',
  successful: 'Successful',
  more_successful: 'More successful',
  most_successful: 'Most successful',
  boss: 'Boss',
};

function FilterChip({ label, active, onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? 'rgba(255,214,10,0.5)' : 'rgba(255,255,255,0.12)',
        backgroundColor: active ? 'rgba(255,214,10,0.16)' : 'rgba(255,255,255,0.03)',
        minHeight: 36,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: active ? AMBER : 'rgba(255,255,255,0.45)',
          fontSize: 11,
          fontWeight: '800',
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * President profile — compact hero, gold accent, flat IA.
 */
export default function PresidentProfileScreen({
  presidentId: presidentIdProp = null,
  president: presidentProp = null,
  club: clubProp = null,
  embedded = false,
  hideChrome = false,
  topLeftExtra = null,
  onOpenClub,
}) {
  const { user: me } = useAuthStore();
  const params = useLocalSearchParams();
  const router = useRouter();
  const presidentId = presidentIdProp || params?.presidentId || null;

  const [president, setPresident] = useState(presidentProp);
  const [club, setClub] = useState(clubProp);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(!presidentProp);
  const [tab, setTab] = useState('history');
  const [contractFilter, setContractFilter] = useState('sent');
  const [contracts, setContracts] = useState([]);
  const [playerMap, setPlayerMap] = useState({});

  useEffect(() => {
    if (presidentProp) {
      setPresident(presidentProp);
      if (clubProp) setClub(clubProp);
      setLoading(false);
    }
    let cancelled = false;
    (async () => {
      if (!presidentProp) setLoading(true);
      try {
        let row = presidentProp;
        if (!row) {
          if (presidentId) {
            row = await stageClient.entities.President.get(presidentId).catch(() => null);
          } else if (me?.id) {
            const rows = await stageClient.entities.President.filter({ user_id: me.id }, null, 1).catch(() => []);
            row = rows?.[0] || null;
          }
        }
        if (cancelled) return;
        setPresident(row);
        if (row?.club_id && !clubProp) {
          const clubRow = await stageClient.entities.Club.get(row.club_id).catch(() => null);
          if (!cancelled) setClub(clubRow);
        }
        if (row?.id && stageClient.presidents?.history) {
          const rows = await stageClient.presidents.history(row.id).catch(() => []);
          if (!cancelled) setHistory(Array.isArray(rows) ? rows : []);
        }

        // Stage stores club FK as team_id on player_contracts (not club_id).
        const clubId = clubProp?.id || row?.club_id;
        if (clubId) {
          const offerRows = normalizePlayerContracts(
            await stageClient.entities.PlayerContract.filter(
              { team_id: clubId },
              '-updated_date',
              200,
            ).catch(() => []),
          );
          if (cancelled) return;
          setContracts(offerRows);

          const ids = [...new Set(offerRows.map(getContractTargetPlayerId).filter(Boolean))];
          const players = await Promise.all(
            ids.map((pid) => stageClient.entities.Player.get(pid).catch(() => null)),
          );
          if (cancelled) return;
          const map = {};
          players.filter(Boolean).forEach((p) => { map[p.id] = p; });
          setPlayerMap(map);
        } else {
          setContracts([]);
          setPlayerMap({});
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [presidentId, presidentProp, clubProp, me?.id]);

  const sinceDate = president?.started_at ? String(president.started_at).slice(0, 10) : null;
  const successLabel = SUCCESS_LABELS[president?.success_level] || president?.success_level;
  const isOwn = president && me?.id && String(president.user_id) === String(me.id);

  const openClub = () => {
    const id = club?.id || president?.club_id;
    if (!id) return;
    if (onOpenClub) onOpenClub(id);
    else {
      router.push({
        pathname: isOwn ? '/teams/manageteamscreen' : '/teams/teamprofilescreen',
        params: { teamId: String(id) },
      });
    }
  };

  const filteredContracts = useMemo(() => {
    if (!isOwn) {
      return contracts.filter((c) => SIGNED_STATUSES.includes(c.status));
    }
    const tabDef = OFFER_STATUS_TABS.find((t) => t.id === contractFilter);
    if (!tabDef) return contracts;
    return contracts.filter((c) => tabDef.statuses.includes(c.status));
  }, [contracts, contractFilter, isOwn]);

  const body = loading ? (
    <View style={{ paddingTop: 80, alignItems: 'center' }}>
      <ActivityIndicator color={AMBER} />
    </View>
  ) : !president ? (
    <View style={{ padding: 32, alignItems: 'center' }}>
      <Ionicons name="shield-outline" size={48} color="rgba(255,255,255,0.3)" />
      <Text style={{ color: 'rgba(255,255,255,0.45)', marginTop: 12 }}>No president profile yet.</Text>
    </View>
  ) : (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: embedded ? 40 : 120 }}>
      <View>
        <GamerBanner
          bannerUrl={president.banner_url}
          wash="president"
          height={132}
          topLeft={topLeftExtra || (!embedded ? <GlassIconButton icon="arrow-back" onPress={() => router.back()} /> : null)}
          topRight={hideChrome ? null : (isOwn ? <GlassTextButton label="Edit" icon="create-outline" onPress={() => {}} /> : null)}
        />
        <View style={{ paddingHorizontal: 16, marginTop: -72, zIndex: 10, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
            <FutIdentityCard
              imageUrl={president.avatar_url}
              accent="amber"
              badgeLabel="PREZ"
              position="PREZ"
              name={president.display_name || 'President'}
              subtitle={president.role_title || 'President'}
              emptyIcon="shield"
              width={112}
            />
            <View style={{ flex: 1, paddingBottom: 2, gap: 8 }}>
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
                {president.display_name || 'President'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {president.role_title ? (
                  <GamerMetaPill style={{ borderColor: 'rgba(255,214,10,0.35)' }}>{president.role_title}</GamerMetaPill>
                ) : (
                  <GamerMetaPill icon="trophy" iconColor={AMBER}>President</GamerMetaPill>
                )}
                {successLabel ? <GamerMetaPill>{successLabel}</GamerMetaPill> : null}
                {president.management_style ? <GamerMetaPill>{president.management_style}</GamerMetaPill> : null}
                {sinceDate ? <GamerMetaPill icon="time-outline" iconColor={AMBER}>Since {sinceDate}</GamerMetaPill> : null}
              </View>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {(club?.id || president.club_id) ? (
              <TouchableOpacity
                onPress={openClub}
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
                  maxWidth: '48%',
                }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: '#101827',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {club?.logo_url ? (
                    <Image source={{ uri: club.logo_url }} style={{ width: 24, height: 24 }} />
                  ) : (
                    <Ionicons name="shield" size={12} color={AMBER} />
                  )}
                </View>
                <Text numberOfLines={1} style={{ color: 'rgba(255,255,255,0.85)', fontWeight: '700', fontSize: 11, flexShrink: 1 }}>
                  {club?.name || 'Club'}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={openClub} activeOpacity={0.88} style={{ flex: 1 }}>
              <LinearGradient
                colors={['#FFD60A', '#C9A227']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ paddingVertical: 13, borderRadius: 12, alignItems: 'center' }}
              >
                <Text style={{ color: '#1A1200', fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
                  {isOwn ? 'Manage Club' : 'View Club'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {president.quote ? (
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600' }} numberOfLines={2}>
              "{president.quote}"
            </Text>
          ) : null}
          {president.bio ? (
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 18 }} numberOfLines={2}>
              {president.bio}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 18, gap: 14 }}>
        <GamerTabNav
          tabs={isOwn ? PRIMARY_TABS_OWNER : PRIMARY_TABS_PUBLIC}
          active={tab}
          onChange={setTab}
          accent="amber"
        />

        {tab === 'history' && (
          history.length === 0 ? (
            <EmptyTabPanel
              icon="time-outline"
              title="No tenure history"
              hint="Clubs you preside over will list here."
            />
          ) : (
            <View style={{ gap: 8 }}>
              {history.map((tenure, idx) => (
                <TouchableOpacity
                  key={tenure.id || idx}
                  onPress={() => {
                    const id = tenure.club_id || club?.id || president?.club_id;
                    if (!id) return;
                    if (onOpenClub) onOpenClub(id);
                    else router.push({ pathname: '/teams/teamprofilescreen', params: { teamId: String(id) } });
                  }}
                  activeOpacity={0.85}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    minHeight: 56,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.08)',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    padding: 12,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: '#101827',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: 'rgba(255,214,10,0.25)',
                    }}
                  >
                    {tenure.club_logo_url ? (
                      <Image source={{ uri: tenure.club_logo_url }} style={{ width: 44, height: 44 }} />
                    ) : (
                      <Ionicons name="shield" size={18} color={AMBER} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>
                      {tenure.club_name || tenure.club_tag || 'Club'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 }}>
                      {[tenure.started_at, tenure.ended_at || 'Present'].filter(Boolean).map((d) => String(d).slice(0, 10)).join(' → ')}
                    </Text>
                  </View>
                  {!tenure.ended_at ? (
                    <View style={{ backgroundColor: 'rgba(255,214,10,0.15)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                      <Text style={{ color: AMBER, fontSize: 10, fontWeight: '900' }}>NOW</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )
        )}

        {tab === 'contracts' && (
          <View style={{ gap: 12 }}>
            {isOwn ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {OFFER_STATUS_TABS.map((f) => {
                  const count = contracts.filter((c) => f.statuses.includes(c.status)).length;
                  return (
                    <FilterChip
                      key={f.id}
                      label={count > 0 ? `${f.label} ${count}` : f.label}
                      active={contractFilter === f.id}
                      onPress={() => setContractFilter(f.id)}
                    />
                  );
                })}
              </ScrollView>
            ) : null}

            {filteredContracts.length === 0 ? (
              <EmptyTabPanel
                icon="document-text-outline"
                title={isOwn ? 'No offers here' : 'No signed players'}
                hint={isOwn ? 'Try another filter, or send a new offer.' : 'Active contracts will show here.'}
              />
            ) : (
              <View style={{ gap: 8 }}>
                {filteredContracts.map((c) => {
                  const player = playerMap[getContractTargetPlayerId(c)];
                  const name = player?.gamertag || c.player_gamertag || c.player_name || 'Player';
                  const wage = weeklyWage(c);
                  const meta = [
                    isOwn ? statusLabel(c.status) : null,
                    getContractTypeLabel(c),
                    wage != null ? `${wage} STC/w` : null,
                    player?.position,
                  ].filter(Boolean);
                  return (
                    <GamerSectionCard key={c.id}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            overflow: 'hidden',
                            backgroundColor: '#101827',
                            borderWidth: 1,
                            borderColor: 'rgba(255,214,10,0.25)',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {player?.avatar_url ? (
                            <Image source={{ uri: player.avatar_url }} style={{ width: 40, height: 40 }} />
                          ) : (
                            <Ionicons name="person" size={16} color="rgba(255,255,255,0.35)" />
                          )}
                        </View>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }} numberOfLines={1}>
                            {name}
                          </Text>
                          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 }} numberOfLines={1}>
                            {meta.join(' · ')}
                          </Text>
                        </View>
                      </View>
                    </GamerSectionCard>
                  );
                })}
              </View>
            )}
          </View>
        )}
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
