import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
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

  if (!playerId || rows.length === 0) return null;

  return (
    <GamerSectionCard title={CAREER_LABELS.transferHistory}>
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
              borderColor: tokens.hairline,
              backgroundColor: tokens.inputFill,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: tokens.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                {row.from_club_name || 'Academy / Free'} → {row.to_club_name || 'Unknown'}
              </Text>
              <Text style={{ color: tokens.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 }}>
                {(row.transfer_date || row.published_at || '').slice(0, 4) || '—'}
                {' · '}
                {row.deal_type_label || row.deal_type || 'Transfer'}
              </Text>
            </View>
            <Text style={{ color: tokens.cyan, fontSize: 13, fontWeight: '900' }}>
              {formatCareerFee(row.transfer_fee, row.currency)}
            </Text>
          </View>
        ))}
      </View>
    </GamerSectionCard>
  );
}
