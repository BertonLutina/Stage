import { stageClient } from '@/api/stageClient';
import { hasStagePlus } from '@/lib/subscriptionUtils';

const ACTIVE_STATUSES = new Set(['pending', 'waitlisted', 'approved']);
const INACTIVE_STATUSES = new Set(['rejected', 'removed', 'withdrawn', 'cancelled', 'canceled']);

export async function applyForLeague(club, regionSlug, regionName, platform, {
  preferredDivision = 1,
  note = '',
  seasonLabel = '',
} = {}) {
  const user = await stageClient.auth.me();
  const isAdmin = user?.role === 'admin' || [0, 2].includes(Number(user?.role_id));
  if (!isAdmin && !hasStagePlus(user?.subscription)) {
    throw new Error('STAGE Plus is required to enter STAGE regional leagues and official competitions.');
  }

  const existing = await (stageClient.entities.SeasonRegistration?.filter({
    club_id: club.id,
    region_slug: regionSlug,
    platform,
  }, null, 10) ?? Promise.resolve([])).catch(() => []);

  const active = existing.find((r) => {
    const status = String(r.status || '').toLowerCase();
    const adminNotes = String(r.admin_notes || '').toLowerCase();
    if (INACTIVE_STATUSES.has(status)) return false;
    if (adminNotes.includes('removed from')) return false;
    return ACTIVE_STATUSES.has(status);
  });
  if (active) {
    throw new Error(`Your club already has an active application for ${regionName} (${active.status}).`);
  }

  return stageClient.entities.SeasonRegistration.create({
    club_id: club.id,
    club_name: club.name,
    club_tag: club.tag || '',
    club_logo_url: club.logo_url || '',
    owner_email: club.owner_email || '',
    target_type: 'regional_league',
    region_slug: regionSlug,
    region_name: regionName,
    platform,
    preferred_division: preferredDivision || 1,
    note_from_club: note || '',
    season_label: seasonLabel || '',
    status: 'pending',
    applied_at: new Date().toISOString(),
  });
}

export { ACTIVE_STATUSES };
