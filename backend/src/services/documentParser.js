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

export function extractCaseSummary(text, fileName) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const firstSentence = normalizedText.split(/[.!?](?:\s|$)/)[0] || normalizedText;
  const title = fileName.replace(/\.[^.]+$/, '');
  const practiceArea = detectPracticeArea(normalizedText);
  const caseFocus = detectCaseFocus(normalizedText);
  const jurisdiction = detectJurisdiction(normalizedText);
  const deadlines = extractDeadlines(normalizedText);

  return {
    title,
    practiceArea,
    caseFocus,
    jurisdiction,
    summary: firstSentence.slice(0, 280),
    deadlines,
    primaryDeadlineDate: deadlines[0]?.date || ''
  };
}

export function detectPracticeArea(text) {
  if (/medical malpractice|doctor|hospital|patient|nurse|treatment|diagnosis/i.test(text)) return 'Medical';
  if (/murder|homicide|manslaughter/i.test(text)) return 'Murder';
  if (/employment|wrongful termination|retaliation/i.test(text)) return 'Employment';
  if (/contract|breach/i.test(text)) return 'Commercial Litigation';
  if (/family|custody|divorce/i.test(text)) return 'Family Law';
  return 'General Litigation';
}

export function detectCaseFocus(text) {
  if (/medical malpractice|doctor|hospital|patient|nurse|treatment|diagnosis/i.test(text)) return 'Medical';
  if (/murder|homicide|manslaughter/i.test(text)) return 'Murder';
  if (/employment|wrongful termination|retaliation/i.test(text)) return 'Employment';
  if (/contract|breach/i.test(text)) return 'Commercial Litigation';
  if (/family|custody|divorce/i.test(text)) return 'Family Law';
  return 'General Litigation';
}

export function detectJurisdiction(text) {
  if (/new york/i.test(text)) return 'New York';
  if (/new jersey/i.test(text)) return 'New Jersey';
  if (/california/i.test(text)) return 'California';
  return 'New York';
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

    const start = Math.max(0, (match.index || 0) - 30);
    const end = Math.min(text.length, (match.index || 0) + match[1].length + 30);

    deadlines.push({
      date: parsedDate.date,
      sourceText: text.slice(start, end).trim()
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
