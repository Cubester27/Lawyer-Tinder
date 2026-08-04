import dotenv from 'dotenv';
import { extractCaseSummary } from './documentParser.js';

dotenv.config();

const API_KEY = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export async function extractLegalInfoWithAI(text, fileName = 'Legal Document') {
  if (!text || typeof text !== 'string') {
    return extractCaseSummary('', fileName);
  }

  if (!API_KEY) {
    const heuristicResult = extractCaseSummary(text, fileName);
    return { ...heuristicResult, extractedBy: 'heuristic' };
  }

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Lawyer Tinder App'
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert legal assistant. Analyze the provided legal text and extract structured information in JSON format in ENGLISH.
You MUST extract:
- "applicableCode": The primary law book / legal code in application (e.g. "BGB - Civil Code", "StGB - Criminal Code", "ArbZG / KSchG - Employment & Protection Against Dismissal Act", "DSGVO / GDPR - General Data Protection Regulation", "HGB - Commercial Code", "ZPO", "StPO", "CPLR", etc.) along with a concise explanation.
- "deadlines": Array of objects with {"date": "YYYY-MM-DD", "label": "e.g. Filing Deadline / Motion Due", "sourceText": "snippet from document", "urgency": "high"|"medium"|"low"}.
- "primaryDeadlineDate": The earliest or most critical deadline in YYYY-MM-DD format (or empty string if none).
- "title": A concise title derived from document or topic.
- "practiceArea": Area of practice (e.g. Employment, Civil, Criminal, Medical, Commercial, Data Protection).
- "caseFocus": Specific case focus.
- "jurisdiction": Jurisdiction (e.g. Germany, New York, California, Federal).
- "summary": A concise 2-3 sentence summary of the case/text in English.

Format response as JSON with keys: applicableCode, deadlines, primaryDeadlineDate, title, practiceArea, caseFocus, jurisdiction, summary.`
          },
          {
            role: 'user',
            content: `Document filename: ${fileName}\n\nDocument Text:\n${text}`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API extraction failed with status ${response.status}`);
    }

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      title: parsed.title || fileName.replace(/\.[^.]+$/, '') || 'Legal Intake',
      applicableCode: parsed.applicableCode || 'BGB - Civil Code',
      deadlines: Array.isArray(parsed.deadlines) ? parsed.deadlines : [],
      primaryDeadlineDate: parsed.primaryDeadlineDate || (parsed.deadlines?.[0]?.date || ''),
      practiceArea: parsed.practiceArea || 'General Litigation',
      caseFocus: parsed.caseFocus || 'General Litigation',
      jurisdiction: parsed.jurisdiction || 'Germany',
      summary: parsed.summary || text.slice(0, 280),
      extractedBy: 'openrouter'
    };
  } catch (error) {
    const heuristicResult = extractCaseSummary(text, fileName);
    return { ...heuristicResult, extractedBy: 'heuristic' };
  }
}
