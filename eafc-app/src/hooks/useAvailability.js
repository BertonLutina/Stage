import api from '../utils/api';
import useAsyncResource from './useAsyncResource';

export const AVAILABILITY_WINDOWS = [
  ['18:00', '20:00'],
  ['20:00', '22:00'],
  ['22:00', '24:00'],
  ['00:00', '02:00'],
];

/** Cycle order for the weekly grid: busy → available → maybe → busy */
export const AVAILABILITY_CYCLE = ['busy', 'available', 'maybe'];

const emptyGrid = () => Array.from({ length: 7 }, () => Array(4).fill('busy'));

function minutes(value, end = false) {
  const [hour = 0, minute = 0] = String(value || '').split(':').map(Number);
  if (hour === 0 && end) return 24 * 60 + minute;
  return hour * 60 + minute;
}

function slotStatus(slot) {
  const raw = String(slot?.status || 'available').toLowerCase();
  return raw === 'maybe' ? 'maybe' : 'available';
}

function pushMergedRanges(slots, day, daySlots, status) {
  let index = 0;
  while (index < 4) {
    if (daySlots?.[index] !== status) { index += 1; continue; }
    const startIndex = index;
    // Cap merge at the overnight slot (00–02) so ranges stay same-evening.
    while (index + 1 < 3 && daySlots[index + 1] === status) index += 1;
    const entry = {
      day_of_week: day,
      start_time: AVAILABILITY_WINDOWS[startIndex][0],
      end_time: AVAILABILITY_WINDOWS[index][1],
    };
    if (status === 'maybe') entry.status = 'maybe';
    slots.push(entry);
    index += 1;
  }
}

export function slotsToGrid(slots = []) {
  const grid = emptyGrid();
  for (const slot of Array.isArray(slots) ? slots : []) {
    const day = Number(slot?.day_of_week);
    if (!Number.isInteger(day) || day < 0 || day > 6) continue;
    const start = minutes(slot.start_time);
    const end = minutes(slot.end_time, true);
    const status = slotStatus(slot);
    AVAILABILITY_WINDOWS.forEach(([from, to], index) => {
      const windowStart = minutes(from);
      const windowEnd = minutes(to, true);
      if (start <= windowStart && end >= windowEnd) grid[day][index] = status;
    });
  }
  return grid;
}

export function gridToSlots(grid = emptyGrid()) {
  const slots = [];
  grid.forEach((daySlots, day) => {
    pushMergedRanges(slots, day, daySlots, 'available');
    pushMergedRanges(slots, day, daySlots, 'maybe');
  });
  return slots;
}

export function nextAvailabilityState(current) {
  const index = AVAILABILITY_CYCLE.indexOf(current);
  return AVAILABILITY_CYCLE[(index + 1) % AVAILABILITY_CYCLE.length] || 'busy';
}

export async function loadAvailability(userId) {
  const response = await api.get(`/users/${userId}/availability`);
  const slots = response?.data?.data || [];
  return { slots, grid: slotsToGrid(slots) };
}

export default function useAvailability(userId) {
  const resource = useAsyncResource(
    () => loadAvailability(userId),
    [userId],
    { initialData: { slots: [], grid: emptyGrid() }, immediate: Boolean(userId) },
  );
  const save = async (grid) => api.put(`/users/${userId}/availability`, { slots: gridToSlots(grid) });
  return { ...resource, save };
}
