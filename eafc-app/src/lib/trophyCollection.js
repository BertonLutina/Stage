export function earnedCopies(awards) {
  return (awards || []).filter((award) => award && award.persisted && award.id && award.trophy_item_id && award.status !== 'revoked');
}

export function placementForAward(placements, awardId) {
  return (placements || []).find((placement) => placement.award_id && String(placement.award_id) === String(awardId)) || null;
}

export function collectionLabel(state, count = 0) {
  if (state === 'available') return count === 1 ? '1 copy available.' : `${count} copies available.`;
  if (state === 'draft') return 'Draft in cabinet.';
  if (state === 'placed') return 'Placed — win again to unlock another copy.';
  return 'Win to unlock.';
}

export function buildTrophyCollection(catalogue, awards, placements) {
  const copies = earnedCopies(awards);
  const designs = new Map();
  for (const item of catalogue || []) {
    if (!item?.id) continue;
    const earnedHere = copies.some((award) => String(award.trophy_item_id) === String(item.id));
    if (item.admin_only && !earnedHere) continue;
    designs.set(String(item.id), item);
  }
  for (const award of copies) {
    const id = String(award.trophy_item_id);
    if (!designs.has(id)) {
      designs.set(id, {
        id: award.trophy_item_id,
        name: award.name || award.display_name || 'Trophy',
        image_url: award.image_url || null,
      });
    }
  }
  return [...designs.values()].map((design) => {
    const mine = copies.filter((award) => String(award.trophy_item_id) === String(design.id));
    const available = mine.filter((award) => !placementForAward(placements, award.id));
    const drafted = mine.filter((award) => {
      const placement = placementForAward(placements, award.id);
      return placement && !placement.locked_at;
    });
    const permanent = mine.filter((award) => {
      const placement = placementForAward(placements, award.id);
      return placement && placement.locked_at;
    });
    let state = 'locked';
    if (available.length) state = 'available';
    else if (drafted.length) state = 'draft';
    else if (permanent.length) state = 'placed';
    return {
      design,
      state,
      available,
      drafted,
      permanent,
      label: collectionLabel(state, available.length),
    };
  });
}

export function nextCabinetSpot(placements) {
  const spots = [40, 70].flatMap((y) => [20, 40, 60, 80].map((x) => ({ x, y })));
  return spots.find((spot) => (placements || []).every((placement) => (
    Math.abs(Number(placement.x_percent) - spot.x) > 12 || Math.abs(Number(placement.y_percent) - spot.y) > 15
  ))) || { x: 50, y: 50 };
}

export async function loadTrophyCatalogue(loadPage, pageSize = 100) {
  const items = [];
  let offset = 0;
  for (let page = 0; page < 50; page += 1) {
    const rows = await loadPage({ limit: pageSize, offset });
    const list = Array.isArray(rows) ? rows : [];
    items.push(...list);
    if (list.length < pageSize) break;
    offset += list.length;
  }
  return items;
}
