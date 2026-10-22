import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);
const nullableText = (max: number) => z.string().trim().max(max).nullable().optional();
const profileIds = z.array(z.coerce.number().int().positive()).min(1).max(50).refine(ids => new Set(ids).size === ids.length, "No se permiten perfiles duplicados");

export const idSchema = z.object({ id: z.coerce.bigint().positive() });
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  estado: z.enum(["all", "active", "inactive"]).default("all"),
  sortBy: z.enum(["idUsuario", "nombreUsuario", "nombreAcceso", "correoElectronico", "estadoUsuario", "fechaRegistro"]).default("nombreUsuario"),
  sortDirection: z.enum(["asc", "desc"]).default("asc")
});

const baseFields = z.object({
  nombreUsuario: text(150),
  correoElectronico: z.string().trim().email().max(150),
  nombreAcceso: text(90),
  identificadorInstitucional: nullableText(50),
  profileIds
});

export const createSchema = baseFields.extend({
  password: z.string().min(8).max(200),
  tipoAutenticacion: z.literal("LOCAL").default("LOCAL")
});
export const updateSchema = baseFields.extend({ password: z.string().min(8).max(200).optional() });
export const stateSchema = z.object({ estadoUsuario: z.boolean() });

export type Query = z.infer<typeof querySchema>;
export type Create = z.infer<typeof createSchema>;
export type Update = z.infer<typeof updateSchema>;
export type State = z.infer<typeof stateSchema>;
