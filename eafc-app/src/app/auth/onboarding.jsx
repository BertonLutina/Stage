import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useThemeStore from '@/store/themeStore';
import { Screen, Card, Button, StepProgress } from '@/components/ui';
import { hexToRgba } from '@/lib/stageTheme';
import PlayerSetup from '../../components/onboarding/PlayerSetup';
import IdentityClaimSetup from '../../components/onboarding/IdentityClaimSetup';
import FounderPlayerTermsSetup from '../../components/onboarding/FounderPlayerTermsSetup';
import ClubSetup from '../../components/onboarding/ClubSetup';
import DiscordJoinStep from '../../components/onboarding/DiscordJoinStep';
import PresidentContractSetup from '../../components/onboarding/PresidentContractSetup';
import TutorialPopup from '../../components/onboarding/TutorialPopup';
import {
  StepHeader,
  StepHeading,
  OnboardingSelect,
  FormError,
} from '../../components/onboarding/OnboardingParts';
import {
  PlatformStep,
  PositionStep,
  GamertagStep,
  ClubChoiceStep,
} from '../../components/onboarding/PlayerOnboardingSteps';
import { savePlayerProfile } from '../../lib/savePlayerProfile';
import { STEP_GAP, useOnboardingStyles } from '../../components/onboarding/onboardingStyles';
import {
  resolveMyPlayerAndClub,
  stageClient,
  userNeedsOnboarding,
} from '../../api/stageClient';
import { writeAccountIntent } from '../../lib/accountIntent';
import { isDiscordConfigured } from '../../lib/discordConfig';
import { markOnboardingComplete } from '../../services/onboardingService';
import { isFinishedOnboardingProfile } from '../../lib/onboardingGate';
import { localStorage } from '../../lib/polyfillStorage';

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

/** Player-only branch: the mockup's 4 linear steps (Platform → Position → Gamertag → Club). */
const PLAYER_STEPS = {
  platform: { n: 1, back: 'choose' },
  position: { n: 2, back: 'platform' },
  gamertag: { n: 3, back: 'position' },
  club_player: { n: 4, back: 'gamertag' },
};

/** Index 0 is "Choose role" (no bar); every later step owns one bar. */
function StepDots({ index, total }) {
  return <StepProgress total={Math.max(total - 1, 1)} current={index} />;
}

function PathCard({ icon, tint, description, label, onPress, children }) {
  const tokens = useThemeStore((st) => st.tokens);
  const s = useOnboardingStyles();
  return (
    <Card onPress={onPress} accessibilityLabel={label}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: hexToRgba(tint, 0.14),
          marginBottom: 14,
        }}
      >
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      {children}
      <Text style={[s.cardBody, { marginTop: 4, color: tokens.muted }]}>{description}</Text>
    </Card>
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
  const [platform, setPlatform] = useState('PS5');
  const [playerPosition, setPlayerPosition] = useState('ST');
  const [gamertag, setGamertag] = useState('');
  const [country, setCountry] = useState('');
  const [linkProClub, setLinkProClub] = useState(false);
  const [clubChoice, setClubChoice] = useState('freeagent');
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [playerError, setPlayerError] = useState(null);
  const tokens = useThemeStore((st) => st.tokens);
  const s = useOnboardingStyles();

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
        // OAuth stubs have a gamertag immediately — that is not a finished profile.
        if (!force && isFinishedOnboardingProfile(pl)) {
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

  // Player branch (mockup flow): platform/position held in state, persisted once
  // at the Gamertag step via savePlayerProfile (the real backend write).
  const onGamertagContinue = async () => {
    if (!gamertag.trim() || !country) {
      setPlayerError('Gamertag and country are required');
      return;
    }
    setSavingPlayer(true);
    setPlayerError(null);
    try {
      const saved = await savePlayerProfile({
        user,
        gamertag,
        position: playerPosition,
        secondaryPosition: 'none',
        country,
        platform,
      });
      setPlayer(saved || player);
      setStep('club_player');
    } catch (err) {
      setPlayerError(err?.data?.error || err?.data?.message || err?.message || 'Failed to save profile');
    } finally {
      setSavingPlayer(false);
    }
  };

  const onClubChoiceFinish = async () => {
    if (clubChoice === 'create') {
      if (user?.id) await markOnboardingComplete(user.id);
      router.replace('/teams/createteamscreen');
      return;
    }
    finishOnboarding();
  };

  const handleClubComplete = (nextFounderState) => {
    setFounderState(nextFounderState || null);
    setFoundedClub(nextFounderState?.club || null);
    setStep('president_contract');
  };

  const playerStep = PLAYER_STEPS[step];
  const meta = getStepMeta(intent, step, clubSetupPhase);
  const canGoBack = step !== 'choose' && step !== 'club' && step !== 'president_contract' && step !== 'discord';
  const goBack = () => setStep(step === 'founder_terms' ? 'identity' : step === 'identity' ? 'player' : 'choose');

  return (
    <View style={{ flex: 1 }}>
      <Screen tabBar={false} keyboardAvoiding>
        {playerStep ? (
          <StepHeader
            onBack={() => setStep(playerStep.back)}
            label={`Step ${playerStep.n} of 4`}
            current={playerStep.n}
            total={4}
          />
        ) : (
          <>
            <StepHeader
              onBack={canGoBack ? goBack : null}
              label={step !== 'choose' && step !== 'discord' ? meta.label : ''}
            />
            {step !== 'choose' && step !== 'discord' ? (
              <View style={{ marginTop: STEP_GAP }}>
                <StepDots index={meta.index} total={meta.total} />
              </View>
            ) : null}
          </>
        )}

        <View style={{ flex: 1, marginTop: 20 }}>
          {loading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={tokens.cyan} size="large" />
            </View>
          ) : (
            <>
              {step === 'choose' ? (
                <View style={{ gap: 14 }}>
                  <StepHeading
                    title="Who are you on the pitch?"
                    subtitle="Pick a path. You can add the other role later from settings."
                  />

                  <PathCard
                    icon="football-outline"
                    tint={tokens.cyan}
                    label="Player"
                    description="Get a profile, get verified, get signed."
                    onPress={() => {
                      setOnboardingIntent('player', 'player');
                      setStep('platform');
                    }}
                  >
                    <Text style={[s.cardTitle, { color: tokens.cyan, fontSize: 20 }]}>Player</Text>
                  </PathCard>

                  <PathCard
                    icon="shield-outline"
                    tint={tokens.warning}
                    label="Player + President"
                    description="Play and run your own club from day one."
                    onPress={() => {
                      setOnboardingIntent('both', 'player');
                      setStep('player');
                    }}
                  >
                    <Text style={[s.cardTitle, { color: tokens.warning, fontSize: 20 }]}>Player + President</Text>
                  </PathCard>

                  <OnboardingSelect
                    label="Match times timezone"
                    value={timezone}
                    placeholder="Select timezone"
                    title="Timezone"
                    searchPlaceholder="Search…"
                    options={TIMEZONES.map((z) => ({ id: z.value, label: z.label }))}
                    onChange={(id) => {
                      setTimezone(id);
                      stageClient.auth.updateTimezone(id).catch(() => {});
                    }}
                  />
                </View>
              ) : null}

              {step === 'platform' ? (
                <View style={{ gap: STEP_GAP }}>
                  <PlatformStep value={platform} onChange={setPlatform} />
                  <Button title="Continue" onPress={() => setStep('position')} />
                </View>
              ) : null}

              {step === 'position' ? (
                <View style={{ gap: STEP_GAP }}>
                  <PositionStep value={playerPosition} onChange={setPlayerPosition} />
                  <Button title="Continue" onPress={() => setStep('gamertag')} />
                </View>
              ) : null}

              {step === 'gamertag' ? (
                <View style={{ gap: STEP_GAP }}>
                  <GamertagStep
                    gamertag={gamertag}
                    onChangeGamertag={setGamertag}
                    country={country}
                    onChangeCountry={setCountry}
                    linked={linkProClub}
                    onToggleLink={() => setLinkProClub((v) => !v)}
                  />
                  <FormError>{playerError}</FormError>
                  <Button title="Continue" onPress={onGamertagContinue} loading={savingPlayer} />
                </View>
              ) : null}

              {step === 'club_player' ? (
                <View style={{ gap: STEP_GAP }}>
                  <ClubChoiceStep value={clubChoice} onChange={setClubChoice} />
                  <Button title="Finish Setup" onPress={onClubChoiceFinish} />
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
                <View style={{ gap: STEP_GAP }}>
                  <StepHeading
                    title="You are set"
                    subtitle={`${player.gamertag || user?.email} is ready. Next we link your platform identity.`}
                  />
                  <Button title="Continue" onPress={() => setStep('identity')} />
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
            </>
          )}
        </View>
      </Screen>

      <TutorialPopup open={tutorialOpen} onClose={finish} intent={intent} />
    </View>
  );
}
