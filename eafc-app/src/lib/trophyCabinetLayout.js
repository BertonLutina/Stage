/** Keep in sync with Stage web trophy cabinet layout helpers. */
export const CABINET_ASPECT_RATIO = 1017 / 674;
export const TROPHY_BASE_SIZE_RATIO = 0.12;

export function clampPercent(value, min = 5, max = 95) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.max(min, Math.min(max, n));
}

export function clampScale(value, min = 0.3, max = 3) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.max(min, Math.min(max, n));
}

/** Round to server DECIMAL(6,2) / DECIMAL(5,3). */
export function normalizePlacementCoords({ x_percent, y_percent, scale } = {}) {
  const out = {};
  if (x_percent != null) out.x_percent = Math.round(clampPercent(x_percent) * 100) / 100;
  if (y_percent != null) out.y_percent = Math.round(clampPercent(y_percent) * 100) / 100;
  if (scale != null) out.scale = Math.round(clampScale(scale) * 1000) / 1000;
  return out;
}

/** Pixel size from the live cabinet width so iPhone / iPad / TV stay proportional. */
export function trophyPixelSize(cabinetWidth, scale = 1) {
  const width = Math.max(1, Number(cabinetWidth) || 0);
  return Math.max(28, Math.round(width * TROPHY_BASE_SIZE_RATIO * clampScale(scale)));
}
