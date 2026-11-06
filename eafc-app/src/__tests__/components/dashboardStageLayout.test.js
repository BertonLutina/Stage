import { DASHBOARD_LAYOUTS, isDashboardLayoutId } from '../../lib/dashboardLayouts';

const mockGet = jest.fn();
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: (...a) => mockGet(...a), setItem: jest.fn() },
}));

describe('Stage (mockup) home layout', () => {
  test('registry includes the Stage layout E', () => {
    expect(DASHBOARD_LAYOUTS.some((l) => l.id === 'E')).toBe(true);
    expect(isDashboardLayoutId('E')).toBe(true);
  });

  test('store defaults new users to the Stage layout E', async () => {
    mockGet.mockResolvedValue(null);
    const store = require('../../store/dashboardLayoutStore').default;
    expect(store.getState().layout).toBe('E');
    await store.getState().initialize();
    expect(store.getState().layout).toBe('E');
  });
});
