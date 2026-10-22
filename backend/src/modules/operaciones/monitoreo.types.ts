import { z } from "zod";

const baseQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  desde: z.string().date().optional(),
  hasta: z.string().date().optional()
}).refine(query => !query.desde || !query.hasta || query.desde <= query.hasta, {
  path: ["hasta"], message: "La fecha hasta debe ser igual o posterior a la fecha desde"
});

export const accessQuerySchema = baseQuery.extend({
  resultado: z.string().trim().max(30).optional(),
  idTarjeta: z.coerce.bigint().positive().optional(),
  idElevador: z.coerce.number().int().positive().optional(),
  idDispositivo: z.coerce.bigint().positive().optional()
});
export const incidentQuerySchema = baseQuery.extend({
  severidad: z.string().trim().max(20).optional(),
  resuelto: z.enum(["all", "open", "resolved"]).default("all")
});

export type AccessQuery = z.infer<typeof accessQuerySchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
