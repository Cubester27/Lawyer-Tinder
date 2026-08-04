import { recordApproval } from './lawyerStore.js';
import { rankLawyersWithAI } from './aiMatcher.js';

export async function rankLawyersForCase(caseInput) {
  return rankLawyersWithAI(caseInput);
}

export function approveRecommendation(caseInput, lawyerId, notes = '') {
  return recordApproval(caseInput, lawyerId, notes);
}
