/**
 * Wall-clock datetime helpers.
 * Kickoff DATETIME is naive. Parse it in the user's saved IANA zone
 * (Belgium → Europe/Brussels). Never treat 17:20 as UTC.
 */

import { DEFAULT_TIMEZONE } from './timezones';

const MYSQL_WALL_CLOCK_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/;
const WALL_PARTS_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;
const OFFSET_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})$/i;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatLocalWallClockFromDate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function zonedParts(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const map = {};
  for (const part of fmt.formatToParts(date)) {
    if (part.type !== 'literal') map[part.type] = part.value;
  }
  return map;
}

export function formatZonedWallClock(date, timeZone = DEFAULT_TIMEZONE) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  try {
    const p = zonedParts(date, timeZone);
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
  } catch {
    return formatLocalWallClockFromDate(date);
  }
}

export function offsetForIanaTimeZone(timeZone = DEFAULT_TIMEZONE, at = new Date()) {
  try {
    const p = zonedParts(at, timeZone);
    const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    const offsetMin = Math.round((asUtc - at.getTime()) / 60000);
    const sign = offsetMin >= 0 ? '+' : '-';
    const abs = Math.abs(offsetMin);
    return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
  } catch {
    return '+01:00';
  }
}

function parseOffsetMs(offset) {
  const match = String(offset || '').match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return 0;
  const minutes = (Number(match[2]) * 60) + Number(match[3]);
  return (match[1] === '-' ? -1 : 1) * minutes * 60000;
}

export function asWallClockDateTimeString(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return formatLocalWallClockFromDate(value);
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (MYSQL_WALL_CLOCK_RE.test(s)) {
    const normalized = s.replace('T', ' ');
    return normalized.length === 16 ? `${normalized}:00` : normalized.slice(0, 19);
  }
  const isoZ = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::(\d{2}))?(?:\.\d+)?Z$/i);
  if (isoZ) {
    const sec = isoZ[3] || '00';
    return `${isoZ[1]} ${isoZ[2]}:${sec}`;
  }
  const isoParts = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2}:\d{2})/);
  if (isoParts) return `${isoParts[1]} ${isoParts[2]}`;
  return s;
}

export function toMysqlDateTime(value, timeZone) {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return timeZone ? formatZonedWallClock(value, timeZone) : formatLocalWallClockFromDate(value);
  }
  const wall = asWallClockDateTimeString(value);
  if (!wall) return null;
  const normalized = String(wall).replace('T', ' ').slice(0, 19);
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

export function wallClockToOffsetIso(value, timeZone = DEFAULT_TIMEZONE) {
  if (value == null || value === '') return null;
  if (typeof value === 'string' && OFFSET_ISO_RE.test(value.trim())) return value.trim();
  const wall = asWallClockDateTimeString(value);
  if (!wall) return null;
  const parts = String(wall).match(WALL_PARTS_RE);
  if (!parts) return wall;
  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const hour = Number(parts[4]);
  const minute = Number(parts[5]);
  const second = Number(parts[6] || 0);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  let utcMs = localAsUtc;
  let offset = '+00:00';
  for (let i = 0; i < 3; i += 1) {
    offset = offsetForIanaTimeZone(timeZone, new Date(utcMs));
    utcMs = localAsUtc - parseOffsetMs(offset);
  }
  offset = offsetForIanaTimeZone(timeZone, new Date(utcMs));
  return `${parts[1]}-${parts[2]}-${parts[3]}T${pad2(hour)}:${pad2(minute)}:${pad2(second)}${offset}`;
}

export function parseKickoffDate(value, timeZone = DEFAULT_TIMEZONE) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const s = String(value).trim();
  if (OFFSET_ISO_RE.test(s)) {
    const parsed = new Date(s);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const iso = wallClockToOffsetIso(s, timeZone);
  if (!iso) return null;
  const parsed = new Date(iso);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function kickoffMs(value, timeZone = DEFAULT_TIMEZONE) {
  const date = parseKickoffDate(value, timeZone);
  return date ? date.getTime() : 0;
}

export function formatKickoffInZone(value, {
  sourceTimeZone = DEFAULT_TIMEZONE,
  displayTimeZone,
} = {}) {
  const date = parseKickoffDate(value, sourceTimeZone);
  if (!date) return '';
  const zone = displayTimeZone || sourceTimeZone || DEFAULT_TIMEZONE;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  } catch {
    return date.toLocaleString('en-GB');
  }
}

export function formatKickoffClock(value, {
  sourceTimeZone = DEFAULT_TIMEZONE,
  displayTimeZone,
} = {}) {
  const date = parseKickoffDate(value, sourceTimeZone);
  if (!date) return '';
  const zone = displayTimeZone || sourceTimeZone || DEFAULT_TIMEZONE;
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  } catch {
    return '';
  }
}
