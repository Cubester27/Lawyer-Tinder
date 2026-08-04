const DATE_PATTERN = /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?)\b/gi;

const MONTH_LOOKUP = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11
};

export function extractCaseSummary(text, fileName = 'Case Document') {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const firstSentence = normalizedText.split(/[.!?](?:\s|$)/)[0] || normalizedText;
  const title = fileName ? fileName.replace(/\.[^.]+$/, '') : 'Untitled Case';
  const practiceArea = detectPracticeArea(normalizedText);
  const caseFocus = detectCaseFocus(normalizedText);
  const jurisdiction = detectJurisdiction(normalizedText);
  const applicableCode = detectApplicableCode(normalizedText);
  const deadlines = extractDeadlines(normalizedText);

  return {
    title,
    practiceArea,
    caseFocus,
    jurisdiction,
    applicableCode,
    summary: firstSentence.slice(0, 280),
    deadlines,
    primaryDeadlineDate: deadlines[0]?.date || ''
  };
}

export function detectApplicableCode(text) {
  if (/dsgvo|gdpr|datenschutz|data protection/i.test(text)) {
    return 'DSGVO / GDPR - General Data Protection Regulation';
  }
  if (/arbzg|kschg|betrvg|arbeitsrecht|employment|wrongful termination|retaliation|notice period|overtime/i.test(text)) {
    return 'ArbZG / KSchG - Employment & Dismissal Protection Act';
  }
  if (/medical malpractice|doctor|hospital|patient|treatment|contract|breach|civil code|\bbgb\b|damages|kaufvertrag|mietrecht|schadensersatz/i.test(text)) {
    return 'BGB - Civil Code';
  }
  if (/stgb|murder|homicide|manslaughter|strafrecht|\bstgb\b|criminal code|theft|diebstahl|betrug|körperverletzung/i.test(text)) {
    return 'StGB - Criminal Code';
  }
  if (/hgb|handelsgesetzbuch|kaufmann|commercial code|corporate/i.test(text)) {
    return 'HGB - Commercial Code';
  }
  if (/zpo|zivilprozess|civil procedure|klageschrift|default judgment/i.test(text)) {
    return 'ZPO - Code of Civil Procedure';
  }
  if (/stpo|strafprozess|criminal procedure|arrest warrant|haftbefehl/i.test(text)) {
    return 'StPO - Code of Criminal Procedure';
  }
  if (/vwgo|administrative court|widerspruchsbescheid/i.test(text)) {
    return 'VwGO - Code of Administrative Court Procedure';
  }
  if (/cplr|civil practice law/i.test(text)) {
    return 'CPLR - New York Civil Practice Law and Rules';
  }
  return 'BGB - Civil Code';
}

export function detectPracticeArea(text) {
  if (/medical malpractice|doctor|hospital|patient|nurse|treatment|diagnosis/i.test(text)) return 'Medical';
  if (/murder|homicide|manslaughter|theft|fraud|stgb|criminal/i.test(text)) return 'Criminal Law';
  if (/employment|wrongful termination|retaliation|arbeitsrecht|kündigung/i.test(text)) return 'Employment';
  if (/contract|breach|hgb|kaufvertrag/i.test(text)) return 'Commercial Litigation';
  if (/family|custody|divorce/i.test(text)) return 'Family Law';
  if (/dsgvo|gdpr|data protection|privacy/i.test(text)) return 'Data Protection';
  return 'General Litigation';
}

export function detectCaseFocus(text) {
  if (/medical malpractice|doctor|hospital|patient|nurse|treatment|diagnosis/i.test(text)) return 'Medical';
  if (/murder|homicide|manslaughter/i.test(text)) return 'Murder';
  if (/theft|fraud|stgb|criminal/i.test(text)) return 'Criminal Law';
  if (/employment|wrongful termination|retaliation|arbeitsrecht|kündigung/i.test(text)) return 'Employment';
  if (/contract|breach|hgb|kaufvertrag/i.test(text)) return 'Commercial Litigation';
  if (/family|custody|divorce/i.test(text)) return 'Family Law';
  if (/dsgvo|gdpr|data protection|privacy/i.test(text)) return 'Data Protection';
  return 'General Litigation';
}

export function detectJurisdiction(text) {
  if (/deutschland|germany|berlin|munich|hamburg|frankfurt/i.test(text)) return 'Germany';
  if (/new york/i.test(text)) return 'New York';
  if (/new jersey/i.test(text)) return 'New Jersey';
  if (/california/i.test(text)) return 'California';
  return 'Germany / Federal';
}

export function extractDeadlines(text) {
  const deadlines = [];
  const seen = new Set();

  for (const match of text.matchAll(DATE_PATTERN)) {
    const parsedDate = parseDateToken(match[1]);

    if (!parsedDate) {
      continue;
    }

    const dedupeKey = `${parsedDate.date}:${match[1].toLowerCase()}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);

    const start = Math.max(0, (match.index || 0) - 40);
    const end = Math.min(text.length, (match.index || 0) + match[1].length + 40);
    const sourceText = text.slice(start, end).trim();

    let label = 'General Deadline';
    if (/klage|complaint|file by|einreichen/i.test(sourceText)) label = 'Filing Deadline';
    else if (/stellungnahme|motion|suppression|antrag/i.test(sourceText)) label = 'Motion / Brief Due';
    else if (/kündigung|termination|notice/i.test(sourceText)) label = 'Termination Notice Deadline';
    else if (/arraignment|hearing|termin|verhandlung|court/i.test(sourceText)) label = 'Hearing / Court Date';
    else if (/einspruch|appeal|widerspruch/i.test(sourceText)) label = 'Appeal Deadline';

    deadlines.push({
      date: parsedDate.date,
      label,
      sourceText
    });
  }

  return deadlines.sort((first, second) => first.date.localeCompare(second.date));
}

function parseDateToken(token) {
  const normalizedToken = token.trim();
  const isoMatch = normalizedToken.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (isoMatch) {
    return toIsoDate(Number(isoMatch[1]), Number(isoMatch[2]) - 1, Number(isoMatch[3]));
  }

  const slashMatch = normalizedToken.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);

  if (slashMatch) {
    const firstValue = Number(slashMatch[1]);
    const secondValue = Number(slashMatch[2]);
    const yearValue = normalizeYear(Number(slashMatch[3]));
    const monthValue = firstValue > 12 ? secondValue - 1 : firstValue - 1;
    const dayValue = firstValue > 12 ? firstValue : secondValue;

    return toIsoDate(yearValue, monthValue, dayValue);
  }

  const monthMatch = normalizedToken.match(/^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s+(\d{4}))?$/i);

  if (monthMatch) {
    const monthValue = MONTH_LOOKUP[monthMatch[1].toLowerCase()];
    const dayValue = Number(monthMatch[2]);
    const yearValue = monthMatch[3] ? Number(monthMatch[3]) : new Date().getFullYear();

    return toIsoDate(yearValue, monthValue, dayValue);
  }

  return null;
}

function normalizeYear(yearValue) {
  if (yearValue < 100) {
    return yearValue >= 70 ? 1900 + yearValue : 2000 + yearValue;
  }

  return yearValue;
}

function toIsoDate(yearValue, monthValue, dayValue) {
  const date = new Date(Date.UTC(yearValue, monthValue, dayValue));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== yearValue ||
    date.getUTCMonth() !== monthValue ||
    date.getUTCDate() !== dayValue
  ) {
    return null;
  }

  return { date: date.toISOString().slice(0, 10) };
}
