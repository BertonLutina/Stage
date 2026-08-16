import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { filterNewsItems, loadNews } from '@/lib/stageDirectories';
import { clubRoute } from '@/lib/stageNews';
import NewspaperFront from './NewspaperFront';
import { paperStyles as s } from './newsPaperStyles';

export default function MercatoDesk({ onOpenClub, onOpenPlayer }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadNews()
      .then((data) => { if (alive) setItems(data.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => filterNewsItems(items, 'mercato'), [items]);
  const featured = filtered[0] || null;
  const rest = filtered.slice(1);

  if (loading) {
    return <Text style={s.loading}>Opening Mercato…</Text>;
  }

  return (
    <View>
      <NewspaperFront
        featured={featured}
        rest={rest}
        empty="No transfer or contract news yet."
        onSelect={(item) => {
          if (item.player_id) onOpenPlayer?.(item.player_id);
          else if (item.club_id && clubRoute(item.club_id)) onOpenClub?.(item.club_id);
        }}
      />
    </View>
  );
}
