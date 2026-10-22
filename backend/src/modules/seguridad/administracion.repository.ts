import sql from "mssql";

import { backendPermissionCodes, permissionCatalogCodes } from "../auth/authorization.js";
import { HttpError } from "../../shared/errors/http-error.js";
import { getDatabasePool } from "../../shared/database/pool.js";
import { mapSqlError } from "../../shared/database/sql-error.js";
import type { AuditContext, AuditQuery, NavigationInput, NavigationQuery, PermissionQuery, ProfileInput, ProfileQuery } from "./administracion.types.js";
import { stringifyJsonSafe } from "../../shared/serialization/json.js";

const permissionPlaceholders = backendPermissionCodes.map((_, i) => `@known${i}`).join(",");
function bindKnownPermissions(request: sql.Request) {
  backendPermissionCodes.forEach((code, i) => request.input(`known${i}`, sql.NVarChar(80), code));
}
function pageResult<T>(items: T[], total: number, query: { page: number; pageSize: number }) {
  return { items, pagination: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } };
}
function auditValues(request: sql.Request, context: AuditContext, module: string, entity: string, id: number | string, action: string, before: unknown, after: unknown) {
  return request.input("auditUser", sql.BigInt, context.actorId).input("auditModule", sql.NVarChar(80), module)
    .input("auditEntity", sql.NVarChar(150), entity).input("auditId", sql.NVarChar(100), String(id))
    .input("auditAction", sql.NVarChar(30), action).input("auditBefore", sql.NVarChar(sql.MAX), stringifyJsonSafe(before))
    .input("auditAfter", sql.NVarChar(sql.MAX), stringifyJsonSafe(after)).input("auditIp", sql.NVarChar(45), context.ip ?? null)
    .input("auditAgent", sql.NVarChar(500), context.agent ?? null).input("auditRegistration", sql.NVarChar(90), context.actorName);
}
async function audit(request: sql.Request, context: AuditContext, module: string, entity: string, id: number | string, action: string, before: unknown, after: unknown) {
  await auditValues(request, context, module, entity, id, action, before, after).query(`
    INSERT INTO Auditoria.tblBitacoras (idUsuario,modulo,entidad,identificadorRegistro,accion,datosAnteriores,datosNuevos,direccionIp,agenteUsuario,usuarioRegistro)
    VALUES (@auditUser,@auditModule,@auditEntity,@auditId,@auditAction,@auditBefore,@auditAfter,@auditIp,@auditAgent,@auditRegistration)`);
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
async function requireProfile(request: sql.Request, id: number) {
  const result = await request.input("profileId", sql.Int, id).query(`SELECT idPerfil,codigoPerfil,nombrePerfil,descripcionPerfil,estadoPerfil,fechaRegistro FROM Seguridad.tblPerfiles WHERE idPerfil=@profileId`);
  if (!result.recordset[0]) throw new HttpError(404, "Perfil no encontrado");
  return result.recordset[0] as Record<string, unknown>;
}

const profileSort: Record<ProfileQuery["sortBy"], string> = { codigoPerfil: "p.codigoPerfil", nombrePerfil: "p.nombrePerfil", estadoPerfil: "p.estadoPerfil", fechaRegistro: "p.fechaRegistro" };
export async function listProfiles(query: ProfileQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request(); const where: string[] = [];
  if (query.search) { where.push("(p.codigoPerfil LIKE @search OR p.nombrePerfil LIKE @search OR p.descripcionPerfil LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); countRequest.input("search", sql.NVarChar(150), `%${query.search}%`); }
  if (query.estado !== "all") { const state = query.estado === "active"; where.push("p.estadoPerfil=@state"); request.input("state", sql.Bit, state); countRequest.input("state", sql.Bit, state); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  request.input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const [data, total] = await Promise.all([
    request.query(`SELECT p.idPerfil,p.codigoPerfil,p.nombrePerfil,p.descripcionPerfil,p.estadoPerfil,p.fechaRegistro,
      (SELECT COUNT(1) FROM Seguridad.tblUsuariosPerfiles up WHERE up.idPerfil=p.idPerfil AND up.estadoUsuarioPerfil=1) AS usuarios,
      (SELECT COUNT(1) FROM Seguridad.tblPerfilesPermisos pp WHERE pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1) AS permisos
      FROM Seguridad.tblPerfiles p ${clause} ORDER BY ${profileSort[query.sortBy]} ${query.sortDirection === "desc" ? "DESC" : "ASC"},p.idPerfil OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total FROM Seguridad.tblPerfiles p ${clause}`)
  ]);
  return pageResult(data.recordset, total.recordset[0]?.total ?? 0, query);
}
export async function getProfile(id: number) {
  const pool = await getDatabasePool();
  const result = await pool.request().input("id", sql.Int, id).query(`SELECT p.idPerfil,p.codigoPerfil,p.nombrePerfil,p.descripcionPerfil,p.estadoPerfil,p.fechaRegistro,p.usuarioRegistro,p.usuarioActualizacion,p.fechaActualizacion,
    (SELECT COUNT(1) FROM Seguridad.tblUsuariosPerfiles up WHERE up.idPerfil=p.idPerfil AND up.estadoUsuarioPerfil=1) AS usuarios,
    (SELECT COUNT(1) FROM Seguridad.tblPerfilesPermisos pp WHERE pp.idPerfil=p.idPerfil AND pp.estadoPerfilPermiso=1) AS permisos
    FROM Seguridad.tblPerfiles p WHERE p.idPerfil=@id`);
  if (!result.recordset[0]) throw new HttpError(404, "Perfil no encontrado");
  return result.recordset[0];
}
export async function createProfile(data: ProfileInput, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const result = await new sql.Request(transaction).input("code", sql.NVarChar(30), data.codigoPerfil).input("name", sql.NVarChar(100), data.nombrePerfil)
      .input("description", sql.NVarChar(500), data.descripcionPerfil ?? null).input("actor", sql.NVarChar(90), context.actorName)
      .query<{ idPerfil: number }>(`INSERT INTO Seguridad.tblPerfiles(codigoPerfil,nombrePerfil,descripcionPerfil,usuarioRegistro) OUTPUT INSERTED.idPerfil VALUES(@code,@name,@description,@actor)`);
    const id = result.recordset[0]?.idPerfil;
    if (!id) throw new HttpError(500, "No fue posible crear el perfil");
    const after = { idPerfil: id, ...data, estadoPerfil: true };
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPerfiles", id, "CREAR", null, after);
    await transaction.commit(); return after;
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function updateProfile(id: number, data: ProfileInput, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const request = new sql.Request(transaction); const before = await requireProfile(request, id);
    await new sql.Request(transaction).input("id", sql.Int, id).input("code", sql.NVarChar(30), data.codigoPerfil).input("name", sql.NVarChar(100), data.nombrePerfil)
      .input("description", sql.NVarChar(500), data.descripcionPerfil ?? null).input("actor", sql.NVarChar(90), context.actorName)
      .query(`UPDATE Seguridad.tblPerfiles SET codigoPerfil=@code,nombrePerfil=@name,descripcionPerfil=@description,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idPerfil=@id`);
    const after = { idPerfil: id, ...data, estadoPerfil: before.estadoPerfil };
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPerfiles", id, "ACTUALIZAR", before, after);
    await transaction.commit(); return after;
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function setProfileState(id: number, state: boolean, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const before = await requireProfile(new sql.Request(transaction), id);
    await new sql.Request(transaction).input("id", sql.Int, id).input("state", sql.Bit, state).input("actor", sql.NVarChar(90), context.actorName)
      .query(`UPDATE Seguridad.tblPerfiles SET estadoPerfil=@state,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idPerfil=@id`);
    if (!state) await assertAdministratorRemains(new sql.Request(transaction));
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPerfiles", id, state ? "ACTIVAR" : "DESACTIVAR", before, { ...before, estadoPerfil: state });
    await transaction.commit(); return { ...before, estadoPerfil: state };
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function usersForProfile(id: number, query: Pick<ProfileQuery, "page" | "pageSize" | "search" | "estado">) {
  const pool = await getDatabasePool(); const base = "FROM Seguridad.tblUsuariosPerfiles up INNER JOIN Seguridad.tblUsuarios u ON u.idUsuario=up.idUsuario";
  const params = (request: sql.Request) => { request.input("profileId", sql.Int, id); const clauses = ["up.idPerfil=@profileId", "up.estadoUsuarioPerfil=1"]; if (query.search) { clauses.push("(u.nombreUsuario LIKE @search OR u.nombreAcceso LIKE @search OR u.correoElectronico LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); } if (query.estado !== "all") { clauses.push("u.estadoUsuario=@state"); request.input("state", sql.Bit, query.estado === "active"); } return `WHERE ${clauses.join(" AND ")}`; };
  const request = pool.request(); const countRequest = pool.request(); const where = params(request); params(countRequest);
  request.input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const [data, total] = await Promise.all([
    request.query(`SELECT u.idUsuario,u.nombreUsuario,u.nombreAcceso,u.correoElectronico,u.estadoUsuario ${base} ${where} ORDER BY u.nombreUsuario OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total ${base} ${where}`)
  ]);
  return pageResult(data.recordset, total.recordset[0]?.total ?? 0, query);
}
export async function permissionIdsForProfile(id: number) {
  const pool = await getDatabasePool();
  await requireProfile(pool.request(), id);
  const request = pool.request().input("id", sql.Int, id); bindKnownPermissions(request);
  return (await request.query<{ idPermiso: number }>(`SELECT pp.idPermiso FROM Seguridad.tblPerfilesPermisos pp INNER JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso WHERE pp.idPerfil=@id AND pp.estadoPerfilPermiso=1 AND pe.codigoPermiso IN (${permissionPlaceholders})`)).recordset.map(row => row.idPermiso);
}

export async function listPermissions(query: PermissionQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request(); bindKnownPermissions(request); bindKnownPermissions(countRequest);
  const predicates = [`pe.codigoPermiso IN (${permissionPlaceholders})`];
  if (query.search) { predicates.push("(pe.codigoPermiso LIKE @search OR pe.nombrePermiso LIKE @search OR pe.descripcionPermiso LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); countRequest.input("search", sql.NVarChar(150), `%${query.search}%`); }
  if (query.modulo) { predicates.push("pe.moduloPermiso=@module"); request.input("module", sql.NVarChar(50), query.modulo); countRequest.input("module", sql.NVarChar(50), query.modulo); }
  if (query.idPerfil) { predicates.push("EXISTS(SELECT 1 FROM Seguridad.tblPerfilesPermisos x WHERE x.idPermiso=pe.idPermiso AND x.idPerfil=@profileId AND x.estadoPerfilPermiso=1)"); request.input("profileId", sql.Int, query.idPerfil); countRequest.input("profileId", sql.Int, query.idPerfil); }
  if (query.estado !== "all") { predicates.push("pe.estadoPermiso=@state"); request.input("state", sql.Bit, query.estado === "active"); countRequest.input("state", sql.Bit, query.estado === "active"); }
  const where = `WHERE ${predicates.join(" AND ")}`; request.input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const [data, total] = await Promise.all([
    request.query(`SELECT pe.idPermiso,pe.codigoPermiso,pe.nombrePermiso,pe.descripcionPermiso,pe.moduloPermiso,pe.estadoPermiso,
      CAST(1 AS bit) AS operativo,
      (SELECT COUNT(1) FROM Seguridad.tblPerfilesPermisos pp WHERE pp.idPermiso=pe.idPermiso AND pp.estadoPerfilPermiso=1) AS perfiles
      FROM Seguridad.tblPermisos pe ${where} ORDER BY pe.moduloPermiso,pe.nombrePermiso OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total FROM Seguridad.tblPermisos pe ${where}`)
  ]);
  return pageResult(data.recordset, total.recordset[0]?.total ?? 0, query);
}
export async function createPermission(data: { codigoPermiso: string; nombrePermiso: string; descripcionPermiso?: string | null; moduloPermiso: string }, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    if (!(permissionCatalogCodes as readonly string[]).includes(data.codigoPermiso)) throw new HttpError(400, "Este código requiere aprobación e incorporación al catálogo institucional");
    const inserted = await new sql.Request(transaction).input("code", sql.NVarChar(80), data.codigoPermiso).input("name", sql.NVarChar(150), data.nombrePermiso).input("description", sql.NVarChar(500), data.descripcionPermiso ?? null).input("module", sql.NVarChar(50), data.moduloPermiso).input("actor", sql.NVarChar(90), context.actorName)
      .query<{ idPermiso: number }>(`INSERT INTO Seguridad.tblPermisos(codigoPermiso,nombrePermiso,descripcionPermiso,moduloPermiso,usuarioRegistro) OUTPUT INSERTED.idPermiso VALUES(@code,@name,@description,@module,@actor)`);
    const id = inserted.recordset[0]?.idPermiso; if (!id) throw new HttpError(500, "No fue posible registrar el permiso");
    const after = { idPermiso: id, ...data, estadoPermiso: true };
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPermisos", id, "CREAR", null, after);
    await transaction.commit(); return after;
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function updatePermission(id: number, data: { codigoPermiso: string; nombrePermiso: string; descripcionPermiso?: string | null; moduloPermiso: string }, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const before = await new sql.Request(transaction).input("id", sql.Int, id).query(`SELECT * FROM Seguridad.tblPermisos WHERE idPermiso=@id`);
    if (!before.recordset[0]) throw new HttpError(404, "Permiso no encontrado");
    if (before.recordset[0].codigoPermiso !== data.codigoPermiso) throw new HttpError(400, "El código operativo del permiso no puede cambiarse");
    if (!(backendPermissionCodes as readonly string[]).includes(data.codigoPermiso)) throw new HttpError(400, "El permiso no corresponde a una operación implementada");
    await new sql.Request(transaction).input("id", sql.Int, id).input("name", sql.NVarChar(150), data.nombrePermiso).input("description", sql.NVarChar(500), data.descripcionPermiso ?? null).input("module", sql.NVarChar(50), data.moduloPermiso).input("actor", sql.NVarChar(90), context.actorName).query(`UPDATE Seguridad.tblPermisos SET nombrePermiso=@name,descripcionPermiso=@description,moduloPermiso=@module,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idPermiso=@id`);
    const after = { idPermiso: id, ...data, estadoPermiso: before.recordset[0].estadoPermiso };
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPermisos", id, "ACTUALIZAR", before.recordset[0], after);
    await transaction.commit(); return after;
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function setPermissionState(id: number, state: boolean, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const before = await new sql.Request(transaction).input("id", sql.Int, id).query(`SELECT * FROM Seguridad.tblPermisos WHERE idPermiso=@id`);
    if (!before.recordset[0] || !(backendPermissionCodes as readonly string[]).includes(String(before.recordset[0].codigoPermiso))) throw new HttpError(404, "Permiso operativo no encontrado");
    await new sql.Request(transaction).input("id", sql.Int, id).input("state", sql.Bit, state).input("actor", sql.NVarChar(90), context.actorName).query(`UPDATE Seguridad.tblPermisos SET estadoPermiso=@state,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idPermiso=@id`);
    if (!state && before.recordset[0].codigoPermiso === "USUARIOS_ADMINISTRAR") await assertAdministratorRemains(new sql.Request(transaction));
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPermisos", id, state ? "ACTIVAR" : "DESACTIVAR", before.recordset[0], { ...before.recordset[0], estadoPermiso: state });
    await transaction.commit(); return { ...before.recordset[0], estadoPermiso: state };
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function profilesForPermission(id: number) {
  const pool = await getDatabasePool();
  const request = pool.request().input("id", sql.Int, id); bindKnownPermissions(request);
  const permitted = await request.query(`SELECT idPermiso FROM Seguridad.tblPermisos WHERE idPermiso=@id AND codigoPermiso IN (${permissionPlaceholders})`);
  if (!permitted.recordset.length) throw new HttpError(404, "Permiso operativo no encontrado");
  return (await pool.request().input("id", sql.Int, id).query(`SELECT p.idPerfil,p.codigoPerfil,p.nombrePerfil,p.estadoPerfil FROM Seguridad.tblPerfilesPermisos pp INNER JOIN Seguridad.tblPerfiles p ON p.idPerfil=pp.idPerfil WHERE pp.idPermiso=@id AND pp.estadoPerfilPermiso=1 ORDER BY p.nombrePerfil`)).recordset;
}
async function validateAssignablePermissions(request: sql.Request, ids: number[], actorPermissions: string[]) {
  const allowedByActor = new Set(actorPermissions);
  if (ids.length && actorPermissions.length === 0) throw new HttpError(403, "No puede asignar permisos que no posee");
  const parameters = ids.map((id, index) => { request.input(`perm${index}`, sql.Int, id); return `@perm${index}`; });
  bindKnownPermissions(request);
  const rows = ids.length ? (await request.query<{ idPermiso: number; codigoPermiso: string }>(`SELECT idPermiso,codigoPermiso FROM Seguridad.tblPermisos WHERE idPermiso IN (${parameters.join(",")}) AND codigoPermiso IN (${permissionPlaceholders}) AND estadoPermiso=1`)).recordset : [];
  if (rows.length !== ids.length || rows.some(row => !allowedByActor.has(row.codigoPermiso))) throw new HttpError(403, "Solo puede asignar permisos operativos activos que usted posee");
}
export async function setProfilePermissions(id: number, ids: number[], actorPermissions: string[], context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const request = new sql.Request(transaction); const profile = await requireProfile(request, id);
    await validateAssignablePermissions(new sql.Request(transaction), ids, actorPermissions);
    const previous = await new sql.Request(transaction).input("id", sql.Int, id).query(`SELECT pe.idPermiso,pe.codigoPermiso FROM Seguridad.tblPerfilesPermisos pp INNER JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso WHERE pp.idPerfil=@id AND pp.estadoPerfilPermiso=1`);
    const deactivate = new sql.Request(transaction).input("id", sql.Int, id).input("actor", sql.NVarChar(90), context.actorName); bindKnownPermissions(deactivate);
    await deactivate.query(`UPDATE pp SET estadoPerfilPermiso=0,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() FROM Seguridad.tblPerfilesPermisos pp INNER JOIN Seguridad.tblPermisos pe ON pe.idPermiso=pp.idPermiso WHERE pp.idPerfil=@id AND pp.estadoPerfilPermiso=1 AND pe.codigoPermiso IN (${permissionPlaceholders})`);
    for (const permissionId of ids) await new sql.Request(transaction).input("profileId", sql.Int, id).input("permissionId", sql.Int, permissionId).input("actor", sql.NVarChar(90), context.actorName).query(`MERGE Seguridad.tblPerfilesPermisos AS target USING(SELECT @profileId idPerfil,@permissionId idPermiso) AS source ON target.idPerfil=source.idPerfil AND target.idPermiso=source.idPermiso WHEN MATCHED THEN UPDATE SET estadoPerfilPermiso=1,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHEN NOT MATCHED THEN INSERT(idPerfil,idPermiso,usuarioRegistro) VALUES(source.idPerfil,source.idPermiso,@actor);`);
    await assertAdministratorRemains(new sql.Request(transaction));
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPerfilesPermisos", id, "ASIGNAR", previous.recordset, ids);
    await transaction.commit(); return { idPerfil: id, idPermisos: ids };
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

export async function listNavigation(query: NavigationQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request();
  const where: string[] = [];
  if (query.search) { where.push("(n.codigoNavegacion LIKE @search OR n.nombreNavegacion LIKE @search OR n.tituloNavegacion LIKE @search OR n.enlaceNavegacion LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); countRequest.input("search", sql.NVarChar(150), `%${query.search}%`); }
  if (query.estado !== "all") { where.push("n.estadoNavegacion=@state"); request.input("state", sql.Bit, query.estado === "active"); countRequest.input("state", sql.Bit, query.estado === "active"); }
  if (query.idPerfil) { where.push("EXISTS(SELECT 1 FROM Seguridad.tblPerfilesNavegaciones pn WHERE pn.idNavegacion=n.idNavegacion AND pn.idPerfil=@profileId AND pn.estadoPerfilNavegacion=1 AND pn.permiteVisualizar=1)"); request.input("profileId", sql.Int, query.idPerfil); countRequest.input("profileId", sql.Int, query.idPerfil); }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : ""; request.input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const [data, total] = await Promise.all([
    request.query(`SELECT n.idNavegacion,n.codigoNavegacion,n.nombreNavegacion,n.tituloNavegacion,n.descripcionNavegacion,n.tipoNavegacion,n.enlaceNavegacion,n.claseNavegacion,n.ordenNavegacion,n.idNavegacionPadre,n.esVisible,n.estadoNavegacion,p.tituloNavegacion AS tituloPadre FROM Seguridad.tblNavegaciones n LEFT JOIN Seguridad.tblNavegaciones p ON p.idNavegacion=n.idNavegacionPadre ${clause} ORDER BY n.idNavegacionPadre,n.ordenNavegacion,n.idNavegacion OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total FROM Seguridad.tblNavegaciones n ${clause}`)
  ]);
  return pageResult(data.recordset, total.recordset[0]?.total ?? 0, query);
}
export async function navigationIdsForProfile(id: number) {
  const pool = await getDatabasePool();
  await requireProfile(pool.request(), id);
  return (await pool.request().input("id", sql.Int, id).query<{ idNavegacion: number }>(`SELECT idNavegacion FROM Seguridad.tblPerfilesNavegaciones WHERE idPerfil=@id AND estadoPerfilNavegacion=1 AND permiteVisualizar=1`)).recordset.map(row => row.idNavegacion);
}
async function validateNavigation(request: sql.Request, data: NavigationInput, id?: number) {
  if (data.enlaceNavegacion) {
    const frontendRoutes = new Set(["/inicio", "/campus", "/edificios", "/elevadores", "/dispositivos", "/beneficiarios", "/solicitudes", "/tarjetas", "/monitoreo", "/administracion/usuarios", "/administracion/perfiles", "/administracion/permisos", "/administracion/navegaciones", "/administracion/configuracion", "/administracion/auditoria"]);
    if (!frontendRoutes.has(data.enlaceNavegacion)) throw new HttpError(400, "La ruta no corresponde a una pantalla frontend registrada");
    const duplicate = await request.input("link", sql.NVarChar(256), data.enlaceNavegacion).input("currentId", sql.Int, id ?? 0).query(`SELECT TOP(1) idNavegacion FROM Seguridad.tblNavegaciones WHERE enlaceNavegacion=@link AND idNavegacion<>@currentId`);
    if (duplicate.recordset.length) throw new HttpError(409, "La ruta ya está asociada a otra opción de navegación");
  }
  if (data.idNavegacionPadre) {
    if (data.idNavegacionPadre === id) throw new HttpError(400, "Una opción no puede ser su propio padre");
    const parent = await request.input("parentId", sql.Int, data.idNavegacionPadre).query(`SELECT idNavegacion FROM Seguridad.tblNavegaciones WHERE idNavegacion=@parentId AND estadoNavegacion=1`);
    if (!parent.recordset.length) throw new HttpError(400, "La opción padre no existe o está inactiva");
  }
}

export async function createNavigation(data: NavigationInput, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); await validateNavigation(new sql.Request(transaction), data);
    const result = await new sql.Request(transaction).input("code", sql.NVarChar(64), data.codigoNavegacion).input("name", sql.NVarChar(128), data.nombreNavegacion).input("title", sql.NVarChar(128), data.tituloNavegacion).input("description", sql.NVarChar(512), data.descripcionNavegacion ?? null).input("type", sql.NVarChar(16), data.tipoNavegacion).input("link", sql.NVarChar(256), data.enlaceNavegacion ?? null).input("class", sql.NVarChar(64), data.claseNavegacion ?? null).input("order", sql.SmallInt, data.ordenNavegacion).input("parent", sql.Int, data.idNavegacionPadre ?? null).input("visible", sql.Bit, data.esVisible).input("actor", sql.NVarChar(90), context.actorName)
      .query<{ idNavegacion: number }>(`INSERT INTO Seguridad.tblNavegaciones(codigoNavegacion,nombreNavegacion,tituloNavegacion,descripcionNavegacion,tipoNavegacion,enlaceNavegacion,claseNavegacion,ordenNavegacion,idNavegacionPadre,esVisible,usuarioRegistro) OUTPUT INSERTED.idNavegacion VALUES(@code,@name,@title,@description,@type,@link,@class,@order,@parent,@visible,@actor)`);
    const id = result.recordset[0]?.idNavegacion; if (!id) throw new HttpError(500, "No fue posible crear la navegación");
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblNavegaciones", id, "CREAR", null, { idNavegacion: id, ...data, estadoNavegacion: true });
    await transaction.commit(); return { idNavegacion: id, ...data, estadoNavegacion: true };
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function updateNavigation(id: number, data: NavigationInput, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const before = await new sql.Request(transaction).input("id", sql.Int, id).query(`SELECT * FROM Seguridad.tblNavegaciones WHERE idNavegacion=@id`);
    if (!before.recordset[0]) throw new HttpError(404, "Opción de navegación no encontrada");
    await validateNavigation(new sql.Request(transaction), data, id);
    if (data.idNavegacionPadre) {
      const descendants = await new sql.Request(transaction).input("id", sql.Int, id).input("parent", sql.Int, data.idNavegacionPadre).query(`WITH descendants AS (SELECT idNavegacion FROM Seguridad.tblNavegaciones WHERE idNavegacion=@id UNION ALL SELECT n.idNavegacion FROM Seguridad.tblNavegaciones n INNER JOIN descendants d ON n.idNavegacionPadre=d.idNavegacion) SELECT TOP(1) idNavegacion FROM descendants WHERE idNavegacion=@parent OPTION(MAXRECURSION 100)`);
      if (descendants.recordset.length) throw new HttpError(400, "La opción padre generaría un ciclo");
    }
    await new sql.Request(transaction).input("id", sql.Int, id).input("code", sql.NVarChar(64), data.codigoNavegacion).input("name", sql.NVarChar(128), data.nombreNavegacion).input("title", sql.NVarChar(128), data.tituloNavegacion).input("description", sql.NVarChar(512), data.descripcionNavegacion ?? null).input("type", sql.NVarChar(16), data.tipoNavegacion).input("link", sql.NVarChar(256), data.enlaceNavegacion ?? null).input("class", sql.NVarChar(64), data.claseNavegacion ?? null).input("order", sql.SmallInt, data.ordenNavegacion).input("parent", sql.Int, data.idNavegacionPadre ?? null).input("visible", sql.Bit, data.esVisible).input("actor", sql.NVarChar(90), context.actorName).query(`UPDATE Seguridad.tblNavegaciones SET codigoNavegacion=@code,nombreNavegacion=@name,tituloNavegacion=@title,descripcionNavegacion=@description,tipoNavegacion=@type,enlaceNavegacion=@link,claseNavegacion=@class,ordenNavegacion=@order,idNavegacionPadre=@parent,esVisible=@visible,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idNavegacion=@id`);
    const after = { idNavegacion: id, ...data, estadoNavegacion: before.recordset[0].estadoNavegacion };
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblNavegaciones", id, "ACTUALIZAR", before.recordset[0], after);
    await transaction.commit(); return after;
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function setNavigationState(id: number, state: boolean, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const before = await new sql.Request(transaction).input("id", sql.Int, id).query(`SELECT * FROM Seguridad.tblNavegaciones WHERE idNavegacion=@id`);
    if (!before.recordset[0]) throw new HttpError(404, "Opción de navegación no encontrada");
    await new sql.Request(transaction).input("id", sql.Int, id).input("state", sql.Bit, state).input("actor", sql.NVarChar(90), context.actorName).query(`UPDATE Seguridad.tblNavegaciones SET estadoNavegacion=@state,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idNavegacion=@id`);
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblNavegaciones", id, state ? "ACTIVAR" : "DESACTIVAR", before.recordset[0], { ...before.recordset[0], estadoNavegacion: state });
    await transaction.commit(); return { ...before.recordset[0], estadoNavegacion: state };
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}
export async function setProfileNavigation(id: number, ids: number[], context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); await requireProfile(new sql.Request(transaction), id);
    const placeholders = ids.map((_, i) => `@nav${i}`); const check = new sql.Request(transaction);
    ids.forEach((navId, i) => check.input(`nav${i}`, sql.Int, navId));
    const found = ids.length ? await check.query(`SELECT idNavegacion FROM Seguridad.tblNavegaciones WHERE estadoNavegacion=1 AND idNavegacion IN (${placeholders.join(",")})`) : { recordset: [] };
    if (found.recordset.length !== ids.length) throw new HttpError(400, "Una o más opciones no existen o están inactivas");
    if (ids.length) {
      const ancestorsRequest = new sql.Request(transaction);
      ids.forEach((navId, index) => ancestorsRequest.input(`selected${index}`, sql.Int, navId));
      const ancestors = await ancestorsRequest.query<{ idNavegacion: number; estadoNavegacion: boolean }>(`WITH selected(idNavegacion) AS (SELECT idNavegacion FROM Seguridad.tblNavegaciones WHERE idNavegacion IN (${ids.map((_, i) => `@selected${i}`).join(",")})), ancestors AS (SELECT n.idNavegacion,n.idNavegacionPadre,n.estadoNavegacion FROM Seguridad.tblNavegaciones n INNER JOIN selected s ON s.idNavegacion=n.idNavegacion UNION ALL SELECT parent.idNavegacion,parent.idNavegacionPadre,parent.estadoNavegacion FROM Seguridad.tblNavegaciones parent INNER JOIN ancestors child ON parent.idNavegacion=child.idNavegacionPadre) SELECT DISTINCT idNavegacion,estadoNavegacion FROM ancestors OPTION(MAXRECURSION 100)`);
      const selectedIds = new Set(ids);
      if (ancestors.recordset.some(row => !row.estadoNavegacion || !selectedIds.has(row.idNavegacion))) throw new HttpError(400, "Asigne también los padres activos de cada opción para conservar la jerarquía");
    }
    const before = await new sql.Request(transaction).input("id", sql.Int, id).query(`SELECT idNavegacion FROM Seguridad.tblPerfilesNavegaciones WHERE idPerfil=@id AND estadoPerfilNavegacion=1 AND permiteVisualizar=1`);
    await new sql.Request(transaction).input("id", sql.Int, id).input("actor", sql.NVarChar(90), context.actorName).query(`UPDATE Seguridad.tblPerfilesNavegaciones SET estadoPerfilNavegacion=0,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idPerfil=@id`);
    for (const navId of ids) await new sql.Request(transaction).input("profileId", sql.Int, id).input("navId", sql.Int, navId).input("actor", sql.NVarChar(90), context.actorName).query(`MERGE Seguridad.tblPerfilesNavegaciones AS target USING(SELECT @profileId idPerfil,@navId idNavegacion) AS source ON target.idPerfil=source.idPerfil AND target.idNavegacion=source.idNavegacion WHEN MATCHED THEN UPDATE SET permiteVisualizar=1,estadoPerfilNavegacion=1,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHEN NOT MATCHED THEN INSERT(idPerfil,idNavegacion,permiteVisualizar,usuarioRegistro) VALUES(source.idPerfil,source.idNavegacion,1,@actor);`);
    await audit(new sql.Request(transaction), context, "SEGURIDAD", "tblPerfilesNavegaciones", id, "ASIGNAR", before.recordset, ids);
    await transaction.commit(); return { idPerfil: id, idNavegaciones: ids };
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

const sensitivePattern = /(password|passwd|secret|token|cookie|hash|clave|contrase|connection|string.?conexion|credential)/i;
export async function listParameters() {
  const pool = await getDatabasePool();
  return (await pool.request().query(`SELECT idParametro,codigoParametro,nombreParametro,descripcionParametro,tipoDato,valorPredeterminado,permiteModificacion,estadoParametro FROM Configuracion.tblParametros WHERE estadoParametro=1 AND codigoParametro NOT LIKE N'%PASSWORD%' AND codigoParametro NOT LIKE N'%SECRET%' AND codigoParametro NOT LIKE N'%TOKEN%' AND codigoParametro NOT LIKE N'%COOKIE%' AND codigoParametro NOT LIKE N'%HASH%' AND codigoParametro NOT LIKE N'%CLAVE%' AND codigoParametro NOT LIKE N'%CONEXION%' AND nombreParametro NOT LIKE N'%contrase%' AND nombreParametro NOT LIKE N'%secreto%' AND nombreParametro NOT LIKE N'%token%' ORDER BY codigoParametro`)).recordset.filter(row => !sensitivePattern.test(`${row.codigoParametro} ${row.nombreParametro} ${row.descripcionParametro ?? ""}`));
}
function validParameterValue(type: string, value: string) {
  switch (type.trim().toUpperCase()) {
    case "BOOLEAN": case "BOOL": case "BIT": case "BOOLEANO": case "LOGICO": return ["true", "false", "0", "1"].includes(value.toLowerCase());
    case "INT": case "INTEGER": case "SMALLINT": case "BIGINT": case "ENTERO": return /^-?\d+$/.test(value);
    case "DECIMAL": case "NUMERIC": case "FLOAT": case "NUMBER": case "NUMERICO": case "DECIMAL(18,4)": return /^-?\d+(\.\d+)?$/.test(value);
    case "DATE": case "FECHA": return !Number.isNaN(Date.parse(value)) && /^\d{4}-\d{2}-\d{2}$/.test(value);
    case "DATETIME": case "DATETIME2": case "FECHA_HORA": return !Number.isNaN(Date.parse(value));
    case "EMAIL": return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    case "STRING": case "TEXT": case "NVARCHAR": case "VARCHAR": case "CADENA": return true;
    default: return /^(N?VARCHAR|N?CHAR)\(\d+\)$/.test(type.trim().toUpperCase());
  }
}
export async function updateParameter(id: number, value: string, context: AuditContext) {
  const pool = await getDatabasePool(); const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin(); const request = new sql.Request(transaction).input("id", sql.Int, id);
    const result = await request.query(`SELECT idParametro,codigoParametro,nombreParametro,descripcionParametro,tipoDato,valorPredeterminado,permiteModificacion FROM Configuracion.tblParametros WHERE idParametro=@id AND estadoParametro=1`);
    const before = result.recordset[0];
    if (!before) throw new HttpError(404, "Parámetro no encontrado");
    if (!before.permiteModificacion || sensitivePattern.test(`${before.codigoParametro} ${before.nombreParametro} ${before.descripcionParametro ?? ""}`)) throw new HttpError(403, "El parámetro no está habilitado para modificación");
    if (!validParameterValue(String(before.tipoDato), value)) throw new HttpError(400, "El valor no coincide con el tipo de dato configurado");
    await new sql.Request(transaction).input("id", sql.Int, id).input("value", sql.NVarChar(1000), value).input("actor", sql.NVarChar(90), context.actorName).query(`UPDATE Configuracion.tblParametros SET valorPredeterminado=@value,usuarioActualizacion=@actor,fechaActualizacion=SYSDATETIME() WHERE idParametro=@id AND permiteModificacion=1`);
    await audit(new sql.Request(transaction), context, "CONFIGURACION", "tblParametros", id, "ACTUALIZAR", { valorPredeterminado: before.valorPredeterminado }, { valorPredeterminado: value });
    await transaction.commit(); return { ...before, valorPredeterminado: value };
  } catch (error) { await transaction.rollback().catch(() => undefined); return mapSqlError(error); }
}

const auditSource = `(
  SELECT b.idBitacora AS idEvento,CONVERT(nvarchar(20),N'BITACORA') AS fuente,b.fechaRegistro AS fecha,
    b.idUsuario,COALESCE(u.nombreAcceso,b.usuarioRegistro) AS usuario,b.modulo AS modulo,b.accion AS evento,
    CONVERT(nvarchar(20),NULL) AS resultado,b.entidad AS entidad,b.identificadorRegistro AS identificador,
    b.datosAnteriores AS anteriores,b.datosNuevos AS nuevos,b.direccionIp AS ip,b.correlacionSolicitud AS correlacion
  FROM Auditoria.tblBitacoras b LEFT JOIN Seguridad.tblUsuarios u ON u.idUsuario=b.idUsuario
  UNION ALL
  SELECT a.idIntentoAutenticacion,CONVERT(nvarchar(20),N'AUTENTICACION'),a.fechaIntento,a.idUsuario,
    COALESCE(u.nombreAcceso,a.nombreAcceso,N'No identificado'),CONVERT(nvarchar(80),N'AUTENTICACION'),
    COALESCE(a.motivoFallo,N'AUTENTICACION'),CASE WHEN a.fueExitoso=1 THEN N'correcto' ELSE N'fallido' END,
    CONVERT(nvarchar(150),N'tblIntentosAutenticacion'),CONVERT(nvarchar(100),a.idIntentoAutenticacion),NULL,
    CASE WHEN a.fueExitoso=1 THEN N'{"autenticacion":"exitosa"}' ELSE N'{"motivo":"fallo de autenticación"}' END,
    a.direccionIp,NULL
  FROM Auditoria.tblIntentosAutenticacion a LEFT JOIN Seguridad.tblUsuarios u ON u.idUsuario=a.idUsuario
) ev`;
function auditPredicates(request: sql.Request, query: AuditQuery) {
  const clauses: string[] = [];
  if (query.search) { clauses.push("(ev.usuario LIKE @search OR ev.modulo LIKE @search OR ev.evento LIKE @search OR ev.entidad LIKE @search)"); request.input("search", sql.NVarChar(150), `%${query.search}%`); }
  if (query.desde) { clauses.push("ev.fecha>=@fromDate"); request.input("fromDate", sql.Date, query.desde); }
  if (query.hasta) { clauses.push("ev.fecha<DATEADD(day,1,@toDate)"); request.input("toDate", sql.Date, query.hasta); }
  if (query.idUsuario) { clauses.push("ev.idUsuario=@userId"); request.input("userId", sql.BigInt, query.idUsuario); }
  if (query.evento) { clauses.push("ev.evento LIKE @event"); request.input("event", sql.NVarChar(80), `%${query.evento}%`); }
  if (query.resultado !== "all") { clauses.push("ev.resultado=@result"); request.input("result", sql.NVarChar(20), query.resultado); }
  return clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
}
export async function listAudit(query: AuditQuery) {
  const pool = await getDatabasePool(); const request = pool.request(); const countRequest = pool.request(); const where = auditPredicates(request, query); auditPredicates(countRequest, query);
  request.input("offset", sql.Int, (query.page - 1) * query.pageSize).input("pageSize", sql.Int, query.pageSize);
  const [data, total] = await Promise.all([
    request.query(`SELECT idEvento,fuente,fecha,idUsuario,usuario,modulo,evento,resultado,entidad,identificador,ip,correlacion FROM ${auditSource} ${where} ORDER BY fecha DESC,idEvento DESC OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY`),
    countRequest.query<{ total: number }>(`SELECT COUNT(1) AS total FROM ${auditSource} ${where}`)
  ]);
  return pageResult(data.recordset, total.recordset[0]?.total ?? 0, query);
}
function parseSafeJson(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try { return redact(JSON.parse(value)); } catch { return value.replace(/(?:password|hash|token|cookie|secret|clave)\s*[:=]\s*[^,}\s]+/gi, "[REDACTADO]"); }
}
function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, sensitivePattern.test(key) ? "[REDACTADO]" : redact(entry)]));
  return value;
}
export async function auditDetail(source: string, id: number) {
  const pool = await getDatabasePool();
  if (source === "BITACORA") {
    const result = await pool.request().input("id", sql.BigInt, id).query(`SELECT b.idBitacora,b.fechaRegistro,b.idUsuario,COALESCE(u.nombreAcceso,b.usuarioRegistro) AS usuario,b.modulo,b.entidad,b.identificadorRegistro,b.accion,b.datosAnteriores,b.datosNuevos,b.direccionIp,b.correlacionSolicitud FROM Auditoria.tblBitacoras b LEFT JOIN Seguridad.tblUsuarios u ON u.idUsuario=b.idUsuario WHERE b.idBitacora=@id`);
    const row = result.recordset[0]; if (!row) throw new HttpError(404, "Evento no encontrado");
    return { ...row, datosAnteriores: parseSafeJson(row.datosAnteriores), datosNuevos: parseSafeJson(row.datosNuevos) };
  }
  if (source === "AUTENTICACION") {
    const result = await pool.request().input("id", sql.BigInt, id).query(`SELECT a.idIntentoAutenticacion,a.fechaIntento,a.idUsuario,COALESCE(u.nombreAcceso,a.nombreAcceso,N'No identificado') AS usuario,a.fueExitoso,a.motivoFallo,a.direccionIp,a.agenteUsuario FROM Auditoria.tblIntentosAutenticacion a LEFT JOIN Seguridad.tblUsuarios u ON u.idUsuario=a.idUsuario WHERE a.idIntentoAutenticacion=@id`);
    if (!result.recordset[0]) throw new HttpError(404, "Evento no encontrado");
    return result.recordset[0];
  }
  throw new HttpError(400, "Fuente de auditoría no válida");
}
