import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateHeuristicRisk, analyzeCaseRiskWithAI } from './aiRiskAnalyzer.js';

describe('aiRiskAnalyzer', () => {
  it('calculates heuristic risk for breach of contract case', () => {
    const caseDetails = {
      title: 'Contract Breach Dispute',
      practiceArea: 'Commercial Law',
      summary: 'Client states party failed to pay invoice under written breach of contract terms.'
    };

    const risk = calculateHeuristicRisk(caseDetails);
    assert.ok(risk.winProbability > 75);
    assert.strictEqual(risk.riskLevel, 'low');
    assert.ok(risk.strengths.length > 0);
    assert.ok(risk.vulnerabilities.length > 0);
    assert.strictEqual(typeof risk.opponentStrategy, 'string');
  });

  it('calculates heuristic risk fallback when no API key present', async () => {
    const caseDetails = {
      title: 'General Dispute',
      practiceArea: 'General Law',
      summary: 'Basic inquiry text.'
    };

    const risk = await analyzeCaseRiskWithAI(caseDetails);
    assert.ok(typeof risk.winProbability === 'number');
    assert.ok(typeof risk.opponentStrategy === 'string');
  });
});
