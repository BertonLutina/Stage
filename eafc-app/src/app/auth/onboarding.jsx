import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import STText from '../../components/common/STText';
import PlayerSetup from '../../components/onboarding/PlayerSetup';
import IdentityClaimSetup from '../../components/onboarding/IdentityClaimSetup';
import ClubSetup from '../../components/onboarding/ClubSetup';
import DiscordJoinStep from '../../components/onboarding/DiscordJoinStep';
import TutorialPopup from '../../components/onboarding/TutorialPopup';
import { onboardingStyles as s } from '../../components/onboarding/onboardingStyles';
import {
  resolveMyPlayerAndClub,
  stageClient,
  userNeedsOnboarding,
} from '../../api/stageClient';
import { writeAccountIntent } from '../../lib/accountIntent';
import { isDiscordConfigured } from '../../lib/discordConfig';
import { markOnboardingComplete } from '../../services/onboardingService';
import { localStorage } from '../../lib/polyfillStorage';

const BANNER = require('../../../assets/Banner.jpg');
const LOGO = require('../../../assets/stadium-logo.png');

const TIMEZONES = [
  { value: 'Europe/Brussels', label: 'Brussels — Europe/Brussels' },
  { value: 'Europe/London', label: 'London — Europe/London' },
  { value: 'Europe/Paris', label: 'Paris — Europe/Paris' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam — Europe/Amsterdam' },
  { value: 'America/New_York', label: 'New York — America/New_York' },
  { value: 'America/Los_Angeles', label: 'Los Angeles — America/Los_Angeles' },
  { value: 'America/Toronto', label: 'Toronto — America/Toronto' },
  { value: 'Africa/Lagos', label: 'Lagos — Africa/Lagos' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg — Africa/Johannesburg' },
  { value: 'Asia/Dubai', label: 'Dubai — Asia/Dubai' },
];

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Brussels';
  } catch {
    return 'Europe/Brussels';
  }
}

function getStepMeta(intent, step, phase) {
  const dual = intent === 'both';
  if (step === 'player') return { label: 'Player profile', index: 1, total: dual ? 5 : 3 };
  if (step === 'identity') return { label: 'Verify identity', index: 2, total: dual ? 5 : 3 };
  if (step === 'club' && dual) {
    return phase === 'club'
      ? { label: 'Club profile', index: 4, total: 5 }
      : { label: 'President profile', index: 3, total: 5 };
  }
  if (step === 'owner_club') {
    return phase === 'club'
      ? { label: 'Club profile', index: 2, total: 3 }
      : { label: 'President profile', index: 1, total: 3 };
  }
  return { label: 'Choose role', index: 0, total: 2 };
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [step, setStep] = useState('choose');
  const [intent, setIntent] = useState('player');
  const [clubSetupPhase, setClubSetupPhase] = useState('president');
  const [loading, setLoading] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [timezone, setTimezone] = useState(detectTimezone);

  const finish = async () => {
    if (user?.id) await markOnboardingComplete(user.id);
    setTutorialOpen(false);
    router.replace('/(tabs)/dashboard');
  };

  useEffect(() => {
    (async () => {
      try {
        const { user: u, player: pl } = await resolveMyPlayerAndClub();
        setUser(u);
        const nextTz = u?.timezone || detectTimezone();
        setTimezone(nextTz);
        if (!u?.timezone) stageClient.auth.updateTimezone(nextTz).catch(() => {});
        if (pl) setPlayer(pl);

        const force = Boolean(u?.id && userNeedsOnboarding(u.id));
        if ((u?.player_id || pl?.id) && !force && (pl?.country || pl?.gamertag)) {
          await markOnboardingComplete(u.id);
          router.replace('/(tabs)/dashboard');
          return;
        }
      } catch (err) {
        console.error('Onboarding load failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const setOnboardingIntent = (nextIntent, accountMode) => {
    setIntent(nextIntent);
    writeAccountIntent(nextIntent, user?.id);
    try {
      localStorage.setItem('stage-account-mode', accountMode);
    } catch {
      /* ignore */
    }
  };

  const handlePlayerComplete = async (optimisticPlayer = null) => {
    try {
      const { player: updated } = await resolveMyPlayerAndClub();
      setPlayer(updated || optimisticPlayer);
      setStep('identity');
    } catch {
      if (optimisticPlayer) {
        setPlayer(optimisticPlayer);
        setStep('identity');
      }
    }
  };

  const finishOnboarding = () => {
    stageClient.auth.updateTimezone(timezone).catch(() => {});
    if (isDiscordConfigured()) setStep('discord');
    else setTutorialOpen(true);
  };

  const meta = getStepMeta(intent, step, clubSetupPhase);
  const progress = (meta.index / Math.max(meta.total - 1, 1)) * 100;

  return (
    <ImageBackground source={BANNER} style={styles.bg} resizeMode="cover" blurRadius={6}>
      <View style={styles.scrim} pointerEvents="none" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.nav}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#fff" size="large" />
            <STText style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, letterSpacing: 2, fontSize: 11 }}>
              LOADING…
            </STText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              {step !== 'choose' && step !== 'discord' ? (
                <View style={{ marginBottom: 20 }}>
                  <STText style={{ color: 'rgba(255,255,255,0.40)', fontSize: 10, letterSpacing: 3, marginBottom: 8 }}>
                    STEP {meta.index} OF {meta.total - 1} · {meta.label.toUpperCase()}
                  </STText>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, progress)}%` }]} />
                  </View>
                </View>
              ) : null}

              {step === 'choose' ? (
                <View>
                  <STText style={[s.title, { fontStyle: 'italic', textAlign: 'center', fontSize: 24 }]}>
                    How do you play?
                  </STText>
                  <STText style={[s.subtitle, { textAlign: 'center' }]}>
                    Choose your role on STAGE. You can grow into more later.
                  </STText>

                  <View style={styles.tzBox}>
                    <STText style={s.label}>Timezone</STText>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {TIMEZONES.map((z) => (
                        <TouchableOpacity
                          key={z.value}
                          onPress={() => {
                            setTimezone(z.value);
                            stageClient.auth.updateTimezone(z.value).catch(() => {});
                          }}
                          style={[s.chip, timezone === z.value && s.chipActive]}
                        >
                          <STText style={[s.chipText, timezone === z.value && s.chipTextActive]}>
                            {z.value.split('/')[1] || z.value}
                          </STText>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <STText style={{ color: 'rgba(255,255,255,0.40)', fontSize: 11, marginTop: 8, lineHeight: 16 }}>
                      Used for match times, Game Day, inbox, and schedules.
                    </STText>
                  </View>

                  <TouchableOpacity
                    style={[s.roleCard, { borderColor: 'rgba(59,130,246,0.35)' }]}
                    onPress={() => {
                      setOnboardingIntent('player', 'player');
                      setStep('player');
                    }}
                  >
                    <STText style={[s.roleTitle, { color: '#60A5FA' }]}>Player</STText>
                    <STText style={s.roleDesc}>
                      Create a player profile, claim your identity, and get signed on contract.
                    </STText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.roleCard, { borderColor: 'rgba(245,158,11,0.35)' }]}
                    onPress={() => {
                      setOnboardingIntent('president', 'club');
                      setClubSetupPhase('president');
                      setStep('owner_club');
                    }}
                  >
                    <STText style={[s.roleTitle, { color: '#FBBF24' }]}>President</STText>
                    <STText style={s.roleDesc}>
                      Found a club, build a squad, and enter competitions as club owner.
                    </STText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.roleCard, { borderColor: 'rgba(52,211,153,0.35)' }]}
                    onPress={() => {
                      setOnboardingIntent('both', 'player');
                      setStep('player');
                    }}
                  >
                    <STText style={[s.roleTitle, { color: '#34D399' }]}>Player + President</STText>
                    <STText style={s.roleDesc}>
                      Compete as a player and run your own club at the same time.
                    </STText>
                  </TouchableOpacity>

                  <View style={styles.plusBox}>
                    <STText style={{ color: '#A5F3FC', fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>
                      STAGE PLUS
                    </STText>
                    <STText style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 18, marginTop: 6 }}>
                      Start free with 50 credits. Plus unlocks official competitions, creation tools, rankings, and 150 monthly credits.
                    </STText>
                  </View>
                </View>
              ) : null}

              {step === 'player' && (!player || !player.country) ? (
                <PlayerSetup
                  onComplete={handlePlayerComplete}
                  user={user}
                  initialPlayer={player}
                  intent={intent}
                />
              ) : null}

              {step === 'player' && player?.country ? (
                <View>
                  <STText style={s.title}>Profile ready</STText>
                  <STText style={s.subtitle}>
                    {player.gamertag || user?.email} is set. Continue to identity verification.
                  </STText>
                  <TouchableOpacity onPress={() => setStep('identity')} style={s.primaryBtn}>
                    <STText style={s.primaryBtnText}>Continue verification</STText>
                  </TouchableOpacity>
                </View>
              ) : null}

              {step === 'identity' && player ? (
                <IdentityClaimSetup
                  player={player}
                  onComplete={() => {
                    if (intent === 'both') setStep('club');
                    else finishOnboarding();
                  }}
                />
              ) : null}

              {step === 'club' && intent === 'both' ? (
                <ClubSetup
                  onComplete={finishOnboarding}
                  onPhaseChange={setClubSetupPhase}
                  player={player}
                  user={user}
                  required
                />
              ) : null}

              {step === 'owner_club' ? (
                <ClubSetup
                  onComplete={finishOnboarding}
                  onPhaseChange={setClubSetupPhase}
                  player={player}
                  user={user}
                  required
                />
              ) : null}

              {step === 'discord' ? (
                <DiscordJoinStep
                  onSkip={() => setTutorialOpen(true)}
                  onContinue={() => setTutorialOpen(true)}
                />
              ) : null}

              {step !== 'choose' && step !== 'club' && step !== 'owner_club' && step !== 'discord' ? (
                <TouchableOpacity
                  onPress={() => setStep(step === 'identity' ? 'player' : 'choose')}
                  style={s.ghostBtn}
                >
                  <STText style={s.ghostBtnText}>← Back</STText>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>

      <TutorialPopup open={tutorialOpen} onClose={finish} intent={intent} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2,9,27,0.72)',
  },
  safe: { flex: 1 },
  nav: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  logo: { height: 56, width: 140 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    borderRadius: 16,
    padding: 24,
  },
  progressTrack: {
    height: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 999,
  },
  tzBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 14,
    marginBottom: 16,
  },
  plusBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(103,232,249,0.25)',
    backgroundColor: 'rgba(103,232,249,0.08)',
    padding: 14,
    marginTop: 4,
  },
});
