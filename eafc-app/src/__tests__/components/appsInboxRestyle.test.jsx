import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;
let mockParams = { slug: 'nothing-here' };

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(), back: mockBack, replace: mockReplace, canGoBack: () => mockCanGoBack,
  }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
const mockLoanGet = jest.fn();
const mockInboxLoad = jest.fn();
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({ player: null })),
  stageClient: {
    entities: {
      PlayerLoan: { get: (...a) => mockLoanGet(...a) },
      InboxMessage: { subscribe: () => () => {}, filter: jest.fn(), update: jest.fn() },
    },
    http: { post: jest.fn() },
  },
}));
const mockRespond = jest.fn(() => Promise.resolve());
jest.mock('../../lib/inboxData', () => ({
  deleteInboxMessage: jest.fn(),
  respondToInboxMessage: (...args) => mockRespond(...args),
  loadInboxMessages: (...a) => mockInboxLoad(...a),
  markInboxMessageRead: jest.fn((m) => Promise.resolve(m)),
}));

const AppDirectoryScreen = require('../../components/apps/AppDirectoryScreen').default;
const { DirectoryRow, FilterChips } = require('../../components/apps/AppDirectoryScreen');
const InboxMessageList = require('../../components/inbox/InboxMessageList').default;
const InboxMessageDetail = require('../../components/inbox/InboxMessageDetail').default;
const MiniAppFallback = require('../../app/apps/[slug]').default;
const InboxLoanCard = require('../../components/inbox/InboxLoanCard').default;
const InboxDetailScreen = require('../../app/apps/inbox/[id]').default;
const InboxScreen = require('../../app/apps/inbox/index').default;

const offer = {
  id: 'm1',
  subject: 'Contract offer',
  body: 'Red Foxes want to sign you.',
  message_type: 'contract_offer',
  status: 'pending',
  is_read: false,
  sender_gamertag: 'Red Foxes',
  created_date: new Date().toISOString(),
};

describe('Apps hub and Inbox on the Stage design', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack = true;
    mockParams = { slug: 'nothing-here' };
  });

  test('directory screen has a labelled back button, search and filter chips', () => {
    const onChip = jest.fn();
    const { getByLabelText, getByText } = render(
      <AppDirectoryScreen
        title="Wallet"
        subtitle="STC balance"
        onQuery={() => {}}
        query=""
        chips={[{ id: 'all', label: 'All' }, { id: 'income', label: 'Income' }]}
        chipValue="all"
        onChip={onChip}
        data={[]}
        keyExtractor={(x) => x.id}
        renderItem={() => null}
        emptyText="No transactions yet"
      />,
    );
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
    expect(getByLabelText('Search')).toBeTruthy();
    fireEvent.press(getByText('Income'));
    expect(onChip).toHaveBeenCalledWith('income');
    expect(getByText('No transactions yet')).toBeTruthy();
  });

  test('directory row and chips keep their handlers', () => {
    const onPress = jest.fn();
    const onAction = jest.fn();
    const { getByText } = render(
      <>
        <DirectoryRow title="Pack" subtitle="10 credits" badge="E5" actionLabel="Buy" onAction={onAction} onPress={onPress} />
        <FilterChips options={['a', 'b']} value="a" onChange={() => {}} />
      </>,
    );
    fireEvent.press(getByText('Buy'));
    expect(onAction).toHaveBeenCalled();
    fireEvent.press(getByText('Pack'));
    expect(onPress).toHaveBeenCalled();
  });

  test('mini app fallback offers a labelled back button', () => {
    const { getByLabelText, getByText } = render(<MiniAppFallback />);
    expect(getByText('This app is not available on this build.')).toBeTruthy();
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  test('message list shows unread rows, needs-action tags and selects on press', () => {
    const onSelect = jest.fn();
    const { getByText } = render(<InboxMessageList messages={[offer]} onSelect={onSelect} />);
    expect(getByText('Needs action')).toBeTruthy();
    fireEvent.press(getByText('Contract offer'));
    expect(onSelect).toHaveBeenCalledWith(offer);
  });

  test('empty inbox keeps its empty state', () => {
    const { getByText } = render(<InboxMessageList messages={[]} />);
    expect(getByText('Your inbox is empty')).toBeTruthy();
  });

  test('inbox filters all, needs-action and unread messages', async () => {
    const readMessage = {
      ...offer, id: 'm2', subject: 'Welcome', message_type: 'system', status: 'sent', is_read: true,
    };
    mockInboxLoad.mockResolvedValue({ email: 'player@example.com', messages: [offer, readMessage] });
    const { findByText, getByText, getByTestId, queryByText } = render(<InboxScreen />);
    await findByText('Welcome');
    fireEvent.press(getByTestId('inbox-filter-action'));
    expect(getByText('Contract offer')).toBeTruthy();
    expect(queryByText('Welcome')).toBeNull();
    fireEvent.press(getByTestId('inbox-filter-unread'));
    expect(getByText('Contract offer')).toBeTruthy();
    fireEvent.press(getByTestId('inbox-filter-all'));
    expect(getByText('Welcome')).toBeTruthy();
  });

  test('message detail keeps accept and decline actions and labelled icon buttons', async () => {
    const onStatusChanged = jest.fn();
    const onBack = jest.fn();
    const { getByText, getByLabelText } = render(
      <InboxMessageDetail message={offer} onBack={onBack} onStatusChanged={onStatusChanged} />,
    );
    expect(getByText('A response is required')).toBeTruthy();
    fireEvent.press(getByLabelText('Back'));
    expect(onBack).toHaveBeenCalled();
    expect(getByLabelText('Delete message')).toBeTruthy();
    fireEvent.press(getByText('ACCEPT OFFER'));
    await waitFor(() => expect(mockRespond).toHaveBeenCalledWith(offer, 'accepted', expect.anything()));
    await waitFor(() => expect(onStatusChanged).toHaveBeenCalledWith('m1', 'accepted'));
    fireEvent.press(getByText('Decline'));
    await waitFor(() => expect(mockRespond).toHaveBeenCalledWith(offer, 'declined', expect.anything()));
  });

  describe('loan card buy clause', () => {
    const loanMessage = { id: 'l1', message_type: 'loan_proposal', related_entity_id: 'loan-1', metadata: '{}' };
    const loan = (purchase_type) => ({
      status: 'PROPOSED',
      purchase_type,
      purchase_option_stc: 1500,
      loan_fee_stc: 100,
      parent_wage_percentage: 50,
      loan_wage_percentage: 50,
      start_date: '2026-01-01',
      end_date: '2026-06-01',
    });

    test.each([
      ['OPTIONAL', 'Option to buy'],
      ['MANDATORY', 'Obligation to buy'],
    ])('%s purchase renders its buy-clause line without throwing', async (purchaseType, label) => {
      mockLoanGet.mockResolvedValue(loan(purchaseType));
      const { findByText, getByText } = render(<InboxLoanCard message={loanMessage} onActioned={() => {}} />);
      await findByText(/Loan fee/);
      expect(getByText(new RegExp(`${label}:`))).toBeTruthy();
      expect(getByText('ACCEPT LOAN')).toBeTruthy();
    });

    test('no purchase clause renders the other lines and no buy line', async () => {
      mockLoanGet.mockResolvedValue(loan('NONE'));
      const { findByText, queryByText } = render(<InboxLoanCard message={loanMessage} onActioned={() => {}} />);
      await findByText(/Loan fee/);
      expect(queryByText(/to buy:/)).toBeNull();
    });
  });

  test('a system message shows the flash tile even when it has an avatar url', () => {
    const system = { ...offer, is_system: true, sender_avatar_url: 'https://example.com/a.png' };
    const list = render(<InboxMessageList messages={[system]} />);
    expect(list.getByText('STAGE')).toBeTruthy();
    expect(list.UNSAFE_queryAllByProps({ name: 'flash-outline' }).length).toBeGreaterThan(0);
    expect(list.UNSAFE_queryAllByProps({ source: { uri: system.sender_avatar_url } })).toHaveLength(0);
    const detail = render(<InboxMessageDetail message={system} onBack={() => {}} />);
    expect(detail.UNSAFE_queryAllByProps({ name: 'flash-outline' }).length).toBeGreaterThan(0);
    expect(detail.UNSAFE_queryAllByProps({ source: { uri: system.sender_avatar_url } })).toHaveLength(0);
  });

  describe('inbox message error state back button', () => {
    beforeEach(() => {
      mockParams = { id: 'missing' };
      mockInboxLoad.mockResolvedValue({ messages: [] });
    });

    test('goes back when there is history', async () => {
      const { findByText, getByLabelText } = render(<InboxDetailScreen />);
      await findByText('Message not found');
      fireEvent.press(getByLabelText('Back'));
      expect(mockBack).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    test('falls back to the inbox list when there is nothing to go back to', async () => {
      mockCanGoBack = false;
      const { findByText, getByLabelText } = render(<InboxDetailScreen />);
      await findByText('Message not found');
      fireEvent.press(getByLabelText('Back'));
      expect(mockReplace).toHaveBeenCalledWith('/apps/inbox');
      expect(mockBack).not.toHaveBeenCalled();
    });
  });

  describe('inbox message success state back button', () => {
    beforeEach(() => {
      mockParams = { id: 'm1' };
      mockInboxLoad.mockResolvedValue({ messages: [offer] });
    });

    test('goes back when there is history', async () => {
      const { findByText, getByLabelText } = render(<InboxDetailScreen />);
      await findByText('Red Foxes want to sign you.');
      fireEvent.press(getByLabelText('Back'));
      expect(mockBack).toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    test('falls back to the inbox list when there is nothing to go back to', async () => {
      mockCanGoBack = false;
      const { findByText, getByLabelText } = render(<InboxDetailScreen />);
      await findByText('Red Foxes want to sign you.');
      fireEvent.press(getByLabelText('Back'));
      expect(mockReplace).toHaveBeenCalledWith('/apps/inbox');
      expect(mockBack).not.toHaveBeenCalled();
    });
  });
});
