import { z } from "zod";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  estado: z.enum(["all", "active", "inactive"]).default("all"),
  sortDirection: z.enum(["asc", "desc"]).default("desc")
});

export const querySchema = pageSchema.extend({
  sortBy: z.enum(["codigoPeriodoAcademico", "nombrePeriodoAcademico", "fechaInicioPeriodoAcademico", "fechaFinPeriodoAcademico", "estadoPeriodoAcademico"]).default("fechaInicioPeriodoAcademico")
});

const fields = z.object({
  codigoPeriodoAcademico: z.string().trim().min(1).max(30).regex(/^[A-Z0-9._-]+$/i),
  nombrePeriodoAcademico: z.string().trim().min(1).max(150),
  fechaInicioPeriodoAcademico: z.coerce.date(),
  fechaFinPeriodoAcademico: z.coerce.date(),
  estadoPeriodoAcademico: z.boolean().default(true)
}).superRefine((value, context) => {
  if (value.fechaFinPeriodoAcademico < value.fechaInicioPeriodoAcademico) context.addIssue({ code: "custom", path: ["fechaFinPeriodoAcademico"], message: "La fecha final no puede ser anterior a la inicial" });
});

export const inputSchema = fields;
export const idSchema = z.object({ id: z.coerce.number().int().positive() });
export const stateSchema = z.object({ estado: z.boolean() });
export type PeriodQuery = z.infer<typeof querySchema>;
export type PeriodInput = z.infer<typeof inputSchema>;
