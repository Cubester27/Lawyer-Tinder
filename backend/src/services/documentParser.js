export function extractCaseSummary(text, fileName) {
  const normalizedText = text.replace(/\s+/g, ' ').trim();
  const firstSentence = normalizedText.split(/[.!?](?:\s|$)/)[0] || normalizedText;
  const title = fileName.replace(/\.[^.]+$/, '');
  const practiceArea = detectPracticeArea(normalizedText);
  const jurisdiction = detectJurisdiction(normalizedText);

  return {
    title,
    practiceArea,
    jurisdiction,
    summary: firstSentence.slice(0, 280)
  };
}

export function detectPracticeArea(text) {
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
