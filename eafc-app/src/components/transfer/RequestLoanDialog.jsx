import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { stageClient } from '@/api/stageClient';
import useThemeStore from '@/store/themeStore';
import { FONT_EA_SPORTS } from '@/lib/fonts';
import { Button, Chip, SectionLabel, TextField, Toggle } from '@/components/ui';

function defaultEndDate() {
  const end = new Date();
  end.setMonth(end.getMonth() + 6);
  return end.toISOString().slice(0, 10);
}

function defaultStartDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function RequestLoanDialog({ open, onClose, player, club, onSubmitted }) {
  const tokens = useThemeStore((s) => s.tokens);
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={{ flex: 1, backgroundColor: tokens.overlay, justifyContent: 'flex-end' }}>
          <Pressable
            style={{ flex: 1 }}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
          <View
            style={{
              maxHeight: '88%',
              backgroundColor: tokens.bgDeep,
              borderTopLeftRadius: 22,
              borderTopRightRadius: 22,
              borderWidth: 1,
              borderColor: tokens.border,
              padding: 20,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: tokens.text,
                fontFamily: FONT_EA_SPORTS,
                fontSize: 22,
                letterSpacing: 22 * 0.03,
                textTransform: 'uppercase',
              }}
            >
              Request loan
            </Text>
            <Text numberOfLines={2} style={{ color: tokens.muted, fontSize: 14, marginTop: 6, marginBottom: 14 }}>
              Propose a loan for {player?.gamertag || 'this player'}.
            </Text>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14, paddingBottom: 20 }}
            >
              <TextField label="Start (YYYY-MM-DD)" value={startDate} onChangeText={setStartDate} autoCapitalize="none" />
              <TextField label="End (YYYY-MM-DD)" value={endDate} onChangeText={setEndDate} autoCapitalize="none" />
              <TextField label="Loan fee (STC)" value={loanFee} onChangeText={setLoanFee} keyboardType="number-pad" autoCapitalize="none" />
              <TextField label="Your wage share %" value={loanWage} onChangeText={setLoanWage} keyboardType="number-pad" autoCapitalize="none" />
              <Text style={{ color: splitValid ? tokens.muted : tokens.danger, fontSize: 12 }}>
                Parent club pays {parentWage}%
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 44 }}>
                <Text numberOfLines={1} style={{ flex: 1, color: tokens.muted, fontSize: 11, fontWeight: '600', letterSpacing: 11 * 0.12 }}>
                  PARENT MAY RECALL
                </Text>
                <Toggle
                  value={recallAllowed}
                  onValueChange={setRecallAllowed}
                  accessibilityLabel="Parent may recall"
                />
              </View>
              {recallAllowed ? (
                <TextField label="Recall after (YYYY-MM-DD)" value={recallAfterDate} onChangeText={setRecallAfterDate} autoCapitalize="none" />
              ) : null}
              <SectionLabel>PURCHASE</SectionLabel>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {['NONE', 'OPTIONAL', 'MANDATORY'].map((id) => (
                  <Chip
                    key={id}
                    label={id === 'NONE' ? 'None' : id === 'OPTIONAL' ? 'Option to buy' : 'Obligation to buy'}
                    active={purchaseType === id}
                    onPress={() => setPurchaseType(id)}
                  />
                ))}
              </View>
              {purchaseType !== 'NONE' ? (
                <>
                  <TextField label="Purchase price (STC)" value={purchaseOptionStc} onChangeText={setPurchaseOptionStc} keyboardType="number-pad" autoCapitalize="none" />
                  <TextField label="Purchase deadline (YYYY-MM-DD)" value={purchaseOptionDeadline} onChangeText={setPurchaseOptionDeadline} autoCapitalize="none" />
                </>
              ) : null}
              {submitError ? (
                <Text accessibilityRole="alert" style={{ color: tokens.danger, fontSize: 13 }}>
                  {String(submitError)}
                </Text>
              ) : null}
              <Button
                title="REQUEST LOAN"
                onPress={handleSubmit}
                loading={submitting}
                disabled={!splitValid}
              />
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
