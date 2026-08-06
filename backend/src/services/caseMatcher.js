import { recordApproval } from './lawyerStore.js';
import { rankLawyersWithAI } from './aiMatcher.js';

export async function rankLawyersForCase(caseInput, model) {
  return rankLawyersWithAI(caseInput, model);
}

export function approveRecommendation(caseInput, lawyerId, notes = '') {
  return recordApproval(caseInput, lawyerId, notes);
}
