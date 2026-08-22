import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import { uploadLocalMedia } from '@/lib/uploadProfileMedia';
import { buildPlayerFeedPostPayload, playerFeedAuthorEmail } from '@/lib/playerFeedPost';
import { CARD_RADIUS } from '@/lib/stageTheme';
import useAuthStore from '@/store/authStore';
import {
  CYAN,
  EmptyTabPanel,
  GamerSectionCard,
  useGamerTokens,
} from '@/components/profile/gamer/GamerProfileUI';

function postAuthor(post, fallback) {
  return post.author_name || post.author_gamertag || post.gamertag || fallback || 'Player';
}

export default function ProfileFeedPanel({ player, isOwn }) {
  const tokens = useGamerTokens();
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [photo, setPhoto] = useState(null);
  const [posting, setPosting] = useState(false);
  const name = player?.gamertag || player?.display_name || 'Player';
  const authorEmail = playerFeedAuthorEmail(player, user);

  const loadPosts = async () => {
    if (!player?.id && !authorEmail) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = authorEmail
        ? await stageClient.entities.Post.filter({ author_email: authorEmail }, '-created_date', 40)
        : await stageClient.entities.Post.filter({ player_id: player.id }, '-created_date', 40);
      setPosts((Array.isArray(rows) ? rows : []).filter((post) => !post.club_id));
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [player?.id, authorEmail]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Photo library access is required to attach a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    setPhoto(result.assets[0]);
  };

  const publish = async () => {
    const content = draft.trim();
    if ((!content && !photo) || posting || !player?.id) return;
    setPosting(true);
    try {
      let mediaUrl = null;
      if (photo?.uri) {
        mediaUrl = await uploadLocalMedia(photo, { fallbackName: 'post.jpg' });
      }
      const created = await stageClient.entities.Post.create(
        buildPlayerFeedPostPayload({
          player,
          user,
          content,
          mediaUrl,
        }),
      );
      setDraft('');
      setPhoto(null);
      setPosts((prev) => [created, ...prev.filter(Boolean)]);
    } catch (err) {
      Alert.alert('Could not post', err?.message || 'Try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {isOwn ? (
        <GamerSectionCard>
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              {player?.avatar_url ? (
                <Image source={{ uri: player.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#0A1222' }} />
              ) : (
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,240,255,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="person" size={16} color={CYAN} />
                </View>
              )}
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="Share a moment with the community..."
                placeholderTextColor={tokens.faint}
                multiline
                accessibilityLabel="Share a moment with the community"
                style={{
                  flex: 1,
                  minHeight: 44,
                  color: tokens.text,
                  fontSize: 14,
                  lineHeight: 20,
                  paddingTop: 8,
                }}
              />
            </View>
            {photo?.uri ? (
              <Image source={{ uri: photo.uri }} style={{ width: '100%', height: 148, borderRadius: 6 }} resizeMode="cover" />
            ) : null}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={pickPhoto}
                accessibilityRole="button"
                accessibilityLabel="Photo"
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}
              >
                <Ionicons name="image-outline" size={16} color={tokens.muted} />
                <Text style={{ color: tokens.muted, fontSize: 12, fontWeight: '700' }}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={publish}
                disabled={posting || (!draft.trim() && !photo)}
                accessibilityRole="button"
                accessibilityLabel="Post"
                activeOpacity={0.88}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  minHeight: 40,
                  paddingHorizontal: 14,
                  borderRadius: 6,
                  backgroundColor: CYAN,
                  opacity: posting || (!draft.trim() && !photo) ? 0.45 : 1,
                }}
              >
                {posting ? (
                  <ActivityIndicator color="#041018" size="small" />
                ) : (
                  <Ionicons name="send" size={13} color="#041018" />
                )}
                <Text style={{ color: '#041018', fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GamerSectionCard>
      ) : null}

      {loading ? (
        <View style={{ paddingVertical: 24, alignItems: 'center' }}>
          <ActivityIndicator color={CYAN} />
        </View>
      ) : posts.length === 0 ? (
        <EmptyTabPanel
          icon="newspaper-outline"
          title="No posts yet"
          hint={isOwn ? 'Share updates from your player feed.' : `${name} has not posted yet.`}
        />
      ) : (
        posts.map((post) => (
          <View
            key={post.id}
            style={{
              borderRadius: CARD_RADIUS,
              borderWidth: 1,
              borderColor: 'rgba(0,240,255,0.14)',
              backgroundColor: tokens.cardSolid,
              padding: 14,
              gap: 8,
            }}
          >
            <Text style={{ color: tokens.muted, fontSize: 11, fontWeight: '700' }}>
              {postAuthor(post, name)}
              {post.created_date ? ` · ${String(post.created_date).slice(0, 10)}` : ''}
            </Text>
            {post.content ? (
              <Text style={{ color: tokens.text, fontSize: 14, lineHeight: 20 }}>{post.content}</Text>
            ) : null}
            {post.media_url ? (
              <Image source={{ uri: post.media_url }} style={{ width: '100%', height: 180, borderRadius: 6 }} resizeMode="cover" />
            ) : null}
          </View>
        ))
      )}
    </View>
  );
}
