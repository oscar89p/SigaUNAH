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
