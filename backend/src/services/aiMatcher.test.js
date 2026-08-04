import test from 'node:test';
import assert from 'node:assert/strict';
import { rankLawyersWithAI } from './aiMatcher.js';

test('falls back to the heuristic matcher when no AI key is configured', async () => {
  const caseInput = {
    title: 'Employment dispute',
    practiceArea: 'Employment',
    jurisdiction: 'New York',
    summary: 'Wrongful termination claim.'
  };

  const results = await rankLawyersWithAI(caseInput);

  assert.equal(results.length, 3);
  assert.equal(results[0].source, 'heuristic');
});
