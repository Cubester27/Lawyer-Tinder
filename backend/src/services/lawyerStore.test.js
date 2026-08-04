import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadLawyerProfiles, recordApproval } from './lawyerStore.js';

test('loads lawyer profiles from a JSON store', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'lawyer-store-'));
  const lawyerPath = join(tempDir, 'lawyers.json');
  writeFileSync(lawyerPath, JSON.stringify([{ id: '1', name: 'Ava Patel', practiceAreas: ['Employment'], jurisdictions: ['New York'], caseHistory: 10, workload: 2 }], null, 2));

  try {
    const profiles = loadLawyerProfiles(lawyerPath);
    assert.equal(profiles[0].name, 'Ava Patel');
    assert.equal(profiles[0].caseHistory, 10);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test('records approvals and increments case history', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'lawyer-store-'));
  const lawyerPath = join(tempDir, 'lawyers.json');
  const approvalPath = join(tempDir, 'approvals.json');
  writeFileSync(lawyerPath, JSON.stringify([{ id: '1', name: 'Ava Patel', practiceAreas: ['Employment'], jurisdictions: ['New York'], caseHistory: 10, workload: 2 }], null, 2));

  try {
    const approval = recordApproval({ title: 'Test case' }, '1', 'Needs urgent review', lawyerPath, approvalPath);
    assert.equal(approval.status, 'approved');
    assert.equal(approval.selectedLawyer, 'Ava Patel');

    const profiles = loadLawyerProfiles(lawyerPath);
    assert.equal(profiles[0].caseHistory, 11);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
