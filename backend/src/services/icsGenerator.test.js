import test from 'node:test';
import assert from 'node:assert/strict';
import { generateIcsContent, formatDateToIcs, getNextDayIcs } from './icsGenerator.js';

test('formatDateToIcs converts ISO YYYY-MM-DD to YYYYMMDD', () => {
  assert.equal(formatDateToIcs('2026-08-25'), '20260825');
  assert.equal(formatDateToIcs('2026-12-01T00:00:00.000Z'), '20261201');
  assert.equal(formatDateToIcs(null), null);
});

test('getNextDayIcs calculates the next calendar day correctly', () => {
  assert.equal(getNextDayIcs('2026-08-25'), '20260826');
  assert.equal(getNextDayIcs('2026-08-31'), '20260901');
  assert.equal(getNextDayIcs('2026-12-31'), '20270101');
});

test('generateIcsContent produces valid VCALENDAR with VEVENT items', () => {
  const deadlines = [
    {
      date: '2026-08-25',
      label: 'Brief Submission Deadline',
      sourceText: 'The brief submission deadline ends on 2026-08-25.',
      severity: 'high'
    },
    {
      date: '2026-09-10',
      label: 'Hearing Date',
      sourceText: 'Court hearing scheduled for September 10, 2026.',
      severity: 'medium'
    }
  ];

  const options = {
    caseTitle: 'Employment Termination Appeal',
    clientName: 'John Doe',
    applicableCode: 'KSchG / ArbZG',
    id: 'case-101'
  };

  const icsOutput = generateIcsContent(deadlines, options);

  assert.equal(icsOutput.includes('BEGIN:VCALENDAR'), true);
  assert.equal(icsOutput.includes('VERSION:2.0'), true);
  assert.equal(icsOutput.includes('END:VCALENDAR'), true);
  assert.equal(icsOutput.includes('DTSTART;VALUE=DATE:20260825'), true);
  assert.equal(icsOutput.includes('DTEND;VALUE=DATE:20260826'), true);
  assert.equal(icsOutput.includes('DTSTART;VALUE=DATE:20260910'), true);
  assert.equal(icsOutput.includes('DTEND;VALUE=DATE:20260911'), true);
  assert.equal(icsOutput.includes('SUMMARY:Brief Submission Deadline - Employment Termination Appeal'), true);
  assert.equal(icsOutput.includes('DESCRIPTION:Case: Employment Termination Appeal\\nClient: John Doe\\nLaw Code: KSchG / ArbZG\\nSeverity: HIGH\\nExcerpt: "The brief submission deadline ends on 2026-08-25."'), true);
});
