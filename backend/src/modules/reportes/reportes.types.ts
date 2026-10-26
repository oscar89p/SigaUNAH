import { z } from "zod";

export const reportQuerySchema = z.object({
  idCampus: z.coerce.number().int().positive().optional(),
  idEdificio: z.coerce.number().int().positive().optional(),
  idTipoBeneficiario: z.coerce.number().int().positive().optional(),
  estado: z.enum(["all", "active", "inactive"]).default("all"),
  desde: z.string().date().optional(),
  hasta: z.string().date().optional()
}).refine(query => !query.desde || !query.hasta || query.desde <= query.hasta, {
  path: ["hasta"], message: "La fecha hasta debe ser igual o posterior a la fecha desde"
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;

const pageSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).default(""),
  desde: z.string().date().optional(),
  hasta: z.string().date().optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc")
}).refine(query => !query.desde || !query.hasta || query.desde <= query.hasta, {
  path: ["hasta"], message: "La fecha hasta debe ser igual o posterior a la fecha desde"
});

export const beneficiaryReportQuerySchema = pageSchema.extend({
  estado: z.enum(["all", "active", "inactive"]).default("all"),
  idTipoBeneficiario: z.coerce.number().int().positive().optional(),
  idTipoCondicion: z.coerce.number().int().positive().optional()
});
export type BeneficiaryReportQuery = z.infer<typeof beneficiaryReportQuerySchema>;

export const requestReportQuerySchema = pageSchema.extend({
  idEstadoSolicitud: z.coerce.number().int().positive().optional(),
  codigoEstadoSolicitud: z.string().trim().max(100).optional(),
  idPeriodoAcademico: z.coerce.number().int().positive().optional(),
  idBeneficiario: z.coerce.bigint().positive().optional(),
  sinAsignacion: z.coerce.boolean().default(false)
});
export type RequestReportQuery = z.infer<typeof requestReportQuerySchema>;

export const cardReportQuerySchema = pageSchema.extend({
  idEstadoTarjeta: z.coerce.number().int().positive().optional(),
  idTipoTarjeta: z.coerce.number().int().positive().optional(),
  disponibilidad: z.enum(["all", "available", "assigned"]).default("all")
});
export type CardReportQuery = z.infer<typeof cardReportQuerySchema>;

export const assignmentReportQuerySchema = pageSchema.extend({
  estado: z.enum(["all", "vigentes", "vencidas", "proximas", "finalizadas"]).default("all"),
  idEstadoAsignacion: z.coerce.number().int().positive().optional(),
  idBeneficiario: z.coerce.bigint().positive().optional(),
  idTarjeta: z.coerce.bigint().positive().optional(),
  proximasDias: z.coerce.number().int().min(1).max(365).default(15)
});
export type AssignmentReportQuery = z.infer<typeof assignmentReportQuerySchema>;

export const historyReportQuerySchema = pageSchema.extend({
  idBeneficiario: z.coerce.bigint().positive().optional(),
  idTarjeta: z.coerce.bigint().positive().optional(),
  tipoMovimiento: z.enum(["asignacion", "solicitud", "tarjeta", "all"]).default("all")
});
export type HistoryReportQuery = z.infer<typeof historyReportQuerySchema>;

export const reportExportParamsSchema = z.object({ tipo: z.enum(["beneficiarios", "solicitudes", "tarjetas", "asignaciones", "historial"]) });
export const reportExportFormatSchema = z.object({ formato: z.enum(["xlsx", "pdf"]) });
export type ReportExportType = z.infer<typeof reportExportParamsSchema>["tipo"];
export type ReportExportFormat = z.infer<typeof reportExportFormatSchema>["formato"];
