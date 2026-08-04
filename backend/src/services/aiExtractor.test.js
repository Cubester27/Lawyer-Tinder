import test from 'node:test';
import assert from 'node:assert/strict';
import { extractLegalInfoWithAI } from './aiExtractor.js';

test('extracts legal code and deadlines using heuristic fallback when no OpenAI key is set', async () => {
  const origKey = process.env.OPENROUTER_API_KEY;
  const origOpenAIKey = process.env.OPENAI_API_KEY;
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENAI_API_KEY;

  try {
    const result = await extractLegalInfoWithAI(
      'Der Arbeitnehmer verlangt Schadensersatz wegen unzulässiger Kündigung gemäß KSchG. Die Klagefrist endet am 2026-05-15.',
      'kuendigung.txt'
    );

    assert.equal(result.applicableCode.includes('ArbZG') || result.applicableCode.includes('KSchG'), true);
    assert.equal(result.deadlines.length >= 1, true);
    assert.equal(result.deadlines[0].date, '2026-05-15');
    assert.equal(result.extractedBy, 'heuristic');
    assert.equal(Array.isArray(result.recommendations), true);
    assert.equal(result.recommendations.length > 0, true);
  } finally {
    process.env.OPENROUTER_API_KEY = origKey;
    process.env.OPENAI_API_KEY = origOpenAIKey;
  }
});

test('identifies BGB for general civil contract cases', async () => {
  const result = await extractLegalInfoWithAI(
    'Mangelhafter Kaufvertrag über ein Fahrzeug. Rücktritt und Schadensersatz nach § 433 BGB gefordert. Frist bis 2026-06-30.',
    'kaufvertrag.txt'
  );

  assert.equal(result.applicableCode.includes('BGB'), true);
  assert.equal(result.primaryDeadlineDate, '2026-06-30');
  assert.equal(Array.isArray(result.recommendations), true);
});
