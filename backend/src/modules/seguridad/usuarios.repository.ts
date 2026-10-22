import sql from "mssql";

import { canGrantPermissions } from "../auth/authorization.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import type { Create, Query, State, Update } from "./usuarios.types.js";
import { stringifyJsonSafe } from "../../shared/serialization/json.js";

export interface AuditContext { actorId: number; actorName: string; ip?: string; agent?: string; permissions?: string[]; }
export interface UserRecord {
  idUsuario: number | string; nombreUsuario: string; correoElectronico: string; nombreAcceso: string;
  identificadorInstitucional: string | null; tipoAutenticacion: string; estadoUsuario: boolean;
  ultimoAcceso: Date | null; fechaRegistro: Date; usuarioRegistro: string;
  usuarioActualizacion: string | null; fechaActualizacion: Date | null;
  perfiles: Array<{ idPerfil: number; codigoPerfil: string; nombrePerfil: string }>;
}

const sortColumns = {
  idUsuario: "u.idUsuario", nombreUsuario: "u.nombreUsuario", nombreAcceso: "u.nombreAcceso",
  correoElectronico: "u.correoElectronico", estadoUsuario: "u.estadoUsuario", fechaRegistro: "u.fechaRegistro"
} as const;
const userColumns = `u.idUsuario,u.nombreUsuario,u.correoElectronico,u.nombreAcceso,
  u.identificadorInstitucional,u.tipoAutenticacion,u.estadoUsuario,u.ultimoAcceso,
  u.fechaRegistro,u.usuarioRegistro,u.usuarioActualizacion,u.fechaActualizacion`;

function addProfileInputs(request: sql.Request, ids: number[]) {
  ids.forEach((id, index) => request.input(`profile${index}`, sql.Int, id));
  return ids.map((_, index) => `@profile${index}`).join(",") || "NULL";
}

async function validateProfiles(request: sql.Request, ids: number[], actorPermissions: string[] = []) {
  const inClause = addProfileInputs(request, ids);
  const result = await request.query<{ idPerfil: number }>(`SELECT idPerfil FROM Seguridad.tblPerfiles WHERE estadoPerfil=1 AND idPerfil IN (${inClause})`);
  if (new Set(result.recordset.map(row => row.idPerfil)).size !== new Set(ids).size) {
    throw new HttpError(400, "Uno o más perfiles no existen o están inactivos");
  }
  if (ids.length) {
    const profileParams = ids.map((id, index) => { request.input(`checkProfile${index}`, sql.Int, id); return `@checkProfile${index}`; });
    const permissionParams = actorPermissions.map((permission, index) => { request.input(`actorPermission${index}`, sql.NVarChar(80), permission); return `@actorPermission${index}`; });
    const higher = await request.query<{ codigoPermiso: string }>(`SELECT DISTINCT pe.codigoPermiso FROM Seguridad.tblPerfilesPermisos pp INNER JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.estadoPermiso=1 WHERE pp.estadoPerfilPermiso=1 AND pp.idPerfil IN (${profileParams.join(",")}) AND pe.codigoPermiso NOT IN (${permissionParams.join(",") || "N'__NO_ACTOR_PERMISSION__'"})`);
    if (!canGrantPermissions(higher.recordset.map(row => row.codigoPermiso), actorPermissions)) throw new HttpError(403, "No puede asignar perfiles con permisos que usted no posee");
  }
}

async function profilesFor(request: sql.Request, idUsuario: number | string) {
  return (await request.input("profileUserId", sql.BigInt, idUsuario).query<{ idPerfil: number; codigoPerfil: string; nombrePerfil: string }>(`
    SELECT p.idPerfil,p.codigoPerfil,p.nombrePerfil
    FROM Seguridad.tblUsuariosPerfiles up
    INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil=up.idPerfil
    WHERE up.idUsuario=@profileUserId AND up.estadoUsuarioPerfil=1 AND p.estadoPerfil=1
    ORDER BY p.nombrePerfil`)).recordset;
}

async function hydrate(pool: sql.ConnectionPool, row: UserRecord): Promise<UserRecord> {
  row.perfiles = await profilesFor(pool.request(), row.idUsuario);
  return row;
}

async function hydrateMany(pool: sql.ConnectionPool, rows: UserRecord[]): Promise<UserRecord[]> {
  if (!rows.length) return rows;
  const request = pool.request();
  const params = rows.map((row, index) => {
    request.input(`user${index}`, sql.BigInt, row.idUsuario);
    return `@user${index}`;
  });
  const assignments = await request.query<{ idUsuario: number | string; idPerfil: number; codigoPerfil: string; nombrePerfil: string }>(`
    SELECT up.idUsuario,p.idPerfil,p.codigoPerfil,p.nombrePerfil
    FROM Seguridad.tblUsuariosPerfiles up
    INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil=up.idPerfil AND p.estadoPerfil=1
    WHERE up.estadoUsuarioPerfil=1 AND up.idUsuario IN (${params.join(",")})
    ORDER BY p.nombrePerfil`);
  const byUser = new Map(rows.map(row => [String(row.idUsuario), [] as UserRecord["perfiles"]]));
  for (const profile of assignments.recordset) byUser.get(String(profile.idUsuario))?.push({ idPerfil: profile.idPerfil, codigoPerfil: profile.codigoPerfil, nombrePerfil: profile.nombrePerfil });
  return rows.map(row => ({ ...row, perfiles: byUser.get(String(row.idUsuario)) ?? [] }));
}

export async function list(query: Query) {
  const pool = await getDatabasePool();
  const request = pool.request().input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const countRequest = pool.request();
  const predicates: string[] = [];
  if (query.search) {
    predicates.push("(u.nombreUsuario LIKE @search OR u.nombreAcceso LIKE @search OR u.correoElectronico LIKE @search OR u.identificadorInstitucional LIKE @search)");
    request.input("search", sql.NVarChar(150), `%${query.search}%`);
    countRequest.input("search", sql.NVarChar(150), `%${query.search}%`);
  }
  if (query.estado !== "all") {
    predicates.push("u.estadoUsuario=@estado");
    const active = query.estado === "active";
    request.input("estado", sql.Bit, active); countRequest.input("estado", sql.Bit, active);
  }
  const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";
  const direction = query.sortDirection === "desc" ? "DESC" : "ASC";
  const data = await request.query<UserRecord>(`SELECT ${userColumns} FROM Seguridad.tblUsuarios u ${where} ORDER BY ${sortColumns[query.sortBy]} ${direction},u.idUsuario OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`);
  const total = await countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total FROM Seguridad.tblUsuarios u ${where}`);
  return { items: await hydrateMany(pool, data.recordset), total: total.recordset[0]?.total ?? 0 };
}

export async function find(id: bigint | number | string) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("id", sql.BigInt, id).query<UserRecord>(`SELECT ${userColumns} FROM Seguridad.tblUsuarios u WHERE u.idUsuario=@id`);
  const row = result.recordset[0];
  return row ? hydrate(pool, row) : null;
}

export async function profiles() {
  const pool = await getDatabasePool();
  const result = await pool.request().query(`SELECT idPerfil,codigoPerfil,nombrePerfil,descripcionPerfil FROM Seguridad.tblPerfiles WHERE estadoPerfil=1 ORDER BY nombrePerfil`);
  return result.recordset;
}

async function audit(request: sql.Request, context: AuditContext, action: string, id: number | string, before: unknown, after: unknown) {
  await request.input("auditUser", sql.BigInt, context.actorId).input("auditModule", sql.NVarChar(80), "SEGURIDAD")
    .input("auditEntity", sql.NVarChar(150), "tblUsuarios").input("auditId", sql.NVarChar(100), String(id))
    .input("auditAction", sql.NVarChar(30), action).input("auditBefore", sql.NVarChar(sql.MAX), stringifyJsonSafe(before))
    .input("auditAfter", sql.NVarChar(sql.MAX), stringifyJsonSafe(after)).input("auditIp", sql.NVarChar(45), context.ip ?? null)
    .input("auditAgent", sql.NVarChar(500), context.agent ?? null).input("auditRegistration", sql.NVarChar(90), context.actorName)
    .query(`INSERT INTO Auditoria.tblBitacoras (idUsuario,modulo,entidad,identificadorRegistro,accion,datosAnteriores,datosNuevos,direccionIp,agenteUsuario,usuarioRegistro) VALUES (@auditUser,@auditModule,@auditEntity,@auditId,@auditAction,@auditBefore,@auditAfter,@auditIp,@auditAgent,@auditRegistration)`);
}

async function assertAdministratorRemains(request: sql.Request) {
  const result = await request.query<{ total: number }>(`
    SELECT COUNT(DISTINCT u.idUsuario) AS total
    FROM Seguridad.tblUsuarios u WITH (UPDLOCK,HOLDLOCK)
    INNER JOIN Seguridad.tblUsuariosPerfiles up ON up.idUsuario=u.idUsuario AND up.estadoUsuarioPerfil=1
    INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil=up.idPerfil AND p.estadoPerfil=1
    INNER JOIN Seguridad.tblPerfilesPermisos pp ON pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1
    INNER JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso AND pe.estadoPermiso=1 AND pe.codigoPermiso=N'USUARIOS_ADMINISTRAR'
    WHERE u.estadoUsuario=1`);
  if ((result.recordset[0]?.total ?? 0) < 1) throw new HttpError(409, "Debe existir al menos un administrador activo");
}

export async function create(data: Create, context: AuditContext, passwordHash: string) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction); await validateProfiles(request, data.profileIds, context.permissions);
    const inserted = await new sql.Request(transaction).input("nombreUsuario", sql.NVarChar(150), data.nombreUsuario).input("correo", sql.NVarChar(150), data.correoElectronico).input("acceso", sql.NVarChar(90), data.nombreAcceso).input("hash", sql.NVarChar(500), passwordHash).input("institucional", sql.NVarChar(50), data.identificadorInstitucional ?? null).input("tipo", sql.NVarChar(20), "LOCAL").input("registro", sql.NVarChar(90), context.actorName).query<{ idUsuario: number | string }>(`INSERT INTO Seguridad.tblUsuarios (nombreUsuario,correoElectronico,nombreAcceso,claveHash,identificadorInstitucional,tipoAutenticacion,usuarioRegistro) OUTPUT INSERTED.idUsuario VALUES (@nombreUsuario,@correo,@acceso,@hash,@institucional,@tipo,@registro)`);
    const id = inserted.recordset[0]?.idUsuario;
    if (id === undefined) throw new HttpError(500, "No fue posible crear el usuario");
    for (const profileId of data.profileIds) await new sql.Request(transaction).input("userId", sql.BigInt, id).input("profileId", sql.Int, profileId).input("registration", sql.NVarChar(90), context.actorName).query(`INSERT INTO Seguridad.tblUsuariosPerfiles (idUsuario,idPerfil,usuarioRegistro) VALUES (@userId,@profileId,@registration)`);
    const { password: _password, ...safeData } = data;
    await audit(new sql.Request(transaction), context, "CREAR", id, null, { ...safeData, estadoUsuario: true, tipoAutenticacion: "LOCAL" });
    await transaction.commit(); return find(id);
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

export async function update(id: bigint, data: Update, context: AuditContext, passwordHash?: string) {
  const before = await find(id); if (!before) return null;
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const request = new sql.Request(transaction); await validateProfiles(request, data.profileIds, context.permissions);
    const passwordPart = passwordHash ? ",claveHash=@hash" : "";
    const userRequest = new sql.Request(transaction).input("id", sql.BigInt, id).input("nombreUsuario", sql.NVarChar(150), data.nombreUsuario).input("correo", sql.NVarChar(150), data.correoElectronico).input("acceso", sql.NVarChar(90), data.nombreAcceso).input("institucional", sql.NVarChar(50), data.identificadorInstitucional ?? null).input("actualizacion", sql.NVarChar(90), context.actorName);
    if (passwordHash) userRequest.input("hash", sql.NVarChar(500), passwordHash);
    await userRequest.query(`UPDATE Seguridad.tblUsuarios SET nombreUsuario=@nombreUsuario,correoElectronico=@correo,nombreAcceso=@acceso,identificadorInstitucional=@institucional${passwordPart},usuarioActualizacion=@actualizacion,fechaActualizacion=sysdatetime() WHERE idUsuario=@id`);
    await new sql.Request(transaction).input("id", sql.BigInt, id).input("actualizacion", sql.NVarChar(90), context.actorName).query(`UPDATE Seguridad.tblUsuariosPerfiles SET estadoUsuarioPerfil=0,usuarioActualizacion=@actualizacion,fechaActualizacion=sysdatetime() WHERE idUsuario=@id`);
    for (const profileId of data.profileIds) await new sql.Request(transaction).input("userId", sql.BigInt, id).input("profileId", sql.Int, profileId).input("registration", sql.NVarChar(90), context.actorName).query(`MERGE Seguridad.tblUsuariosPerfiles AS target USING (SELECT @userId AS idUsuario,@profileId AS idPerfil) AS source ON target.idUsuario=source.idUsuario AND target.idPerfil=source.idPerfil WHEN MATCHED THEN UPDATE SET estadoUsuarioPerfil=1,usuarioActualizacion=@registration,fechaActualizacion=sysdatetime() WHEN NOT MATCHED THEN INSERT (idUsuario,idPerfil,usuarioRegistro) VALUES (source.idUsuario,source.idPerfil,@registration);`);
    await assertAdministratorRemains(new sql.Request(transaction));
    const { password: _password, ...safeData } = data;
    await audit(new sql.Request(transaction), context, "ACTUALIZAR", String(id), before, { ...safeData, estadoUsuario: before.estadoUsuario, tipoAutenticacion: before.tipoAutenticacion });
    await transaction.commit(); return find(id);
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

export async function state(id: bigint, data: State, context: AuditContext) {
  const before = await find(id); if (!before) return null;
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    await new sql.Request(transaction).input("id", sql.BigInt, id).input("state", sql.Bit, data.estadoUsuario).input("actualizacion", sql.NVarChar(90), context.actorName).query(`UPDATE Seguridad.tblUsuarios SET estadoUsuario=@state,usuarioActualizacion=@actualizacion,fechaActualizacion=sysdatetime() WHERE idUsuario=@id`);
    if (!data.estadoUsuario) await assertAdministratorRemains(new sql.Request(transaction));
    await audit(new sql.Request(transaction), context, data.estadoUsuario ? "ACTIVAR" : "DESACTIVAR", String(id), before, { estadoUsuario: data.estadoUsuario });
    await transaction.commit(); return find(id);
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
