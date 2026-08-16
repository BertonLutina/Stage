import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { filterDeskFeed, formatDeskClock, loadNewsDesk } from '@/lib/stageNews';
import { Stamp, StoryCard, StoryDetail, WindowLine } from './NewsPaperParts';
import WorldAtlas from './WorldAtlas';
import { PAPER, paperStyles as s } from './newsPaperStyles';

function flagFromCode(code) {
  const normalized = String(code || '').toUpperCase();
  if (normalized.length !== 2) return '';
  return String.fromCodePoint(...[...normalized].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));
}

function countryLabel(row) {
  const flag = flagFromCode(row.code);
  return `${flag ? `${flag} ` : ''}${row.name || row.code}`;
}

export default function WorldNewsDesk({
  initialContinent = '',
  initialCountry = '',
  onOpenClub,
  onOpenPlayer,
  onOpenTournament,
  onOpenMercato,
}) {
  const [desk, setDesk] = useState(null);
  const [loading, setLoading] = useState(true);
  const [continent, setContinent] = useState(initialContinent);
  const [country, setCountry] = useState(initialCountry);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('');

  useEffect(() => {
    let alive = true;
    loadNewsDesk('world_news')
      .then((data) => { if (alive) setDesk(data); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const continents = Array.isArray(desk?.continents) ? desk.continents : [];
  const countries = useMemo(() => {
    const rows = Array.isArray(desk?.countries) ? desk.countries : [];
    return continent ? rows.filter((row) => row.continent === continent) : rows;
  }, [desk, continent]);

  const feed = useMemo(
    () => filterDeskFeed(
      (desk?.feed || []).filter((row) => {
        if (continent && row.continent !== continent) return false;
        if (country && String(row.country_code || '').toUpperCase() !== country) return false;
        return true;
      }),
      { query },
    ),
    [desk, continent, country, query],
  );
  const selected = feed.find((row) => row.id === selectedId) || feed[0] || null;
  const active = continents.find((row) => row.id === continent);
  const activeCountry = countries.find((row) => row.code === country);

  const pickContinent = (id) => {
    setContinent(id);
    setCountry('');
    setSelectedId('');
  };

  const pickCountry = (code) => {
    const next = String(code || '').toUpperCase();
    const match = (desk?.countries || []).find((row) => row.code === next);
    if (match?.continent) setContinent(match.continent);
    setCountry(next);
    setSelectedId('');
  };

  if (loading) {
    return <Text style={s.loading}>Opening the world desk…</Text>;
  }

  return (
    <View style={s.desk}>
      <WindowLine
        right={continent ? (
          <Pressable onPress={() => { setContinent(''); setCountry(''); setSelectedId(''); }} style={s.worldBack}>
            <Text style={s.worldBackText}>Whole world</Text>
          </Pressable>
        ) : null}
      >
        {desk?.kicker || 'World News'} · {activeCountry?.name || active?.name || 'Geographic desk'}
      </WindowLine>

      <WorldAtlas continents={continents} selectedId={continent} onSelect={pickContinent} />

      <Text style={s.worldCountryLabel}>Country</Text>
      {continent || country ? (
        <View style={s.worldCountryChips}>
          <Pressable
            onPress={() => { setCountry(''); setSelectedId(''); }}
            style={[s.worldCountryChip, !country ? s.worldCountryChipActive : null]}
          >
            <Text style={[s.worldCountryChipText, !country ? s.worldCountryChipTextActive : null]}>
              All countries
            </Text>
          </Pressable>
          {countries.map((row) => (
            <Pressable
              key={row.code}
              onPress={() => pickCountry(row.code)}
              style={[s.worldCountryChip, country === row.code ? s.worldCountryChipActive : null]}
            >
              <Text style={[s.worldCountryChipText, country === row.code ? s.worldCountryChipTextActive : null]}>
                {countryLabel(row)} · {row.count}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={s.worldHint}>Select a country after a continent on the map.</Text>
      )}

      {continent || country ? (
        <>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Club, player, country…"
            placeholderTextColor={PAPER.inkSoft}
            style={s.search}
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Text style={[s.sectionHead, { marginTop: 14 }]}>{activeCountry?.name || active?.name || 'World'} Live</Text>
          {feed.length === 0 ? <Text style={s.empty}>No news from this place yet.</Text> : null}
          {feed.map((row) => (
            <Pressable
              key={row.id}
              onPress={() => setSelectedId(row.id)}
              style={[s.tapeRow, row.id === selected?.id ? s.tapeRowActive : null]}
            >
              <View style={s.tapeMeta}>
                <Text style={s.tapeTime}>{formatDeskClock(row.published_at)}</Text>
                <Stamp kind={row.kind}>{row.stamp}</Stamp>
              </View>
              <Text style={s.tapeTitle}>{row.title}</Text>
            </Pressable>
          ))}
          <StoryCard story={selected} selected onSelect={(row) => setSelectedId(row.id)} />
          <StoryDetail
            story={selected}
            onOpenClub={onOpenClub}
            onOpenPlayer={onOpenPlayer}
            onOpenTournament={onOpenTournament}
            onOpenMercato={onOpenMercato}
          />
        </>
      ) : null}
    </View>
  );
}
