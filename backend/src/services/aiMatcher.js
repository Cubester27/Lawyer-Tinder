import dotenv from 'dotenv';
import { loadLawyerProfiles } from './lawyerStore.js';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function rankLawyersWithAI(caseInput) {
  const lawyerProfiles = loadLawyerProfiles();

  if (!OPENAI_API_KEY) {
    return rankLawyersWithHeuristics(caseInput, lawyerProfiles);
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You rank lawyers for legal intake. Return a JSON array with lawyerId and reason fields; rank the top 3 candidates.'
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
      throw new Error('AI ranking request failed');
    }

    const payload = await response.json();
    const content = payload.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    const ranked = Array.isArray(parsed.rankings) ? parsed.rankings : [];

    return ranked.slice(0, 3).map((entry) => {
      const lawyer = lawyerProfiles.find((profile) => profile.id === entry.lawyerId);
      return {
        id: lawyer?.id || entry.lawyerId,
        name: lawyer?.name || entry.lawyerId,
        score: entry.score || 0,
        reason: entry.reason || 'AI-generated recommendation',
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

  return lawyerProfiles
    .map((lawyer) => {
      const practiceMatch = lawyer.practiceAreas.includes(practiceScore) ? 5 : 0;
      const jurisdictionMatch = lawyer.jurisdictions.includes(jurisdictionScore) ? 4 : 0;
      const historyScore = Math.min(lawyer.caseHistory, 10);
      const workloadScore = lawyer.workload <= 3 ? 2 : 0;
      const totalScore = practiceMatch + jurisdictionMatch + historyScore + workloadScore;

      return {
        id: lawyer.id,
        name: lawyer.name,
        score: totalScore,
        reason: `Matches ${practiceScore} practice area, ${jurisdictionScore} jurisdiction, and has ${lawyer.caseHistory} relevant matters.`,
        source: 'heuristic'
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
