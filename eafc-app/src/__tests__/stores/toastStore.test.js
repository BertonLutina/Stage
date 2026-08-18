import useToastStore from '../../store/toastStore';
import { TEST_TOAST_SAMPLES } from '../../lib/notificationTypes';

describe('toast store', () => {
  beforeEach(() => {
    useToastStore.setState({ visible: false, message: '', queue: [] });
  });

  test('queues a second toast until the first is hidden', () => {
    useToastStore.getState().show('Messages · New chat from Neo');
    useToastStore.getState().show('Contract offers · Ajax sent you a contract');
    expect(useToastStore.getState()).toMatchObject({
      visible: true,
      message: 'Messages · New chat from Neo',
      queue: ['Contract offers · Ajax sent you a contract'],
    });

    useToastStore.getState().hide();
    expect(useToastStore.getState()).toMatchObject({
      visible: true,
      message: 'Contract offers · Ajax sent you a contract',
      queue: [],
    });
  });

  test('covers every notification action with a sample toast', () => {
    expect(TEST_TOAST_SAMPLES.map((row) => row.key)).toEqual([
      'messages',
      'contract_offers',
      'contract_updates',
      'match_reminders',
      'match_results',
      'club_updates',
      'tournament_updates',
      'announcements',
    ]);
  });
});
