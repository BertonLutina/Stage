import React from 'react';
import StandingsTable from './StandingsTable';

export default function GroupTable({ group }) {
  return (
    <StandingsTable
      title={group?.name || 'Group'}
      rows={group?.teams || group?.standings || []}
      emptyLabel="No teams in this group yet"
      compact
    />
  );
}
