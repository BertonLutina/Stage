import React, { useEffect, useState } from 'react';
import {
  View, Text, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import useThemeStore from '@/store/themeStore';
import { Button, IconButton } from '@/components/ui';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { readAccountIntent, writeAccountIntent } from '@/lib/accountIntent';
import { writeAccountMode } from '@/lib/accountMode';
import { localStorage } from '@/lib/polyfillStorage';
import ClubSetup from '@/components/onboarding/ClubSetup';
import PlayerSetup from '@/components/onboarding/PlayerSetup';
import SettingsSection from './SettingsSection';

function UpgradeDialogHeader({ title, onClose }) {
  const tokens = useThemeStore((s) => s.tokens);
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      <Text
        numberOfLines={2}
        style={{
          flex: 1,
          color: tokens.text,
          fontFamily: FONT_EA_SPORTS,
          fontSize: 20,
          letterSpacing: 20 * 0.03,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      <IconButton icon="close" accessibilityLabel="Close" onPress={onClose} />
    </View>
  );
}

export default function AccountRoleUpgradeSection({ t }) {
  const tokens = useThemeStore((s) => s.tokens);
  const [loading, setLoading] = useState(true);
  const [clubDialogOpen, setClubDialogOpen] = useState(false);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [presidentClub, setPresidentClub] = useState(null);
  const [accountIntent, setAccountIntent] = useState('player');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const resolved = await resolveMyPlayerAndClub();
        if (cancelled) return;
        setUser(resolved?.user || null);
        setPlayer(resolved?.player || null);
        setPresidentClub(resolved?.presidentClub || null);
        setAccountIntent(resolved?.user?.id ? readAccountIntent(resolved.user.id) : 'player');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const canUpgradePlayerToPresident = accountIntent === 'player' && Boolean(player?.id && !presidentClub?.id);
  const canUpgradePresidentToPlayer = accountIntent === 'president' && Boolean(presidentClub?.id && !player?.id);

  function handleClubUpgradeComplete(founderState) {
    const club = founderState?.club || founderState;
    setClubDialogOpen(false);
    if (!club?.id || !user?.id) return;
    writeAccountIntent('both', user.id);
    writeAccountMode('club');
    setAccountIntent('both');
    setPresidentClub(club);
    localStorage.setItem('stage-account-mode', 'club');
    localStorage.setItem('stage_club_id', club.id);
    localStorage.setItem('stage_owner_id', club.id);
    localStorage.setItem('stage_president_club_id', club.id);
  }

  function handlePlayerUpgradeComplete(savedPlayer) {
    setPlayerDialogOpen(false);
    if (!savedPlayer?.id || !user?.id || !presidentClub?.id) return;
    writeAccountIntent('both', user.id);
    writeAccountMode('player');
    setAccountIntent('both');
    setPlayer(savedPlayer);
    localStorage.setItem('stage-account-mode', 'player');
    localStorage.setItem('stage_player_id', savedPlayer.id);
    localStorage.setItem('stage_club_id', presidentClub.id);
    localStorage.setItem('stage_owner_id', presidentClub.id);
    localStorage.setItem('stage_president_club_id', presidentClub.id);
  }

  if (loading) {
    return (
      <SettingsSection
        title={t('settingsPage.roleUpgradeTitle')}
        description={t('settingsPage.roleUpgradeLoading')}
        icon="shield-outline"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color={tokens.cyan} size="small" />
          <Text style={{ color: tokens.muted, fontSize: 13 }}>
            {t('settingsPage.roleUpgradeLoading')}
          </Text>
        </View>
      </SettingsSection>
    );
  }

  if (!canUpgradePlayerToPresident && !canUpgradePresidentToPlayer) return null;

  return (
    <>
      {canUpgradePlayerToPresident ? (
        <SettingsSection
          title={t('settingsPage.roleUpgradeTitle')}
          description={t('settingsPage.roleUpgradePlayerDesc')}
          icon="shield-outline"
        >
          <Button
            title={t('settingsPage.roleUpgradePlayerButton')}
            onPress={() => setClubDialogOpen(true)}
          />
        </SettingsSection>
      ) : null}

      {canUpgradePresidentToPlayer ? (
        <SettingsSection
          title={t('settingsPage.roleUpgradeTitle')}
          description={t('settingsPage.roleUpgradePresidentDesc')}
          icon="shield-outline"
        >
          <Button
            title={t('settingsPage.roleUpgradePresidentButton')}
            onPress={() => setPlayerDialogOpen(true)}
          />
        </SettingsSection>
      ) : null}

      <Modal visible={clubDialogOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setClubDialogOpen(false)}>
        <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: 16 }}>
          <UpgradeDialogHeader
            title={t('settingsPage.roleUpgradePlayerDialogTitle')}
            onClose={() => setClubDialogOpen(false)}
          />
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <ClubSetup player={player} user={user} required onComplete={handleClubUpgradeComplete} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={playerDialogOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPlayerDialogOpen(false)}>
        <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: 16 }}>
          <UpgradeDialogHeader
            title={t('settingsPage.roleUpgradePresidentDialogTitle')}
            onClose={() => setPlayerDialogOpen(false)}
          />
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <PlayerSetup user={user} intent="player" onComplete={handlePlayerUpgradeComplete} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
