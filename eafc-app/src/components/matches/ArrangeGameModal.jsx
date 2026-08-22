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
import { CYAN } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';
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
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}
      >
        <View style={{
          backgroundColor: '#071018',
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          borderWidth: 1,
          borderColor: 'rgba(0,232,255,0.28)',
          maxHeight: '92%',
          paddingBottom: 28,
        }}
        >
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 40, height: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 0.6 }}>ARRANGE VS FIXTURE</Text>
            <TouchableOpacity onPress={resetAndClose} hitSlop={10}>
              <Ionicons name="close" size={22} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, gap: 12 }}>
            {sent ? (
              <View style={{ alignItems: 'center', paddingVertical: 36, gap: 8 }}>
                <Ionicons name="checkmark-circle" size={42} color={FUT.lime} />
                <Text style={{ color: '#fff', fontWeight: '800' }}>Invitation sent</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Waiting for the opponent to respond.</Text>
              </View>
            ) : step === 'search' ? (
              <>
                {!isPresidentMode && myClub ? (
                  <View style={{ flexDirection: 'row', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' }}>
                    {['player', 'club'].map((type) => {
                      const active = searchType === type;
                      return (
                        <TouchableOpacity
                          key={type}
                          onPress={() => { setSearchType(type); setResults([]); setQuery(''); }}
                          style={{
                            flex: 1,
                            paddingVertical: 10,
                            backgroundColor: active ? 'rgba(0,232,255,0.16)' : 'transparent',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ color: active ? CYAN : 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '800' }}>
                            {type === 'player' ? 'PLAYER VS' : 'CLUB VS'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ) : null}

                <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 17 }}>
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
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.12)',
                      borderRadius: 12,
                      color: '#fff',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                    }}
                  />
                  <TouchableOpacity
                    onPress={handleSearch}
                    disabled={searching}
                    style={{
                      backgroundColor: CYAN,
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      justifyContent: 'center',
                    }}
                  >
                    {searching
                      ? <ActivityIndicator color="#041018" />
                      : <Ionicons name="search" size={18} color="#041018" />}
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
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(255,255,255,0.08)',
                    }}
                  >
                    <View style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      overflow: 'hidden',
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    >
                      {row.logo_url || row.avatar_url ? (
                        <Image source={{ uri: row.logo_url || row.avatar_url }} style={{ width: 36, height: 36 }} />
                      ) : (
                        <Ionicons name={matchType === 'club' ? 'shield' : 'person'} size={16} color="rgba(255,255,255,0.5)" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {row.name || row.gamertag}
                        {row.tag ? ` [${row.tag}]` : ''}
                      </Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>
                        {[row.platform, row.region, row.position].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.35)" />
                  </TouchableOpacity>
                ))}
              </>
            ) : step === 'details' ? (
              <>
                <TouchableOpacity onPress={() => setStep('search')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="arrow-back" size={14} color="rgba(255,255,255,0.55)" />
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Back</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontWeight: '800' }}>{formatOpponentLabel(selected, recipientKind)}</Text>
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
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  style={inputStyle}
                />
                {wagerError ? <Text style={{ color: FUT.rose, fontSize: 11 }}>{wagerError}</Text> : null}
                <TouchableOpacity
                  onPress={() => setStep('confirm')}
                  disabled={!date || !time || Boolean(wagerError)}
                  style={[primaryBtn, (!date || !time || wagerError) && { opacity: 0.4 }]}
                >
                  <Text style={primaryBtnText}>Continue</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity onPress={() => setStep('details')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="arrow-back" size={14} color="rgba(255,255,255,0.55)" />
                  <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>Back</Text>
                </TouchableOpacity>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 2, padding: 14, gap: 8 }}>
                  <Row label="Type" value={matchType === 'player' ? 'Player vs Player' : 'Club vs Club'} />
                  <Row label="Opponent" value={formatOpponentLabel(selected, recipientKind)} />
                  <Row label="Kickoff" value={formatKickoffLabel(date, time, timezone)} />
                  {wagerStc && !wagerError ? <Row label="Wager" value={`${Number(wagerStc).toLocaleString()} STC each`} /> : null}
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, lineHeight: 17 }}>
                  They can accept, decline, or request a different date. The fixture appears in Matches after they accept.
                </Text>
                <TouchableOpacity onPress={handleSend} disabled={sending} style={[primaryBtn, sending && { opacity: 0.5 }]}>
                  {sending
                    ? <ActivityIndicator color="#041018" />
                    : <Text style={primaryBtnText}>Send invitation</Text>}
                </TouchableOpacity>
              </>
            )}

            {error ? <Text style={{ color: FUT.rose, fontSize: 12 }}>{error}</Text> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const inputStyle = {
  backgroundColor: 'rgba(255,255,255,0.06)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#fff',
  paddingHorizontal: 12,
  paddingVertical: 10,
};

const primaryBtn = {
  backgroundColor: CYAN,
  borderRadius: 12,
  paddingVertical: 13,
  alignItems: 'center',
};

const primaryBtnText = {
  color: '#041018',
  fontWeight: '900',
  letterSpacing: 0.6,
  textTransform: 'uppercase',
};
