import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { Button, IconButton, SegmentedControl } from '@/components/ui';
import DateTimeZoneFields from '@/components/matches/DateTimeZoneFields';
import {
  ARRANGE_MAX_BET,
  ARRANGE_MIN_BET,
  formatKickoffLabel,
  formatOpponentLabel,
  sendArrangeGameInvite,
  validateArrangeWager,
} from '@/lib/arrangeGame';
import { readAccountMode } from '@/lib/accountMode';
import { detectTimezone } from '@/lib/timezones';

export default function ArrangeGameModal({ visible, onClose, myPlayer, myClub, onSent, presetOpponent, presetKind }) {
  const tokens = useThemeStore((s) => s.tokens);
  const isPresidentMode = readAccountMode() === 'club';
  const forcedType = isPresidentMode ? 'club' : 'player';
  const [step, setStep] = useState('search');
  const [searchType, setSearchType] = useState(forcedType);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState(null);
  const [recipientKind, setRecipientKind] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [timezone, setTimezone] = useState(detectTimezone);
  const [wagerStc, setWagerStc] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const matchType = isPresidentMode ? 'club' : searchType;
  const available = matchType === 'club' ? Number(myClub?.stc || 0) : Number(myPlayer?.stc || 0);
  const wagerError = validateArrangeWager(wagerStc, available);

  useEffect(() => {
    if (!visible) return;
    setSearchType(presetKind || forcedType);
    setStep(presetOpponent ? 'details' : 'search');
    setQuery('');
    setResults([]);
    setSelected(presetOpponent || null);
    setRecipientKind(presetKind || (presetOpponent ? (forcedType) : null));
    setDate('');
    setTime('');
    setTimezone(detectTimezone());
    setWagerStc('');
    setSending(false);
    setSent(false);
    setError('');
    stageClient.auth.me()
      .then((me) => {
        if (me?.timezone) setTimezone(me.timezone);
      })
      .catch(() => {});
  }, [visible, forcedType, presetOpponent, presetKind]);

  const resetAndClose = () => {
    onClose?.();
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setError('');
    try {
      const q = query.toLowerCase();
      if (matchType === 'club') {
        const all = await stageClient.entities.Club.list('-rating', 2000);
        setResults((all || []).filter((c) =>
          c.id !== myClub?.id
          && ((c.name || '').toLowerCase().includes(q) || (c.tag || '').toLowerCase().includes(q))
        ).slice(0, 10));
      } else {
        const all = await stageClient.entities.Player.list('-overall_rating', 2000);
        setResults((all || []).filter((p) =>
          p.id !== myPlayer?.id
          && (p.gamertag || '').toLowerCase().includes(q)
        ).slice(0, 10));
      }
    } catch (err) {
      setError(err?.message || 'Search failed');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const selectOpponent = (opponent, kind) => {
    setSelected(opponent);
    setRecipientKind(kind);
    setStep('details');
  };

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      await sendArrangeGameInvite({
        stageClient,
        myPlayer,
        myClub,
        matchType,
        opponent: selected,
        recipientKind,
        date,
        time,
        timezone,
        wagerStc,
      });
      setSent(true);
      setTimeout(() => {
        onSent?.();
        resetAndClose();
      }, 1200);
    } catch (err) {
      setError(err?.message || 'Failed to send invitation');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: tokens.overlay }}
      >
        <View style={{
          backgroundColor: tokens.bgDeep,
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderWidth: 1,
          borderColor: tokens.border,
          maxHeight: '92%',
          paddingBottom: 28,
        }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: tokens.border }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
            <Text numberOfLines={1} style={{ flex: 1, color: tokens.text, fontSize: 16, fontWeight: '700', letterSpacing: 0.5 }}>ARRANGE VS FIXTURE</Text>
            <IconButton icon="close" onPress={resetAndClose} accessibilityLabel="Close" />
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
            {sent ? (
              <View style={{ alignItems: 'center', paddingVertical: 36, gap: 8 }}>
                <Ionicons name="checkmark-circle-outline" size={42} color={tokens.success} />
                <Text style={{ color: tokens.text, fontSize: 16, fontWeight: '700' }}>Invitation sent</Text>
                <Text style={{ color: tokens.muted, fontSize: 13 }}>Waiting for the opponent to respond.</Text>
              </View>
            ) : step === 'search' ? (
              <>
                {!isPresidentMode && myClub ? (
                  <SegmentedControl
                    options={[
                      { key: 'player', label: 'PLAYER VS' },
                      { key: 'club', label: 'CLUB VS' },
                    ]}
                    value={searchType}
                    onChange={(type) => { setSearchType(type); setResults([]); setQuery(''); }}
                  />
                ) : null}

                <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 18 }}>
                  {matchType === 'player'
                    ? `You play as ${myPlayer?.gamertag || 'your player'}. The invite goes to the opponent inbox.`
                    : `${myClub?.name || 'Your club'} challenges another club. The invite goes to their president.`}
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    placeholder={matchType === 'club' ? 'Search clubs...' : 'Search players...'}
                    placeholderTextColor={tokens.muted}
                    selectionColor={tokens.cyan}
                    style={{ ...inputStyle(tokens), flex: 1 }}
                  />
                  <TouchableOpacity
                    onPress={handleSearch}
                    disabled={searching}
                    accessibilityRole="button"
                    accessibilityLabel="Search"
                    style={{
                      width: 50,
                      height: 50,
                      backgroundColor: tokens.cyan,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {searching
                      ? <ActivityIndicator color={tokens.onCyan} />
                      : <Ionicons name="search" size={22} color={tokens.onCyan} />}
                  </TouchableOpacity>
                </View>

                {results.map((row) => (
                  <TouchableOpacity
                    key={row.id}
                    onPress={() => selectOpponent(row, matchType)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      minHeight: 56,
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: tokens.border,
                    }}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      overflow: 'hidden',
                      backgroundColor: tokens.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    >
                      {row.logo_url || row.avatar_url ? (
                        <Image source={{ uri: row.logo_url || row.avatar_url }} style={{ width: 44, height: 44 }} />
                      ) : (
                        <Ionicons name={matchType === 'club' ? 'shield-outline' : 'person-outline'} size={22} color={tokens.cyanHi} />
                      )}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text numberOfLines={1} style={{ color: tokens.text, fontSize: 15, fontWeight: '600' }}>
                        {row.name || row.gamertag}
                        {row.tag ? ` [${row.tag}]` : ''}
                      </Text>
                      <Text numberOfLines={1} style={{ color: tokens.muted, fontSize: 12 }}>
                        {[row.platform, row.region, row.position].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={tokens.muted} />
                  </TouchableOpacity>
                ))}
              </>
            ) : step === 'details' ? (
              <>
                <TouchableOpacity onPress={() => setStep('search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
                  <Ionicons name="arrow-back" size={18} color={tokens.muted} />
                  <Text style={{ color: tokens.muted, fontSize: 14 }}>Back</Text>
                </TouchableOpacity>
                <Text numberOfLines={2} style={{ color: tokens.text, fontSize: 16, fontWeight: '700' }}>{formatOpponentLabel(selected, recipientKind)}</Text>
                <DateTimeZoneFields
                  date={date}
                  time={time}
                  timezone={timezone}
                  onDateChange={setDate}
                  onTimeChange={setTime}
                  onTimezoneChange={setTimezone}
                />
                <TextInput
                  value={wagerStc}
                  onChangeText={setWagerStc}
                  keyboardType="number-pad"
                  placeholder={`Optional wager (${ARRANGE_MIN_BET.toLocaleString()}–${ARRANGE_MAX_BET.toLocaleString()} STC)`}
                  placeholderTextColor={tokens.muted}
                  selectionColor={tokens.cyan}
                  style={inputStyle(tokens)}
                />
                {wagerError ? <Text style={{ color: tokens.danger, fontSize: 12 }}>{wagerError}</Text> : null}
                <Button
                  title="Continue"
                  onPress={() => setStep('confirm')}
                  disabled={!date || !time || Boolean(wagerError)}
                />
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setStep('details')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
                  <Ionicons name="arrow-back" size={18} color={tokens.muted} />
                  <Text style={{ color: tokens.muted, fontSize: 14 }}>Back</Text>
                </TouchableOpacity>
                <View style={{ backgroundColor: tokens.card, borderWidth: 1, borderColor: tokens.border, borderRadius: 16, padding: 16, gap: 10 }}>
                  <Row tokens={tokens} label="Type" value={matchType === 'player' ? 'Player vs Player' : 'Club vs Club'} />
                  <Row tokens={tokens} label="Opponent" value={formatOpponentLabel(selected, recipientKind)} />
                  <Row tokens={tokens} label="Kickoff" value={formatKickoffLabel(date, time, timezone)} />
                  {wagerStc && !wagerError ? <Row tokens={tokens} label="Wager" value={`${Number(wagerStc).toLocaleString()} STC each`} /> : null}
                </View>
                <Text style={{ color: tokens.muted, fontSize: 13, lineHeight: 18 }}>
                  They can accept, decline, or request a different date. The fixture appears in Matches after they accept.
                </Text>
                <Button title="Send invitation" onPress={handleSend} loading={sending} disabled={sending} />
              </>
            )}

            {error ? <Text style={{ color: tokens.danger, fontSize: 13 }}>{error}</Text> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Row({ tokens, label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: tokens.muted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: tokens.text, fontSize: 13, fontWeight: '600', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const inputStyle = (tokens) => ({
  backgroundColor: tokens.bgDeep,
  borderWidth: 1,
  borderColor: tokens.border,
  borderRadius: 12,
  color: tokens.text,
  fontSize: 15,
  height: 50,
  paddingHorizontal: 16,
});
