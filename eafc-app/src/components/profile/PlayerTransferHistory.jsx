import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { GamerSectionCard, useGamerTokens } from '@/components/profile/gamer/GamerProfileUI';
import { CAREER_LABELS, formatCareerFee } from '@/lib/playerCareer';

export default function PlayerTransferHistory({ playerId }) {
  const tokens = useGamerTokens();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!playerId) return undefined;
    let alive = true;
    stageClient.http.get(`/mercato-transfers/players/${playerId}`)
      .then((data) => { if (alive) setRows(Array.isArray(data) ? data : []); })
      .catch(() => { if (alive) setRows([]); });
    return () => { alive = false; };
  }, [playerId]);

  return (
    <GamerSectionCard eyebrow={CAREER_LABELS.transferEyebrow} title={CAREER_LABELS.transferHistory}>
      {!playerId || rows.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 18, gap: 8 }}>
          <Ionicons name="time-outline" size={22} color={tokens.faint} />
          <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase' }}>
            {CAREER_LABELS.noTransfers}
          </Text>
          <Text style={{ color: tokens.faint, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>
            {CAREER_LABELS.noTransfersHint}
          </Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {rows.map((row) => (
            <View
              key={row.id}
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: tokens.border,
                backgroundColor: tokens.inputFill,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={{ color: tokens.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                  {row.from_club_name || 'Academy / Free'} → {row.to_club_name || 'Unknown'}
                </Text>
                <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12, textTransform: 'uppercase', marginTop: 3 }}>
                  {(row.transfer_date || row.published_at || '').slice(0, 4) || '—'}
                  {' · '}
                  {row.deal_type_label || row.deal_type || 'Transfer'}
                </Text>
              </View>
              <Text style={{ color: tokens.cyan, fontSize: 14, fontWeight: '700' }}>
                {formatCareerFee(row.transfer_fee, row.currency)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </GamerSectionCard>
  );
}
