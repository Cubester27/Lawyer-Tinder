import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export async function generateLegalDraft(caseInput) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return `[Mock Legal Draft]\n\nDear Sir/Madam,\n\nWe represent the client in the matter regarding: ${caseInput.title}.\n\nBased on the facts provided:\n${caseInput.summary}\n\nWe hereby formally notify you of our representation under ${caseInput.applicableCode || 'applicable law'}.\n\nPlease direct all future correspondence to our office.\n\nSincerely,\nLawyer Tinder Firm`;
  }

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
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert lawyer. Draft a formal legal notice (e.g., cease and desist, letter of demand, or objection) based on the user's case summary. Apply the law defined in the case. Format the response strictly in Markdown. Do not include introductory conversational text, just the letter itself.`
          },
          {
            role: 'user',
            content: `Case Title: ${caseInput.title}\nApplicable Law: ${caseInput.applicableCode}\nSummary: ${caseInput.summary}\nDeadlines: ${JSON.stringify(caseInput.deadlines)}`
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`Draft generation failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Error parsing AI response.';
  } catch (error) {
    return `[Fallback Mock Draft]\n\nDear Sir/Madam,\n\nRegarding: ${caseInput.title}.\n\nSummary:\n${caseInput.summary}\n\nUnder ${caseInput.applicableCode}, we request immediate compliance.\n\nSincerely,\nLawyer Tinder Firm`;
  }
}
