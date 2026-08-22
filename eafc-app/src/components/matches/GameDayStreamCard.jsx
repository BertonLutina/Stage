import React, { useState } from 'react';
import { Linking, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function GameDayStreamCard({ game, isMyMatch, amIHomeTeam, isCompleted, onGameUpdate }) {
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
    <View style={card}>
      <Text style={title}>STREAMS</Text>
      <StreamRow label="Home" url={homeUrl} />
      <StreamRow label="Away" url={awayUrl} />
      {canManage && !editing ? (
        <TouchableOpacity
          onPress={() => { setUrl(myUrl || ''); setEditing(true); }}
          style={{ marginTop: 8 }}
        >
          <Text style={{ color: CYAN, fontWeight: '800', fontSize: 12 }}>
            {myUrl ? 'Edit my stream' : 'Add my stream link'}
          </Text>
        </TouchableOpacity>
      ) : null}
      {editing ? (
        <View style={{ gap: 8, marginTop: 8 }}>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://twitch.tv/..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            autoCapitalize="none"
            style={input}
          />
          {error ? <Text style={{ color: FUT.rose, fontSize: 11 }}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={save} style={saveBtn}>
              <Text style={{ color: '#041018', fontWeight: '900' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)} style={{ paddingVertical: 10 }}>
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function StreamRow({ label, url }) {
  return (
    <TouchableOpacity
      disabled={!url}
      onPress={() => url && Linking.openURL(url)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 }}
    >
      <Ionicons name="radio" size={14} color={url ? CYAN : 'rgba(255,255,255,0.25)'} />
      <Text style={{ color: url ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 12, flex: 1 }}>
        {label} · {url ? 'Watch stream' : 'No link yet'}
      </Text>
      {url ? <Ionicons name="open-outline" size={14} color={CYAN} /> : null}
    </TouchableOpacity>
  );
}

const card = {
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.1)',
  borderRadius: 2,
  padding: 14,
};
const title = { color: '#fff', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, marginBottom: 6 };
const input = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  paddingHorizontal: 12,
  paddingVertical: 10,
};
const saveBtn = {
  backgroundColor: CYAN,
  borderRadius: 10,
  paddingHorizontal: 16,
  paddingVertical: 10,
};
