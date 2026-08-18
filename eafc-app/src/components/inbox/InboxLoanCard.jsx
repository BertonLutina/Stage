import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { stageClient } from '@/api/stageClient';
import { getEffectiveInboxActionType, parseInboxMetadata } from '@/lib/inboxHelpers';
import { formatSTC } from '@/lib/stageDirectories';
import { AMBER } from '@/components/profile/gamer/GamerProfileUI';
import { FUT } from '@/components/dashboard/CommandCenterUI';

function loanIdFrom(message) {
  const metadata = parseInboxMetadata(message);
  return metadata.loan_id || message?.related_entity_id;
}

async function postLoan(loanId, path) {
  return stageClient.http.post(`/player-loans/${encodeURIComponent(loanId)}/${path}`, {});
}

function LoanLine({ label, value }) {
  return (
    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20 }}>
      {label}: {value || '—'}
    </Text>
  );
}

function LoanButtons({ acting, onAccept, onReject, acceptLabel, rejectLabel }) {
  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <TouchableOpacity
        onPress={onAccept}
        disabled={acting}
        style={{ minHeight: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(124,255,107,0.16)', borderWidth: 1, borderColor: 'rgba(124,255,107,0.4)' }}
      >
        {acting ? <ActivityIndicator color={FUT.lime} /> : (
          <Text style={{ color: FUT.lime, fontWeight: '900', letterSpacing: 0.8 }}>{acceptLabel}</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={onReject}
        disabled={acting}
        style={{ minHeight: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,77,109,0.12)', borderWidth: 1, borderColor: 'rgba(255,77,109,0.35)' }}
      >
        {acting ? <ActivityIndicator color={FUT.rose} /> : (
          <Text style={{ color: FUT.rose, fontWeight: '900', letterSpacing: 0.8 }}>{rejectLabel}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

export default function InboxLoanCard({ message, onActioned }) {
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState(null);
  const metadata = parseInboxMetadata(message);
  const loanId = loanIdFrom(message);
  const type = message.message_type;
  const actionType = getEffectiveInboxActionType(message);
  const isPlayer = actionType === 'loan_player_response';

  useEffect(() => {
    if (!loanId) { setLoading(false); return undefined; }
    let cancelled = false;
    stageClient.entities.PlayerLoan.get(loanId)
      .then((row) => { if (!cancelled) setLoan(row); })
      .catch(() => { if (!cancelled) setLoan(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [loanId]);

  async function act(path, action) {
    if (!loanId) return;
    setActing(true);
    setError(null);
    try {
      await postLoan(loanId, path);
      onActioned?.(action);
    } catch (err) {
      setError(err?.data?.code || err?.message || 'Could not update this loan.');
    } finally {
      setActing(false);
    }
  }

  if (loading) return <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Loading loan…</Text>;

  const status = String(loan?.status || '').toUpperCase();
  const parentName = metadata.parent_club_name || loan?.parent_club_name;
  const loanName = metadata.loan_club_name || loan?.loan_club_name;

  if (type === 'loan_recalled' || type === 'loan_terminated_early') {
    return (
      <View style={card}>
        <Text style={kicker}>{type === 'loan_recalled' ? 'Loan recalled' : 'Loan ended early'}</Text>
        <LoanLine label="From" value={parentName} />
        <LoanLine label="To" value={loanName} />
        <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 8 }}>
          Playing rights have returned to the parent club. No response is required.
        </Text>
      </View>
    );
  }

  if (!loan) return <Text style={{ color: 'rgba(255,255,255,0.5)' }}>Loan proposal not found.</Text>;

  if (type === 'loan_early_end') {
    const pending = status === 'ACTIVE' && Boolean(loan.early_end_proposed_by_club_id);
    return (
      <View style={card}>
        <Text style={kicker}>Early return request</Text>
        <LoanLine label="From" value={parentName} />
        <LoanLine label="To" value={loanName} />
        {error ? <Text style={{ color: FUT.rose }}>{String(error)}</Text> : null}
        {pending ? (
          <LoanButtons
            acting={acting}
            onAccept={() => act('early-end-accept', 'accept')}
            onReject={() => act('early-end-reject', 'reject')}
            acceptLabel="ACCEPT RETURN"
            rejectLabel="REJECT"
          />
        ) : <Text style={{ color: 'rgba(255,255,255,0.5)' }}>{loan.status}</Text>}
      </View>
    );
  }

  if (type === 'loan_purchase') {
    const canDecide = status === 'ACTIVE' && String(loan.purchase_offer_status || '') === 'AWAITING_PLAYER';
    const days = Number(loan.purchase_contract_days || 0);
    return (
      <View style={card}>
        <Text style={kicker}>Permanent transfer offer</Text>
        <LoanLine label="To" value={loanName} />
        <LoanLine label="Purchase fee" value={`${formatSTC(loan.purchase_option_stc || 0)} STC`} />
        <LoanLine label="Weekly salary" value={`${formatSTC(loan.purchase_salary_stc || 0)} STC`} />
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
          {days > 0 ? `Contract length: ${days} days` : 'Contract runs to the end of the current deal'}
        </Text>
        {error ? <Text style={{ color: FUT.rose }}>{String(error)}</Text> : null}
        {canDecide ? (
          <LoanButtons
            acting={acting}
            onAccept={() => act('purchase-accept', 'accept')}
            onReject={() => act('purchase-reject', 'reject')}
            acceptLabel="ACCEPT TRANSFER"
            rejectLabel="REJECT AND STAY ON LOAN"
          />
        ) : <Text style={{ color: 'rgba(255,255,255,0.5)' }}>{loan.status}</Text>}
      </View>
    );
  }

  const parentCanDecide = !isPlayer && status === 'PROPOSED';
  const playerCanDecide = isPlayer && status === 'AWAITING_PLAYER';
  const canDecide = parentCanDecide || playerCanDecide;
  const purchase = String(loan.purchase_type || '').toUpperCase();

  return (
    <View style={card}>
      <Text style={kicker}>{isPlayer ? 'Loan offer' : 'Loan proposal'}</Text>
      <LoanLine label="From" value={parentName} />
      <LoanLine label="To" value={loanName} />
      <LoanLine label="Loan fee" value={`${formatSTC(loan.loan_fee_stc || 0)} STC`} />
      <LoanLine label="Wage split" value={`${loan.parent_wage_percentage}% / ${loan.loan_wage_percentage}%`} />
      <LoanLine label="Dates" value={`${loan.start_date || '—'} → ${loan.end_date || '—'}`} />
      {['OPTIONAL', 'MANDATORY'].includes(purchase) ? (
        <LoanLine
          label={purchase === 'MANDATORY' ? 'Obligation to buy' : 'Option to buy'}
          value={`${formatSTC(loan.purchase_option_stc || 0)} STC`}
        />
      ) : null}
      {error ? <Text style={{ color: FUT.rose }}>{String(error)}</Text> : null}
      {canDecide ? (
        <LoanButtons
          acting={acting}
          onAccept={() => act(isPlayer ? 'player-accept' : 'parent-accept', 'accept')}
          onReject={() => act(isPlayer ? 'player-reject' : 'parent-reject', 'reject')}
          acceptLabel="ACCEPT LOAN"
          rejectLabel="REJECT LOAN"
        />
      ) : <Text style={{ color: 'rgba(255,255,255,0.5)' }}>{loan.status}</Text>}
    </View>
  );
}

const card = {
  marginTop: 14,
  padding: 14,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: 'rgba(255,214,10,0.22)',
  backgroundColor: 'rgba(0,0,0,0.28)',
  gap: 4,
};

const kicker = {
  color: AMBER,
  fontSize: 11,
  fontWeight: '900',
  letterSpacing: 1.2,
  textTransform: 'uppercase',
  marginBottom: 6,
};
