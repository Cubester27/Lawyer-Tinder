import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCaseSummary } from './documentParser.js';

test('extracts a structured summary from uploaded text', () => {
  const summary = extractCaseSummary('The employee was terminated in New York after reporting retaliation. This employment dispute needs urgent review.', 'employment-case.txt');

  assert.equal(summary.title, 'employment-case');
  assert.equal(summary.practiceArea, 'Employment');
  assert.equal(summary.jurisdiction, 'New York');
  assert.equal(summary.summary.includes('The employee was terminated'), true);
});
