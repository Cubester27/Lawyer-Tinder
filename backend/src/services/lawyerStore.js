import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultLawyerPath = join(process.cwd(), 'backend', 'data', 'lawyers.json');
const defaultApprovalPath = join(process.cwd(), 'backend', 'data', 'approvals.json');

let cachedLawyers = null;
let cachedApprovals = null;

export function loadLawyerProfiles(filePath = defaultLawyerPath) {
  if (cachedLawyers) return cachedLawyers;
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    cachedLawyers = JSON.parse(readFileSync(filePath, 'utf8'));
    return cachedLawyers;
  } catch (err) {
    return cachedLawyers || [];
  }
}

export function saveLawyerProfiles(profiles, filePath = defaultLawyerPath) {
  cachedLawyers = profiles;
  try {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(profiles, null, 2));
  } catch (err) {
    console.warn('Persistent write skipped (read-only filesystem on Vercel):', err.message);
  }
}

export function loadApprovals(filePath = defaultApprovalPath) {
  if (cachedApprovals) return cachedApprovals;
  if (!existsSync(filePath)) {
    return [];
  }
  try {
    cachedApprovals = JSON.parse(readFileSync(filePath, 'utf8'));
    return cachedApprovals;
  } catch (err) {
    return cachedApprovals || [];
  }
}

export function saveApprovals(approvals, filePath = defaultApprovalPath) {
  cachedApprovals = approvals;
  try {
    mkdirSync(dirname(filePath), { recursive: true });
    writeFileSync(filePath, JSON.stringify(approvals, null, 2));
  } catch (err) {
    console.warn('Persistent write skipped (read-only filesystem on Vercel):', err.message);
  }
}

export function recordApproval(caseInput, lawyerId, notes = '', lawyerPath = defaultLawyerPath, approvalPath = defaultApprovalPath) {
  const profiles = loadLawyerProfiles(lawyerPath);
  const selectedLawyer = profiles.find((lawyer) => lawyer.id === lawyerId);

  if (!selectedLawyer) {
    throw new Error('Unknown lawyer selected');
  }

  const updatedProfiles = profiles.map((lawyer) =>
    lawyer.id === lawyerId ? { ...lawyer, caseHistory: lawyer.caseHistory + 1 } : lawyer
  );
  saveLawyerProfiles(updatedProfiles, lawyerPath);

  const approvals = loadApprovals(approvalPath);
  const approvalRecord = {
    id: `${Date.now()}`,
    caseTitle: caseInput.title || 'Untitled case',
    selectedLawyer: selectedLawyer.name,
    lawyerId: selectedLawyer.id,
    notes,
    approvedAt: new Date().toISOString(),
    status: 'approved',
    caseDetails: caseInput
  };
  saveApprovals([...approvals, approvalRecord], approvalPath);

  return approvalRecord;
}

export function updateApprovalStatus(id, status, approvalPath = defaultApprovalPath) {
  const approvals = loadApprovals(approvalPath);
  let updatedRecord = null;
  
  const updatedApprovals = approvals.map(approval => {
    if (approval.id === id) {
      updatedRecord = { ...approval, status };
      return updatedRecord;
    }
    return approval;
  });

  if (updatedRecord) {
    saveApprovals(updatedApprovals, approvalPath);
  }
  
  return updatedRecord;
}

export function updateApprovalDraft(id, draftText, approvalPath = defaultApprovalPath) {
  const approvals = loadApprovals(approvalPath);
  let updatedRecord = null;
  
  const updatedApprovals = approvals.map(approval => {
    if (approval.id === id) {
      updatedRecord = { ...approval, draft: draftText };
      return updatedRecord;
    }
    return approval;
  });

  if (updatedRecord) {
    saveApprovals(updatedApprovals, approvalPath);
  }
  
  return updatedRecord;
}
