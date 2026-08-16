import React, { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  DESK_FILTERS,
  filterCompetitionFields,
  filterDeskFeed,
  formatDeskClock,
  loadNewsDesk,
} from '@/lib/stageNews';
import {
  BoardList,
  FieldCard,
  FieldDetail,
  FilterChips,
  StoryCard,
  StoryDetail,
  Stamp,
  WindowLine,
} from './NewsPaperParts';
import { paperStyles as s } from './newsPaperStyles';

export default function NewsBeatDesk({ section, onOpenClub, onOpenPlayer, onOpenTournament, onOpenMercato }) {
  const [desk, setDesk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [selectedFieldId, setSelectedFieldId] = useState('');
  const isCompetition = section === 'tournament' || section === 'competitions';

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setFilter('all');
    setQuery('');
    setSelectedId('');
    setSelectedFieldId('');
    loadNewsDesk(section)
      .then((data) => { if (alive) setDesk(data); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [section]);

  const filters = DESK_FILTERS[section] || DESK_FILTERS.daily_news;
  const feed = useMemo(() => filterDeskFeed(desk?.feed, { filter, query }), [desk, filter, query]);
  const fields = useMemo(
    () => filterCompetitionFields(desk?.fields, { filter, query }),
    [desk, filter, query],
  );

  const selectedStory = feed.find((row) => row.id === selectedId) || feed[0] || null;
  const selectedField = fields.find((row) => row.id === (selectedFieldId || selectedStory?.tournament_id)) || fields[0] || null;

  if (loading) {
    return <Text style={s.loading}>Opening the desk…</Text>;
  }

  return (
    <View style={s.desk}>
      <WindowLine>{desk?.kicker || 'Desk'} · {desk?.line || 'Live tape'}</WindowLine>
      <FilterChips options={filters} value={filter} onChange={setFilter} />
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Club, player, country…"
        placeholderTextColor="#4a3724"
        style={s.search}
        autoCorrect={false}
        autoCapitalize="none"
      />

      <Text style={[s.sectionHead, { marginTop: 14 }]}>
        {isCompetition ? 'Competition Live' : 'Live tape'}
      </Text>
      {isCompetition && fields.length === 0 && feed.length === 0 ? (
        <Text style={s.empty}>No cups on this desk yet.</Text>
      ) : null}
      {!isCompetition && feed.length === 0 ? (
        <Text style={s.empty}>
          {section === 'daily_news' ? 'No news today.' : 'No stories on this desk yet.'}
        </Text>
      ) : null}

      {isCompetition ? (
        <>
          {fields.map((row) => (
            <TouchableOpacity
              key={`field-${row.id}`}
              onPress={() => { setSelectedFieldId(row.id); setSelectedId(''); }}
              style={[s.tapeRow, row.id === selectedField?.id ? s.tapeRowActive : null]}
            >
              <View style={s.tapeMeta}>
                <Stamp kind={row.current_phase}>{row.stamp}</Stamp>
              </View>
              <Text style={s.tapeTitle}>{row.name}</Text>
            </TouchableOpacity>
          ))}
          {feed.map((row) => (
            <TouchableOpacity
              key={row.id}
              onPress={() => { setSelectedId(row.id); setSelectedFieldId(row.tournament_id || ''); }}
              style={[s.tapeRow, row.id === selectedStory?.id ? s.tapeRowActive : null]}
            >
              <View style={s.tapeMeta}>
                <Text style={s.tapeTime}>{formatDeskClock(row.published_at)}</Text>
                <Stamp kind={row.kind}>{row.stamp}</Stamp>
              </View>
              <Text style={s.tapeTitle}>{row.title}</Text>
            </TouchableOpacity>
          ))}
          <FieldCard field={selectedField} selected onSelect={(row) => setSelectedFieldId(row.id)} />
          {selectedStory && selectedStory.tournament_id === selectedField?.id ? (
            <StoryCard story={selectedStory} selected />
          ) : null}
          <FieldDetail field={selectedField} onOpenTournament={onOpenTournament} />
          {selectedStory ? (
            <StoryDetail
              story={selectedStory}
              onOpenClub={onOpenClub}
              onOpenPlayer={onOpenPlayer}
              onOpenTournament={onOpenTournament}
              onOpenMercato={onOpenMercato}
            />
          ) : null}
        </>
      ) : (
        <>
          {feed.map((row) => (
            <TouchableOpacity
              key={row.id}
              onPress={() => setSelectedId(row.id)}
              style={[s.tapeRow, row.id === selectedStory?.id ? s.tapeRowActive : null]}
            >
              <View style={s.tapeMeta}>
                <Text style={s.tapeTime}>{formatDeskClock(row.published_at)}</Text>
                <Stamp kind={row.kind}>{row.stamp}</Stamp>
              </View>
              <Text style={s.tapeTitle}>{row.title}</Text>
            </TouchableOpacity>
          ))}
          <StoryCard story={selectedStory} selected onSelect={(row) => setSelectedId(row.id)} />
          <StoryDetail
            story={selectedStory}
            onOpenClub={onOpenClub}
            onOpenPlayer={onOpenPlayer}
            onOpenTournament={onOpenTournament}
            onOpenMercato={onOpenMercato}
          />
        </>
      )}

      {section === 'club_news' ? (
        <>
          <BoardList title="Stadium" rows={desk?.board?.stadium} onSelect={(row) => setSelectedId(row.id)} empty="No stadium moves." />
          <BoardList title="Shirts" rows={desk?.board?.shirts} onSelect={(row) => setSelectedId(row.id)} empty="No shirt sales." />
          <BoardList title="Contracts issued" rows={desk?.board?.contracts} onSelect={(row) => setSelectedId(row.id)} empty="No club contracts." />
        </>
      ) : null}
      {section === 'player_news' ? (
        <>
          <BoardList title="Rankings" rows={desk?.board?.rankings} onSelect={(row) => setSelectedId(row.id)} empty="No ranking bulletin." />
          <BoardList title="Lifestyle" rows={desk?.board?.lifestyle} onSelect={(row) => setSelectedId(row.id)} empty="No lifestyle buys." />
          <BoardList title="Signed" rows={desk?.board?.signed} onSelect={(row) => setSelectedId(row.id)} empty="No signatures." />
        </>
      ) : null}
      {section === 'daily_news' ? (
        <>
          <BoardList title="Club" rows={desk?.board?.club} onSelect={(row) => setSelectedId(row.id)} empty="No club stories today." />
          <BoardList title="Player" rows={desk?.board?.player} onSelect={(row) => setSelectedId(row.id)} empty="No player stories today." />
          <BoardList title="Mercato" rows={desk?.board?.mercato} onSelect={(row) => setSelectedId(row.id)} empty="No deals today." />
        </>
      ) : null}
      {isCompetition ? (
        <>
          <BoardList title="Live" rows={desk?.board?.live} onSelect={(row) => setSelectedFieldId(row.id)} empty="No live cups." />
          <BoardList title="The field" rows={desk?.board?.field} onSelect={(row) => setSelectedFieldId(row.id)} empty="No open registrations." />
          <BoardList title="Champions" rows={desk?.board?.champions} onSelect={(row) => setSelectedFieldId(row.id)} empty="No champions yet." />
        </>
      ) : null}
    </View>
  );
}
