import sql from "mssql";

import { HttpError } from "../../shared/errors/http-error.js";
import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import { stringifyJsonSafe } from "../../shared/serialization/json.js";
import type { AuditContext } from "../seguridad/administracion.types.js";
import type { PeriodInput, PeriodQuery } from "./periodos-academicos.types.js";

const table = "DbSigaUNAH.Academico.tblPeriodosAcademicos";
const columns = `p.idPeriodoAcademico,p.idInstitucion,p.codigoPeriodoAcademico,p.nombrePeriodoAcademico,p.fechaInicioPeriodoAcademico,p.fechaFinPeriodoAcademico,p.estadoPeriodoAcademico,p.fechaRegistro,p.usuarioRegistro,p.fechaActualizacion,p.usuarioActualizacion,
  CASE WHEN CAST(GETDATE() AS date) < p.fechaInicioPeriodoAcademico THEN N'PROGRAMADO' WHEN CAST(GETDATE() AS date) > p.fechaFinPeriodoAcademico THEN N'FINALIZADO' ELSE N'VIGENTE' END AS vigenciaPeriodoAcademico`;
const sortColumns = { codigoPeriodoAcademico: "p.codigoPeriodoAcademico", nombrePeriodoAcademico: "p.nombrePeriodoAcademico", fechaInicioPeriodoAcademico: "p.fechaInicioPeriodoAcademico", fechaFinPeriodoAcademico: "p.fechaFinPeriodoAcademico", estadoPeriodoAcademico: "p.estadoPeriodoAcademico" } as const;
const from = `FROM ${table} p`;

function pageResult<T>(items: T[], total: number, query: PeriodQuery) { return { items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } }; }

async function activeInstitution(request: sql.Request) {
  const result = await request.query<{ idInstitucion: number }>(`SELECT TOP (1) idInstitucion FROM DbSigaUNAH.Academico.tblInstituciones WHERE estadoInstitucion=1 ORDER BY idInstitucion`);
  const id = result.recordset[0]?.idInstitucion;
  if (!id) throw new HttpError(409, "No existe una institución académica activa configurada");
  return id;
}

async function audit(request: sql.Request, actor: AuditContext, id: number, action: string, before: unknown, after: unknown) {
  await request.input("auditUser", sql.BigInt, actor.actorId).input("auditModule", sql.NVarChar(80), "ACADEMICO")
    .input("auditEntity", sql.NVarChar(150), "tblPeriodosAcademicos").input("auditId", sql.NVarChar(100), String(id))
    .input("auditAction", sql.NVarChar(30), action).input("auditBefore", sql.NVarChar(sql.MAX), stringifyJsonSafe(before))
    .input("auditAfter", sql.NVarChar(sql.MAX), stringifyJsonSafe(after)).input("auditIp", sql.NVarChar(45), actor.ip ?? null)
    .input("auditAgent", sql.NVarChar(500), actor.agent ?? null).input("auditRegistration", sql.NVarChar(90), actor.actorName)
    .query(`INSERT INTO DbSigaUNAH.Auditoria.tblBitacoras (idUsuario,modulo,entidad,identificadorRegistro,accion,datosAnteriores,datosNuevos,direccionIp,agenteUsuario,usuarioRegistro) VALUES (@auditUser,@auditModule,@auditEntity,@auditId,@auditAction,@auditBefore,@auditAfter,@auditIp,@auditAgent,@auditRegistration)`);
}

async function current(request: sql.Request, id: number) {
  const result = await request.input("id", sql.Int, id).query(`SELECT ${columns} ${from} WHERE p.idPeriodoAcademico=@id`);
  if (!result.recordset[0]) throw new HttpError(404, "Período académico no encontrado");
  return result.recordset[0] as Record<string, unknown>;
}

export async function list(query: PeriodQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request();
  const predicates: string[] = [];
  if (query.search) { predicates.push("(p.codigoPeriodoAcademico LIKE @search OR p.nombrePeriodoAcademico LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); countRequest.input("search", sql.NVarChar(150), `%${query.search}%`); }
  if (query.estado !== "all") { predicates.push("p.estadoPeriodoAcademico=@state"); request.input("state", sql.Bit, query.estado === "active"); countRequest.input("state", sql.Bit, query.estado === "active"); }
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";
  request.input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const [data, total] = await Promise.all([
    request.query(`SELECT ${columns} ${from} ${where} ORDER BY ${sortColumns[query.sortBy]} ${query.sortDirection === "desc" ? "DESC" : "ASC"},p.idPeriodoAcademico OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${from} ${where}`)
  ]);
  return pageResult(data.recordset, total.recordset[0]?.total ?? 0, query);
}

export async function find(id: number) { const pool = await getDatabasePool(); return current(pool.request(), id); }

export async function create(data: PeriodInput, actor: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const request = new sql.Request(transaction); const institution = await activeInstitution(request);
    const result = await new sql.Request(transaction).input("institution", sql.Int, institution).input("code", sql.NVarChar(30), data.codigoPeriodoAcademico).input("name", sql.NVarChar(150), data.nombrePeriodoAcademico).input("start", sql.Date, data.fechaInicioPeriodoAcademico).input("end", sql.Date, data.fechaFinPeriodoAcademico).input("state", sql.Bit, data.estadoPeriodoAcademico).input("actor", sql.NVarChar(90), actor.actorName)
      .query<{ idPeriodoAcademico: number }>(`INSERT INTO ${table}(idInstitucion,codigoPeriodoAcademico,nombrePeriodoAcademico,fechaInicioPeriodoAcademico,fechaFinPeriodoAcademico,periodoActualAcademico,estadoPeriodoAcademico,fechaInicio,fechaFin,usuarioRegistro) OUTPUT INSERTED.idPeriodoAcademico VALUES(@institution,@code,@name,@start,@end,CASE WHEN CAST(GETDATE() AS date) BETWEEN @start AND @end THEN 1 ELSE 0 END,@state,@start,@end,@actor)`);
    const id = result.recordset[0]?.idPeriodoAcademico; if (!id) throw new HttpError(500, "No fue posible crear el período académico");
    const after = await current(new sql.Request(transaction), id); await audit(new sql.Request(transaction), actor, id, "CREAR", null, after); await transaction.commit(); return after;
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

export async function update(id: number, data: PeriodInput, actor: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try { await transaction.begin(); const before = await current(new sql.Request(transaction), id);
    await new sql.Request(transaction).input("id", sql.Int, id).input("code", sql.NVarChar(30), data.codigoPeriodoAcademico).input("name", sql.NVarChar(150), data.nombrePeriodoAcademico).input("start", sql.Date, data.fechaInicioPeriodoAcademico).input("end", sql.Date, data.fechaFinPeriodoAcademico).input("state", sql.Bit, data.estadoPeriodoAcademico).input("actor", sql.NVarChar(90), actor.actorName).query(`UPDATE ${table} SET codigoPeriodoAcademico=@code,nombrePeriodoAcademico=@name,fechaInicioPeriodoAcademico=@start,fechaFinPeriodoAcademico=@end,periodoActualAcademico=CASE WHEN CAST(GETDATE() AS date) BETWEEN @start AND @end THEN 1 ELSE 0 END,estadoPeriodoAcademico=@state,fechaInicio=@start,fechaFin=@end,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idPeriodoAcademico=@id`);
    const after = await current(new sql.Request(transaction), id); await audit(new sql.Request(transaction), actor, id, "ACTUALIZAR", before, after); await transaction.commit(); return after;
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

export async function setState(id: number, state: boolean, actor: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try { await transaction.begin(); const before = await current(new sql.Request(transaction), id); await new sql.Request(transaction).input("id", sql.Int, id).input("state", sql.Bit, state).input("actor", sql.NVarChar(90), actor.actorName).query(`UPDATE ${table} SET estadoPeriodoAcademico=@state,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idPeriodoAcademico=@id`); const after = await current(new sql.Request(transaction), id); await audit(new sql.Request(transaction), actor, id, state ? "ACTIVAR" : "DESACTIVAR", before, after); await transaction.commit(); return after; }
  catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
