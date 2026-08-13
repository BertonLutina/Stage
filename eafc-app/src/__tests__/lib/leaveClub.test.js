const fs = require('fs');
const path = require('path');

const leaveSource = fs.readFileSync(path.join(__dirname, '../../lib/leaveClub.js'), 'utf8');
const profileSource = fs.readFileSync(path.join(__dirname, '../../app/(tabs)/profile/profilescreen.jsx'), 'utf8');
const teamSource = fs.readFileSync(path.join(__dirname, '../../app/(tabs)/dashboard/teamdashboardscreen.jsx'), 'utf8');
const hubSource = fs.readFileSync(path.join(__dirname, '../../app/(tabs)/profile/index.jsx'), 'utf8');

describe('mobile leave-club parity', () => {
  it('uses the Stage leave lifecycle instead of only clearing club_id', () => {
    expect(leaveSource).toMatch(/stageClient\.clubs\.leave\(clubId,\s*\{\s*player_id:\s*playerId\s*\}\)/);
    expect(leaveSource).toMatch(/writeAccountIntent\('player'/);
    expect(leaveSource).toMatch(/stage_president_club_id/);
  });

  it('exposes leave on own player profile and president club surface', () => {
    expect(profileSource).toMatch(/leaveStageClub/);
    expect(profileSource).toMatch(/onClubLeft/);
    expect(hubSource).toMatch(/leaveStageClub/);
    expect(hubSource).toMatch(/onClubLeft=\{identities\.refresh\}/);
  });

  it('routes team dashboard leave through the same Stage lifecycle', () => {
    expect(teamSource).toMatch(/leaveStageClub/);
    expect(teamSource).not.toMatch(/api\.post\(`\/teams\/\$\{teamId\}\/leave`\)/);
  });
});
