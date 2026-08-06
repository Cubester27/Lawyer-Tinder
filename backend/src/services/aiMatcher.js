import dotenv from 'dotenv';
import { loadLawyerProfiles } from './lawyerStore.js';

dotenv.config();

const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export async function rankLawyersWithAI(caseInput, model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini') {
  const lawyerProfiles = loadLawyerProfiles();
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return rankLawyersWithHeuristics(caseInput, lawyerProfiles);
  }

  const modelToUse = model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Lawyer Tinder App'
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You rank lawyers for legal intake. Return a JSON object with a "rankings" array containing objects with lawyerId, score, and reason fields in ENGLISH; rank the top 3 candidates taking into account practice area, jurisdiction, deadlines, specialties, and applicable legal code.'
          },
          {
            role: 'user',
            content: JSON.stringify({ caseInput, lawyers: lawyerProfiles })
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('OpenRouter AI ranking request failed');
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const ranked = Array.isArray(parsed.rankings) ? parsed.rankings : [];

    if (ranked.length === 0) {
      return rankLawyersWithHeuristics(caseInput, lawyerProfiles);
    }

    return ranked.slice(0, 3).map((entry) => {
      const targetId = entry.lawyerId ?? entry.id;
      const lawyer = lawyerProfiles.find(
        (profile) => String(profile.id) === String(targetId) || (entry.name && profile.name.toLowerCase() === String(entry.name).toLowerCase())
      );
      return {
        id: lawyer?.id || String(targetId),
        name: lawyer?.name || entry.name || String(targetId),
        score: entry.score || 0,
        reason: entry.reason || 'AI-generated recommendation based on law code & deadlines',
        source: 'ai'
      };
    });
  } catch (error) {
    return rankLawyersWithHeuristics(caseInput, lawyerProfiles);
  }
}

function rankLawyersWithHeuristics(caseInput, lawyerProfiles) {
  const practiceScore = caseInput.practiceArea || '';
  const jurisdictionScore = caseInput.jurisdiction || '';
  const applicableCode = caseInput.applicableCode || '';

  return lawyerProfiles
    .map((lawyer) => {
      const practiceMatch = lawyer.practiceAreas.some((pa) =>
        pa.toLowerCase().includes(practiceScore.toLowerCase()) || practiceScore.toLowerCase().includes(pa.toLowerCase())
      ) ? 5 : 0;

      const jurisdictionMatch = lawyer.jurisdictions.some((j) =>
        j.toLowerCase().includes(jurisdictionScore.toLowerCase()) || jurisdictionScore.toLowerCase().includes(j.toLowerCase())
      ) ? 4 : 0;

      const codeMatch = lawyer.specialties?.some((s) => applicableCode.toLowerCase().includes(s.toLowerCase())) ? 4 : 0;

      const historyScore = Math.min(lawyer.caseHistory, 10);
      const workloadScore = lawyer.workload <= 3 ? 2 : 0;
      const totalScore = practiceMatch + jurisdictionMatch + codeMatch + historyScore + workloadScore;

      const codeDetail = applicableCode ? ` [Specialized in: ${applicableCode}]` : '';

      return {
        id: lawyer.id,
        name: lawyer.name,
        score: totalScore,
        reason: `Matches ${practiceScore} practice area, ${jurisdictionScore} jurisdiction${codeDetail} with ${lawyer.caseHistory} relevant matters handled.`,
        source: 'heuristic'
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
