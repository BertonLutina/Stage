import React from 'react';
import StandingsTable from './StandingsTable';

/** One group's standings: the full Stage card (radius 16) with its group name as the title. */
export default function GroupTable({ group }) {
  return (
    <StandingsTable
      title={group?.name || 'Group'}
      rows={group?.teams || group?.standings || []}
      emptyLabel="No teams in this group yet"
    />
  );
}
