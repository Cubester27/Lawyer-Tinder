import test from 'node:test';
import assert from 'node:assert/strict';
import { rankLawyersWithAI } from './aiMatcher.js';

test('falls back to the heuristic matcher when no AI key is configured', async () => {
  const origKey = process.env.OPENROUTER_API_KEY;
  const origOpenAIKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const caseInput = {
      title: 'Employment dispute',
      practiceArea: 'Employment',
      jurisdiction: 'New York',
      summary: 'Wrongful termination claim.',
      caseFocus: 'Employment',
      deadlines: [{ date: '2026-09-01', sourceText: 'file by September 1, 2026' }],
      primaryDeadlineDate: '2026-09-01'
    };

    const results = await rankLawyersWithAI(caseInput);

    assert.equal(results.length, 3);
    assert.equal(results[0].source, 'heuristic');
  } finally {
    process.env.OPENROUTER_API_KEY = origKey;
    process.env.OPENAI_API_KEY = origOpenAIKey;
  }
});
