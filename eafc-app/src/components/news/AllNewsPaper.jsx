import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { loadNews } from '@/lib/stageDirectories';
import { clubRoute, playerRoute } from '@/lib/stageNews';
import NewspaperFront from './NewspaperFront';
import { paperStyles as s } from './newsPaperStyles';

export default function AllNewsPaper({ onOpenClub, onOpenPlayer }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    loadNews()
      .then((data) => { if (alive) setItems(data.items || []); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  if (loading) {
    return <Text style={s.loading}>Opening the paper…</Text>;
  }

  const featured = items[0] || null;
  const rest = items.slice(1);

  return (
    <NewspaperFront
      featured={featured}
      rest={rest}
      empty="Nothing here yet."
      onSelect={(item) => {
        if (item.player_id && playerRoute(item.player_id)) onOpenPlayer?.(item.player_id);
        else if (item.club_id && clubRoute(item.club_id)) onOpenClub?.(item.club_id);
      }}
    />
  );
}
