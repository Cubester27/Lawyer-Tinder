function escapeIcsText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function formatDateToIcs(dateStr) {
  if (!dateStr) return null;
  const isoMatch = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, yyyy, mm, dd] = isoMatch;
    return `${yyyy}${mm}${dd}`;
  }
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    return `${yyyy}${mm}${dd}`;
  }
  return null;
}

export function getNextDayIcs(dateStr) {
  const formatted = formatDateToIcs(dateStr);
  if (!formatted) return null;
  const yyyy = parseInt(formatted.substring(0, 4), 10);
  const mm = parseInt(formatted.substring(4, 6), 10) - 1;
  const dd = parseInt(formatted.substring(6, 8), 10);
  const d = new Date(Date.UTC(yyyy, mm, dd + 1));
  const nyyyy = d.getUTCFullYear();
  const nmm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const ndd = String(d.getUTCDate()).padStart(2, '0');
  return `${nyyyy}${nmm}${ndd}`;
}

export function buildIcsContent(deadlines = [], options = {}) {
  const { caseTitle = 'Legal Case', clientName, applicableCode, id = 'intake' } = options;
  const now = new Date();
  const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Lawyer Tinder//Legal Deadline Exporter//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  const list = Array.isArray(deadlines) ? deadlines : [deadlines];

  list.forEach((dl, index) => {
    const dateStr = typeof dl === 'string' ? dl : dl?.date;
    const startIcs = formatDateToIcs(dateStr);
    if (!startIcs) return;

    const endIcs = getNextDayIcs(dateStr) || startIcs;
    const label = (typeof dl === 'object' && dl?.label) ? dl.label : 'Legal Deadline';
    const sourceText = (typeof dl === 'object' && dl?.sourceText) ? dl.sourceText : '';
    const severity = (typeof dl === 'object' && dl?.severity) ? dl.severity : '';

    const summary = `${label}${caseTitle ? ` - ${caseTitle}` : ''}`;

    let descriptionParts = [];
    if (caseTitle) descriptionParts.push(`Case: ${caseTitle}`);
    if (clientName) descriptionParts.push(`Client: ${clientName}`);
    if (applicableCode) descriptionParts.push(`Law Code: ${applicableCode}`);
    if (severity) descriptionParts.push(`Severity: ${severity.toUpperCase()}`);
    if (sourceText) descriptionParts.push(`Excerpt: "${sourceText}"`);

    const description = descriptionParts.join('\n');
    const uid = `deadline-${id}-${index}-${startIcs}@lawyertinder.com`;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${dtstamp}`);
    lines.push(`DTSTART;VALUE=DATE:${startIcs}`);
    lines.push(`DTEND;VALUE=DATE:${endIcs}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    if (description) {
      lines.push(`DESCRIPTION:${escapeIcsText(description)}`);
    }
    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function downloadIcsFile(deadlines, options = {}, filename = 'case_deadlines.ics') {
  const content = buildIcsContent(deadlines, options);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.ics') ? filename : `${filename}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
