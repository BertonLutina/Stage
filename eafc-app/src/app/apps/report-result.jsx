import React, { useEffect, useMemo, useState } from 'react';
import {
  Image, Pressable, RefreshControl, StatusBar, Text, View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import {
  Avatar, Button, Card, ResourceState, Screen, SectionLabel,
} from '@/components/ui';
import AuditScreenHeader from '@/components/audit/AuditScreenHeader';
import StickyCtaBar from '@/components/audit/StickyCtaBar';
import SuccessButton from '@/components/audit/SuccessButton';
import useMatchResultScreen from '@/hooks/useMatchResultScreen';
import useT from '@/hooks/useT';
import {
  buildResultPayload, isClubGameDayMatch, mapResultError, submitMatchResult,
} from '@/lib/gameDayOps';
import { evidenceRequired } from '@/lib/gameDayResultFlow';
import { guideFabClearanceStack } from '@/components/ui/metrics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function clubAbbrev(name) {
  const raw = String(name || '').trim();
  if (!raw) return '?';
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  return raw.slice(0, 3).toUpperCase();
}

function Stepper({ value, onChange, label }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Pressable
        accessibilityLabel={`${label} minus`}
        onPress={() => onChange(Math.max(0, Number(value) - 1))}
        style={{
          width: 32, height: 40, borderRadius: 10, borderWidth: 1, borderColor: tokens.border,
          backgroundColor: tokens.bgDeep, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ color: tokens.text, fontSize: 20, fontWeight: '700' }}>−</Text>
      </Pressable>
      <Text style={{
        color: tokens.text, fontSize: 52, fontWeight: '800', width: 40, textAlign: 'center', lineHeight: 56,
      }}
      >
        {value}
      </Text>
      <Pressable
        accessibilityLabel={`${label} plus`}
        onPress={() => onChange(Number(value) + 1)}
        style={{
          width: 32, height: 40, borderRadius: 10, borderWidth: 1, borderColor: tokens.border,
          backgroundColor: tokens.bgDeep, alignItems: 'center', justifyContent: 'center',
        }}
      >
        <Text style={{ color: tokens.text, fontSize: 20, fontWeight: '700' }}>+</Text>
      </Pressable>
    </View>
  );
}

export default function ReportResultScreen() {
  const router = useRouter();
  const t = useT();
  const tokens = useThemeStore((s) => s.tokens);
  const insets = useSafeAreaInsets();
  const { data, loading, error, refreshing, refetch } = useMatchResultScreen();
  const match = data?.match;
  const club = data?.club;
  const sides = data?.sides;

  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [squad, setSquad] = useState([]);
  const [scorerMarks, setScorerMarks] = useState({});
  const [proofUrl, setProofUrl] = useState(null);
  const [proofName, setProofName] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!match?.id || !club?.id || !isClubGameDayMatch(match)) return undefined;
    let cancelled = false;
    (async () => {
      const all = await stageClient.entities.Player.filter({ club_id: club.id }).catch(() => []);
      if (cancelled) return;
      let suggested = [];
      if (match.source_fixture_id) {
        const lineups = await stageClient.entities.ClubFixtureLineup
          .filter({ fixture_id: match.source_fixture_id, club_id: club.id })
          .catch(() => []);
        const raw = lineups?.[0]?.starting_players;
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          suggested = Array.isArray(parsed)
            ? parsed.map((e) => e?.id || e?.player_id || e).filter(Boolean)
            : [];
        } catch {
          suggested = [];
        }
      }
      const set = new Set(suggested.map(String));
      const lineup = (all || []).filter((p) => set.has(String(p.id)));
      const roster = lineup.length ? lineup : (all || []).slice(0, 11);
      setSquad(roster);
      const marks = {};
      roster.forEach((p) => { marks[p.id] = 0; });
      setScorerMarks(marks);
    })();
    return () => { cancelled = true; };
  }, [match?.id, match?.source_fixture_id, club?.id]);

  const ourScore = sides?.amIHomeTeam ? homeScore : awayScore;
  const goalsAssigned = useMemo(
    () => Object.values(scorerMarks).reduce((sum, n) => sum + (Number(n) || 0), 0),
    [scorerMarks],
  );
  const scorers = useMemo(
    () => squad.filter((p) => Number(scorerMarks[p.id] || 0) > 0),
    [squad, scorerMarks],
  );
  const needsProof = evidenceRequired(match);

  const bumpScorer = (id, delta) => {
    setScorerMarks((prev) => {
      const next = Math.max(0, Number(prev[id] || 0) + delta);
      return { ...prev, [id]: next };
    });
  };

  const pickProof = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      setFormError(t('stage.reportResult.proofPermission'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploading(true);
    setFormError('');
    setProofPreview(asset.uri);
    setProofName(asset.fileName || 'proof.jpg');
    try {
      const uploaded = await stageClient.integrations.Core.UploadFile({
        file: { uri: asset.uri, name: asset.fileName || 'proof.jpg', type: asset.mimeType || 'image/jpeg' },
      });
      setProofUrl(uploaded?.file_url || null);
    } catch (err) {
      setProofUrl(null);
      setFormError(err?.message || t('stage.reportResult.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (needsProof && !proofUrl) {
      setFormError(t('stage.reportResult.proofRequired'));
      return;
    }
    if (isClubGameDayMatch(match) && ourScore > 0 && goalsAssigned !== ourScore) {
      setFormError(t('stage.reportResult.scorersIncomplete'));
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const playerMarks = {};
      squad.forEach((p) => {
        playerMarks[p.id] = { goals: Number(scorerMarks[p.id] || 0), assists: 0, rating: 6 };
      });
      const payload = buildResultPayload({
        game: match,
        isHomeTeam: sides.amIHomeTeam,
        myClub: club,
        myPlayer: data.player,
        homeScore,
        awayScore,
        seatedPlayers: squad,
        participatingIds: squad.map((p) => p.id),
        playerMarks,
        proofUrl,
        action: 'submit_result',
      });
      await submitMatchResult(payload);
      router.back();
    } catch (err) {
      setFormError(mapResultError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen
      tabBar={false}
      guideFab
      scroll={!loading}
      style={{ paddingBottom: guideFabClearanceStack(insets.bottom) + 100 }}
      refreshControl={loading ? undefined : (
        <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={tokens.cyan} colors={[tokens.cyan]} />
      )}
    >
      <StatusBar barStyle={tokens.barStyle} translucent backgroundColor="transparent" />
      <AuditScreenHeader title={t('stage.reportResult.title')} close />

      <ResourceState loading={loading && !data} error={data ? null : error} onRetry={refetch}>
        {match ? (
          <View style={{ gap: 12 }}>
            <Card style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{
                color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 1.2, textTransform: 'uppercase',
              }}
              >
                {t('stage.reportResult.fullTime')}
                {match.competition_context ? ` · ${match.competition_context}` : ''}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <View style={{ width: 104, alignItems: 'center', gap: 8 }}>
                  <Avatar initials={clubAbbrev(sides.homeName)} size={48} round />
                  <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>{sides.homeName}</Text>
                  <Stepper value={homeScore} onChange={setHomeScore} label={sides.homeName} />
                </View>
                <Text style={{ color: tokens.muted, fontSize: 22, fontWeight: '800' }}>–</Text>
                <View style={{ width: 104, alignItems: 'center', gap: 8 }}>
                  <Avatar initials={clubAbbrev(sides.awayName)} size={48} round />
                  <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 12 }} numberOfLines={1}>{sides.awayName}</Text>
                  <Stepper value={awayScore} onChange={setAwayScore} label={sides.awayName} />
                </View>
              </View>
            </Card>

            {isClubGameDayMatch(match) ? (
              <Card style={{ paddingVertical: 10, gap: 4 }}>
                <SectionLabel right={(
                  <Text style={{ color: tokens.muted, fontSize: 12 }}>{t('stage.reportResult.fromLineup')}</Text>
                )}
                >
                  {t('stage.reportResult.scorers', { count: goalsAssigned, need: ourScore })}
                </SectionLabel>
                {scorers.length === 0 ? (
                  <Text style={{ color: tokens.muted, fontSize: 13, marginTop: 6 }}>{t('stage.reportResult.tapScorers')}</Text>
                ) : null}
                {squad.map((p, index) => {
                  const goals = Number(scorerMarks[p.id] || 0);
                  if (goals === 0 && scorers.length > 0 && goalsAssigned >= ourScore) return null;
                  return (
                    <View
                      key={p.id}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
                        borderBottomWidth: index === squad.length - 1 ? 0 : 1, borderBottomColor: tokens.border,
                      }}
                    >
                      <Pressable
                        accessibilityLabel={`${p.gamertag} add goal`}
                        onPress={() => bumpScorer(p.id, 1)}
                        style={{
                          minWidth: 28, height: 22, borderRadius: 6, paddingHorizontal: 6,
                          backgroundColor: tokens.card, borderWidth: 1, borderColor: tokens.cyan,
                          alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Text style={{ color: tokens.cyanHi, fontSize: 10, fontWeight: '700' }}>{goals || '+'}</Text>
                      </Pressable>
                      <Text style={{ flex: 1, color: tokens.text, fontSize: 13 }} numberOfLines={1}>{p.gamertag}</Text>
                      {goals > 0 ? (
                        <Pressable onPress={() => bumpScorer(p.id, -1)} accessibilityLabel={`${p.gamertag} remove goal`}>
                          <Text style={{ color: tokens.muted, fontSize: 13 }}>×{goals}</Text>
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </Card>
            ) : null}

            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 }}>
              <View style={{
                width: 64, height: 44, borderRadius: 8, borderWidth: 1, borderColor: tokens.border,
                backgroundColor: tokens.bgDeep, alignItems: 'center', justifyContent: 'center',
              }}
              >
                {proofPreview ? (
                  <Image source={{ uri: proofPreview }} style={{ width: 64, height: 44, borderRadius: 8 }} />
                ) : (
                  <Ionicons name={proofUrl ? 'checkmark' : 'image-outline'} size={22} color={proofUrl ? tokens.success : tokens.muted} />
                )}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: tokens.text, fontWeight: '700', fontSize: 14 }}>
                  {proofUrl ? t('stage.reportResult.proofAdded') : t('stage.reportResult.addProof')}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 12, marginTop: 2 }} numberOfLines={2}>
                  {proofUrl
                    ? `${proofName || 'proof'} · ${needsProof ? t('stage.reportResult.proofRequiredHint') : t('stage.reportResult.proofOptional')}`
                    : (needsProof ? t('stage.reportResult.proofRequiredHint') : t('stage.reportResult.proofOptional'))}
                </Text>
              </View>
              <View style={{ width: 96 }}>
                <Button
                  title={proofUrl ? t('stage.reportResult.replace') : t('stage.reportResult.add')}
                  variant="secondary"
                  loading={uploading}
                  onPress={pickProof}
                />
              </View>
            </Card>

            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <Ionicons name="information-circle-outline" size={16} color={tokens.muted} style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, color: tokens.muted, fontSize: 12, lineHeight: 18 }}>
                {t('stage.reportResult.pensHint')}
              </Text>
            </View>

            {formError ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{formError}</Text> : null}
          </View>
        ) : null}
      </ResourceState>

      {match && sides?.isMyMatch ? (
        <StickyCtaBar testID="report-result-cta">
          <SuccessButton
            title={t('stage.reportResult.send')}
            loading={submitting}
            disabled={uploading}
            onPress={submit}
          />
        </StickyCtaBar>
      ) : null}
    </Screen>
  );
}
