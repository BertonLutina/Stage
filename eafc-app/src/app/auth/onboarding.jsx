import React, { useEffect, useState } from 'react';
import {
  View,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import STText from '../../components/common/STText';
import PlayerSetup from '../../components/onboarding/PlayerSetup';
import IdentityClaimSetup from '../../components/onboarding/IdentityClaimSetup';
import FounderPlayerTermsSetup from '../../components/onboarding/FounderPlayerTermsSetup';
import ClubSetup from '../../components/onboarding/ClubSetup';
import DiscordJoinStep from '../../components/onboarding/DiscordJoinStep';
import PresidentContractSetup from '../../components/onboarding/PresidentContractSetup';
import TutorialPopup from '../../components/onboarding/TutorialPopup';
import { ONB, onboardingStyles as s } from '../../components/onboarding/onboardingStyles';
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
  { value: 'Europe/Brussels', label: 'Brussels' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Amsterdam', label: 'Amsterdam' },
  { value: 'America/New_York', label: 'New York' },
  { value: 'America/Los_Angeles', label: 'Los Angeles' },
  { value: 'America/Toronto', label: 'Toronto' },
  { value: 'Africa/Lagos', label: 'Lagos' },
  { value: 'Africa/Johannesburg', label: 'Johannesburg' },
  { value: 'Asia/Dubai', label: 'Dubai' },
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
  if (step === 'player') return { label: 'Player profile', index: 1, total: dual ? 7 : 3 };
  if (step === 'identity') return { label: 'Verify identity', index: 2, total: dual ? 7 : 3 };
  if (step === 'founder_terms' && dual) return { label: 'Player wages', index: 3, total: 7 };
  if (step === 'club' && dual) {
    return phase === 'club'
      ? { label: 'Club profile', index: 5, total: 7 }
      : { label: 'President status', index: 4, total: 7 };
  }
  if (step === 'president_contract' && dual) {
    return { label: 'President contract', index: 6, total: 7 };
  }
  return { label: 'Choose role', index: 0, total: 2 };
}

function timezoneCity(value) {
  return TIMEZONES.find((z) => z.value === value)?.label || String(value || '').split('/')[1] || value;
}

function StepDots({ index, total }) {
  return (
    <View style={styles.dots} accessibilityRole="progressbar">
      {Array.from({ length: Math.max(total, 1) }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === index && styles.dotCurrent,
            i < index && styles.dotDone,
          ]}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [player, setPlayer] = useState(null);
  const [step, setStep] = useState('choose');
  const [intent, setIntent] = useState('player');
  const [clubSetupPhase, setClubSetupPhase] = useState('president');
  const [foundedClub, setFoundedClub] = useState(null);
  const [founderState, setFounderState] = useState(null);
  const [founderPlayerTerms, setFounderPlayerTerms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [timezone, setTimezone] = useState(detectTimezone);
  const [showTimezone, setShowTimezone] = useState(false);

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

  const handleClubComplete = (nextFounderState) => {
    setFounderState(nextFounderState || null);
    setFoundedClub(nextFounderState?.club || null);
    setStep('president_contract');
  };

  const meta = getStepMeta(intent, step, clubSetupPhase);
  const canGoBack = step !== 'choose' && step !== 'club' && step !== 'president_contract' && step !== 'discord';
  const goBack = () => setStep(step === 'founder_terms' ? 'identity' : step === 'identity' ? 'player' : 'choose');

  return (
    <View style={styles.root}>
      <ImageBackground source={BANNER} style={styles.hero} resizeMode="cover">
        <View style={styles.heroScrim} />
        <SafeAreaView edges={['top']} style={styles.heroSafe}>
          <View style={styles.topBar}>
            {canGoBack ? (
              <TouchableOpacity onPress={goBack} style={styles.backBtn} accessibilityLabel="Back">
                <Ionicons name="chevron-back" size={22} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtn} />
            )}
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <View style={styles.backBtn} />
          </View>
          {step !== 'choose' && step !== 'discord' ? (
            <View style={styles.progressRow}>
              <STText style={styles.progressLabel}>{meta.label}</STText>
              <StepDots index={meta.index} total={meta.total} />
            </View>
          ) : null}
        </SafeAreaView>
      </ImageBackground>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={ONB.cyan} size="large" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 'choose' ? (
              <View style={styles.choose}>
                <STText style={s.title}>Who are you on the pitch?</STText>
                <STText style={s.subtitle}>
                  Pick a path. You can add the other role later from settings.
                </STText>

                <TouchableOpacity
                  style={[s.roleCard, styles.pathPlayer]}
                  onPress={() => {
                    setOnboardingIntent('player', 'player');
                    setStep('player');
                  }}
                  activeOpacity={0.88}
                >
                  <View style={[styles.pathIcon, { backgroundColor: 'rgba(0,240,255,0.14)' }]}>
                    <Ionicons name="football-outline" size={22} color={ONB.cyan} />
                  </View>
                  <STText style={[s.roleTitle, { color: ONB.cyan }]}>Player</STText>
                  <STText style={s.roleDesc}>Get a profile, get verified, get signed.</STText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.roleCard, styles.pathBoth]}
                  onPress={() => {
                    setOnboardingIntent('both', 'player');
                    setStep('player');
                  }}
                  activeOpacity={0.88}
                >
                  <View style={[styles.pathIcon, { backgroundColor: 'rgba(255,214,10,0.14)' }]}>
                    <Ionicons name="shield-outline" size={22} color={ONB.amber} />
                  </View>
                  <STText style={[s.roleTitle, { color: ONB.amber }]}>Player + President</STText>
                  <STText style={s.roleDesc}>Play and run your own club from day one.</STText>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowTimezone((open) => !open)}
                  style={styles.tzToggle}
                  accessibilityLabel="Change timezone"
                >
                  <Ionicons name="time-outline" size={16} color={ONB.muted} />
                  <STText style={styles.tzText}>Match times · {timezoneCity(timezone)}</STText>
                  <Ionicons name={showTimezone ? 'chevron-up' : 'chevron-down'} size={16} color={ONB.faint} />
                </TouchableOpacity>
                {showTimezone ? (
                  <View style={s.chipRow}>
                    {TIMEZONES.map((z) => (
                      <TouchableOpacity
                        key={z.value}
                        onPress={() => {
                          setTimezone(z.value);
                          stageClient.auth.updateTimezone(z.value).catch(() => {});
                          setShowTimezone(false);
                        }}
                        style={[s.chip, timezone === z.value && s.chipActive]}
                      >
                        <STText style={[s.chipText, timezone === z.value && s.chipTextActive]}>{z.label}</STText>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : null}
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
                <STText style={s.title}>You are set</STText>
                <STText style={s.subtitle}>
                  {player.gamertag || user?.email} is ready. Next we link your platform identity.
                </STText>
                <TouchableOpacity onPress={() => setStep('identity')} style={s.primaryBtn}>
                  <STText style={s.primaryBtnText}>Continue</STText>
                </TouchableOpacity>
              </View>
            ) : null}

            {step === 'identity' && player ? (
              <IdentityClaimSetup
                player={player}
                onComplete={() => {
                  if (intent === 'both') setStep('founder_terms');
                  else finishOnboarding();
                }}
              />
            ) : null}

            {step === 'founder_terms' && intent === 'both' ? (
              <FounderPlayerTermsSetup
                initialTerms={founderPlayerTerms}
                onComplete={(terms) => {
                  setFounderPlayerTerms(terms);
                  setStep('club');
                }}
              />
            ) : null}

            {step === 'club' && intent === 'both' ? (
              <ClubSetup
                onComplete={handleClubComplete}
                onPhaseChange={setClubSetupPhase}
                player={player}
                user={user}
                playerContract={founderPlayerTerms}
                required
              />
            ) : null}

            {step === 'president_contract' && intent === 'both' ? (
              <PresidentContractSetup
                club={foundedClub}
                player={player}
                user={user}
                founderState={founderState}
                playerContract={founderPlayerTerms}
                onComplete={finishOnboarding}
              />
            ) : null}

            {step === 'discord' ? (
              <DiscordJoinStep
                onSkip={() => setTutorialOpen(true)}
                onContinue={() => setTutorialOpen(true)}
              />
            ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      <TutorialPopup open={tutorialOpen} onClose={finish} intent={intent} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ONB.bg },
  hero: { height: 168 },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,7,15,0.55)',
  },
  heroSafe: { flex: 1, justifyContent: 'space-between', paddingBottom: 12 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { height: 40, width: 120 },
  progressRow: {
    paddingHorizontal: 20,
    gap: 10,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '700',
  },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  dotCurrent: {
    width: 18,
    backgroundColor: ONB.cyan,
  },
  dotDone: {
    backgroundColor: 'rgba(0,240,255,0.45)',
  },
  body: {
    flex: 1,
    backgroundColor: ONB.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -16,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },
  choose: { flexGrow: 1 },
  pathPlayer: {
    borderColor: 'rgba(0,240,255,0.28)',
    backgroundColor: 'rgba(0,240,255,0.06)',
  },
  pathBoth: {
    borderColor: 'rgba(255,214,10,0.28)',
    backgroundColor: 'rgba(255,214,10,0.06)',
  },
  pathIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  tzToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    marginTop: 8,
  },
  tzText: {
    flex: 1,
    color: ONB.muted,
    fontSize: 14,
    fontWeight: '600',
  },
});
