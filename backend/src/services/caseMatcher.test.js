import test from 'node:test';
import assert from 'node:assert/strict';
import { approveRecommendation, rankLawyersForCase } from './caseMatcher.js';

test('ranks lawyers by practice area, jurisdiction, and history', async () => {
  const caseInput = {
    title: 'Employment discrimination claim',
    practiceArea: 'Employment',
    jurisdiction: 'New York',
    summary: 'A former employee alleges wrongful termination and retaliation.',
    caseFocus: 'Employment',
    deadlines: [{ date: '2026-08-15', sourceText: 'due by August 15, 2026' }],
    primaryDeadlineDate: '2026-08-15'
  };

  const results = await rankLawyersForCase(caseInput);

  assert.equal(results.length, 3);
  assert.equal(results[0].name.includes('Ava Patel'), true);
  assert.equal(results[0].reason.includes('Employment'), true);
  assert.equal(results[0].reason.includes('New York'), true);
});

test('creates an approval record for the selected lawyer', () => {
  const caseInput = {
    title: 'Employment discrimination claim',
    practiceArea: 'Employment',
    jurisdiction: 'New York',
    summary: 'A former employee alleges wrongful termination and retaliation.',
    caseFocus: 'Employment',
    deadlines: [{ date: '2026-08-15', sourceText: 'due by August 15, 2026' }],
    primaryDeadlineDate: '2026-08-15'
  };

  const approved = approveRecommendation(caseInput, '1', 'Needs a fast response');

  assert.equal(approved.status, 'approved');
  assert.equal(approved.selectedLawyer.includes('Ava Patel'), true);
  assert.equal(approved.notes, 'Needs a fast response');
});
