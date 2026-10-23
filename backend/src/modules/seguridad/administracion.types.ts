import { z } from "zod";
import { backendPermissionCodes, permissionCatalogCodes } from "../auth/authorization.js";

const pageSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(150).optional(),
  estado: z.enum(["all", "active", "inactive"]).default("all"),
  sortDirection: z.enum(["asc", "desc"]).default("asc")
});

export const profileQuerySchema = pageSchema.extend({
  sortBy: z.enum(["codigoPerfil", "nombrePerfil", "estadoPerfil", "fechaRegistro"]).default("nombrePerfil")
});
export const permissionQuerySchema = pageSchema.extend({
  modulo: z.string().trim().max(50).optional(),
  idPerfil: z.coerce.number().int().positive().optional()
});
export const navigationQuerySchema = pageSchema.extend({
  idPerfil: z.coerce.number().int().positive().optional()
});
export const auditQuerySchema = pageSchema.extend({
  desde: z.string().date().optional(),
  hasta: z.string().date().optional(),
  idUsuario: z.coerce.bigint().positive().optional(),
  evento: z.string().trim().max(80).optional(),
  resultado: z.enum(["all", "correcto", "fallido"]).default("all")
}).refine(query => !query.desde || !query.hasta || query.desde <= query.hasta, { path: ["hasta"], message: "La fecha hasta debe ser igual o posterior a la fecha desde" });

const idsSchema = z.array(z.coerce.number().int().positive()).max(200)
  .refine(ids => new Set(ids).size === ids.length, "No se permiten registros duplicados");
export const idsBodySchema = z.object({ ids: idsSchema });
export const idSchema = z.object({ id: z.coerce.number().int().positive() });
export const profileSchema = z.object({
  codigoPerfil: z.string().trim().min(1).max(30).regex(/^[A-Z0-9_-]+$/i),
  nombrePerfil: z.string().trim().min(1).max(100),
  descripcionPerfil: z.string().trim().max(500).nullable().optional()
});
const permissionFields = z.object({
  nombrePermiso: z.string().trim().min(1).max(150),
  descripcionPermiso: z.string().trim().max(500).nullable().optional(),
  moduloPermiso: z.string().trim().min(1).max(50)
});
export const createPermissionSchema = permissionFields.extend({ codigoPermiso: z.enum(permissionCatalogCodes) });
export const updatePermissionSchema = permissionFields.extend({ codigoPermiso: z.enum(backendPermissionCodes) });
export const stateSchema = z.object({ estado: z.boolean() });

export const navigationSchema = z.object({
  codigoNavegacion: z.string().trim().min(1).max(64).regex(/^[A-Z0-9_-]+$/i),
  nombreNavegacion: z.string().trim().min(1).max(128),
  tituloNavegacion: z.string().trim().min(1).max(128),
  descripcionNavegacion: z.string().trim().max(512).nullable().optional(),
  tipoNavegacion: z.string().trim().min(1).max(16),
  enlaceNavegacion: z.string().trim().max(256).nullable().optional(),
  claseNavegacion: z.string().trim().max(64).nullable().optional(),
  ordenNavegacion: z.coerce.number().int().min(-32768).max(32767),
  idNavegacionPadre: z.coerce.number().int().positive().nullable().optional(),
  esVisible: z.boolean().default(true)
});

export const parameterValueSchema = z.object({ valor: z.string().max(1000) });
export const parameterQuerySchema = pageSchema.extend({ sortBy: z.enum(["codigoParametro", "nombreParametro", "tipoDato", "estadoParametro"]).default("codigoParametro") });
export const parameterValueQuerySchema = pageSchema.extend({ idParametro: z.coerce.number().int().positive().optional(), sortBy: z.enum(["codigoParametroValor", "nombreParametroValor", "tipoParametroValor", "estadoParametroValor"]).default("nombreParametroValor") });
const parameterFields = z.object({ codigoParametro: z.string().trim().min(1).max(80).regex(/^[A-Z0-9_.-]+$/i), nombreParametro: z.string().trim().min(1).max(150), descripcionParametro: z.string().trim().max(500).nullable().optional(), tipoDato: z.string().trim().min(1).max(20), valorPredeterminado: z.string().max(1000).nullable().optional(), permiteModificacion: z.boolean().default(true) });
export const parameterSchema = parameterFields;
export const parameterValueAdminSchema = z.object({ idParametro: z.coerce.number().int().positive(), valorParametro: z.string().trim().min(1).max(1000), codigoParametroValor: z.string().trim().min(1).max(80).regex(/^[A-Z0-9_.-]+$/i), nombreParametroValor: z.string().trim().min(1).max(150), descripcionParametroValor: z.string().trim().max(500).nullable().optional(), tipoParametroValor: z.string().trim().min(1).max(64), fechaInicioVigencia: z.coerce.date().nullable().optional(), fechaFinVigencia: z.coerce.date().nullable().optional() }).superRefine((value, context) => { if (value.fechaInicioVigencia && value.fechaFinVigencia && value.fechaFinVigencia < value.fechaInicioVigencia) context.addIssue({ code: "custom", path: ["fechaFinVigencia"], message: "La fecha final no puede ser anterior a la inicial" }); });
export const catalogQuerySchema = pageSchema.extend({ sortBy: z.enum(["codigoTipo", "nombreTipo", "estadoTipo"]).default("codigoTipo") });
export const catalogValueQuerySchema = pageSchema.extend({ idTipo: z.coerce.number().int().positive().optional(), sortBy: z.enum(["codigoTipoValor", "nombreTipoValor", "ordenTipoValor", "estadoTipoValor"]).default("ordenTipoValor") });
export const catalogSchema = z.object({ idCategoria: z.coerce.number().int().positive(), codigoTipo: z.string().trim().min(1).max(100).regex(/^[A-Z0-9_-]+$/i), nombreTipo: z.string().trim().min(1).max(150), descripcionTipo: z.string().trim().max(500).nullable().optional() });
export const catalogValueSchema = z.object({ idTipo: z.coerce.number().int().positive(), codigoTipoValor: z.string().trim().min(1).max(100).regex(/^[A-Z0-9_.-]+$/i), nombreTipoValor: z.string().trim().min(1).max(150), descripcionTipoValor: z.string().trim().max(500).nullable().optional(), ordenTipoValor: z.coerce.number().int().min(-32768).max(32767) });

export type PageQuery = z.infer<typeof pageSchema>;
export type ProfileQuery = z.infer<typeof profileQuerySchema>;
export type PermissionQuery = z.infer<typeof permissionQuerySchema>;
export type NavigationQuery = z.infer<typeof navigationQuerySchema>;
export type AuditQuery = z.infer<typeof auditQuerySchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type NavigationInput = z.infer<typeof navigationSchema>;
export type AuditContext = { actorId: number; actorName: string; ip?: string; agent?: string };
export type ParameterQuery = z.infer<typeof parameterQuerySchema>;
export type ParameterValueQuery = z.infer<typeof parameterValueQuerySchema>;
export type ParameterInput = z.infer<typeof parameterSchema>;
export type ParameterValueAdminInput = z.infer<typeof parameterValueAdminSchema>;
export type CatalogQuery = z.infer<typeof catalogQuerySchema>; export type CatalogValueQuery = z.infer<typeof catalogValueQuerySchema>; export type CatalogInput = z.infer<typeof catalogSchema>; export type CatalogValueInput = z.infer<typeof catalogValueSchema>;
