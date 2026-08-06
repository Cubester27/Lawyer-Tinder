import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultLawyerPath = join(__dirname, '..', '..', 'data', 'lawyers.json');
const defaultApprovalPath = join(__dirname, '..', '..', 'data', 'approvals.json');

export function loadLawyerProfiles(filePath = defaultLawyerPath) {
  if (!existsSync(filePath)) {
    return [];
  }

  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function saveLawyerProfiles(profiles, filePath = defaultLawyerPath) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(profiles, null, 2));
}

export function loadApprovals(filePath = defaultApprovalPath) {
  if (!existsSync(filePath)) {
    return [];
  }

  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function saveApprovals(approvals, filePath = defaultApprovalPath) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(approvals, null, 2));
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
    status: 'Pending',
    caseDetails: caseInput
  };
  saveApprovals([...approvals, approvalRecord], approvalPath);

  return { status: 'approved', ...approvalRecord };
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
