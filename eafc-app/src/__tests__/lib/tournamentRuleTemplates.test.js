import {
  assertRulesAcceptance,
  renderTournamentRules,
  resolveTournamentRules,
} from '../../lib/tournamentRuleTemplates';

describe('tournament rule templates', () => {
  test('fills the tournament name and date into a locked template', () => {
    const french = renderTournamentRules('standard_cup', {
      name: 'Tournoi Test',
      start_date: '2026-09-01 21:00:00',
    }, 'fr');
    expect(french.body).toContain('Tournoi Test');
    expect(french.body).toContain('01/09/2026 21:00');
    expect(french.body).not.toMatch(/\{\{/);
    expect(french.acceptanceLabel).toBe("J'ai lu et j'accepte le règlement de Tournoi Test.");

    const english = renderTournamentRules('prize', {
      name: 'Tournoi Production',
      start_date: '2026-10-02 18:30:00',
      entry_fee_stc: 1000,
      max_teams: 8,
    }, 'en');
    expect(english.body).toContain('Tournoi Production');
    expect(english.body).toContain('2026-10-02 18:30');
    expect(english.body).toContain('8000');
    expect(english.body).not.toContain('Tournoi Test');
  });

  test('uses a neutral phrase when a variable is empty', () => {
    const rendered = renderTournamentRules('competitive', {}, 'en');
    expect(rendered.body).toContain('to be confirmed');
    expect(rendered.body).not.toMatch(/\{\{/);
  });

  test('keeps legacy free text, and renders a stored template id live', () => {
    expect(resolveTournamentRules({
      name: 'Old Cup',
      custom_rules: 'No rage quit.',
    }, 'en').body).toBe('No rage quit.');

    const fromMarker = resolveTournamentRules({
      name: 'Tournoi Test',
      custom_rules: 'rules_template:competitive',
      start_date: '2026-09-01 21:00:00',
    }, 'fr');
    expect(fromMarker.templateId).toBe('competitive');
    expect(fromMarker.body).toContain('Tournoi Test');
    expect(fromMarker.body).not.toContain('rules_template:');
  });

  test('prefers rules text already rendered by the server', () => {
    const resolved = resolveTournamentRules({
      name: 'Tournoi Test',
      rules_template_id: 'prize',
      rules_rendered: 'SERVER TEXT for Tournoi Test',
    }, 'en');
    expect(resolved.source).toBe('server');
    expect(resolved.body).toBe('SERVER TEXT for Tournoi Test');
  });

  test('blocks registration without acceptance and when the template changed', () => {
    expect(() => assertRulesAcceptance({ rulesAccepted: false, tournament: { name: 'Cup' } }))
      .toThrow(/Accept the tournament rules/);
    expect(assertRulesAcceptance({
      rulesAccepted: true,
      tournament: { custom_rules: 'rules_template:pro_clubs' },
    })).toEqual({
      rules_accepted: true,
      rules_template_id: 'pro_clubs',
    });
    expect(() => assertRulesAcceptance({
      rulesAccepted: true,
      rulesTemplateId: 'standard_cup',
      tournament: { rules_template_id: 'prize' },
    })).toThrow(/out of date/);
  });
});
