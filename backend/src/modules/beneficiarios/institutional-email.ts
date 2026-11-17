import { z } from "zod";

const controlCharacters = /[\u0000-\u001F\u007F]/;

export const institutionalEmailSchema = z.string().max(150).refine(value => !controlCharacters.test(value), "El correo institucional contiene caracteres de control").trim().toLowerCase().email("El correo institucional no tiene un formato válido");
export const legacyInstitutionalEmailSchema = z.string().max(150).nullable().optional();

export function validateInstitutionalEmail(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  return institutionalEmailSchema.parse(value);
}
