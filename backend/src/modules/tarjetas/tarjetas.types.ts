import { z } from "zod";

const user = z.string().trim().min(1).max(90);
const date = z.coerce.date().nullable().optional();
const assignment = z.object({
  idSolicitud: z.coerce.bigint().positive(), idBeneficiario: z.coerce.bigint().positive(), idTipoVigencia: z.number().int().positive(), idEstadoAsignacion: z.number().int().positive(), fechaAsignacion: z.coerce.date(), fechaInicioVigencia: z.coerce.date(), fechaFinVigencia: date, numeroCompromiso: z.string().trim().max(50).nullable().optional(), observacionEntrega: z.string().trim().max(1000).nullable().optional()
});
const fields = z.object({
  codigoTarjeta: z.string().trim().min(1).max(30), codigoExterno: z.string().trim().max(50).nullable().optional(), numeroSerie: z.string().trim().max(100).nullable().optional(), idEstadoTarjeta: z.number().int().positive(), idTipoTarjeta: z.number().int().positive().nullable().optional(), fechaAdquisicion: date, fechaAlta: z.coerce.date(), fechaBaja: date, motivoBaja: z.string().trim().max(500).nullable().optional(), requiereRevision: z.boolean().default(false), observacionTarjeta: z.string().trim().max(1000).nullable().optional()
});
export const idSchema = z.object({ id: z.coerce.bigint().positive() });
export const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(10), search: z.string().trim().max(150).optional(), sortBy: z.enum(["idTarjeta", "codigoTarjeta", "estado", "fechaAlta"]).default("fechaAlta"), sortDirection: z.enum(["asc", "desc"]).default("desc") });
export const createSchema = fields.extend({ assignment: assignment.nullable().optional(), usuarioRegistro: user });
export const updateSchema = fields.extend({ usuarioActualizacion: user });
export const stateSchema = z.object({ idEstadoTarjeta: z.number().int().positive(), usuarioActualizacion: user });
export type Query = z.infer<typeof querySchema>; export type Create = z.infer<typeof createSchema>; export type Update = z.infer<typeof updateSchema>; export type State = z.infer<typeof stateSchema>;
