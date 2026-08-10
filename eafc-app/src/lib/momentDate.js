/**
 * Minimal wall-clock datetime helpers (no moment dependency).
 * Enough for stageClient Match scheduled_date normalization.
 */

const MYSQL_WALL_CLOCK_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/;

function formatLocalWallClockFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
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

export function toMysqlDateTime(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return formatLocalWallClockFromDate(value);
  const wall = asWallClockDateTimeString(value);
  if (!wall) return null;
  const normalized = String(wall).replace('T', ' ').slice(0, 19);
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}
