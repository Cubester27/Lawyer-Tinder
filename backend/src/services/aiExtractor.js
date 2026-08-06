import dotenv from 'dotenv';
import { extractCaseSummary } from './documentParser.js';
import { rankLawyersForCase } from './caseMatcher.js';

dotenv.config();

const BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

export async function extractLegalInfoWithAI(text, fileName = 'Legal Document') {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

  if (!text || typeof text !== 'string') {
    const summary = extractCaseSummary('', fileName);
    const recommendations = await rankLawyersForCase(summary);
    return { ...summary, recommendations };
  }

  if (!apiKey) {
    const heuristicResult = extractCaseSummary(text, fileName);
    const recommendations = await rankLawyersForCase(heuristicResult);
    return { ...heuristicResult, recommendations, extractedBy: 'heuristic' };
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
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an expert legal secretary / paralegal. Analyze the provided legal text and extract structured information in JSON format in ENGLISH.
You MUST extract:
- "applicableCode": The primary law book / legal code in application (e.g. "BGB - Civil Code", "StGB - Criminal Code", "ArbZG / KSchG - Employment & Protection Against Dismissal Act", "DSGVO / GDPR - General Data Protection Regulation", "HGB - Commercial Code", "ZPO", "StPO", "CPLR", etc.) along with a concise explanation.
- "deadlines": Array of objects with {"date": "YYYY-MM-DD", "label": "e.g. Filing Deadline / Motion Due", "sourceText": "snippet from document", "urgency": "high"|"medium"|"low"}. The deadline dates will be defined in the text as such.
- "primaryDeadlineDate": The earliest or most critical deadline in YYYY-MM-DD format (or empty string if none).
- "title": A concise title derived from document or topic.
- "practiceArea": Area of practice (e.g. Employment, Civil, Criminal, Medical, Commercial, Data Protection).
- "caseFocus": Specific case focus.
- "jurisdiction": Jurisdiction (e.g. Germany, New York, California, Federal).
- "summary": A concise 2-3 sentence summary of the case/text in English.
- "clientName": The name of the client if identifiable, otherwise an empty string.

Format response as JSON with keys: applicableCode, deadlines, primaryDeadlineDate, title, practiceArea, caseFocus, jurisdiction, summary, clientName.`
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
      extractedBy: 'openrouter'
    };

    const recommendations = await rankLawyersForCase(caseResult);
    return { ...caseResult, recommendations };
  } catch (error) {
    const heuristicResult = extractCaseSummary(text, fileName);
    const recommendations = await rankLawyersForCase(heuristicResult);
    return { ...heuristicResult, recommendations, extractedBy: 'heuristic' };
  }
}

