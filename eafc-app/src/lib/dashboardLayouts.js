export const DASHBOARD_LAYOUTS = [
  { id: 'A', name: 'Match', blurb: 'Next match first, then four key stats.' },
  { id: 'B', name: 'Tabs', blurb: 'Overview, Club, and Compete on separate tabs.' },
  { id: 'C', name: 'Card', blurb: 'Rank card on top, then Game Day shortcuts.' },
  { id: 'D', name: 'Bento', blurb: 'Kickoff beside rank and rating in a grid.' },
  { id: 'E', name: 'Stage', blurb: 'Next match, club, recent form and objectives — the Stage home.' },
];

export function isDashboardLayoutId(value) {
  return DASHBOARD_LAYOUTS.some((item) => item.id === value);
}
