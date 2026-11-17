export function normalizeSearchTerm(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/\[/g, "\\[");
}

export function likePattern(value: string): string {
  const normalized = normalizeSearchTerm(value);
  return normalized ? `%${escapeLikePattern(normalized)}%` : "";
}

export function likeExpression(field: string, accentInsensitive = false): string {
  const searchableField = accentInsensitive ? `${field} COLLATE Modern_Spanish_CI_AI` : field;
  return `${searchableField} LIKE @search ESCAPE N'\\'`;
}

// Backward-compatible beneficiary helpers.
export const normalizeBeneficiarySearch = normalizeSearchTerm;
export const beneficiaryLikeParameter = likePattern;
export const beneficiaryLikeExpression = (field: string) => likeExpression(field, true);
