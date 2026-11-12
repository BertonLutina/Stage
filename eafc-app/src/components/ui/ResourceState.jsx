import React from 'react';
import { Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import useThemeStore from '@/store/themeStore';
import useT from '@/hooks/useT';
import Card from './Card';
import Button from './Button';
import SkeletonList from './Skeleton';

/** Empty card: icon, title, optional body and action. */
export function EmptyState({ icon = 'albums-outline', title, body, actionLabel, onAction, testID = 'empty-state' }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }} testID={testID}>
      <Ionicons name={icon} size={34} color={tokens.muted} />
      <Text style={{ color: tokens.text, fontSize: 15, fontWeight: '700', textAlign: 'center' }}>{title}</Text>
      {body ? (
        <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>{body}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <View style={{ alignSelf: 'stretch', paddingTop: 6 }}>
          <Button title={actionLabel} variant="secondary" onPress={onAction} />
        </View>
      ) : null}
    </Card>
  );
}

/** Error card with a Retry button. */
export function ErrorState({ message, onRetry, testID = 'error-state' }) {
  const tokens = useThemeStore((s) => s.tokens);
  const t = useT();
  return (
    <Card style={{ gap: 14, alignItems: 'center' }} testID={testID}>
      <Ionicons name="cloud-offline-outline" size={30} color={tokens.muted} />
      <Text accessibilityRole="alert" style={{ color: tokens.danger, textAlign: 'center' }}>
        {message || t('stage.state.error')}
      </Text>
      {onRetry ? (
        <View style={{ alignSelf: 'stretch' }}>
          <Button title={t('stage.state.retry')} variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </Card>
  );
}

/**
 * The four states every Stage screen handles:
 *   loading (first load only) -> skeletons, error -> message + Retry,
 *   empty -> `empty` node, otherwise `children`.
 * While refreshing, previously loaded content stays on screen.
 */
export default function ResourceState({
  loading = false,
  error = null,
  isEmpty = false,
  onRetry,
  empty,
  skeleton,
  children,
}) {
  if (loading) return skeleton || <SkeletonList />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  if (isEmpty) return empty || null;
  return <>{children}</>;
}
