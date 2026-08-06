import dotenv from 'dotenv';
import { extractCaseSummary } from './documentParser.js';
import { rankLawyersForCase } from './caseMatcher.js';

dotenv.config();

const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export async function extractLegalInfoWithAI(text, fileName = 'Legal Document', model = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini') {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
  const targetModel = model || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

  if (!text || typeof text !== 'string') {
    const summary = extractCaseSummary('', fileName);
    const recommendations = await rankLawyersForCase(summary, targetModel);
    return { ...summary, recommendations, usedModel: targetModel };
  }

  if (!apiKey) {
    const heuristicResult = extractCaseSummary(text, fileName);
    const recommendations = await rankLawyersForCase(heuristicResult, targetModel);
    return { ...heuristicResult, recommendations, extractedBy: 'heuristic', usedModel: targetModel };
  }

  try {
    // 1. Clean and compress text to maximize information density
    const cleanText = text.replace(/\s+/g, ' ').trim();

    // 2. Add a generous timeout to prevent hanging and vite proxy ECONNRESET
    // Increased to 60 seconds since full documents take longer to process
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(BASE_URL, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Lawyer Tinder App'
      },
      body: JSON.stringify({
        model: targetModel,
        messages: [
          {
            role: 'system',
            content: `You are an expert legal secretary and paralegal. Your task is to analyze legal text and extract structured information into a strictly formatted JSON object. 

Translate all extracted information into English, regardless of the input text language.

### JSON Schema Requirements

Return a JSON object containing exactly the following keys:

1. "applicableCode" (string): The primary governing legal code, statute, or law book (for example, "BGB - Civil Code", "New York Penal Law", "CPLR"), followed by a brief 1-sentence explanation of its relevance. If unknown, return "".
2. "deadlines" (array of objects): List of extracted deadlines. If no deadlines exist, return []. Each object must contain:
   - "date" (string): The deadline formatted as YYYY-MM-DD.
   - "label" (string): Brief descriptive name of the deadline (for example, "Statutory Filing Deadline", "Equipment Return Due").
   - "sourceText" (string): Exact text excerpt specifying or contextualizing the deadline.
   - "urgency" (string): Must be exactly "high", "medium", or "low".
     - "high": Statutory limitation periods, procedural forfeiture dates, or deadlines under 7 days.
     - "medium": Standard administrative or court-set operational deadlines (8 to 30 days).
     - "low": Informational, non-binding, or long-term target dates (> 30 days).
3. "primaryDeadlineDate" (string): The chronologically earliest deadline date from the "deadlines" array formatted as YYYY-MM-DD. If "deadlines" is empty, return "".
4. "title" (string): Concise title identifying the document subject matter or matter name.
5. "practiceArea" (string): Primary field of law (for example, "Employment Law", "Criminal Law", "Civil Litigation", "Commercial Law").
6. "caseFocus" (string): Specific legal claim or dispute focus (for example, "Extraordinary Termination & Non-Compete", "Second Degree Murder Defense").
7. "jurisdiction" (string): Geographic and institutional jurisdiction (for example, "Germany", "New York State", "Federal Court").
8. "summary" (string): Factually precise 2 to 3 sentence factual summary of the text.
9. "clientName" (string): Full name of the client if explicitly mentioned. If unidentifiable, return "".

### Execution Constraints

- Output must be valid JSON only. Do not include markdown formatting (such as json), commentary, or extra text.
- Standardize all dates to YYYY-MM-DD format. Infer the correct calendar year from context when implicit.
- Do not speculate or extrapolate missing data. If a field cannot be determined, return an empty string "" or empty array [].`
          },
          {
            role: 'user',
            content: `Document filename: ${fileName}\n\nDocument Text:\n${cleanText}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`OpenRouter API extraction failed with status ${response.status}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    const caseResult = {
      title: parsed.title || fileName.replace(/\.[^.]+$/, '') || 'Legal Intake',
      applicableCode: parsed.applicableCode || 'BGB - Civil Code',
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
      primaryDeadlineDate: parsed.primaryDeadlineDate || (parsed.deadlines?.[0]?.date || ''),
      practiceArea: parsed.practiceArea || 'General Litigation',
      caseFocus: parsed.caseFocus || 'General Litigation',
      jurisdiction: parsed.jurisdiction || 'Germany',
      summary: parsed.summary || text.slice(0, 280),
      clientName: parsed.clientName || 'Client',
      extractedBy: 'openrouter',
      usedModel: targetModel
    };

    const recommendations = await rankLawyersForCase(caseResult, targetModel);
    return { ...caseResult, recommendations };
  } catch (error) {
    const heuristicResult = extractCaseSummary(text, fileName);
    const recommendations = await rankLawyersForCase(heuristicResult, targetModel);
    return { ...heuristicResult, recommendations, extractedBy: 'heuristic', usedModel: targetModel };
  }
}

