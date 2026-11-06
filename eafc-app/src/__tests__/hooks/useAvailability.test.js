import { act, renderHook, waitFor } from '@testing-library/react-native';
import useAvailability, { slotsToGrid, gridToSlots } from '../../hooks/useAvailability';
import api from '../../utils/api';

jest.mock('../../utils/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn() },
}));

describe('useAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: { data: [
      { day_of_week: 1, start_time: '20:00', end_time: '24:00' },
    ] } });
    api.put.mockResolvedValue({ data: { data: [] } });
  });

  test('maps real time ranges to the 7 by 4 binary availability grid', () => {
    const grid = slotsToGrid([{ day_of_week: 1, start_time: '20:00', end_time: '24:00' }]);
    expect(grid[1]).toEqual(['busy', 'available', 'available', 'busy']);
    expect(gridToSlots(grid)).toEqual([
      { day_of_week: 1, start_time: '20:00', end_time: '24:00' },
    ]);
  });

  test('loads, saves and reports endpoint failures without inventing a maybe state', async () => {
    const { result } = renderHook(() => useAvailability('u1'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data.grid[1][1]).toBe('available');

    await act(async () => { await result.current.save(result.current.data.grid); });
    expect(api.put).toHaveBeenCalledWith('/users/u1/availability', {
      slots: [{ day_of_week: 1, start_time: '20:00', end_time: '24:00' }],
    });

    api.get.mockRejectedValueOnce(new Error('Availability unavailable'));
    act(() => { result.current.refetch(); });
    await waitFor(() => expect(result.current.error).toBe('Availability unavailable'));
  });
});
