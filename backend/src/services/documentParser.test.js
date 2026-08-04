import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCaseSummary } from './documentParser.js';

test('extracts a structured summary from uploaded text', () => {
  const summary = extractCaseSummary('The employee was terminated in New York after reporting retaliation. This employment dispute needs urgent review.', 'employment-case.txt');

  assert.equal(summary.title, 'employment-case');
  assert.equal(summary.practiceArea, 'Employment');
  assert.equal(summary.caseFocus, 'Employment');
  assert.equal(summary.jurisdiction, 'New York');
  assert.equal(summary.summary.includes('The employee was terminated'), true);
  assert.deepEqual(summary.deadlines, []);
  assert.equal(summary.primaryDeadlineDate, '');
});

test('extracts medical focus and deadline dates from text', () => {
  const summary = extractCaseSummary(
    'A patient suffered injuries after a hospital procedure. The medical malpractice complaint must be filed by March 5, 2026.',
    'medical-case.txt'
  );

  assert.equal(summary.caseFocus, 'Medical');
  assert.equal(summary.primaryDeadlineDate, '2026-03-05');
  assert.equal(summary.deadlines.length, 1);
  assert.equal(summary.deadlines[0].date, '2026-03-05');
});

test('extracts murder focus and multiple deadlines', () => {
  const summary = extractCaseSummary(
    'The defendant is charged with murder. The arraignment is on 04/10/2026 and the suppression motion is due before April 24, 2026.',
    'murder-case.txt'
  );

  assert.equal(summary.caseFocus, 'Murder');
  assert.equal(summary.deadlines.length, 2);
  assert.equal(summary.primaryDeadlineDate, '2026-04-10');
  assert.deepEqual(summary.deadlines.map((deadline) => deadline.date), ['2026-04-10', '2026-04-24']);
});
