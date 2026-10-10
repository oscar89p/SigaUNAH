import { z } from "zod";

const date = z.coerce.date().nullable().optional();
const user = z.string().trim().min(1).max(90);

export const idSchema = z.object({ id: z.coerce.bigint().positive() });
export const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  idEstadoSolicitud: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["idSolicitud", "codigoSolicitud", "beneficiario", "fechaSolicitud", "estado", "fechaRegistro"]).default("fechaSolicitud"),
  sortDirection: z.enum(["asc", "desc"]).default("desc")
});

const fields = z.object({
  codigoSolicitud: z.string().trim().min(1).max(30),
  idBeneficiario: z.coerce.bigint().positive(),
  idPeriodoAcademico: z.number().int().positive().nullable().optional(),
  idTipoSolicitud: z.number().int().positive().nullable().optional(),
  idTipoVigencia: z.number().int().positive(),
  idEstadoSolicitud: z.number().int().positive(),
  fechaInicioSolicitada: date,
  fechaFinSolicitada: date,
  motivoSolicitud: z.string().trim().max(1500).nullable().optional(),
  origenSolicitud: z.string().trim().min(1).max(30)
}).superRefine((value, context) => {
  if (value.fechaInicioSolicitada && value.fechaFinSolicitada && value.fechaFinSolicitada < value.fechaInicioSolicitada) {
    context.addIssue({ code: "custom", path: ["fechaFinSolicitada"], message: "La fecha final no puede ser anterior a la fecha inicial" });
  }
});

export const createSchema = fields.extend({ usuarioRegistro: user });
export const updateSchema = fields.extend({ usuarioActualizacion: user });
export const stateSchema = z.object({ idEstadoSolicitudNuevo: z.number().int().positive(), motivoCambio: z.string().trim().max(1000).nullable().optional(), usuarioRegistro: user, usuarioActualizacion: user });
export type Query = z.infer<typeof querySchema>;
export type Create = z.infer<typeof createSchema>;
export type Update = z.infer<typeof updateSchema>;
export type State = z.infer<typeof stateSchema>;
