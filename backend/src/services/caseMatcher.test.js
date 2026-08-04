import test from 'node:test';
import assert from 'node:assert/strict';
import { approveRecommendation, rankLawyersForCase } from './caseMatcher.js';

test('ranks lawyers by practice area, jurisdiction, and history', async () => {
  const caseInput = {
    title: 'Employment discrimination claim',
    practiceArea: 'Employment',
    jurisdiction: 'New York',
    summary: 'A former employee alleges wrongful termination and retaliation.'
  };

  const results = await rankLawyersForCase(caseInput);

  assert.equal(results.length, 3);
  assert.equal(results[0].name, 'Ava Patel');
  assert.equal(results[0].reason.includes('Employment'), true);
  assert.equal(results[0].reason.includes('New York'), true);
});

test('creates an approval record for the selected lawyer', () => {
  const caseInput = {
    title: 'Employment discrimination claim',
    practiceArea: 'Employment',
    jurisdiction: 'New York',
    summary: 'A former employee alleges wrongful termination and retaliation.'
  };

  const approved = approveRecommendation(caseInput, '1', 'Needs a fast response');

  assert.equal(approved.status, 'approved');
  assert.equal(approved.selectedLawyer, 'Ava Patel');
  assert.equal(approved.notes, 'Needs a fast response');
});
