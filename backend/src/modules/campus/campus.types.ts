import { z } from "zod";

const auditUser = z.string().trim().min(1).max(90);

export const campusIdSchema = z.object({ id: z.coerce.number().int().positive() });
export const campusQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  estado: z.enum(["all", "active", "inactive"]).default("all"),
  sortBy: z.enum(["idCampus", "codigoCampus", "nombreCampus", "estadoCampus", "fechaRegistro"]).default("nombreCampus"),
  sortDirection: z.enum(["asc", "desc"]).default("asc")
});

export const campusCreateSchema = z.object({
  codigoCampus: z.string().trim().min(1).max(20),
  nombreCampus: z.string().trim().min(1).max(150),
  usuarioRegistro: auditUser
});

export const campusUpdateSchema = z.object({
  codigoCampus: z.string().trim().min(1).max(20),
  nombreCampus: z.string().trim().min(1).max(150),
  usuarioActualizacion: auditUser
});

export const campusStateSchema = z.object({
  estadoCampus: z.boolean(),
  usuarioActualizacion: auditUser
});

export type CampusQuery = z.infer<typeof campusQuerySchema>;
export type CampusCreate = z.infer<typeof campusCreateSchema>;
export type CampusUpdate = z.infer<typeof campusUpdateSchema>;
export type CampusState = z.infer<typeof campusStateSchema>;
