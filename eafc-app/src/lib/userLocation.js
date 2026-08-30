/**
 * Persist the signed-in user's GPS location and the IANA timezone of that country.
 * Belgium GPS → Europe/Brussels (CET/CEST). Kickoff clocks use users.timezone.
 */

import { detectTimezone } from './timezones';

const SYNC_COOLDOWN_MS = 15 * 60 * 1000;

/** Single-zone countries we can resolve from GPS reverse-geocode. Multi-zone (US, CA, AU, RU) keep the device IANA zone. */
export const COUNTRY_TIMEZONES = {
  BE: 'Europe/Brussels',
  LU: 'Europe/Luxembourg',
  FR: 'Europe/Paris',
  NL: 'Europe/Amsterdam',
  DE: 'Europe/Berlin',
  GB: 'Europe/London',
  IE: 'Europe/Dublin',
  ES: 'Europe/Madrid',
  PT: 'Europe/Lisbon',
  IT: 'Europe/Rome',
  CH: 'Europe/Zurich',
  AT: 'Europe/Vienna',
  PL: 'Europe/Warsaw',
  NG: 'Africa/Lagos',
  ZA: 'Africa/Johannesburg',
  AE: 'Asia/Dubai',
};

let lastStartedAt = 0;
let inFlight = null;

export function resetLocationSyncForTests() {
  lastStartedAt = 0;
  inFlight = null;
}

function roundCoord(value, digits = 6) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function normalizeCountry(raw) {
  const code = String(raw || '').trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function normalizeUserLocation(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const latitude = roundCoord(raw.latitude ?? raw.lat);
  const longitude = roundCoord(raw.longitude ?? raw.lng);
  if (latitude == null || longitude == null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  const accuracy = Number(raw.accuracy);
  const country = normalizeCountry(raw.country || raw.isoCountryCode);
  return {
    latitude,
    longitude,
    accuracy: Number.isFinite(accuracy) ? Math.round(accuracy) : null,
    source: String(raw.source || 'gps').slice(0, 32),
    captured_at: raw.captured_at || new Date().toISOString(),
    country,
  };
}

export function timezoneFromLocation(location, fallback = detectTimezone()) {
  const fromCountry = COUNTRY_TIMEZONES[location?.country];
  if (fromCountry) return fromCountry;
  return fallback || detectTimezone();
}

function requestBrowserCoords() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation?.getCurrentPosition) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        source: 'gps',
      }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  });
}

async function reverseGeocodeCountry(Location, latitude, longitude) {
  if (!Location?.reverseGeocodeAsync) return null;
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    return normalizeCountry(places?.[0]?.isoCountryCode);
  } catch {
    return null;
  }
}

async function requestNativeCoords() {
  try {
    const Location = require('expo-location');
    if (!Location?.requestForegroundPermissionsAsync) return null;
    const perm = await Location.requestForegroundPermissionsAsync();
    if (perm?.status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy?.Balanced ?? 3,
    });
    const latitude = pos.coords.latitude;
    const longitude = pos.coords.longitude;
    const country = await reverseGeocodeCountry(Location, latitude, longitude);
    return {
      latitude,
      longitude,
      accuracy: pos.coords.accuracy,
      source: 'gps',
      country,
    };
  } catch {
    return null;
  }
}

export async function captureSessionLocation() {
  const deviceTimezone = detectTimezone();
  const coords = (await requestNativeCoords()) || (await requestBrowserCoords());
  const location = normalizeUserLocation(coords);
  return {
    timezone: timezoneFromLocation(location, deviceTimezone),
    location,
  };
}

export async function syncSessionLocation(auth = {}, { force = false } = {}) {
  const update = auth.updateTimezone;
  if (typeof update !== 'function') return null;
  const now = Date.now();
  if (!force && inFlight) return inFlight;
  if (!force && lastStartedAt && now - lastStartedAt < SYNC_COOLDOWN_MS) return null;
  lastStartedAt = now;
  inFlight = (async () => {
    try {
      const payload = await captureSessionLocation();
      try {
        return await update(payload.timezone, payload.location);
      } catch (err) {
        // API without users.location yet: still persist timezone so clocks work.
        if (payload.location) return await update(payload.timezone, null);
        throw err;
      }
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();
  return inFlight;
}
