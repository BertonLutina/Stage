import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { stageClient } from '@/api/stageClient';
import { AMBER } from '@/components/profile/gamer/GamerProfileUI';

function defaultEndDate() {
  const end = new Date();
  end.setMonth(end.getMonth() + 6);
  return end.toISOString().slice(0, 10);
}

function defaultStartDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function RequestLoanDialog({ open, onClose, player, club, onSubmitted }) {
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [loanFee, setLoanFee] = useState('0');
  const [loanWage, setLoanWage] = useState('70');
  const [recallAllowed, setRecallAllowed] = useState(true);
  const [recallAfterDate, setRecallAfterDate] = useState('');
  const [purchaseType, setPurchaseType] = useState('NONE');
  const [purchaseOptionStc, setPurchaseOptionStc] = useState('0');
  const [purchaseOptionDeadline, setPurchaseOptionDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    setSubmitError(null);
    setStartDate(defaultStartDate());
    setEndDate(defaultEndDate());
    setLoanFee('0');
    setLoanWage('70');
    setRecallAllowed(true);
    setRecallAfterDate('');
    setPurchaseType('NONE');
    setPurchaseOptionStc('0');
    setPurchaseOptionDeadline('');
  }, [open, player?.id]);

  const parentWage = 100 - (parseInt(loanWage, 10) || 0);
  const splitValid = parentWage >= 0 && parentWage <= 100 && parentWage + (parseInt(loanWage, 10) || 0) === 100;

  async function handleSubmit() {
    if (!player?.id || !club?.id || !splitValid) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await stageClient.entities.PlayerLoan.create({
        player_id: player.id,
        loan_club_id: club.id,
        start_date: startDate,
        end_date: endDate,
        loan_fee_stc: parseInt(loanFee, 10) || 0,
        parent_wage_percentage: parentWage,
        loan_wage_percentage: parseInt(loanWage, 10) || 0,
        recall_allowed: recallAllowed,
        recall_after_date: recallAfterDate || null,
        purchase_type: purchaseType,
        purchase_option_stc: purchaseType === 'NONE' ? 0 : (parseInt(purchaseOptionStc, 10) || 0),
        purchase_option_deadline: purchaseType === 'NONE' ? null : (purchaseOptionDeadline || null),
      });
      onSubmitted?.();
      onClose?.();
    } catch (err) {
      setSubmitError(err?.data?.code || err?.message || 'Could not send the loan request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View style={{
          maxHeight: '88%',
          backgroundColor: '#071018',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderWidth: 1,
          borderColor: 'rgba(255,214,10,0.28)',
          padding: 16,
        }}
        >
          <Text style={{ color: AMBER, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' }}>
            Request loan
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.55)', marginTop: 6, marginBottom: 12 }}>
            Propose a loan for {player?.gamertag || 'this player'}.
          </Text>
          <ScrollView contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
            <Field label="Start (YYYY-MM-DD)" value={startDate} onChange={setStartDate} />
            <Field label="End (YYYY-MM-DD)" value={endDate} onChange={setEndDate} />
            <Field label="Loan fee (STC)" value={loanFee} onChange={setLoanFee} keyboardType="number-pad" />
            <Field label="Your wage share %" value={loanWage} onChange={setLoanWage} keyboardType="number-pad" />
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12 }}>
              Parent club pays {parentWage}%
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }}>
                PARENT MAY RECALL
              </Text>
              <Switch value={recallAllowed} onValueChange={setRecallAllowed} />
            </View>
            {recallAllowed ? (
              <Field label="Recall after (YYYY-MM-DD)" value={recallAfterDate} onChange={setRecallAfterDate} />
            ) : null}
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>
              PURCHASE
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {['NONE', 'OPTIONAL', 'MANDATORY'].map((id) => (
                <Pressable
                  key={id}
                  onPress={() => setPurchaseType(id)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: purchaseType === id ? AMBER : 'rgba(255,255,255,0.18)',
                    backgroundColor: purchaseType === id ? 'rgba(255,214,10,0.14)' : 'transparent',
                  }}
                >
                  <Text style={{ color: purchaseType === id ? AMBER : '#fff', fontSize: 11, fontWeight: '800' }}>
                    {id === 'NONE' ? 'None' : id === 'OPTIONAL' ? 'Option to buy' : 'Obligation to buy'}
                  </Text>
                </Pressable>
              ))}
            </View>
            {purchaseType !== 'NONE' ? (
              <>
                <Field label="Purchase price (STC)" value={purchaseOptionStc} onChange={setPurchaseOptionStc} keyboardType="number-pad" />
                <Field label="Purchase deadline (YYYY-MM-DD)" value={purchaseOptionDeadline} onChange={setPurchaseOptionDeadline} />
              </>
            ) : null}
            {submitError ? <Text style={{ color: '#fb7185' }}>{String(submitError)}</Text> : null}
            <Pressable
              onPress={handleSubmit}
              disabled={submitting || !splitValid}
              style={{
                minHeight: 46,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: AMBER,
                opacity: submitting || !splitValid ? 0.5 : 1,
              }}
            >
              {submitting ? <ActivityIndicator color="#031018" /> : (
                <Text style={{ color: '#031018', fontWeight: '900', letterSpacing: 1.2 }}>REQUEST LOAN</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChange, keyboardType = 'default' }) {
  return (
    <View>
      <Text style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        autoCapitalize="none"
        placeholderTextColor="rgba(255,255,255,0.25)"
        style={{
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.16)',
          backgroundColor: 'rgba(0,0,0,0.4)',
          color: '#fff',
          paddingHorizontal: 12,
          paddingVertical: 10,
        }}
      />
    </View>
  );
}
