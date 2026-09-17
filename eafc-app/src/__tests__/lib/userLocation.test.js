import {
  normalizeUserLocation,
  timezoneFromLocation,
  syncSessionLocation,
  resetLocationSyncForTests,
  COUNTRY_TIMEZONES,
} from '../../lib/userLocation';

describe('user location payload', () => {
  test('keeps Belgium GPS and rejects out-of-range coords', () => {
    expect(normalizeUserLocation({
      latitude: 50.8503,
      longitude: 4.3517,
      accuracy: 18.4,
      source: 'gps',
      country: 'be',
      captured_at: '2026-08-30T12:00:00.000Z',
    })).toEqual({
      latitude: 50.8503,
      longitude: 4.3517,
      accuracy: 18,
      source: 'gps',
      captured_at: '2026-08-30T12:00:00.000Z',
      country: 'BE',
    });
    expect(normalizeUserLocation({ lat: 91, lng: 0 })).toBeNull();
    expect(normalizeUserLocation(null)).toBeNull();
  });

  test('Belgium country code maps to Europe/Brussels', () => {
    expect(COUNTRY_TIMEZONES.BE).toBe('Europe/Brussels');
    expect(timezoneFromLocation({ country: 'BE' }, 'UTC')).toBe('Europe/Brussels');
    expect(timezoneFromLocation({ country: 'US' }, 'America/New_York')).toBe('America/New_York');
  });
});

describe('syncSessionLocation', () => {
  beforeEach(() => {
    resetLocationSyncForTests();
  });

  test('returns null when auth cannot PATCH timezone', async () => {
    await expect(syncSessionLocation({})).resolves.toBeNull();
  });

  test('saves device timezone even when GPS is denied', async () => {
    const updateTimezone = jest.fn(async (timezone, location) => ({ timezone, location }));
    const saved = await syncSessionLocation({ updateTimezone });
    expect(updateTimezone).toHaveBeenCalledTimes(1);
    expect(saved.timezone).toEqual(expect.any(String));
    expect(saved.location).toBeNull();
  });

  test('retries timezone-only if location PATCH is rejected', async () => {
    const updateTimezone = jest.fn(async (timezone, location) => {
      if (location) throw new Error('Unknown column location');
      return { timezone, location: null };
    });
    const geo = jest.fn((ok) => ok({
      coords: { latitude: 50.85, longitude: 4.35, accuracy: 10 },
    }));
    Object.defineProperty(global, 'navigator', {
      value: { geolocation: { getCurrentPosition: geo } },
      configurable: true,
    });
    const saved = await syncSessionLocation({ updateTimezone }, { force: true });
    expect(updateTimezone).toHaveBeenCalledTimes(2);
    expect(updateTimezone.mock.calls[1][1]).toBeNull();
    expect(saved.timezone).toEqual(expect.any(String));
  });
});
