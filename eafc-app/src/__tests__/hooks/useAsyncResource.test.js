import { renderHook, waitFor, act } from '@testing-library/react-native';
import useAsyncResource from '../../hooks/useAsyncResource';

describe('useAsyncResource', () => {
  test('starts loading, then resolves with data', async () => {
    const { result } = renderHook(() => useAsyncResource(() => Promise.resolve({ v: 1 })));

    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.refreshing).toBe(false);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ v: 1 });
    expect(result.current.error).toBeNull();
    expect(result.current.refreshing).toBe(false);
  });

  test('sets error (not data) on rejection without throwing', async () => {
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.reject(new Error('boom')))
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.data).toBeUndefined();
  });

  test('surfaces a 401 as an error and does not crash', async () => {
    const unauthorized = Object.assign(new Error('Unauthorized'), {
      response: { status: 401 },
    });
    const { result } = renderHook(() =>
      useAsyncResource(() => Promise.reject(unauthorized))
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
    expect(result.current.data).toBeUndefined();
  });

  test('refetch sets refreshing (not loading) and keeps old data until it resolves', async () => {
    let resolveSecond;
    const fetcher = jest
      .fn()
      .mockResolvedValueOnce({ v: 1 })
      .mockImplementationOnce(
        () => new Promise((resolve) => {
          resolveSecond = resolve;
        })
      );

    const { result } = renderHook(() => useAsyncResource(fetcher));
    await waitFor(() => expect(result.current.data).toEqual({ v: 1 }));

    act(() => {
      result.current.refetch();
    });

    await waitFor(() => expect(result.current.refreshing).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toEqual({ v: 1 });

    await act(async () => {
      resolveSecond({ v: 2 });
    });

    await waitFor(() => expect(result.current.refreshing).toBe(false));
    expect(result.current.data).toEqual({ v: 2 });
  });
});
