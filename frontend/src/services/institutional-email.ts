const controlCharacters = /[\u0000-\u001F\u007F]/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeInstitutionalEmail(value: string): string { return value.trim().toLowerCase(); }
export function validateInstitutionalEmail(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  if (controlCharacters.test(value)) throw new Error("El correo institucional contiene caracteres de control.");
  const normalized = normalizeInstitutionalEmail(value);
  if (!emailPattern.test(normalized)) throw new Error("El correo institucional no tiene un formato válido.");
  return normalized;
}
