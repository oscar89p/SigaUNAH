import { z } from "zod";

const user = z.string().trim().min(1).max(90);
const date = z.coerce.date().nullable().optional();
const assignment = z.object({
  idSolicitud: z.coerce.bigint().positive(), idBeneficiario: z.coerce.bigint().positive(), idTipoVigencia: z.number().int().positive(), idEstadoAsignacion: z.number().int().positive(), fechaAsignacion: z.coerce.date(), fechaInicioVigencia: z.coerce.date(), fechaFinVigencia: date, numeroCompromiso: z.string().trim().max(50).nullable().optional(), observacionEntrega: z.string().trim().max(1000).nullable().optional(), idPerfilAcceso: z.number().int().positive().nullable().optional()
});
const fields = z.object({
  codigoTarjeta: z.string().trim().min(1).max(30), codigoExterno: z.string().trim().max(50).nullable().optional(), numeroSerie: z.string().trim().max(100).nullable().optional(), idEstadoTarjeta: z.number().int().positive(), idTipoTarjeta: z.number().int().positive().nullable().optional(), fechaAdquisicion: date, fechaAlta: z.coerce.date(), fechaBaja: date, motivoBaja: z.string().trim().max(500).nullable().optional(), requiereRevision: z.boolean().default(false), observacionTarjeta: z.string().trim().max(1000).nullable().optional()
});
export const idSchema = z.object({ id: z.coerce.bigint().positive() });
export const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(10), search: z.string().trim().max(150).optional(), estado: z.enum(["all", "active", "inactive"]).default("all"), sortBy: z.enum(["idTarjeta", "codigoTarjeta", "estado", "fechaAlta"]).default("fechaAlta"), sortDirection: z.enum(["asc", "desc"]).default("desc") });
export const createSchema = fields.extend({ assignment: assignment.nullable().optional(), usuarioRegistro: user });
export const updateSchema = fields.extend({ usuarioActualizacion: user });
export const stateSchema = z.object({ idEstadoTarjeta: z.number().int().positive(), usuarioActualizacion: user });
export const assignmentQuerySchema = z.object({ idBeneficiario: z.coerce.bigint().positive().optional(), idTarjeta: z.coerce.bigint().positive().optional(), historial: z.coerce.boolean().default(false) });
export const historyQuerySchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(50).default(10) });
const assignmentInput = z.object({ idSolicitud: z.coerce.bigint().positive(), idBeneficiario: z.coerce.bigint().positive(), idTarjeta: z.coerce.bigint().positive(), idTipoVigencia: z.number().int().positive(), idEstadoAsignacion: z.number().int().positive(), fechaAsignacion: z.coerce.date().default(() => new Date()), fechaInicioVigencia: z.coerce.date(), fechaFinVigencia: date, numeroCompromiso: z.string().trim().max(50).nullable().optional(), observacionEntrega: z.string().trim().max(1000).nullable().optional(), idPerfilAcceso: z.number().int().positive().nullable().optional() });
export const createAssignmentSchema = assignmentInput;
export const returnAssignmentSchema = z.object({ idEstadoAsignacionNuevo: z.number().int().positive(), motivoCambio: z.string().trim().min(1).max(1000), usuario: user });
export const renewAssignmentSchema = z.object({ fechaInicioVigencia: z.coerce.date(), fechaFinVigencia: date, motivoCambio: z.string().trim().min(1).max(1000), usuario: user });
export const replaceAssignmentSchema = z.object({ idTarjetaNueva: z.coerce.bigint().positive(), idEstadoAsignacion: z.number().int().positive(), motivoReemplazo: z.string().trim().min(1).max(1000), fechaInicioVigencia: z.coerce.date().optional(), fechaFinVigencia: date, usuario: user, idPerfilAcceso: z.number().int().positive().nullable().optional() });
export type Query = z.infer<typeof querySchema>; export type Create = z.infer<typeof createSchema>; export type Update = z.infer<typeof updateSchema>; export type State = z.infer<typeof stateSchema>;
export type AssignmentQuery = z.infer<typeof assignmentQuerySchema>; export type AssignmentInput = z.infer<typeof assignmentInput>; export type ReturnAssignment = z.infer<typeof returnAssignmentSchema>; export type RenewAssignment = z.infer<typeof renewAssignmentSchema>; export type ReplaceAssignment = z.infer<typeof replaceAssignmentSchema>;
export type HistoryQuery = z.infer<typeof historyQuerySchema>;
