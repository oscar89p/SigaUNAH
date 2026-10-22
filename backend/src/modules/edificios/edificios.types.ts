import { z } from "zod";

const user = z.string().trim().min(1).max(90);
export const idSchema = z.object({ id: z.coerce.number().int().positive() });
export const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(10), search: z.string().trim().max(150).optional(), estado: z.enum(["all", "active", "inactive"]).default("all"), sortBy: z.enum(["idEdificio", "codigoEdificio", "nombreEdificio", "estadoEdificio", "fechaRegistro"]).default("nombreEdificio"), sortDirection: z.enum(["asc", "desc"]).default("asc") });
export const createSchema = z.object({ idCampus: z.number().int().positive(), codigoEdificio: z.string().trim().min(1).max(20), nombreEdificio: z.string().trim().min(1).max(150), direccionEdificio: z.string().trim().max(500).nullable().optional(), usuarioRegistro: user });
export const updateSchema = createSchema.omit({ idCampus: true, usuarioRegistro: true }).extend({ idCampus: z.number().int().positive(), usuarioActualizacion: user });
export const stateSchema = z.object({ estadoEdificio: z.boolean(), usuarioActualizacion: user });
export type Query = z.infer<typeof querySchema>; export type Create = z.infer<typeof createSchema>; export type Update = z.infer<typeof updateSchema>; export type State = z.infer<typeof stateSchema>;
