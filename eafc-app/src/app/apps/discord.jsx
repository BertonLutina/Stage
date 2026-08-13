import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppDirectoryScreen from '@/components/apps/AppDirectoryScreen';
import { DISCORD_INVITE_URL, isDiscordConfigured } from '@/lib/discordConfig';

export default function DiscordScreen() {
  const open = () => {
    if (!DISCORD_INVITE_URL) return;
    Linking.openURL(DISCORD_INVITE_URL).catch(() => {});
  };

  return (
    <AppDirectoryScreen
      title="Discord"
      subtitle="Official STAGE community"
      data={[]}
      keyExtractor={() => 'empty'}
      renderItem={() => null}
      emptyText=" "
      ListHeaderComponent={(
        <View style={{
          borderRadius: 22,
          borderWidth: 1,
          borderColor: 'rgba(88,101,242,0.45)',
          backgroundColor: 'rgba(88,101,242,0.16)',
          padding: 22,
          alignItems: 'center',
          gap: 10,
        }}
        >
          <Ionicons name="logo-discord" size={36} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 20 }}>Join STAGE Discord</Text>
          <Text style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20 }}>
            Match news, free agents, and club chats — same invite as the web community page.
          </Text>
          {isDiscordConfigured() ? (
            <TouchableOpacity
              onPress={open}
              style={{
                marginTop: 8,
                minHeight: 48,
                paddingHorizontal: 22,
                borderRadius: 14,
                backgroundColor: '#5865F2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800' }}>Open Discord</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: 'rgba(255,255,255,0.45)' }}>Invite not configured</Text>
          )}
        </View>
      )}
    />
  );
}
