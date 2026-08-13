import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';

export function calculateHeuristicRisk(caseDetails = {}) {
  const practiceArea = (caseDetails.practiceArea || '').toLowerCase();
  const summary = (caseDetails.summary || '').toLowerCase();
  
  let winProbability = 72;
  let riskLevel = 'medium';
  let strengths = ['Documented factual history provided during intake', 'Identified primary applicable legal code'];
  let vulnerabilities = ['Potential procedural response delays', 'Opposing evidence not yet reviewed'];
  let opponentStrategy = 'Opposing counsel will likely assert general denial of liability and claim procedural non-compliance or failure to mitigate damages.';

  if (summary.includes('breach') || summary.includes('contract') || summary.includes('non-compete')) {
    winProbability = 82;
    riskLevel = 'low';
    strengths.push('Written agreement and clear contractual terms established');
    vulnerabilities.push('Interpretation of ambiguity in custom contract clauses');
    opponentStrategy = 'Opponents will attempt to argue clause unenforceability or pre-existing verbal modifications.';
  } else if (summary.includes('termination') || summary.includes('dismissal') || practiceArea.includes('employment')) {
    winProbability = 68;
    riskLevel = 'medium';
    strengths.push('Strict statutory protection under employment regulations');
    vulnerabilities.push('Documentation of employer warning notices or performance reviews');
    opponentStrategy = 'Employer will likely claim termination was justified due to operational requirements or employee conduct.';
  } else if (summary.includes('injury') || summary.includes('accident') || summary.includes('damages')) {
    winProbability = 60;
    riskLevel = 'high';
    strengths.push('Demonstrable financial or physical harm incurred');
    vulnerabilities.push('Comparative negligence or contributory fault allegations');
    opponentStrategy = 'Opposing party will dispute causation and question the extent/quantification of claimed damages.';
  }

  return {
    winProbability,
    riskLevel,
    strengths,
    vulnerabilities,
    opponentStrategy
  };
}

export async function analyzeCaseRiskWithAI(caseDetails, model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini') {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return calculateHeuristicRisk(caseDetails);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(BASE_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001',
        'X-Title': 'Lawyer Tinder App'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: `You are a senior litigation analyst AI. Analyze the legal case details and output a JSON object predicting win probability, risk level, strengths, vulnerabilities, and opponent strategy.

JSON Schema format:
{
  "winProbability": <integer between 10 and 95>,
  "riskLevel": <"low" | "medium" | "high">,
  "strengths": [<array of 2 to 3 concise bullet points>],
  "vulnerabilities": [<array of 2 to 3 concise bullet points>],
  "opponentStrategy": "<1-2 sentence prediction of the opposing party's legal counter-strategy>"
}
Do not return markdown formatting, just raw valid JSON.`
          },
          {
            role: 'user',
            content: `Title: ${caseDetails.title || ''}\nPractice Area: ${caseDetails.practiceArea || ''}\nApplicable Code: ${caseDetails.applicableCode || ''}\nSummary: ${caseDetails.summary || ''}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return calculateHeuristicRisk(caseDetails);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return {
      winProbability: typeof parsed.winProbability === 'number' ? parsed.winProbability : 70,
      riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) ? parsed.riskLevel : 'medium',
      strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Valid legal grounds stated'],
      vulnerabilities: Array.isArray(parsed.vulnerabilities) && parsed.vulnerabilities.length > 0 ? parsed.vulnerabilities : ['Burden of proof requirements'],
      opponentStrategy: parsed.opponentStrategy || 'Opposing counsel is likely to dispute facts and assert general defenses.'
    };
  } catch (err) {
    return calculateHeuristicRisk(caseDetails);
  }
}
