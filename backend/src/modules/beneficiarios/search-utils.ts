export function normalizeBeneficiarySearch(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function escapeLikePattern(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_").replace(/\[/g, "\\[");
}

export function beneficiaryLikeParameter(value: string): string {
  return `%${escapeLikePattern(normalizeBeneficiarySearch(value))}%`;
}

export function beneficiaryLikeExpression(field: string): string {
  return `${field} COLLATE Modern_Spanish_CI_AI LIKE @search ESCAPE N'\\'`;
}
