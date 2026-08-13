import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, ActivityIndicator,
} from 'react-native';
import { resolveMyPlayerAndClub } from '@/api/stageClient';
import { readAccountIntent, writeAccountIntent } from '@/lib/accountIntent';
import { writeAccountMode } from '@/lib/accountMode';
import { localStorage } from '@/lib/polyfillStorage';
import ClubSetup from '@/components/onboarding/ClubSetup';
import PlayerSetup from '@/components/onboarding/PlayerSetup';
import SettingsSection from './SettingsSection';
import { AMBER, CYAN } from '@/components/profile/gamer/GamerProfileUI';

export default function AccountRoleUpgradeSection({ t }) {
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
          <ActivityIndicator color={CYAN} size="small" />
          <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
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
          <TouchableOpacity
            onPress={() => setClubDialogOpen(true)}
            style={{
              backgroundColor: AMBER,
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#1A1200', fontWeight: '900', letterSpacing: 0.6 }}>
              {t('settingsPage.roleUpgradePlayerButton')}
            </Text>
          </TouchableOpacity>
        </SettingsSection>
      ) : null}

      {canUpgradePresidentToPlayer ? (
        <SettingsSection
          title={t('settingsPage.roleUpgradeTitle')}
          description={t('settingsPage.roleUpgradePresidentDesc')}
          icon="shield-outline"
        >
          <TouchableOpacity
            onPress={() => setPlayerDialogOpen(true)}
            style={{
              backgroundColor: CYAN,
              borderRadius: 12,
              paddingVertical: 13,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#041018', fontWeight: '900', letterSpacing: 0.6 }}>
              {t('settingsPage.roleUpgradePresidentButton')}
            </Text>
          </TouchableOpacity>
        </SettingsSection>
      ) : null}

      <Modal visible={clubDialogOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setClubDialogOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#111a2f', paddingTop: 16 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
              {t('settingsPage.roleUpgradePlayerDialogTitle')}
            </Text>
            <TouchableOpacity onPress={() => setClubDialogOpen(false)}>
              <Text style={{ color: CYAN, fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <ClubSetup player={player} user={user} required onComplete={handleClubUpgradeComplete} />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={playerDialogOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPlayerDialogOpen(false)}>
        <View style={{ flex: 1, backgroundColor: '#111a2f', paddingTop: 16 }}>
          <View style={{ paddingHorizontal: 16, paddingBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 16 }}>
              {t('settingsPage.roleUpgradePresidentDialogTitle')}
            </Text>
            <TouchableOpacity onPress={() => setPlayerDialogOpen(false)}>
              <Text style={{ color: CYAN, fontWeight: '800' }}>Close</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <PlayerSetup user={user} intent="player" onComplete={handlePlayerUpgradeComplete} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
}
