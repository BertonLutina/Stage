import { localStorage } from './polyfillStorage';

export const NOTIFICATION_SOUND_STORAGE_KEY = 'stage_notification_sound';

export const NOTIFICATION_SOUNDS = [
  { id: 'whistle', label: 'Referee Whistle', icon: 'megaphone-outline', category: 'sport' },
  { id: 'kickoff', label: 'Kick-off', icon: 'flash-outline', category: 'sport' },
  { id: 'goal_alert', label: 'Goal Alert', icon: 'football-outline', category: 'sport' },
  { id: 'stadium_cheer', label: 'Stadium Roar', icon: 'people-outline', category: 'sport' },
  { id: 'trophy', label: 'Victory Fanfare', icon: 'trophy-outline', category: 'sport' },
  { id: 'arena_pulse', label: 'Arena Pulse', icon: 'radio-outline', category: 'sport' },
  { id: 'cyber_ping', label: 'Cyber Ping', icon: 'sparkles-outline', category: 'digital' },
  { id: 'sound1', label: 'Classic Chime', icon: 'notifications-outline', category: 'classic' },
  { id: 'sound2', label: 'Soft Pop', icon: 'volume-medium-outline', category: 'classic' },
  { id: 'sound3', label: 'Digital Tap', icon: 'volume-medium-outline', category: 'classic' },
  { id: 'sound4', label: 'Bright Ding', icon: 'notifications-outline', category: 'classic' },
  { id: 'sound5', label: 'Low Tone', icon: 'musical-notes-outline', category: 'classic' },
  { id: 'sound6', label: 'Quick Blip', icon: 'flash-outline', category: 'classic' },
  { id: 'sound7', label: 'Smooth Alert', icon: 'musical-notes-outline', category: 'classic' },
  { id: 'sound8', label: 'Rising Note', icon: 'sparkles-outline', category: 'classic' },
  { id: 'sound9', label: 'Stadium Echo', icon: 'radio-outline', category: 'classic' },
  { id: 'sound10', label: 'Match Ready', icon: 'football-outline', category: 'classic' },
  { id: 'sound11', label: 'Locker Room', icon: 'volume-medium-outline', category: 'classic' },
  { id: 'sound12', label: 'Final Whistle', icon: 'megaphone-outline', category: 'classic' },
  { id: 'sound13', label: 'Champion Call', icon: 'trophy-outline', category: 'classic' },
];

export function getSelectedNotificationSoundId() {
  return localStorage.getItem(NOTIFICATION_SOUND_STORAGE_KEY) || 'whistle';
}

export function setSelectedNotificationSoundId(id) {
  localStorage.setItem(NOTIFICATION_SOUND_STORAGE_KEY, id || 'whistle');
}
