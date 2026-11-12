import React from 'react';
import { StyleSheet } from 'react-native';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import useThemeStore from '../../store/themeStore';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockParams = {};

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: mockReplace }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('expo-blur', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { BlurView: ({ children, style }) => React.createElement(View, { style }, children) };
});
jest.mock('expo-image-picker', () => ({}));
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');
jest.mock('../../lib/uploadProfileMedia', () => ({ uploadLocalMedia: jest.fn() }));

const mockInvoke = jest.fn(() => Promise.resolve({}));
const mockLoanCreate = jest.fn(() => Promise.resolve({}));
jest.mock('../../api/stageClient', () => ({
  resolveMyPlayerAndClub: jest.fn(() => Promise.resolve({})),
  stageClient: {
    auth: { me: () => Promise.resolve({}), isAuthenticated: () => Promise.resolve(false) },
    functions: { invoke: (...a) => mockInvoke(...a) },
    entities: { PlayerLoan: { create: (...a) => mockLoanCreate(...a) } },
    http: { get: jest.fn(() => Promise.resolve({})), patch: jest.fn() },
    integrations: { Core: { UploadFile: jest.fn() } },
  },
}));

const mockLoadWallet = jest.fn();
const mockLoadStore = jest.fn();
const mockLoadMarket = jest.fn();
jest.mock('../../lib/stageDirectories', () => {
  const actual = jest.requireActual('../../lib/stageDirectories');
  return {
    ...actual,
    loadWallet: (...a) => mockLoadWallet(...a),
    loadStore: (...a) => mockLoadStore(...a),
    loadTransferMarket: (...a) => mockLoadMarket(...a),
  };
});

const mockStartPlus = jest.fn();
const mockStartPack = jest.fn();
const mockCancelPlus = jest.fn();
const mockCompleteReturn = jest.fn();
jest.mock('../../lib/stripeCheckout', () => ({
  startStagePlusCheckout: (...a) => mockStartPlus(...a),
  startCreditPackCheckout: (...a) => mockStartPack(...a),
  cancelStagePlusSubscription: (...a) => mockCancelPlus(...a),
  completeStoreCheckoutFromUrl: (...a) => mockCompleteReturn(...a),
}));

let mockWindow = null;
jest.mock('../../hooks/useTransferWindowStatus', () => ({
  useTransferWindowStatus: () => ({ currentWindow: mockWindow }),
}));

const Wallet = require('../../app/apps/wallet').default;
const Store = require('../../app/apps/store').default;
const Transfers = require('../../app/apps/transfers').default;
const TransferBadge = require('../../components/transfer/TransferBadge').default;
const TransferWindowBanner = require('../../components/transfer/TransferWindowBanner').default;
const TransferPlayerList = require('../../components/transfer/TransferPlayerList').default;
const TransferPlayerCarousel = require('../../components/transfer/TransferPlayerCarousel').default;
const TransferPlayerPhotoCard = require('../../components/transfer/TransferPlayerPhotoCard').default;
const TransferDetailSheet = require('../../components/transfer/TransferDetailSheet').default;
const RequestLoanDialog = require('../../components/transfer/RequestLoanDialog').default;
const { transferHubTheme } = require('../../components/transfer/transferHubTheme');

const HEX = /#[0-9A-Fa-f]{6}\b/;
function strayHex(toJSON) {
  const seen = [];
  const walk = (node) => {
    if (!node || typeof node === 'string') return;
    if (node.props?.style) {
      const flat = StyleSheet.flatten(node.props.style) || {};
      Object.values(flat).forEach((v) => { if (typeof v === 'string' && HEX.test(v) && !seen.includes(v)) seen.push(v); });
    }
    (node.children || []).forEach(walk);
  };
  walk(toJSON());
  const tokens = useThemeStore.getState().tokens;
  const allowed = new Set(Object.values(tokens).filter((v) => typeof v === 'string'));
  return seen.filter((v) => !allowed.has(v));
}

function styleOf(node) {
  return StyleSheet.flatten(node.props.style) || {};
}

const kaze = {
  player: { id: 'p1', gamertag: 'Kaze', position: 'CAM', secondary_position: 'CM', platform: 'PS5', overall_rating: 87, shirt_number: 10 },
  badgeType: 'free_agent',
};
const vix = {
  player: { id: 'p2', gamertag: 'Vix', position: 'ST', platform: 'Xbox', overall_rating: 85 },
  badgeType: 'expiring_soon',
  days_left: 2,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  mockWindow = null;
});

describe('Wallet', () => {
  const wallet = {
    player: { gamertag: 'Kaze' },
    balance: 450,
    weeklySalary: 300,
    nextSalaryDays: 3,
    transactions: [
      { id: 't1', amount: 150, category: 'competition_reward', description: 'Objective reward', created_date: new Date().toISOString() },
      { id: 't2', amount: -200, category: 'lifestyle_purchase', created_date: new Date().toISOString() },
    ],
  };

  test('shows the real balance, salary line and token-coloured amounts', async () => {
    mockLoadWallet.mockResolvedValue(wallet);
    const { findByText, getByText, getByLabelText, toJSON } = render(<Wallet />);
    await findByText('450');
    expect(getByText('STC')).toBeTruthy();
    expect(getByText('Weekly salary 300 · next in 3d')).toBeTruthy();
    expect(getByText(/STC this month/)).toBeTruthy();
    expect(getByText('This month')).toBeTruthy();
    const tokens = useThemeStore.getState().tokens;
    expect(styleOf(getByText('+150')).color).toBe(tokens.success);
    expect(styleOf(getByText('-200')).color).toBe(tokens.danger);
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
    expect(strayHex(toJSON)).toEqual([]);
  });

  test('quick actions: Top up / Collect / Store, and there is no Send', async () => {
    mockLoadWallet.mockResolvedValue(wallet);
    const { findByText, getByLabelText, queryByLabelText, queryByText } = render(<Wallet />);
    await findByText('450');
    fireEvent.press(getByLabelText('Top up'));
    expect(mockPush).toHaveBeenCalledWith('/apps/store');
    fireEvent.press(getByLabelText('Collect'));
    expect(mockPush).toHaveBeenCalledWith('/apps/lifestyle');
    fireEvent.press(getByLabelText('Store'));
    expect(mockPush).toHaveBeenCalledWith('/apps/store');
    expect(queryByLabelText(/^Send/)).toBeNull();
    expect(queryByText(/^Send$/)).toBeNull();
  });

  test('a load failure shows the error with Retry that reloads', async () => {
    mockLoadWallet.mockRejectedValueOnce(new Error('Wallet offline'));
    const { findByText, getByText } = render(<Wallet />);
    expect(await findByText('Wallet offline')).toBeTruthy();
    mockLoadWallet.mockResolvedValue(wallet);
    fireEvent.press(getByText('Retry'));
    expect(await findByText('450')).toBeTruthy();
  });

  test('empty activity state', async () => {
    mockLoadWallet.mockResolvedValue({ ...wallet, transactions: [], nextSalaryDays: null });
    const empty = render(<Wallet />);
    expect(await empty.findByText('No transactions yet')).toBeTruthy();
    expect(empty.getByText('Weekly salary 300')).toBeTruthy();
  });

  test('collect salary invokes the wallet function, reloads, and reports failure', async () => {
    mockLoadWallet.mockResolvedValue(wallet);
    const { findByText, getByLabelText } = render(<Wallet />);
    await findByText('450');
    fireEvent.press(getByLabelText('Collect salary'));
    await waitFor(() => expect(mockInvoke).toHaveBeenCalledWith('playerWallet', { action: 'pay_salary' }));
    await waitFor(() => expect(mockLoadWallet).toHaveBeenCalledTimes(2));

    mockInvoke.mockRejectedValueOnce(new Error('nope'));
    const { Alert } = require('react-native');
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    fireEvent.press(getByLabelText('Collect salary'));
    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Wallet', 'nope'));
    alertSpy.mockRestore();
  });
});

describe('Transfers hub', () => {
  const market = { entries: [kaze, vix], freeAgents: [kaze.player], expiringPlayers: [vix.player] };

  test('carousel, list mode, detail sheet and profile navigation', async () => {
    mockLoadMarket.mockResolvedValue(market);
    const { findByText, getByLabelText, getByText, queryByText, toJSON } = render(<Transfers />);
    fireEvent.press(getByText('Free agents'));
    expect(await findByText('1  /  2')).toBeTruthy();
    expect(getByText('2 players found  •  1 free  •  1 expiring')).toBeTruthy();
    fireEvent.press(getByLabelText('Next player'));
    expect(await findByText('2  /  2')).toBeTruthy();
    fireEvent.press(getByText('List'));
    fireEvent.press(await findByText('Kaze'));
    expect(await findByText('Player details')).toBeTruthy();
    fireEvent.press(getByText('View full profile'));
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/(tabs)/profile/profilescreen',
      params: { playerId: 'p1' },
    });
    expect(queryByText('Player details')).toBeNull();
    expect(strayHex(toJSON)).toEqual([]);
    fireEvent.press(getByLabelText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  test('filters sheet: window banner, search and status filter empty the market', async () => {
    mockWindow = { id: 'w1', label: 'Summer', end_date: '2099-01-01T00:00:00Z', status: 'open' };
    mockLoadMarket.mockResolvedValue(market);
    const { findByText, getByText, getByLabelText, queryByText } = render(<Transfers />);
    fireEvent.press(getByText('Free agents'));
    await findByText('1  /  2');
    fireEvent.press(getByText('Filters'));
    expect(getByText(/Transfer Window:/)).toBeTruthy();
    fireEvent.changeText(getByLabelText('Search gamertag'), 'zzz');
    fireEvent.press(getByLabelText('Close filters'));
    expect(await findByText('No players found')).toBeTruthy();
    expect(queryByText('1  /  2')).toBeNull();
    expect(getByText('0 players found  •  1 free  •  1 expiring')).toBeTruthy();
  });

  test('filters sheet keeps the search field above the keyboard on iOS and is inert on Android', async () => {
    const { Platform, KeyboardAvoidingView } = require('react-native');
    const original = Platform.OS;
    try {
      Platform.OS = 'ios';
      const ios = render(<Transfers />);
      fireEvent.press(ios.getByText('Free agents'));
      await ios.findByText('Filters');
      fireEvent.press(ios.getByText('Filters'));
      const search = ios.getByLabelText('Search gamertag');
      const avoiders = ios.UNSAFE_getAllByType(KeyboardAvoidingView);
      const holder = avoiders.find((node) => node.findAll((n) => n === search || n.props === search.props).length > 0);
      expect(holder).toBeTruthy();
      expect(holder.props.behavior).toBe('padding');
      ios.unmount();

      Platform.OS = 'android';
      const android = render(<Transfers />);
      fireEvent.press(android.getByText('Free agents'));
      await android.findByText('Filters');
      fireEvent.press(android.getByText('Filters'));
      const sheet = android.UNSAFE_getAllByType(KeyboardAvoidingView);
      expect(sheet.every((node) => node.props.behavior === undefined)).toBe(true);
    } finally {
      Platform.OS = original;
    }
  });

  test('empty market and list-mode empty state', async () => {
    mockLoadMarket.mockResolvedValue({ entries: [], freeAgents: [], expiringPlayers: [] });
    const { findByText, getByText } = render(<Transfers />);
    fireEvent.press(getByText('Free agents'));
    expect(await findByText('No players found')).toBeTruthy();
    fireEvent.press(getByText('List'));
    expect(await findByText('Try adjusting filters')).toBeTruthy();
  });
});

describe('Transfer components', () => {
  test('badge renders every variant and nothing for unknown types', () => {
    const types = ['free_agent', 'expiring', 'expiring_soon', 'pending_offer', 'offer_accepted', 'pending_window', 'under_contract'];
    const tokens = useThemeStore.getState().tokens;
    types.forEach((type) => {
      const { toJSON, unmount } = render(<TransferBadge type={type} daysLeft={4} />);
      expect(toJSON()).not.toBeNull();
      expect(strayHex(toJSON)).toEqual([]);
      unmount();
    });
    expect(render(<TransferBadge type="nope" />).toJSON()).toBeNull();
    const expiring = render(<TransferBadge type="expiring" daysLeft={4} />);
    expect(expiring.getByText('4d left')).toBeTruthy();
    expect(styleOf(expiring.getByText('4d left')).color).toBe(tokens.warning);
    const free = render(<TransferBadge type="free_agent" />);
    expect(styleOf(free.getByText('Free Agent')).color).toBe(tokens.success);
  });

  test('window banner: open, closed with date, closed without date, none', () => {
    const open = render(<TransferWindowBanner window={{ status: 'open', label: 'Summer', end_date: '2099-01-01T00:00:00Z' }} />);
    expect(open.getByText(/Transfer Window: OPEN/)).toBeTruthy();
    expect(open.getByText(/Summer · Open until/)).toBeTruthy();
    const closed = render(<TransferWindowBanner window={{ status: 'closed', end_date: '2020-01-01T00:00:00Z' }} />);
    expect(closed.getByText(/Closed .* — contracts accepted now/)).toBeTruthy();
    const closedNoDate = render(<TransferWindowBanner window={{ status: 'closed' }} />);
    expect(closedNoDate.getByText('Contracts accepted now will execute when the next window opens.')).toBeTruthy();
    const none = render(<TransferWindowBanner window={null} />);
    expect(none.getByText('No transfer window has been scheduled yet.')).toBeTruthy();
    expect(strayHex(none.toJSON)).toEqual([]);
  });

  test('player list: selection, empty state and press payload', () => {
    const onSelect = jest.fn();
    const { getByLabelText, getByText } = render(
      <TransferPlayerList players={[kaze, vix]} selectedId="p1" onSelect={onSelect} />,
    );
    expect(getByText('CAM / CM')).toBeTruthy();
    expect(getByText('2d left')).toBeTruthy();
    // the status badge is part of the spoken row label
    expect(getByLabelText('Kaze, CAM / CM, OVR 87, PS5, Free Agent')).toBeTruthy();
    fireEvent.press(getByLabelText('Vix, ST, OVR 85, Xbox, 2 days left'));
    expect(onSelect).toHaveBeenCalledWith(vix, { openDetails: true });
    // a row without a badge keeps the plain label
    const plain = render(<TransferPlayerList players={[{ player: { id: 'p3', gamertag: 'Zed', position: 'GK' }, badgeType: null }]} />);
    expect(plain.getByLabelText('Zed, GK')).toBeTruthy();
    const empty = render(<TransferPlayerList players={[]} />);
    expect(empty.getByText('No players found')).toBeTruthy();
  });

  test('carousel passes plain selection on arrows and opens details on a card', () => {
    const onSelect = jest.fn();
    const { getByLabelText, getAllByText } = render(
      <TransferPlayerCarousel entries={[kaze, vix]} selectedId="p1" onSelect={onSelect} />,
    );
    fireEvent.press(getByLabelText('Next player'));
    expect(onSelect).toHaveBeenCalledWith(vix);
    fireEvent.press(getAllByText('Kaze')[0]);
    expect(onSelect).toHaveBeenLastCalledWith(kaze, { openDetails: true });
  });

  test('photo card: initials fallback, shirt number and token-derived frame', () => {
    const { getByText, toJSON } = render(
      <TransferPlayerPhotoCard player={kaze.player} focused width={200}>
        {null}
      </TransferPlayerPhotoCard>,
    );
    expect(getByText('CAM')).toBeTruthy();
    expect(getByText('#10')).toBeTruthy();
    expect(getByText('87')).toBeTruthy();
    expect(strayHex(toJSON)).toEqual([]);
    const noNumber = render(<TransferPlayerPhotoCard player={{ id: 'x', gamertag: 'Zed' }} />);
    expect(noNumber.getByText('—')).toBeTruthy();
    const tokens = useThemeStore.getState().tokens;
    const hub = transferHubTheme(tokens);
    expect(hub.frameFocused).toEqual([tokens.cyanHi, tokens.cyan, tokens.aqua]);
    expect(hub.accent).toBe(tokens.cyan);
  });

  test('detail sheet: empty, free agent and expiring variants', () => {
    const onViewProfile = jest.fn();
    const none = render(<TransferDetailSheet visible entry={null} onClose={() => {}} onViewProfile={onViewProfile} />);
    expect(none.getByText('Select a player')).toBeTruthy();
    none.unmount();
    const free = render(<TransferDetailSheet visible entry={kaze} onClose={() => {}} onViewProfile={onViewProfile} />);
    expect(free.getByText('Free agent — available')).toBeTruthy();
    expect(free.getByText('CAM / CM')).toBeTruthy();
    fireEvent.press(free.getByText('View full profile'));
    expect(onViewProfile).toHaveBeenCalled();
    free.unmount();
    const expiring = render(<TransferDetailSheet visible entry={vix} onClose={() => {}} onViewProfile={onViewProfile} />);
    expect(expiring.getByText('Contract expiring')).toBeTruthy();
    expect(strayHex(expiring.toJSON)).toEqual([]);
  });

  test('request loan dialog: validates the split, shows purchase fields and submits', async () => {
    const onSubmitted = jest.fn();
    const onClose = jest.fn();
    const { getByLabelText, getByText, queryByLabelText, queryByText, toJSON } = render(
      <RequestLoanDialog open onClose={onClose} onSubmitted={onSubmitted} player={{ id: 'p1', gamertag: 'Kaze' }} club={{ id: 'c1' }} />,
    );
    expect(getByText('Propose a loan for Kaze.')).toBeTruthy();
    expect(getByText('Parent club pays 30%')).toBeTruthy();
    expect(queryByLabelText('Purchase price (STC)')).toBeNull();
    fireEvent.press(getByText('Option to buy'));
    expect(getByLabelText('Purchase price (STC)')).toBeTruthy();
    fireEvent.press(getByLabelText('Parent may recall'));
    expect(queryByLabelText('Recall after (YYYY-MM-DD)')).toBeNull();

    fireEvent.changeText(getByLabelText('Your wage share %'), '120');
    expect(getByText('Parent club pays -20%')).toBeTruthy();
    fireEvent.press(getByLabelText('REQUEST LOAN'));
    expect(mockLoanCreate).not.toHaveBeenCalled();

    fireEvent.changeText(getByLabelText('Your wage share %'), '60');
    fireEvent.changeText(getByLabelText('Purchase price (STC)'), '500');
    mockLoanCreate.mockRejectedValueOnce({ data: { code: 'LOAN_BLOCKED' } });
    fireEvent.press(getByLabelText('REQUEST LOAN'));
    await waitFor(() => getByText('LOAN_BLOCKED'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.press(getByLabelText('REQUEST LOAN'));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    expect(mockLoanCreate).toHaveBeenLastCalledWith(expect.objectContaining({
      player_id: 'p1',
      loan_club_id: 'c1',
      loan_wage_percentage: 60,
      parent_wage_percentage: 40,
      purchase_type: 'OPTIONAL',
      purchase_option_stc: 500,
      recall_allowed: false,
    }));
    expect(queryByText('LOAN_BLOCKED')).toBeNull();
    expect(strayHex(toJSON)).toEqual([]);
  });
});

describe('Live Dark', () => {
  afterEach(() => { act(() => { useThemeStore.getState().setStageTheme('theme-dark'); }); });

  test('wallet, store, transfers and the loan dialog render over the wallpaper', async () => {
    act(() => { useThemeStore.getState().setStageTheme('theme-video'); });
    expect(useThemeStore.getState().tokens.live).toBe(true);

    mockLoadWallet.mockResolvedValue({ balance: 450, weeklySalary: 0, transactions: [] });
    const wallet = render(<Wallet />);
    expect(await wallet.findByText('450')).toBeTruthy();
    expect(strayHex(wallet.toJSON)).toEqual([]);
    wallet.unmount();

    mockLoadStore.mockResolvedValue({ config: null, player: { id: 'p' }, credits: 0, stc: 0 });
    const store = render(<Store />);
    expect(await store.findByText(/STAGE Plus benefits/i)).toBeTruthy();
    store.unmount();

    mockLoadMarket.mockResolvedValue({ entries: [kaze], freeAgents: [kaze.player], expiringPlayers: [] });
    const hub = render(<Transfers />);
    fireEvent.press(hub.getByText('Free agents'));
    expect(await hub.findByText('1  /  1')).toBeTruthy();
    expect(strayHex(hub.toJSON)).toEqual([]);
    hub.unmount();

    const dialog = render(<RequestLoanDialog open onClose={() => {}} player={{ id: 'p1' }} club={{ id: 'c1' }} />);
    expect(dialog.getByText('Propose a loan for this player.')).toBeTruthy();
    expect(strayHex(dialog.toJSON)).toEqual([]);
  });
});
