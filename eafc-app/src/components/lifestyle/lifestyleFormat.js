export function formatStc(value) {
  const n = Math.round(Number(value) || 0);
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/** Short countdown text ("2d 4h", "5h 10m", "12m") built through the translator. */
export function countdownText(target, t, now = Date.now()) {
  const ms = Math.max(0, (target instanceof Date ? target.getTime() : Number(target)) - now);
  const minutes = Math.ceil(ms / 60000);
  if (minutes >= 24 * 60) {
    return t('stage.lifestyle.countdownDays', { days: Math.floor(minutes / (24 * 60)), hours: Math.floor((minutes % (24 * 60)) / 60) });
  }
  if (minutes >= 60) {
    return t('stage.lifestyle.countdownHours', { hours: Math.floor(minutes / 60), minutes: minutes % 60 });
  }
  return t('stage.lifestyle.countdownMinutes', { minutes: Math.max(1, minutes) });
}

const ICONS = {
  real_estate: 'home-outline',
  houses: 'home-outline',
  cars: 'car-sport-outline',
  vehicles: 'car-sport-outline',
  business: 'storefront-outline',
  fashion: 'shirt-outline',
  watches: 'watch-outline',
  tech: 'phone-portrait-outline',
};

export function categoryIcon(category) {
  return ICONS[String(category || '').toLowerCase()] || 'cube-outline';
}
