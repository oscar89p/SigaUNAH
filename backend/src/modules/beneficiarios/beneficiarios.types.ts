import { z } from "zod";

const user = z.string().trim().min(1).max(90);
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();

export const idSchema = z.object({ id: z.coerce.bigint().positive() });
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  sortBy: z.enum(["idBeneficiario", "primerApellido", "primerNombre", "numeroCuenta", "estadoBeneficiario", "fechaRegistro"]).default("primerApellido"),
  sortDirection: z.enum(["asc", "desc"]).default("asc")
});
export const searchSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(25).default(10), search: z.string().trim().min(1).max(150) });

const personSchema = z.object({
  primerNombre: z.string().trim().min(1).max(80),
  segundoNombre: nullableText(80),
  primerApellido: z.string().trim().min(1).max(80),
  segundoApellido: nullableText(80),
  numeroIdentificacion: nullableText(30),
  telefonoPrincipal: nullableText(30),
  correoPersonal: nullableText(150),
  fechaNacimiento: z.coerce.date().nullable().optional()
});

const beneficiaryFields = z.object({
  idTipoBeneficiario: z.number().int().positive(),
  idCarrera: z.number().int().positive().nullable().optional(),
  numeroCuenta: nullableText(20),
  correoInstitucional: nullableText(150),
  codigoCarne: nullableText(50),
  estadoAcademico: nullableText(30)
});

export const createSchema = z.object({ person: personSchema, beneficiary: beneficiaryFields, usuarioRegistro: user });
export const updateSchema = z.object({ person: personSchema, beneficiary: beneficiaryFields, usuarioActualizacion: user });
export const stateSchema = z.object({ estadoBeneficiario: z.boolean(), usuarioActualizacion: user });
export type Query = z.infer<typeof querySchema>;
export type Create = z.infer<typeof createSchema>;
export type Update = z.infer<typeof updateSchema>;
export type State = z.infer<typeof stateSchema>;
export type SearchQuery = z.infer<typeof searchSchema>;
