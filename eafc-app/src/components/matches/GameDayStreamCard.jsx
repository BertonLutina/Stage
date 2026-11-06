import React, { useState } from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, Card, SectionLabel, TextField } from '@/components/ui';
import { MIN_TOUCH } from '@/components/ui/metrics';

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function GameDayStreamCard({ game, isMyMatch, amIHomeTeam, isCompleted, onGameUpdate }) {
  const tokens = useThemeStore((st) => st.tokens);
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const myKey = amIHomeTeam ? 'home_stream_url' : 'away_stream_url';
  const myUrl = game?.[myKey];
  const homeUrl = game?.home_stream_url;
  const awayUrl = game?.away_stream_url;
  const canManage = isMyMatch && !isCompleted;

  const save = async () => {
    if (url && !isValidUrl(url)) {
      setError('Enter a valid http(s) stream URL');
      return;
    }
    setError('');
    const updated = await stageClient.entities.Match.update(game.id, { [myKey]: url || '' });
    onGameUpdate?.({ ...game, ...updated, [myKey]: url || '' });
    setEditing(false);
  };

  return (
    <Card style={{ gap: 4 }}>
      <SectionLabel>STREAMS</SectionLabel>
      <StreamRow label="Home" url={homeUrl} />
      <StreamRow label="Away" url={awayUrl} />
      {canManage && !editing ? (
        <TouchableOpacity
          onPress={() => { setUrl(myUrl || ''); setEditing(true); }}
          accessibilityRole="button"
          style={{ minHeight: MIN_TOUCH, justifyContent: 'center' }}
        >
          <Text style={{ color: tokens.cyan, fontWeight: '600', fontSize: 14 }}>
            {myUrl ? 'Edit my stream' : 'Add my stream link'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {editing ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <TextField
            accessibilityLabel="Stream link"
            value={url}
            onChangeText={setUrl}
            placeholder="https://twitch.tv/..."
            autoCapitalize="none"
            error={error || undefined}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Button title="Save" onPress={save} />
            </View>
            <TouchableOpacity
              onPress={() => setEditing(false)}
              accessibilityRole="button"
              style={{ minHeight: MIN_TOUCH, minWidth: MIN_TOUCH, paddingHorizontal: 12, justifyContent: 'center' }}
            >
              <Text style={{ color: tokens.muted, fontSize: 15, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </Card>
  );
}

function StreamRow({ label, url }) {
  const tokens = useThemeStore((st) => st.tokens);
  return (
    <TouchableOpacity
      disabled={!url}
      onPress={() => url && Linking.openURL(url)}
      accessibilityRole={url ? 'link' : undefined}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: MIN_TOUCH }}
    >
      <Ionicons name="radio" size={18} color={url ? tokens.cyan : tokens.borderStrong} />
      <Text numberOfLines={1} style={{ color: url ? tokens.text : tokens.muted, fontSize: 14, flex: 1 }}>
        {label} · {url ? 'Watch stream' : 'No link yet'}
      </Text>
      {url ? <Ionicons name="open-outline" size={18} color={tokens.cyan} /> : null}
    </TouchableOpacity>
  );
}
