import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StatusBar, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import {
  Avatar, Button, Card, Chip, ResourceState, Screen, SectionLabel,
} from '@/components/ui';
import StatusTag from '@/components/competitions/StatusTag';
import AuditScreenHeader from '@/components/audit/AuditScreenHeader';
import StickyCtaBar from '@/components/audit/StickyCtaBar';
import useMatchPrep from '@/hooks/useMatchPrep';
import useT from '@/hooks/useT';
import { publishMatchPrep, saveMatchPrepDraft } from '@/lib/matchPrep';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FILTERS = [
  { id: 'available', key: 'available' },
  { id: 'maybe', key: 'maybe' },
  { id: 'no_reply', key: 'noReply' },
];

function formatMatchMeta(match) {
  if (!match) return '';
  const bits = [];
  if (match.competition_context) bits.push(match.competition_context);
  if (match.matchday != null) bits.push(`Matchday ${match.matchday}`);
  if (match.scheduled_date) {
    const d = new Date(match.scheduled_date);
    if (!Number.isNaN(d.getTime())) {
      bits.push(d.toLocaleString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' }));
    }
  }
  return bits.join(' · ');
}

export default function MatchPrepScreen() {
  const t = useT();
  const router = useRouter();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useMatchPrep();
  const [filter, setFilter] = useState('available');
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!data?.players) return;
    setSelected(new Set(data.players.filter((p) => p.selected).map((p) => String(p.id))));
  }, [data?.players]);

  const filtered = useMemo(() => {
    const rows = data?.players || [];
    if (filter === 'available') {
      return rows.filter((p) => p.availability === 'available' || p.availability === 'yes' || selected.has(String(p.id)));
    }
    if (filter === 'maybe') return rows.filter((p) => p.availability === 'maybe');
    return rows.filter((p) => !['available', 'yes', 'maybe'].includes(p.availability));
  }, [data?.players, filter, selected]);

  const counts = data?.availabilityCounts || { available: 0, maybe: 0, no_reply: 0 };
  const max = data?.maxStarters || 11;
  const selectedCount = selected.size;
  const locked = Boolean(data?.published);
  const canEdit = Boolean(data?.staff) && !locked && Boolean(data?.fixtureId);
  const opponent = data?.club && data?.match
    ? (String(data.match.home_club_id) === String(data.club.id)
      ? data.match.away_club_name
      : data.match.home_club_name)
    : '—';

  const toggle = (id) => {
    if (!canEdit) return;
    setSelected((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else if (next.size < max) next.add(key);
      return next;
    });
  };

  const run = async (kind) => {
    if (!data?.club?.id || !data?.fixtureId) return;
    setBusy(kind);
    setActionError('');
    try {
      const ids = [...selected];
      if (kind === 'publish') {
        await publishMatchPrep({ clubId: data.club.id, fixtureId: data.fixtureId, playerIds: ids });
      } else {
        await saveMatchPrepDraft({ clubId: data.club.id, fixtureId: data.fixtureId, playerIds: ids });
      }
      router.back();
    } catch (err) {
      setActionError(err?.message || t('stage.state.error'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen
      tabBar={false}
      guideFab
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) + 120 }}
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} colors={[tokens.cyan]} />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <AuditScreenHeader title={t('stage.matchPrep.title')} staff />

      <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
        {!data?.club ? (
          <Card>
            <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>{t('stage.matchPrep.noClub')}</Text>
          </Card>
        ) : null}

        {data?.club && !data.fixtureId ? (
          <Card>
            <Text style={{ color: tokens.muted, fontSize: 14, lineHeight: 20 }}>{t('stage.matchPrep.noFixture')}</Text>
          </Card>
        ) : null}

        {data?.club && data.fixtureId ? (
          <View style={{ gap: 12 }}>
            <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 12 }}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
                  vs {opponent || '—'}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 3 }} numberOfLines={2}>
                  {formatMatchMeta(data.match)}
                </Text>
              </View>
              <StatusTag
                label={(locked ? t('stage.matchPrep.publishedTag') : t('stage.matchPrep.notPublished')).toUpperCase()}
                tone={locked ? 'success' : 'warning'}
              />
            </Card>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {FILTERS.map((f) => (
                <Chip
                  key={f.id}
                  label={`${t(`stage.matchPrep.${f.key}`)} ${counts[f.id] ?? 0}`}
                  active={filter === f.id}
                  onPress={() => setFilter(f.id)}
                />
              ))}
            </View>

            <SectionLabel right={<Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase' }}>{t('stage.matchPrep.eligibility')}</Text>}>
              {t('stage.matchPrep.startingXi', { count: selectedCount, max })}
            </SectionLabel>

            <View>
              {(filtered.length ? filtered : data.players || []).map((player, index, arr) => {
                const on = selected.has(String(player.id));
                return (
                  <Pressable
                    key={player.id}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on, disabled: !canEdit }}
                    accessibilityLabel={player.gamertag}
                    onPress={() => toggle(player.id)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      paddingVertical: 9,
                      borderBottomWidth: index === arr.length - 1 ? 0 : 1,
                      borderBottomColor: tokens.border,
                      opacity: player.eligible ? 1 : 0.85,
                    }}
                  >
                    <View style={{
                      width: 22, height: 22, borderRadius: 6,
                      borderWidth: 2, borderColor: on ? tokens.cyan : tokens.borderStrong || tokens.border,
                      backgroundColor: on ? tokens.cyan : 'transparent',
                    }}
                    />
                    <View style={{
                      width: 40, height: 24, borderRadius: 6, borderWidth: 1, borderColor: tokens.border,
                      backgroundColor: tokens.bgDeep, alignItems: 'center', justifyContent: 'center',
                    }}
                    >
                      <Text style={{ color: tokens.cyanHi, fontSize: 12, fontWeight: '800' }}>{player.position}</Text>
                    </View>
                    <Avatar initials={player.initials} size={34} round />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: tokens.text, fontWeight: on ? '700' : '500' }}>
                        {player.gamertag}
                      </Text>
                      {player.eligibilityMessage ? (
                        <Text numberOfLines={2} style={{ color: player.eligible ? tokens.warning : tokens.danger, fontSize: 11, marginTop: 2 }}>
                          {player.eligibilityMessage}
                        </Text>
                      ) : null}
                    </View>
                    <StatusTag
                      label={(player.eligible ? t('stage.matchPrep.eligible') : t('stage.matchPrep.ineligible')).toUpperCase()}
                      tone={player.eligible ? 'success' : 'danger'}
                    />
                  </Pressable>
                );
              })}
            </View>

            {!data.staff ? (
              <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19 }}>{t('stage.matchPrep.readOnly')}</Text>
            ) : null}

            {actionError ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{actionError}</Text> : null}
          </View>
        ) : null}
      </ResourceState>

      {canEdit ? (
        <StickyCtaBar testID="match-prep-cta">
          <Button
            title={t('stage.matchPrep.publish')}
            loading={busy === 'publish'}
            disabled={Boolean(busy) || selectedCount === 0}
            onPress={() => run('publish')}
          />
          <Button
            title={t('stage.matchPrep.saveDraft')}
            variant="secondary"
            loading={busy === 'draft'}
            disabled={Boolean(busy)}
            onPress={() => run('draft')}
          />
        </StickyCtaBar>
      ) : null}
    </Screen>
  );
}
