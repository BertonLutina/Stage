import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { stageClient } from '@/api/stageClient';
import { buildTrophyCollection, loadTrophyCatalogue, nextCabinetSpot } from '@/lib/trophyCollection';
import {
  CABINET_ASPECT_RATIO,
  clampPercent,
  normalizePlacementCoords,
  trophyPixelSize,
} from '@/lib/trophyCabinetLayout';

const emptyReport = { awards: [], placements: [], discrepancies: [], titles: { all_time: 0, official_ranking: 0 } };

function DraggableDraftTrophy({
  placement,
  editMode,
  cabinetSize,
  onMoveEnd,
  onDetails,
  onNudge,
  onRemove,
}) {
  const [live, setLive] = useState(null);
  const liveRef = useRef(null);
  const startRef = useRef({ x: 0, y: 0 });

  const x = live?.x ?? clampPercent(placement.x_percent);
  const y = live?.y ?? clampPercent(placement.y_percent);
  const scale = Number(placement.scale || 1);
  const width = trophyPixelSize(cabinetSize?.width || 320, scale);

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => editMode,
    onMoveShouldSetPanResponder: (_, gesture) => editMode && (Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2),
    onPanResponderGrant: () => {
      startRef.current = { x: clampPercent(placement.x_percent), y: clampPercent(placement.y_percent) };
      const next = { ...startRef.current };
      liveRef.current = next;
      setLive(next);
    },
    onPanResponderMove: (_, gesture) => {
      if (!cabinetSize?.width || !cabinetSize?.height) return;
      const next = {
        x: clampPercent(startRef.current.x + (gesture.dx / cabinetSize.width) * 100),
        y: clampPercent(startRef.current.y + (gesture.dy / cabinetSize.height) * 100),
      };
      liveRef.current = next;
      setLive(next);
    },
    onPanResponderRelease: () => {
      const next = liveRef.current;
      setLive(null);
      liveRef.current = null;
      if (!next) return;
      if (
        Math.abs(next.x - Number(placement.x_percent)) < 0.2
        && Math.abs(next.y - Number(placement.y_percent)) < 0.2
      ) return;
      onMoveEnd?.(placement, next.x, next.y);
    },
    onPanResponderTerminate: () => {
      setLive(null);
      liveRef.current = null;
    },
  }), [editMode, cabinetSize?.width, cabinetSize?.height, placement.x_percent, placement.y_percent, placement, onMoveEnd]);

  return (
    <View
      {...(editMode ? pan.panHandlers : {})}
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        width,
        marginLeft: -width / 2,
        marginTop: -width / 2,
        zIndex: live ? 20 : 5,
        opacity: live ? 0.92 : 1,
        transform: [{ scale: live ? 1.08 : 1 }],
      }}
    >
      {placement.trophy_image_url ? (
        <Image source={{ uri: placement.trophy_image_url }} style={{ width: width * 0.9, height: width * 0.9, alignSelf: 'center' }} resizeMode="contain" />
      ) : (
        <Text style={{ color: '#fbbf24', fontSize: Math.max(22, width * 0.45), textAlign: 'center' }}>🏆</Text>
      )}
      <Text numberOfLines={2} style={{ color: '#fff', fontSize: 9, textAlign: 'center' }}>{placement.trophy_name || 'Trophy'}</Text>
      <Pressable accessibilityRole="button" onPress={onDetails}>
        <Text style={{ color: '#9ef7ff', fontSize: 10, textAlign: 'center' }}>Details</Text>
      </Pressable>
      {editMode ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center', marginTop: 2 }}>
          <Pressable onPress={() => onNudge?.(placement, -4, 0)}><Text style={{ color: '#9ef7ff', fontSize: 10 }}>←</Text></Pressable>
          <Pressable onPress={() => onNudge?.(placement, 4, 0)}><Text style={{ color: '#9ef7ff', fontSize: 10 }}>→</Text></Pressable>
          <Pressable onPress={() => onNudge?.(placement, 0, -4)}><Text style={{ color: '#9ef7ff', fontSize: 10 }}>↑</Text></Pressable>
          <Pressable onPress={() => onNudge?.(placement, 0, 4)}><Text style={{ color: '#9ef7ff', fontSize: 10 }}>↓</Text></Pressable>
          <Pressable onPress={() => onRemove?.(placement)}><Text style={{ color: '#fb7185', fontSize: 10 }}>Remove</Text></Pressable>
        </View>
      ) : null}
      {editMode ? (
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8, textAlign: 'center', marginTop: 2 }}>
          Drag to move
        </Text>
      ) : null}
    </View>
  );
}

export default function TrophyCabinetPanel({ ownerId, ownerType, canEdit = false }) {
  const [report, setReport] = useState(emptyReport);
  const [catalogue, setCatalogue] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [selectedAwardId, setSelectedAwardId] = useState('');
  const [entitlementError, setEntitlementError] = useState('');
  const [catalogueError, setCatalogueError] = useState('');
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cabinetSize, setCabinetSize] = useState({ width: 320, height: 320 / CABINET_ASPECT_RATIO });
  const requestId = useRef(0);
  const reportRef = useRef(emptyReport);
  const inflight = useRef(Promise.resolve());

  const remember = (next) => {
    reportRef.current = next || emptyReport;
    setReport(reportRef.current);
  };

  const load = useCallback(async () => {
    if (!ownerId || !ownerType) return;
    const token = requestId.current + 1;
    requestId.current = token;
    setLoading(true);
    setEntitlementError('');
    setCatalogueError('');
    const params = new URLSearchParams({ owner_id: String(ownerId), owner_type: ownerType });
    const [history, designs] = await Promise.all([
      stageClient.http.get(`/trophy-placements/entitlements?${params}`).then(
        (data) => ({ data }),
        (error) => ({ error }),
      ),
      loadTrophyCatalogue(({ limit, offset }) => stageClient.entities.TrophyItem.filter({ offset }, 'sort_order', limit)).then(
        (items) => ({ items }),
        (error) => ({ error }),
      ),
    ]);
    if (requestId.current !== token) return;
    if (history.error) {
      setEntitlementError(history.error.message || 'Trophy history failed to load');
      remember(emptyReport);
    } else remember(history.data || emptyReport);
    if (designs.error) {
      setCatalogueError(designs.error.message || 'Trophy catalogue failed to load');
      setCatalogue([]);
    } else setCatalogue(designs.items || []);
    setLoading(false);
  }, [ownerId, ownerType]);

  useEffect(() => {
    setEditMode(false);
    setSelectedAwardId('');
    load();
  }, [load]);

  const awards = report.awards || [];
  const placements = (report.placements || []).filter((placement) => awards.some((award) => (
    placement.award_id ? award.id === placement.award_id : !award.persisted && award.trophy_item_id === placement.trophy_item_id
  ))).map((placement) => {
    const award = awards.find((item) => (placement.award_id ? item.id === placement.award_id : item.trophy_item_id === placement.trophy_item_id));
    return {
      ...placement,
      award,
      trophy_name: award?.display_name || award?.name || placement.trophy_name,
      trophy_image_url: award?.image_url || placement.trophy_image_url,
    };
  });
  const entries = buildTrophyCollection(catalogue, entitlementError ? null : awards, placements);

  async function mutate(action) {
    setPending((count) => count + 1);
    const token = requestId.current;
    const job = inflight.current.catch(() => {}).then(async () => {
      await action();
      if (requestId.current !== token) return false;
      const params = new URLSearchParams({ owner_id: String(ownerId), owner_type: ownerType });
      remember(await stageClient.http.get(`/trophy-placements/entitlements?${params}`));
      return true;
    }).catch(async (error) => {
      Alert.alert('Cabinet change failed', error?.message || 'The trophy was not saved.');
      if (requestId.current === token) {
        try {
          const params = new URLSearchParams({ owner_id: String(ownerId), owner_type: ownerType });
          remember(await stageClient.http.get(`/trophy-placements/entitlements?${params}`));
        } catch {
          // Keep the last cabinet if the reload also fails.
        }
      }
      return false;
    });
    inflight.current = job.then(() => {}, () => {});
    try {
      return await job;
    } finally {
      setPending((count) => Math.max(0, count - 1));
    }
  }

  function chosenAward(entry) {
    return entry.available.find((award) => award.id === selectedAwardId) || entry.available[0] || null;
  }

  async function place(entry) {
    if (!editMode || !canEdit) return;
    if (entry.available.length > 1 && !entry.available.some((award) => award.id === selectedAwardId)) {
      Alert.alert('Choose a copy', 'Choose the competition copy before placing this design.');
      return;
    }
    const award = chosenAward(entry);
    if (!award || placements.some((placement) => placement.award_id === award.id)) return;
    const spot = nextCabinetSpot(placements);
    const coords = normalizePlacementCoords({
      x_percent: spot.x,
      y_percent: spot.y,
      scale: 1,
    });
    await mutate(() => stageClient.entities.TrophyPlacement.create({
      owner_id: ownerId,
      owner_type: ownerType,
      award_id: award.id,
      ...coords,
    }));
  }

  function savePosition(placement, xPercent, yPercent, scale) {
    if (placement.locked_at || !placement.award_id) return;
    const coords = normalizePlacementCoords({
      x_percent: xPercent,
      y_percent: yPercent,
      ...(scale != null ? { scale } : {}),
    });
    // Optimistic local move — percentages are device-independent.
    remember({
      ...reportRef.current,
      placements: (reportRef.current.placements || []).map((row) => (
        row.id === placement.id ? { ...row, ...coords } : row
      )),
    });
    mutate(() => stageClient.entities.TrophyPlacement.update(placement.id, coords));
  }

  function move(placement, dx, dy, dScale = 0) {
    if (placement.locked_at || !placement.award_id) return;
    savePosition(
      placement,
      Number(placement.x_percent) + dx,
      Number(placement.y_percent) + dy,
      dScale ? Number(placement.scale || 1) + dScale : undefined,
    );
  }

  function copyLabel(award) {
    const name = award.display_name || award.competition_name || 'Earned copy';
    return award.edition_label && !name.includes(String(award.edition_label)) ? `${name} · ${award.edition_label}` : name;
  }

  async function done() {
    await inflight.current.catch(() => {});
    const drafts = (reportRef.current.placements || []).filter((placement) => placement.award_id && !placement.locked_at);
    if (!drafts.length) {
      setEditMode(false);
      return;
    }
    const names = drafts.map((placement) => placement.trophy_name || 'Trophy').join(', ');
    Alert.alert(
      `Permanently place ${names}?`,
      'Once confirmed, these trophies cannot be moved, resized, removed, or replaced.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            const saved = await mutate(() => stageClient.http.post(
              `/trophy-placements/confirm/${ownerType}/${ownerId}`,
              { placement_ids: drafts.map((placement) => placement.id) },
            ));
            if (saved) setEditMode(false);
          },
        },
      ],
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '800' }}>
          Trophy Cabinet · {report.titles?.all_time || 0} honours
        </Text>
        {canEdit ? (
          <Pressable disabled={pending > 0} onPress={() => (editMode ? done() : setEditMode(true))}>
            <Text style={{ color: '#9ef7ff', fontWeight: '800' }}>{editMode ? 'Done' : 'Edit'}</Text>
          </Pressable>
        ) : null}
      </View>
      {entitlementError ? (
        <Text style={{ color: '#fb7185' }} onPress={load}>{entitlementError} Tap to retry.</Text>
      ) : null}
      {catalogueError ? (
        <Text style={{ color: '#fb7185' }} onPress={load}>{catalogueError} Tap to retry the catalogue.</Text>
      ) : null}
      {loading ? <Text style={{ color: 'rgba(255,255,255,0.55)' }}>Loading trophy history...</Text> : null}
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setCabinetSize({ width, height });
        }}
        style={{
          width: '100%',
          aspectRatio: CABINET_ASPECT_RATIO,
          maxHeight: 420,
          borderWidth: 1,
          borderColor: editMode ? 'rgba(251,191,36,0.35)' : 'rgba(255,255,255,0.12)',
          backgroundColor: 'rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {placements.length === 0 ? (
          <Text style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 90 }}>
            {editMode ? 'Place a trophy from the collection below, then drag it around.' : 'No trophies placed yet.'}
          </Text>
        ) : placements.map((placement) => {
          const canDrag = editMode && !placement.locked_at && !!placement.award_id;
          if (canDrag) {
            return (
              <DraggableDraftTrophy
                key={placement.id}
                placement={placement}
                editMode
                cabinetSize={cabinetSize}
                onMoveEnd={(row, nextX, nextY) => savePosition(row, nextX, nextY)}
                onNudge={move}
                onRemove={(row) => mutate(() => stageClient.entities.TrophyPlacement.delete(row.id))}
                onDetails={() => Alert.alert(placement.trophy_name || 'Earned trophy', [
                  placement.award?.competition_name,
                  placement.award?.edition_label,
                  placement.award?.winning_name,
                  placement.award?.format,
                  placement.award?.participant_count == null ? null : `${placement.award.participant_count} participants`,
                  placement.locked_at ? 'Permanent placement' : 'Draft — drag to rearrange',
                ].filter(Boolean).join('\n'))}
              />
            );
          }
          return (
            <View
              key={placement.id}
              style={{
                position: 'absolute',
                left: `${clampPercent(placement.x_percent)}%`,
                top: `${clampPercent(placement.y_percent)}%`,
                width: trophyPixelSize(cabinetSize.width, placement.scale),
                marginLeft: -trophyPixelSize(cabinetSize.width, placement.scale) / 2,
                marginTop: -trophyPixelSize(cabinetSize.width, placement.scale) / 2,
              }}
            >
              {placement.trophy_image_url ? (
                <Image
                  source={{ uri: placement.trophy_image_url }}
                  style={{
                    width: trophyPixelSize(cabinetSize.width, placement.scale) * 0.9,
                    height: trophyPixelSize(cabinetSize.width, placement.scale) * 0.9,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <Text style={{ color: '#fbbf24', fontSize: Math.max(22, trophyPixelSize(cabinetSize.width, placement.scale) * 0.45) }}>🏆</Text>
              )}
              <Text numberOfLines={2} style={{ color: '#fff', fontSize: 9 }}>{placement.trophy_name || 'Trophy'}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => Alert.alert(placement.trophy_name || 'Earned trophy', [
                  placement.award?.competition_name,
                  placement.award?.edition_label,
                  placement.award?.winning_name,
                  placement.locked_at ? 'Permanent placement' : 'Draft placement',
                ].filter(Boolean).join('\n'))}
              >
                <Text style={{ color: '#9ef7ff', fontSize: 10 }}>Details</Text>
              </Pressable>
            </View>
          );
        })}
        {editMode && placements.some((p) => !p.locked_at && p.award_id) ? (
          <Text style={{
            position: 'absolute',
            bottom: 6,
            alignSelf: 'center',
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'rgba(251,191,36,0.85)',
            fontSize: 10,
            fontWeight: '700',
          }}
          >
            Drag drafts to rearrange · Done locks them
          </Text>
        ) : null}
      </View>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, letterSpacing: 1 }}>TROPHY COLLECTION</Text>
      {!editMode && canEdit ? (
        <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
          Tap Edit to place unlocked trophies and drag them inside the cabinet.
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator>
        {(entries.length ? entries : []).map((entry) => (
          <View key={entry.design.id} style={{ width: 120, marginRight: 10, padding: 8, borderWidth: 1, borderColor: entry.state === 'available' ? 'rgba(251,191,36,0.45)' : 'rgba(255,255,255,0.12)' }}>
            <Text numberOfLines={2} style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>{entry.design.name}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 4 }}>
              {entry.state === 'locked' || entry.state === 'placed' ? 'Locked · ' : ''}{entry.label}
            </Text>
            {entry.available.map((award) => (
              <Pressable key={award.id} accessibilityRole="button" onPress={() => setSelectedAwardId(award.id)}>
                <Text style={{ color: selectedAwardId === award.id ? '#fbbf24' : 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 }}>
                  {copyLabel(award)}
                </Text>
              </Pressable>
            ))}
            <Pressable accessibilityRole="button" disabled={entry.state !== 'available' || !editMode || pending > 0} onPress={() => place(entry)}>
              <Text style={{ color: entry.state === 'available' && editMode ? '#9ef7ff' : 'rgba(255,255,255,0.3)', marginTop: 8, fontWeight: '800' }}>Place</Text>
            </Pressable>
          </View>
        ))}
        {!entries.length ? (
          <Text style={{ color: 'rgba(255,255,255,0.45)' }}>
            {catalogueError || entitlementError ? 'Trophy collection could not be loaded.' : 'No trophies in the library yet.'}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
